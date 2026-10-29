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
  Volume2,
  Maximize2,
  Sliders,
  Bell,
  Heart
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
  const [playClickedNotice, setPlayClickedNotice] = useState(false);

  // Caricamento configurazione diretta streaming
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "🔴 Diretta Streaming Match | New Volley Academy Forlì";

    const fetchDiretta = () => {
      getDirettaStreaming()
        .then(d => {
          setDiretta(d);
          if (d.stato === 'in_programma' && d.url_video_presentazione && !d.url_youtube) {
            setActiveTabMedia('teaser');
          }
        })
        .catch(err => console.warn("Errore caricamento diretta:", err))
        .finally(() => setIsLoading(false));
    };

    fetchDiretta();
    const pollInterval = setInterval(fetchDiretta, 30000);
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

  // Orario di inizio estratto (es. "21:15")
  const orarioInizio = useMemo(() => {
    if (!diretta.data_ora) return '21:15';
    const match = diretta.data_ora.match(/(\d{1,2}:\d{2})/);
    return match ? match[1] : diretta.data_ora;
  }, [diretta.data_ora]);

  const handleCopyLink = () => {
    const url = window.location.origin + '/diretta';
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  const handleShareWhatsapp = () => {
    const text = encodeURIComponent(
      `🏐 Guarda la partita della New Volley Academy in diretta streaming!\n🔴 ${diretta.titolo}\n⏰ Inizio live: ore ${orarioInizio}\n📅 ${diretta.data_ora || 'Stasera'}\n📍 ${diretta.luogo || 'Palazzetto'}\nTorna a tifare con noi qui: ${window.location.origin}/diretta`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleSimulatedPlayClick = () => {
    setPlayClickedNotice(true);
    setTimeout(() => setPlayClickedNotice(false), 4500);
  };

  // Google Calendar link
  const googleCalendarUrl = useMemo(() => {
    if (!targetMatchDate) return null;
    const startIso = targetMatchDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endDate = new Date(targetMatchDate.getTime() + 2 * 60 * 60 * 1000);
    const endIso = endDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const title = encodeURIComponent(`🏐 Live Volley: ${diretta.titolo || 'New Volley Academy'}`);
    const details = encodeURIComponent(
      `Diretta streaming ufficiale su: ${window.location.origin}/diretta\nTorna qui a tifare le nostre atlete!\n${diretta.sottotitolo || ''}`
    );
    const location = encodeURIComponent(diretta.luogo || 'Palazzetto dello Sport');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
  }, [targetMatchDate, diretta.titolo, diretta.sottotitolo, diretta.luogo]);

  // Suddivisione Sponsor
  const mainSponsors = sponsorsAll.filter(s => s.attivo !== false && (s.tipologia === 'Main Sponsor' || s.tipologia?.toLowerCase().includes('main')));
  const goldSponsors = sponsorsAll.filter(s => s.attivo !== false && (s.tipologia === 'Gold Partner' || s.tipologia?.toLowerCase().includes('gold')));
  const otherSponsors = sponsorsAll.filter(s => s.attivo !== false && !mainSponsors.includes(s) && !goldSponsors.includes(s));

  // Squadre Casa vs Ospite
  const nomeCasa = diretta.squadra_casa || 'New Volley Academy';
  const nomeOspite = diretta.squadra_ospite || 'Squadra Avversaria';
  const isNvaCasa = nomeCasa.toLowerCase().includes('new volley') || nomeCasa.toLowerCase().includes('nva');
  const isFenixCasa = nomeCasa.toUpperCase().includes('FENIX');
  const isFenixOspite = nomeOspite.toUpperCase().includes('FENIX');

  // Risoluzione loghi ufficiali
  const logoCasaEffective = diretta.logo_casa || (isNvaCasa ? '/logo.png' : isFenixCasa ? 'https://www.pallavolofaenza.com/site_img/logo.png' : '');
  const logoOspiteEffective = diretta.logo_ospite || (!isNvaCasa ? '/logo.png' : isFenixOspite ? 'https://www.pallavolofaenza.com/site_img/logo.png' : '');

  return (
    <div className="min-h-screen bg-slate-950 text-white font-inter pb-24 selection:bg-amber-400 selection:text-slate-950">
      
      {/* 1. TOP STATIC BREADCRUMB BAR (Nessun conflitto con il menu della Navbar) */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 py-3 px-4 sm:px-6 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Torna al Sito Ufficiale</span>
          </Link>

          <div className="flex items-center gap-2.5">
            {isLiveNow ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black uppercase font-sport tracking-wider animate-pulse shadow-lg shadow-red-600/30">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <Radio className="w-3.5 h-3.5" />
                <span>IN DIRETTA ORA</span>
              </span>
            ) : isInProgramma ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase font-sport tracking-wider">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>MATCH DAY • PRE-PARTITA</span>
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

      {/* 2. MATCH ARENA & MOTIVATIONAL BROADCAST HERO */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-b border-slate-800/80 pt-6 pb-10 px-4 sm:px-6">
        
        {/* Glow sportivo di sfondo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10 space-y-6">

          {/* ======================================================== */}
          {/* BANNER PRINCIPALE: LA LIVE INIZIERÀ ALLE ORE...          */}
          {/* ======================================================== */}
          <div className="rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 p-[2px] shadow-2xl shadow-red-950/60">
            <div className="bg-slate-950/95 rounded-[22px] p-5 sm:p-7 backdrop-blur-md text-center space-y-3.5">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-600/25 border border-red-500/40 text-red-300 font-sport font-black text-xs uppercase tracking-widest animate-pulse">
                <Radio className="w-4 h-4 text-red-400" />
                <span>{isLiveNow ? 'PARTITA IN CORSO' : 'DIRETTA STREAMING MATCH DAY'}</span>
              </div>
              
              <div className="space-y-1.5 max-w-2xl mx-auto">
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black font-sport uppercase tracking-tight text-white leading-tight">
                  {isLiveNow ? (
                    'SEGUI LE NOSTRE PANTERE DAL VIVO!'
                  ) : (
                    <>
                      LA LIVE INIZIERÀ ALLE ORE <span className="text-amber-400 underline decoration-red-500 decoration-4">{orarioInizio}</span>
                    </>
                  )}
                </h1>
                <p className="text-sm sm:text-lg font-sport uppercase font-bold text-amber-200 tracking-wider">
                  ★ TORNA QUI A TIFARE IN DIRETTA CON NOI! ★
                </p>
                <p className="text-xs sm:text-sm text-slate-300 font-inter max-w-xl mx-auto leading-relaxed pt-1">
                  Metti questa pagina tra i preferiti o attiva il promemoria: stasera tutta la community di New Volley Academy sarà collegata per sostenere la squadra set dopo set!
                </p>
              </div>

              {/* Pulsanti Rapidi nel Banner */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {googleCalendarUrl && !isLiveNow && (
                  <a
                    href={googleCalendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black font-sport italic uppercase text-xs flex items-center gap-2 shadow-lg shadow-amber-400/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <CalendarPlus className="w-4 h-4 text-slate-950" />
                    <span>Aggiungi Promemoria Calendario</span>
                  </a>
                )}

                <button
                  onClick={handleShareWhatsapp}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black font-sport italic uppercase text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Condividi su WhatsApp</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                  <span>{copied ? 'Link Copiato!' : 'Copia Link Pagina'}</span>
                </button>
              </div>

            </div>
          </div>

          {/* SCONTRO DIRETTO: STEMMA CASA vs STEMMA OSPITE */}
          <div className="bg-slate-900/60 border border-slate-800/90 rounded-3xl p-5 sm:p-6 space-y-4">
            
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

            <div className="grid grid-cols-1 sm:grid-cols-7 items-center gap-4 sm:gap-2 text-center py-1">
              
              {/* SQUADRA CASA */}
              <div className="sm:col-span-3 flex flex-col items-center sm:items-end space-y-2">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border border-slate-200 p-2 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform overflow-hidden">
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
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border border-slate-200 p-2 flex items-center justify-center shadow-xl overflow-hidden">
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
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-slate-300 pt-2 border-t border-slate-800/60">
                {diretta.data_ora && (
                  <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-3.5 py-1.5 rounded-xl">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-white">{diretta.data_ora}</span>
                  </div>
                )}
                {diretta.luogo && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(diretta.luogo)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 px-3.5 py-1.5 rounded-xl text-slate-300 hover:text-amber-400 transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span className="truncate max-w-[280px]">{diretta.luogo}</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                )}
              </div>
            )}

            {/* COUNTDOWN BOX SOTTO ALLO SCONTRO */}
            {isInProgramma && targetMatchDate && !timeLeft.isPast && (
              <div className="pt-2">
                <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-md mx-auto">
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2 sm:p-2.5 text-center">
                    <span className="block text-2xl sm:text-3xl font-black font-sport text-amber-400">
                      {String(timeLeft.days).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                      Giorni
                    </span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2 sm:p-2.5 text-center">
                    <span className="block text-2xl sm:text-3xl font-black font-sport text-amber-400">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                      Ore
                    </span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2 sm:p-2.5 text-center">
                    <span className="block text-2xl sm:text-3xl font-black font-sport text-amber-400">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                      Minuti
                    </span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2 sm:p-2.5 text-center">
                    <span className="block text-2xl sm:text-3xl font-black font-sport text-white animate-pulse">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                      Secondi
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* 3. PLAYER CONTAINER (PLAYER YOUTUBE REALE OPPURE SIMULATORE BROADCAST TV) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-6">

        {/* TABS MULTIMEDIALI SE C'È UN VIDEO DI PRESENTAZIONE */}
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
              <span>{isLiveNow ? 'Canale Diretta Live' : 'Player Ufficiale Partita'}</span>
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
              <span>Guarda Video Presentazione NVA</span>
            </button>
          </div>
        )}

        {/* SCHERMO PRINCIPALE DEL PLAYER */}
        <div className="relative w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden bg-black shadow-2xl border border-slate-800 ring-1 ring-white/10 group">
          
          {/* TAB 1: PLAYER LIVE DI YOUTUBE */}
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
              /* ======================================================== */
              /* IMITATORE PLAYER TV / YOUTUBE IN ATTESA DELLA DIRETTA   */
              /* ======================================================== */
              <div 
                onClick={handleSimulatedPlayClick}
                className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-br from-slate-950 via-zinc-950 to-black select-none cursor-pointer overflow-hidden group/player"
              >
                {/* Sfondo campo da volley stilizzato e luci palazzetto */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.15),transparent)] pointer-events-none" />
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

                {/* Top Player Overlay */}
                <div className="relative z-10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                    <span className="px-2.5 py-1 rounded-md bg-red-600/90 text-white font-mono font-black text-[10px] uppercase tracking-wider">
                      STANDBY LIVE
                    </span>
                    <span className="text-white font-sport font-black uppercase tracking-wider text-xs sm:text-sm hidden sm:inline drop-shadow">
                      New Volley Academy TV • Segnale Palazzetto
                    </span>
                  </div>

                  <span className="px-2.5 py-0.5 rounded bg-black/60 border border-white/10 text-[10px] font-mono text-slate-300">
                    1080p HD • LIVE
                  </span>
                </div>

                {/* Center Clash & Play Button */}
                <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4 my-auto">
                  
                  {/* Pulsante Play Simulato con onde pulsanti */}
                  <div className="relative">
                    <div className="absolute -inset-3 rounded-full bg-red-600/30 blur-lg animate-pulse" />
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-2xl ring-4 ring-white/20 group-hover/player:scale-110 transition-transform">
                      <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white translate-x-0.5" />
                    </div>
                  </div>

                  {/* Messaggio principale sullo schermo */}
                  <div className="space-y-1.5 max-w-lg px-2">
                    <h3 className="text-lg sm:text-2xl md:text-3xl font-black font-sport uppercase tracking-wider text-white drop-shadow-md">
                      IL SEGNALE VIDEO SI ATTIVERÀ ALLE ORE {orarioInizio}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 font-inter leading-relaxed drop-shadow">
                      Le telecamere sul campo si accenderanno a ridosso dell'ingresso delle squadre.
                      <br className="hidden sm:inline" />
                      <strong className="text-amber-400 font-bold"> Torna qui stasera per tifare con noi in diretta streaming!</strong>
                    </p>
                  </div>

                  {/* Toast avviso al click */}
                  {playClickedNotice && (
                    <div className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold font-sport uppercase text-xs shadow-xl animate-bounce">
                      🔔 Segnale video pronto! La diretta partirà alle {orarioInizio}. Salva il link tra i preferiti!
                    </div>
                  )}

                  {teaserVideoId && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTabMedia('teaser');
                      }}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-sport uppercase text-xs flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer"
                    >
                      <Film className="w-3.5 h-3.5 text-amber-400" />
                      <span>Guarda intanto la presentazione della società</span>
                    </button>
                  )}

                </div>

                {/* Bottom Player Controls (Imitazione YouTube Live) */}
                <div className="relative z-10 flex items-center justify-between text-slate-400 text-xs pt-2 border-t border-white/10 bg-black/40 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <Play className="w-4 h-4 text-white opacity-80" />
                    <Volume2 className="w-4 h-4 text-white opacity-80" />
                    <div className="flex items-center gap-1.5 text-[10px] font-mono">
                      <span className="w-2 h-2 rounded-full bg-red-600" />
                      <span className="text-white font-bold">STREAM IN ATTESA</span>
                      <span className="text-slate-400 hidden sm:inline">| Inizio ore {orarioInizio}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">New Volley Academy TV</span>
                    <Maximize2 className="w-4 h-4 text-white opacity-80" />
                  </div>
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

        {/* 4. CALL TO ACTION & CONDIVISIONE */}
        <div className="bg-slate-900/70 border border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold block">
              NON PERDERE LA PARTITA
            </span>
            <p className="text-xs text-slate-300">
              Invia il link al gruppo WhatsApp della squadra, ai parenti e ai tifosi.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleCopyLink}
              className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copiato!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Copia Link Pagina</span>
                </>
              )}
            </button>

            <button
              onClick={handleShareWhatsapp}
              className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Condividi su WhatsApp</span>
            </button>

            {diretta.url_youtube && (
              <a
                href={diretta.url_youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Apri su YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* 5. MATCH DAY SPONSOR SHOWCASE (Valore fondamentale per gli Sponsor!) */}
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
