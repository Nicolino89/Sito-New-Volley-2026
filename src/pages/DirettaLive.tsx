import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, 
  Radio, 
  Share2, 
  Copy, 
  Check, 
  MapPin, 
  Calendar, 
  Clock, 
  ExternalLink, 
  ArrowLeft,
  Shield,
  MessageCircle,
  Sparkles,
  Tv,
  CalendarPlus,
  RefreshCw,
  Film,
  Volume2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  DirettaStreaming, 
  DEFAULT_DIRETTA_STREAMING, 
  getDirettaStreaming, 
  extractYouTubeVideoId,
  parseMatchDateTime,
  Sponsor,
  SocietaInfo 
} from '../firebase-societa';

interface DirettaLiveProps {
  sponsorsAll?: Sponsor[];
  societaInfo?: SocietaInfo | null;
}

interface TimeRemaining {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

function calculateTimeRemaining(targetDate: Date | null): TimeRemaining {
  if (!targetDate) {
    return { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false };
  }
  const now = new Date().getTime();
  const diff = targetDate.getTime() - now;
  if (diff <= 0) {
    return { totalMs: diff, days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }
  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return { totalMs: diff, days, hours, minutes, seconds, isPast: false };
}

export default function DirettaLive({ sponsorsAll = [], societaInfo }: DirettaLiveProps) {
  const [diretta, setDiretta] = useState<DirettaStreaming>(DEFAULT_DIRETTA_STREAMING);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTabMedia, setActiveTabMedia] = useState<'live' | 'teaser'>('live');
  const [nowTick, setNowTick] = useState(Date.now());

  // Caricamento iniziale configurazione diretta streaming
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "🔴 Diretta Streaming Match | New Volley Academy Forlì";

    const fetchDiretta = () => {
      getDirettaStreaming()
        .then(d => {
          setDiretta(d);
          // Se siamo in attesa e c'è un video teaser, impostiamolo inizialmente se lo stream live non è ancora iniziato
          if (d.stato === 'in_programma' && d.url_video_presentazione && !d.url_youtube) {
            setActiveTabMedia('teaser');
          }
        })
        .catch(err => console.warn("Errore caricamento diretta:", err))
        .finally(() => setIsLoading(false));
    };

    fetchDiretta();

    // Polling automatico ogni 35 secondi: se l'admin avvia il live durante l'attesa, la pagina si aggiorna istantaneamente
    const pollInterval = setInterval(fetchDiretta, 35000);
    return () => clearInterval(pollInterval);
  }, []);

  // Timer countdown al secondo
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const targetMatchDate = useMemo(() => {
    return parseMatchDateTime(diretta.data_ora);
  }, [diretta.data_ora]);

  const timeLeft = useMemo(() => {
    return calculateTimeRemaining(targetMatchDate);
  }, [targetMatchDate, nowTick]);

  const liveVideoId = extractYouTubeVideoId(diretta.url_youtube);
  const teaserVideoId = extractYouTubeVideoId(diretta.url_video_presentazione);

  const isLiveNow = diretta.stato === 'live';
  const isInProgramma = diretta.stato === 'in_programma';

  const handleCopyLink = () => {
    const url = window.location.origin + '/diretta';
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  const handleShareWhatsapp = () => {
    const text = encodeURIComponent(
      `🏐 Guarda la partita della New Volley Academy in diretta streaming!\n🔴 ${diretta.titolo}\n📅 ${diretta.data_ora || 'Oggi'}\n📍 ${diretta.luogo || 'Palazzetto'}\nSegui la diretta su: ${window.location.origin}/diretta`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Genera link Google Calendar per promemoria partita
  const googleCalendarUrl = useMemo(() => {
    if (!targetMatchDate) return null;
    const startIso = targetMatchDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endDate = new Date(targetMatchDate.getTime() + 2 * 60 * 60 * 1000); // +2 ore stimate
    const endIso = endDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const title = encodeURIComponent(`🏐 Volley: ${diretta.titolo || 'Partita New Volley Academy'}`);
    const details = encodeURIComponent(
      `Diretta streaming ufficiale su: ${window.location.origin}/diretta\n${diretta.sottotitolo || ''}`
    );
    const location = encodeURIComponent(diretta.luogo || 'Palazzetto dello Sport');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
  }, [targetMatchDate, diretta.titolo, diretta.sottotitolo, diretta.luogo]);

  // Suddivisione Sponsor per vetrina sostenitori
  const mainSponsors = sponsorsAll.filter(s => s.attivo !== false && (s.tipologia === 'Main Sponsor' || s.tipologia?.toLowerCase().includes('main')));
  const goldSponsors = sponsorsAll.filter(s => s.attivo !== false && (s.tipologia === 'Gold Partner' || s.tipologia?.toLowerCase().includes('gold')));
  const otherSponsors = sponsorsAll.filter(s => s.attivo !== false && !mainSponsors.includes(s) && !goldSponsors.includes(s));

  // Squadre Casa vs Ospite
  const nomeCasa = diretta.squadra_casa || 'New Volley Academy';
  const nomeOspite = diretta.squadra_ospite || 'Squadra Avversaria';
  const isNvaCasa = nomeCasa.toLowerCase().includes('new volley') || nomeCasa.toLowerCase().includes('nva');
  const isFenixCasa = nomeCasa.toUpperCase().includes('FENIX');
  const isFenixOspite = nomeOspite.toUpperCase().includes('FENIX');

  // Risoluzione intelligente loghi (NVA ufficiale + avversari come FENIX FAENZA)
  const logoCasaEffective = diretta.logo_casa || (isNvaCasa ? '/logo.png' : isFenixCasa ? 'https://www.pallavolofaenza.com/site_img/logo.png' : '');
  const logoOspiteEffective = diretta.logo_ospite || (!isNvaCasa ? '/logo.png' : isFenixOspite ? 'https://www.pallavolofaenza.com/site_img/logo.png' : '');

  return (
    <div className="min-h-screen bg-slate-950 text-white font-inter pb-20 selection:bg-amber-400 selection:text-slate-950">
      
      {/* 1. TOP LIVE BROADCAST TICKER */}
      <div className="bg-slate-900/90 border-b border-slate-800 py-3 px-4 sm:px-6 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Torna al Sito Ufficiale</span>
          </Link>

          <div className="flex items-center gap-2">
            {isLiveNow ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black uppercase font-sport tracking-wider animate-pulse shadow-lg shadow-red-600/30">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <Radio className="w-3.5 h-3.5" />
                <span>IN DIRETTA ORA</span>
              </span>
            ) : isInProgramma ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase font-sport tracking-wider">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>PRE-MATCH • IN ATTESA</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-bold uppercase font-sport tracking-wider">
                <span>ARCHIVIO MATCH</span>
              </span>
            )}
            
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
              New Volley Academy Live Channel
            </span>
          </div>
        </div>
      </div>

      {/* 2. MATCH DAY ARENA CLASH HEADER */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-b border-slate-800/80 pt-8 pb-10 px-4 sm:px-6">
        
        {/* Glow sportivo di sfondo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10 space-y-6">
          
          {/* Badge Categoria e Competizione */}
          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-400 text-xs font-sport uppercase tracking-wider font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{diretta.categoria || 'Match Ufficiale FIPAV'}</span>
            </span>
            {diretta.sottotitolo && (
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                • {diretta.sottotitolo}
              </span>
            )}
          </div>

          {/* SCONTRO DIRETTO: SQUADRA CASA vs SQUADRA OSPITE */}
          <div className="grid grid-cols-1 sm:grid-cols-7 items-center gap-4 sm:gap-2 text-center py-2">
            
            {/* SQUADRA CASA */}
            <div className="sm:col-span-3 flex flex-col items-center sm:items-end space-y-2">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900 border border-slate-700/80 p-2 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform overflow-hidden">
                {logoCasaEffective ? (
                  <img 
                    src={logoCasaEffective} 
                    alt={nomeCasa} 
                    className="w-full h-full object-contain filter drop-shadow"
                    onError={(e)=>{ 
                      if (isNvaCasa) {
                        (e.target as any).src = '/logo.png';
                      } else {
                        (e.target as any).style.display = 'none';
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 font-sport font-black uppercase text-center p-1 leading-none text-xs">
                    <Shield className="w-8 h-8 mb-1 text-slate-500" />
                    <span className="truncate max-w-full text-[9px]">{nomeCasa.slice(0, 6)}</span>
                  </div>
                )}
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-black font-sport uppercase tracking-wide text-white leading-tight">
                {nomeCasa}
              </h2>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-md">
                CASA
              </span>
            </div>

            {/* EMBLEMA "VS" CENTRALE */}
            <div className="sm:col-span-1 flex flex-col items-center justify-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black font-sport italic text-base flex items-center justify-center shadow-lg shadow-amber-500/25 ring-4 ring-slate-950">
                VS
              </div>
            </div>

            {/* SQUADRA OSPITE */}
            <div className="sm:col-span-3 flex flex-col items-center sm:items-start space-y-2">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900 border border-slate-700/80 p-2 flex items-center justify-center shadow-lg overflow-hidden">
                {logoOspiteEffective ? (
                  <img 
                    src={logoOspiteEffective} 
                    alt={nomeOspite} 
                    className="w-full h-full object-contain filter drop-shadow"
                    onError={(e)=>{ 
                      if (!isNvaCasa) {
                        (e.target as any).src = '/logo.png';
                      } else {
                        (e.target as any).style.display = 'none';
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 font-sport font-black uppercase text-center p-1 leading-none text-xs">
                    <Shield className="w-8 h-8 mb-1 text-slate-500" />
                    <span className="truncate max-w-full text-[9px]">{nomeOspite.slice(0, 6)}</span>
                  </div>
                )}
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-black font-sport uppercase tracking-wide text-white leading-tight">
                {nomeOspite}
              </h2>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-md">
                OSPITE
              </span>
            </div>

          </div>

          {/* DETTAGLI CAMPO & ORARIO */}
          {(diretta.luogo || diretta.data_ora) && (
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-300 pt-1">
              {diretta.data_ora && (
                <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 rounded-xl">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-white">{diretta.data_ora}</span>
                </div>
              )}
              {diretta.luogo && (
                <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 rounded-xl">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>{diretta.luogo}</span>
                </div>
              )}
            </div>
          )}

          {/* 3. COUNTDOWN BOX AL MATCH (SE IN PROGRAMMA O IN ATTESA) */}
          {isInProgramma && targetMatchDate && !timeLeft.isPast && (
            <div className="mt-4 p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-amber-500/30 shadow-2xl space-y-3">
              <div className="text-center space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  COUNTDOWN AL FISCHIO D'INIZIO
                </span>
                <p className="text-xs text-slate-400">
                  La diretta streaming inizierà a ridosso della partita. Rimani collegato su questa pagina!
                </p>
              </div>

              {/* GRIGLIA CIFRE COUNTDOWN */}
              <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-md mx-auto pt-1">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 sm:p-3 text-center">
                  <span className="block text-2xl sm:text-3xl font-black font-sport text-amber-400">
                    {String(timeLeft.days).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Giorni
                  </span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 sm:p-3 text-center">
                  <span className="block text-2xl sm:text-3xl font-black font-sport text-amber-400">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Ore
                  </span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 sm:p-3 text-center">
                  <span className="block text-2xl sm:text-3xl font-black font-sport text-amber-400">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Minuti
                  </span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 sm:p-3 text-center">
                  <span className="block text-2xl sm:text-3xl font-black font-sport text-white animate-pulse">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Secondi
                  </span>
                </div>
              </div>

              {/* Tasto Google Calendar */}
              {googleCalendarUrl && (
                <div className="pt-2 text-center">
                  <a
                    href={googleCalendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Aggiungi al tuo Google Calendar</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* AVVISO SE ORARIO TRASCORSO MA STREAM NON ANCORA SEGNATO COME LIVE */}
          {isInProgramma && targetMatchDate && timeLeft.isPast && (
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-center space-y-1 animate-pulse">
              <span className="font-sport font-black uppercase text-amber-300 text-sm tracking-wider flex items-center justify-center gap-1.5">
                <Radio className="w-4 h-4 text-amber-400" />
                ORARIO PARTITA RAGGIUNTO • COLLEGAMENTO IN CORSO
              </span>
              <p className="text-xs text-slate-300">
                La squadra è in campo per il riscaldamento. Il segnale streaming live apparirà a breve nel player!
              </p>
            </div>
          )}

        </div>
      </div>

      {/* 4. PLAYER CONTAINER & MULTIMEDIA TABS */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* CONTROLLO TABS SE È PRESENTE IL VIDEO DI PRESENTAZIONE */}
        {teaserVideoId && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setActiveTabMedia('live')}
              className={`px-4 py-2 rounded-xl text-xs font-black font-sport uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                activeTabMedia === 'live' 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' 
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{isLiveNow ? 'Canale Diretta Live' : 'Player Partita'}</span>
            </button>

            <button
              onClick={() => setActiveTabMedia('teaser')}
              className={`px-4 py-2 rounded-xl text-xs font-black font-sport uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                activeTabMedia === 'teaser' 
                  ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20' 
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Video Presentazione Società</span>
            </button>
          </div>
        )}
        
        {/* PLAYER SCHERMO INTERO */}
        <div className="relative w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden bg-black shadow-2xl border border-slate-800 ring-1 ring-white/10 group">
          
          {/* TAB 1: LIVE YOUTUBE PLAYER */}
          {activeTabMedia === 'live' && (
            liveVideoId ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${liveVideoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                title={diretta.titolo}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              /* STANDBY ARENA SE NON C'È ANCORA IL LINK YOUTUBE */
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-900 via-slate-950 to-black space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                  <Radio className="w-8 h-8 animate-pulse" />
                </div>
                <div className="max-w-md space-y-2">
                  <h3 className="text-xl font-bold font-sport uppercase tracking-wider text-white">
                    {isInProgramma ? 'Diretta in Fase di Preparazione' : 'Trasmissione Conclusa'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {isInProgramma
                      ? 'Il link della diretta streaming verrà attivato sul canale a ridosso dell\'inizio della gara. Questa pagina si aggiornerà automaticamente!'
                      : 'La diretta è terminata o non attiva in questo momento. Torna a visitarci per la prossima gara!'}
                  </p>
                </div>
                
                {teaserVideoId && (
                  <button
                    onClick={() => setActiveTabMedia('teaser')}
                    className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-black font-sport italic uppercase transition-all shadow-md cursor-pointer flex items-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Guarda il Video di Presentazione NVA</span>
                  </button>
                )}

                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-700 flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Aggiorna Pagina</span>
                  </button>
                  <Link
                    to="/squadre"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors border border-slate-700"
                  >
                    Vedi Calendario Gare
                  </Link>
                </div>
              </div>
            )
          )}

          {/* TAB 2: TEASER PRESENTAZIONE SOCIETÀ */}
          {activeTabMedia === 'teaser' && teaserVideoId && (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${teaserVideoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              title="Presentazione New Volley Academy"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )}

        </div>

        {/* 5. CONDIVISIONE & AZIONI VELOCI */}
        <div className="bg-slate-900/70 border border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold block">
              Condividi la Diretta
            </span>
            <p className="text-xs text-slate-300">
              Invia il link a parenti, tifosi e amici per seguire il match tutti insieme.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleCopyLink}
              className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copiato!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Copia Link</span>
                </>
              )}
            </button>

            <button
              onClick={handleShareWhatsapp}
              className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>WhatsApp</span>
            </button>

            {diretta.url_youtube && (
              <a
                href={diretta.url_youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Apri su YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* 6. MATCH DAY SPONSOR SHOWCASE (Valore fondamentale per gli Sponsor!) */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="text-center space-y-1.5 max-w-xl mx-auto">
            <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold">
              ★ MATCH DAY PARTNERS ★
            </span>
            <h3 className="text-lg sm:text-xl font-black font-sport uppercase tracking-wider text-white">
              La Diretta Streaming è Offerta dai Nostri Sponsor
            </h3>
            <p className="text-xs text-slate-400 font-inter">
              Ringraziamo con orgoglio le aziende partner che supportano l'attività agonistica e la formazione delle nostre atlete.
            </p>
          </div>

          {/* MAIN SPONSORS ROW */}
          {mainSponsors.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold block text-center">
                Main Sponsor Ufficiali
              </span>
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                {mainSponsors.map(sp => (
                  <a
                    key={sp.id}
                    href={sp.linkSito || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white p-3 sm:p-4 rounded-2xl shadow-md hover:scale-105 transition-transform border border-slate-200 flex items-center justify-center min-w-[140px] max-w-[200px] h-20"
                    title={sp.nomeSponsor}
                  >
                    {sp.logo?.url ? (
                      <img 
                        src={sp.logo.url} 
                        alt={sp.nomeSponsor} 
                        className="max-h-14 max-w-full object-contain" 
                      />
                    ) : (
                      <span className="font-sport font-black uppercase text-slate-900 text-sm text-center">
                        {sp.nomeSponsor}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* GOLD & OTHER PARTNERS */}
          {(goldSponsors.length > 0 || otherSponsors.length > 0) && (
            <div className="pt-4 border-t border-slate-800/80 space-y-3">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block text-center">
                Partner Commerciali & Tecnici
              </span>
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                {[...goldSponsors, ...otherSponsors].map(sp => (
                  <a
                    key={sp.id}
                    href={sp.linkSito || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 p-2.5 sm:p-3 rounded-xl transition-all flex items-center justify-center min-w-[100px] max-w-[140px] h-14"
                    title={sp.nomeSponsor}
                  >
                    {sp.logo?.url ? (
                      <img 
                        src={sp.logo.url} 
                        alt={sp.nomeSponsor} 
                        className="max-h-9 max-w-full object-contain filter brightness-95 hover:brightness-105 transition-all" 
                      />
                    ) : (
                      <span className="font-sport font-bold uppercase text-slate-300 text-xs text-center truncate">
                        {sp.nomeSponsor}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="text-center pt-2">
            <Link
              to="/societa?tab=sponsor"
              className="text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1.5"
            >
              <span>Diventa partner di New Volley Academy</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
