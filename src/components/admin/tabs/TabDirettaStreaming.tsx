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
  Shield,
  Download,
  Layers,
  Flame
} from 'lucide-react';
import { 
  DirettaStreaming, 
  CanaleDiretta,
  DEFAULT_DIRETTA_STREAMING, 
  getDirettaStreaming, 
  salvaDirettaStreaming, 
  extractYouTubeVideoId,
  getProssimaGara,
  ProssimaGara,
  RosaSquadra,
  OFFICIAL_NVA_LOGO,
  getKnownTeamLogo
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
  const [copiedCanale, setCopiedCanale] = useState<string | null>(null);

  // Tab per canale selezionato in modalità doppia diretta ('canale_1' o 'canale_2')
  const [activeChannelKey, setActiveChannelKey] = useState<'canale_1' | 'canale_2'>('canale_1');

  useEffect(() => {
    Promise.all([
      getDirettaStreaming(),
      getProssimaGara("Serie D Maschile"),
      getProssimaGara("Serie D Femminile")
    ]).then(([d, gm, gf]) => {
      // Inizializza i canali se assenti
      const initialized: DirettaStreaming = {
        ...d,
        canale_1: d.canale_1 || {
          id: 'maschile',
          titolo_canale: 'Serie D Maschile',
          attiva: d.attiva,
          stato: d.stato,
          url_youtube: d.url_youtube,
          url_video_presentazione: d.url_video_presentazione || '',
          titolo: d.titolo,
          sottotitolo: d.sottotitolo || '',
          data_ora: d.data_ora || '',
          luogo: d.luogo || '',
          squadra_casa: d.squadra_casa || '',
          squadra_ospite: d.squadra_ospite || '',
          logo_casa: d.logo_casa || '',
          logo_ospite: d.logo_ospite || '',
          categoria: d.categoria || 'Serie D Maschile',
          mostra_chat: d.mostra_chat || false,
          descrizione: d.descrizione || '',
          locandina_url: '/images/locandina_serie_d_maschile.jpg'
        },
        canale_2: d.canale_2 || {
          id: 'femminile',
          titolo_canale: 'Serie D Femminile',
          attiva: false,
          stato: 'in_programma',
          url_youtube: '',
          url_video_presentazione: '',
          titolo: 'Serie D Femminile: New Volley Academy vs CONSAR TEODORA',
          sottotitolo: '4ª Giornata di Campionato Regionale FIPAV - Girone C',
          squadra_casa: 'New Volley Academy',
          squadra_ospite: 'CONSAR TEODORA',
          logo_casa: OFFICIAL_NVA_LOGO,
          logo_ospite: '/images/teams/teodora-ravenna.png',
          categoria: 'Serie D Femminile',
          luogo: 'Centro Polisportivo Giulianini — Via XIII Novembre 129, Villafranca di Forlì',
          data_ora: '06/11/26 21:15',
          mostra_chat: false,
          descrizione: 'Guarda la partita di Serie D Femminile in diretta streaming!',
          locandina_url: '/images/locandina_serie_d_femminile.jpg'
        }
      };
      setDiretta(initialized);
      setGaraMaschile(gm);
      setGaraFemminile(gf);
    }).catch(err => {
      console.warn("Errore caricamento dati diretta:", err);
    }).finally(() => setIsLoading(false));
  }, []);

  const isDoppia = Boolean(diretta.doppia_diretta);

  // Canali correnti con fallback sicuri
  const c1: CanaleDiretta = diretta.canale_1 || {
    id: 'maschile',
    titolo_canale: 'Serie D Maschile',
    attiva: diretta.attiva,
    stato: diretta.stato,
    url_youtube: diretta.url_youtube,
    url_video_presentazione: diretta.url_video_presentazione || '',
    titolo: diretta.titolo,
    sottotitolo: diretta.sottotitolo || '',
    data_ora: diretta.data_ora || '',
    luogo: diretta.luogo || '',
    squadra_casa: diretta.squadra_casa || '',
    squadra_ospite: diretta.squadra_ospite || '',
    logo_casa: diretta.logo_casa || '',
    logo_ospite: diretta.logo_ospite || '',
    categoria: diretta.categoria || 'Serie D Maschile',
    mostra_chat: diretta.mostra_chat || false,
    descrizione: diretta.descrizione || '',
    locandina_url: '/images/locandina_serie_d_maschile.jpg'
  };

  const c2: CanaleDiretta = diretta.canale_2 || {
    id: 'femminile',
    titolo_canale: 'Serie D Femminile',
    attiva: false,
    stato: 'in_programma',
    url_youtube: '',
    url_video_presentazione: '',
    titolo: 'Serie D Femminile: New Volley Academy vs CONSAR TEODORA',
    sottotitolo: '4ª Giornata di Campionato Regionale FIPAV - Girone C',
    squadra_casa: 'New Volley Academy',
    squadra_ospite: 'CONSAR TEODORA',
    logo_casa: OFFICIAL_NVA_LOGO,
    logo_ospite: '/images/teams/teodora-ravenna.png',
    categoria: 'Serie D Femminile',
    luogo: 'Centro Polisportivo Giulianini — Via XIII Novembre 129, Villafranca di Forlì',
    data_ora: '06/11/26 21:15',
    mostra_chat: false,
    descrizione: 'Guarda la partita di Serie D Femminile in diretta streaming!',
    locandina_url: '/images/locandina_serie_d_femminile.jpg'
  };

  // Riferimento al canale correntemente visualizzato/modificato
  const currentCanale: CanaleDiretta = isDoppia ? (activeChannelKey === 'canale_2' ? c2 : c1) : {
    id: 'singolo',
    titolo_canale: diretta.categoria || 'Partita Live',
    attiva: diretta.attiva,
    stato: diretta.stato,
    url_youtube: diretta.url_youtube,
    url_video_presentazione: diretta.url_video_presentazione || '',
    titolo: diretta.titolo,
    sottotitolo: diretta.sottotitolo || '',
    data_ora: diretta.data_ora || '',
    luogo: diretta.luogo || '',
    squadra_casa: diretta.squadra_casa || '',
    squadra_ospite: diretta.squadra_ospite || '',
    logo_casa: diretta.logo_casa || '',
    logo_ospite: diretta.logo_ospite || '',
    categoria: diretta.categoria || '',
    mostra_chat: diretta.mostra_chat || false,
    descrizione: diretta.descrizione || '',
    locandina_url: diretta.locandina_url || (diretta.categoria?.toLowerCase().includes('femm') ? '/images/locandina_serie_d_femminile.jpg' : '/images/locandina_serie_d_maschile.jpg')
  };

  const updateCurrentCanale = (patch: Partial<CanaleDiretta>) => {
    if (!isDoppia) {
      setDiretta(prev => ({ ...prev, ...patch }));
    } else {
      if (activeChannelKey === 'canale_1') {
        const updatedC1 = { ...c1, ...patch };
        setDiretta(prev => ({
          ...prev,
          canale_1: updatedC1,
          url_youtube: updatedC1.url_youtube || prev.url_youtube,
          titolo: updatedC1.titolo || prev.titolo,
          categoria: updatedC1.categoria || prev.categoria,
          attiva: Boolean(updatedC1.attiva || c2.attiva),
          stato: (updatedC1.stato === 'live' || c2.stato === 'live') ? 'live' : (updatedC1.stato === 'in_programma' || c2.stato === 'in_programma') ? 'in_programma' : 'terminata'
        }));
      } else {
        const updatedC2 = { ...c2, ...patch };
        setDiretta(prev => ({
          ...prev,
          canale_2: updatedC2,
          attiva: Boolean(c1.attiva || updatedC2.attiva),
          stato: (c1.stato === 'live' || updatedC2.stato === 'live') ? 'live' : (c1.stato === 'in_programma' || updatedC2.stato === 'in_programma') ? 'in_programma' : 'terminata'
        }));
      }
    }
  };

  const videoId = extractYouTubeVideoId(currentCanale.url_youtube);
  const teaserVideoId = extractYouTubeVideoId(currentCanale.url_video_presentazione);

  const handleImportMatchData = (gara: ProssimaGara) => {
    const isCasa = gara.casa ?? true;
    const isMaschile = gara.categoria === 'Serie D Maschile';
    const titoloDefault = `${gara.categoria}: ${isCasa ? 'New Volley Academy vs ' + gara.avversario : gara.avversario + ' vs New Volley Academy'}`;
    const sottotitoloDefault = `${gara.giornata || 'Campionato FIPAV'} • ${isCasa ? 'In Casa al Palazzetto' : 'In Trasferta'}`;
    
    const myLogo = OFFICIAL_NVA_LOGO;
    const oppLogo = gara.logo_avversario || getKnownTeamLogo(gara.avversario) || '';

    const patch: Partial<CanaleDiretta> = {
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
      stato: 'in_programma',
      locandina_url: isMaschile ? '/images/locandina_serie_d_maschile.jpg' : '/images/locandina_serie_d_femminile.jpg'
    };

    if (isDoppia) {
      if (isMaschile) {
        setActiveChannelKey('canale_1');
        const updatedC1 = { ...c1, ...patch };
        setDiretta(prev => ({
          ...prev,
          canale_1: updatedC1,
          url_youtube: updatedC1.url_youtube || prev.url_youtube,
          titolo: updatedC1.titolo || prev.titolo,
          attiva: true
        }));
      } else {
        setActiveChannelKey('canale_2');
        const updatedC2 = { ...c2, ...patch };
        setDiretta(prev => ({
          ...prev,
          canale_2: updatedC2,
          attiva: true
        }));
      }
    } else {
      setDiretta(prev => ({
        ...prev,
        ...patch,
        attiva: true
      }));
    }
    showToast(`Dati e loghi di ${gara.categoria} caricati! Clicca "Salva" per confermare.`, "success");
  };

  const handleToggleAttiva = async (newAttiva: boolean) => {
    let updated: DirettaStreaming;
    if (isDoppia) {
      if (activeChannelKey === 'canale_1') {
        const updatedC1 = { ...c1, attiva: newAttiva };
        updated = {
          ...diretta,
          canale_1: updatedC1,
          attiva: Boolean(newAttiva || c2.attiva)
        };
      } else {
        const updatedC2 = { ...c2, attiva: newAttiva };
        updated = {
          ...diretta,
          canale_2: updatedC2,
          attiva: Boolean(c1.attiva || newAttiva)
        };
      }
    } else {
      updated = { ...diretta, attiva: newAttiva };
    }
    setDiretta(updated);
    try {
      await salvaDirettaStreaming(updated);
      showToast(
        newAttiva 
          ? "✅ Canale streaming ATTIVATO sul sito!" 
          : "⏸️ Canale streaming DISATTIVATO.",
        "success"
      );
    } catch (err: any) {
      console.error(err);
      showToast("Errore durante il salvataggio: " + (err.message || ''), "error");
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const payload: DirettaStreaming = {
        ...diretta,
        canale_1: c1,
        canale_2: c2,
        attiva: isDoppia ? Boolean(c1.attiva || c2.attiva) : Boolean(diretta.attiva),
        stato: isDoppia ? ((c1.stato === 'live' || c2.stato === 'live') ? 'live' : (c1.stato === 'in_programma' || c2.stato === 'in_programma') ? 'in_programma' : 'terminata') : diretta.stato,
        url_youtube: isDoppia ? (c1.url_youtube || c2.url_youtube || diretta.url_youtube) : diretta.url_youtube,
        titolo: isDoppia ? (c1.titolo || diretta.titolo) : diretta.titolo
      };
      await salvaDirettaStreaming(payload);
      showToast(
        payload.attiva 
          ? "Configurazione salvata: la diretta è ATTIVA sul sito!" 
          : "Configurazione salvata: la diretta è DISATTIVA (nessun banner visibile).", 
        "success"
      );
    } catch (err: any) {
      console.error(err);
      showToast("Errore durante il salvataggio della diretta: " + (err.message || ''), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyPublicUrl = (channelParam?: string) => {
    const url = channelParam 
      ? `${window.location.origin}/diretta?canale=${channelParam}`
      : `${window.location.origin}/diretta`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setCopiedCanale(channelParam || 'all');
      setTimeout(() => {
        setCopied(false);
        setCopiedCanale(null);
      }, 2500);
      showToast(`Link ${channelParam ? `canale ${channelParam}` : 'diretta'} copiato negli appunti!`, "info");
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

            {/* 1.8 SELETTORE MODALITÀ DIRETTA (SINGOLA VS DOPPIA SIMULTANEA) */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-sport font-black uppercase text-sm tracking-wider text-white">
              Modalità Diretta Streaming
            </h4>
            <p className="text-[11px] text-slate-400 font-inter">
              Scegli se gestire un singolo canale o due dirette simultanee con schede e link indipendenti.
            </p>
          </div>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setDiretta(prev => ({ ...prev, doppia_diretta: false }))}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-sport uppercase tracking-wider transition-all cursor-pointer ${
              !isDoppia 
                ? 'bg-amber-400 text-slate-950 shadow-md ring-1 ring-amber-400' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📺 Singola Diretta
          </button>
          <button
            type="button"
            onClick={() => setDiretta(prev => ({ ...prev, doppia_diretta: true }))}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-sport uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              isDoppia 
                ? 'bg-amber-400 text-slate-950 shadow-md ring-1 ring-amber-400' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span>⚡ Doppia Diretta</span>
          </button>
        </div>
      </div>

      {/* SCHEDE CANALI SEPARATI (QUANDO DOPPIA DIRETTA È ATTIVA) */}
      {isDoppia && (
        <div className="space-y-3 bg-slate-900/40 p-4 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-red-500" />
              Due Canali Indipendenti (Due Telefoni / Due Link Dedicati)
            </span>
            <span className="text-[10px] text-slate-400 font-inter hidden sm:inline">
              Fai clic sulla scheda per regolare il link YouTube e i dettagli del rispettivo match
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* CANALE 1 (MASCHILE) */}
            <button
              type="button"
              onClick={() => setActiveChannelKey('canale_1')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                activeChannelKey === 'canale_1'
                  ? 'bg-slate-900 border-amber-400 ring-2 ring-amber-400/30 text-white shadow-lg'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`font-sport font-black uppercase text-xs tracking-wider flex items-center gap-1.5 ${
                  activeChannelKey === 'canale_1' ? 'text-amber-400' : 'text-slate-900'
                }`}>
                  🏐 Canale 1: {c1.titolo_canale || 'Serie D Maschile'}
                </span>
                {c1.attiva ? (
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                    ONLINE
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                    OFF
                  </span>
                )}
              </div>
              <div className={`text-xs font-bold truncate ${activeChannelKey === 'canale_1' ? 'text-slate-200' : 'text-slate-700'}`}>
                {c1.titolo || 'Serie D Maschile'}
              </div>
              <div className="text-[10px] text-slate-400 flex items-center justify-between mt-2 pt-2 border-t border-slate-700/40">
                <span className="truncate">{c1.data_ora || 'Ore 21:30'}</span>
                <span className="font-mono text-amber-400 font-bold">/diretta?canale=maschile</span>
              </div>
            </button>

            {/* CANALE 2 (FEMMINILE) */}
            <button
              type="button"
              onClick={() => setActiveChannelKey('canale_2')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                activeChannelKey === 'canale_2'
                  ? 'bg-slate-900 border-amber-400 ring-2 ring-amber-400/30 text-white shadow-lg'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`font-sport font-black uppercase text-xs tracking-wider flex items-center gap-1.5 ${
                  activeChannelKey === 'canale_2' ? 'text-amber-400' : 'text-slate-900'
                }`}>
                  🏐 Canale 2: {c2.titolo_canale || 'Serie D Femminile'}
                </span>
                {c2.attiva ? (
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                    ONLINE
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                    OFF
                  </span>
                )}
              </div>
              <div className={`text-xs font-bold truncate ${activeChannelKey === 'canale_2' ? 'text-slate-200' : 'text-slate-700'}`}>
                {c2.titolo || 'Serie D Femminile'}
              </div>
              <div className="text-[10px] text-slate-400 flex items-center justify-between mt-2 pt-2 border-t border-slate-700/40">
                <span className="truncate">{c2.data_ora || 'Ore 21:15'}</span>
                <span className="font-mono text-amber-400 font-bold">/diretta?canale=femminile</span>
              </div>
            </button>
          </div>

          {/* BANNER LINK DIRETTO E DOWNLOAD LOCANDINA DEL CANALE ATTIVO */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300">
                Link Condivisione {activeChannelKey === 'canale_1' ? 'Serie D Maschile' : 'Serie D Femminile'}:
              </span>
              <code className="text-amber-400 font-mono text-xs bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                https://newvolleyacademy.it/diretta?canale={activeChannelKey === 'canale_1' ? 'maschile' : 'femminile'}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopyPublicUrl(activeChannelKey === 'canale_1' ? 'maschile' : 'femminile')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer border border-slate-700"
              >
                {copiedCanale === (activeChannelKey === 'canale_1' ? 'maschile' : 'femminile') ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>Copia Link Canale</span>
              </button>
              <a
                href={activeChannelKey === 'canale_1' ? '/images/locandina_serie_d_maschile.jpg' : '/images/locandina_serie_d_femminile.jpg'}
                download={activeChannelKey === 'canale_1' ? 'locandina_serie_d_maschile.jpg' : 'locandina_serie_d_femminile.jpg'}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Scarica Locandina YouTube (16:9 HD)</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 2. FORM CONFIGURAZIONE */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: CONTROLLI PRINCIPALI */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-base font-extrabold text-slate-900 uppercase font-sport tracking-wider flex items-center gap-2">
                <Tv className="w-4 h-4 text-amber-500" />
                <span>
                  {isDoppia 
                    ? `Regolazione: ${activeChannelKey === 'canale_1' ? '🏐 Canale 1 (Serie D Maschile)' : '🏐 Canale 2 (Serie D Femminile)'}`
                    : 'Parametri Trasmissione YouTube'}
                </span>
              </h4>
              {isDoppia && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                  Scheda Indipendente {activeChannelKey === 'canale_1' ? '#1' : '#2'}
                </span>
              )}
            </div>

            {/* SWITCH ATTIVAZIONE CANALE */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <span className="font-bold text-slate-900 text-xs block">
                  {isDoppia 
                    ? `Attiva questo canale (${activeChannelKey === 'canale_1' ? 'Maschile' : 'Femminile'}) sul Sito` 
                    : 'Attiva Diretta Streaming sul Sito'}
                </span>
                <p className="text-[11px] text-slate-500 font-inter">
                  Se attivo, la diretta risulterà visibile sul sito e nella pagina <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-800">/diretta</code>.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                <input
                  type="checkbox"
                  checked={Boolean(currentCanale.attiva)}
                  onChange={e => handleToggleAttiva(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
              </label>
            </div>

            {/* STATO DELLA DIRETTA */}
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-slate-700 mb-2">
                Stato Trasmissione {isDoppia ? (activeChannelKey === 'canale_1' ? 'Canale 1' : 'Canale 2') : ''}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    updateCurrentCanale({ stato: 'live', attiva: true });
                    showToast("🔴 Canale impostato su 'IN DIRETTA ORA'!", "success");
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold font-sport uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    currentCanale.stato === 'live' && currentCanale.attiva
                      ? 'bg-red-600 text-white border-red-700 shadow-md ring-2 ring-red-400/30'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${currentCanale.stato === 'live' && currentCanale.attiva ? 'bg-white animate-ping' : 'bg-red-500'}`} />
                  <span>🔴 In Diretta</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateCurrentCanale({ stato: 'in_programma', attiva: true });
                    showToast("⏰ Canale impostato su 'IN PROGRAMMA'!", "success");
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold font-sport uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    currentCanale.stato === 'in_programma' && currentCanale.attiva
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md ring-2 ring-amber-400/30'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>⏰ In Programma</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateCurrentCanale({ stato: 'terminata', attiva: false });
                    showToast("⏹️ Canale impostato su 'CONCLUSA'.", "info");
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold font-sport uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    currentCanale.stato === 'terminata' || !currentCanale.attiva
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
                Link YouTube della Diretta / Video {isDoppia ? `(${activeChannelKey === 'canale_1' ? 'Telefono Maschile' : 'Telefono Femminile'})` : ''}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={currentCanale.url_youtube || ''}
                  onChange={e => updateCurrentCanale({ url_youtube: e.target.value })}
                  placeholder="Incolla il link YouTube della diretta per questa partita..."
                  className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono transition-colors outline-none pr-10"
                />
                {videoId && (
                  <CheckCircle className="w-4 h-4 text-emerald-500 absolute right-3 top-3" />
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-inter">
                Accetta qualsiasi formato di link YouTube (link da app cellulare `youtu.be`, `youtube.com/watch?v=...`, `youtube.com/live/...`).
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
                  value={currentCanale.url_video_presentazione || ''}
                  onChange={e => updateCurrentCanale({ url_video_presentazione: e.target.value })}
                  placeholder="Es. https://www.youtube.com/watch?v=... video promo, presentazione o trailer"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono transition-colors outline-none pr-10"
                />
                {teaserVideoId && (
                  <CheckCircle className="w-4 h-4 text-emerald-500 absolute right-3 top-3" />
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-inter">
                Se inserito, gli utenti prima dell'inizio potranno riprodurre questo video mentre vedono il conto alla rovescia e gli sponsor!
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
                    value={currentCanale.titolo || ''}
                    onChange={e => updateCurrentCanale({ titolo: e.target.value })}
                    placeholder="Es. Serie D: NVA vs Avversario"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-900 font-inter"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">
                    Categoria Squadra
                  </label>
                  <input
                    type="text"
                    value={currentCanale.categoria || ''}
                    onChange={e => updateCurrentCanale({ categoria: e.target.value })}
                    placeholder="Es. Serie D Maschile - Girone B"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-900 font-inter"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">
                    Data e Orario
                  </label>
                  <input
                    type="text"
                    value={currentCanale.data_ora || ''}
                    onChange={e => updateCurrentCanale({ data_ora: e.target.value })}
                    placeholder="Es. Venerdì 6 Novembre • Ore 21:30"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-900 font-inter"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">
                    Luogo / Palazzetto
                  </label>
                  <input
                    type="text"
                    value={currentCanale.luogo || ''}
                    onChange={e => updateCurrentCanale({ luogo: e.target.value })}
                    placeholder="Es. Palazzetto Villaggio del Fanciullo, Bologna"
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
                  value={currentCanale.sottotitolo || ''}
                  onChange={e => updateCurrentCanale({ sottotitolo: e.target.value })}
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
                      value={currentCanale.squadra_casa || ''}
                      onChange={e => updateCurrentCanale({ squadra_casa: e.target.value })}
                      placeholder="Es. CPMI SAVENA VOLLEY"
                      className="w-full bg-white border border-slate-300 focus:border-amber-500 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold"
                    />
                    <div className="flex items-center gap-2 pt-1">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                        {((currentCanale.logo_casa && currentCanale.logo_casa !== '/logo.png') || getKnownTeamLogo(currentCanale.squadra_casa)) ? (
                          <img 
                            src={(currentCanale.logo_casa && currentCanale.logo_casa !== '/logo.png') ? currentCanale.logo_casa : getKnownTeamLogo(currentCanale.squadra_casa)} 
                            alt="Logo Casa" 
                            className="w-full h-full object-contain" 
                          />
                        ) : (
                          <Shield className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <input
                        type="text"
                        value={currentCanale.logo_casa || ''}
                        onChange={e => updateCurrentCanale({ logo_casa: e.target.value })}
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
                      value={currentCanale.squadra_ospite || ''}
                      onChange={e => updateCurrentCanale({ squadra_ospite: e.target.value })}
                      placeholder="Es. New Volley Academy"
                      className="w-full bg-white border border-slate-300 focus:border-amber-500 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold"
                    />
                    <div className="flex items-center gap-2 pt-1">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                        {((currentCanale.logo_ospite && currentCanale.logo_ospite !== '/logo.png') || getKnownTeamLogo(currentCanale.squadra_ospite)) ? (
                          <img 
                            src={(currentCanale.logo_ospite && currentCanale.logo_ospite !== '/logo.png') ? currentCanale.logo_ospite : getKnownTeamLogo(currentCanale.squadra_ospite)} 
                            alt="Logo Ospite" 
                            className="w-full h-full object-contain" 
                          />
                        ) : (
                          <Shield className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <input
                        type="text"
                        value={currentCanale.logo_ospite || ''}
                        onChange={e => updateCurrentCanale({ logo_ospite: e.target.value })}
                        placeholder="URL Logo Ospite"
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
                <span>{isSaving ? 'Salvataggio in corso...' : 'Salva Tutte le Configurazioni Diretta'}</span>
              </button>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: ANTEPRIMA & GUIDA PRATICA */}
        <div className="space-y-6">
          
          {/* LIVE EMBED PREVIEW */}
          <div className="bg-white border border-slate-200 p-5 rounded-3xl space-y-4 shadow-sm">
            <h4 className="text-xs font-black text-slate-900 uppercase font-sport tracking-wider flex items-center justify-between">
              <span>📺 Anteprima Player {isDoppia ? `(${activeChannelKey === 'canale_1' ? 'Canale 1' : 'Canale 2'})` : ''}</span>
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
                {currentCanale.titolo || 'Titolo Partita'}
              </span>
              <p className="text-slate-500 text-[10px]">
                {currentCanale.categoria} • {currentCanale.luogo}
              </p>
            </div>
          </div>

          {/* GUIDA RAPIDA PER LE DUE DIRETTE */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-5 rounded-3xl space-y-4 border border-slate-800 shadow-md">
            <div className="flex items-center gap-2 text-amber-400 font-sport font-black uppercase text-sm">
              <Sparkles className="w-4 h-4" />
              <span>{isDoppia ? 'Guida 2 Telefoni Simultanei' : 'Come Usarlo Domani (3 Passi)'}</span>
            </div>

            {isDoppia ? (
              <ol className="space-y-3 text-[11px] text-slate-300 list-decimal pl-4">
                <li>
                  <b>Due Telefoni con l'app YouTube</b> sullo stesso canale NVA: ogni telefono avvia una live streaming distinta (es. Telefono A a Bologna per il Maschile, Telefono B a Villafranca per il Femminile).
                </li>
                <li>
                  <b>Incolla i due link nelle rispettive schede</b>:
                  <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-400">
                    <li>Scheda <b>Canale 1</b> ➔ incolla link live Maschile</li>
                    <li>Scheda <b>Canale 2</b> ➔ incolla link live Femminile</li>
                  </ul>
                </li>
                <li>
                  <b>Condividi i link dedicati</b>:
                  <br />
                  Storie Maschile: <code className="text-amber-400 font-mono text-[10px]">/diretta?canale=maschile</code>
                  <br />
                  Storie Femminile: <code className="text-amber-400 font-mono text-[10px]">/diretta?canale=femminile</code>
                </li>
              </ol>
            ) : (
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
                  Metti nelle storie lo sticker link che punta a <code className="text-amber-400 font-mono text-[10px]">/diretta</code>.
                </li>
              </ol>
            )}

            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 italic">
              Entrambe le partite offriranno massima visibilità agli sponsor e permetteranno a tutti i tifosi di seguire le nostre pantere!
            </div>
          </div>

        </div>

      </form>
    </div>
  );
}
