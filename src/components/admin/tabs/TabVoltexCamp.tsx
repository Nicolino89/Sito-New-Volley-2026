import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Calendar, 
  MapPin, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MessageCircle, 
  Download, 
  Loader2, 
  RefreshCw,
  Eye,
  Sliders,
  Camera,
  Upload,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  HelpCircle,
  Phone,
  Mail,
  MessageSquare
} from 'lucide-react';
import { 
  getVoltexCampConfig, 
  updateVoltexCampConfig, 
  VoltexCampConfig, 
  VoltexCampDate, 
  VoltexIscrizione,
  VoltexRichiestaInfo,
  DEFAULT_VOLTEX_CAMP_CONFIG,
  caricaBlobSuStorage
} from '../../../firebase-societa';
import { compressImage, IMAGE_PRESETS } from '../../../utils/imageCompressor';

interface TabVoltexCampProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function TabVoltexCamp({ showToast }: TabVoltexCampProps) {
  const [config, setConfig] = useState<VoltexCampConfig>(DEFAULT_VOLTEX_CAMP_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingGalleria, setUploadingGalleria] = useState(false);
  const [subTab, setSubTab] = useState<'date' | 'iscrizioni' | 'richieste' | 'testi' | 'foto'>('date');
  const [filtroStatoRichieste, setFiltroStatoRichieste] = useState<'tutti' | 'nuova' | 'gestita' | 'archiviata'>('tutti');

