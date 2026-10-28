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
  MapPin
} from 'lucide-react';
import { 
  DirettaStreaming, 
  DEFAULT_DIRETTA_STREAMING, 
  getDirettaStreaming, 
  salvaDirettaStreaming, 
  extractYouTubeVideoId,
  RosaSquadra 
} from '../../../firebase-societa';

interface TabDirettaStreamingProps {
  squadreAll?: RosaSquadra[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function TabDirettaStreaming({ squadreAll = [], showToast }: TabDirettaStreamingProps) {
  const [diretta, setDiretta] = useState<DirettaStreaming>(DEFAULT_DIRETTA_STREAMING);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getDirettaStreaming()
      .then(d => setDiretta(d))
      .catch(err => {
        console.warn("Errore caricamento diretta:", err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const videoId = extractYouTubeVideoId(diretta.url_youtube);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await salvaDirettaStreaming(diretta);
      showToast("Configurazione diretta streaming salvata con successo!", "success");
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
                  onClick={() => setDiretta(prev => ({ ...prev, stato: 'live' }))}
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
                  onClick={() => setDiretta(prev => ({ ...prev, stato: 'in_programma' }))}
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
