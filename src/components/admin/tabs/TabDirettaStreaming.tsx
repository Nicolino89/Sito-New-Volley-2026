import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Play, 
  Save, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  Check, 
  Sparkles, 
  Tv, 
  Eye, 
  Clock, 
  Video, 
  RefreshCw,
  Share2,
  Calendar,
  MapPin,
  Shield
} from 'lucide-react';
import { 
  DirettaStreaming, 
  DEFAULT_DIRETTA_STREAMING, 
  getDirettaStreaming, 
  salvaDirettaStreaming, 
  extractYouTubeVideoId,
  getProssimaGara,
  ProssimaGara,
  RosaSquadra,
  OFFICIAL_NVA_LOGO
} from '../../../firebase-societa';

interface TabDirettaStreamingProps {
  squadreAll?: RosaSquadra[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function TabDirettaStreaming({ squadreAll = [], showToast }: TabDirettaStreamingProps) {
  const [diretta, setDiretta] = useState<DirettaStreaming>(DEFAULT_DIRETTA_STREAMING);
  const [garaMaschile, setGaraMaschile] = useState<ProssimaGara | null>(null);
  const [garaFemminile, setGaraFemminile] = useState<ProssimaGara | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      getDirettaStreaming(),
      getProssimaGara("Serie D Maschile"),
      getProssimaGara("Serie D Femminile")
    ]).then(([d, gm, gf]) => {
      setDiretta(d);
      setGaraMaschile(gm);
      setGaraFemminile(gf);
    }).catch(err => {
      console.warn("Errore caricamento dati diretta:", err);
    }).finally(() => setIsLoading(false));
  }, []);

  const videoId = extractYouTubeVideoId(diretta.url_youtube);
  const teaserVideoId = extractYouTubeVideoId(diretta.url_video_presentazione);

  const handleImportMatchData = (gara: ProssimaGara) => {
    const isCasa = gara.casa ?? true;
    const titoloDefault = `${gara.categoria}: ${isCasa ? 'New Volley Academy vs ' + gara.avversario : gara.avversario + ' vs New Volley Academy'}`;
    const sottotitoloDefault = `${gara.giornata || 'Campionato FIPAV'} • ${isCasa ? 'In Casa al Palazzetto' : 'In Trasferta'}`;
    
    // Assegnazione loghi ufficiali (NVA vs Avversario)
    const myLogo = gara.logo_nva || OFFICIAL_NVA_LOGO;
    const oppLogo = gara.logo_avversario || (gara.avversario?.toUpperCase().includes('FENIX') ? 'https://www.pallavolofaenza.com/site_img/logo.png' : '');

    setDiretta(prev => ({
      ...prev,
      titolo: titoloDefault,
      categoria: gara.categoria,
      squadra_casa: isCasa ? 'New Volley Academy' : gara.avversario,
      squadra_ospite: isCasa ? gara.avversario : 'New Volley Academy',
      logo_casa: isCasa ? myLogo : oppLogo,
      logo_ospite: isCasa ? oppLogo : myLogo,
      data_ora: gara.data_ora || '',
      luogo: gara.luogo || '',
      sottotitolo: sottotitoloDefault,
      attiva: true,
      stato: prev.stato === 'live' ? 'live' : 'in_programma'
    }));
    showToast(`Dati e loghi di ${gara.categoria} caricati! Clicca "Salva" per confermare.`, "success");
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await salvaDirettaStreaming(diretta);
      showToast("Configurazione diretta streaming salvata e attiva!", "success");
    } catch (err: any) {
      console.error(err);
      showToast("Errore durante il salvataggio della diretta: " + (err.message || ''), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyPublicUrl = () => {
    const url = window.location.origin + '/diretta';
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      showToast("Link della diretta copiato negli appunti!", "info");
    }).catch(() => {});
  };

  return (
    <div className="space-y-6 text-xs max-w-5xl mx-auto pb-12 animate-fade-in" id="admin-tab-diretta">
      
      {/* 1. HEADER CARD */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl text-white shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg ${
              diretta.attiva 
                ? 'bg-red-500/20 border-red-500/40 text-red-400' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <Radio className={`w-6 h-6 ${diretta.attiva && diretta.stato === 'live' ? 'animate-pulse text-red-500' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider font-sport italic">
                  Diretta Streaming Match
                </h3>
                {diretta.attiva ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 font-mono animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    ONLINE SUL SITO
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 font-mono border border-slate-700">
                    DISATTIVA
                  </span>
                )}
              </div>
              <p className="font-inter text-xs text-slate-400 mt-0.5">
                Trasmetti la partita sul portale ufficiale per dare visibilità agli sponsor e raccogliere visite.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyPublicUrl}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? 'Copiato!' : 'Copia Link /diretta'}</span>
            </button>
            <a
              href="/diretta"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-sport italic skew-x-[-6deg] uppercase tracking-wider px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span>Vedi Pagina Live</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* 1.5 IMPORTA DATI DALLA PROSSIMA PARTITA (1-CLICK SYNC) */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-slate-900/5 border border-amber-300/40 p-5 rounded-3xl shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <h4 className="font-sport font-black uppercase text-sm tracking-wider text-slate-900">
              ⚡ Carica Dati Istantaneamente dalle Prossime Gare FIPAV
            </h4>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Compila titolo, avversario, palazzetto e orario con 1 solo clic
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {garaMaschile && (
            <button
              type="button"
              onClick={() => handleImportMatchData(garaMaschile)}
              className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs font-sport uppercase tracking-wider text-slate-900 group-hover:text-amber-600 transition-colors flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  🏐 Serie D Maschile
                </span>
                <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                  {garaMaschile.data_ora || 'Prossima Gara'}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800 truncate">
                vs {garaMaschile.avversario}
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{garaMaschile.luogo}</span>
              </div>
            </button>
          )}

          {garaFemminile && (
            <button
              type="button"
              onClick={() => handleImportMatchData(garaFemminile)}
              className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs font-sport uppercase tracking-wider text-slate-900 group-hover:text-amber-600 transition-colors flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  🏐 Serie D Femminile
                </span>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full">
                  {garaFemminile.data_ora || 'Prossima Gara'}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800 truncate">
                vs {garaFemminile.avversario}
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{garaFemminile.luogo}</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* 2. FORM CONFIGURAZIONE */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: CONTROLLI PRINCIPALI */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-5 shadow-sm">
            <h4 className="text-base font-extrabold text-slate-900 uppercase font-sport tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <Tv className="w-4 h-4 text-amber-500" />
              <span>Parametri Trasmissione YouTube</span>
            </h4>

            {/* SWITCH ATTIVAZIONE PRINCIPALE */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <span className="font-bold text-slate-900 text-xs block">
                  Attiva Diretta Streaming sul Sito
                </span>
                <p className="text-[11px] text-slate-500 font-inter">
                  Se attivo, comparirà il banner "Guarda la Diretta" in Home Page e la pagina <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-800">/diretta</code> mostrerà il player.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                <input
                  type="checkbox"
                  checked={diretta.attiva}
                  onChange={e => setDiretta(prev => ({ ...prev, attiva: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
              </label>
            </div>

            {/* STATO DELLA DIRETTA */}
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-slate-700 mb-2">
                Stato Trasmissione
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDiretta(prev => ({ ...prev, stato: 'live', attiva: true }))}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold font-sport uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    diretta.stato === 'live'
                      ? 'bg-red-600 text-white border-red-700 shadow-md ring-2 ring-red-400/30'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${diretta.stato === 'live' ? 'bg-white animate-ping' : 'bg-red-500'}`} />
                  <span>🔴 In Diretta Ora</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDiretta(prev => ({ ...prev, stato: 'in_programma', attiva: true }))}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold font-sport uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    diretta.stato === 'in_programma'
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md ring-2 ring-amber-400/30'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>⏰ In Programma</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDiretta(prev => ({ ...prev, stato: 'terminata' }))}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold font-sport uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    diretta.stato === 'terminata'
                      ? 'bg-slate-800 text-white border-slate-900 shadow-md ring-2 ring-slate-400/30'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>⏹️ Conclusa</span>
                </button>
              </div>
            </div>

            {/* URL YOUTUBE */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold uppercase text-slate-700">
                Link YouTube della Diretta / Video
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={diretta.url_youtube}
                  onChange={e => setDiretta(prev => ({ ...prev, url_youtube: e.target.value }))}
                  placeholder="Incolla il link: https://www.youtube.com/watch?v=... o https://youtu.be/..."
                  className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono transition-colors outline-none pr-10"
                />
                {videoId && (
                  <CheckCircle className="w-4 h-4 text-emerald-500 absolute right-3 top-3" />
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-inter">
                Accetta qualsiasi formato di link YouTube (link normale, link da app smartphone `youtu.be`, diretta `youtube.com/live/...`).
                {videoId && (
                  <span className="text-emerald-700 font-bold ml-1 font-mono">
                    ✓ ID Video riconosciuto: {videoId}
                  </span>
                )}
              </p>
            </div>

            {/* VIDEO PRESENTAZIONE / TEASER ATTESA */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-mono font-bold uppercase text-slate-700 flex items-center justify-between">
                <span>Video Teaser / Presentazione Societaria (Opzionale nell'attesa)</span>
                <span className="text-[9px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Consigliato</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={diretta.url_video_presentazione || ''}
                  onChange={e => setDiretta(prev => ({ ...prev, url_video_presentazione: e.target.value }))}
                  placeholder="Es. https://www.youtube.com/watch?v=... video promo, presentazione o trailer"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono transition-colors outline-none pr-10"
                />
                {teaserVideoId && (
                  <CheckCircle className="w-4 h-4 text-emerald-500 absolute right-3 top-3" />
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-inter">
                Se inserito, gli utenti che aprono la pagina prima dell'inizio della diretta potranno riprodurre questo video mentre vedono il conto alla rovescia e gli sponsor!
              </p>
            </div>

            {/* DETTAGLI PARTITA */}
            <div className="pt-2 border-t border-slate-100 space-y-4">
              <h5 className="text-xs font-bold text-slate-900 uppercase font-sport tracking-wider text-slate-500">
                Informazioni del Match
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">
                    Titolo Partita / Evento
                  </label>
                  <input
                    type="text"
                    value={diretta.titolo}
                    onChange={e => setDiretta(prev => ({ ...prev, titolo: e.target.value }))}
                    placeholder="Es. Serie D Femminile: NVA vs Riviera Volley"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-900 font-inter"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">
                    Categoria Squadra
                  </label>
                  <input
                    type="text"
                    value={diretta.categoria || ''}
                    onChange={e => setDiretta(prev => ({ ...prev, categoria: e.target.value }))}
                    placeholder="Es. Serie D Femminile - Girone C"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-900 font-inter"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">
                    Data e Orario
                  </label>
                  <input
                    type="text"
                    value={diretta.data_ora || ''}
                    onChange={e => setDiretta(prev => ({ ...prev, data_ora: e.target.value }))}
                    placeholder="Es. Sabato 29 Ottobre • Ore 20:30"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-900 font-inter"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">
                    Luogo / Palazzetto
                  </label>
                  <input
                    type="text"
                    value={diretta.luogo || ''}
                    onChange={e => setDiretta(prev => ({ ...prev, luogo: e.target.value }))}
                    placeholder="Es. Palazzetto G. Marabini, Forlì"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-900 font-inter"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">
                  Sottotitolo / Dettagli Aggiuntivi (Opzionale)
                </label>
                <input
                  type="text"
                  value={diretta.sottotitolo || ''}
                  onChange={e => setDiretta(prev => ({ ...prev, sottotitolo: e.target.value }))}
                  placeholder="Es. 4ª Giornata di Campionato Regionale • Ingresso Libero"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-900 font-inter"
                />
              </div>

              {/* SQUADRE E LOGHI UFFICIALI */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <h6 className="text-[11px] font-bold text-slate-800 uppercase font-sport tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                  <span>Squadre e Loghi Ufficiali Scontro Diretto</span>
                </h6>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* SQUADRA CASA */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] uppercase font-mono font-bold text-amber-600 block">
                      Squadra di Casa
                    </span>
                    <input
                      type="text"
                      value={diretta.squadra_casa || ''}
                      onChange={e => setDiretta(prev => ({ ...prev, squadra_casa: e.target.value }))}
                      placeholder="Es. New Volley Academy"
                      className="w-full bg-white border border-slate-300 focus:border-amber-500 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold"
                    />
                    <div className="flex items-center gap-2 pt-1">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                        <img 
                          src={(diretta.logo_casa && diretta.logo_casa !== '/logo.png') ? diretta.logo_casa : OFFICIAL_NVA_LOGO} 
                          alt="Logo Casa" 
                          className="w-full h-full object-contain" 
                        />
                      </div>
                      <input
                        type="text"
                        value={diretta.logo_casa || ''}
                        onChange={e => setDiretta(prev => ({ ...prev, logo_casa: e.target.value }))}
                        placeholder="URL Logo Casa"
                        className="w-full bg-white border border-slate-300 focus:border-amber-500 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-700 font-mono"
                      />
                    </div>
                  </div>

                  {/* SQUADRA OSPITE */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-600 block">
                      Squadra Ospite
                    </span>
                    <input
                      type="text"
                      value={diretta.squadra_ospite || ''}
                      onChange={e => setDiretta(prev => ({ ...prev, squadra_ospite: e.target.value }))}
                      placeholder="Es. FENIX FAENZA RA"
                      className="w-full bg-white border border-slate-300 focus:border-amber-500 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold"
                    />
                    <div className="flex items-center gap-2 pt-1">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                        {diretta.logo_ospite ? (
                          <img src={diretta.logo_ospite} alt="Logo Ospite" className="w-full h-full object-contain" />
                        ) : (
                          <Shield className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <input
                        type="text"
                        value={diretta.logo_ospite || ''}
                        onChange={e => setDiretta(prev => ({ ...prev, logo_ospite: e.target.value }))}
                        placeholder="URL Logo Ospite (da FIPAV o web)"
                        className="w-full bg-white border border-slate-300 focus:border-amber-500 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-700 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTONE SALVATAGGIO */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> : <Save className="w-4 h-4 text-amber-400" />}
                <span>{isSaving ? 'Salvataggio in corso...' : 'Salva Configurazione Diretta'}</span>
              </button>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: ANTEPRIMA & GUIDA PRATICA */}
        <div className="space-y-6">
          
          {/* LIVE EMBED PREVIEW */}
          <div className="bg-white border border-slate-200 p-5 rounded-3xl space-y-4 shadow-sm">
            <h4 className="text-xs font-black text-slate-900 uppercase font-sport tracking-wider flex items-center justify-between">
              <span>📺 Anteprima Player</span>
              {videoId ? (
                <span className="text-[10px] text-emerald-600 font-mono font-bold">Pronto</span>
              ) : (
                <span className="text-[10px] text-slate-400 font-mono">In attesa link</span>
              )}
            </h4>

            <div className="aspect-video w-full rounded-2xl bg-black overflow-hidden border border-slate-200 flex items-center justify-center text-slate-500">
              {videoId ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${videoId}?modestbranding=1`}
                  title="Anteprima YouTube"
                  className="w-full h-full border-0"
                  allowFullScreen
                />
              ) : (
                <div className="text-center p-4 space-y-2">
                  <Video className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-[11px] text-slate-400">
                    Incolla il link di YouTube per vedere l'anteprima del video.
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <span className="font-bold text-slate-900 block font-sport uppercase">
                {diretta.titolo || 'Titolo Partita'}
              </span>
              <p className="text-slate-500 text-[10px]">
                {diretta.categoria} • {diretta.luogo}
              </p>
            </div>
          </div>

          {/* GUIDA RAPIDA PER DOMANI */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-5 rounded-3xl space-y-4 border border-slate-800 shadow-md">
            <div className="flex items-center gap-2 text-amber-400 font-sport font-black uppercase text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Come Usarlo Domani (3 Passi)</span>
            </div>

            <ol className="space-y-3 text-[11px] text-slate-300 list-decimal pl-4">
              <li>
                <b>Avvia lo streaming YouTube</b> dal cellulare o dalla videocamera al palazzetto.
              </li>
              <li>
                <b>Copia il link del video</b> da YouTube, incollalo qui nel campo sopra e metti lo stato su <b>🔴 In Diretta Ora</b>. Clicca <i>Salva</i>.
              </li>
              <li>
                <b>Condividi su Instagram/WhatsApp</b>:
                <br />
                Metti nelle storie Instagram lo sticker link che punta a:
                <br />
                <code className="text-amber-400 font-mono text-[10px] break-all">https://newvolleyacademy.it/diretta</code>
              </li>
            </ol>

            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 italic">
              Chiunque apre il link vedrà la partita e tutti i loghi degli sponsor per 2 ore di fila!
            </div>
          </div>

        </div>

      </form>

    </div>
  );
}
