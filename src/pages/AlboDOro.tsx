import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Award, 
  Sparkles, 
  Calendar, 
  Filter, 
  X, 
  Share2, 
  ChevronRight, 
  ChevronLeft,
  Maximize2, 
  Medal, 
  Flame,
  MousePointer,
  RotateCcw,
  Star,
  Quote,
  ArrowLeft,
  Check,
  Shirt,
  UserCheck,
  ShieldCheck,
  Camera
} from 'lucide-react';
import { 
  AtletaPremiato, 
  PremioVinto,
  Giocatore,
  RosaSquadra,
  getHallOfFameAll, 
  getGiocatoriAll,
  getSquadreAll,
  OspiteIllustre,
  EventoOspite,
  getEventiOspite,
  getAnniOspite,
  getOspitiIllustriAll,
  getAllFotoOspite
} from '../firebase-societa';
import { updatePageMeta } from '../utils/seoHelper';

const HOF_CACHE_KEY = 'nva_hof_cached_list';
const OSPITI_CACHE_KEY = 'nva_ospiti_cached_list';

export default function AlboDOro() {
  const [searchParams] = useSearchParams();
  const paramSezione = searchParams.get('sezione');

  // Selettore galleria: "nostri" (Albo d'Oro atleti NVA) oppure "ospiti" (Ospiti Illustri & Leggende)
  const [sezioneAttiva, setSezioneAttiva] = useState<'nostri' | 'ospiti'>(() => {
    return paramSezione === 'ospiti' ? 'ospiti' : 'nostri';
  });

  // Aggiorna sezioneAttiva se il parametro nella URL cambia (es. da tendina Navbar)
  useEffect(() => {
    if (paramSezione === 'ospiti' && sezioneAttiva !== 'ospiti') {
      setSezioneAttiva('ospiti');
    } else if (paramSezione === 'nostri' && sezioneAttiva !== 'nostri') {
      setSezioneAttiva('nostri');
    }
  }, [paramSezione]);

  const [atleti, setAtleti] = useState<AtletaPremiato[]>(() => {
    try {
      const cached = localStorage.getItem(HOF_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [ospiti, setOspiti] = useState<OspiteIllustre[]>(() => {
    try {
      const cached = localStorage.getItem(OSPITI_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [giocatori, setGiocatori] = useState<Giocatore[]>([]);
  const [squadre, setSquadre] = useState<RosaSquadra[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAtleta, setSelectedAtleta] = useState<AtletaPremiato | null>(null);
  const [selectedOspite, setSelectedOspite] = useState<OspiteIllustre | null>(null);
  const [filtroAnno, setFiltroAnno] = useState<string>('TUTTI');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TUTTI');
  const [filtroAnnoOspiti, setFiltroAnnoOspiti] = useState<string>('TUTTI');
  
  // Mouse Parallax & Pan state
  const wallContainerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [targetOffset, setTargetOffset] = useState({ x: 0, y: 0 });
  const [parallaxEnabled, setParallaxEnabled] = useState(true);

  useEffect(() => {
    if (sezioneAttiva === 'nostri') {
      updatePageMeta({
        title: "Albo d'Oro Pantere | New Volley Academy Forlì",
        description: "Scopri l'Albo d'Oro ufficiale, le atlete premiate, i titoli e la Hall of Fame della New Volley Academy Forlì.",
        url: "https://newvolleyacademy.it/albo-d-oro?sezione=nostri"
      });
    } else {
      updatePageMeta({
        title: "Ospiti Illustri & Leggende | New Volley Academy Forlì",
        description: "La galleria d'onore e i totem celebrativi delle leggende e dei grandi campioni della pallavolo ospiti alla New Volley Academy Forlì.",
        url: "https://newvolleyacademy.it/albo-d-oro?sezione=ospiti"
      });
    }
    loadData();
  }, [sezioneAttiva]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [hofData, ospitiData, gioData, sqData] = await Promise.all([
        getHallOfFameAll().catch(() => []),
        getOspitiIllustriAll().catch(() => []),
        getGiocatoriAll().catch(() => []),
        getSquadreAll().catch(() => [])
      ]);
      setAtleti(hofData);
      try {
        localStorage.setItem(HOF_CACHE_KEY, JSON.stringify(hofData));
      } catch (e) {}

      setOspiti(ospitiData);
      try {
        localStorage.setItem(OSPITI_CACHE_KEY, JSON.stringify(ospitiData));
      } catch (e) {}

      setGiocatori(gioData || []);
      setSquadre(sqData || []);
    } catch (err) {
      console.error("Errore caricamento albo d'oro e ospiti:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calcola gli anni unici presenti per atleti NVA
  const anniDisponibili = Array.from(new Set(atleti.map(a => a.anno).filter(Boolean))).sort().reverse();
  const categorieDisponibili = Array.from(new Set(atleti.map(a => a.categoria).filter(Boolean)));

  // Calcola tutti i singoli anni distinti per ospiti illustri (senza raggrupparli o concatenarli)
  const tuttiAnniOspiti = ospiti.flatMap(o => getAnniOspite(o)).filter(Boolean);
  const anniOspitiDisponibili = Array.from(new Set(tuttiAnniOspiti)).sort((a, b) => b.localeCompare(a));

  // Filtra atleti NVA
  const atletiFiltrati = atleti.filter(a => {
    const matchAnno = filtroAnno === 'TUTTI' || a.anno === filtroAnno;
    const matchCat = filtroCategoria === 'TUTTI' || a.categoria === filtroCategoria;
    return matchAnno && matchCat;
  });

  // Filtra ospiti illustri: verifica se l'anno selezionato appartiene agli anni di visita dell'ospite
  const ospitiFiltrati = ospiti.filter(o => {
    if (filtroAnnoOspiti === 'TUTTI') return true;
    const anniOspite = getAnniOspite(o);
    return anniOspite.includes(filtroAnnoOspiti);
  });

  // Gestione movimento mouse per parallasse visuale fluido
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!parallaxEnabled) return;
    const { clientX, clientY, currentTarget } = e;
    const { width, height, left, top } = currentTarget.getBoundingClientRect();
    
    // Normalizza da -1 a 1 dal centro
    const normX = ((clientX - left) / width - 0.5) * 2;
    const normY = ((clientY - top) / height - 0.5) * 2;

    setMousePos({ x: normX, y: normY });
    // Spostamento visuale massimo di 45px orizzontale e 30px verticale
    setTargetOffset({
      x: -normX * 45,
      y: -normY * 30
    });
  };

  const handleResetView = () => {
    setTargetOffset({ x: 0, y: 0 });
    setMousePos({ x: 0, y: 0 });
  };

  return (
    <div className={`min-h-screen select-none relative overflow-hidden flex flex-col justify-between transition-colors duration-500 ${
      sezioneAttiva === 'ospiti' 
        ? 'bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] text-zinc-900' 
        : 'bg-[#0d0e12] text-white'
    }`}>
      
      {/* Texture della parete della galleria / padiglione */}
      <div 
        className={`absolute inset-0 pointer-events-none ${
          sezioneAttiva === 'ospiti'
            ? 'opacity-40 mix-blend-multiply'
            : 'opacity-25 mix-blend-overlay'
        }`}
        style={{
          backgroundImage: sezioneAttiva === 'ospiti'
            ? `radial-gradient(circle at 50% 50%, rgba(148, 163, 184, 0.28) 1px, transparent 1px)`
            : `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Illuminazione faretti a soffitto (Spotlights dinamici reattivi al mouse) */}
      <div 
        className="absolute top-0 left-1/4 w-96 h-[500px] pointer-events-none transition-all duration-700 ease-out"
        style={{
          background: sezioneAttiva === 'ospiti'
            ? `radial-gradient(ellipse at 50% 0%, rgba(245, 158, 11, 0.12) 0%, rgba(254, 240, 138, 0.04) 50%, transparent 80%)`
            : `radial-gradient(ellipse at 50% 0%, rgba(255, 230, 0, 0.18) 0%, rgba(255, 215, 0, 0.05) 50%, transparent 80%)`,
          transform: `translateX(${mousePos.x * 25}px)`
        }}
      />
      <div 
        className="absolute top-0 right-1/4 w-96 h-[500px] pointer-events-none transition-all duration-700 ease-out"
        style={{
          background: sezioneAttiva === 'ospiti'
            ? `radial-gradient(ellipse at 50% 0%, rgba(245, 158, 11, 0.10) 0%, rgba(254, 240, 138, 0.03) 50%, transparent 80%)`
            : `radial-gradient(ellipse at 50% 0%, rgba(255, 230, 0, 0.15) 0%, rgba(255, 215, 0, 0.04) 50%, transparent 80%)`,
          transform: `translateX(${mousePos.x * 35}px)`
        }}
      />

      {/* ========================================================================= */}
      {/* GRADIENTE SCURO DI PROFONDITÀ (SFUMA DALL'INTESTAZIONE VERSO LE FOTO)      */}
      {/* ========================================================================= */}
      <div 
        className="absolute top-0 inset-x-0 h-[620px] pointer-events-none z-0 transition-opacity duration-700"
        style={{
          background: 'linear-gradient(180deg, rgba(9, 11, 16, 0.94) 0%, rgba(13, 16, 24, 0.86) 38%, rgba(18, 22, 32, 0.50) 68%, rgba(22, 26, 38, 0.15) 88%, transparent 100%)'
        }}
      />

      {/* BARRA SUPERIORE: INTESTAZIONE, SELETTORE GALLERIA E FILTRI */}
      <header className="relative z-30 pt-10 pb-6 px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/35 text-amber-300 text-xs font-mono font-bold tracking-widest uppercase mb-2 shadow-sm">
              {sezioneAttiva === 'nostri' ? (
                <>
                  <Trophy className="w-3.5 h-3.5" />
                  <span>GALLERIA DEI TRAGUARDI • ALBO D'ORO</span>
                </>
              ) : (
                <>
                  <Star className="w-3.5 h-3.5" />
                  <span>LE NOSTRE LEGGENDE • OSPITI ILLUSTRI</span>
                </>
              )}
            </div>
            <h1 className="text-3xl sm:text-5xl font-black font-barlow uppercase tracking-tight drop-shadow-md text-white">
              {sezioneAttiva === 'nostri' ? (
                <>
                  ALBO D'ORO <span className="text-[#FFE600]">&amp; HALL OF FAME</span>
                </>
              ) : (
                <>
                  OSPITI ILLUSTRI <span className="text-amber-400">&amp; GRANDI CAMPIONI</span>
                </>
              )}
            </h1>
            <p className="text-xs sm:text-sm font-inter max-w-2xl mt-1.5 leading-relaxed text-zinc-300 drop-shadow-sm font-medium">
              {sezioneAttiva === 'nostri'
                ? "I quadri d'onore dedicati alle nostre atlete e ai nostri atleti che hanno conquistato premi individuali, titoli regionali e convocazioni storiche con la maglia New Volley Academy."
                : "Le grandi personalità della pallavolo italiana ed internazionale passate dalla New Volley Academy: campioni olimpici, atleti di Superlega e tecnici federali che hanno ispirato le nostre pantere."}
            </p>
          </div>

          {/* Controller Interattivo Parallasse & Contatore */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-mono shadow-sm bg-zinc-900/90 border border-zinc-700/80 text-zinc-200">
              {sezioneAttiva === 'nostri' ? (
                <>
                  <Medal className="w-4 h-4 text-[#FFE600]" />
                  <span><strong>{atletiFiltrati.length}</strong> {atletiFiltrati.length === 1 ? 'Premiata' : 'Premiate/i'}</span>
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 text-amber-400" />
                  <span><strong>{ospitiFiltrati.length}</strong> {ospitiFiltrati.length === 1 ? 'Ospite d\'Onore' : 'Ospiti d\'Onore'}</span>
                </>
              )}
            </div>

            <button
              onClick={() => setParallaxEnabled(!parallaxEnabled)}
              className={`hidden sm:flex px-3 py-2 rounded-xl text-xs font-mono font-bold items-center gap-1.5 transition-all cursor-pointer border ${
                parallaxEnabled 
                  ? 'bg-[#FFE600] text-black border-[#FFE600] shadow-[0_0_15px_rgba(255,230,0,0.3)]' 
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
              title="Attiva/Disattiva effetto visuale dinamico con il mouse"
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span>{parallaxEnabled ? 'Visuale Dinamica ON' : 'Visuale Fissa'}</span>
            </button>

            {parallaxEnabled && (
              <button
                onClick={handleResetView}
                className="hidden sm:flex p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white cursor-pointer transition-colors"
                title="Ricentra la visuale"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* FILTRI DI NAVIGAZIONE SPECIFICI */}
        {sezioneAttiva === 'nostri' ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Filtro Anno */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mr-1 hidden sm:inline">Stagione:</span>
              <button
                onClick={() => setFiltroAnno('TUTTI')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition-all ${
                  filtroAnno === 'TUTTI'
                    ? 'bg-white text-black shadow-md'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                Tutte
              </button>
              {anniDisponibili.map(anno => (
                <button
                  key={anno}
                  onClick={() => setFiltroAnno(anno)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider cursor-pointer transition-all ${
                    filtroAnno === anno
                      ? 'bg-[#FFE600] text-black shadow-md'
                      : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  {anno}
                </button>
              ))}
            </div>

            {/* Filtro Categoria se presenti */}
            {categorieDisponibili.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mr-1 hidden sm:inline">Categoria:</span>
                <button
                  onClick={() => setFiltroCategoria('TUTTI')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase cursor-pointer transition-all ${
                    filtroCategoria === 'TUTTI'
                      ? 'bg-zinc-800 text-[#FFE600] border border-[#FFE600]/40'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Tutte
                </button>
                {categorieDisponibili.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFiltroCategoria(cat)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold cursor-pointer transition-all ${
                      filtroCategoria === cat
                        ? 'bg-zinc-800 text-[#FFE600] border border-[#FFE600]/40'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : anniOspitiDisponibili.length > 0 ? (
          /* FILTRO ANNO PER OSPITI ILLUSTRI */
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
            <span className={`text-[11px] font-mono uppercase tracking-wider mr-1 hidden sm:inline ${
              sezioneAttiva === 'ospiti' ? 'text-zinc-600 font-bold' : 'text-zinc-500'
            }`}>Anno Visita:</span>
            <button
              onClick={() => setFiltroAnnoOspiti('TUTTI')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition-all shadow-sm ${
                filtroAnnoOspiti === 'TUTTI'
                  ? 'bg-amber-400 text-black shadow-md font-bold'
                  : 'bg-zinc-900/80 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-700/70'
              }`}
            >
              Tutti gli Ospiti
            </button>
            {anniOspitiDisponibili.map(anno => (
              <button
                key={anno}
                onClick={() => setFiltroAnnoOspiti(anno)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider cursor-pointer transition-all shadow-sm ${
                  filtroAnnoOspiti === anno
                    ? 'bg-amber-400 text-black shadow-md font-bold'
                    : 'bg-zinc-900/80 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-700/70'
                }`}
              >
                {anno}
              </button>
            ))}
          </div>
        ) : null}
      </header>

      {/* LA PARETE GALLERIA DEI QUADRI (CANVAS INTERATTIVO CON EFFETTO PARALLASSE) */}
      <main 
        ref={wallContainerRef}
        onMouseMove={handleMouseMove}
        className="relative z-20 flex-1 w-full px-4 sm:px-8 py-10 md:py-16 overflow-hidden flex items-center justify-center min-h-[620px]"
      >
        {/* Faretto radente a terra (pavimento galleria / padiglione) */}
        <div className={`absolute bottom-0 inset-x-0 h-40 pointer-events-none ${
          sezioneAttiva === 'ospiti'
            ? 'bg-gradient-to-t from-slate-300/30 via-slate-200/10 to-transparent'
            : 'bg-gradient-to-t from-black via-black/40 to-transparent'
        }`} />

        <div 
          className="w-full max-w-7xl mx-auto transition-transform duration-500 ease-out will-change-transform"
          style={{
            transform: `translate3d(${targetOffset.x}px, ${targetOffset.y}px, 0)`
          }}
        >
          {/* VISTA 1: ATLETI NOSTRI */}
          {sezioneAttiva === 'nostri' && (
            <>
              {loading && atleti.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10 lg:gap-12 items-center justify-items-center">
                  {[1, 2, 3, 4].map((sk, index) => {
                    const staggeredOffsets = [
                      "sm:-translate-y-4 md:-translate-y-8",
                      "sm:translate-y-2 md:translate-y-6",
                      "sm:-translate-y-2 md:-translate-y-4",
                      "sm:translate-y-4 md:translate-y-10"
                    ];
                    const staggerClass = staggeredOffsets[index % staggeredOffsets.length];
                    return (
                      <div key={sk} className={`w-full max-w-[310px] transform ${staggerClass}`}>
                        <div className="bg-[#18191d] p-3 rounded-lg border-2 border-[#FFE600]/20 shadow-2xl animate-pulse space-y-3">
                          <div className="w-full aspect-[3/4] bg-zinc-900/90 rounded border border-white/5 flex items-center justify-center">
                            <Trophy className="w-10 h-10 text-zinc-700/50 animate-pulse" />
                          </div>
                          <div className="bg-black/60 p-3 rounded border border-zinc-800 space-y-2">
                            <div className="h-3 bg-zinc-800 rounded w-1/3 mx-auto" />
                            <div className="h-4 bg-zinc-700 rounded w-3/4 mx-auto" />
                            <div className="h-3 bg-zinc-800 rounded w-1/2 mx-auto" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : atletiFiltrati.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/40 rounded-3xl border border-zinc-800 p-8 max-w-md mx-auto space-y-3">
                  <Trophy className="w-10 h-10 text-zinc-600 mx-auto" />
                  <p className="text-zinc-300 font-bold font-barlow text-lg uppercase">
                    {atleti.length === 0 ? "Bacheca in allestimento" : "Nessun quadro trovato"}
                  </p>
                  <p className="text-xs text-zinc-500 font-inter">
                    {atleti.length === 0 
                      ? "A breve saranno pubblicati i quadri d'onore delle nostre Pantere."
                      : "Nessuna giocatrice o giocatore corrisponde ai filtri selezionati."}
                  </p>
                  {atleti.length > 0 && (
                    <button
                      onClick={() => { setFiltroAnno('TUTTI'); setFiltroCategoria('TUTTI'); }}
                      className="mt-2 px-4 py-2 bg-[#FFE600] text-black font-bold text-xs uppercase font-barlow rounded-xl cursor-pointer"
                    >
                      Reimposta Filtri
                    </button>
                  )}
                </div>
              ) : (
                /* COMPOSIZIONE A PARETE: Layout sfalsato e armonico ("sparse vicine") */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10 lg:gap-12 items-center justify-items-center">
                  {atletiFiltrati.map((atleta, index) => {
                    const staggeredOffsets = [
                      "sm:-translate-y-4 md:-translate-y-8",
                      "sm:translate-y-2 md:translate-y-6",
                      "sm:-translate-y-2 md:-translate-y-4",
                      "sm:translate-y-4 md:translate-y-10",
                      "sm:-translate-y-6 md:-translate-y-10",
                      "sm:translate-y-1 md:translate-y-4"
                    ];
                    const staggerClass = staggeredOffsets[index % staggeredOffsets.length];

                    return (
                      <div 
                        key={atleta.id} 
                        className={`w-full max-w-[310px] transform transition-transform duration-300 ${staggerClass}`}
                      >
                        <QuadroAppeso 
                          atleta={atleta} 
                          onClick={() => setSelectedAtleta(atleta)} 
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* VISTA 2: OSPITI ILLUSTRI & LEGGENDE (TOTEM DA ARENA OLIMPICA / FIVB) */}
          {sezioneAttiva === 'ospiti' && (
            <>
              {loading && ospiti.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 max-w-6xl mx-auto w-full">
                  {[1, 2, 3].map((sk) => (
                    <div key={sk} className="h-[540px] sm:h-[580px] rounded-3xl bg-[#161821]/70 border border-zinc-800 animate-pulse flex flex-col justify-between p-6 overflow-hidden">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                        <div className="h-3 bg-zinc-800 rounded w-28" />
                        <div className="h-3 bg-zinc-800 rounded w-12" />
                      </div>
                      <div className="space-y-3">
                        <div className="h-4 bg-zinc-800 rounded w-32" />
                        <div className="h-8 bg-zinc-700 rounded w-3/4" />
                        <div className="h-4 bg-zinc-800 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : ospitiFiltrati.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/40 rounded-3xl border border-zinc-800 p-8 max-w-md mx-auto space-y-3">
                  <Star className="w-10 h-10 text-amber-500 mx-auto" />
                  <p className="text-zinc-300 font-bold font-barlow text-lg uppercase">
                    {ospiti.length === 0 ? "Galleria in allestimento" : "Nessun ospite illustre trovato"}
                  </p>
                  <p className="text-xs text-zinc-500 font-inter">
                    {ospiti.length === 0 
                      ? "A breve saranno presentate le grandi personalità e i campioni della pallavolo che hanno fatto visita alla New Volley Academy."
                      : "Nessuna personalità o leggenda corrisponde ai filtri selezionati."}
                  </p>
                  {ospiti.length > 0 && (
                    <button
                      onClick={() => setFiltroAnnoOspiti('TUTTI')}
                      className="mt-2 px-4 py-2 bg-amber-400 text-black font-bold text-xs uppercase font-barlow rounded-xl cursor-pointer"
                    >
                      Mostra Tutti gli Ospiti
                    </button>
                  )}
                </div>
              ) : (
                /* TOTEM D'INGRESSO / GRANDI BANNER DA PALAZZETTO (Stile Arena FIVB) */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 max-w-6xl mx-auto w-full items-stretch">
                  {ospitiFiltrati.map((ospite) => (
                    <TotemOspiteArena 
                      key={ospite.id} 
                      ospite={ospite} 
                      filtroAnno={filtroAnnoOspiti}
                      onClick={() => setSelectedOspite(ospite)} 
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* FOOTER DELLA GALLERIA */}
      <footer className={`relative z-20 py-6 text-center text-xs font-mono border-t ${
        sezioneAttiva === 'ospiti'
          ? 'bg-white/50 border-zinc-200/80 text-zinc-500'
          : 'bg-transparent border-white/5 text-zinc-500'
      }`}>
        <p>New Volley Academy Forlì • Hall of Fame Ufficiale delle Pantere &amp; Galleria Leggende</p>
      </footer>

      {/* MODALI CELEBRATIVI */}
      <AnimatePresence>
        {selectedAtleta && (
          <ModalDettaglioGiocatrice 
            atleta={selectedAtleta} 
            tuttiAtleti={atleti}
            giocatori={giocatori}
            squadre={squadre}
            onClose={() => setSelectedAtleta(null)} 
          />
        )}

        {selectedOspite && (
          <ModalDettaglioOspite 
            ospite={selectedOspite} 
            onClose={() => setSelectedOspite(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// COMPONENTE: IL QUADRO APPESO ALLA PARETE
// ==========================================
interface QuadroAppesoProps {
  atleta: AtletaPremiato;
  onClick: () => void;
}

function QuadroAppeso({ atleta, onClick }: QuadroAppesoProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="group relative flex flex-col items-center cursor-pointer transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Cavo/Gancio di sospensione a parete invisibile o accennato con ombra */}
      <div className="w-1 h-3 bg-zinc-800 -mb-1 rounded-t opacity-40 group-hover:opacity-80 transition-opacity" />

      {/* STRUTTURA DEL QUADRO CON MODANATURA E PASSEPARTOUT */}
      <div 
        className="relative w-full rounded-lg transition-all duration-300 ease-out"
        style={{
          boxShadow: isHovered 
            ? '0 30px 60px -12px rgba(0, 0, 0, 0.95), 0 0 35px rgba(255, 230, 0, 0.25)' 
            : '0 20px 40px -10px rgba(0, 0, 0, 0.85), 0 0 1px rgba(255, 255, 255, 0.2)',
          transform: isHovered ? 'scale(1.03) translateY(-6px)' : 'scale(1) translateY(0)'
        }}
      >
        {/* CORNICE ESTERNA NERA EBANO CON BORDINO IN ORO / OTTONE */}
        <div className="bg-[#141518] p-3 sm:p-3.5 rounded-lg border-2 border-[#FFE600]/40 ring-1 ring-black/80 shadow-inner">
          
          {/* PASSEPARTOUT AVORIO / BIANCO ANTICO */}
          <div className="bg-[#f5f3ed] p-3 rounded shadow-md border border-black/10 relative overflow-hidden">
            
            {/* VETRO ANTIRIFLESSO CON LEGGERO GRADIENTE */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none z-20 group-hover:opacity-75 transition-opacity" />

            {/* FOTOGRAFIA DELL'ATLETA */}
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-sm bg-zinc-900 border border-zinc-300">
              <img 
                src={atleta.fotoUrl} 
                alt={atleta.nome}
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                style={{
                  objectPosition: `${atleta.fotoPositionX ?? 50}% ${atleta.fotoPositionY ?? 30}%`
                }}
                loading="lazy"
              />

              {/* Badge "In Evidenza" se attivo */}
              {atleta.inEvidenza && (
                <div className="absolute top-2 right-2 z-20 bg-[#FFE600] text-black px-2 py-0.5 rounded text-[9px] font-barlow font-black uppercase tracking-wider shadow">
                  ⭐ D'Onore
                </div>
              )}

              {/* Icona ingrandimento su hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                <span className="bg-[#FFE600] text-black p-2 rounded-full shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                  <Maximize2 className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TARGHETTA INCISA IN OTTONE / ORO SPAZZOLATO SOTTO IL QUADRO */}
      <div 
        className="relative -mt-2 z-10 w-[86%] transition-all duration-300"
        style={{
          transform: isHovered ? 'translateY(-2px)' : 'translateY(0)'
        }}
      >
        <div 
          className="relative px-3 py-2 rounded-sm text-center shadow-2xl border border-[#9b7617]/50"
          style={{
            background: 'linear-gradient(135deg, #eed07b 0%, #d8ad3d 50%, #b8861f 100%)',
            boxShadow: '0 8px 16px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.6), inset 0 -1px 2px rgba(0,0,0,0.4)'
          }}
        >
          {/* Le 4 viti borchiate agli angoli della targhetta */}
          <span className="absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full bg-[#5a420b] shadow-inner opacity-80" />
          <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-[#5a420b] shadow-inner opacity-80" />
          <span className="absolute bottom-1 left-1.5 w-1.5 h-1.5 rounded-full bg-[#5a420b] shadow-inner opacity-80" />
          <span className="absolute bottom-1 right-1.5 w-1.5 h-1.5 rounded-full bg-[#5a420b] shadow-inner opacity-80" />

          {/* Testo inciso nella lamina d'ottone */}
          <div className="space-y-0.5 px-2">
            <h3 
              className="text-xs sm:text-[13px] font-black font-barlow uppercase tracking-wider text-[#1a1202] truncate"
              style={{ textShadow: '0 1px 0 rgba(255, 255, 255, 0.4)' }}
            >
              {atleta.nome}
            </h3>
            
            <p className="text-[10px] font-mono font-bold text-[#3e2e06] uppercase tracking-tight truncate">
              {atleta.titoloPremio}
            </p>

            <div className="flex items-center justify-center gap-1.5 pt-0.5 border-t border-[#87651a]/30 mt-1">
              <span className="text-[9px] font-mono font-black text-[#261b02]">{atleta.anno}</span>
              {atleta.categoria && (
                <>
                  <span className="text-[9px] text-[#694e14]">•</span>
                  <span className="text-[9px] font-barlow font-bold text-[#3d2c07] uppercase truncate max-w-[120px]">{atleta.categoria}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MODAL CELEBRATIVO SCHEDA COMPLETA DELLA GIOCATRICE & PALMARÈS
// ==========================================
interface ModalProps {
  atleta: AtletaPremiato;
  tuttiAtleti: AtletaPremiato[];
  giocatori?: Giocatore[];
  squadre?: RosaSquadra[];
  onClose: () => void;
}

function ModalDettaglioGiocatrice({ atleta, tuttiAtleti, giocatori = [], squadre = [], onClose }: ModalProps) {
  const [copied, setCopied] = useState(false);

  // Supporto tasto Esc per chiudere la scheda
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Trova l'eventuale atleta registrato nella rosa ufficiale
  const linkedPlayer = React.useMemo(() => {
    if (atleta.giocatoreId) {
      const found = giocatori.find(g => g.id === atleta.giocatoreId);
      if (found) return found;
    }
    // Fallback: cerca per corrispondenza nominativa (es. "Nicola Turchi" o "Turchi Nicola")
    const cleanNome = atleta.nome.trim().toLowerCase();
    return giocatori.find(g => {
      const name1 = `${g.nome} ${g.cognome}`.trim().toLowerCase();
      const name2 = `${g.cognome} ${g.nome}`.trim().toLowerCase();
      return name1 === cleanNome || name2 === cleanNome || cleanNome.includes(g.nome.toLowerCase()) && cleanNome.includes(g.cognome.toLowerCase());
    });
  }, [atleta, giocatori]);

  // Trova la squadra in cui gioca attualmente
  const linkedTeam = React.useMemo(() => {
    if (!linkedPlayer) {
      // Se l'atleta ha una categoria definita (es. "Serie D" o "Prima Divisione"), cerca la squadra corrispondente
      if (atleta.categoria) {
        const matchCat = squadre.find(s => s.nome_squadra.toLowerCase().includes(atleta.categoria.toLowerCase()) || atleta.categoria.toLowerCase().includes(s.nome_squadra.toLowerCase()));
        if (matchCat) return matchCat;
      }
      return null;
    }

    // 1. Cerca prima per id_atleti (presenza diretta dell'ID atleta nella rosa)
    const byId = squadre.find(s => s.id_atleti && (s.id_atleti.includes(linkedPlayer.id) || s.id_atleti.some(id => String(id) === String(linkedPlayer.id))));
    if (byId) return byId;

    // 2. Se non trovato per ID (es. in caso di ID generati o reimportati), cerca se la squadra corrisponde alla categoria del giocatore/quadro
    if (atleta.categoria) {
      const byCat = squadre.find(s => s.nome_squadra.toLowerCase().includes(atleta.categoria.toLowerCase()) || atleta.categoria.toLowerCase().includes(s.nome_squadra.toLowerCase()));
      if (byCat) return byCat;
    }

    return null;
  }, [linkedPlayer, atleta.categoria, squadre]);

  // Raggruppa tutti i premi della giocatrice:
  // 1. Quelli presenti direttamente nell'array atleta.premi
  // 2. Più eventuali altri quadri della stessa persona presenti nell'Albo d'Oro
  const tuttiIPremi = React.useMemo(() => {
    const list: PremioVinto[] = [];
    
    // Se ha l'array premi valorizzato
    if (atleta.premi && atleta.premi.length > 0) {
      list.push(...atleta.premi);
    } else {
      // Inserisci il premio primario del record
      list.push({
        id: atleta.id,
        titolo: atleta.titoloPremio,
        anno: atleta.anno,
        categoria: atleta.categoria,
        descrizione: atleta.descrizione
      });
    }

    // Aggiungi anche eventuali altri quadri della stessa giocatrice se presenti nel database
    const altriQuadri = (tuttiAtleti || []).filter(
      a => a.id !== atleta.id && a.nome.trim().toLowerCase() === atleta.nome.trim().toLowerCase()
    );
    for (const q of altriQuadri) {
      const giaPresente = list.some(p => p.titolo.toLowerCase() === q.titoloPremio.toLowerCase() && p.anno === q.anno);
      if (!giaPresente) {
        list.push({
          id: q.id,
          titolo: q.titoloPremio,
          anno: q.anno,
          categoria: q.categoria,
          descrizione: q.descrizione
        });
      }
    }

    return list;
  }, [atleta, tuttiAtleti]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-[#07080b] flex flex-col justify-between select-none safe-bottom cursor-default"
    >
      
      {/* ========================================================================= */}
      {/* TUTTO LO SFONDO: FOTOGRAFIA DELL'ATLETA ALLARGATA & SFOCATA (O PALAZZETTO) */}
      {/* ========================================================================= */}
      {(() => {
        // Logica risoluzione sfondo:
        // 1. 'none': Nessuna immagine (solo nero e faretto dorato)
        // 2. 'palazzetto' o '/images/palazzetto-sfondo.jpg': Immagine ufficiale del palazzetto
        // 3. 'foto_atleta' o se non specificato/vuoto: FOTO DEL GIOCATORE STESSO allargata a tutto schermo!
        // 4. Qualsiasi altro URL: Sfondo personalizzato
        let sfondoAttivo: string | null = null;
        if (atleta.sfondoUrl === 'none') {
          sfondoAttivo = null;
        } else if (atleta.sfondoUrl === 'palazzetto' || atleta.sfondoUrl === '/images/palazzetto-sfondo.jpg') {
          sfondoAttivo = '/images/palazzetto-sfondo.jpg';
        } else if (atleta.sfondoUrl === 'foto_atleta' || !atleta.sfondoUrl) {
          // Allargamento dello sfondo della foto caricata del giocatore!
          sfondoAttivo = atleta.fotoUrl || '/images/palazzetto-sfondo.jpg';
        } else {
          sfondoAttivo = atleta.sfondoUrl;
        }

        return (
          <div className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0 bg-[#07080b]">
            {sfondoAttivo ? (
              <img 
                src={sfondoAttivo} 
                alt="Sfondo Immersivo" 
                className="w-full h-full object-cover filter blur-[8px] sm:blur-[11px] md:blur-[14px] scale-110 transition-all duration-700 brightness-[0.78] contrast-[1.12]"
                style={{
                  objectPosition: `50% ${atleta.sfondoPositionY ?? 45}%`
                }}
              />
            ) : null}
            {/* Gradiente elegante e bilanciato: garantisce ottima leggibilità lasciando risaltare i colori e l'atmosfera della foto */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-[#07080b]/40 to-black/25" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,#07080b_90%)] opacity-45" />
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#FFE600]/15 rounded-full blur-[120px] pointer-events-none" />
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* BARRA SUPERIORE DI CONTROLLO & NAVIGAZIONE RAPIDA */}
      {/* ========================================================================= */}
      <header 
        onClick={(e) => e.stopPropagation()}
        className="sticky top-0 z-30 w-full px-4 sm:px-8 py-3.5 backdrop-blur-xl bg-black/85 border-b border-white/10 flex items-center justify-between"
      >
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-xs sm:text-sm font-barlow font-bold uppercase tracking-wider text-zinc-300 hover:text-[#FFE600] transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 text-[#FFE600] transition-transform group-hover:-translate-x-1" />
          <span>Torna ai Quadri della Parete</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FFE600]/15 border border-[#FFE600]/30 text-[#FFE600] font-mono text-xs font-bold">
            <Trophy className="w-3.5 h-3.5" />
            <span>{tuttiIPremi.length} {tuttiIPremi.length === 1 ? 'Titolo Conquistato' : 'Titoli Conquistati'}</span>
          </div>

          <button
            onClick={handleShare}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#FFE600]" /> : <Share2 className="w-3.5 h-3.5 text-[#FFE600]" />}
            <span className="hidden xs:inline">{copied ? 'Link Copiato!' : 'Condividi'}</span>
          </button>

          <button
            onClick={onClose}
            className="bg-zinc-900 hover:bg-[#FFE600] text-zinc-400 hover:text-black p-2 rounded-full border border-zinc-800 hover:border-[#FFE600] cursor-pointer transition-all duration-200"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* CORPO CENTRALE: PROPRIO LA GIOCATRICE (NO QUADRO!) & BACHECA VITTORIE */}
      {/* ========================================================================= */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* COLONNA SINISTRA: FOTO DELLA GIOCATRICE IN PRIMO PIANO (SENZA CORNICE DI LEGNO NÉ PASSEPARTOUT) */}
          <div onClick={(e) => e.stopPropagation()} className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-full max-w-[360px] group">
              
              {/* Effetto faretto oro soffuso posteriore */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-[#FFE600]/30 via-amber-500/15 to-yellow-400/20 rounded-3xl blur-2xl opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none" />

              {/* Scheda fotografica della giocatrice: pura, moderna, curvilinea e nitida */}
              <div className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(255,230,0,0.2)] border border-white/15 bg-zinc-950">
                <img 
                  src={atleta.fotoUrl} 
                  alt={atleta.nome}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  style={{
                    objectPosition: `${atleta.fotoPositionX ?? 50}% ${atleta.fotoPositionY ?? 30}%`
                  }}
                />

                {/* Sfumatura scura graduale inferiore per fondere i badge */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent pointer-events-none" />

                {/* Dettagli dell'atleta integrati in basso sulla foto */}
                <div className="absolute bottom-5 inset-x-5 flex flex-col gap-2 z-10 text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 border border-[#FFE600]/40 text-[#FFE600] font-mono text-[11px] font-bold tracking-wider backdrop-blur-md w-fit shadow-md">
                    <Sparkles className="w-3.5 h-3.5 text-[#FFE600]" />
                    <span>PANTERA D'ECCELLENZA</span>
                  </div>

                  <p className="text-white text-sm sm:text-base font-black font-barlow uppercase tracking-wider drop-shadow-md">
                    {atleta.categoria} {atleta.ruolo ? `• ${atleta.ruolo}` : ''}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* COLONNA DESTRA: NOME GIGANTESCO & BACHECA PALMARÈS (MULTI-VITTORIE) */}
          <div onClick={(e) => e.stopPropagation()} className="lg:col-span-7 space-y-6 text-left">
            
            {/* Intestazione Atleta */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3.5 py-1 rounded-full bg-[#FFE600] text-black font-barlow font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(255,230,0,0.4)]">
                  HALL OF FAME NVA
                </span>
                {atleta.inEvidenza && (
                  <span className="px-3.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-amber-300" />
                    Quadro d'Onore
                  </span>
                )}
              </div>

              {/* Nome Atleta Gigante */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black font-barlow uppercase text-white tracking-tight leading-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                {atleta.nome}
              </h1>

              {/* Tag di squadra e ruolo */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono text-zinc-300">
                {atleta.categoria && (
                  <span className="bg-zinc-900/90 px-3.5 py-1.5 rounded-xl border border-zinc-800">
                    Squadra: <strong className="text-white">{atleta.categoria}</strong>
                  </span>
                )}
                {atleta.ruolo && (
                  <span className="bg-zinc-900/90 px-3.5 py-1.5 rounded-xl border border-zinc-800">
                    Ruolo: <strong className="text-white">{atleta.ruolo}</strong>
                  </span>
                )}
              </div>

              {/* CARD ATLETA UFFICIALE DELLA ROSA (Se collegato a un giocatore del database) */}
              {linkedPlayer && (
                <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-zinc-900/95 via-zinc-900/80 to-zinc-950/90 border border-[#FFE600]/40 backdrop-blur-md shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#FFE600] font-black">
                      <UserCheck className="w-4 h-4 text-[#FFE600]" />
                      Atleta Ufficiale Academy
                    </span>
                    {linkedPlayer.numero_maglia && (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFE600] text-black font-barlow font-black text-xs">
                        <Shirt className="w-3.5 h-3.5 fill-black" />
                        #{linkedPlayer.numero_maglia}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs font-mono">
                    {linkedTeam && (
                      <div className="p-2.5 rounded-xl bg-black/50 border border-white/5">
                        <span className="text-zinc-500 block text-[10px] uppercase">Rosa Corrente</span>
                        <span className="text-white font-bold">{linkedTeam.nome_squadra}</span>
                      </div>
                    )}
                    {linkedPlayer.ruolo && (
                      <div className="p-2.5 rounded-xl bg-black/50 border border-white/5">
                        <span className="text-zinc-500 block text-[10px] uppercase">Ruolo sul Campo</span>
                        <span className="text-white font-bold">{linkedPlayer.ruolo}</span>
                      </div>
                    )}
                    {linkedPlayer.altezza && (
                      <div className="p-2.5 rounded-xl bg-black/50 border border-white/5">
                        <span className="text-zinc-500 block text-[10px] uppercase">Altezza</span>
                        <span className="text-white font-bold">{linkedPlayer.altezza} cm</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* SEZIONE PALMARÈS & VITTORIE IN BACHECA */}
            <div className="space-y-4 pt-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <Trophy className="w-5 h-5 text-[#FFE600]" />
                  <h2 className="text-lg sm:text-xl font-black font-barlow uppercase tracking-wider text-white">
                    Bacheca Trofei &amp; Palmarès ({tuttiIPremi.length})
                  </h2>
                </div>
                <span className="text-xs font-mono text-[#FFE600] font-bold">
                  {tuttiIPremi.length === 1 ? '1 Trofeo conquistato' : `${tuttiIPremi.length} Trofei conquistati`}
                </span>
              </div>

              {/* Lista completa dei trofei / vittorie vinte da questa giocatrice */}
              <div className="space-y-3.5">
                {tuttiIPremi.map((premio, idx) => (
                  <div 
                    key={idx}
                    className="relative p-5 rounded-2xl bg-gradient-to-r from-zinc-900/90 via-zinc-900/75 to-black/70 border border-[#FFE600]/35 backdrop-blur-md shadow-xl space-y-2.5 overflow-hidden group hover:border-[#FFE600] transition-colors"
                  >
                    {/* Alone d'angolo dorato */}
                    <div className="absolute top-0 right-0 w-28 h-28 bg-[#FFE600]/10 rounded-full blur-2xl pointer-events-none group-hover:bg-[#FFE600]/20 transition-colors" />

                    {/* Riga intestazione vittoria: Stagione, Categoria, Tipo */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-lg bg-[#FFE600] text-black font-barlow font-black text-xs uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 fill-black" />
                          STAGIONE {premio.anno}
                        </span>
                        {premio.categoria && (
                          <span className="text-xs font-mono text-zinc-300 bg-black/60 px-2.5 py-1 rounded-lg border border-zinc-800">
                            {premio.categoria}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#FFE600] font-bold">
                        Riconoscimento Ufficiale #{idx + 1}
                      </span>
                    </div>

                    {/* Titolo del premio */}
                    <h3 className="text-xl sm:text-2xl font-black font-barlow uppercase text-white tracking-wide leading-tight group-hover:text-[#FFE600] transition-colors">
                      {premio.titolo}
                    </h3>

                    {/* Descrizione / Motivazione del traguardo */}
                    {premio.descrizione && (
                      <p className="text-sm font-inter text-zinc-300 leading-relaxed italic border-l-2 border-[#FFE600]/60 pl-3.5">
                        "{premio.descrizione}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* FOTO EVENTUALE DELLA CONSEGNA PREMIO SUL PODIO */}
            {atleta.fotoPremiazioneUrl && (
              <div className="space-y-2.5 pt-3">
                <h4 className="text-xs font-bold font-barlow uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Medal className="w-4 h-4 text-[#FFE600]" />
                  Momento della Consegna del Premio
                </h4>
                <div className="rounded-2xl overflow-hidden border border-zinc-800 max-h-72 shadow-2xl bg-zinc-950">
                  <img 
                    src={atleta.fotoPremiazioneUrl} 
                    alt={`Premiazione ${atleta.nome}`}
                    className="w-full h-full object-cover" 
                  />
                </div>
              </div>
            )}

          </div>

        </div>
      </main>

      {/* FOOTER DI CHIUSURA SCHEDA */}
      <footer 
        onClick={(e) => e.stopPropagation()}
        className="relative z-20 py-4 text-center text-xs text-zinc-500 font-mono border-t border-white/10 backdrop-blur-md bg-black/40"
      >
        <p>New Volley Academy Forlì • Hall of Fame &amp; Palmarès Ufficiale</p>
      </footer>

    </div>
  );
}

// ==========================================
// COMPONENTE: TOTEM D'INGRESSO / BANNER ARENA (OSPITI ILLUSTRI)
// ==========================================
interface TotemOspiteArenaProps {
  key?: React.Key;
  ospite: OspiteIllustre;
  filtroAnno?: string;
  onClick: () => void;
}

function TotemOspiteArena({ ospite, filtroAnno, onClick }: TotemOspiteArenaProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Estrai il cognome o la prima parola del nome per il watermark verticale monumentale
  const watermarkText = React.useMemo(() => {
    const parts = (ospite.nome || '').trim().split(/\s+/);
    return parts.length > 1 ? parts[parts.length - 1] : parts[0];
  }, [ospite.nome]);

  // Calcolo badge anno distinto, pulito e leggibile
  const badgeAnnoText = React.useMemo(() => {
    if (filtroAnno && filtroAnno !== 'TUTTI') {
      return `#${filtroAnno}`;
    }
    const anni = getAnniOspite(ospite).sort();
    if (anni.length === 0) return ospite.anno ? `#${ospite.anno}` : '#NVA';
    if (anni.length === 1) return `#${anni[0]}`;
    if (anni.length === 2 && Math.abs(parseInt(anni[1]) - parseInt(anni[0])) === 1) {
      return `#${anni[0]}/${anni[1]}`;
    }
    return `#${anni[0]}-${anni[anni.length - 1]}`;
  }, [ospite, filtroAnno]);

  return (
    <div 
      className="group relative flex flex-col cursor-pointer transition-all duration-500 ease-out select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* EFFETTO GLOW RADIALE POSTERIORE SU HOVER */}
      <div 
        className="absolute -inset-1.5 rounded-[2rem] bg-gradient-to-b from-amber-500/25 via-yellow-500/10 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
      />

      {/* STRUTTURA DEL TOTEM MONOLITICO IN TITANIO & ORO */}
      <div 
        className="relative flex flex-col h-[540px] sm:h-[600px] w-full rounded-3xl overflow-hidden bg-[#0c0d12] border-2 border-amber-400/40 group-hover:border-amber-400 shadow-[0_20px_45px_-12px_rgba(0,0,0,0.35)] group-hover:shadow-[0_28px_65px_-10px_rgba(245,158,11,0.35)] transition-all duration-500 transform group-hover:-translate-y-2"
      >
        {/* CORPO DEL TOTEM: FOTO A TUTTA ALTEZZA (NESSUNA BARRA OPACA TAGLIA-TESTA IN ALTO) */}
        <div className="relative flex-1 w-full h-full overflow-hidden flex flex-col justify-between">
          
          {/* FOTOGRAFIA DELL'OSPITE ILLUSTRE (CRISTALLINA, DAL BORDO SUPERIORE) */}
          <img 
            src={ospite.fotoUrl} 
            alt={ospite.nome}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            style={{
              objectPosition: `${ospite.fotoPositionX ?? 50}% ${ospite.fotoPositionY ?? 25}%`
            }}
            loading="lazy"
          />

          {/* SCRITTA VERTICALE NOME SCOLPITA A TRATTO NETTO (STILE POSTER SPORTIVO AD ALTA DEFINIZIONE) */}
          <div 
            className="absolute right-3 top-16 bottom-36 pointer-events-none select-none flex items-center justify-center z-10 overflow-hidden"
          >
            <span 
              className="text-5xl sm:text-6xl font-black font-barlow uppercase tracking-widest whitespace-nowrap [writing-mode:vertical-rl] rotate-180 transition-all duration-300"
              style={{ 
                color: isHovered ? 'rgba(245, 158, 11, 0.35)' : 'rgba(255, 255, 255, 0.25)',
                WebkitTextStroke: isHovered ? '1.5px #f59e0b' : '1.5px rgba(255, 255, 255, 0.9)',
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.9))'
              }}
            >
              {watermarkText}
            </span>
          </div>

          {/* BADGE FLUTTUANTI SUPERIORI IN GLASSMORPHISM (ZERO ALONE NERO SOPRA) */}
          <div className="relative z-20 flex items-center justify-between p-4 pointer-events-none">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-amber-400 text-[10px] font-mono font-bold tracking-widest uppercase shadow-lg">
              <Flame className="w-3 h-3 text-amber-400" />
              <span>NVA LEGEND</span>
            </div>

            <div className="flex items-center gap-2">
              {ospite.inEvidenza && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-barlow font-black text-[10px] uppercase tracking-wider shadow-lg">
                  <Star className="w-3 h-3 fill-black text-black" />
                  <span className="hidden sm:inline">Top Guest</span>
                </span>
              )}
              {(() => {
                const totalPhotos = getAllFotoOspite(ospite).length;
                if (totalPhotos > 1) {
                  return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md border border-amber-400/40 text-amber-300 font-mono text-[10px] font-bold shadow-lg">
                      <Camera className="w-3 h-3 text-amber-400" />
                      <span>{totalPhotos} foto</span>
                    </span>
                  );
                }
                return null;
              })()}
              <span className="px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-zinc-100 font-mono text-[10px] font-bold shadow-lg">
                {badgeAnnoText}
              </span>
            </div>
          </div>

          {/* ICONA INGRANDIMENTO CENTRALE SU HOVER */}
          <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <span className="p-3.5 rounded-full bg-amber-400 text-black shadow-[0_0_30px_rgba(245,158,11,0.7)] transform scale-75 group-hover:scale-100 transition-transform duration-300">
              <Maximize2 className="w-5 h-5" />
            </span>
          </div>

          {/* GRADIENTE INFERIORE MIRATO ESCLUSIVAMENTE AI TESTI:
              Inizia solo dal 48% in giù, lasciando testa, occhi e cielo al 100% nitidi e luminosi! */}
          <div className="absolute bottom-0 inset-x-0 h-[48%] bg-gradient-to-t from-[#07080c] via-[#07080c]/85 via-65% to-transparent pointer-events-none z-10" />

          {/* FASCIO AMBRATO SOTTILE A SFIORO INFERIORE */}
          <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-amber-500/15 to-transparent pointer-events-none opacity-70 group-hover:opacity-100 transition-opacity duration-500 z-10" />

          {/* PLACCA INFORMATIVA INFERIORE DEL TOTEM */}
          <div className="relative z-20 p-5 sm:p-6 space-y-2.5 mt-auto">
            
            {/* RUOLO SPORTIVO / TITOLO ONORIFICO */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/85 border border-amber-400/50 text-amber-300 text-[11px] font-mono font-bold uppercase tracking-wider backdrop-blur-md shadow-md max-w-full">
              <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{ospite.ruoloTitolo}</span>
            </div>

            {/* NOME MONUMENTALE A CARATTERI CUBITALI */}
            <h2 className="text-2xl sm:text-3xl font-black font-barlow uppercase text-white tracking-tight leading-tight group-hover:text-amber-300 transition-colors drop-shadow-lg">
              {ospite.nome}
            </h2>

            {/* OCCASIONE DEL PASSAGGIO */}
            {(() => {
              const eventiCard = getEventiOspite(ospite);
              if (eventiCard.length > 1) {
                return (
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
                    <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-zinc-400">Presenze:</span>
                    <span className="font-bold text-amber-300 truncate">
                      {eventiCard.length} Edizioni ({eventiCard.map(e => e.anno).filter(Boolean).join(', ')})
                    </span>
                  </div>
                );
              }
              return (
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
                  <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-zinc-400">Passaggio:</span>
                  <span className="font-bold text-white truncate">{ospite.occasione || ospite.anno}</span>
                </div>
              );
            })()}

            {/* ANEDDOTO O CITAZIONE (SE PRESENTE) */}
            {ospite.descrizione && (
              <p className="text-[11px] font-inter text-zinc-300/90 italic line-clamp-2 border-l-2 border-amber-400/70 pl-2.5 leading-relaxed">
                "{ospite.descrizione}"
              </p>
            )}

            {/* FOOTER INTERATTIVO CALL TO ACTION */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 group-hover:text-amber-300 transition-colors">
              <span className="flex items-center gap-1">
                <span>Scopri il Passaggio</span>
              </span>
              <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform duration-300" />
            </div>

          </div>

        </div>

        {/* PEDANA / BARRA NEON A TERRA DEL TOTEM */}
        <div className="relative z-20 h-1.5 w-full bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-75 group-hover:opacity-100 group-hover:shadow-[0_0_20px_#f59e0b] transition-all duration-500" />
      </div>
    </div>
  );
}

// ==========================================
// MODAL CELEBRATIVO SCHEDA DELL'OSPITE ILLUSTRE & LEGGENDA
// FORMATO: "ARENA MAIN STAGE & VIP PASS DOSSIER"
// ==========================================
interface ModalDettaglioOspiteProps {
  ospite: OspiteIllustre;
  onClose: () => void;
}

function ModalDettaglioOspite({ ospite, onClose }: ModalDettaglioOspiteProps) {
  const [copied, setCopied] = useState(false);
  const [zoomMomento, setZoomMomento] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);

  const allPhotos = React.useMemo(() => getAllFotoOspite(ospite), [ospite]);
  const hasMultiplePhotos = allPhotos.length > 1;
  const currentPhoto = allPhotos[activePhotoIdx] || ospite.fotoUrl;

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIdx(prev => (prev === 0 ? allPhotos.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIdx(prev => (prev === allPhotos.length - 1 ? 0 : prev + 1));
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Supporto tasto Esc per chiudere la scheda
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (fullscreenPhoto) {
          setFullscreenPhoto(null);
        } else if (zoomMomento) {
          setZoomMomento(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, fullscreenPhoto, zoomMomento]);

  // Codice univoco pass realistico basato su ID o nome
  const passCode = React.useMemo(() => {
    const raw = (ospite.id || ospite.nome).replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
    return `NVA-LEGEND-${ospite.anno}-${raw || 'VIP'}`;
  }, [ospite.id, ospite.nome, ospite.anno]);

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-[#0a0c10] flex flex-col justify-between select-none safe-bottom cursor-default"
    >
      
      {/* ========================================================================= */}
      {/* SFONDO DINAMICO D'ONORE: FIAMME VIVE E FUMO DORATO FOTOREALISTICO ORIGINALE */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0 bg-[#06070a]">
        {/* Immagine di sfondo fotografica originale con fiamme dorate identica alla locandina */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-45 mix-blend-screen"
          style={{
            backgroundImage: `url('/assets/golden-fire-bg.jpg')`,
            filter: 'contrast(115%) brightness(105%)'
          }}
        />

        {/* Bagliore radiale dorato caldo e vellutato al centro */}
        <div 
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[700px] opacity-40 blur-[120px]"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(245, 158, 11, 0.45) 0%, rgba(217, 119, 6, 0.2) 50%, transparent 80%)'
          }}
        />

        {/* Dissolvenza scura perimetrale per garantire la massima leggibilità e stacco dei contenuti */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#06070a] via-transparent to-[#06070a]/90 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06070a]/80 via-transparent to-[#06070a]/80 pointer-events-none" />
      </div>

      {/* ========================================================================= */}
      {/* HEADER: CONSOLE VIP PASS CHIARA & CRISTALLINA (STICKY: SEMPRE VISIBILE IN ALTO) */}
      {/* ========================================================================= */}
      <header 
        onClick={(e) => e.stopPropagation()}
        className="sticky top-0 z-30 w-full px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-white/10 backdrop-blur-xl bg-black/85 shadow-lg text-white"
      >
        
        {/* Pulsante Torna ai Totem */}
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-amber-400 hover:text-black text-white font-barlow font-bold uppercase tracking-wider text-xs border border-white/15 hover:border-amber-400 shadow-md transition-all cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Torna ai Totem</span>
        </button>

        {/* Badge Ticker Centrale: Status VIP Pass */}
        <div className="hidden sm:flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-zinc-900/80 border border-amber-400/30 text-zinc-300 font-mono text-xs shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#f59e0b]" />
          <span className="font-bold tracking-widest uppercase text-white">NVA ARENA VIP DOSSIER</span>
          <span className="text-zinc-600">•</span>
          <span className="text-amber-400 font-mono font-bold">{passCode}</span>
        </div>

        {/* Pulsanti Azioni: Condividi & Chiudi */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-white/15 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm"
            title="Copia link scheda"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400 font-bold">Copiato!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Condividi</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-zinc-900/90 hover:bg-rose-950/60 text-zinc-300 hover:text-rose-400 border border-white/15 hover:border-rose-400/50 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
            title="Chiudi"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-mono uppercase font-bold">Chiudi</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* CORPO CENTRALE: LE CARD SCURE MONOLITICHE CHE RISALTANO SULLO SFONDO CHIARO*/}
      {/* ========================================================================= */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-8 md:py-12 space-y-8">
        
        {/* ========================================================================= */}
        {/* BANNER DI TESTA: NERO, TITANIO & ORO AD ALTO IMPATTO TRIDIMENSIONALE      */}
        {/* ========================================================================= */}
        <div 
          onClick={(e) => e.stopPropagation()}
          className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#141620] via-[#0e1017] to-[#090a0f] border-2 border-amber-400 shadow-[0_20px_50px_rgba(0,0,0,0.45),0_0_35px_rgba(245,158,11,0.2)] overflow-hidden text-white"
        >
          
          {/* Filigrana tipografica ARENA di sfondo */}
          <div className="absolute right-4 -bottom-6 pointer-events-none select-none text-white/[0.04] font-black font-barlow uppercase text-7xl sm:text-9xl tracking-tighter">
            ARENA
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              {/* Badge categoria */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-barlow font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 fill-black" />
                  <span>OSPITE D'ONORE &amp; LEGGENDA DELLA PALLAVOLO</span>
                </span>
                {ospite.inEvidenza && (
                  <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-300" />
                    Stella d'Onore
                  </span>
                )}
              </div>

              {/* Nome Scolpito Monumentale */}
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black font-barlow uppercase text-white tracking-tight leading-none drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
                {ospite.nome}
              </h1>

              {/* Titolo e Caratura Sportiva */}
              <p className="text-lg sm:text-xl font-bold font-barlow uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400 shrink-0" />
                <span>{ospite.ruoloTitolo}</span>
              </p>
            </div>

            {/* Scheda Tecnica a Tessere Sportive Scure */}
            {(() => {
              const eventiOspite = getEventiOspite(ospite);
              return (
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <div className="bg-black/60 border border-zinc-800 p-3.5 rounded-2xl shadow-inner space-y-1.5 min-w-[140px]">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{eventiOspite.length > 1 ? 'Anni Presenza' : 'Anno Visita'}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {eventiOspite.length > 0 ? (
                        eventiOspite.map((ev, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-zinc-900 border border-amber-400/40 text-xs font-mono font-bold text-amber-300">
                            {ev.anno || ospite.anno}
                          </span>
                        ))
                      ) : (
                        <p className="text-base font-mono font-black text-white">{ospite.anno}</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-black/60 border border-amber-400/30 p-3.5 rounded-2xl shadow-inner space-y-1 min-w-[130px]">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Accredito NVA</span>
                    </div>
                    <p className="text-xs font-mono font-black text-amber-400 truncate">
                      {eventiOspite.length > 1 ? `${eventiOspite.length} EVENTI UFFICIALI` : 'REGISTRATO'}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* GRIGLIA PRINCIPALE: TOTEM GIGANTE DA PALASPORT & COURTSIDE DOSSIER         */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ======================================================================= */}
          {/* COLONNA SINISTRA (lg:col-span-5): IL TOTEM MONUMENTALE DA PALAZZETTO (CAROSELLO) */}
          {/* ======================================================================= */}
          <div onClick={(e) => e.stopPropagation()} className="lg:col-span-5 flex flex-col items-center w-full">
            <div className="relative w-full max-w-[400px] rounded-3xl overflow-hidden bg-gradient-to-b from-[#181a24] via-[#0e1017] to-[#07080b] border-2 border-amber-400 shadow-[0_25px_60px_rgba(0,0,0,0.55),0_0_35px_rgba(245,158,11,0.3)] group">
              
              {/* Testata Metallica con Staffa e Rivetti Industriali */}
              <div className="flex items-center justify-between px-5 py-3 bg-[#181a24] border-b border-white/10 text-white">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-500 border border-zinc-300 shadow-inner" />
                  <span className="text-[11px] font-mono font-black uppercase tracking-widest text-amber-400">
                    STAGE MONOLITH
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasMultiplePhotos ? (
                    <span className="text-[10px] font-mono font-bold text-amber-300 bg-black/70 px-2.5 py-0.5 rounded-full border border-amber-400/50 flex items-center gap-1">
                      <Camera className="w-3 h-3 text-amber-400" />
                      <span>{activePhotoIdx + 1} / {allPhotos.length}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-zinc-400 bg-black/60 px-2 py-0.5 rounded border border-zinc-700">#OFFICIAL</span>
                  )}
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-500 border border-zinc-300 shadow-inner" />
                </div>
              </div>

              {/* Fotografia Verticale Cristallina (Carosello se presenti più foto) */}
              <div className="relative h-[480px] sm:h-[530px] w-full overflow-hidden bg-zinc-950 select-none">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={activePhotoIdx}
                    src={currentPhoto} 
                    alt={`${ospite.nome} - Foto ${activePhotoIdx + 1}`}
                    initial={{ opacity: 0.4, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0.4, scale: 1.02 }}
                    transition={{ duration: 0.25 }}
                    className="w-full h-full object-cover"
                    style={{
                      objectPosition: activePhotoIdx === 0 
                        ? `${ospite.fotoPositionX ?? 50}% ${ospite.fotoPositionY ?? 25}%`
                        : 'center 30%'
                    }}
                  />
                </AnimatePresence>

                {/* Sfumatura inferiore mirata ESCLUSIVAMENTE alla piastra d'identità in basso */}
                <div className="absolute bottom-0 inset-x-0 h-[48%] bg-gradient-to-t from-[#07080c] via-[#07080c]/80 via-65% to-transparent pointer-events-none" />

                {/* Fascio di luce neon ambrato radente dal basso */}
                <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-amber-500/20 via-amber-400/5 to-transparent pointer-events-none" />

                {/* Controlli di Navigazione Carosello (Freccia Sinistra / Destra) */}
                {hasMultiplePhotos && (
                  <>
                    <button
                      onClick={handlePrevPhoto}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/75 hover:bg-amber-400 hover:text-black text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-xl hover:scale-110 active:scale-95"
                      aria-label="Foto precedente"
                      title="Foto precedente"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextPhoto}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/75 hover:bg-amber-400 hover:text-black text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-xl hover:scale-110 active:scale-95"
                      aria-label="Foto successiva"
                      title="Foto successiva"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Tasto Ingrandisci / Fullscreen in alto a destra sulla foto */}
                <button
                  onClick={() => setFullscreenPhoto(currentPhoto)}
                  className="absolute top-3 right-3 z-20 p-2 rounded-xl bg-black/60 hover:bg-black/90 text-white/80 hover:text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-md hover:scale-105"
                  title="Ingrandisci foto a tutto schermo"
                >
                  <Maximize2 className="w-4 h-4 text-amber-400" />
                </button>

                {/* Piastra d'identità scura integrata sul totem */}
                <div className="absolute bottom-4 inset-x-4 p-4 rounded-2xl bg-black/85 backdrop-blur-md border border-amber-400/40 shadow-2xl space-y-1 text-white z-10">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                      Campione in Galleria
                    </p>
                    {hasMultiplePhotos && (
                      <span className="text-[10px] font-mono text-zinc-400">
                        {activePhotoIdx === 0 ? 'Foto Principale' : `Scatto #${activePhotoIdx + 1}`}
                      </span>
                    )}
                  </div>
                  <p className="text-base font-black font-barlow uppercase text-white truncate">
                    {ospite.nome}
                  </p>
                </div>
              </div>

              {/* Barra Neon a Pavimento */}
              <div className="h-2 w-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 shadow-[0_0_15px_#f59e0b]" />
            </div>

            {/* Striscia Miniature / Indicatori di navigazione rapida se ci sono più foto */}
            {hasMultiplePhotos && (
              <div className="mt-3.5 w-full max-w-[400px] flex items-center justify-center gap-2 overflow-x-auto py-1 px-2 no-scrollbar">
                {allPhotos.map((url, idx) => {
                  const isActive = idx === activePhotoIdx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActivePhotoIdx(idx)}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer shadow-md ${
                        isActive
                          ? 'border-amber-400 scale-105 ring-2 ring-amber-400/50'
                          : 'border-zinc-700 opacity-60 hover:opacity-100 hover:border-zinc-500'
                      }`}
                      title={idx === 0 ? "Foto Principale" : `Foto ${idx + 1}`}
                    >
                      <img src={url} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-amber-400 text-black text-[8px] font-mono font-black text-center uppercase py-0.5 leading-none">
                          TOP
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ======================================================================= */}
          {/* COLONNA DESTRA (lg:col-span-7): COURTSIDE DOSSIER, CITAZIONE & FOTO CAMPO */}
          {/* ======================================================================= */}
          <div onClick={(e) => e.stopPropagation()} className="lg:col-span-7 space-y-6">
            
            {/* SCHEDA 1: OCCASIONE DEL PASSAGGIO / PARTECIPAZIONI AGLI EVENTI */}
            {(() => {
              const eventi = getEventiOspite(ospite);
              const frasePassaggio = ospite.testoPassaggio || 
                `La New Volley Academy ha avuto l'onore di ospitare ${ospite.nome} per condividere con atlete, atleti e staff tecnico l'esperienza, la dedizione e la mentalità che contraddistinguono i vertici della pallavolo italiana ed internazionale.`;

              return (
                <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#141622] via-[#0e1017] to-black border border-zinc-800 hover:border-amber-400/40 shadow-[0_15px_40px_rgba(0,0,0,0.2)] space-y-4 relative overflow-hidden text-white transition-colors">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-black">
                        {eventi.length > 1 ? "Le Partecipazioni con le Pantere" : "L'Occasione del Passaggio alle Pantere"}
                      </span>
                    </div>
                    {eventi.length > 1 && (
                      <span className="text-[10px] font-mono font-bold bg-amber-400/15 border border-amber-400/40 text-amber-300 px-2.5 py-0.5 rounded-full">
                        {eventi.length} EDIZIONI
                      </span>
                    )}
                  </div>

                  {/* Se ci sono più eventi, mostriamo la lista distinta con badge anno ben spaziati */}
                  {eventi.length > 1 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {eventi.map((ev, idx) => (
                        <div 
                          key={idx}
                          className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 hover:border-amber-400/50 transition-colors flex items-start gap-3 shadow-inner"
                        >
                          <div className="px-2.5 py-1 rounded-xl bg-amber-400 text-black font-mono font-black text-xs shrink-0 shadow-sm mt-0.5">
                            {ev.anno || 'NVA'}
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <p className="text-sm font-black font-barlow uppercase text-white leading-tight">
                              {ev.evento}
                            </p>
                            {ev.dettaglio && (
                              <p className="text-[11px] font-inter text-zinc-400">
                                {ev.dettaglio}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <h3 className="text-2xl sm:text-3xl font-black font-barlow uppercase text-white leading-snug">
                      {eventi[0]?.evento || ospite.occasione || 'Ospite Speciale NVA'}
                    </h3>
                  )}

                  <p className="text-sm font-inter text-zinc-300 leading-relaxed pt-1 border-t border-white/5">
                    {frasePassaggio}
                  </p>
                </div>
              );
            })()}

            {/* SCHEDA 2: CITAZIONE & MESSAGGIO AI RAGAZZI (Se presente descrizione) */}
            {ospite.descrizione && (
              <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#221c12] via-[#14120e] to-black border-2 border-amber-400/60 shadow-[0_15px_40px_rgba(0,0,0,0.2)] space-y-4 relative overflow-hidden text-white">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-300 font-black">
                    <Quote className="w-4 h-4 text-amber-400" />
                    <span>Parola di Campione • Il Messaggio</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2.5 py-0.5 rounded-full">NVA ARCHIVE</span>
                </div>

                <div className="relative">
                  <Quote className="absolute -top-3 -left-3 w-16 h-16 text-amber-400/10 pointer-events-none select-none" />

                  <blockquote className="relative z-10 text-lg sm:text-xl font-inter text-zinc-100 italic font-medium leading-relaxed pl-4 border-l-4 border-amber-400">
                    "{ospite.descrizione}"
                  </blockquote>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-amber-400 text-sm">— {ospite.nome}</span>
                  <span className="text-zinc-400 font-semibold">New Volley Academy Forlì</span>
                </div>
              </div>
            )}

            {/* SCHEDA 3: MOMENTO SUL CAMPO CON LE PANTERE (Foto con i ragazzi se presente) */}
            {ospite.fotoMomentoUrl && (
              <div className="p-6 rounded-3xl bg-[#12141c] border border-zinc-800 shadow-[0_15px_40px_rgba(0,0,0,0.2)] space-y-4 text-white">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-300 font-black">
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>Sul Campo con le Nostre Pantere</span>
                  </div>
                  <span className="text-[10px] font-mono text-black font-bold bg-amber-400 px-2 py-0.5 rounded shadow-sm">SCATTO MEMORABILE</span>
                </div>

                {/* Cornice della foto momento con stile reportage da campo */}
                <div 
                  onClick={() => setZoomMomento(true)}
                  className="group relative rounded-2xl overflow-hidden border border-zinc-700 bg-black cursor-pointer max-h-80 shadow-2xl"
                  title="Clicca per ingrandire lo scatto"
                >
                  <img 
                    src={ospite.fotoMomentoUrl} 
                    alt={`Momento ${ospite.nome} con le Pantere`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  
                  {/* Overlay hover ingrandimento */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-4 py-2 rounded-full bg-amber-400 text-black text-xs font-mono font-bold flex items-center gap-1.5 shadow-xl">
                      <Maximize2 className="w-4 h-4" />
                      <span>Ingrandisci Foto</span>
                    </span>
                  </div>

                  {/* Didascalia inferiore sovraimpressa */}
                  <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-between text-xs font-mono text-white">
                    <span className="truncate">Palasport Villa Romiti • Il ricordo con i ragazzi</span>
                    <span className="text-amber-400 font-bold shrink-0">{ospite.anno}</span>
                  </div>
                </div>
              </div>
            )}

            {/* SCHEDA 4: VALORI SOCIETARI & ISPIRAZIONE (Frase 2 Personalizzabile) */}
            <div className="p-6 rounded-3xl bg-[#12141c] border border-zinc-800 shadow-[0_15px_40px_rgba(0,0,0,0.15)] space-y-3 text-white">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-400 font-black">
                <Medal className="w-4 h-4 text-amber-400" />
                <span>Ispirazione Continua per la Società</span>
              </div>
              <p className="text-sm font-inter text-zinc-300 leading-relaxed">
                {ospite.testoIspirazione || (
                  <>
                    La presenza di campioni del calibro di <strong className="text-white">{ospite.nome}</strong> testimonia l'impegno costante della New Volley Academy nella crescita sportiva, etica ed umana del nostro settore giovanile.
                  </>
                )}
              </p>
            </div>

            {/* SCHEDA 4: TIMBRO UFFICIALE & CODICE PASS ARENA */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0c0d12] border border-amber-400/40 shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center font-black font-barlow text-sm shrink-0 shadow-sm">
                  NVA
                </div>
                <div className="text-left space-y-0.5">
                  <p className="text-xs font-mono font-black text-white uppercase tracking-wider">
                    Certificato Hall of Fame • Ospiti
                  </p>
                  <p className="text-[11px] font-mono text-zinc-400">
                    ID Documento: {passCode}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono text-xs font-bold shadow-sm">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Autenticato NVA Forlì</span>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* ========================================================================= */}
      {/* FOOTER DEL PASS STAGE                                                     */}
      {/* ========================================================================= */}
      <footer 
        onClick={(e) => e.stopPropagation()}
        className="relative z-20 py-4 text-center text-xs text-zinc-500 font-mono border-t border-white/10 bg-[#06070a]/90 backdrop-blur-md"
      >
        <p>New Volley Academy Forlì • Grandi Personalità &amp; Campioni della Pallavolo</p>
      </footer>

      {/* ========================================================================= */}
      {/* MODAL LIGHTBOX PER INGRANDIRE LA FOTO DEL CAROSELLO                       */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {fullscreenPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFullscreenPhoto(null)}
            className="fixed inset-0 z-60 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out"
          >
            <div className="relative max-w-5xl max-h-[90vh] rounded-3xl overflow-hidden border-2 border-amber-400 shadow-2xl" onClick={e => e.stopPropagation()}>
              <img 
                src={fullscreenPhoto} 
                alt={`${ospite.nome} - Ingrandimento`}
                className="w-full h-full object-contain max-h-[85vh]"
              />
              <button
                onClick={() => setFullscreenPhoto(null)}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-black/70 text-white hover:bg-amber-400 hover:text-black transition-colors cursor-pointer shadow-lg"
                aria-label="Chiudi"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-0 inset-x-0 p-3.5 bg-black/85 text-center text-xs font-mono text-zinc-300 border-t border-white/10 flex items-center justify-between px-6">
                <span className="font-bold text-amber-400">{ospite.nome}</span>
                <span className="text-zinc-400">Scatto in Alta Risoluzione • NVA Archive</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL LIGHTBOX PER INGRANDIRE LA FOTO DEL MOMENTO SUL CAMPO               */}
      {/* ========================================================================= */}
      {zoomMomento && ospite.fotoMomentoUrl && (
        <div 
          onClick={() => setZoomMomento(false)}
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-5xl max-h-[90vh] rounded-3xl overflow-hidden border-2 border-amber-400 shadow-2xl" onClick={e => e.stopPropagation()}>
            <img 
              src={ospite.fotoMomentoUrl} 
              alt={`Momento ${ospite.nome}`}
              className="w-full h-full object-contain max-h-[85vh]"
            />
            <button
              onClick={() => setZoomMomento(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/70 text-white hover:bg-amber-400 hover:text-black transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="absolute bottom-0 inset-x-0 p-4 bg-black/80 text-center text-xs font-mono text-zinc-300 border-t border-white/10">
              {ospite.nome} • {ospite.occasione} ({ospite.anno})
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

