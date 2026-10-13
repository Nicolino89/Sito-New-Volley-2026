import React, { useState, useEffect } from 'react';
import { Instagram, ExternalLink, Heart, MessageCircle, Play, Layers, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { InstagramPost, getInstagramPostsAll } from '../firebase-societa';

interface InstagramLiveFeedProps {
  instagramUsername?: string;
  className?: string;
}

export const InstagramLiveFeed: React.FC<InstagramLiveFeedProps> = ({
  instagramUsername = "newvolleyacademy",
  className = ""
}) => {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const instagramProfileUrl = `https://www.instagram.com/${instagramUsername.replace('@', '')}/`;

  useEffect(() => {
    let isMounted = true;
    getInstagramPostsAll().then(data => {
      if (isMounted) {
        setPosts(data);
        setLoading(false);
      }
    }).catch(err => {
      console.warn("Errore caricamento feed Instagram:", err);
      if (isMounted) setLoading(false);
    });

    return () => { isMounted = false; };
  }, []);

  const formatRelativeTime = (timestamp?: string) => {
    if (!timestamp) return 'Recente';
    try {
      const now = new Date();
      const postDate = new Date(timestamp);
      const diffMs = now.getTime() - postDate.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 1) return 'Poco fa';
      if (diffHours < 24) return `${diffHours}h fa`;
      if (diffDays === 1) return 'Ieri';
      if (diffDays < 7) return `${diffDays} giorni fa`;
      return postDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
    } catch {
      return 'Recente';
    }
  };

  const highlightHashtags = (text?: string) => {
    if (!text) return '';
    const parts = text.split(/(#[a-zA-Z0-9_]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        return (
          <span key={index} className="text-[#FFE600] font-semibold">
            {part}{' '}
          </span>
        );
      }
      return part;
    });
  };

  const scrollContainer = (direction: 'left' | 'right') => {
    const el = document.getElementById('instagram-scroll-strip');
    if (el) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className={`w-full relative z-20 ${className}`} aria-label="Feed Instagram Live">
      <div className="bg-gradient-to-br from-[#121318] via-[#0E0F14] to-[#161720] border border-zinc-800/80 rounded-3xl p-5 sm:p-7 shadow-[0_15px_40px_rgba(0,0,0,0.55)] relative overflow-hidden">
        
        {/* Glow decorativo d'angolo */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-[#E1306C]/15 via-[#F77737]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-gradient-to-tr from-[#FFE600]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Header Sezione */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80 relative z-10">
          <div className="flex items-center gap-3.5">
            {/* Icona Instagram con gradiente ufficiale */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl p-[2px] bg-gradient-to-tr from-[#FEDA75] via-[#FA7E1E] via-[#D62976] via-[#962FBF] to-[#4F5BD5] shadow-lg shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-[#0E0F14] rounded-[14px] flex items-center justify-center">
                <Instagram className="w-6 h-6 text-white" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                  LIVE SOCIAL FEED
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-barlow font-black uppercase tracking-wide text-white drop-shadow-sm flex items-center gap-2">
                <span>DAL CAMPO AI SOCIAL</span>
              </h2>
            </div>
          </div>

          {/* Destra: Tasto Segui Profilo Ufficiale + Frecce Scorrimento */}
          <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-auto">
            <a
              href={instagramProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-850 hover:from-zinc-800 hover:to-zinc-750 text-white border border-zinc-700/80 hover:border-[#FFE600] transition-all duration-200 group text-xs sm:text-sm font-barlow font-extrabold uppercase tracking-wider shadow-md cursor-pointer"
            >
              <Instagram className="w-4 h-4 text-[#F77737] group-hover:text-[#FFE600] transition-colors" />
              <span>@{instagramUsername.replace('@', '')}</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>

            {/* Controlli scorrimento su desktop */}
            <div className="hidden md:flex items-center gap-1.5 pl-1">
              <button
                type="button"
                onClick={() => scrollContainer('left')}
                className="w-9 h-9 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Post precedenti"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollContainer('right')}
                className="w-9 h-9 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Post successivi"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Striscia Post Dinamica a Carosello Orizzontale */}
        <div className="mt-5 relative z-10">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-pulse">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="aspect-square bg-zinc-900 rounded-2xl" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-10 bg-zinc-900/50 rounded-2xl border border-zinc-800">
              <Instagram className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-zinc-400 text-sm font-barlow font-semibold uppercase tracking-wider">
                Nessun post Instagram sincronizzato al momento.
              </p>
            </div>
          ) : (
            <div
              id="instagram-scroll-strip"
              className="flex items-stretch gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory scrollbar-none"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {posts.map((post, idx) => {
                const isVideo = post.media_type === 'VIDEO';
                const isCarousel = post.media_type === 'CAROUSEL_ALBUM';
                const imageUrl = post.media_url || post.thumbnail_url;

                return (
                  <a
                    key={post.id || idx}
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex-none w-[240px] sm:w-[260px] md:w-[280px] snap-start bg-[#161720] border border-zinc-800 hover:border-[#FFE600] rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.7)] flex flex-col"
                  >
                    {/* Immagine Post con Aspect Ratio 4:5 o 1:1 */}
                    <div className="relative aspect-square w-full overflow-hidden bg-zinc-950">
                      <img
                        src={imageUrl}
                        alt="Instagram Post NVA"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                        referrerPolicy="no-referrer"
                      />

                      {/* Gradiente Scuro di Base */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-60 group-hover:opacity-85 transition-opacity" />

                      {/* Badge Tipo Media (Reel / Album) */}
                      <div className="absolute top-3 right-3 z-10">
                        {isVideo && (
                          <span className="p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center shadow">
                            <Play className="w-3.5 h-3.5 fill-white" />
                          </span>
                        )}
                        {isCarousel && (
                          <span className="p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center shadow">
                            <Layers className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      {/* Badge Instagram in alto a sinistra */}
                      <div className="absolute top-3 left-3 z-10">
                        <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-white shadow">
                          <Instagram className="w-3 h-3 text-[#F77737]" />
                          <span>{formatRelativeTime(post.timestamp || post.data_creazione)}</span>
                        </span>
                      </div>

                      {/* Hover Overlay con Tasto Esterno */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/35 backdrop-blur-[2px]">
                        <span className="px-3.5 py-1.5 rounded-xl bg-[#FFE600] text-black font-barlow font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                          <span>Vedi su IG</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>

                    {/* Didascalia e Dettagli del Post */}
                    <div className="p-3.5 flex flex-col justify-between flex-1 bg-[#121318]">
                      <p className="text-xs font-inter text-zinc-300 line-clamp-3 leading-relaxed">
                        {highlightHashtags(post.caption)}
                      </p>

                      <div className="pt-2.5 mt-2 border-t border-zinc-800/70 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                        <span className="text-[#FFE600] font-bold">@newvolleyacademy</span>
                        <span className="flex items-center gap-1 text-zinc-500 group-hover:text-white transition-colors">
                          <span>Apri post</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </section>
  );
};

export default InstagramLiveFeed;
