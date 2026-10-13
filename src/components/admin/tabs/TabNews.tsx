import React, { useState } from 'react';
import { 
  Plus, 
  Newspaper, 
  Edit3, 
  Trash2, 
  Save, 
  Undo, 
  Check, 
  Search, 
  Clock, 
  Share2, 
  Sparkles, 
  Upload, 
  CheckCircle,
  Eye,
  EyeOff,
  X,
  Image as ImageIcon,
  Instagram
} from 'lucide-react';
import { 
  NewsBlog, 
  RosaSquadra, 
  addNewsConSocialTrigger, 
  aggiornaElementoCompleto, 
  eliminaElemento,
  caricaBlobSuStorage
} from '../../../firebase-societa';
import { compressImage, IMAGE_PRESETS } from '../../../utils/imageCompressor';
import SocialShareBar from '../../SocialShareBar';
import TabInstagram from './TabInstagram';

interface TabNewsProps {
  newsAll: NewsBlog[];
  squadreAll: RosaSquadra[];
  loadAllData: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  caricaFileSuStorage: (file: File, path: string) => Promise<string>;
}

export default function TabNews({
  newsAll,
  squadreAll,
  loadAllData,
  showToast,
  caricaFileSuStorage
}: TabNewsProps) {
  // Form state
  const [newsForm, setNewsForm] = useState({
    titolo: '',
    testo: '',
    foto_copertina_url: '',
    tag_categoria: 'Serie D' as NewsBlog['tag_categoria'],
    autore: 'Ufficio Stampa NVA',
    social_trigger: true,
    squadra_associata_id: ''
  });

  // Filters
  const [newsSearch, setNewsSearch] = useState('');
  const [newsCategoryFilter, setNewsCategoryFilter] = useState('Tutte');

  // Edit state
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [editingNewsData, setEditingNewsData] = useState<Partial<NewsBlog> | null>(null);
  const [deletingNewsId, setDeletingNewsId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [subTab, setSubTab] = useState<"articoli" | "instagram">("articoli");

  // Filtered news
  const displayedNews = newsAll.filter(item => {
    const matchSearch = (item.titolo || '').toLowerCase().includes(newsSearch.toLowerCase()) || 
                        (item.testo || '').toLowerCase().includes(newsSearch.toLowerCase());
    const matchCategory = newsCategoryFilter === 'Tutte' || item.tag_categoria === newsCategoryFilter;
    return matchSearch && matchCategory;
  });

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsForm.titolo.trim() || !newsForm.testo.trim()) {
      showToast("Titolo e Testo della news sono obbligatori!", "error");
      return;
    }

    try {
      showToast("Pubblicazione articolo in corso...", "info");
      await addNewsConSocialTrigger({
        titolo: newsForm.titolo.trim(),
        testo: newsForm.testo.trim(),
        foto_copertina_url: newsForm.foto_copertina_url.trim() || 'https://images.unsplash.com/photo-1592656094267-764a45157575?w=1200&q=80',
        tag_categoria: newsForm.tag_categoria,
        autore: newsForm.autore.trim() || 'Ufficio Stampa NVA',
        squadra_associata_id: newsForm.squadra_associata_id.trim() || undefined,
        stato_pubblicazione: 'pubblicato',
        social_trigger: {
          attivo: newsForm.social_trigger,
          stato_pubblicazione: 'completata'
        }
      });

      showToast(`News creata con successo! ${newsForm.social_trigger ? 'Trigger social abilitato.' : ''}`, "success");
      setNewsForm({
        titolo: '',
        testo: '',
        foto_copertina_url: '',
        tag_categoria: 'Serie D',
        autore: 'Ufficio Stampa NVA',
        social_trigger: true,
        squadra_associata_id: ''
      });
      await loadAllData();
    } catch (e) {
      console.error("Errore creazione news:", e);
      showToast("Errore durante la creazione della news.", "error");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingNewsId || !editingNewsData) return;
    try {
      await aggiornaElementoCompleto('news_blog', editingNewsId, {
        ...editingNewsData,
        stato_pubblicazione: editingNewsData.stato_pubblicazione || 'pubblicato'
      });
      showToast("Articolo aggiornato con successo!", "success");
      setEditingNewsId(null);
      setEditingNewsData(null);
      await loadAllData();
    } catch (e) {
      console.error("Errore modifica news:", e);
      showToast("Errore durante l'aggiornamento.", "error");
    }
  };

  const handleDeleteNews = async (id: string) => {
    try {
      await eliminaElemento('news_blog', id);
      showToast("News eliminata con successo!", "success");
      setDeletingNewsId(null);
      await loadAllData();
    } catch (e) {
      console.error("Errore eliminazione news:", e);
      showToast("Errore durante l'eliminazione.", "error");
    }
  };

  const handleFileUpload = async (file: File, isEdit: boolean) => {
    try {
      setIsUploading(true);
      showToast("Compressione e caricamento immagine...", "info");
      
      let url = '';
      try {
        const compResult = await compressImage(file, IMAGE_PRESETS.EVENTO_COVER);
        url = await caricaBlobSuStorage(compResult.blob, `news/foto_${Date.now()}.webp`);
      } catch (compErr) {
        console.warn("Fallback caricamento diretto:", compErr);
        url = await caricaFileSuStorage(file, `news/${Date.now()}_${file.name}`);
      }

      if (isEdit) {
        setEditingNewsData(prev => prev ? { ...prev, foto_copertina_url: url } : null);
      } else {
        setNewsForm(prev => ({ ...prev, foto_copertina_url: url }));
      }
      showToast("Immagine caricata con successo!", "success");
    } catch (e) {
      console.error("Errore upload file:", e);
      showToast("Errore nel caricamento dell'immagine.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-xs" id="admin-tab-news">
      
      {/* Sub-Tabs Navigazione News & Instagram */}
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <button
          type="button"
          onClick={() => setSubTab("articoli")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-barlow font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
            subTab === "articoli"
              ? "bg-[#FFE600] text-black shadow-md shadow-[#FFE600]/20 font-black"
              : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>Articoli & Comunicati ({newsAll.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("instagram")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-barlow font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
            subTab === "instagram"
              ? "bg-gradient-to-r from-[#D62976] to-[#FA7E1E] text-white shadow-md font-black"
              : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
          }`}
        >
          <Instagram className="w-4 h-4 text-[#FA7E1E]" />
          <span>Feed Instagram Live</span>
        </button>
      </div>

      {subTab === "instagram" ? (
        <TabInstagram showToast={showToast} />
      ) : (
        <>
      
      {/* Inline Editor Modal */}
      {editingNewsId && editingNewsData && (
        <div className="bg-white border-2 border-amber-500/50 p-6 rounded-2xl space-y-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-200 pb-3">
            <h4 className="text-sm font-black text-amber-600 uppercase tracking-wider font-sport italic">✍️ Modifica Articolo</h4>
            <button 
              onClick={() => { setEditingNewsId(null); setEditingNewsData(null); }} 
              className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-mono cursor-pointer"
            >
              <Undo className="w-3.5 h-3.5" /> Annulla
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-slate-500 font-mono uppercase font-bold">Titolo News *</label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:border-amber-500"
                value={editingNewsData.titolo || ''}
                onChange={e => setEditingNewsData(prev => prev ? { ...prev, titolo: e.target.value } : null)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] text-slate-500 font-mono uppercase font-bold">Autore *</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-amber-500"
                  value={editingNewsData.autore || ''}
                  onChange={e => setEditingNewsData(prev => prev ? { ...prev, autore: e.target.value } : null)}
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-mono uppercase font-bold">Categoria *</label>
                <select
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                  value={editingNewsData.tag_categoria || 'Serie D'}
                  onChange={e => setEditingNewsData(prev => prev ? { ...prev, tag_categoria: e.target.value as any } : null)}
                >
                  <option value="Serie D">Serie D</option>
                  <option value="Prima Divisione">Prima Divisione</option>
                  <option value="Giovanili">Giovanili</option>
                  <option value="Comunicato Ufficiale">Comunicato Ufficiale</option>
                  <option value="Eventi">Eventi</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-mono uppercase font-bold">Squadra Associata</label>
                <select
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer"
                  value={editingNewsData.squadra_associata_id || ''}
                  onChange={e => setEditingNewsData(prev => prev ? { ...prev, squadra_associata_id: e.target.value } : null)}
                >
                  <option value="">Generale / Tutta la società</option>
                  {squadreAll.map(sq => (
                    <option key={sq.id} value={sq.id}>{sq.nome_squadra}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-mono uppercase font-bold">URL Foto Copertina</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-amber-500 font-mono text-xs"
                  placeholder="https://..."
                  value={editingNewsData.foto_copertina_url || ''}
                  onChange={e => setEditingNewsData(prev => prev ? { ...prev, foto_copertina_url: e.target.value } : null)}
                />
                <label className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-amber-400" /> Sfoglia
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, true);
                    }}
                  />
                </label>
              </div>
              {editingNewsData.foto_copertina_url && (
                <div className="mt-2 relative w-24 h-16 rounded-lg overflow-hidden border border-slate-300">
                  <img src={editingNewsData.foto_copertina_url} alt="Anteprima" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setEditingNewsData(prev => prev ? { ...prev, foto_copertina_url: '' } : null)}
                    className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-mono uppercase font-bold">Testo Articolo *</label>
              <textarea
                rows={5}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 leading-relaxed focus:outline-none focus:border-amber-500"
                value={editingNewsData.testo || ''}
                onChange={e => setEditingNewsData(prev => prev ? { ...prev, testo: e.target.value } : null)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => { setEditingNewsId(null); setEditingNewsData(null); }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold uppercase cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={handleSaveEdit}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-2 rounded-xl uppercase font-sport italic skew-x-[-6deg] shadow cursor-pointer"
              >
                Salva Modifiche
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW ARTICLE FORM */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-500" />
            <h3 className="text-md font-extrabold text-slate-900 uppercase tracking-wider font-sport italic">
              Pubblica Nuovo Articolo o Comunicato
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <input
                type="checkbox"
                checked={newsForm.social_trigger}
                onChange={e => setNewsForm(prev => ({ ...prev, social_trigger: e.target.checked }))}
                className="w-4 h-4 text-amber-500 accent-amber-500 rounded cursor-pointer"
              />
              <span className="text-[11px] font-bold text-slate-700 font-sport uppercase tracking-wider flex items-center gap-1">
                <Share2 className="w-3 h-3 text-amber-500" /> Auto-Social (FB / IG)
              </span>
            </label>
          </div>
        </div>

        <form onSubmit={handleCreateNews} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Titolo Articolo *</label>
              <input
                required
                type="text"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-amber-500"
                placeholder="es. Vittoria al tie-break per la Serie D Maschile!"
                value={newsForm.titolo}
                onChange={e => setNewsForm(prev => ({ ...prev, titolo: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Categoria News *</label>
              <select
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                value={newsForm.tag_categoria}
                onChange={e => setNewsForm(prev => ({ ...prev, tag_categoria: e.target.value as any }))}
              >
                <option value="Serie D">Serie D</option>
                <option value="Prima Divisione">Prima Divisione</option>
                <option value="Giovanili">Giovanili</option>
                <option value="Comunicato Ufficiale">Comunicato Ufficiale</option>
                <option value="Eventi">Eventi</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Autore / Firma</label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                value={newsForm.autore}
                onChange={e => setNewsForm(prev => ({ ...prev, autore: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Squadra Associata (Opzionale)</label>
              <select
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer"
                value={newsForm.squadra_associata_id}
                onChange={e => setNewsForm(prev => ({ ...prev, squadra_associata_id: e.target.value }))}
              >
                <option value="">Generale / Tutta la società</option>
                {squadreAll.map(sq => (
                  <option key={sq.id} value={sq.id}>{sq.nome_squadra}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Foto di Copertina</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-amber-500 text-xs"
                placeholder="https://..."
                value={newsForm.foto_copertina_url}
                onChange={e => setNewsForm(prev => ({ ...prev, foto_copertina_url: e.target.value }))}
              />
              <label className={`bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors ${
                isUploading ? 'opacity-50 pointer-events-none' : ''
              }`}>
                <Upload className="w-4 h-4 text-amber-400" /> {isUploading ? 'Caricamento...' : 'Sfoglia Foto'}
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploading}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, false);
                  }}
                />
              </label>
            </div>

            {/* Thumbnail Preview */}
            {newsForm.foto_copertina_url && (
              <div className="mt-2 flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 w-fit">
                <img 
                  src={newsForm.foto_copertina_url} 
                  alt="Anteprima" 
                  className="w-16 h-12 object-cover rounded-lg border border-slate-300" 
                />
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-slate-800 block">Foto caricata</span>
                  <button
                    type="button"
                    onClick={() => setNewsForm(prev => ({ ...prev, foto_copertina_url: '' }))}
                    className="text-[10px] text-rose-600 hover:text-rose-800 font-bold uppercase underline cursor-pointer"
                  >
                    Rimuovi foto
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Contenuto dell'Articolo *</label>
            <textarea
              required
              rows={4}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 leading-relaxed focus:outline-none focus:border-amber-500"
              placeholder="Scrivi qui il comunicato o il riassunto del match..."
              value={newsForm.testo}
              onChange={e => setNewsForm(prev => ({ ...prev, testo: e.target.value }))}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2.5 rounded-xl text-xs uppercase font-sport tracking-wider italic skew-x-[-6deg] shadow cursor-pointer transition-all"
          >
            📰 Pubblica Articolo nel Portale
          </button>
        </form>
      </div>

      {/* NEWS LIST WITH SEARCH & FILTERS */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-md font-extrabold text-slate-900 uppercase tracking-wider font-sport italic">
              📰 Archivio Notizie Pubblicate ({displayedNews.length})
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Gestisci tutti gli articoli visibili ai tifosi.</p>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cerca news..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                value={newsSearch}
                onChange={e => setNewsSearch(e.target.value)}
              />
            </div>

            <select
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
              value={newsCategoryFilter}
              onChange={e => setNewsCategoryFilter(e.target.value)}
            >
              <option value="Tutte">Tutte le Categorie</option>
              <option value="Serie D">Serie D</option>
              <option value="Prima Divisione">Prima Divisione</option>
              <option value="Giovanili">Giovanili</option>
              <option value="Comunicato Ufficiale">Comunicato Ufficiale</option>
              <option value="Eventi">Eventi</option>
            </select>
          </div>
        </div>

        {displayedNews.length === 0 ? (
          <div className="text-center py-10 text-slate-400 font-mono">
            Nessuna notizia corrisponde ai criteri di ricerca.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {displayedNews.map(item => (
              <div
                key={item.id}
                className="bg-slate-50/50 border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-300 transition-colors"
              >
                {/* News Thumbnail & Info */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <img
                    src={item.foto_copertina_url}
                    alt={item.titolo}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 bg-white"
                  />
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-slate-900 text-amber-400 font-mono font-bold text-[9px] px-2 py-0.5 rounded uppercase">
                        {item.tag_categoria}
                      </span>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded font-mono ${
                        item.stato_pubblicazione === 'bozza' 
                          ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.stato_pubblicazione === 'bozza' ? 'Bozza' : 'Pubblicato'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        📅 {new Date(item.data_pubblicazione).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-950 truncate font-sport uppercase tracking-wide">
                      {item.titolo}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {item.testo}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <SocialShareBar article={item} layout="compact" showLabel={false} />

                  <button
                    onClick={() => {
                      setEditingNewsId(item.id);
                      setEditingNewsData(item);
                    }}
                    className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 p-2 rounded-xl transition-colors cursor-pointer"
                    title="Modifica articolo"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {deletingNewsId === item.id ? (
                    <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl text-xs animate-pulse">
                      <span className="text-rose-700 font-semibold select-none text-[11px]">Eliminare?</span>
                      <button
                        onClick={() => handleDeleteNews(item.id)}
                        className="bg-rose-600 hover:bg-rose-700 text-white px-2 py-0.5 rounded font-bold transition-all text-xs cursor-pointer"
                      >
                        SÌ
                      </button>
                      <button
                        onClick={() => setDeletingNewsId(null)}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-0.5 rounded font-bold transition-all text-xs cursor-pointer"
                      >
                        NO
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingNewsId(item.id)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 p-2 rounded-xl transition-colors cursor-pointer"
                      title="Elimina articolo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}

    </div>
  );
}
