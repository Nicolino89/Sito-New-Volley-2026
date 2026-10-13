import React, { useState, useEffect } from 'react';
import { 
  Instagram, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  RefreshCw, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Copy, 
  Info,
  Calendar,
  Layers,
  Play
} from 'lucide-react';
import { 
  InstagramPost, 
  getInstagramPostsAll, 
  saveInstagramPost, 
  deleteInstagramPost, 
  toggleVisibilityInstagramPost 
} from '../../../firebase-societa';

interface TabInstagramProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const TabInstagram: React.FC<TabInstagramProps> = ({ showToast }) => {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalManualOpen, setModalManualOpen] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Form per inserimento manuale
  const [form, setForm] = useState({
    caption: '',
    media_url: '',
    media_type: 'IMAGE' as 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM',
    permalink: 'https://www.instagram.com/p/',
    timestamp: new Date().toISOString()
  });

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await getInstagramPostsAll(true);
      setPosts(data);
    } catch (e) {
      console.error(e);
      showToast("Errore nel caricamento dei post Instagram", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleToggleVisibility = async (id: string, currentVis: boolean) => {
    try {
      await toggleVisibilityInstagramPost(id, !currentVis);
      setPosts(prev => prev.map(p => p.id === id ? { ...p, visibile: !currentVis } : p));
      showToast(currentVis ? "Post nascosto dal sito" : "Post reso visibile sul sito", "success");
    } catch (e) {
      showToast("Errore durante il cambio visibilità", "error");
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo post salvato dal sito?")) return;
    try {
      await deleteInstagramPost(id);
      setPosts(prev => prev.filter(p => p.id !== id));
      showToast("Post eliminato con successo", "success");
    } catch (e) {
      showToast("Errore durante l'eliminazione", "error");
    }
  };

  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.media_url.trim()) {
      showToast("Inserisci l'URL dell'immagine o video", "error");
      return;
    }

    try {
      const nuovo = await saveInstagramPost({
        id: `manual_${Date.now()}`,
        caption: form.caption.trim(),
        media_url: form.media_url.trim(),
        media_type: form.media_type,
        permalink: form.permalink.trim() || 'https://www.instagram.com/newvolleyacademy/',
        timestamp: form.timestamp || new Date().toISOString(),
        visibile: true
      });

      setPosts(prev => [nuovo, ...prev]);
      setModalManualOpen(false);
      setForm({
        caption: '',
        media_url: '',
        media_type: 'IMAGE',
        permalink: 'https://www.instagram.com/p/',
        timestamp: new Date().toISOString()
      });
      showToast("Post Instagram salvato con successo!", "success");
    } catch (e) {
      showToast("Errore durante il salvataggio manuale", "error");
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Box Introduttivo & Istruzioni Make.com */}
      <div className="bg-gradient-to-br from-[#161722] via-[#111218] to-black border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#E1306C]/10 via-[#F77737]/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl p-[2px] bg-gradient-to-tr from-[#FEDA75] via-[#FA7E1E] via-[#D62976] via-[#962FBF] to-[#4F5BD5] shrink-0 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                <Instagram className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#FFE600]">
                  Sincronizzazione Social
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Pronto per Make.com
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-barlow font-black uppercase text-white mt-1">
                Feed Instagram Live
              </h2>
              <p className="text-xs sm:text-sm font-inter text-zinc-400 max-w-2xl mt-1 leading-relaxed">
                Ogni volta che pubblichi un post su Instagram, Make.com lo salva in automatico qui nel database del sito. I post compaiono in tempo reale in Homepage subito sopra le notizie.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setModalManualOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-barlow font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer border border-zinc-700"
            >
              <Plus className="w-4 h-4 text-[#FFE600]" />
              <span>Aggiungi Manuale</span>
            </button>

            <button
              onClick={loadPosts}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFE600] hover:bg-[#ebd400] text-zinc-950 font-barlow font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Ricarica Feed</span>
            </button>
          </div>
        </div>

        {/* Guida Rapida Make.com */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-inter text-zinc-300">
          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Passo 1</span>
            <p className="font-semibold text-white">Trigger Make.com</p>
            <p className="text-zinc-400 text-[11px]">Modulo <strong>Instagram for Business ➔ Watch Media</strong> per rilevare ogni nuovo post.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Passo 2</span>
            <p className="font-semibold text-white">Azione Firestore</p>
            <p className="text-zinc-400 text-[11px]">Modulo <strong>Cloud Firestore ➔ Create a Document</strong> nella collezione <code className="text-[#FFE600] font-mono">instagram_posts</code>.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Passo 3</span>
            <p className="font-semibold text-white">Pubblicazione a 0ms</p>
            <p className="text-zinc-400 text-[11px]">Il sito legge i dati salvati istantaneamente senza rallentamenti.</p>
          </div>
        </div>
      </div>

      {/* Elenco Post Instagram */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-barlow font-bold text-lg uppercase tracking-wider text-white flex items-center gap-2">
            <span>Post nel Database</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400">
              {posts.length}
            </span>
          </h3>
          <span className="text-xs font-mono text-zinc-500">
            {posts.filter(p => p.visibile !== false).length} visibili sul sito
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-64 bg-zinc-900 rounded-2xl border border-zinc-800" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-zinc-950/60 border border-zinc-800 rounded-2xl">
            <Instagram className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-400 font-barlow font-bold uppercase text-sm">Nessun post Instagram registrato</p>
            <p className="text-zinc-600 text-xs mt-1">Puoi collegare Make.com oppure inserire un post manuale</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map(post => {
              const isVisibile = post.visibile !== false;
              const isVideo = post.media_type === 'VIDEO';
              const isCarousel = post.media_type === 'CAROUSEL_ALBUM';

              return (
                <div 
                  key={post.id} 
                  className={`bg-zinc-900/90 border rounded-2xl overflow-hidden transition-all flex flex-col ${
                    isVisibile ? 'border-zinc-800 hover:border-zinc-700' : 'border-red-900/40 opacity-60'
                  }`}
                >
                  {/* Foto Post */}
                  <div className="relative aspect-video sm:aspect-square w-full bg-zinc-950 overflow-hidden">
                    <img 
                      src={post.media_url || post.thumbnail_url} 
                      alt="Instagram Post" 
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {/* Badge tipo */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-white font-mono text-[10px] font-bold border border-white/10 flex items-center gap-1">
                        {isVideo && <Play className="w-2.5 h-2.5 fill-white" />}
                        {isCarousel && <Layers className="w-2.5 h-2.5" />}
                        {!isVideo && !isCarousel && <Instagram className="w-2.5 h-2.5 text-[#F77737]" />}
                        <span>{post.media_type || 'FOTO'}</span>
                      </span>
                    </div>

                    {/* Badge Visibilità */}
                    <div className="absolute top-2.5 right-2.5">
                      <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${
                        isVisibile 
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                          : 'bg-red-500/20 text-red-400 border-red-500/40'
                      }`}>
                        {isVisibile ? 'ONLINE' : 'NASCOSTO'}
                      </span>
                    </div>
                  </div>

                  {/* Testo Caption */}
                  <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
                    <div>
                      <p className="text-xs font-inter text-zinc-300 line-clamp-3 leading-relaxed">
                        {post.caption || <span className="text-zinc-600 italic">Nessuna didascalia</span>}
                      </p>
                      <p className="text-[10px] font-mono text-zinc-500 mt-2 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(post.timestamp || post.data_creazione || Date.now()).toLocaleString('it-IT')}</span>
                      </p>
                    </div>

                    {/* Azioni Admin */}
                    <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                      <a
                        href={post.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                        title="Apri su Instagram"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#F77737]" />
                        <span>Vedi su IG</span>
                      </a>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleVisibility(post.id, isVisibile)}
                          className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                            isVisibile
                              ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          }`}
                          title={isVisibile ? "Nascondi dal sito" : "Mostra sul sito"}
                        >
                          {isVisibile ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs transition-colors cursor-pointer"
                          title="Elimina dal database"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Inserimento Manuale */}
      {modalManualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#12131A] border border-zinc-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative">
            <h3 className="text-lg font-barlow font-black uppercase text-white mb-1 flex items-center gap-2">
              <Instagram className="w-5 h-5 text-[#F77737]" />
              <span>Aggiungi Post Instagram Manuale</span>
            </h3>
            <p className="text-xs font-inter text-zinc-400 mb-5">
              Inserisci i dettagli del post o del reel per mostrarlo sul sito senza attendere Make.com.
            </p>

            <form onSubmit={handleSaveManual} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5 font-bold">
                  URL Immagine / Copertina HD *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={form.media_url}
                  onChange={e => setForm(prev => ({ ...prev, media_url: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFE600]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5 font-bold">
                  Link Diretto Post Instagram
                </label>
                <input
                  type="url"
                  placeholder="https://www.instagram.com/p/..."
                  value={form.permalink}
                  onChange={e => setForm(prev => ({ ...prev, permalink: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFE600]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5 font-bold">
                    Tipologia Media
                  </label>
                  <select
                    value={form.media_type}
                    onChange={e => setForm(prev => ({ ...prev, media_type: e.target.value as any }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFE600]"
                  >
                    <option value="IMAGE">Foto Singola</option>
                    <option value="VIDEO">Reel / Video</option>
                    <option value="CAROUSEL_ALBUM">Album / Carosello</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5 font-bold">
                    Data Pubblicazione
                  </label>
                  <input
                    type="datetime-local"
                    value={form.timestamp.slice(0, 16)}
                    onChange={e => setForm(prev => ({ ...prev, timestamp: new Date(e.target.value).toISOString() }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFE600]"
                  >
                  </input>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5 font-bold">
                  Didascalia / Testo del Post
                </label>
                <textarea
                  rows={3}
                  placeholder="Scrivi o incolla il testo con gli hashtag..."
                  value={form.caption}
                  onChange={e => setForm(prev => ({ ...prev, caption: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFE600]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalManualOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-barlow font-bold text-xs uppercase cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FFE600] hover:bg-[#ebd400] text-zinc-950 font-barlow font-black text-xs uppercase tracking-wider cursor-pointer shadow-md"
                >
                  Salva nel Feed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabInstagram;
