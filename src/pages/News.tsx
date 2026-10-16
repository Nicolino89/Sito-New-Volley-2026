import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  Newspaper, 
  Search, 
  Clock, 
  ArrowLeft, 
  Share2, 
  BookOpen, 
  Sparkles,
  CheckCircle,
  Tag,
  ArrowRight,
  User,
  Calendar,
  Maximize2,
  X,
  ZoomIn
} from 'lucide-react';
import { NewsBlog, RosaSquadra } from '../firebase-societa';
import { updatePageMeta } from '../utils/seoHelper';
import { getArticlePublicUrl } from '../utils/socialShare';

import SocialShareBar from '../components/SocialShareBar';

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

interface NewsProps {
  newsAll: NewsBlog[];
  squadreAll?: RosaSquadra[];
}

export default function News({ newsAll, squadreAll = [] }: NewsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams<{ slug?: string }>();

  // Determine if viewing a single article
  const rawParam = slug || (location.pathname.startsWith('/news/') ? location.pathname.split('/news/')[1] : null);
  const currentSlug = rawParam ? decodeURIComponent(rawParam) : null;

  const [newsSearch, setNewsSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tutte');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Scroll to top when opening an article or changing slug
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setIsImageModalOpen(false);
  }, [currentSlug]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsImageModalOpen(false);
      }
    };
    if (isImageModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isImageModalOpen]);

  // Normalizzazione flessibile per garantire match sia con trattini che senza punteggiatura
  const normalizeForMatch = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Find article if on detail route
  const singleArticle = currentSlug 
    ? newsAll.find(n => {
        if (!n) return false;
        if (n.id === currentSlug) return true;
        const slugT = slugify(n.titolo || '');
        if (slugT === currentSlug) return true;
        return normalizeForMatch(slugT) === normalizeForMatch(currentSlug) ||
               normalizeForMatch(n.titolo || '') === normalizeForMatch(currentSlug);
      })
    : null;

  // Dynamic SEO meta tags
  useEffect(() => {
    if (singleArticle) {
      updatePageMeta({
        title: `${singleArticle.titolo} | Notizie`,
        description: singleArticle.testo.slice(0, 160),
        image: singleArticle.foto_copertina_url,
        url: getArticlePublicUrl(singleArticle),
        type: 'article'
      });
    } else {
      updatePageMeta({
        title: 'Archivio Notizie & Comunicati | New Volley Academy',
        description: 'Tutte le ultime notizie, i risultati delle partite e i comunicati ufficiali della New Volley Academy Forlì.',
        url: 'https://newvolleyacademy.it/news'
      });
    }
  }, [singleArticle?.id]);

  // Dynamic categories: Tutte, plus created teams, base categories, and any existing tags
  const teamCategories = (squadreAll || [])
    .map(s => s.nome_squadra?.trim())
    .filter(Boolean);

  const baseCategories = ['Comunicato Ufficiale', 'Eventi', 'Giovanili'];
  
  const existingCategories = newsAll
    .map(n => n.tag_categoria?.trim())
    .filter(Boolean);

  const categories = [
    'Tutte',
    ...Array.from(new Set([...teamCategories, ...baseCategories, ...existingCategories]))
  ];

  // Filter published news
  const displayedNews = newsAll.filter(item => {
    if (item.stato_pubblicazione === 'bozza') return false;

    const catLower = selectedCategory.toLowerCase();
    const matchCategory = selectedCategory === 'Tutte' || 
      (item.tag_categoria || '').toLowerCase() === catLower ||
      (item.squadra_associata_id && squadreAll?.find(s => s.id === item.squadra_associata_id)?.nome_squadra.toLowerCase() === catLower);

    const query = newsSearch.toLowerCase().trim();
    const matchSearch = !query || 
      item.titolo.toLowerCase().includes(query) || 
      item.testo.toLowerCase().includes(query) ||
      (item.autore && item.autore.toLowerCase().includes(query));

    return matchCategory && matchSearch;
  });

  // =========================================================================
  // VIEW 1: SINGLE ARTICLE DETAIL
  // =========================================================================
  if (currentSlug) {
    if (!singleArticle) {
      if (newsAll.length === 0) {
        return (
          <div className="w-full min-h-[50vh] py-28 text-center flex flex-col items-center justify-center space-y-4 bg-zinc-950">
            <div className="w-10 h-10 border-4 border-[#FFE600] border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest">Caricamento articolo...</p>
          </div>
        );
      }
      return (
        <div className="w-full">
          <section className="relative w-full bg-zinc-950 border-b border-zinc-850 py-16 text-center">
            <div className="max-w-4xl mx-auto px-4 space-y-4">
              <BookOpen className="w-16 h-16 text-[#FFE600] mx-auto animate-bounce" />
              <h2 className="text-3xl font-barlow font-black uppercase tracking-wide text-white">Articolo non trovato</h2>
              <p className="text-zinc-400 font-inter text-sm">
                La notizia che stai cercando non esiste o potrebbe essere stata archiviata.
              </p>
              <button
                onClick={() => navigate('/news')}
                className="bg-[#FFE600] hover:bg-[#ebd400] text-zinc-950 font-barlow font-extrabold uppercase text-xs tracking-wider px-6 py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-[#FFE600]/20 inline-flex items-center gap-2 mt-4"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Torna all'Archivio Notizie</span>
              </button>
            </div>
          </section>
        </div>
      );
    }

    return (
      <div className="w-full" id="single-news-detail">
        {/* Top Header Single News */}
        <section className="relative w-full bg-zinc-950 border-b border-zinc-850 overflow-hidden pt-8 pb-10 sm:pt-10 sm:pb-12">
          <div className="absolute inset-0 z-0">
            <div className="w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,230,0,0.14),rgba(255,255,255,0))]" />
            <div className="absolute -top-24 left-1/3 w-96 h-96 bg-[#FFE600]/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            {/* Back Button */}
            <button
              onClick={() => navigate('/news')}
              className="inline-flex items-center gap-2 text-xs font-barlow font-bold uppercase tracking-widest text-[#FFE600] hover:text-white transition-colors cursor-pointer bg-black/80 border border-zinc-800 px-3.5 py-1.5 rounded-xl shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Torna all'Archivio Notizie</span>
            </button>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="bg-[#FFE600] text-zinc-950 text-xs font-black font-mono uppercase tracking-wider px-3 py-1 rounded-md shadow-sm">
                  {singleArticle.tag_categoria}
                </span>
                <span className="text-xs text-zinc-400 font-mono flex items-center gap-1.5 bg-black/60 border border-zinc-800 px-3 py-1 rounded-md">
                  <Clock className="w-3.5 h-3.5 text-[#FFE600]" />
                  {new Date(singleArticle.data_pubblicazione).toLocaleDateString('it-IT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-barlow font-black uppercase tracking-tight text-white leading-[1.05] drop-shadow-sm">
                {singleArticle.titolo}
              </h1>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-zinc-400 font-mono pt-3 border-t border-zinc-850">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#FFE600]" />
                  <span>Autore: <strong className="text-white">{singleArticle.autore || 'Ufficio Stampa NVA'}</strong></span>
                </div>
                
                <SocialShareBar article={singleArticle} showLabel={false} />
              </div>
            </div>
          </div>
        </section>

        {/* Content Body Single News */}
        <div className="w-full bg-gradient-to-b from-zinc-950 via-slate-900/10 to-slate-100/95 py-8 sm:py-12 transition-all relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            <article className="bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
              {/* Cover Photo con click per ingrandimento */}
              {singleArticle.foto_copertina_url && (
                <div 
                  onClick={() => setIsImageModalOpen(true)}
                  className="w-full max-h-[560px] overflow-hidden rounded-2xl bg-zinc-950 border border-slate-200 shadow-md relative group cursor-zoom-in flex items-center justify-center transition-all hover:border-[#FFE600]/80"
                  title="Clicca per visualizzare la foto a schermo intero"
                >
                  <img
                    src={singleArticle.foto_copertina_url}
                    alt={singleArticle.titolo}
                    loading="lazy"
                    decoding="async"
                    className="w-full max-h-[560px] object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Badge Ingrandisci */}
                  <div className="absolute bottom-3 right-3 bg-zinc-950/85 group-hover:bg-[#FFE600] group-hover:text-zinc-950 backdrop-blur-md text-white text-xs font-mono font-medium px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-white/20 group-hover:border-[#FFE600] shadow-lg transition-all pointer-events-none">
                    <ZoomIn className="w-4 h-4 text-[#FFE600] group-hover:text-zinc-950" />
                    <span className="font-sans font-semibold">Clicca per foto intera</span>
                  </div>
                </div>
              )}

              {/* Article Text Content */}
              <div className="text-slate-800 text-base sm:text-lg leading-relaxed whitespace-pre-wrap font-inter space-y-4">
                {singleArticle.testo}
              </div>

              {/* Bottom Share Box */}
              <div className="mt-8 pt-6 border-t border-slate-200 bg-amber-50/80 p-6 rounded-2xl border border-amber-200/60">
                <SocialShareBar article={singleArticle} showLabel={true} />
              </div>
            </article>

          </div>
        </div>

        {/* Lightbox Modal per immagine a schermo intero */}
        {isImageModalOpen && singleArticle.foto_copertina_url && (
          <div 
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
            onClick={() => setIsImageModalOpen(false)}
          >
            {/* Bottone Chiudi */}
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 p-3 rounded-full bg-zinc-900/90 border border-zinc-700 text-white hover:text-[#FFE600] hover:border-[#FFE600] hover:bg-zinc-800 transition-all cursor-pointer shadow-2xl"
              title="Chiudi (ESC)"
              aria-label="Chiudi visualizzatore immagine"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Immagine a schermo intero */}
            <div 
              className="relative max-w-full max-h-[90vh] flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={singleArticle.foto_copertina_url}
                alt={singleArticle.titolo}
                className="max-w-full max-h-[82vh] object-contain rounded-xl shadow-2xl border border-zinc-800 select-none"
              />
              <div className="mt-3 flex items-center gap-2 text-zinc-400 text-xs font-mono bg-zinc-900/80 px-4 py-1.5 rounded-full border border-zinc-800 shadow-md">
                <span>Tocca o clicca fuori per chiudere (ESC)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: NEWS ARCHIVE & LIST
  // =========================================================================
  return (
    <div className="w-full" id="news-archive-view">
      
      {/* ================= HERO HEADER NEWS COMPATTO E RESPONSIVE ================= */}
      <section className="relative w-full bg-zinc-950 border-b border-zinc-850 overflow-hidden pt-4 pb-3 sm:pt-8 sm:pb-6">
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,230,0,0.14),rgba(255,255,255,0))]" />
          <div className="absolute -top-24 left-1/3 w-96 h-96 bg-[#FFE600]/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3 sm:space-y-5">
          {/* Header Snello e Diretto */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 sm:gap-4 border-b border-zinc-800/80 pb-2.5 sm:pb-4">
            <div>
              <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/80 border border-[#FFE600]/40 text-[#FFE600] text-xs font-mono font-bold tracking-widest uppercase shadow-sm mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>COMUNICAZIONE & MATCH REPORT • STAGIONE 2026/2027</span>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-barlow font-black tracking-tight text-white uppercase leading-none drop-shadow-sm flex items-center gap-3">
                <span>ARCHIVIO NOTIZIE & COMUNICATI</span>
              </h1>
            </div>
            <p className="hidden sm:block text-zinc-400 text-xs sm:text-sm font-inter max-w-md leading-relaxed">
              Resta aggiornato su tutte le partite, gli eventi, i campionati e la vita societaria delle Pantere.
            </p>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="flex flex-col md:flex-row gap-2.5 sm:gap-4 items-stretch md:items-center justify-between pt-0.5">
            {/* Search Box - compatto su mobile */}
            <div className="relative w-full md:w-80 lg:w-96 shrink-0">
              <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-400 absolute left-3 top-2.5 sm:top-3" />
              <input
                type="text"
                value={newsSearch}
                onChange={(e) => setNewsSearch(e.target.value)}
                placeholder="Cerca notizie..."
                className="w-full pl-9 pr-3 py-1.5 sm:py-2.5 text-xs sm:text-sm border border-zinc-800 rounded-xl sm:rounded-2xl bg-black/80 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FFE600] transition-colors shadow-inner"
              />
            </div>

            {/* Category Pills - Scorrimento orizzontale su riga singola su mobile (zero ingombro!) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none py-1 w-full md:w-auto -mx-1 px-1 sm:mx-0 sm:px-0">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-bold uppercase font-barlow tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-[#FFE600] text-zinc-950 shadow-md font-extrabold'
                        : 'bg-zinc-900/90 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ================= CONTENUTO NEWS CON TRANSIZIONE SFUMATA ================= */}
      <div className="w-full bg-gradient-to-b from-zinc-950 via-slate-900/10 to-slate-100/95 py-4 sm:py-8 transition-all relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
          
          {/* Sub Header & Count - compatto e immediato */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-4 sm:w-2.5 sm:h-5 bg-[#FFE600] rounded-sm inline-block shadow-sm" />
              <h2 className="text-lg sm:text-2xl font-barlow font-bold uppercase tracking-wide text-white drop-shadow-sm">
                {selectedCategory === 'Tutte' ? 'Tutte le Notizie' : selectedCategory}
              </h2>
            </div>
            <span className="text-[11px] sm:text-xs font-mono font-bold text-zinc-400 bg-black/80 border border-zinc-800 px-2.5 py-1 rounded-lg sm:rounded-xl shadow-sm">
              {displayedNews.length} {displayedNews.length === 1 ? 'notizia' : 'notizie'}
            </span>
          </div>

          {/* News Grid */}
          {displayedNews.length === 0 ? (
            <div className="bg-white/95 backdrop-blur-sm border border-slate-200/90 p-8 sm:p-12 rounded-2xl sm:rounded-3xl text-center shadow-sm space-y-3 max-w-md mx-auto">
              <Newspaper className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto" />
              <h3 className="text-base sm:text-lg font-barlow font-bold uppercase text-slate-900">Nessuna notizia trovata</h3>
              <p className="text-slate-500 text-xs font-inter leading-relaxed">
                Nessun articolo corrisponde ai filtri selezionati. Prova a cercare un termine diverso o seleziona un'altra categoria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {displayedNews.map((news) => (
                <div
                  key={news.id}
                  onClick={() => navigate(`/news/${slugify(news.titolo)}`)}
                  className="bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-2xl sm:rounded-3xl overflow-hidden hover:border-[#FFE600] hover:shadow-[0_10px_35px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                >
                  <div>
                    {/* Cover Image */}
                    <div className="h-44 sm:h-52 overflow-hidden relative bg-zinc-950 border-b border-slate-100">
                      <img
                        src={news.foto_copertina_url || 'https://images.unsplash.com/photo-1592656094267-764a45157575?w=600&q=80'}
                        alt={news.titolo}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 bg-[#FFE600] text-zinc-950 text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md shadow-md">
                        {news.tag_categoria}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>{new Date(news.data_pubblicazione).toLocaleDateString('it-IT')}</span>
                        <span>•</span>
                        <span className="truncate">{news.autore || 'Ufficio Stampa NVA'}</span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-barlow font-bold leading-snug text-slate-950 group-hover:text-amber-600 transition-colors uppercase">
                        {news.titolo}
                      </h3>

                      <p className="text-slate-600 text-xs leading-relaxed line-clamp-2 sm:line-clamp-3 font-inter">
                        {news.testo}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-0 sm:p-6 sm:pt-0 flex items-center justify-between gap-2 border-t border-slate-100 mt-2">
                    <span className="text-xs font-barlow font-extrabold uppercase text-amber-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      <span>Leggi l'articolo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                    <SocialShareBar article={news} layout="compact" showLabel={false} />
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
