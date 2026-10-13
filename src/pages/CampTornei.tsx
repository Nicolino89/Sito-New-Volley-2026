import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { onSnapshot, collection } from 'firebase/firestore';
import { 
  getCampTorneiAll, 
  EventoCampTorneo, 
  isDemoMode,
  db,
  mapToUnifiedEvento,
  openPdfDocument,
  downloadPdfDocument
} from '../firebase-societa';
import { 
  MapPin, 
  Clock, 
  Users, 
  Award, 
  Info, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Camera,
  Flame,
  ArrowRight,
  Download,
  ExternalLink,
  Sparkles,
  Sun,
  Trophy,
  HelpCircle,
  FileText,
  MessageSquare,
  CheckCircle2,
  Eye
} from 'lucide-react';

// Storico Photo Carousel Component
export const StoricoCarousel: React.FC<{ foto: string[] }> = ({ foto }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!foto || foto.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % foto.length);
    }, 4500);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [foto, isPaused]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPaused(true);
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveIndex((prev) => (prev - 1 + foto.length) % foto.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPaused(true);
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveIndex((prev) => (prev + 1) % foto.length);
  };

  if (!foto || foto.length === 0) {
    return (
      <div className="aspect-video bg-zinc-100 flex flex-col items-center justify-center text-zinc-400 gap-2 rounded-t-3xl border-b border-slate-200">
        <Camera className="w-8 h-8 stroke-[1.5] text-slate-400" />
        <span className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-500">Nessuna Foto</span>
      </div>
    );
  }

  return (
    <div 
      className="relative aspect-video w-full overflow-hidden rounded-2xl border-b border-slate-200 group bg-zinc-950 flex items-center justify-center select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Sfondo sfumato ambientale per foto con orientamenti diversi */}
      <img
        src={foto[activeIndex]}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover blur-xl opacity-35 scale-110 pointer-events-none"
      />
      <img
        src={foto[activeIndex]}
        alt={`Foto ${activeIndex + 1}`}
        className="relative z-10 w-full h-full object-contain transition-all duration-500 ease-in-out"
        referrerPolicy="no-referrer"
      />

      {foto.length > 1 && (
        <>
          {/* Frecce laterali SEMPRE VISIBILI con alto contrasto */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 bg-black/80 hover:bg-[#FFE600] text-white hover:text-black p-3 rounded-full shadow-2xl transition-all duration-200 cursor-pointer backdrop-blur-md border border-white/20 hover:scale-110 active:scale-95 flex items-center justify-center"
            aria-label="Foto precedente"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 bg-black/80 hover:bg-[#FFE600] text-white hover:text-black p-3 rounded-full shadow-2xl transition-all duration-200 cursor-pointer backdrop-blur-md border border-white/20 hover:scale-110 active:scale-95 flex items-center justify-center"
            aria-label="Foto successiva"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Badge contatore foto (es. 2 / 8) */}
          <div className="absolute top-3 right-3 z-30 bg-black/75 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-mono font-bold border border-white/10 shadow">
            {activeIndex + 1} / {foto.length}
          </div>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            {foto.map((_, i) => (
              <button
                type="button"
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused(true);
                  if (timerRef.current) clearInterval(timerRef.current);
                  setActiveIndex(i);
                }}
                className={`h-2 rounded-full transition-all duration-200 cursor-pointer ${
                  i === activeIndex ? 'bg-[#FFE600] w-6' : 'bg-white/50 hover:bg-white w-2'
                }`}
                aria-label={`Vai alla foto ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Big Prestigious Event Showcase Card
export const EventShowcaseCard: React.FC<{ evento: EventoCampTorneo }> = ({ evento }) => {
  const isCamp = evento.tipo === 'CAMP';
  const isTorneo = evento.tipo === 'TORNEO';
  
  const coverImage = evento.locandinaUrl || (Array.isArray(evento.fotoGallery) && evento.fotoGallery[0]) || (Array.isArray(evento.archivio?.foto) && evento.archivio.foto[0]);
  const hasValidPhoto = Boolean(coverImage && typeof coverImage === 'string' && coverImage.trim().startsWith('http'));

  const badgeTheme = isCamp 
    ? 'bg-[#FFE600] text-zinc-950 font-black' 
    : isTorneo 
      ? 'bg-purple-600 text-white font-black' 
      : 'bg-blue-600 text-white font-black';

  const hoverBorder = isCamp
    ? 'hover:border-amber-400/80 hover:shadow-amber-500/10'
    : isTorneo
      ? 'hover:border-purple-400/80 hover:shadow-purple-500/10'
      : 'hover:border-blue-400/80 hover:shadow-blue-500/10';

  const quota = isCamp 
    ? (evento.camp?.quotaIscrizione || (evento as any).quota)
    : isTorneo
      ? (evento.torneo?.categoria || 'Torneo Federale')
      : (evento.camp?.quotaIscrizione || null);

  const features = evento.camp?.cosaCOffriamo && evento.camp.cosaCOffriamo.length > 0
    ? evento.camp.cosaCOffriamo
    : [
        'Staff Federale Qualificato FIPAV',
        'Assicurazione Inclusa',
        'Impianto Ufficiale Forlì'
      ];

  return (
    <Link
      to={`/camp-tornei/${evento.id}`}
      className={`group bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col lg:flex-row items-stretch cursor-pointer ${hoverBorder}`}
    >
      {/* Visual / Poster Container (42% width on lg) */}
      <div className="relative w-full lg:w-[42%] min-h-[280px] sm:min-h-[320px] lg:min-h-[360px] bg-zinc-950 overflow-hidden flex flex-col justify-between shrink-0">
        {hasValidPhoto ? (
          <img
            src={coverImage}
            alt={evento.titolo}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            style={{
              objectPosition: `${evento.locandinaPositionX ?? 50}% ${evento.locandinaPositionY ?? 50}%`
            }}
          />
        ) : (
          /* High-impact branded Volleyball & Panther Texture Fallback (niente più rettangoli neri!) */
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black flex flex-col items-center justify-center p-6 text-center select-none">
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#FFE600]/15 blur-3xl pointer-events-none" />
            <div className="w-20 h-20 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 flex items-center justify-center text-4xl shadow-inner mb-3 transform group-hover:scale-110 transition-transform">
              {isCamp ? '☀️' : isTorneo ? '🏆' : '🏐'}
            </div>
            <span className="font-barlow font-black text-2xl text-white tracking-wider uppercase drop-shadow">
              NEW VOLLEY ACADEMY
            </span>
            <span className="text-xs font-mono font-bold tracking-widest text-[#FFE600] uppercase mt-1">
              FORLÌ • OFFICIAL EVENT
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/40 lg:bg-gradient-to-r lg:from-transparent lg:to-black/60 pointer-events-none" />

        {/* Top Badges */}
        <div className="relative z-10 p-4 sm:p-5 flex flex-wrap items-center gap-2">
          <span className={`text-xs font-black tracking-wider uppercase px-3 py-1.5 rounded-lg font-mono shadow-md ${badgeTheme}`}>
            {isCamp ? '☀️ SUMMER CAMP' : isTorneo ? '🏆 TORNEO NVA CUP' : '📅 EVENTO SPECIALE'}
          </span>
          {(evento.camp?.numeroEdizione || evento.sottotitolo) && (
            <span className="bg-black/75 backdrop-blur-md text-white text-xs font-mono font-bold px-3 py-1.5 rounded-lg border border-white/20 shadow-sm">
              {evento.camp?.numeroEdizione ? `${evento.camp.numeroEdizione}ª Edizione` : evento.sottotitolo}
            </span>
          )}
        </div>

        {/* Bottom overlay info on photo */}
        <div className="relative z-10 p-4 sm:p-5 flex items-end justify-between gap-3">
          <div className="bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15 text-white flex items-center gap-2 text-xs font-mono">
            <Calendar className="w-4 h-4 text-[#FFE600] shrink-0" />
            <span className="font-bold truncate max-w-[200px]">{evento.dataPeriodo}</span>
          </div>
          {quota && (
            <span className="bg-[#FFE600] text-zinc-950 font-black font-barlow text-sm sm:text-base px-3.5 py-1 rounded-xl shadow-lg">
              {quota}
            </span>
          )}
        </div>
      </div>

      {/* Content Container (58% width on lg) */}
      <div className="w-full lg:w-[58%] p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          {/* Header row: Status badge + Quick location */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {evento.visibilitaIscrizioni === 'APERTE' 
                  ? 'ISCRIZIONI APERTE' 
                  : evento.visibilitaIscrizioni === 'CHIUSE' 
                    ? 'ISCRIZIONI CHIUSE' 
                    : 'INFO IN SEGRETERIA'}
              </span>
            </span>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-inter">
              <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
              <strong className="text-slate-800 font-semibold">{evento.location}</strong>
            </div>
          </div>

          {/* Big Title & Subtitle */}
          <div>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black font-barlow uppercase tracking-tight text-slate-950 group-hover:text-amber-600 transition-colors leading-[1.05]">
              {evento.titolo}
            </h3>
            {evento.sottotitolo && (
              <p className="text-xs sm:text-sm font-mono font-semibold text-slate-500 mt-1">
                {evento.sottotitolo}
              </p>
            )}
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-600 font-inter leading-relaxed line-clamp-3">
            {evento.descrizione}
          </p>

          {/* Feature Pills */}
          {features && features.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {features.slice(0, 3).map((item, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200/70">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>{item}</span>
                </span>
              ))}
              {features.length > 3 && (
                <span className="text-[11px] font-mono text-slate-500 self-center">
                  +{features.length - 3} altri vantaggi
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Bottom Bar */}
        <div className="pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 mt-auto">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            {evento.linkIscrizione?.toLowerCase().includes('golee') ? (
              <span className="bg-amber-100 text-amber-900 font-bold px-2.5 py-1 rounded-md text-[10.5px]">
                Iscrizione Golee Disponibile
              </span>
            ) : evento.pdfModuloCartaceoUrl ? (
              <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-md text-[10.5px] flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Volantino PDF
              </span>
            ) : null}
          </div>

          <div className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-zinc-950 group-hover:bg-[#FFE600] text-[#FFE600] group-hover:text-zinc-950 font-black font-barlow text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 shadow-md group-hover:shadow-lg">
            <span>SCOPRI IL PROGRAMMA & ISCRIVITI</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function CampTornei() {
  const CAMP_CACHE_KEY = 'nva_camptornei_cache_v2';
  
  const getCampCache = (): EventoCampTorneo[] => {
    try {
      const raw = localStorage.getItem(CAMP_CACHE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  };

  const cachedEvents = React.useMemo(() => getCampCache(), []);
  const [eventi, setEventi] = useState<EventoCampTorneo[]>(cachedEvents);
  const [loading, setLoading] = useState(cachedEvents.length === 0);
  const [subTab, setSubTab] = useState<'camp' | 'tornei' | 'generico'>('camp');

  useEffect(() => {
    document.title = "Camp & Tornei | New Volley Academy Forlì";
  }, []);

  // Render box iscrizioni per eventi (link esterno / modulo o avviso chiusura)
  const renderIscrizioniBox = (evento: EventoCampTorneo) => {
    const link = evento.linkIscrizione?.trim();
    const isGolee = link?.toLowerCase().includes('golee');

    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 text-white shadow-xl flex flex-col justify-between h-full space-y-6">
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-5 bg-[#FFE600] rounded-sm inline-block shadow-sm" />
              <h4 className="text-sm font-extrabold uppercase tracking-wide text-[#FFE600] font-barlow">
                Iscrizioni & Info
              </h4>
            </div>
            <span className="text-[10px] font-mono font-bold bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded border border-zinc-800 uppercase">
              {evento.tipo}
            </span>
          </div>

          <div className="space-y-4">
            {/* Download / Visualizzazione Modulo Volantino Cartaceo PDF se presente */}
            {evento.pdfModuloCartaceoUrl && (
              <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-amber-500/15 text-[#FFE600] rounded-lg flex items-center justify-center text-xs font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-bold text-xs uppercase tracking-wider font-barlow truncate">Volantino / Modulo PDF</p>
                    <p className="text-[10.5px] text-zinc-400 font-inter truncate">{evento.pdfModuloCartaceoNome || 'Documento informativo allegato'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openPdfDocument(evento.pdfModuloCartaceoUrl!, evento.pdfModuloCartaceoNome || 'Documento PDF')}
                    className="bg-zinc-800 hover:bg-zinc-700 text-[#FFE600] font-bold py-2.5 px-2 text-xs uppercase font-barlow tracking-wider rounded-xl transition-all flex justify-center items-center gap-1.5 border border-zinc-700 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Visualizza</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadPdfDocument(evento.pdfModuloCartaceoUrl!, evento.pdfModuloCartaceoNome || 'Documento PDF')}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2.5 px-2 text-xs uppercase font-barlow tracking-wider rounded-xl transition-all flex justify-center items-center gap-1.5 border border-zinc-700 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#FFE600]" />
                    <span>Scarica</span>
                  </button>
                </div>
              </div>
            )}

            {/* Logica Iscrizioni / Link Esterno (Golee o portale dedicato) */}
            {evento.visibilitaIscrizioni === 'NASCOSTO' ? (
              <div className="py-6 text-center text-zinc-400 bg-zinc-900/50 rounded-2xl border border-zinc-850 p-4 space-y-2">
                <Info className="w-6 h-6 text-zinc-500 mx-auto" />
                <p className="text-xs font-inter leading-relaxed text-zinc-300 font-medium">Le iscrizioni per questa attività sono gestite direttamente in segreteria.</p>
              </div>
            ) : evento.visibilitaIscrizioni === 'CHIUSE' ? (
              <div className="bg-red-950/40 border border-red-500/30 p-5 rounded-2xl text-center space-y-2">
                <div className="w-10 h-10 bg-red-500/15 text-red-400 rounded-full flex items-center justify-center mx-auto text-lg font-bold">⚠️</div>
                <p className="text-red-400 font-extrabold text-xs uppercase tracking-wider font-barlow">Iscrizioni Chiuse</p>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-inter">
                  Le iscrizioni per questo evento sono al momento chiuse per raggiungimento posti o termine adesioni.
                </p>
              </div>
            ) : link ? (
              <div className="bg-gradient-to-b from-[#FFE600]/15 to-transparent border border-[#FFE600]/30 p-5 rounded-2xl text-center space-y-3 shadow-lg">
                <div className="w-10 h-10 bg-[#FFE600]/20 text-[#FFE600] rounded-full flex items-center justify-center mx-auto text-lg font-bold">
                  ✍️
                </div>
                <div>
                  <p className="text-white font-extrabold text-xs uppercase tracking-wider font-barlow">
                    Iscrizione Online Attiva
                  </p>
                  <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed font-inter">
                    Verrai reindirizzato al portale ufficiale {isGolee ? 'Golee' : ''} per completare la procedura.
                  </p>
                </div>
                <a
                  href={link.startsWith('http') ? link : `https://${link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#FFE600] hover:bg-[#ebd400] text-zinc-950 font-black py-3.5 px-4 text-xs uppercase font-barlow tracking-wider rounded-xl transition-all shadow-md shadow-[#FFE600]/20 flex justify-center items-center gap-2 group cursor-pointer"
                >
                  <span>
                    {isGolee ? 'ISCRIVITI SU GOLEE' : 'ISCRIVITI ONLINE'}
                  </span>
                  <ExternalLink className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            ) : (
              <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl text-center space-y-2">
                <div className="w-10 h-10 bg-zinc-800 text-zinc-400 rounded-full flex items-center justify-center mx-auto text-base">ℹ️</div>
                <p className="text-zinc-300 text-xs font-semibold leading-relaxed font-inter">
                  Per informazioni e iscrizioni contatta la segreteria societaria.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Support Info */}
        <div className="pt-4 border-t border-zinc-850/80 flex items-center gap-2 text-zinc-400 text-[11px] font-inter">
          <CheckCircle2 className="w-4 h-4 text-[#FFE600] shrink-0" />
          <span>Supporto rapido via WhatsApp sempre attivo</span>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (isDemoMode) {
      setLoading(true);
      getCampTorneiAll().then(data => {
        setEventi(data || []);
        setLoading(false);
      }).catch(err => {
        console.error("Errore nel caricamento camp e tornei (demo):", err);
        setLoading(false);
      });
      return;
    }

    setLoading(true);
    const ref = collection(db, 'eventi_camp_tornei');
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const list: EventoCampTorneo[] = [];
      snapshot.forEach(docSnap => {
        list.push(mapToUnifiedEvento(docSnap.data(), docSnap.id));
      });
      const sorted = list.sort((a, b) => a.ordine - b.ordine);
      setEventi(sorted);
      try {
        localStorage.setItem(CAMP_CACHE_KEY, JSON.stringify(sorted));
      } catch (e) {}
      setLoading(false);
    }, (error) => {
      console.error("Errore nel listener eventi_camp_tornei:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter events
  const activeEvents = eventi.filter(e => e.stato === 'ATTIVO');
  const storicoEvents = eventi.filter(e => e.stato === 'CONCLUSO');

  const activeCamps = activeEvents.filter(e => e.tipo === 'CAMP');
  const activeTornei = activeEvents.filter(e => e.tipo === 'TORNEO');
  const activeGenerici = activeEvents.filter(e => e.tipo === 'GENERICO');

  // Determine which subtab to default to if no camps but there are tornei
  useEffect(() => {
    if (!loading) {
      if (activeCamps.length === 0 && activeTornei.length > 0) {
        setSubTab('tornei');
      } else if (activeCamps.length === 0 && activeTornei.length === 0 && activeGenerici.length > 0) {
        setSubTab('generico');
      }
    }
  }, [loading, activeCamps.length, activeTornei.length, activeGenerici.length]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFE600]"></div>
      </div>
    );
  }

  // Check if all events across both sub-tabs (or all three) are hidden or non-existent
  const isNoActiveEventsAtAll = activeCamps.length === 0 && activeTornei.length === 0 && activeGenerici.length === 0;

  return (
    <div className="w-full">
      {/* ================= HERO HEADER CAMP & TORNEI FULL-BLEED ================= */}
      <section className="relative w-full bg-zinc-950 border-b border-zinc-850 overflow-hidden pt-6 pb-6 sm:pt-8 sm:pb-8">
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,230,0,0.14),rgba(255,255,255,0))]" />
          <div className="absolute -top-24 left-1/3 w-96 h-96 bg-[#FFE600]/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          {/* Header Snello e Diretto */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/80 pb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/80 border border-[#FFE600]/40 text-[#FFE600] text-xs font-mono font-bold tracking-widest uppercase shadow-sm mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ATTIVITÀ & EVENTI • STAGIONE 2026/2027</span>
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-barlow font-black tracking-tight text-white uppercase leading-[0.95] drop-shadow-sm flex items-center gap-3">
                <span>CAMP ESTIVI & TORNEI</span>
              </h1>
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm font-inter max-w-md leading-relaxed">
              Summer camp sulla sabbia e indoor, clinic di perfezionamento tecnico e tornei federali per vivere la pallavolo tutto l'anno.
            </p>
          </div>

          {/* Sub-tabs selector integrato nella Hero */}
          {!isNoActiveEventsAtAll && (
            <div className="flex flex-wrap items-center gap-2 bg-black/90 p-1.5 rounded-2xl border border-zinc-800 shadow-xl w-fit">
              <button
                onClick={() => setSubTab('camp')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold font-barlow uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  subTab === 'camp'
                    ? 'bg-[#FFE600] text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>☀️ Summer Camp</span>
                <span className="text-[10px] opacity-75">({activeCamps.length})</span>
              </button>
              <button
                onClick={() => setSubTab('tornei')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold font-barlow uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  subTab === 'tornei'
                    ? 'bg-[#FFE600] text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>🏆 NVA Cup & Tornei</span>
                <span className="text-[10px] opacity-75">({activeTornei.length})</span>
              </button>
              {activeGenerici.length > 0 && (
                <button
                  onClick={() => setSubTab('generico')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold font-barlow uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                    subTab === 'generico'
                      ? 'bg-[#FFE600] text-zinc-950 shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>📅 Eventi Speciali</span>
                  <span className="text-[10px] opacity-75">({activeGenerici.length})</span>
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ================= CONTENUTO SCHEDE CON TRANSIZIONE SFUMATA ================= */}
      <div className="w-full bg-gradient-to-b from-zinc-950 via-slate-900/10 to-slate-100/95 py-8 sm:py-10 transition-all relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* SEZIONE EDIZIONI CORRENTI */}
          <div className="space-y-8">
            {isNoActiveEventsAtAll ? (
              /* Se tutti gli eventi sono nascosti o non esistono */
              <div className="bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-3xl p-12 text-center space-y-3 shadow-sm max-w-2xl mx-auto">
                <Sun className="w-12 h-12 text-amber-500 mx-auto animate-pulse" />
                <h3 className="font-barlow text-slate-900 uppercase tracking-wide text-xl font-bold">
                  Prossime edizioni in arrivo
                </h3>
                <p className="font-inter text-slate-500 text-sm leading-relaxed">
                  Non ci sono eventi attivi o iscrizioni aperte al momento. Seguici per non perdere le novità delle prossime date.
                </p>
              </div>
            ) : (
              <div>
                {/* SUB-TAB: CAMP */}
                {subTab === 'camp' && (
                  <div className="space-y-8">
                    {activeCamps.length === 0 ? (
                      <div className="bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-3xl p-12 text-center space-y-2 shadow-sm">
                        <p className="font-inter text-slate-600 text-sm font-semibold">
                          Nessun Summer Camp attivo al momento — le nuove date verranno pubblicate a breve.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {activeCamps.map((campEvent) => (
                          <EventShowcaseCard key={campEvent.id} evento={campEvent} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SUB-TAB: TORNEI */}
                {subTab === 'tornei' && (
                  <div className="space-y-8">
                    {activeTornei.length === 0 ? (
                      <div className="bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-3xl p-12 text-center space-y-2 shadow-sm">
                        <p className="font-inter text-slate-600 text-sm font-semibold">
                          Prossime edizioni e tornei in arrivo — seguici per non perdere le novità.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {activeTornei.map((torneoEvent) => (
                          <EventShowcaseCard key={torneoEvent.id} evento={torneoEvent} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SUB-TAB: GENERICO */}
                {subTab === 'generico' && (
                  <div className="space-y-8">
                    {activeGenerici.length === 0 ? (
                      <div className="bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-3xl p-12 text-center space-y-2 shadow-sm">
                        <p className="font-inter text-slate-600 text-sm font-semibold">
                          Nessun evento speciale in programma al momento.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {activeGenerici.map((genericoEvent) => (
                          <EventShowcaseCard key={genericoEvent.id} evento={genericoEvent} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ================= SEZIONE STORICO EDIZIONI ================= */}
          {storicoEvents.length > 0 && (
            <div className="space-y-6 pt-8 border-t border-slate-300/80">
              <div className="flex items-center gap-2.5 pb-2">
                <span className="w-2.5 h-6 bg-[#FFE600] rounded-sm inline-block shadow-sm" />
                <Trophy className="w-5 h-5 text-amber-600" />
                <h3 className="font-barlow font-black text-slate-950 uppercase tracking-tight text-2xl">
                  STORICO EDIZIONI PASSATE
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {storicoEvents.map((storicoEvent) => {
                  const { archivio } = storicoEvent;
                  if (!archivio) return null;

                  return (
                    <div 
                      key={storicoEvent.id} 
                      className="bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:border-[#FFE600] transition-all duration-300 flex flex-col justify-between"
                    >
                      {/* Photo Carousel */}
                      <StoricoCarousel foto={archivio.foto || []} />

                      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          {/* Badge Edizione */}
                          <span className="inline-block bg-[#FFE600] text-zinc-950 px-3 py-1 rounded-md text-[11px] font-bold font-mono uppercase tracking-wider shadow-sm">
                            {archivio.etichettaEdizione || "Edizione Passata"}
                          </span>

                          {/* Titolo e Periodo */}
                          <div>
                            <h4 className="font-extrabold text-slate-950 text-lg uppercase tracking-wide font-barlow">
                              {storicoEvent.titolo}
                            </h4>
                            <p className="text-xs text-slate-400 mt-1 font-mono font-medium">
                              {storicoEvent.dataPeriodo}
                            </p>
                          </div>

                          {/* Highlight in italic */}
                          {archivio.highlight && (
                            <p className="text-xs text-slate-600 italic font-inter leading-relaxed bg-slate-50 border-l-2 border-[#FFE600] p-3 rounded-r-xl">
                              “{archivio.highlight}”
                            </p>
                          )}
                        </div>

                        {/* Tre dati salienti in riga */}
                        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100">
                          <div>
                            <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-inter font-bold">
                              Partecipanti
                            </span>
                            <span className="block text-sm font-extrabold text-slate-950 mt-0.5 font-mono">
                              {archivio.partecipanti || 0}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-inter font-bold">
                              Location / Sede
                            </span>
                            <span className="block text-xs font-bold text-slate-900 mt-0.5 font-inter truncate" title={storicoEvent.location}>
                              {storicoEvent.location || "NVA Academy"}
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
