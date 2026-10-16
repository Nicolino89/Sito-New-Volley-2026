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
  AlertCircle
} from 'lucide-react';
import GestioneSponsor from '../../GestioneSponsor';
import { 
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
  const [activeSubTab, setActiveSubTab] = useState<'attivi' | 'ricerca'>('attivi');
  
  // State configurazione pagina ricerca sponsor
  const [config, setConfig] = useState<SponsorPageConfig>(DEFAULT_SPONSOR_PAGE_CONFIG);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // State richieste ricevute
  const [richieste, setRichieste] = useState<RichiestaSponsor[]>([]);
  const [loadingRichieste, setLoadingRichieste] = useState(false);
  const [filtroStato, setFiltroStato] = useState<'tutti' | 'nuovo' | 'contattato' | 'completato'>('tutti');

  const notify = (msg: string, type: 'success' | 'error') => {
    if (showToast) showToast(msg, type);
    else alert(msg);
  };

  useEffect(() => {
    if (activeSubTab === 'ricerca') {
      caricaDatiRicerca();
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
      {/* Header con Switcher Sotto-schede */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div className="space-y-0.5">
          <h2 className="text-xl font-black italic tracking-tight text-slate-950 uppercase font-sport skew-x-[-6deg]">
            SPONSOR & PARTNERSHIP
          </h2>
          <p className="text-[11px] text-slate-500">
            Gestisci sia i partner attivi che la pagina di reclutamento nuovi sponsor con le relative richieste ricevute.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('attivi')}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-barlow font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeSubTab === 'attivi'
                ? 'bg-black text-[#FFE600] shadow'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sponsor Attivi
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('ricerca')}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-barlow font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === 'ricerca'
                ? 'bg-black text-[#FFE600] shadow'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Pagina Sponsor & Richieste</span>
            {conteggioNuovi > 0 && (
              <span className="bg-[#FFE600] text-black text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">
                {conteggioNuovi}
              </span>
            )}
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
    </div>
  );
}
