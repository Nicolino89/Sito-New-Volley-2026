import React, { useState, useEffect, useMemo } from 'react';
import { 
  Radio, 
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
  CalendarPlus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { updatePageMeta } from '../utils/seoHelper';
import { 
  DirettaStreaming, 
  DEFAULT_DIRETTA_STREAMING, 
  getDirettaStreaming, 
  extractYouTubeVideoId,
  parseMatchDateTime,
  Sponsor,
  SocietaInfo,
  OFFICIAL_NVA_LOGO,
  getKnownTeamLogo,
  trackSponsorClick
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
  const [nowTick, setNowTick] = useState(Date.now());
  const [nvaLogoError, setNvaLogoError] = useState(false);
  const [oppLogoError, setOppLogoError] = useState(false);

  // Caricamento configurazione diretta streaming
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "🔴 Diretta Streaming Match | New Volley Academy Forlì";

    const fetchDiretta = () => {
      getDirettaStreaming()
        .then(d => {
          setDiretta(prev => {
            if (
              prev.attiva === d.attiva &&
              prev.stato === d.stato &&
              prev.url_youtube === d.url_youtube &&
              prev.titolo === d.titolo &&
              prev.data_ora === d.data_ora &&
              prev.luogo === d.luogo &&
              prev.squadra_casa === d.squadra_casa &&
              prev.squadra_ospite === d.squadra_ospite &&
              prev.logo_casa === d.logo_casa &&
              prev.logo_ospite === d.logo_ospite
            ) {
              return prev;
            }
            return d;
          });
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

  // Consideriamo attiva la live se impostata su 'live' dall'admin E attiva è true
  const isLiveNow = Boolean(diretta.attiva) && diretta.stato === 'live';

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

  // Google Calendar link
  const googleCalendarUrl = useMemo(() => {
    if (!targetMatchDate) return null;
    const startIso = targetMatchDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endDate = new Date(targetMatchDate.getTime() + 2 * 60 * 60 * 1000);
    const endIso = endDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const title = encodeURIComponent(`🏐 Live Volley: ${diretta.titolo || 'New Volley Academy'}`);
    const details = encodeURIComponent(
      `Diretta streaming ufficiale su: ${window.location.origin}/diretta\nTorna qui a tifare le nostre pantere!\n${diretta.sottotitolo || ''}`
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
  const isNvaOspite = nomeOspite.toLowerCase().includes('new volley') || nomeOspite.toLowerCase().includes('nva');
  const isFenixCasa = nomeCasa.toUpperCase().includes('FENIX');
  const isFenixOspite = nomeOspite.toUpperCase().includes('FENIX');

  // Risoluzione loghi ufficiali (priorità a Firebase CDN per NVA e dizionario federale per avversari)
  const getLogoCasa = () => {
    if (isNvaCasa) {
      if (diretta.logo_casa && diretta.logo_casa !== '/logo.png') return diretta.logo_casa;
      return OFFICIAL_NVA_LOGO;
    }
    const known = getKnownTeamLogo(nomeCasa);
    if (known) return known;
    return (diretta.logo_casa && diretta.logo_casa !== '/logo.png') ? diretta.logo_casa : '';
  };

  const getLogoOspite = () => {
    if (isNvaOspite) {
      if (diretta.logo_ospite && diretta.logo_ospite !== '/logo.png') return diretta.logo_ospite;
      return OFFICIAL_NVA_LOGO;
    }
    const known = getKnownTeamLogo(nomeOspite);
    if (known) return known;
    return (diretta.logo_ospite && diretta.logo_ospite !== '/logo.png') ? diretta.logo_ospite : '';
  };

  const logoCasaEffective = getLogoCasa();
  const logoOspiteEffective = getLogoOspite();

  // 1. Aggiornamento Dinamico Meta Tag SEO / OpenGraph
  useEffect(() => {
    const metaTitle = diretta.attiva && diretta.titolo
      ? (isLiveNow ? `🔴 ORA IN DIRETTA: ${diretta.titolo}` : `⏰ PROSSIMA DIRETTA: ${diretta.titolo}`)
      : "Diretta Streaming Match | New Volley Academy";

    const metaDescription = diretta.descrizione || 
      `Segui la diretta streaming ufficiale della New Volley Academy Forlì. Tifa per le nostre pantere punto su punto dal palazzetto!`;

    updatePageMeta({
      title: metaTitle,
      description: metaDescription,
      url: "https://newvolleyacademy.it/diretta",
      image: isNvaCasa ? OFFICIAL_NVA_LOGO : (logoCasaEffective || OFFICIAL_NVA_LOGO)
    });
  }, [diretta.titolo, diretta.descrizione, diretta.attiva, isLiveNow, isNvaCasa, logoCasaEffective]);

  // 2. Schema.org JSON-LD (SportsEvent & BroadcastEvent) per indicizzazione ricca su Google
  useEffect(() => {
    const scriptId = 'jsonld-diretta-schema';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      "name": diretta.titolo || "Partita New Volley Academy Forlì",
      "description": diretta.descrizione || "Diretta streaming della partita ufficiale New Volley Academy Forlì",
      "startDate": targetMatchDate ? targetMatchDate.toISOString() : undefined,
      "eventStatus": isLiveNow 
        ? "https://schema.org/EventLive" 
        : (diretta.stato === 'terminata' ? "https://schema.org/EventCompleted" : "https://schema.org/EventScheduled"),
      "location": {
        "@type": "Place",
        "name": diretta.luogo || "Palazzetto dello Sport",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Forlì",
          "addressRegion": "FC",
          "addressCountry": "IT"
        }
      },
      "competitor": [
        {
          "@type": "SportsTeam",
          "name": nomeCasa,
          "logo": logoCasaEffective || undefined
        },
        {
          "@type": "SportsTeam",
          "name": nomeOspite,
          "logo": logoOspiteEffective || undefined
        }
      ],
      "organizer": {
        "@type": "SportsOrganization",
        "name": "New Volley Academy Forlì",
        "url": "https://newvolleyacademy.it",
        "logo": OFFICIAL_NVA_LOGO
      },
      ...(liveVideoId ? {
        "video": {
          "@type": "VideoObject",
          "name": diretta.titolo,
          "description": diretta.descrizione,
          "embedUrl": `https://www.youtube-nocookie.com/embed/${liveVideoId}`,
          "thumbnailUrl": `https://img.youtube.com/vi/${liveVideoId}/hqdefault.jpg`,
          "uploadDate": new Date().toISOString()
        }
      } : {})
    };

    scriptTag.textContent = JSON.stringify(jsonLd);

    return () => {
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [diretta, targetMatchDate, isLiveNow, nomeCasa, nomeOspite, logoCasaEffective, logoOspiteEffective, liveVideoId]);

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
            {diretta.attiva ? (
              isLiveNow ? (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black uppercase font-sport tracking-wider animate-pulse shadow-lg shadow-red-600/30">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <Radio className="w-3.5 h-3.5" />
                  <span>IN DIRETTA ORA</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase font-sport tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>MATCH DAY • PRE-PARTITA</span>
                </span>
              )
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-mono font-bold uppercase tracking-wider">
                <span>NON ATTIVA</span>
              </span>
            )}
            
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
              New Volley Academy Live Channel
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SCENARIO 0: DIRETTA DISATTIVATA DALL'ADMIN                                */}
      {/* ========================================================================= */}
      {!diretta.attiva ? (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-20 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shadow-xl">
            <Radio className="w-10 h-10 opacity-40 text-slate-400" />
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-mono font-bold uppercase tracking-wider border border-slate-700">
              Trasmissione Non Attiva
            </span>
            <h1 className="text-2xl sm:text-3xl font-black font-sport uppercase tracking-wider text-white italic">
              Nessuna Diretta Streaming al Momento
            </h1>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Al momento la diretta non è attiva sul sito. Torna a trovarci per seguire le prossime sfide delle pantere!
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black font-sport italic uppercase text-xs transition-transform hover:scale-105 shadow-lg shadow-amber-400/20"
            >
              <ArrowLeft className="w-4 h-4" />
              Torna al Sito Ufficiale
            </Link>
          </div>
        </div>
      ) : isLiveNow ? (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
          
          {/* HEADER COMPATTO CON I DUE STEMMI (OCCUPA POCO SPAZIO IN ALTO) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-lg backdrop-blur-md">
            
            <div className="flex items-center gap-3 overflow-hidden min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-md">
                  {(isNvaCasa ? logoCasaEffective : logoOspiteEffective) ? (
                    <img 
                      src={isNvaCasa ? logoCasaEffective : logoOspiteEffective} 
                      alt="NVA" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.dataset.triedFallback) {
                          target.dataset.triedFallback = 'true';
                          target.src = OFFICIAL_NVA_LOGO;
                        } else if (!target.dataset.triedLocal) {
                          target.dataset.triedLocal = 'true';
                          target.src = '/images/logo-nva.png';
                        }
                      }}
                    />
                  ) : (
                    <img src={OFFICIAL_NVA_LOGO} alt="NVA" className="w-full h-full object-contain" />
                  )}
                </div>

                <span className="font-sport font-black text-xs text-amber-400 italic">VS</span>

                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-md">
                  {!oppLogoError && (!isNvaCasa ? logoCasaEffective : logoOspiteEffective) ? (
                    <img 
                      src={!isNvaCasa ? logoCasaEffective : logoOspiteEffective} 
                      alt={nomeOspite} 
                      className="w-full h-full object-contain"
                      onError={(e) => { (e.target as any).onerror = null; setOppLogoError(true); }}
                    />
                  ) : (
                    <Shield className="w-6 h-6 text-slate-600" />
                  )}
                </div>
              </div>

              <div className="overflow-hidden min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping shrink-0" />
                  <span className="text-[9px] sm:text-[10px] uppercase font-mono font-bold text-red-400 tracking-wider">
                    🔴 DIRETTA STREAMING DAL PALAZZETTO
                  </span>
                </div>
                <h1 className="text-sm sm:text-xl font-black font-sport uppercase tracking-wide text-white truncate">
                  {diretta.titolo || `${nomeCasa} vs ${nomeOspite}`}
                </h1>
                {diretta.luogo && (
                  <p className="text-[10px] sm:text-[11px] text-slate-400 truncate flex items-center gap-1 font-mono">
                    <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{diretta.luogo}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={handleShareWhatsapp}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-sport uppercase text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer min-h-[38px]"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-white" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer min-h-[38px]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Copiato!' : 'Copia'}</span>
              </button>
            </div>

          </div>

          {/* PLAYER YOUTUBE A TUTTO SCHERMO */}
          <div className="relative w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden bg-black shadow-2xl border border-slate-800 ring-1 ring-white/10">
            {liveVideoId ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${liveVideoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                title={diretta.titolo}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950 space-y-3">
                <Radio className="w-10 h-10 text-red-500 animate-pulse" />
                <h3 className="text-xl font-bold font-sport uppercase text-white">
                  Collegamento in corso con il palazzetto
                </h3>
                <p className="text-xs text-slate-400 max-w-md">
                  L'amministratore sta avviando la telecamera. Il video apparirà automaticamente tra pochissimo!
                </p>
              </div>
            )}
          </div>

          {/* BARRA UTILITY SOTTO AL PLAYER YOUTUBE */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                <span className="font-sport font-black uppercase text-amber-400 tracking-wider">
                  {diretta.categoria || 'Campionato FIPAV'} {diretta.sottotitolo ? `• ${diretta.sottotitolo}` : ''}
                </span>
              </div>
              <p className="text-slate-300 font-inter text-xs sm:text-sm">
                {diretta.descrizione || 'Tifa le nostre pantere in campo! Condividi il link con amici e compagni di squadra.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {liveVideoId && (
                <a
                  href={`https://www.youtube.com/watch?v=${liveVideoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-sport uppercase text-xs font-black flex items-center gap-1.5 shadow-md shadow-red-600/20 transition-all hover:scale-105"
                  title="Apri nel player nativo o nell'app YouTube (utile per Smart TV o Chat)"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Apri su YouTube</span>
                </a>
              )}
              {diretta.luogo && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(diretta.luogo)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline truncate max-w-[180px]">{diretta.luogo}</span>
                  <span className="sm:hidden">Mappa</span>
                </a>
              )}
            </div>
          </div>

        </div>
      ) : (
        /* ========================================================================= */
        /* SCENARIO B: PRE-MATCH IN ATTESA (BANNER D'INVITO + STEMMI + COUNTDOWN)     */
        /* (Nessuna finta TV: solo l'avviso e il countdown chiaro e accattivante)     */
        /* ========================================================================= */
        <div className="relative overflow-hidden pt-6 pb-10 px-4 sm:px-6">
          
          <div className="max-w-4xl mx-auto space-y-6">

            {/* 1. BANNER PRINCIPALE: LA LIVE INIZIERÀ ALLE ORE... */}
            <div className="rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 p-[2px] shadow-2xl shadow-red-950/60">
              <div className="bg-slate-950/95 rounded-[22px] p-6 sm:p-8 backdrop-blur-md text-center space-y-3.5">
                
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-600/25 border border-red-500/40 text-red-300 font-sport font-black text-xs uppercase tracking-widest animate-pulse">
                  <Radio className="w-4 h-4 text-red-400" />
                  <span>DIRETTA STREAMING MATCH DAY</span>
                </div>
                
                <div className="space-y-1.5 max-w-2xl mx-auto">
                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-black font-sport uppercase tracking-tight text-white leading-tight">
                    LA LIVE INIZIERÀ ALLE ORE <span className="text-amber-400 underline decoration-red-500 decoration-4">{orarioInizio}</span>
                  </h1>
                  <p className="text-sm sm:text-lg font-sport uppercase font-bold text-amber-200 tracking-wider">
                    ★ TORNA QUI A TIFARE IN DIRETTA CON NOI! ★
                  </p>
                  <p className="text-xs sm:text-sm text-slate-300 font-inter max-w-xl mx-auto leading-relaxed pt-1">
                    Metti questa pagina tra i preferiti o attiva il promemoria: stasera saremo tutti collegati per sostenere le nostre pantere punto su punto dal palazzetto!
                  </p>
                </div>

                {/* Pulsanti Rapidi nel Banner */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 pt-2">
                  {googleCalendarUrl && (
                    <a
                      href={googleCalendarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black font-sport italic uppercase text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 transition-all hover:scale-105 active:scale-95 cursor-pointer min-h-[42px]"
                    >
                      <CalendarPlus className="w-4 h-4 text-slate-950" />
                      <span>Promemoria Calendario</span>
                    </a>
                  )}

                  <button
                    onClick={handleShareWhatsapp}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black font-sport italic uppercase text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 cursor-pointer min-h-[42px]"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer min-h-[42px]"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    <span>{copied ? 'Copiato!' : 'Copia Link'}</span>
                  </button>
                </div>

              </div>
            </div>

            {/* 2. SCONTRO DIRETTO CON STEMMI & CONTO ALLA ROVESCIA */}
            <div className="bg-slate-900/60 border border-slate-800/90 rounded-3xl p-6 sm:p-8 space-y-5">
              
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

              {/* STEMMI DELLE DUE SQUADRE: RESPONSIVE SIDE-BY-SIDE ON ALL SCREENS */}
              <div className="flex items-center justify-between sm:justify-around gap-2 sm:gap-6 py-2 px-1 sm:px-4">
                
                {/* SQUADRA CASA */}
                <div className="flex-1 flex flex-col items-center text-center space-y-2 min-w-0">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-white border border-slate-200 p-1.5 sm:p-2 flex items-center justify-center shadow-xl overflow-hidden shrink-0">
                    {logoCasaEffective ? (
                      <img 
                        src={logoCasaEffective} 
                        alt={nomeCasa} 
                        className="w-full h-full object-contain filter drop-shadow"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (isNvaCasa) {
                            if (!target.dataset.triedFallback) {
                              target.dataset.triedFallback = 'true';
                              target.src = OFFICIAL_NVA_LOGO;
                            } else if (!target.dataset.triedLocal) {
                              target.dataset.triedLocal = 'true';
                              target.src = '/images/logo-nva.png';
                            } else {
                              setNvaLogoError(true);
                            }
                          } else {
                            setNvaLogoError(true);
                          }
                        }}
                      />
                    ) : isNvaCasa ? (
                      <img src={OFFICIAL_NVA_LOGO} alt={nomeCasa} className="w-full h-full object-contain filter drop-shadow" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-800 font-sport font-black uppercase text-center p-1 leading-none text-xs">
                        <Shield className="w-6 h-6 sm:w-8 sm:h-8 mb-1 text-amber-500" />
                        <span className="truncate max-w-full text-[9px] sm:text-[10px]">{nomeCasa.slice(0, 6)}</span>
                      </div>
                    )}
                  </div>
                  <h2 className="text-xs sm:text-xl md:text-2xl font-black font-sport uppercase tracking-wide text-white leading-tight line-clamp-2 max-w-[130px] sm:max-w-[240px]">
                    {nomeCasa}
                  </h2>
                  <span className="text-[9px] sm:text-[10px] uppercase font-mono font-bold tracking-wider text-amber-400 bg-amber-400/10 px-2 sm:px-2.5 py-0.5 rounded-md">
                    CASA
                  </span>
                </div>

                {/* EMBLEMA "VS" CENTRALE */}
                <div className="shrink-0 flex flex-col items-center justify-center px-1 sm:px-3">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black font-sport italic text-xs sm:text-base flex items-center justify-center shadow-lg shadow-amber-500/25 ring-2 sm:ring-4 ring-slate-950">
                    VS
                  </div>
                </div>

                {/* SQUADRA OSPITE */}
                <div className="flex-1 flex flex-col items-center text-center space-y-2 min-w-0">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-white border border-slate-200 p-1.5 sm:p-2 flex items-center justify-center shadow-xl overflow-hidden shrink-0">
                    {logoOspiteEffective ? (
                      <img 
                        src={logoOspiteEffective} 
                        alt={nomeOspite} 
                        className="w-full h-full object-contain filter drop-shadow"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (isNvaOspite) {
                            if (!target.dataset.triedFallback) {
                              target.dataset.triedFallback = 'true';
                              target.src = OFFICIAL_NVA_LOGO;
                            } else if (!target.dataset.triedLocal) {
                              target.dataset.triedLocal = 'true';
                              target.src = '/images/logo-nva.png';
                            } else {
                              setOppLogoError(true);
                            }
                          } else {
                            setOppLogoError(true);
                          }
                        }}
                      />
                    ) : isNvaOspite ? (
                      <img src={OFFICIAL_NVA_LOGO} alt={nomeOspite} className="w-full h-full object-contain filter drop-shadow" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-800 font-sport font-black uppercase text-center p-1 leading-none text-xs">
                        <Shield className="w-6 h-6 sm:w-8 sm:h-8 mb-1 text-slate-500" />
                        <span className="truncate max-w-full text-[9px] sm:text-[10px]">{nomeOspite.slice(0, 6)}</span>
                      </div>
                    )}
                  </div>
                  <h2 className="text-xs sm:text-xl md:text-2xl font-black font-sport uppercase tracking-wide text-white leading-tight line-clamp-2 max-w-[130px] sm:max-w-[240px]">
                    {nomeOspite}
                  </h2>
                  <span className="text-[9px] sm:text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 bg-slate-800 px-2 sm:px-2.5 py-0.5 rounded-md">
                    OSPITE
                  </span>
                </div>

              </div>

              {/* DETTAGLI CAMPO & ORARIO */}
              {(diretta.luogo || diretta.data_ora) && (
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-slate-300 pt-3 border-t border-slate-800/60">
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

              {/* 3. CONTO ALLA ROVESCIA (COUNTDOWN AL FISCHIO D'INIZIO) */}
              {targetMatchDate && !timeLeft.isPast && (
                <div className="pt-2">
                  <div className="text-center pb-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center justify-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      TEMPO RIMANENTE ALLA DIRETTA
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-md mx-auto">
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2 sm:p-2.5 text-center shadow-inner">
                      <span className="block text-xl sm:text-3xl font-black font-sport text-amber-400 tabular-nums">
                        {String(timeLeft.days).padStart(2, '0')}
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                        Giorni
                      </span>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2 sm:p-2.5 text-center shadow-inner">
                      <span className="block text-xl sm:text-3xl font-black font-sport text-amber-400 tabular-nums">
                        {String(timeLeft.hours).padStart(2, '0')}
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                        Ore
                      </span>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2 sm:p-2.5 text-center shadow-inner">
                      <span className="block text-xl sm:text-3xl font-black font-sport text-amber-400 tabular-nums">
                        {String(timeLeft.minutes).padStart(2, '0')}
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                        Minuti
                      </span>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2 sm:p-2.5 text-center shadow-inner">
                      <span className="block text-xl sm:text-3xl font-black font-sport text-white animate-pulse tabular-nums">
                        {String(timeLeft.seconds).padStart(2, '0')}
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                        Secondi
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MATCH DAY SPONSOR SHOWCASE (Valore fondamentale per gli Sponsor!)      */}
      {/* ========================================================================= */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
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
                    onClick={() => trackSponsorClick(sp.id, sp.nomeSponsor)}
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
                    onClick={() => trackSponsorClick(sp.id, sp.nomeSponsor)}
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
              to="/sponsor#diventa-partner"
              className="text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1.5 group cursor-pointer"
            >
              <span>Diventa partner di New Volley Academy</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
