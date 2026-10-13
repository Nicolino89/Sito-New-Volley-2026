import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Sparkles, 
  Award, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Camera, 
  Flame, 
  Users, 
  Trophy, 
  MessageSquare, 
  Eye, 
  Images,
  ArrowRight
} from 'lucide-react';
import { 
  FotoGalleria, 
  FotoItem, 
  getGalleriaFotoAll, 
  likeGalleriaFoto, 
  likeFotoInAlbum, 
  db, 
  isDemoMode 
} from '../firebase-societa';
import { collection, onSnapshot, doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore';

interface GalleriaProps {
  squadre?: Array<{ id: string; nome: string }>;
}

const TAG_MOODS = [
  "Tutte",
  "Esultanze & Grinta",
  "Dietro le Quinte",
  "In Tribuna",
  "Premiazioni"
] as const;

const GALLERIA_CACHE_KEY = 'nva_galleria_cache_v2';
function getGalleriaCache(): FotoGalleria[] {
  try {
    const raw = localStorage.getItem(GALLERIA_CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export default function Galleria({ squadre = [] }: GalleriaProps) {
  const cachedGalleria = React.useMemo(() => getGalleriaCache(), []);
  const [fotoList, setFotoList] = useState<FotoGalleria[]>(cachedGalleria);
  const [loading, setLoading] = useState(cachedGalleria.length === 0);
  
  // Filters
  const [selectedTag, setSelectedTag] = useState<string>("Tutte");
  const [selectedSquadra, setSelectedSquadra] = useState<string>("Tutte le Squadre");

  // Lightbox modal state: active album index & active photo index within album
  const [activeAlbumIndex, setActiveAlbumIndex] = useState<number | null>(null);
  const [activeFotoIndex, setActiveFotoIndex] = useState<number>(0);

  // Local likes memory stored in localStorage ('nva_liked_photos')
  const [likedIds, setLikedIds] = useState<string[]>([]);

  // Initialize likedIds on page load from localStorage
  useEffect(() => {
    document.title = "Galleria Fotografica | New Volley Academy Forlì";
    try {
      const saved = localStorage.getItem('nva_liked_photos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setLikedIds(parsed);
        }
      }
    } catch (err) {
      console.error("Errore lettura nva_liked_photos da localStorage:", err);
    }
  }, []);

  // Load photos & Firestore real-time listener
  useEffect(() => {
    if (isDemoMode) {
      setLoading(true);
      getGalleriaFotoAll().then(data => {
        setFotoList(data);
        setLoading(false);
      });
      return;
    }

    setLoading(true);
    const ref = collection(db, 'galleria_foto');
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      if (snapshot.empty) {
        getGalleriaFotoAll().then(data => {
          setFotoList(data);
          setLoading(false);
        });
        return;
      }

      const list: FotoGalleria[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const fotosArr: FotoItem[] = Array.isArray(data.fotos) && data.fotos.length > 0
          ? data.fotos.map((f: any, idx: number) => ({
              id: f.id || `f_${idx}`,
              url: f.url || data.url || '',
              focalPoint: typeof f.focalPoint === 'number' ? f.focalPoint : (typeof data.fotoPositionY === 'number' ? data.fotoPositionY : 50),
              didascalia: f.didascalia || '',
              likes: typeof f.likes === 'number' ? f.likes : 0
            }))
          : [{
              id: 'f_0',
              url: data.url || '',
              focalPoint: typeof data.fotoPositionY === 'number' ? data.fotoPositionY : 50,
              didascalia: data.didascalia || '',
              likes: typeof data.likes === 'number' ? data.likes : 0
            }];

        const coverIdx = typeof data.coverIndex === 'number' ? data.coverIndex : 0;
        const coverPhoto = fotosArr[coverIdx] || fotosArr[0];

        list.push({
          id: docSnap.id,
          url: coverPhoto?.url || data.url || '',
          titolo: data.titolo || 'Senza titolo',
          didascalia: data.didascalia || '',
          squadra: data.squadra || 'Generale',
          tagMood: data.tagMood || 'Esultanze & Grinta',
          isScattoDelMese: !!data.isScattoDelMese,
          isHighlight: !!data.isHighlight,
          ordine: typeof data.ordine === 'number' ? data.ordine : 0,
          likes: typeof data.likes === 'number' ? data.likes : 0,
          fotoPositionY: coverPhoto?.focalPoint ?? (typeof data.fotoPositionY === 'number' ? data.fotoPositionY : 50),
          coverIndex: coverIdx,
          fotos: fotosArr,
          createdAt: data.createdAt || null,
          updatedAt: data.updatedAt || null
        });
      });
      const sorted = list.sort((a, b) => a.ordine - b.ordine);
      setFotoList(sorted);
      try {
        localStorage.setItem(GALLERIA_CACHE_KEY, JSON.stringify(sorted));
      } catch (e) {}
      setLoading(false);
    }, (error) => {
      console.error("Errore listener galleria_foto:", error);
      getGalleriaFotoAll().then(data => {
        setFotoList(data);
        setLoading(false);
      });
    });

    return () => unsubscribe();
  }, []);

  // Handle Like toggle action on album or individual photo inside album
  const handleLike = async (e: React.MouseEvent, albumId: string, photoIndex?: number) => {
    e.stopPropagation();
    const likeKey = typeof photoIndex === 'number' ? `${albumId}_${photoIndex}` : albumId;
    const isAlreadyLiked = likedIds.includes(likeKey);
    const newLiked = isAlreadyLiked 
      ? likedIds.filter(id => id !== likeKey) 
      : [...likedIds, likeKey];
    
    setLikedIds(newLiked);
    try {
      localStorage.setItem('nva_liked_photos', JSON.stringify(newLiked));
    } catch (err) {}

    // Optimistic UI updates
    setFotoList(prev => prev.map(album => {
      if (album.id !== albumId) return album;
      const delta = isAlreadyLiked ? -1 : 1;
      
      if (typeof photoIndex === 'number' && album.fotos && album.fotos[photoIndex]) {
        const updatedFotos = [...album.fotos];
        const curLikes = updatedFotos[photoIndex].likes || 0;
        updatedFotos[photoIndex] = {
          ...updatedFotos[photoIndex],
          likes: Math.max(0, curLikes + delta)
        };
        return {
          ...album,
          likes: Math.max(0, (album.likes || 0) + delta),
          fotos: updatedFotos
        };
      } else {
        return {
          ...album,
          likes: Math.max(0, (album.likes || 0) + delta)
        };
      }
    }));

    // Firestore remote update
    try {
      if (!isDemoMode) {
        if (typeof photoIndex === 'number') {
          await likeFotoInAlbum(albumId, photoIndex, !isAlreadyLiked);
        } else {
          await likeGalleriaFoto(albumId, !isAlreadyLiked);
        }
      }
    } catch (err) {
      console.error("Errore salvataggio like su Firestore:", err);
    }
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (activeAlbumIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveAlbumIndex(null);
      } else if (e.key === 'ArrowLeft') {
        handlePrevPhoto();
      } else if (e.key === 'ArrowRight') {
        handleNextPhoto();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeAlbumIndex, activeFotoIndex, fotoList]);

  // Filtered albums list
  const filteredAlbums = fotoList.filter(item => {
    const matchTag = selectedTag === "Tutte" || item.tagMood === selectedTag;
    const matchSquadra = selectedSquadra === "Tutte le Squadre" || item.squadra === selectedSquadra;
    return matchTag && matchSquadra;
  });

  // Highlights list
  const highlights = fotoList.filter(f => f.isHighlight);

  // Scatto del mese
  const scattoDelMese = fotoList.find(f => f.isScattoDelMese) || fotoList[0];

  // Options for teams
  const squadOptions = ["Tutte le Squadre", "Serie D Femminile", "Serie D Maschile", "Prima Divisione", "Under 18", "Under 16", "Under 14", "Under 13", "Minivolley S3", "Generale"];

  // Navigation handlers inside modal
  const currentAlbum = activeAlbumIndex !== null && filteredAlbums[activeAlbumIndex] ? filteredAlbums[activeAlbumIndex] : null;
  const currentAlbumFotos = currentAlbum?.fotos && currentAlbum.fotos.length > 0 ? currentAlbum.fotos : (currentAlbum ? [{ id: '0', url: currentAlbum.url, focalPoint: currentAlbum.fotoPositionY ?? 50, didascalia: currentAlbum.didascalia, likes: currentAlbum.likes }] : []);
  const currentPhoto = currentAlbumFotos[activeFotoIndex] || currentAlbumFotos[0];

  const handlePrevPhoto = () => {
    if (!currentAlbum) return;
    if (activeFotoIndex > 0) {
      setActiveFotoIndex(prev => prev - 1);
    } else {
      if (activeAlbumIndex !== null && activeAlbumIndex > 0) {
        const prevAlbumIdx = activeAlbumIndex - 1;
        const prevAlbumFotos = filteredAlbums[prevAlbumIdx]?.fotos || [];
        setActiveAlbumIndex(prevAlbumIdx);
        setActiveFotoIndex(Math.max(0, prevAlbumFotos.length - 1));
      }
    }
  };

  const handleNextPhoto = () => {
    if (!currentAlbum) return;
    if (activeFotoIndex < currentAlbumFotos.length - 1) {
      setActiveFotoIndex(prev => prev + 1);
    } else {
      if (activeAlbumIndex !== null && activeAlbumIndex < filteredAlbums.length - 1) {
        setActiveAlbumIndex(prev => prev + 1);
        setActiveFotoIndex(0);
      }
    }
  };

  const totalAlbums = fotoList.length;
  const totalPhotos = fotoList.reduce((acc, curr) => acc + (curr.fotos?.length || 1), 0);
  const totalLikes = fotoList.reduce((acc, curr) => acc + (curr.likes || 0), 0);

  return (
    <div className="w-full" id="galleria-foto-view">
      
      {/* ================= HERO HEADER GALLERIA SNELLA E COMPATTA ================= */}
      <section className="relative w-full bg-zinc-950 border-b border-zinc-850 overflow-hidden pt-6 pb-6 sm:pt-8 sm:pb-8">
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,230,0,0.14),rgba(255,255,255,0))]" />
          <div className="absolute -top-24 left-1/3 w-96 h-96 bg-[#FFE600]/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          {/* Header Bar */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 border-b border-zinc-800/80 pb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/80 border border-[#FFE600]/40 text-[#FFE600] text-xs font-mono font-bold tracking-widest uppercase shadow-sm mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>MEDIA & PHOTO GALLERY • STAGIONE 2026/2027</span>
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-barlow font-black tracking-tight text-white uppercase leading-[0.95] drop-shadow-sm flex items-center gap-3">
                <span>GALLERIA FOTOGRAFICA</span>
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm font-inter max-w-xl leading-relaxed mt-1.5">
                I momenti più entusiasmanti della stagione, gli scatti dalle partite, l'atmosfera negli spogliatoi ed il calore delle nostre tribune.
              </p>
            </div>

            {/* Quick Stats Integrated in Dark Glass */}
            <div className="flex items-center gap-3 bg-black/80 border border-zinc-800 rounded-2xl p-2 shadow-xl w-fit shrink-0">
              <div className="text-center px-3.5 border-r border-zinc-800">
                <p className="text-lg font-barlow font-black text-white">{totalAlbums}</p>
                <p className="text-[9px] uppercase font-mono font-bold text-zinc-400 tracking-wider">Album</p>
              </div>
              <div className="text-center px-3.5 border-r border-zinc-800">
                <p className="text-lg font-barlow font-black text-[#FFE600]">{totalPhotos}</p>
                <p className="text-[9px] uppercase font-mono font-bold text-zinc-400 tracking-wider">Scatti</p>
              </div>
              <div className="text-center px-3.5">
                <p className="text-lg font-barlow font-black text-rose-500 flex items-center justify-center gap-1">
                  <Heart className="w-3.5 h-3.5 fill-rose-500" />
                  <span>{totalLikes}</span>
                </p>
                <p className="text-[9px] uppercase font-mono font-bold text-zinc-400 tracking-wider">Like</p>
              </div>
            </div>
          </div>

          {/* FILTRI E CONTROLLI INTEGRATI NELLA HERO */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 pt-1">
            {/* Tag Mood Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 bg-black/90 p-1.5 rounded-2xl border border-zinc-800 shadow-xl w-full lg:w-auto">
              <span className="text-xs font-bold uppercase text-zinc-400 font-mono flex items-center gap-1 px-2.5 shrink-0">
                <Filter className="w-3.5 h-3.5 text-[#FFE600]" /> Mood:
              </span>
              {TAG_MOODS.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase font-barlow tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-[#FFE600] text-zinc-950 font-extrabold shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Squadra Dropdown */}
            <div className="flex items-center gap-2 bg-black/90 p-2 rounded-2xl border border-zinc-800 shadow-xl shrink-0 w-full lg:w-auto">
              <Users className="w-4 h-4 text-[#FFE600] ml-2" />
              <select
                value={selectedSquadra}
                onChange={e => setSelectedSquadra(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-white font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#FFE600] font-barlow uppercase tracking-wider cursor-pointer w-full lg:w-auto"
              >
                {squadOptions.map(sq => (
                  <option key={sq} value={sq}>{sq}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CONTENUTO LUMINOSO CON FOTO IN PRIMO PIANO ================= */}
      <div className="w-full bg-gradient-to-b from-zinc-950 via-slate-900/10 to-slate-100/95 py-8 sm:py-10 transition-all relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* 1. HERO SPOTLIGHT: LO SCATTO DEL MESE (PANORAMICO & LUMINOSO) */}
          {scattoDelMese && (
            <div className="bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-[#FFE600] text-zinc-950 font-black px-3 py-1 rounded-full text-xs uppercase tracking-wider font-barlow shadow-sm flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 fill-zinc-950" />
                    <span>LO SCATTO DEL MESE</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                    {scattoDelMese.squadra}
                  </span>
                </div>

                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  📸 {scattoDelMese.fotos?.length || 1} Foto nell'Album
                </span>
              </div>

              {/* Panorama Photo Container (Crisp, Clear, No Dark Dimming Overlay) */}
              <div 
                onClick={() => {
                  const idx = filteredAlbums.findIndex(p => p.id === scattoDelMese.id);
                  if (idx !== -1) {
                    setActiveAlbumIndex(idx);
                    setActiveFotoIndex(scattoDelMese.coverIndex || 0);
                  }
                }}
                className="relative aspect-[16/9] sm:aspect-[21/9] w-full rounded-2xl overflow-hidden shadow-md cursor-pointer group bg-zinc-950"
              >
                <img 
                  src={scattoDelMese.url} 
                  alt={scattoDelMese.titolo} 
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  style={{ objectPosition: `50% ${scattoDelMese.fotoPositionY ?? 50}%` }}
                />
                
                {/* Floating Action Button on Hover */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-[#FFE600] text-zinc-950 font-extrabold px-6 py-3 rounded-2xl text-xs uppercase font-barlow tracking-wider shadow-2xl flex items-center gap-2 scale-95 group-hover:scale-100 transition-transform">
                    <Eye className="w-4 h-4" />
                    <span>Apri Album a Schermo Intero</span>
                  </span>
                </div>
              </div>

              {/* Details & Action Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded text-[11px] uppercase font-mono">
                      {scattoDelMese.tagMood}
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-barlow font-black uppercase text-slate-950 tracking-tight leading-none">
                    {scattoDelMese.titolo}
                  </h3>
                  {scattoDelMese.didascalia && (
                    <p className="text-slate-600 text-xs sm:text-sm font-inter leading-relaxed max-w-2xl pt-0.5">
                      {scattoDelMese.didascalia}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={(e) => handleLike(e, scattoDelMese.id)}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider font-barlow flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer ${
                      likedIds.includes(scattoDelMese.id)
                        ? 'bg-rose-600 text-white shadow-rose-600/30'
                        : 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200'
                    }`}
                  >
                    <Heart className={`w-4 h-4 transition-transform duration-300 ${likedIds.includes(scattoDelMese.id) ? 'fill-white text-white scale-110' : 'fill-rose-500 text-rose-500'}`} />
                    <span>{scattoDelMese.likes || 0} Like</span>
                  </button>

                  <button
                    onClick={() => {
                      const idx = filteredAlbums.findIndex(p => p.id === scattoDelMese.id);
                      if (idx !== -1) {
                        setActiveAlbumIndex(idx);
                        setActiveFotoIndex(scattoDelMese.coverIndex || 0);
                      }
                    }}
                    className="bg-zinc-950 hover:bg-[#FFE600] hover:text-zinc-950 text-[#FFE600] font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase font-barlow tracking-wider flex items-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Sfoglia Album</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. HIGHLIGHTS / MOMENTI IN EVIDENZA */}
          {highlights.length > 0 && (
            <div className="bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-amber-100 text-amber-700 rounded-lg">
                    <Flame className="w-4 h-4 animate-pulse" />
                  </div>
                  <h4 className="text-lg font-extrabold uppercase tracking-wide font-barlow text-slate-950">
                    Momenti in Evidenza
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  {highlights.length} Album
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {highlights.map((album) => {
                  const fotoCount = album.fotos?.length || 1;
                  return (
                    <div
                      key={album.id}
                      onClick={() => {
                        const idx = filteredAlbums.findIndex(p => p.id === album.id);
                        if (idx !== -1) {
                          setActiveAlbumIndex(idx);
                          setActiveFotoIndex(album.coverIndex || 0);
                        }
                      }}
                      className="group bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl overflow-hidden hover:border-[#FFE600] transition-all duration-300 cursor-pointer flex flex-col shadow-sm"
                    >
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950">
                        <img 
                          src={album.url} 
                          alt={album.titolo} 
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          style={{ objectPosition: `50% ${album.fotoPositionY ?? 50}%` }}
                        />
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 z-10">
                          <span className="bg-black/80 text-[#FFE600] font-black px-2 py-0.5 rounded text-[9px] uppercase font-mono shadow-sm">
                            {album.squadra || 'NVA'}
                          </span>
                          <span className="bg-black/80 text-white font-mono font-bold text-[9px] px-2 py-0.5 rounded-full shadow-sm">
                            📸 {fotoCount}
                          </span>
                        </div>
                      </div>
                      <div className="p-3.5 space-y-1">
                        <h5 className="font-barlow font-bold text-sm text-slate-950 uppercase tracking-wide line-clamp-1 group-hover:text-amber-600 transition-colors">
                          {album.titolo}
                        </h5>
                        <p className="text-[11px] text-slate-500 font-inter line-clamp-1">
                          {album.didascalia || 'Album fotografico ufficiale'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. GRIGLIA ALBUM FOTOGRAFICI A GRANDI FORMATI */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-6 bg-[#FFE600] rounded-sm inline-block shadow-sm" />
                <Images className="w-5 h-5 text-[#FFE600]" />
                <h2 className="text-2xl font-barlow font-extrabold uppercase tracking-wide text-white drop-shadow-sm">
                  {selectedTag === "Tutte" ? "TUTTI GLI ALBUM FOTOGRAFICI" : `ALBUM: ${selectedTag.toUpperCase()}`}
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-zinc-300 bg-black/80 border border-zinc-800 px-3 py-1.5 rounded-xl shadow-sm">
                {filteredAlbums.length} Album Trovati
              </span>
            </div>

            {/* Grid Albums (2 or 3 Large Columns) */}
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-[#FFE600] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-zinc-500 uppercase font-mono tracking-wider">Caricamento Galleria in corso...</p>
              </div>
            ) : filteredAlbums.length === 0 ? (
              <div className="border border-slate-200 bg-white/95 backdrop-blur-sm rounded-3xl p-12 text-center space-y-3 shadow-sm max-w-md mx-auto">
                <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                  <Camera className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900 uppercase font-barlow">
                  Nessun album trovato
                </h3>
                <p className="text-xs text-slate-500 font-inter leading-relaxed">
                  Non ci sono eventi o scatti corrispondenti ai filtri selezionati. Prova a selezionare un altro Tag Mood o un'altra Squadra.
                </p>
                <button
                  onClick={() => { setSelectedTag("Tutte"); setSelectedSquadra("Tutte le Squadre"); }}
                  className="text-xs font-bold text-amber-600 underline uppercase hover:text-black cursor-pointer font-barlow pt-2"
                >
                  Ripristina Tutti i Filtri
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredAlbums.map((album, index) => {
                  const fotoCount = album.fotos?.length || 1;
                  return (
                    <div
                      key={album.id}
                      onClick={() => {
                        setActiveAlbumIndex(index);
                        setActiveFotoIndex(album.coverIndex || 0);
                      }}
                      className="group bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-3xl overflow-hidden hover:border-[#FFE600] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-all duration-300 cursor-pointer flex flex-col justify-between"
                    >
                      {/* Image Container - Big & Vivid in 16:10 format */}
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950">
                        <img
                          src={album.url}
                          alt={album.titolo}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          style={{ objectPosition: `50% ${album.fotoPositionY ?? 50}%` }}
                        />

                        {/* Top Badges */}
                        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 z-10">
                          <span className="bg-black/80 backdrop-blur-md border border-zinc-700 text-[#FFE600] font-black px-3 py-1 rounded-md text-[11px] uppercase font-mono shadow-md">
                            {album.squadra}
                          </span>
                          
                          <span className="bg-black/80 text-white font-mono font-bold text-[11px] px-3 py-1 rounded-full border border-zinc-700 shadow-md flex items-center gap-1.5">
                            <Images className="w-3.5 h-3.5 text-[#FFE600]" />
                            <span>{fotoCount}</span>
                          </span>
                        </div>

                        {/* Soft corner tag */}
                        <div className="absolute bottom-3 left-3 z-10">
                          <span className="text-[10px] font-bold text-zinc-950 uppercase tracking-wider font-mono bg-[#FFE600] px-2.5 py-0.5 rounded shadow-md">
                            {album.tagMood}
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-6 flex flex-col justify-between flex-1 space-y-4">
                        <div>
                          <h4 className="text-slate-950 font-extrabold text-xl uppercase tracking-wide font-barlow group-hover:text-amber-600 transition-colors leading-snug">
                            {album.titolo}
                          </h4>
                          {album.didascalia && (
                            <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 font-inter leading-relaxed">
                              {album.didascalia}
                            </p>
                          )}
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className="text-xs font-barlow font-extrabold uppercase text-amber-600 group-hover:translate-x-1 transition-transform flex items-center gap-1.5">
                            <span>Sfoglia Album ({fotoCount} foto)</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>

                          <button
                            onClick={(e) => handleLike(e, album.id)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-barlow flex items-center gap-1.5 transition-all cursor-pointer ${
                              likedIds.includes(album.id)
                                ? 'bg-rose-600 text-white shadow shadow-rose-600/30'
                                : 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200'
                            }`}
                          >
                            <Heart className={`w-4 h-4 transition-transform duration-300 ${likedIds.includes(album.id) ? 'fill-white text-white scale-110' : 'fill-rose-500 text-rose-500'}`} />
                            <span>{album.likes || 0}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 4. LIGHTBOX / POPUP INGRANDITO FULLSCREEN AD ALBUM */}
      {currentAlbum !== null && activeAlbumIndex !== null && currentPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 sm:p-6 animate-fade-in">
          
          {/* Close Button */}
          <button
            onClick={() => setActiveAlbumIndex(null)}
            className="absolute top-4 right-4 z-50 bg-zinc-900/90 hover:bg-zinc-800 text-white p-3 rounded-full border border-zinc-700 transition-all shadow-xl cursor-pointer"
            title="Chiudi (Esc)"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Left Arrow (Previous Photo in Album or Previous Album) */}
          <button
            onClick={handlePrevPhoto}
            className="absolute left-2 sm:left-6 z-40 bg-zinc-900/90 hover:bg-[#FFE600] hover:text-zinc-950 text-white p-3.5 rounded-full border border-zinc-700 transition-all shadow-xl cursor-pointer"
            title="Precedente (Freccia Sinistra)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Right Arrow (Next Photo in Album or Next Album) */}
          <button
            onClick={handleNextPhoto}
            className="absolute right-2 sm:right-6 z-40 bg-zinc-900/90 hover:bg-[#FFE600] hover:text-zinc-950 text-white p-3.5 rounded-full border border-zinc-700 transition-all shadow-xl cursor-pointer"
            title="Successiva (Freccia Destra)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Main Lightbox Container */}
          <div className="relative max-w-5xl w-full max-h-[92vh] flex flex-col md:flex-row bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
            
            {/* Main Display Area */}
            <div className="relative flex-1 bg-black flex flex-col items-center justify-center p-3 min-h-[320px] max-h-[60vh] md:max-h-[85vh]">
              <img
                src={currentPhoto.url}
                alt={currentAlbum.titolo}
                loading="lazy"
                decoding="async"
                className="max-w-full max-h-[50vh] md:max-h-[72vh] object-contain rounded-2xl"
                style={{ objectPosition: `50% ${currentPhoto.focalPoint ?? 50}%` }}
              />

              {/* Album Multi-Photo Strip (Bottom of image preview) */}
              {currentAlbumFotos.length > 1 && (
                <div className="w-full pt-3 px-2 flex items-center justify-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-700">
                  {currentAlbumFotos.map((f, fIdx) => {
                    const isSelected = fIdx === activeFotoIndex;
                    return (
                      <button
                        key={f.id || fIdx}
                        onClick={() => setActiveFotoIndex(fIdx)}
                        className={`relative w-12 h-10 sm:w-14 sm:h-11 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#FFE600] ring-2 ring-[#FFE600]/50 scale-105'
                            : 'border-zinc-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={f.url}
                          alt={`Miniatura ${fIdx + 1}`}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                          style={{ objectPosition: `50% ${f.focalPoint ?? 50}%` }}
                        />
                        {currentAlbum.coverIndex === fIdx && (
                          <span className="absolute top-0.5 left-0.5 bg-[#FFE600] text-zinc-950 font-black text-[7px] px-1 rounded">
                            ★
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Photo Details Sidebar */}
            <div className="w-full md:w-80 bg-zinc-900 p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-zinc-800 space-y-6">
              
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-[#FFE600]/20 text-[#FFE600] border border-[#FFE600]/30 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider">
                    {currentAlbum.tagMood}
                  </span>
                  <span className="bg-zinc-800 text-zinc-300 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider">
                    {currentAlbum.squadra}
                  </span>
                  {currentAlbum.isScattoDelMese && (
                    <span className="bg-[#FFE600] text-zinc-950 font-black px-2 py-0.5 rounded text-[9px] uppercase font-mono">
                      ★ SCATTO MESE
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-black uppercase text-white font-barlow leading-tight">
                    {currentAlbum.titolo}
                  </h3>
                  
                  {/* Photo specific or album caption */}
                  <p className="text-xs text-zinc-300 mt-2 leading-relaxed font-inter">
                    {currentPhoto.didascalia || currentAlbum.didascalia || 'Nessuna didascalia.'}
                  </p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="space-y-4 border-t border-zinc-800 pt-4">
                {/* Like Button */}
                <button
                  onClick={(e) => handleLike(e, currentAlbum.id, activeFotoIndex)}
                  className={`w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider font-barlow flex justify-center items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer ${
                    likedIds.includes(`${currentAlbum.id}_${activeFotoIndex}`) || likedIds.includes(currentAlbum.id)
                      ? 'bg-rose-600 text-white shadow-rose-600/30'
                      : 'bg-zinc-800 hover:bg-rose-950/60 text-white hover:text-rose-400 border border-zinc-700'
                  }`}
                >
                  <Heart className={`w-4 h-4 transition-transform duration-300 ${likedIds.includes(`${currentAlbum.id}_${activeFotoIndex}`) || likedIds.includes(currentAlbum.id) ? 'fill-white text-white scale-110' : 'fill-rose-500 text-rose-500'}`} />
                  <span>
                    {currentPhoto.likes || currentAlbum.likes || 0} Like
                  </span>
                </button>

                <div className="text-center space-y-1">
                  <p className="text-[11px] font-bold text-[#FFE600] uppercase font-mono tracking-wider">
                    Foto {activeFotoIndex + 1} di {currentAlbumFotos.length} nell'Album
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    Album {activeAlbumIndex + 1} di {filteredAlbums.length}
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
