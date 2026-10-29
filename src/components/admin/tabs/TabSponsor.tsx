import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Sparkles, 
  Phone, 
  Mail, 
  Calendar, 
  Save, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  FileText, 
  Inbox,
  AlertCircle,
  BarChart3,
  Printer,
  Trophy,
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import GestioneSponsor, { SponsorDoc } from '../../GestioneSponsor';
import { 
  db,
  isDemoMode,
  getSponsorPageConfig, 
  updateSponsorPageConfig, 
  getRichiesteSponsor, 
  updateStatoRichiestaSponsor, 
  eliminaRichiestaSponsor,
  SponsorPageConfig,
  RichiestaSponsor,
  DEFAULT_SPONSOR_PAGE_CONFIG
} from '../../../firebase-societa';

interface TabSponsorProps {
  showToast?: (message: string, type: 'success' | 'error') => void;
  caricaFileSuStorage?: (file: File, path: string) => Promise<string>;
}

export default function TabSponsor({ showToast, caricaFileSuStorage }: TabSponsorProps) {
  const [activeSubTab, setActiveSubTab] = useState<'attivi' | 'ricerca' | 'report'>('attivi');
  
  // State configurazione pagina ricerca sponsor
  const [config, setConfig] = useState<SponsorPageConfig>(DEFAULT_SPONSOR_PAGE_CONFIG);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // State richieste ricevute
  const [richieste, setRichieste] = useState<RichiestaSponsor[]>([]);
  const [loadingRichieste, setLoadingRichieste] = useState(false);
  const [filtroStato, setFiltroStato] = useState<'tutti' | 'nuovo' | 'contattato' | 'completato'>('tutti');

  // State report e statistiche visibilità sponsor
  const [sponsorsReport, setSponsorsReport] = useState<SponsorDoc[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);

  const handlePrintReport = () => {
    document.body.classList.add('printing-sponsor-report');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-sponsor-report');
    }, 1500);
  };

  const notify = (msg: string, type: 'success' | 'error') => {
    if (showToast) showToast(msg, type);
    else alert(msg);
  };

  useEffect(() => {
    if (activeSubTab === 'ricerca') {
      caricaDatiRicerca();
    }
  }, [activeSubTab]);

  useEffect(() => {
    if (activeSubTab === 'report') {
      if (isDemoMode || !db) {
        setLoadingReport(false);
        return;
      }
      setLoadingReport(true);
      const q = query(collection(db, 'sponsors'), orderBy('ordine', 'asc'));
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const list: SponsorDoc[] = [];
          let localClicks: Record<string, { clicks: number; ultimoClick: string }> = {};
          try {
            const raw = localStorage.getItem('nva_sponsor_clicks');
            if (raw) localClicks = JSON.parse(raw);
          } catch (e) {}

          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const localCount = localClicks[docSnap.id]?.clicks || 0;
            const firestoreCount = typeof data.clickCount === 'number' ? data.clickCount : 0;
            const totalClicks = Math.max(firestoreCount, localCount);
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
              ordine: typeof data.ordine === 'number' ? data.ordine : 1,
              clickCount: totalClicks,
              ultimoClick: data.ultimoClick || localClicks[docSnap.id]?.ultimoClick || null
            });
          });
          setSponsorsReport(list);
          setLoadingReport(false);
        },
        (err) => {
          console.error("Errore recupero report sponsor:", err);
          setLoadingReport(false);
        }
      );
      return () => unsub();
    }
  }, [activeSubTab]);

  const caricaDatiRicerca = async () => {
    setLoadingConfig(true);
    setLoadingRichieste(true);
    try {
      const [conf, reqs] = await Promise.all([
        getSponsorPageConfig(),
        getRichiesteSponsor()
      ]);
      if (conf) setConfig(conf);
      if (reqs) setRichieste(reqs);
    } catch (err) {
      console.error("Errore caricamento dati ricerca sponsor:", err);
      notify("Errore nel caricamento dei dati.", "error");
    } finally {
      setLoadingConfig(false);
      setLoadingRichieste(false);
    }
  };

  const handleSalvaConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      await updateSponsorPageConfig(config);
      notify("Configurazione pagina sponsor salvata con successo!", "success");
    } catch (err) {
      console.error("Errore salvataggio:", err);
      notify("Errore durante il salvataggio.", "error");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleCambiaStato = async (id: string, nuovoStato: 'nuovo' | 'contattato' | 'completato') => {
    try {
      await updateStatoRichiestaSponsor(id, nuovoStato);
      setRichieste(prev => prev.map(r => r.id === id ? { ...r, stato: nuovoStato } : r));
      notify(`Stato aggiornato a: ${nuovoStato.toUpperCase()}`, "success");
    } catch (err) {
      console.error("Errore cambio stato:", err);
      notify("Impossibile aggiornare lo stato.", "error");
    }
  };

  const handleEliminaRichiesta = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questa richiesta di partnership?")) return;
    try {
      await eliminaRichiestaSponsor(id);
      setRichieste(prev => prev.filter(r => r.id !== id));
      notify("Richiesta eliminata.", "success");
    } catch (err) {
      console.error("Errore eliminazione:", err);
      notify("Impossibile eliminare la richiesta.", "error");
    }
  };

  const richiesteFiltrate = richieste.filter(r => {
    if (filtroStato === 'tutti') return true;
    return r.stato === filtroStato;
  });

  const conteggioNuovi = richieste.filter(r => r.stato === 'nuovo').length;

  return (
    <div className="space-y-6 animate-fade-in" id="admin-tab-sponsor">
      {/* Header con Switcher Sotto-schede Spazioso e Non Collassato */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="space-y-0.5">
            <h2 className="text-xl font-black italic tracking-tight text-slate-950 uppercase font-sport skew-x-[-6deg]">
              SPONSOR & PARTNERSHIP
            </h2>
            <p className="text-xs text-slate-500 font-inter">
              Gestione partner attivi, pagina reclutamento e statistiche di visibilità / click.
            </p>
          </div>
        </div>

        {/* Tab Buttons a tutta larghezza in griglia a 3 colonne, mai compressi */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200/60">
          <button
            type="button"
            onClick={() => setActiveSubTab('attivi')}
            className={`w-full py-2.5 px-4 text-xs font-barlow font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === 'attivi'
                ? 'bg-black text-[#FFE600] shadow-sm'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/60'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span className="truncate">Sponsor Attivi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('ricerca')}
            className={`w-full py-2.5 px-4 text-xs font-barlow font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === 'ricerca'
                ? 'bg-black text-[#FFE600] shadow-sm'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/60'
            }`}
          >
            <Inbox className="w-4 h-4 shrink-0" />
            <span className="truncate">Reclutamento & Richieste</span>
            {conteggioNuovi > 0 && (
              <span className="bg-[#FFE600] text-black text-[10px] font-mono px-2 py-0.5 rounded-full font-black shrink-0">
                {conteggioNuovi}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('report')}
            className={`w-full py-2.5 px-4 text-xs font-barlow font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === 'report'
                ? 'bg-black text-[#FFE600] shadow-sm'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/60'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate">Report & Visibilità</span>
          </button>
        </div>
      </div>

      {/* SOTTO-SCHEDA 1: SPONSOR ATTIVI */}
      {activeSubTab === 'attivi' && (
        <GestioneSponsor />
      )}

      {/* SOTTO-SCHEDA 2: PAGINA RICERCA SPONSOR & RICHIESTE RICEVUTE */}
      {activeSubTab === 'ricerca' && (
        <div className="space-y-8">
          {/* Sezione 1: Richieste di Contatto Ricevute */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-barlow font-bold uppercase text-slate-900 flex items-center gap-2">
                    <Inbox className="w-5 h-5 text-amber-600" />
                    Richieste Partnership Ricevute ({richieste.length})
                  </h3>
                  {conteggioNuovi > 0 && (
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded">
                      {conteggioNuovi} Nuove
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-inter mt-0.5">
                  Aziende e imprenditori che hanno compilato il modulo sul sito web.
                </p>
              </div>

              {/* Filtri Stato */}
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <button
                  onClick={() => setFiltroStato('tutti')}
                  className={`px-2.5 py-1 rounded-md uppercase ${filtroStato === 'tutti' ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-600'}`}
                >
                  Tutte
                </button>
                <button
                  onClick={() => setFiltroStato('nuovo')}
                  className={`px-2.5 py-1 rounded-md uppercase ${filtroStato === 'nuovo' ? 'bg-[#FFE600] text-black font-bold' : 'bg-slate-100 text-slate-600'}`}
                >
                  Nuove ({conteggioNuovi})
                </button>
                <button
                  onClick={() => setFiltroStato('contattato')}
                  className={`px-2.5 py-1 rounded-md uppercase ${filtroStato === 'contattato' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 text-slate-600'}`}
                >
                  Contattate
                </button>
                <button
                  onClick={() => setFiltroStato('completato')}
                  className={`px-2.5 py-1 rounded-md uppercase ${filtroStato === 'completato' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 text-slate-600'}`}
                >
                  Chiuse
                </button>
              </div>
            </div>

            {loadingRichieste ? (
              <div className="py-8 text-center text-xs font-mono text-slate-400">Caricamento richieste in corso...</div>
            ) : richiesteFiltrate.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-inter text-xs bg-slate-50 rounded-xl">
                Nessuna richiesta di partnership trovata con i filtri selezionati.
              </div>
            ) : (
              <div className="space-y-3">
                {richiesteFiltrate.map((r) => (
                  <div 
                    key={r.id}
                    className={`p-4 rounded-xl border transition-all ${
                      r.stato === 'nuovo' 
                        ? 'bg-amber-50/50 border-amber-200' 
                        : r.stato === 'contattato'
                        ? 'bg-blue-50/30 border-blue-200'
                        : 'bg-slate-50/70 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-barlow font-bold text-base text-slate-950 uppercase">{r.nomeAzienda}</span>
                        {r.referente && <span className="text-xs text-slate-500 font-inter">({r.referente})</span>}
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                          r.stato === 'nuovo' 
                            ? 'bg-[#FFE600] text-black' 
                            : r.stato === 'contattato'
                            ? 'bg-blue-600 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}>
                          {r.stato.toUpperCase()}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(r.dataRichiesta).toLocaleString('it-IT')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-inter text-slate-700 py-2 border-y border-slate-200/60 my-2">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <a href={`tel:${r.telefono}`} className="font-semibold text-slate-900 hover:text-amber-600 underline">
                          {r.telefono}
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <a href={`mailto:${r.email}`} className="font-semibold text-slate-900 hover:text-amber-600 underline truncate">
                          {r.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-mono text-[10px] uppercase">Interesse:</span>
                        <span className="font-bold text-slate-900 truncate">{r.categoriaInteresse}</span>
                      </div>
                    </div>

                    {r.messaggio && (
                      <p className="text-xs text-slate-600 font-inter italic my-2 bg-white/70 p-2.5 rounded-lg border border-slate-200/50">
                        "{r.messaggio}"
                      </p>
                    )}

                    {/* Azioni Rapide Stato ed Elimina */}
                    <div className="flex justify-between items-center pt-2 text-xs">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="text-slate-500">Imposta stato:</span>
                        <button
                          onClick={() => handleCambiaStato(r.id, 'nuovo')}
                          className={`px-2 py-0.5 rounded text-[10px] uppercase ${r.stato === 'nuovo' ? 'bg-[#FFE600] text-black font-bold' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                        >
                          Nuovo
                        </button>
                        <button
                          onClick={() => handleCambiaStato(r.id, 'contattato')}
                          className={`px-2 py-0.5 rounded text-[10px] uppercase ${r.stato === 'contattato' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                        >
                          Contattato
                        </button>
                        <button
                          onClick={() => handleCambiaStato(r.id, 'completato')}
                          className={`px-2 py-0.5 rounded text-[10px] uppercase ${r.stato === 'completato' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                        >
                          Chiuso
                        </button>
                      </div>

                      <button
                        onClick={() => handleEliminaRichiesta(r.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Elimina richiesta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sezione 2: Modifica Testi & Dati della Pagina Sponsor */}
          <form onSubmit={handleSalvaConfig} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-barlow font-bold uppercase text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Personalizzazione Pagina "Diventa Partner"
                </h3>
                <p className="text-xs text-slate-500 font-inter mt-0.5">
                  Modifica i testi, i numeri del club e i contatti mostrati alle aziende sulla pagina /sponsor.
                </p>
              </div>

              <button
                type="submit"
                disabled={savingConfig}
                className="bg-black text-[#FFE600] font-barlow font-bold uppercase text-xs tracking-wider px-5 py-2.5 rounded-xl hover:bg-zinc-800 transition-all flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingConfig ? "Salvataggio..." : "Salva Modifiche"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 uppercase">Titolo Principale Hero</label>
                <input
                  type="text"
                  value={config.titoloHero}
                  onChange={(e) => setConfig({ ...config, titoloHero: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                  placeholder="es. PLAY WITH US"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 uppercase">Link Brochure PDF (Opzionale)</label>
                <input
                  type="text"
                  value={config.brochurePdfUrl || ''}
                  onChange={(e) => setConfig({ ...config, brochurePdfUrl: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                  placeholder="URL link scaricabile del dossier sponsor in PDF"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 uppercase">Sottotitolo / Pitch Aziendale</label>
              <textarea
                rows={2}
                value={config.sottotitoloHero}
                onChange={(e) => setConfig({ ...config, sottotitoloHero: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 resize-none"
              />
            </div>

            {/* Numeri del club */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-900 uppercase font-mono block">
                Statistiche in Evidenza (dal dossier societario)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">Atleti</label>
                  <input
                    type="text"
                    value={config.numeroAtleti}
                    onChange={(e) => setConfig({ ...config, numeroAtleti: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-center"
                    placeholder="387+"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">Gruppi</label>
                  <input
                    type="text"
                    value={config.numeroGruppi}
                    onChange={(e) => setConfig({ ...config, numeroGruppi: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-center"
                    placeholder="10+"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">Partite/Anno</label>
                  <input
                    type="text"
                    value={config.numeroPartite}
                    onChange={(e) => setConfig({ ...config, numeroPartite: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-center"
                    placeholder="280+"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">Staff & Dirigenti</label>
                  <input
                    type="text"
                    value={config.numeroStaff}
                    onChange={(e) => setConfig({ ...config, numeroStaff: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-center"
                    placeholder="20+"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">Eventi</label>
                  <input
                    type="text"
                    value={config.numeroEventi}
                    onChange={(e) => setConfig({ ...config, numeroEventi: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-center"
                    placeholder="10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-mono">Famiglie</label>
                  <input
                    type="text"
                    value={config.numeroFamiglie}
                    onChange={(e) => setConfig({ ...config, numeroFamiglie: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-center"
                    placeholder="500+"
                  />
                </div>
              </div>
            </div>

            {/* Contatti Referente Sponsor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 uppercase">Email Referente Sponsor</label>
                <input
                  type="email"
                  value={config.emailReferenteSponsor}
                  onChange={(e) => setConfig({ ...config, emailReferenteSponsor: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 uppercase">Telefono Referente Sponsor</label>
                <input
                  type="text"
                  value={config.telefonoReferenteSponsor}
                  onChange={(e) => setConfig({ ...config, telefonoReferenteSponsor: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingConfig}
                className="bg-black text-[#FFE600] font-barlow font-bold uppercase text-xs tracking-wider px-6 py-3 rounded-xl hover:bg-zinc-800 transition-all flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingConfig ? "Salvataggio..." : "Salva Modifiche"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SOTTO-SCHEDA 3: REPORT & VISIBILITÀ PARTNER */}
      {activeSubTab === 'report' && (
        <div id="sponsor-report-printable" className="space-y-6">
          {/* Header di stampa visibile solo quando si stampa/esporta PDF */}
          <div className="hidden print:block pb-6 border-b-2 border-slate-900 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black uppercase tracking-wide text-slate-950 font-sport">New Volley Academy Forlì</h1>
                <p className="text-xs text-slate-600 font-mono">S.S.D. a R.L. - Cod. FIPAV 08-042 - www.newvolleyacademy.it</p>
                <p className="text-sm font-bold text-amber-600 mt-2">REPORT RENDICONTAZIONE PARTNER COMMERCIALI & VISIBILITÀ WEB</p>
              </div>
              <div className="text-right text-xs text-slate-500 font-mono">
                <p className="font-bold text-slate-800">Stagione 2025/2026</p>
                <p>Generato il: {new Date().toLocaleDateString('it-IT')}</p>
              </div>
            </div>
          </div>

          {/* Header Report & Tasto Stampa a schermo */}
          <div className="bg-gradient-to-r from-slate-900 via-zinc-900 to-black text-white p-6 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg print:hidden">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Rendicontazione ROI Partnership Commerciali
              </span>
              <h3 className="text-xl font-sport font-black uppercase tracking-wide text-white">
                Riepilogo Visibilità & Click Sponsor
              </h3>
              <p className="text-xs text-zinc-400 max-w-xl">
                Dati in tempo reale sulle interazioni degli utenti con i partner commerciali sul portale NVA (Home, Diretta Streaming e Schede Squadre).
              </p>
            </div>
            <button
              type="button"
              onClick={handlePrintReport}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-barlow font-bold uppercase text-xs tracking-wider rounded-xl shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Stampa Report Ufficiale</span>
            </button>
          </div>

          {/* 3 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-xs font-mono uppercase text-slate-500 font-semibold block">Click Totali Partner</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-sport font-black text-slate-900">
                  {sponsorsReport.reduce((acc, s) => acc + (s.clickCount || 0), 0)}
                </span>
                <span className="text-xs text-emerald-600 font-bold flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5 inline" /> Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Reindirizzamenti ai siti web ufficiali delle aziende</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-xs font-mono uppercase text-slate-500 font-semibold block">Top Partner Cliccato</span>
              <div className="flex items-center gap-2 truncate">
                <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
                <span className="text-lg font-bold text-slate-900 truncate">
                  {[...sponsorsReport].sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))[0]?.nomeSponsor || 'Nessun dato'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {[...sponsorsReport].sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))[0]?.clickCount || 0} click registrati
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-xs font-mono uppercase text-slate-500 font-semibold block">Aziende Censite</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-sport font-black text-slate-900">
                  {sponsorsReport.length}
                </span>
                <span className="text-xs text-slate-500 font-mono">partner attivi</span>
              </div>
              <p className="text-[11px] text-slate-400">Main, Gold, Tecnici e Partner Locali</p>
            </div>
          </div>

          {/* Tabella dettagliata per Sponsor */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h4 className="font-barlow font-bold uppercase text-slate-900 text-sm tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-600" />
                <span>Dettaglio Prestazioni per Azienda Partner</span>
              </h4>
              <span className="text-xs text-slate-500 font-mono">
                Stagione Sportiva 2025/2026
              </span>
            </div>

            {loadingReport ? (
              <div className="p-12 text-center text-xs text-slate-500">
                Caricamento dati report in corso...
              </div>
            ) : sponsorsReport.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                Nessun partner commerciale presente.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {[...sponsorsReport]
                  .sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))
                  .map((sp, idx) => {
                    const totale = sponsorsReport.reduce((acc, s) => acc + (s.clickCount || 0), 0);
                    const pct = totale > 0 ? Math.round(((sp.clickCount || 0) / totale) * 100) : 0;
                    return (
                      <div key={sp.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 text-center font-mono text-xs font-bold text-slate-400">
                            #{idx + 1}
                          </span>
                          <div className="w-12 h-12 rounded-xl border border-slate-200 bg-white p-1 flex items-center justify-center shrink-0 shadow-xs">
                            {sp.logo?.url ? (
                              <img src={sp.logo.url} alt={sp.nomeSponsor} className="max-h-full max-w-full object-contain" />
                            ) : (
                              <Building2 className="w-6 h-6 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="font-inter font-bold text-sm text-slate-900 truncate">
                                {sp.nomeSponsor}
                              </h5>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                                sp.tipologia === 'Main Sponsor' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                                sp.tipologia === 'Gold Partner' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {sp.tipologia}
                              </span>
                            </div>
                            {sp.linkSito && (
                              <a 
                                href={sp.linkSito} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-xs text-amber-600 hover:underline flex items-center gap-1 mt-0.5 truncate max-w-xs"
                              >
                                <span>{sp.linkSito}</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="w-32 hidden md:block">
                            <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1">
                              <span>Quota</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xl font-sport font-black text-slate-900 block leading-tight">
                              {sp.clickCount || 0}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 uppercase">Click Ricevuti</span>
                          </div>

                          <div className="text-right text-[11px] font-mono text-slate-500 hidden sm:block min-w-[110px]">
                            <span className="block text-slate-400 text-[10px] uppercase">Ultimo click</span>
                            <span>
                              {sp.ultimoClick 
                                ? new Date(sp.ultimoClick).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                                : 'Nessun click'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Footer firma visibile solo in stampa */}
          <div className="hidden print:flex justify-between items-end pt-12 text-xs text-slate-600">
            <div>
              <p className="font-bold text-slate-900">New Volley Academy Forlì</p>
              <p className="text-[10px] text-slate-500">Direzione Marketing & Relazioni Esterne</p>
            </div>
            <div className="text-right border-t border-slate-400 pt-2 min-w-[200px]">
              <p className="text-[10px] text-slate-500">Timbro e Firma per presa visione</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