  // Stato per nuova/modifica tappa
  const [editingTappa, setEditingTappa] = useState<VoltexCampDate | null>(null);
  const [isNewTappa, setIsNewTappa] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getVoltexCampConfig();
      setConfig(data);
    } catch {
      showToast("Errore nel caricamento configurazione Voltex", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (newConfig: VoltexCampConfig) => {
    setSaving(true);
    try {
      await updateVoltexCampConfig(newConfig);
      setConfig(newConfig);
      showToast("Configurazione Voltex salvata con successo", "success");
    } catch {
      showToast("Errore durante il salvataggio", "error");
    } finally {
      setSaving(false);
    }
  };

  // Gestione Tappe
  const handleSaveTappa = (tappaToSave: VoltexCampDate) => {
    let updatedDate: VoltexCampDate[];
    if (isNewTappa) {
      updatedDate = [...(config.date_camp || []), tappaToSave];
    } else {
      updatedDate = (config.date_camp || []).map(d => d.id === tappaToSave.id ? tappaToSave : d);
    }
    const newConfig = { ...config, date_camp: updatedDate };
    handleSaveConfig(newConfig);
    setEditingTappa(null);
    setIsNewTappa(false);
  };

  const handleDeleteTappa = (tappaId: string) => {
    if (!window.confirm("Sei sicuro di voler eliminare questa tappa?")) return;
    const updatedDate = (config.date_camp || []).filter(d => d.id !== tappaId);
    handleSaveConfig({ ...config, date_camp: updatedDate });
  };

  // Gestione Iscrizioni
  const handleUpdateStatoIscrizione = (iscrizioneId: string, nuovoStato: VoltexIscrizione['stato']) => {
    const updated = (config.iscrizioni_ricevute || []).map(isc => 
      isc.id === iscrizioneId ? { ...isc, stato: nuovoStato } : isc
    );
    handleSaveConfig({ ...config, iscrizioni_ricevute: updated });
  };

  const handleDeleteIscrizione = (iscrizioneId: string) => {
    if (!window.confirm("Eliminare questa richiesta di iscrizione?")) return;
    const updated = (config.iscrizioni_ricevute || []).filter(isc => isc.id !== iscrizioneId);
    handleSaveConfig({ ...config, iscrizioni_ricevute: updated });
  };

  const exportIscrizioniCSV = () => {
    const iscrizioni = config.iscrizioni_ricevute || [];
    if (iscrizioni.length === 0) {
      showToast("Nessuna iscrizione da esportare", "info");
      return;
    }

    const headers = ["Data", "Atleta", "Data Nascita", "Ruolo", "Tappa", "Genitore", "Telefono", "Email", "Taglia Kit", "Stato", "Note"];
    const rows = iscrizioni.map(i => [
      new Date(i.data_richiesta).toLocaleDateString('it-IT'),
      `"${i.nome_atleta} ${i.cognome_atleta}"`,
      i.data_nascita || "",
      `"${i.ruolo} (${i.livello_squadra || ''})"`,
      `"${i.tappa_nome}"`,
      `"${i.nome_genitore || ''}"`,
      `"${i.telefono}"`,
      `"${i.email}"`,
      i.taglia_kit || "",
      i.stato,
      `"${(i.note || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `iscrizioni_voltex_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Toggle Apertura Iscrizioni Pubbliche
  const handleToggleIscrizioniAperte = async (aperta: boolean) => {
    const newConfig = { ...config, iscrizioni_aperte: aperta };
    await handleSaveConfig(newConfig);
    showToast(
      aperta 
        ? "Iscrizioni Voltex APERTE al pubblico!" 
        : "Iscrizioni chiuse. Ora la pagina mostra il modulo per richiedere info.",
      "info"
    );
  };

  // Gestione Richieste Info & Domande
  const handleUpdateStatoRichiesta = (richiestaId: string, nuovoStato: VoltexRichiestaInfo['stato']) => {
    const updated = (config.richieste_info || []).map(r => 
      r.id === richiestaId ? { ...r, stato: nuovoStato } : r
    );
    handleSaveConfig({ ...config, richieste_info: updated });
  };

  const handleUpdateNoteRichiesta = (richiestaId: string, note_interne: string) => {
    const updated = (config.richieste_info || []).map(r => 
      r.id === richiestaId ? { ...r, note_interne } : r
    );
    setConfig({ ...config, richieste_info: updated });
  };

  const handleSalvaNoteRichieste = () => {
    handleSaveConfig(config);
  };

  const handleDeleteRichiesta = (richiestaId: string) => {
    if (!window.confirm("Eliminare definitivamente questa richiesta di informazioni?")) return;
    const updated = (config.richieste_info || []).filter(r => r.id !== richiestaId);
    handleSaveConfig({ ...config, richieste_info: updated });
  };

  const exportRichiesteCSV = () => {
    const list = config.richieste_info || [];
    if (list.length === 0) {
      showToast("Nessuna richiesta da esportare", "info");
      return;
    }

    const headers = ["Data", "Nome e Cognome", "Telefono", "Email", "Richiesta / Domanda", "Stato", "Note Interne"];
    const rows = list.map(r => [
      new Date(r.data_richiesta).toLocaleDateString('it-IT') + ' ' + new Date(r.data_richiesta).toLocaleTimeString('it-IT'),
      `"${(r.nome_cognome || '').replace(/"/g, '""')}"`,
      `"${r.telefono || ''}"`,
      `"${r.email || ''}"`,
      `"${(r.richiesta || '').replace(/"/g, '""')}"`,
      r.stato,
      `"${(r.note_interne || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `richieste_info_voltex_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Upload Foto Principale Hero con compressione WebP automatica
  const handleUploadHeroImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingHero(true);
    try {
      showToast("Compressione WebP dell'immagine in corso...", "info");
      const compResult = await compressImage(file, IMAGE_PRESETS.EVENTO_COVER);
      const url = await caricaBlobSuStorage(compResult.blob, `voltex/hero_${Date.now()}.webp`);
      
      const newConfig = { ...config, hero_image_url: url };
      await handleSaveConfig(newConfig);
      showToast(`Locandina Hero aggiornata! Ottimizzazione: -${compResult.reductionPercent}%`, "success");
    } catch (err) {
      console.error(err);
      showToast("Errore durante il caricamento dell'immagine Hero", "error");
    } finally {
      setUploadingHero(false);
      e.target.value = '';
    }
  };

  const handleResetHeroImage = async () => {
    if (!window.confirm("Ripristinare la locandina originale di default?")) return;
    const newConfig = { ...config, hero_image_url: "/images/voltex/voltex-riccione-cover.jpg" };
    await handleSaveConfig(newConfig);
    showToast("Locandina originale ripristinata", "info");
  };

  // Upload Foto Galleria Camp con compressione WebP automatica
  const handleUploadGalleria = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingGalleria(true);
    try {
      showToast(`Elaborazione e compressione di ${files.length} foto in corso...`, "info");
      const nuoveFoto: Array<{ url: string; caption?: string }> = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compResult = await compressImage(file, IMAGE_PRESETS.EVENTO_COVER);
        const url = await caricaBlobSuStorage(compResult.blob, `voltex/galleria_${Date.now()}_${i}.webp`);
        nuoveFoto.push({
          url,
          caption: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ')
        });
      }

      const currentGalleria = config.galleria_foto || [];
      const newConfig = {
        ...config,
        galleria_foto: [...currentGalleria, ...nuoveFoto]
      };
      await handleSaveConfig(newConfig);
      showToast(`${nuoveFoto.length} foto caricate e ottimizzate con successo!`, "success");
    } catch (err) {
      console.error(err);
      showToast("Errore durante il caricamento delle foto per la galleria", "error");
    } finally {
      setUploadingGalleria(false);
      e.target.value = '';
    }
  };

  const handleDeleteGalleriaFoto = (index: number) => {
    if (!window.confirm("Rimuovere questa foto dalla galleria del camp?")) return;
    const currentGalleria = [...(config.galleria_foto || [])];
    currentGalleria.splice(index, 1);
    handleSaveConfig({ ...config, galleria_foto: currentGalleria });
  };

  const handleMoveGalleriaFoto = (index: number, direction: 'up' | 'down') => {
    const currentGalleria = [...(config.galleria_foto || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentGalleria.length) return;

    const temp = currentGalleria[index];
    currentGalleria[index] = currentGalleria[targetIndex];
    currentGalleria[targetIndex] = temp;
    handleSaveConfig({ ...config, galleria_foto: currentGalleria });
  };

  const handleUpdateGalleriaCaption = (index: number, caption: string) => {
    const currentGalleria = [...(config.galleria_foto || [])];
    if (currentGalleria[index]) {
      currentGalleria[index] = { ...currentGalleria[index], caption };
      setConfig({ ...config, galleria_foto: currentGalleria });
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-xs font-mono text-slate-500">Caricamento modulo Voltex Camp...</p>
      </div>
    );
  }

  const iscrizioni = config.iscrizioni_ricevute || [];
  const tappe = config.date_camp || [];
  const richieste = config.richieste_info || [];
  const richiesteNuove = richieste.filter(r => r.stato === 'nuova').length;

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-900 border border-red-700/40 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm w-full max-w-full">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold font-sport uppercase tracking-tight text-white">
                Gestione Voltex Academy Camp
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-bold uppercase tracking-wider border border-red-500/30">
                Partner Ufficiale
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Gestisci date, quote, testi e monitora le iscrizioni ricevute dalla pagina pubblica.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/voltex"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            Vedi Pagina
          </a>
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
            title="Ricarica Dati"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Controllo Apertura Iscrizioni Pubbliche (Switch SÌ / NO) */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm w-full max-w-full ${
        config.iscrizioni_aperte !== false
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-amber-500/10 border-amber-500/30'
      }`}>
        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
            config.iscrizioni_aperte !== false
              ? 'bg-emerald-500 text-white shadow-emerald-500/20 shadow-md'
              : 'bg-amber-500 text-slate-950 shadow-amber-500/20 shadow-md'
          }`}>
            <Flame className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-slate-900 font-sport uppercase tracking-wide">
                Apertura Iscrizioni al Pubblico:
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border shrink-0 ${
                config.iscrizioni_aperte !== false
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}>
                {config.iscrizioni_aperte !== false ? 'APERTE (SÌ)' : 'CHIUSE / IN ARRIVO (NO)'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              {config.iscrizioni_aperte !== false ? (
                <>I visitatori della pagina possono <strong>iscriversi direttamente</strong> o richiedere informazioni tramite l'apposito modulo.</>
              ) : (
                <>La pagina è <strong>aperta e navigabile dal pubblico</strong> senza mostrare il modulo di iscrizione (segnalato come "in arrivo"). Gli utenti possono comunque inviare domande tramite il modulo <strong>"Richiedi Info"</strong> che potrai poi smistare.</>
              )}
            </p>
          </div>
        </div>

        {/* Pulsanti Switch SÌ / NO */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm shrink-0 self-start md:self-center">
          <button
            type="button"
            onClick={() => handleToggleIscrizioniAperte(true)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              config.iscrizioni_aperte !== false
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            SÌ (Aperte)
          </button>
          <button
            type="button"
            onClick={() => handleToggleIscrizioniAperte(false)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              config.iscrizioni_aperte === false
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            NO (Chiuse)
          </button>
        </div>
      </div>

      {/* Sotto-Menu Tab: sempre a capo (flex-wrap), senza alcuno scorrimento orizzontale */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 w-full">
        <button
          onClick={() => setSubTab('date')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            subTab === 'date'
              ? 'bg-amber-400 text-slate-950 shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4 shrink-0" />
          <span>Date & Tappe ({tappe.length})</span>
        </button>

        <button
          onClick={() => setSubTab('iscrizioni')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            subTab === 'iscrizioni'
              ? 'bg-amber-400 text-slate-950 shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>Iscrizioni ({iscrizioni.length})</span>
          {iscrizioni.some(i => i.stato === 'nuova') && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
          )}
        </button>

        <button
          onClick={() => setSubTab('richieste')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            subTab === 'richieste'
              ? 'bg-amber-400 text-slate-950 shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span>Richieste Info ({richieste.length})</span>
          {richiesteNuove > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold shrink-0">
              {richiesteNuove} nuove
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab('testi')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            subTab === 'testi'
              ? 'bg-amber-400 text-slate-950 shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4 shrink-0" />
          <span>Testi & Informazioni</span>
        </button>

        <button
          onClick={() => setSubTab('foto')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            subTab === 'foto'
              ? 'bg-amber-400 text-slate-950 shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Camera className="w-4 h-4 shrink-0" />
          <span>Foto & Grafiche</span>
        </button>
      </div>

      {/* 1. SOTTO-TAB: DATE & TAPPE */}
      {subTab === 'date' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Elenco Tappe Attive ({tappe.length})
            </h3>
            <button
              onClick={() => {
                setEditingTappa({
                  id: `tappa_${Date.now()}`,
                  titolo: 'Nuova Tappa Voltex',
                  localita: 'Città (PROV)',
                  periodo: 'Data Inizio - Data Fine',
                  struttura: 'Palazzetto dello Sport',
                  destinatari: 'Ragazzi e Ragazze 10-18 anni',
                  posti_totali: 30,
                  posti_occupati: 0,
                  quota: 'Formula Day Camp o Residenziale',
                  stato: 'aperte',
                  note: '',
                  attivo: true
                });
                setIsNewTappa(true);
              }}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Aggiungi Tappa
            </button>
          </div>

          {/* Form Editing Tappa */}
          {editingTappa && (
            <div className="p-6 rounded-2xl bg-white border-2 border-red-500 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="font-bold text-sm text-slate-800 uppercase font-sport">
                  {isNewTappa ? "Nuova Tappa del Camp" : "Modifica Tappa"}
                </h4>
                <button 
                  onClick={() => setEditingTappa(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Annulla
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Titolo Tappa</label>
                  <input
                    type="text"
                    value={editingTappa.titolo}
                    onChange={(e) => setEditingTappa({ ...editingTappa, titolo: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Località</label>
                  <input
                    type="text"
                    value={editingTappa.localita}
                    onChange={(e) => setEditingTappa({ ...editingTappa, localita: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Periodo / Date</label>
                  <input
                    type="text"
                    value={editingTappa.periodo}
                    onChange={(e) => setEditingTappa({ ...editingTappa, periodo: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Struttura / Impianto</label>
                  <input
                    type="text"
                    value={editingTappa.struttura}
                    onChange={(e) => setEditingTappa({ ...editingTappa, struttura: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Destinatari / Fascia Età</label>
                  <input
                    type="text"
                    value={editingTappa.destinatari}
                    onChange={(e) => setEditingTappa({ ...editingTappa, destinatari: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Quota / Indicazione Prezzo</label>
                  <input
                    type="text"
                    value={editingTappa.quota}
                    onChange={(e) => setEditingTappa({ ...editingTappa, quota: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Posti Totali</label>
                  <input
                    type="number"
                    value={editingTappa.posti_totali}
                    onChange={(e) => setEditingTappa({ ...editingTappa, posti_totali: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Posti Occupati</label>
                  <input
                    type="number"
                    value={editingTappa.posti_occupati}
                    onChange={(e) => setEditingTappa({ ...editingTappa, posti_occupati: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Stato Iscrizioni</label>
                  <select
                    value={editingTappa.stato}
                    onChange={(e) => setEditingTappa({ ...editingTappa, stato: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-red-500"
                  >
                    <option value="aperte">Aperte</option>
                    <option value="in_esaurimento">In Esaurimento</option>
                    <option value="chiuse">Chiuse (Sold Out)</option>
                    <option value="prossimamente">Prossimamente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Note Aggiuntive</label>
                <input
                  type="text"
                  value={editingTappa.note || ''}
                  onChange={(e) => setEditingTappa({ ...editingTappa, note: e.target.value })}
                  placeholder="es. Pernottamento pensione completa incluso"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setEditingTappa(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold uppercase cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  onClick={() => handleSaveTappa(editingTappa)}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Salva Tappa
                </button>
              </div>
            </div>
          )}

          {/* Lista Card Tappe */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tappe.map((tappa) => (
              <div 
                key={tappa.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-red-500" />
                        {tappa.localita}
                      </span>
                      <h4 className="font-bold text-base text-slate-900 font-sport uppercase">
                        {tappa.titolo}
                      </h4>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      tappa.stato === 'chiuse'
                        ? 'bg-red-100 text-red-800'
                        : tappa.stato === 'in_esaurimento'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {tappa.stato}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <p><strong>Periodo:</strong> {tappa.periodo}</p>
                    <p><strong>Struttura:</strong> {tappa.struttura}</p>
                    <p><strong>Fascia:</strong> {tappa.destinatari}</p>
                    <p><strong>Quota:</strong> {tappa.quota}</p>
                    <p><strong>Posti:</strong> {tappa.posti_occupati} / {tappa.posti_totali}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t pt-3">
                  <button
                    onClick={() => {
                      setEditingTappa(tappa);
                      setIsNewTappa(false);
                    }}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Modifica
                  </button>
                  <button
                    onClick={() => handleDeleteTappa(tappa.id)}
                    className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-all cursor-pointer"
                    title="Elimina Tappa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. SOTTO-TAB: ISCRIZIONI */}
      {subTab === 'iscrizioni' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Richieste di Iscrizione Ricevute ({iscrizioni.length})
              </h3>
              <p className="text-xs text-slate-500">
                Clicca su WhatsApp per ricontattare l'atleta o il genitore con messaggio già pronto.
              </p>
            </div>

            <button
              onClick={exportIscrizioniCSV}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" />
              Esporta CSV
            </button>
          </div>

          {iscrizioni.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 text-slate-400 space-y-2">
              <Users className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm font-medium">Nessuna iscrizione pervenuta finora.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Data</th>
                      <th className="p-3.5">Atleta</th>
                      <th className="p-3.5">Tappa Scelta</th>
                      <th className="p-3.5">Contatti</th>
                      <th className="p-3.5">Kit / Note</th>
                      <th className="p-3.5">Stato</th>
                      <th className="p-3.5 text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {iscrizioni.map((isc) => {
                      const waPhone = (isc.telefono || '').replace(/[^0-9]/g, '');
                      const waText = encodeURIComponent(
                        `Ciao ${isc.nome_genitore || isc.nome_atleta}, ti contattiamo da Voltex Academy / New Volley Academy riguardo la richiesta di iscrizione per ${isc.nome_atleta} alla tappa di ${isc.tappa_nome}.`
                      );

                      return (
                        <tr key={isc.id} className="hover:bg-slate-50/70">
                          <td className="p-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                            {new Date(isc.data_richiesta).toLocaleDateString('it-IT')}
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-slate-900 block">{isc.nome_atleta} {isc.cognome_atleta}</span>
                            <span className="text-[11px] text-slate-500">{isc.data_nascita} • {isc.ruolo}</span>
                          </td>
                          <td className="p-3.5 font-medium text-slate-800">
                            {isc.tappa_nome}
                          </td>
                          <td className="p-3.5">
                            <span className="block font-mono text-slate-800">{isc.telefono}</span>
                            <span className="text-[11px] text-slate-500 block">{isc.email}</span>
                            {isc.nome_genitore && <span className="text-[10px] text-slate-400">Genitore: {isc.nome_genitore}</span>}
                          </td>
                          <td className="p-3.5">
                            <span className="inline-block px-2 py-0.5 rounded bg-slate-100 font-bold text-[10px] text-slate-700 mb-1">
                              Taglia: {isc.taglia_kit}
                            </span>
                            {isc.note && <p className="text-[11px] text-slate-500 italic max-w-xs">{isc.note}</p>}
                          </td>
                          <td className="p-3.5">
                            <select
                              value={isc.stato}
                              onChange={(e) => handleUpdateStatoIscrizione(isc.id, e.target.value as any)}
                              className={`text-[11px] font-bold uppercase rounded-lg px-2.5 py-1 border ${
                                isc.stato === 'nuova'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : isc.stato === 'confermata'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : isc.stato === 'contattato'
                                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                                  : 'bg-slate-100 text-slate-600 border-slate-300'
                              }`}
                            >
                              <option value="nuova">Nuova</option>
                              <option value="contattato">Contattato</option>
                              <option value="confermata">Confermata</option>
                              <option value="annullata">Annullata</option>
                            </select>
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap space-x-1">
                            {waPhone && (
                              <a
                                href={`https://wa.me/${waPhone}?text=${waText}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 inline-flex rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-all"
                                title="Apri WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteIscrizione(isc.id)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all cursor-pointer"
                              title="Elimina"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SOTTO-TAB: RICHIESTE INFO & DOMANDE (SMISTAMENTO) */}
      {subTab === 'richieste' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Richieste di Informazioni & Domande ({richieste.length})
                </h3>
                {richiesteNuove > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">
                    {richiesteNuove} nuove da smistare
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Domande inviate dagli utenti dalla pagina Voltex Camp. Clicca sui contatti per rispondere subito o assegna note interne per smistarle.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportRichiesteCSV}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4" />
                Esporta CSV
              </button>
            </div>
          </div>

          {/* Filtri Stato: sempre su più righe se serve, senza scroll orizzontale */}
          <div className="flex flex-wrap items-center gap-2 pb-1 text-xs">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider shrink-0">Filtra:</span>
            <button
              onClick={() => setFiltroStatoRichieste('tutti')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filtroStatoRichieste === 'tutti'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Tutte ({richieste.length})
            </button>
            <button
              onClick={() => setFiltroStatoRichieste('nuova')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filtroStatoRichieste === 'nuova'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Nuove ({richieste.filter(r => r.stato === 'nuova').length})
            </button>
            <button
              onClick={() => setFiltroStatoRichieste('gestita')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filtroStatoRichieste === 'gestita'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Gestite / Smistate ({richieste.filter(r => r.stato === 'gestita').length})
            </button>
            <button
              onClick={() => setFiltroStatoRichieste('archiviata')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filtroStatoRichieste === 'archiviata'
                  ? 'bg-slate-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Archiviate ({richieste.filter(r => r.stato === 'archiviata').length})
            </button>
          </div>

          {richieste.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 text-slate-400 space-y-2">
              <HelpCircle className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm font-medium">Nessuna richiesta di informazione pervenuta.</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Quando un utente compila il modulo "Richiedi Info" dalla pagina Voltex Camp, apparirà automaticamente qui con tutti i dettagli e la domanda.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {richieste
                .filter(r => filtroStatoRichieste === 'tutti' || r.stato === filtroStatoRichieste)
                .map((req) => {
                  const waPhone = (req.telefono || '').replace(/[^0-9]/g, '');
                  const waText = encodeURIComponent(
                    `Ciao ${req.nome_cognome}, ti contattiamo da Voltex Academy / New Volley Academy in merito alla tua richiesta di informazioni sul Voltex Camp.`
                  );

                  return (
                    <div
                      key={req.id}
                      className={`p-5 rounded-2xl bg-white border transition-all space-y-3 shadow-sm ${
                        req.stato === 'nuova'
                          ? 'border-amber-300 ring-2 ring-amber-100'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Riga Superiore: Utente, Data e Badge Stato */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                            req.stato === 'nuova' 
                              ? 'bg-amber-100 text-amber-800' 
                              : req.stato === 'gestita'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {req.nome_cognome ? req.nome_cognome.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{req.nome_cognome}</h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{new Date(req.data_richiesta).toLocaleDateString('it-IT')} alle ore {new Date(req.data_richiesta).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>

                        {/* Stato selettore rapido */}
                        <div className="flex items-center gap-2">
                          <select
                            value={req.stato}
                            onChange={(e) => handleUpdateStatoRichiesta(req.id, e.target.value as any)}
                            className={`text-xs font-bold uppercase rounded-xl px-3 py-1.5 border transition-all cursor-pointer ${
                              req.stato === 'nuova'
                                ? 'bg-amber-50 text-amber-900 border-amber-300 font-black'
                                : req.stato === 'gestita'
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-black'
                                : 'bg-slate-100 text-slate-600 border-slate-300'
                            }`}
                          >
                            <option value="nuova">🟡 Nuova (Da Smistare)</option>
                            <option value="gestita">🟢 Gestita / Smistata</option>
                            <option value="archiviata">⚪ Archiviata</option>
                          </select>

                          <button
                            onClick={() => handleDeleteRichiesta(req.id)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all cursor-pointer shrink-0"
                            title="Elimina richiesta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Riga Contatti: Telefono, WhatsApp, Email */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {req.telefono && (
                          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            <a href={`tel:${req.telefono}`} className="font-mono font-bold text-slate-800 hover:text-red-600">
                              {req.telefono}
                            </a>
                            {waPhone && (
                              <a
                                href={`https://wa.me/${waPhone}?text=${waText}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-1 px-2 py-0.5 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1 transition-all"
                                title="Scrivi su WhatsApp"
                              >
                                <MessageCircle className="w-3 h-3" />
                                WhatsApp
                              </a>
                            )}
                          </div>
                        )}

                        {req.email && (
                          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                            <a
                              href={`mailto:${req.email}?subject=Riscontro%20richiesta%20info%20Voltex%20Camp`}
                              className="font-medium text-slate-800 hover:text-red-600"
                            >
                              {req.email}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Testo della Richiesta / Domanda */}
                      <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/70 text-slate-800 text-xs leading-relaxed space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-amber-600" />
                          Domanda / Richiesta dell'utente:
                        </span>
                        <p className="whitespace-pre-line font-medium text-slate-900">{req.richiesta}</p>
                      </div>

                      {/* Note Interne / Smistamento */}
                      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <label className="text-[11px] font-bold uppercase text-slate-500 shrink-0">
                          Note Interne / Smistata a:
                        </label>
                        <input
                          type="text"
                          value={req.note_interne || ''}
                          onChange={(e) => handleUpdateNoteRichiesta(req.id, e.target.value)}
                          onBlur={handleSalvaNoteRichieste}
                          placeholder="es. Inoltrata a coach Marco / Contattato via telefono il 25/10..."
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            handleSalvaNoteRichieste();
                            showToast("Note interne salvate", "success");
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shrink-0"
                        >
                          Salva Nota
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* 3. SOTTO-TAB: TESTI & CONFIGURAZIONE */}
      {subTab === 'testi' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Impostazioni e Contenuti Pagina Voltex
              </h3>
              <p className="text-xs text-slate-500">Modifica i testi della landing page pubblica.</p>
            </div>
            <button
              onClick={() => handleSaveConfig(config)}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salva Modifiche
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Titolo Hero</label>
                <input
                  type="text"
                  value={config.titolo_hero}
                  onChange={(e) => setConfig({ ...config, titolo_hero: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Sottotitolo Hero</label>
                <input
                  type="text"
                  value={config.sottotitolo_hero}
                  onChange={(e) => setConfig({ ...config, sottotitolo_hero: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  Testo Banner quando Iscrizioni APERTE
                </label>
                <input
                  type="text"
                  value={config.testo_annuncio || ''}
                  onChange={(e) => setConfig({ ...config, testo_annuncio: e.target.value })}
                  placeholder="Iscrizioni ancora aperte! Posti limitati..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  Testo Banner quando Iscrizioni CHIUSE
                </label>
                <input
                  type="text"
                  value={config.testo_annuncio_chiuso || ''}
                  onChange={(e) => setConfig({ ...config, testo_annuncio_chiuso: e.target.value })}
                  placeholder="Iscrizioni al Camp attualmente chiuse (in arrivo)..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Descrizione Breve</label>
              <textarea
                rows={2}
                value={config.descrizione_breve}
                onChange={(e) => setConfig({ ...config, descrizione_breve: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Descrizione Completa</label>
              <textarea
                rows={4}
                value={config.descrizione_completa}
                onChange={(e) => setConfig({ ...config, descrizione_completa: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">WhatsApp Notifiche Iscrizioni</label>
                <input
                  type="text"
                  value={config.contatti_whatsapp}
                  onChange={(e) => setConfig({ ...config, contatti_whatsapp: e.target.value })}
                  placeholder="393401234567"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Username Instagram</label>
                <input
                  type="text"
                  value={config.instagram_username}
                  onChange={(e) => setConfig({ ...config, instagram_username: e.target.value })}
                  placeholder="voltexcamp"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SOTTO-TAB: FOTO & GRAFICHE (CON OTTIMIZZAZIONE WEBP AUTOMATICA) */}
      {subTab === 'foto' && (
        <div className="space-y-6">
          
          {/* Sezione 1: Locandina / Foto Principale Hero */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-red-600" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    Locandina / Foto Principale Hero
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  L'immagine in evidenza mostrata in cima alla landing page del Camp.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm transition-all">
                  {uploadingHero ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Ottimizzazione in corso...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Cambia Locandina Hero
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingHero}
                    onChange={handleUploadHeroImage}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleResetHeroImage}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all cursor-pointer"
                  title="Ripristina locandina iniziale"
                >
                  Ripristina Default
                </button>
              </div>
            </div>

            {/* Anteprima Foto Hero Attuale */}
            <div className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-48 h-64 rounded-xl overflow-hidden bg-slate-900 border border-slate-300 shadow-inner shrink-0 flex items-center justify-center">
                <img
                  src={config.hero_image_url || "/images/voltex/voltex-riccione-cover.jpg"}
                  alt="Anteprima Hero Voltex"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-3 text-xs text-slate-600 max-w-xl">
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Compressione Automatica Attiva
                  </p>
                  <p className="text-[11px] leading-relaxed text-emerald-700">
                    Ogni file caricato viene ridimensionato proporzionalmente e convertito in formato WebP ad alta efficienza. Viene preservata la nitidezza riducendo il peso fino al 75%, garantendo tempi di rendering istantanei (LCP ultra-veloce).
                  </p>
                </div>
                <p className="text-[11px] text-slate-500">
                  <strong>URL Attuale:</strong> <span className="font-mono text-[10px] break-all">{config.hero_image_url || "/images/voltex/voltex-riccione-cover.jpg"}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Sezione 2: Galleria Foto & Highlights del Camp */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-red-600" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    Galleria Foto & Highlights del Camp ({(config.galleria_foto || []).length})
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gli scatti mostrati nella sezione programma e backstage del camp.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm transition-all">
                  {uploadingGalleria ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Caricamento in corso...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Aggiungi Foto (anche multiple)
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadingGalleria}
                    onChange={handleUploadGalleria}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => handleSaveConfig(config)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Salva Didascalie
                </button>
              </div>
            </div>

            {/* Griglia Foto Galleria */}
            {(config.galleria_foto || []).length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-200 text-slate-400">
                <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium">Nessuna foto in galleria. Clicca su "Aggiungi Foto" per caricarne.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(config.galleria_foto || []).map((foto, idx) => (
                  <div 
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="w-full h-36 rounded-lg overflow-hidden bg-slate-900 border border-slate-200 relative group">
                        <img
                          src={foto.url}
                          alt={foto.caption || `Foto ${idx + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-white">
                          #{idx + 1}
                        </span>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Didascalia</label>
                        <input
                          type="text"
                          value={foto.caption || ''}
                          onChange={(e) => handleUpdateGalleriaCaption(idx, e.target.value)}
                          placeholder="es. Valentina Diouf in allenamento"
                          className="w-full text-xs p-1.5 rounded border border-slate-300 bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t pt-2 mt-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveGalleriaFoto(idx, 'up')}
                          className="p-1 rounded bg-white hover:bg-slate-200 text-slate-600 disabled:opacity-30 border cursor-pointer"
                          title="Sposta prima"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === (config.galleria_foto?.length || 1) - 1}
                          onClick={() => handleMoveGalleriaFoto(idx, 'down')}
                          className="p-1 rounded bg-white hover:bg-slate-200 text-slate-600 disabled:opacity-30 border cursor-pointer"
                          title="Sposta dopo"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteGalleriaFoto(idx)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        title="Elimina foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Rimuovi</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
