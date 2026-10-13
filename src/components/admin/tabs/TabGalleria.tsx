import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Plus, 
  Trash2, 
  Edit3, 
  Upload, 
  Image as ImageIcon, 
  Heart, 
  Sparkles, 
  Star, 
  Loader2, 
  X, 
  Check, 
  Layers,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { db, isDemoMode, caricaBlobSuStorage } from '../../../firebase-societa';
import { compressImage, IMAGE_PRESETS } from '../../../utils/imageCompressor';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

export interface GalleriaFotoItem {
  id: string;
  titolo: string;
  squadra?: string;
  tagMood?: string;
  isScattoDelMese?: boolean;
  isHighlight?: boolean;
  ordine?: number;
  likes?: number;
  coverIndex?: number;
  fotos: Array<{
    url: string;
    caption?: string;
    focusY?: number;
  }>;
  createdAt?: string;
}

interface TabGalleriaProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  caricaFileSuStorage: (file: File, path: string) => Promise<string>;
}

export default function TabGalleria({ showToast, caricaFileSuStorage }: TabGalleriaProps) {
  const [galleriaFotoList, setGalleriaFotoList] = useState<GalleriaFotoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddingModal, setIsAddingModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [fotoForm, setFotoForm] = useState<Omit<GalleriaFotoItem, 'id'>>({
    titolo: '',
    squadra: 'Generale',
    tagMood: 'Esultanze & Grinta',
    isScattoDelMese: false,
    isHighlight: false,
    ordine: 1,
    coverIndex: 0,
    fotos: []
  });

  const loadGalleria = async () => {
    try {
      setLoading(true);
      if (isDemoMode) {
        setGalleriaFotoList([
          {
            id: 'gf_1',
            titolo: 'Vittoria Derby - Campionato Serie D',
            squadra: 'Serie D Maschile',
            tagMood: 'Esultanze & Grinta',
            isScattoDelMese: true,
            isHighlight: true,
            likes: 42,
            fotos: [
              { url: 'https://images.unsplash.com/photo-1592656094267-764a45157575?w=800&q=80', caption: 'Muro decisivo nel finale di tie-break' }
            ]
          }
        ]);
        return;
      }

      const snap = await getDocs(collection(db, 'galleria_foto'));
      const list: GalleriaFotoItem[] = [];
      snap.forEach(d => {
        const data = d.data();
        list.push({
          id: d.id,
          titolo: data.titolo || '',
          squadra: data.squadra || 'Generale',
          tagMood: data.tagMood || 'Esultanze & Grinta',
          isScattoDelMese: !!data.isScattoDelMese,
          isHighlight: !!data.isHighlight,
          ordine: data.ordine || 0,
          likes: data.likes || 0,
          coverIndex: data.coverIndex || 0,
          fotos: data.fotos || []
        });
      });
      setGalleriaFotoList(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGalleria();
  }, []);

  const handleSaveAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fotoForm.titolo.trim() || fotoForm.fotos.length === 0) {
      showToast("Inserisci un titolo e almeno una fotografia!", "error");
      return;
    }

    try {
      if (editingId) {
        if (!isDemoMode) {
          await updateDoc(doc(db, 'galleria_foto', editingId), fotoForm as any);
        }
        showToast("Album aggiornato con successo!", "success");
      } else {
        if (!isDemoMode) {
          await addDoc(collection(db, 'galleria_foto'), {
            ...fotoForm,
            likes: 0,
            createdAt: new Date().toISOString()
          });
        }
        showToast("Nuovo album fotografico pubblicato!", "success");
      }
      setIsAddingModal(false);
      setEditingId(null);
      setFotoForm({
        titolo: '',
        squadra: 'Generale',
        tagMood: 'Esultanze & Grinta',
        isScattoDelMese: false,
        isHighlight: false,
        ordine: 1,
        coverIndex: 0,
        fotos: []
      });
      await loadGalleria();
    } catch (err) {
      showToast("Errore nel salvataggio dell'album.", "error");
    }
  };

  const handleFileUpload = async (files: FileList) => {
    try {
      showToast(`Ottimizzazione e caricamento di ${files.length} foto...`, "info");
      const uploaded: Array<{ url: string; caption?: string }> = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let url = '';
        try {
          const compResult = await compressImage(file, IMAGE_PRESETS.EVENTO_COVER);
          url = await caricaBlobSuStorage(compResult.blob, `galleria/${Date.now()}_${i}.webp`);
        } catch (compErr) {
          url = await caricaFileSuStorage(file, `galleria/${Date.now()}_${file.name}`);
        }
        uploaded.push({ url, caption: '' });
      }
      setFotoForm(prev => ({ ...prev, fotos: [...prev.fotos, ...uploaded] }));
      showToast("Foto caricate con successo!", "success");
    } catch (e) {
      showToast("Errore nel caricamento delle foto.", "error");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs" id="admin-tab-galleria">
      
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-amber-500 font-extrabold text-xs uppercase tracking-wider font-sport italic">
              <Camera className="w-4 h-4" />
              <span>GESTIONE GALLERIA FOTO</span>
            </div>
            <h3 className="text-xl font-black italic tracking-tight text-slate-950 uppercase font-sport skew-x-[-6deg] mt-0.5">
              ARCHIVIO FOTOGRAFICO E IMMAGINI
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Carica nuovi scatti, imposta lo "Scatto del Mese" e gestisci gli album per i tifosi.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingId(null);
              setFotoForm({
                titolo: '',
                squadra: 'Generale',
                tagMood: 'Esultanze & Grinta',
                isScattoDelMese: false,
                isHighlight: false,
                ordine: galleriaFotoList.length + 1,
                coverIndex: 0,
                fotos: []
              });
              setIsAddingModal(true);
            }}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs uppercase font-sport tracking-wider italic skew-x-[-6deg] flex items-center gap-2 transition-all shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" /> + CARICA NUOVO ALBUM FOTO
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
            <p className="text-xs text-slate-500 font-extrabold uppercase font-sport">Album Totali</p>
            <p className="text-xl font-black text-slate-900 font-sport italic">{galleriaFotoList.length}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center">
            <p className="text-xs text-amber-800 font-extrabold uppercase font-sport">Scatto del Mese</p>
            <p className="text-xl font-black text-amber-700 font-sport italic">
              {galleriaFotoList.filter(f => f.isScattoDelMese).length > 0 ? "1 Attivo" : "Nessuno"}
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl text-center">
            <p className="text-xs text-purple-800 font-extrabold uppercase font-sport">In Evidenza</p>
            <p className="text-xl font-black text-purple-700 font-sport italic">
              {galleriaFotoList.filter(f => f.isHighlight).length} Album
            </p>
          </div>
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-center">
            <p className="text-xs text-rose-800 font-extrabold uppercase font-sport">Like Totali</p>
            <p className="text-xl font-black text-rose-700 font-sport italic">
              {galleriaFotoList.reduce((acc, f) => acc + (f.likes || 0), 0)} ❤️
            </p>
          </div>
        </div>
      </div>

      {/* Albums List */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
        <h4 className="text-xs font-black uppercase text-slate-700 font-sport italic tracking-wider border-b border-slate-200 pb-2">
          ELENCO ALBUM / EVENTI PUBBLICATI ({galleriaFotoList.length})
        </h4>

        {loading ? (
          <div className="py-12 text-center text-slate-400 font-mono">Caricamento galleria...</div>
        ) : galleriaFotoList.length === 0 ? (
          <div className="py-8 text-center text-slate-400 font-mono">Nessun album fotografico registrato.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {galleriaFotoList.map(album => (
              <div key={album.id} className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between">
                <div className="relative aspect-video bg-slate-900 overflow-hidden">
                  <img
                    src={album.fotos[album.coverIndex || 0]?.url || album.fotos[0]?.url || 'https://images.unsplash.com/photo-1592656094267-764a45157575?w=600'}
                    alt={album.titolo}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 flex gap-1">
                    {album.isScattoDelMese && (
                      <span className="bg-amber-500 text-black text-[9px] font-black px-2 py-0.5 rounded uppercase font-sport">
                        ⭐ Scatto Mese
                      </span>
                    )}
                    {album.isHighlight && (
                      <span className="bg-purple-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase font-sport">
                        In Evidenza
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-mono px-2 py-0.5 rounded">
                    📸 {album.fotos.length} foto
                  </div>
                </div>

                <div className="p-4 space-y-2 flex-1">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                    <span>{album.squadra}</span>
                    <span>{album.tagMood}</span>
                  </div>
                  <h4 className="font-black text-slate-900 font-sport uppercase tracking-tight text-sm line-clamp-1">
                    {album.titolo}
                  </h4>
                </div>

                <div className="p-3 bg-white border-t border-slate-200 flex justify-between items-center">
                  <span className="text-[11px] font-mono text-rose-600 font-bold">
                    ❤️ {album.likes || 0}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingId(album.id);
                        setFotoForm({
                          titolo: album.titolo,
                          squadra: album.squadra || 'Generale',
                          tagMood: album.tagMood || 'Esultanze & Grinta',
                          isScattoDelMese: !!album.isScattoDelMese,
                          isHighlight: !!album.isHighlight,
                          ordine: album.ordine || 1,
                          coverIndex: album.coverIndex || 0,
                          fotos: album.fotos || []
                        });
                        setIsAddingModal(true);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 p-2 rounded-xl text-slate-700 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`Eliminare l'album "${album.titolo}"?`)) {
                          if (!isDemoMode) {
                            await deleteDoc(doc(db, 'galleria_foto', album.id));
                          }
                          showToast("Album eliminato!", "success");
                          await loadGalleria();
                        }
                      }}
                      className="bg-rose-50 hover:bg-rose-100 p-2 rounded-xl text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Add / Edit Album */}
      {isAddingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-300 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-sport font-black uppercase text-slate-950">
                {editingId ? '✍️ Modifica Album Fotografico' : '📸 Carica Nuovo Album Fotografico'}
              </h3>
              <button onClick={() => setIsAddingModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAlbum} className="space-y-4">
              <div className="space-y-1">
                <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Titolo Album *</label>
                <input
                  type="text"
                  required
                  placeholder="es. Finale Campionato Serie D Femminile"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  value={fotoForm.titolo}
                  onChange={e => setFotoForm({ ...fotoForm, titolo: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Squadra</label>
                  <input
                    type="text"
                    placeholder="es. Serie D Femminile"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-amber-500"
                    value={fotoForm.squadra}
                    onChange={e => setFotoForm({ ...fotoForm, squadra: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Tag Mood</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:border-amber-500"
                    value={fotoForm.tagMood}
                    onChange={e => setFotoForm({ ...fotoForm, tagMood: e.target.value })}
                  >
                    <option value="Esultanze & Grinta">Esultanze & Grinta</option>
                    <option value="Azione in Campo">Azione in Campo</option>
                    <option value="Spogliatoio & Club">Spogliatoio & Club</option>
                    <option value="Premiazioni">Premiazioni</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fotoForm.isScattoDelMese}
                    onChange={e => setFotoForm({ ...fotoForm, isScattoDelMese: e.target.checked })}
                    className="rounded text-amber-500"
                  />
                  <span className="font-bold text-slate-900">⭐ Scatto del Mese</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fotoForm.isHighlight}
                    onChange={e => setFotoForm({ ...fotoForm, isHighlight: e.target.checked })}
                    className="rounded text-purple-600"
                  />
                  <span className="font-bold text-slate-900">✨ In Evidenza</span>
                </label>
              </div>

              {/* Upload photos */}
              <div className="space-y-2">
                <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Fotografie ({fotoForm.fotos.length})</label>
                <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50 transition-colors">
                  <Upload className="w-8 h-8 text-amber-500 mb-2" />
                  <span className="font-bold text-slate-900 text-xs">Trascina o seleziona le immagini dal dispositivo</span>
                  <span className="text-[10px] text-slate-400 font-mono mt-1">PNG, JPG, WebP fino a 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => {
                      if (e.target.files) handleFileUpload(e.target.files);
                    }}
                  />
                </label>

                {/* Thumbnails */}
                <div className="grid grid-cols-4 gap-2 pt-2">
                  {fotoForm.fotos.map((f, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                      <img src={f.url} alt="Foto" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFotoForm({ ...fotoForm, fotos: fotoForm.fotos.filter((_, i) => i !== idx) })}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddingModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold uppercase"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-6 py-2.5 rounded-xl uppercase font-sport italic skew-x-[-6deg] shadow cursor-pointer"
                >
                  💾 Salva Album
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
