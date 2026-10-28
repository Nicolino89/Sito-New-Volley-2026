import React, { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  DirettaStreaming, 
  DEFAULT_DIRETTA_STREAMING, 
  getDirettaStreaming, 
  extractYouTubeVideoId,
  Sponsor,
  SocietaInfo 
} from '../firebase-societa';

interface DirettaLiveProps {
  sponsorsAll?: Sponsor[];
  societaInfo?: SocietaInfo | null;
}

export default function DirettaLive({ sponsorsAll = [], societaInfo }: DirettaLiveProps) {
  const [diretta, setDiretta] = useState<DirettaStreaming>(DEFAULT_DIRETTA_STREAMING);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "🔴 Diretta Streaming Match | New Volley Academy Forlì";

    getDirettaStreaming()
      .then(d => setDiretta(d))
      .catch(err => console.warn("Errore caricamento diretta:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const videoId = extractYouTubeVideoId(diretta.url_youtube);

  const handleCopyLink = () => {
    const url = window.location.origin + '/diretta';
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  const handleShareWhatsapp = () => {
    const text = encodeURIComponent(
      `🏐 Guarda la partita della New Volley Academy in diretta streaming!\n🔴 ${diretta.titolo}\nSegui la diretta qui: https://newvolleyacademy.it/diretta`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Sponsor suddivisi per importanza
  const mainSponsors = sponsorsAll.filter(s => s.attivo !== false && (s.tipologia === 'Main Sponsor' || s.tipologia?.toLowerCase().includes('main')));
  const goldSponsors = sponsorsAll.filter(s => s.attivo !== false && (s.tipologia === 'Gold Partner' || s.tipologia?.toLowerCase().includes('gold')));
  const otherSponsors = sponsorsAll.filter(s => s.attivo !== false && !mainSponsors.includes(s) && !goldSponsors.includes(s));

  return (
    <div className="min-h-screen bg-slate-950 text-white font-inter pb-16 selection:bg-amber-400 selection:text-slate-950">
      
      {/* 1. TOP LIVE BROADCAST TICKER */}
      <div className="bg-slate-900/90 border-b border-slate-800 py-3 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Torna alla Home</span>
          </Link>

          <div className="flex items-center gap-2">
            {diretta.stato === 'live' ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/90 text-white text-xs font-black uppercase font-sport tracking-wider animate-pulse shadow-lg shadow-red-600/30">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <Radio className="w-3.5 h-3.5" />
                <span>In Diretta Ora</span>
              </span>
            ) : diretta.stato === 'in_programma' ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase font-sport tracking-wider">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>In Programma</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-bold uppercase font-sport tracking-wider">
                <span>Trasmessa • Rivedila</span>
              </span>
            )}
            
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
              New Volley Academy TV
            </span>
          </div>
        </div>
      </div>

      {/* 2. MATCH HERO & PLAYER CONTAINER */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        
        {/* MATCH HEADER INFO */}
        <div className="space-y-3 text-center sm:text-left sm:flex sm:items-end sm:justify-between sm:space-y-0 pb-2">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-sport uppercase tracking-wider font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{diretta.categoria || 'Match Ufficiale FIPAV'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black font-sport uppercase tracking-wide text-white leading-tight">
              {diretta.titolo || 'Diretta Streaming Partita'}
            </h1>
            {diretta.sottotitolo && (
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {diretta.sottotitolo}
              </p>
            )}
          </div>

          {(diretta.luogo || diretta.data_ora) && (
            <div className="sm:text-right text-xs text-slate-400 font-mono space-y-1 shrink-0 pt-2 sm:pt-0">
              {diretta.data_ora && (
                <div className="flex items-center justify-center sm:justify-end gap-1.5 text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>{diretta.data_ora}</span>
                </div>
              )}
              {diretta.luogo && (
                <div className="flex items-center justify-center sm:justify-end gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span className="truncate max-w-[240px]">{diretta.luogo}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. YOUTUBE EMBED PLAYER */}
        <div className="relative w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden bg-black shadow-2xl border border-slate-800 ring-1 ring-white/10 group">
          {videoId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              title={diretta.titolo}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            /* STANDBY PLACEHOLDER */
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-900 via-slate-950 to-black space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <Radio className="w-8 h-8 animate-pulse" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-xl font-bold font-sport uppercase tracking-wider text-white">
                  Streaming in fase di allestimento
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  La diretta streaming non è ancora iniziata o il link è in fase di aggiornamento.
                  Ricarica la pagina all'orario d'inizio della partita per seguire le nostre atlete!
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-700"
                >
                  Ricarica Pagina
                </button>
                <Link
                  to="/squadre"
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-black font-sport italic uppercase transition-colors"
                >
                  Vedi Calendario Gare
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* 4. ACTIONS & SHARE BAR */}
        <div className="bg-slate-900/70 border border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold block">
              Condividi la Diretta
            </span>
            <p className="text-xs text-slate-300">
              Invia il link a parenti, amici e tifosi per seguire il match insieme.
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

        {/* 5. MATCH DAY SPONSOR SHOWCASE (Valore fondamentale per gli Sponsor!) */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="text-center space-y-1.5 max-w-xl mx-auto">
            <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold">
              ★ Match Day Partners ★
            </span>
            <h3 className="text-lg sm:text-xl font-black font-sport uppercase tracking-wider text-white">
              La Diretta Streaming è Supportata dai Nostri Sponsor
            </h3>
            <p className="text-xs text-slate-400 font-inter">
              Ringraziamo le aziende partner che credono nella crescita sportiva ed educativa di New Volley Academy.
            </p>
          </div>

          {/* MAIN SPONSORS ROW */}
          {mainSponsors.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold block text-center">
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
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold block text-center">
                Partner Commerciali & Sponsor Tecnici
              </span>
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                {[...goldSponsors, ...otherSponsors].map(sp => (
                  <a
                    key={sp.id}
                    href={sp.linkSito || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/95 hover:bg-white p-2.5 rounded-xl shadow-sm hover:scale-105 transition-transform flex items-center justify-center min-w-[110px] max-w-[150px] h-14"
                    title={sp.nomeSponsor}
                  >
                    {sp.logo?.url ? (
                      <img 
                        src={sp.logo.url} 
                        alt={sp.nomeSponsor} 
                        className="max-h-9 max-w-full object-contain" 
                      />
                    ) : (
                      <span className="font-sport font-bold uppercase text-slate-900 text-xs text-center truncate">
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
              to="/sponsor" 
              className="text-xs text-amber-400 hover:text-amber-300 font-bold font-sport uppercase tracking-wider inline-flex items-center gap-1.5"
            >
              <span>Diventa Partner Commerciale di New Volley Academy</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
