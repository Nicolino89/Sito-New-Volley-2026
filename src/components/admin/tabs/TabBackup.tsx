import React, { useState, useRef } from 'react';
import { 
  Download, 
  Upload, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw, 
  Clock, 
  FileText, 
  HardDrive, 
  Server, 
  Info,
  Lock,
  Calendar,
  Layers
} from 'lucide-react';
import { db } from '../../../firebase-societa';
import { 
  collection, 
  getDocs, 
  writeBatch, 
  doc 
} from 'firebase/firestore';

interface TabBackupProps {
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  loadAllData?: () => Promise<void>;
}

// Lista di tutte le collezioni del portale NVA
const NVA_COLLECTIONS = [
  { id: 'rose_squadre', label: 'Squadre & Rose', icon: Layers },
  { id: 'giocatori', label: 'Anagrafica Atleti', icon: FileText },
  { id: 'societa_info', label: 'Dati Societari & Palestre', icon: Server },
  { id: 'societa_config', label: 'Configurazioni Globali', icon: HardDrive },
  { id: 'staff_profili', label: 'Staff Tecnico & Dirigenti', icon: FileText },
  { id: 'sponsors', label: 'Sponsor & Partner Commerciali', icon: FileText },
  { id: 'news_blog', label: 'News & Articoli Blog', icon: FileText },
  { id: 'eventi_camp_tornei', label: 'Eventi, Tornei & Summer Camp', icon: Calendar },
  { id: 'galleria_foto', label: 'Galleria Fotografica', icon: FileText },
  { id: 'hall_of_fame', label: 'Albo d\'Oro (Hall of Fame)', icon: FileText },
  { id: 'ospiti_illustri', label: 'Ospiti Illustri & Campioni', icon: FileText },
  { id: 'storico_squadre', label: 'Archivio Storico Annate', icon: Layers },
  { id: 'admin_users', label: 'Account Amministratori', icon: Lock }
];

