import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Edit3, Trash2, Plus, ExternalLink, Save, Undo, Image, AlertCircle } from 'lucide-react';
import { db, auth, isDemoMode, caricaBlobSuStorage, caricaFileSuStorage } from '../firebase-societa';
import { compressImage, IMAGE_PRESETS } from '../utils/imageCompressor';

export interface SponsorDoc {
  id: string;
  nomeSponsor: string;
  linkSito: string;
  tipologia: 'Main Sponsor' | 'Gold Partner' | 'Sponsor Tecnico' | 'Partner Locale';
  logo: {
    url: string;
    positionY: number;
  };
  squadreAssociate?: string[];
  ordine: number;
}

export default function GestioneSponsor() {
  const [sponsors, setSponsors] = useState<SponsorDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [nomeSponsor, setNomeSponsor] = useState('');
  const [linkSito, setLinkSito] = useState('');
  const [tipologia, setTipologia] = useState<'Main Sponsor' | 'Gold Partner' | 'Sponsor Tecnico' | 'Partner Locale'>('Main Sponsor');
  const [ordine, setOrdine] = useState<number>(1);
  const [logoUrl, setLogoUrl] = useState('');
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [logoPositionY, setLogoPositionY] = useState<number>(50);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auto-clear Toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  // Real-time listener per la collezione degli sponsor
  useEffect(() => {
    if (isDemoMode || !db) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'sponsors'), orderBy('ordine', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: SponsorDoc[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            nomeSponsor: data.nomeSponsor || '',
            linkSito: data.linkSito || '',
            tipologia: data.tipologia || 'Partner Locale',
            logo: {
              url: data.logo?.url || data.logoUrl || '',
              positionY: typeof data.logo?.positionY === 'number' ? data.logo.positionY : 50
            },
            squadreAssociate: data.squadreAssociate || [],
            ordine: typeof data.ordine === 'number' ? data.ordine : 1
          });
        });
        setSponsors(list);
        setLoading(false);
      },
      (error) => {
        console.error("Errore nel recupero degli sponsor:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Gestione Upload del Logo su Firebase Storage con compressione WebP e fallback
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Controllo formati non supportati dai browser web (es. TIFF, PSD)
    const isTiff = file.type === 'image/tiff' || file.name.toLowerCase().endsWith('.tif') || file.name.toLowerCase().endsWith('.tiff');
    if (isTiff) {
      showToast("Il formato TIFF (.tif) non è supportato dai browser web. Salva o esporta il logo in formato PNG, JPG o WebP prima di caricarlo.", "error");
      e.target.value = '';
      return;
    }

    // Anteprima immediata locale
    try {
      const tempUrl = URL.createObjectURL(file);
      setLocalPreview(tempUrl);
    } catch (_) {}

    setUploading(true);
    showToast("Ottimizzazione e caricamento logo...", "success");

    try {
      let downloadURL = '';
      const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');

      if (isSvg) {
        // SVG non va convertito in raster WebP: carichiamolo direttamente
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        downloadURL = await caricaFileSuStorage(file, `sponsors/${Date.now()}_${safeName}`);
      } else {
        try {
          const compResult = await compressImage(file, IMAGE_PRESETS.LOGO);
          downloadURL = await caricaBlobSuStorage(compResult.blob, `sponsors/${Date.now()}_logo.webp`);
        } catch (compErr) {
          console.warn("Fallback caricamento diretto sponsor logo senza compressione:", compErr);
          const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          downloadURL = await caricaFileSuStorage(file, `sponsors/${Date.now()}_${safeName}`);
        }
      }

      if (!downloadURL) {
        throw new Error("URL di download non generato dallo Storage.");
      }

      setLogoUrl(downloadURL);
      showToast("Logo caricato e pronto per il salvataggio!", "success");
    } catch (error: any) {
      console.error("Errore durante l'upload del logo:", error);
      showToast("Errore di caricamento del logo: " + (error?.message || "Verifica il file."), "error");
      setLocalPreview(null);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Salvataggio o Aggiornamento dello Sponsor su Firestore
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeSponsor) {
      showToast("Il nome dello sponsor è obbligatorio!", "error");
      return;
    }

    if (uploading) {
      showToast("Attendi il caricamento completo dell'immagine prima di salvare!", "error");
      return;
    }

    const payload = {
      nomeSponsor,
      linkSito,
      tipologia,
      ordine: Number(ordine) || 1,
      logo: {
        url: logoUrl || "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=150&auto=format&fit=crop&q=60",
        positionY: Number(logoPositionY) ?? 50
      }
    };

    try {
      if (editingId) {
        // Modifica esistente
        await updateDoc(doc(db, 'sponsors', editingId), payload);
        showToast("Sponsor aggiornato con successo!", "success");
        resetForm();
      } else {
        // Nuovo inserimento
        await addDoc(collection(db, 'sponsors'), payload);
        showToast("Sponsor registrato con successo!", "success");
        resetForm();
      }
    } catch (error) {
      console.error("Errore nel salvataggio del documento su Firestore:", error);
      showToast("Impossibile salvare lo sponsor. Verifica la connessione.", "error");
    }
  };

  const handleEdit = (sponsor: SponsorDoc) => {
    setEditingId(sponsor.id);
    setNomeSponsor(sponsor.nomeSponsor);
    setLinkSito(sponsor.linkSito);
    setTipologia(sponsor.tipologia);
    setOrdine(sponsor.ordine);
    setLogoUrl(sponsor.logo.url);
    setLocalPreview(null);
    setLogoPositionY(sponsor.logo.positionY);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo sponsor?")) return;
    try {
      await deleteDoc(doc(db, 'sponsors', id));
      showToast("Sponsor rimosso con successo!", "success");
    } catch (error) {
      console.error("Errore nell'eliminazione dello sponsor:", error);
      showToast("Impossibile eliminare lo sponsor.", "error");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setNomeSponsor('');
    setLinkSito('');
    setTipologia('Main Sponsor');
    setOrdine(1);
    setLogoUrl('');
    setLocalPreview(null);
    setLogoPositionY(50);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-white font-sans shadow-2xl">
      <div className="flex flex-col gap-6">
        
        {/* Intestazione */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              💎 Gestione Sponsor & Partner
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Configura i loghi e i collegamenti degli sponsor per la Home Page e il Portale.
            </p>
          </div>
        </div>

        {/* Notifiche Toast */}
        {toast && (
          <div className={`p-3 rounded-xl text-xs font-mono flex items-center gap-2 animate-fade-in ${
            toast.type === 'success' ? 'bg-emerald-950/80 border border-emerald-500/30 text-emerald-300' : 'bg-rose-950/80 border border-rose-500/30 text-rose-300'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{toast.message}</span>
          </div>
        )}

        {/* Layout a due colonne: Form a sinistra, Lista a destra */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-5 bg-slate-950 p-5 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
              {editingId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingId ? "Modifica Sponsor" : "Aggiungi Nuovo Sponsor"}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">Nome Sponsor *</label>
                <input
                  type="text"
                  required
                  value={nomeSponsor}
                  onChange={(e) => setNomeSponsor(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="Es. Salfep S.r.l."
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">Sito Web (Link)</label>
                <input
                  type="url"
                  value={linkSito}
                  onChange={(e) => setLinkSito(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="Es. https://www.sito.it"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">Tipologia</label>
                  <select
                    value={tipologia}
                    onChange={(e) => setTipologia(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Main Sponsor">Main Sponsor</option>
                    <option value="Gold Partner">Gold Partner</option>
                    <option value="Sponsor Tecnico">Sponsor Tecnico</option>
                    <option value="Partner Locale">Partner Locale</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">Ordine Visivo</label>
                  <input
                    type="number"
                    min={1}
                    value={ordine}
                    onChange={(e) => setOrdine(Number(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Upload Logo con prevenzione blocco */}
              <div className="p-3 bg-slate-900/50 border border-dashed border-slate-800 rounded-xl space-y-2">
                <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">📤 Carica Logo</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  disabled={uploading}
                  onChange={handleLogoUpload}
                  className="text-xs text-slate-400 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[9px] file:font-bold file:bg-amber-500 file:text-black hover:file:bg-amber-600 file:cursor-pointer disabled:opacity-40 w-full"
                />
                <p className="text-[10px] text-slate-500 leading-tight">
                  Formati supportati: <strong className="text-slate-300">PNG, JPG, WebP, SVG</strong> (consigliato PNG trasparente). I file .tif/.tiff non sono supportati dai browser web.
                </p>
                
                {uploading && (
                  <div className="flex items-center gap-2 text-amber-500 font-mono text-[10px] uppercase mt-1 animate-pulse">
                    <span className="w-2.5 h-2.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></span>
                    <span>Caricamento su Storage in corso...</span>
                  </div>
                )}
              </div>

              {/* Regolazione Posizione Y Logo */}
              {(localPreview || logoUrl) && (
                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>Anteprima Logo</span>
                    <span>Posizione Y: {logoPositionY}%</span>
                  </div>
                  <div className="relative h-24 bg-white/95 border border-slate-700 rounded-xl overflow-hidden flex items-center justify-center p-2 shadow-inner">
                    <img
                      src={localPreview || logoUrl}
                      alt="Anteprima Logo"
                      className="h-full w-full object-contain"
                      style={{ objectPosition: `center ${logoPositionY}%` }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
                      }}
                    />
                    {uploading && (
                      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center gap-2 text-amber-400 font-mono text-xs">
                        <span className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></span>
                        <span>Caricamento...</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={logoPositionY}
                    onChange={(e) => setLogoPositionY(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                  />
                </div>
              )}
            </div>

            {/* Pulsanti Azione */}
            <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
              {editingId && (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={resetForm}
                  className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs uppercase flex items-center gap-1"
                >
                  <Undo className="w-3.5 h-3.5" /> Annulla
                </button>
              )}
              <button
                type="submit"
                disabled={uploading}
                className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-black font-black px-5 py-1.5 rounded-xl text-xs uppercase flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                {uploading ? "Caricamento..." : (editingId ? "Aggiorna" : "Salva")}
              </button>
            </div>
          </form>

          {/* Lista degli Sponsor */}
          <div className="lg:col-span-7 bg-slate-950 p-5 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              💎 Partner & Sponsor Registrati ({sponsors.length})
            </h3>

            {loading ? (
              <div className="text-center py-8 text-slate-500 font-mono text-xs animate-pulse">
                Caricamento degli sponsor in corso...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[550px] pr-1">
                {sponsors.map((sponsor) => (
                  <div key={sponsor.id} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-3 flex flex-col justify-between gap-3 text-xs hover:border-amber-500/20 transition-all shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-white border border-slate-700 p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                        {sponsor.logo?.url ? (
                          <img
                            src={sponsor.logo.url}
                            alt={sponsor.nomeSponsor}
                            className="w-full h-full object-contain"
                            style={{ objectPosition: `center ${sponsor.logo.positionY}%` }}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
                            }}
                          />
                        ) : (
                          <Image className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-white truncate">{sponsor.nomeSponsor}</h4>
                        <div className="flex items-center gap-1.5 mt-1 text-[9px] font-mono">
                          <span className="bg-slate-800 text-amber-400 px-1.5 py-0.5 rounded uppercase font-bold">
                            {sponsor.tipologia}
                          </span>
                          <span className="text-slate-500">
                            Pos: {sponsor.ordine}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 text-[10px] text-slate-500 font-mono">
                      <div className="truncate max-w-[150px]">
                        {sponsor.linkSito ? (
                          <a href={sponsor.linkSito} target="_blank" rel="noopener noreferrer" className="hover:underline text-amber-500 inline-flex items-center gap-0.5">
                            🌐 Visita sito <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          "Nessun sito"
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(sponsor)}
                          className="p-1 hover:bg-slate-800 rounded text-amber-500 transition-colors"
                          title="Modifica"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(sponsor.id)}
                          className="p-1 hover:bg-rose-950/40 rounded text-rose-500 transition-colors"
                          title="Elimina"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {sponsors.length === 0 && (
                  <p className="col-span-full text-center py-12 text-slate-500 font-mono italic">
                    Nessun partner commerciale o sponsor registrato.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