export const TabBackup: React.FC<TabBackupProps> = ({
  showToast = (_msg: string, _type?: 'success' | 'error' | 'info') => console.log(_msg),
  loadAllData = async () => {}
}) => {
  // Stati esportazione
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportStats, setExportStats] = useState<Record<string, number> | null>(null);

  // Stati importazione / ripristino
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<any | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreProgress, setRestoreProgress] = useState<{ current: number; total: number; collectionName: string } | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. ESPORTAZIONE BACKUP COMPLETO IN JSON
  const handleExportBackup = async () => {
    if (!db) {
      showToast('Database Firestore non inizializzato o client offline.', 'error');
      return;
    }

    setIsExporting(true);
    setExportStats(null);

    try {
      const backupPayload: {
        meta: {
          app: string;
          version: string;
          data_esportazione: string;
          timestamp: number;
        };
        collections: Record<string, any[]>;
        summary: Record<string, number>;
      } = {
        meta: {
          app: 'New Volley Academy',
          version: '1.0',
          data_esportazione: new Date().toISOString(),
          timestamp: Date.now()
        },
        collections: {},
        summary: {}
      };

      const counts: Record<string, number> = {};

      for (const col of NVA_COLLECTIONS) {
        try {
          const colRef = collection(db, col.id);
          const snap = await getDocs(colRef);
          const docsData: any[] = [];
          
          snap.forEach((docSnap) => {
            docsData.push({
              _id: docSnap.id,
              ...docSnap.data()
            });
          });

          backupPayload.collections[col.id] = docsData;
          counts[col.id] = docsData.length;
        } catch (colErr) {
          console.warn(`Errore durante esportazione collezione ${col.id}:`, colErr);
          backupPayload.collections[col.id] = [];
          counts[col.id] = 0;
        }
      }

      backupPayload.summary = counts;
      setExportStats(counts);

      // Crea e avvia il download del file JSON
      const jsonString = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
      a.href = url;
      a.download = `NVA_Backup_Completo_${dateStr}_${timeStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const totalItems = Object.values(counts).reduce((a, b) => a + b, 0);
      showToast(`Backup generato con successo! Scaricati ${totalItems} elementi totali.`, 'success');
    } catch (err: any) {
      console.error('Errore durante la generazione del backup:', err);
      showToast('Errore durante l\'esportazione del database: ' + (err?.message || err), 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // 2. CARICAMENTO E VALIDAZIONE FILE BACKUP JSON
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setParseError(null);
    setFileData(null);
    setRestoreSuccess(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Validazione minima struttura
        if (!parsed.collections || typeof parsed.collections !== 'object') {
          throw new Error('Il file JSON non contiene un oggetto "collections" valido.');
        }

        setFileData(parsed);
      } catch (err: any) {
        setParseError(err?.message || 'File JSON non valido o corrotto.');
      }
    };
    reader.onerror = () => {
      setParseError('Impossibile leggere il file selezionato dal disco.');
    };
    reader.readAsText(file);
  };

  // 3. ESECUZIONE RIPRISTINO DA FILE
  const handleExecuteRestore = async () => {
    if (!fileData || !fileData.collections) {
      showToast('Nessun dato valido da ripristinare.', 'error');
      return;
    }

    const collectionsToRestore = Object.keys(fileData.collections);
    let totalDocsToRestore = 0;
    collectionsToRestore.forEach(colKey => {
      if (Array.isArray(fileData.collections[colKey])) {
        totalDocsToRestore += fileData.collections[colKey].length;
      }
    });

    const isConfirmed = window.confirm(
      `ATTENZIONE: Stai per avviare il ripristino di ${totalDocsToRestore} documenti su Firestore.\n\n` +
      `Questa operazione sovrascriverà i dati esistenti con quelli presenti nel file di backup.\n\n` +
      `Sei sicuro al 100% di voler continuare?`
    );

    if (!isConfirmed) return;

    setIsRestoring(true);
    setRestoreSuccess(false);
    let processedDocs = 0;

    try {
      for (const colKey of collectionsToRestore) {
        const docsList = fileData.collections[colKey];
        if (!Array.isArray(docsList) || docsList.length === 0) continue;

        setRestoreProgress({
          current: processedDocs,
          total: totalDocsToRestore,
          collectionName: colKey
        });

        // Esegui scritture in batch da massimo 400 per rispettare i limiti Firestore (500)
        const CHUNK_SIZE = 400;
        for (let i = 0; i < docsList.length; i += CHUNK_SIZE) {
          const chunk = docsList.slice(i, i + CHUNK_SIZE);
          const batch = writeBatch(db);

          for (const item of chunk) {
            const docId = item._id || item.id;
            if (!docId) continue;

            const docData = { ...item };
            delete docData._id; // Rimuovi l'id speciale se presente

            const docRef = doc(db, colKey, String(docId));
            batch.set(docRef, docData, { merge: true });
          }

          await batch.commit();
          processedDocs += chunk.length;
          setRestoreProgress({
            current: processedDocs,
            total: totalDocsToRestore,
            collectionName: colKey
          });
        }
      }

      setRestoreSuccess(true);
      showToast('Database ripristinato con successo dal backup!', 'success');
      await loadAllData();
    } catch (err: any) {
      console.error('Errore durante il ripristino da backup:', err);
      showToast('Errore durante il ripristino: ' + (err?.message || err), 'error');
    } finally {
      setIsRestoring(false);
      setRestoreProgress(null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* HEADER DELLA TAB */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black italic uppercase font-sport tracking-wide text-slate-900">
                Backup & Sicurezza Dati
              </h1>
              <p className="text-xs md:text-sm text-slate-500 font-medium">
                Gestione salvataggi automatici Google Cloud e archivio manuale scaricabile.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Protezione Dati Attiva
          </span>
        </div>
      </div>

      {/* SEZIONE 1: BACKUP AUTOMATICO NOTTURNO GOOGLE CLOUD */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 md:p-8 border border-slate-700 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Server className="w-64 h-64 text-amber-400" />
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold uppercase tracking-wide flex items-center gap-2">
                  Backup Automatico Giornaliero Google Cloud
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full">
                    Attivo
                  </span>
                </h2>
                <p className="text-xs text-slate-300">
                  Snapshot completo di tutte le collezioni salvato ogni notte nei datacenter Google.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-slate-300 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 w-fit">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Frequenza: <strong>Ogni 24h (Notte)</strong></span>
              </div>
              <span className="text-slate-600">•</span>
              <div className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-sky-400" />
                <span>Conservazione: <strong>7 Giorni</strong></span>
              </div>
            </div>
          </div>

          {/* GUIDA AL RIPRISTINO AUTOMATICO */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4" /> Come si ripristina il salvataggio automatico Google in caso di disastro?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              I backup automatici di Google Cloud sono memorizzati come snapshot fisici a livello server. In caso di cancellazioni accidentali o guasti irreversibili, il ripristino può essere eseguito in 2 modalità:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 space-y-2">
                <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  1. Dalla Google Cloud Console (Consigliato)
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Accedi a <strong>console.cloud.google.com</strong> con l'account proprietario di Firebase, vai su <strong>Firestore &gt; Backup</strong>, seleziona il punto di ripristino desiderato (es. ieri notte) e clicca su <strong>"Ripristina database"</strong>.
                </p>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 space-y-2">
                <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  2. Tramite comando Google Cloud CLI
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                  gcloud firestore databases restore \<br/>
                  --source-backup=projects/new-volley-academy/locations/eur3/backups/[ID_BACKUP]
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEZIONE 2: SALVATAGGIO MANUALE & DOWNLOAD DATABASE (1-CLICK EXPORT) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SCHEDA DOWNLOAD COMPLETO */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase font-sport tracking-wide text-slate-900">
                  Esporta & Scarica Database Completo
                </h2>
                <p className="text-xs text-slate-500">
                  Genera all'istante un file <code>.json</code> contenente tutti i dati societari aggiornati.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              Questo strumento scarica direttamente sul tuo computer un archivio strutturato con tutte le <strong>13 collezioni</strong> del portale: squadre, atleti, dirigenti, news, foto, sponsor, palestre e albo d'oro. Puoi conservare questo file come copia di sicurezza personale prima di modifiche importanti.
            </p>

            {exportStats && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs uppercase">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Ultima esportazione completata con successo:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono pt-1">
                  {Object.entries(exportStats).map(([key, count]) => (
                    <div key={key} className="bg-white/80 px-2 py-1 rounded border border-emerald-100 truncate">
                      <span className="text-slate-500">{key}:</span> <strong>{count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
              onClick={handleExportBackup}
              disabled={isExporting}
              className={`w-full py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider font-sport italic skew-x-[-4deg] flex items-center justify-center gap-3 transition-all cursor-pointer ${
                isExporting
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-lg hover:shadow-xl hover:scale-[1.01]'
              }`}
            >
              <Download className={`w-5 h-5 not-italic ${isExporting ? 'animate-bounce' : ''}`} />
              <span className="not-italic">
                {isExporting ? 'ESPORTAZIONE IN CORSO...' : 'SCARICA BACKUP DATABASE (.JSON)'}
              </span>
            </button>
          </div>
        </div>

        {/* SCHEDA RIPRISTINO DA FILE (RESTORE) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase font-sport tracking-wide text-slate-900">
                  Ripristina Database da File
                </h2>
                <p className="text-xs text-slate-500">
                  Carica un file JSON precedentemente scaricato per ripristinare i dati.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3 text-amber-900 text-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Attenzione:</strong> Il ripristino sovrascriverà i documenti corrispondenti su Firestore. Utilizza solo file JSON generati dal portale New Volley Academy.
                </p>
              </div>

              {/* Area selezione file */}
              <div className="border-2 border-dashed border-slate-300 hover:border-amber-400 rounded-2xl p-5 text-center transition-all bg-slate-50/50">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                  id="backup-file-upload"
                />
                <label
                  htmlFor="backup-file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <Upload className="w-8 h-8 text-slate-400 hover:text-amber-500 transition-colors" />
                  <span className="text-xs font-bold text-slate-700">
                    {selectedFile ? selectedFile.name : 'Clicca per selezionare il file di backup JSON'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Formato supportato: .json'}
                  </span>
                </label>
              </div>

              {parseError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl">
                  <strong>Errore file:</strong> {parseError}
                </div>
              )}

              {fileData && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-700 font-bold border-b border-slate-200 pb-1.5">
                    <span>File di backup validato:</span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {fileData.meta?.data_esportazione ? new Date(fileData.meta.data_esportazione).toLocaleString('it-IT') : 'N/D'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 font-mono">
                    {Object.keys(fileData.collections || {}).map((cKey) => {
                      const count = Array.isArray(fileData.collections[cKey]) ? fileData.collections[cKey].length : 0;
                      return (
                        <div key={cKey} className="truncate">
                          • {cKey}: <strong>{count}</strong>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {restoreSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Operazione completata!</strong> I dati sono stati ripristinati correttamente.</span>
                </div>
              )}

              {restoreProgress && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-slate-600">
                    <span>Ripristino collezione: <strong>{restoreProgress.collectionName}</strong></span>
                    <span>{restoreProgress.current} / {restoreProgress.total}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full transition-all duration-300"
                      style={{ width: `${Math.round((restoreProgress.current / restoreProgress.total) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleExecuteRestore}
              disabled={!fileData || isRestoring}
              className={`w-full py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider font-sport italic skew-x-[-4deg] flex items-center justify-center gap-3 transition-all cursor-pointer ${
                !fileData || isRestoring
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.01]'
              }`}
            >
              <RefreshCw className={`w-5 h-5 not-italic ${isRestoring ? 'animate-spin' : ''}`} />
              <span className="not-italic">
                {isRestoring ? 'RIPRISTINO IN CORSO...' : 'RIPRISTINA DATI DA QUESTO BACKUP'}
              </span>
            </button>
          </div>
        </div>

      </div>

      {/* RIEPILOGO STRUTTURA DEL DATABASE NVA */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-500" />
          Mappa Collezioni Protette da Backup ({NVA_COLLECTIONS.length} Moduli)
        </h3>
        <p className="text-xs text-slate-500">
          Sia il salvataggio automatico notturno che il file JSON esportato includono integralmente tutte le seguenti entità:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
          {NVA_COLLECTIONS.map((c) => {
            const Icon = c.icon;
            return (
              <div 
                key={c.id} 
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/50 flex items-center justify-center text-amber-600 shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 block truncate">{c.label}</span>
                  <span className="text-[10px] font-mono text-slate-400 block truncate">{c.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TabBackup;
