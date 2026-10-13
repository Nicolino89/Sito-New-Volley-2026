import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  Undo, 
  Upload, 
  Award, 
  Briefcase,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Camera,
  Loader2
} from 'lucide-react';
import { 
  db, 
  isDemoMode,
  caricaBlobSuStorage
} from '../../../firebase-societa';
import { compressImage, IMAGE_PRESETS } from '../../../utils/imageCompressor';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';

export interface StaffProfilo {
  id: string;
  nomeCognome: string;
  qualificaTecnica?: string;
  palmares?: string;
  foto: {
    url: string;
    positionY: number;
    positionX?: number;
  };
  storicoCarriera?: Array<{
    anno: string;
    societa: string;
    ruolo: string;
    risultato?: string;
  }>;
}

interface TabStaffProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  caricaFileSuStorage: (file: File, path: string) => Promise<string>;
}

export default function TabStaff({
  showToast,
  caricaFileSuStorage
}: TabStaffProps) {
  const [staffList, setStaffList] = useState<StaffProfilo[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [staffForm, setStaffForm] = useState<Omit<StaffProfilo, 'id'>>({
    nomeCognome: '',
    qualificaTecnica: '',
    palmares: '',
    foto: { url: '', positionY: 50, positionX: 50 },
    storicoCarriera: []
  });

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [quickUploadingId, setQuickUploadingId] = useState<string | null>(null);

  const loadStaff = async () => {
    try {
      setLoading(true);
      if (isDemoMode) {
        setStaffList([
          {
            id: 'staff_1',
            nomeCognome: 'Silvia Marchetti',
            qualificaTecnica: '3° Grado FIPAV, Docente Federale',
            palmares: 'Promozione Serie C (2024), Titolo Regionale U18',
            foto: { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&q=80', positionY: 30, positionX: 50 },
            storicoCarriera: [
              { anno: '2024/2026', societa: 'New Volley Academy', ruolo: '1° Allenatore Serie D Femminile' },
              { anno: '2022/2024', societa: 'Volley Forlì', ruolo: '1° Allenatore Serie C' }
            ]
          }
        ]);
        return;
      }

      const snap = await getDocs(collection(db, 'staff_profili'));
      const list: StaffProfilo[] = [];
      snap.forEach(d => {
        const data = d.data();
        list.push({
          id: d.id,
          nomeCognome: data.nomeCognome || '',
          qualificaTecnica: data.qualificaTecnica || '',
          palmares: data.palmares || '',
          foto: data.foto || { url: '', positionY: 50, positionX: 50 },
          storicoCarriera: data.storicoCarriera || []
        });
      });
      setStaffList(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.nomeCognome.trim()) {
      showToast("Il Nome e Cognome è obbligatorio!", "error");
      return;
    }

    try {
      if (editingId) {
        setStaffList(prev => prev.map(s => s.id === editingId ? { ...s, ...staffForm, id: editingId } : s));
        if (!isDemoMode) {
          await updateDoc(doc(db, 'staff_profili', editingId), staffForm as any);
        }
        showToast("Profilo staff aggiornato!", "success");
      } else {
        const tempId = `staff_${Date.now()}`;
        const newStaff = { id: tempId, ...staffForm };
        setStaffList(prev => [newStaff, ...prev]);
        if (!isDemoMode) {
          const docRef = await addDoc(collection(db, 'staff_profili'), staffForm);
          setStaffList(prev => prev.map(s => s.id === tempId ? { ...s, id: docRef.id } : s));
        }
        showToast("Nuovo profilo staff inserito!", "success");
      }

      setEditingId(null);
      setStaffForm({
        nomeCognome: '',
        qualificaTecnica: '',
        palmares: '',
        foto: { url: '', positionY: 50, positionX: 50 },
        storicoCarriera: []
      });
    } catch (err) {
      console.error(err);
      showToast("Errore durante il salvataggio dello staff.", "error");
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      showToast("Ottimizzazione e caricamento foto...", "info");
      let url = '';
      try {
        const compResult = await compressImage(file, IMAGE_PRESETS.ATLETA);
        url = await caricaBlobSuStorage(compResult.blob, `staff/${Date.now()}_foto.webp`);
      } catch (compErr) {
        url = await caricaFileSuStorage(file, `staff/${Date.now()}_${file.name}`);
      }
      setStaffForm(prev => ({ ...prev, foto: { ...prev.foto, url } }));
      showToast("Foto caricata con successo!", "success");
    } catch (e) {
      showToast("Errore nel caricamento della foto.", "error");
    }
  };

  const handleQuickPhotoUpload = async (id: string, file: File, nomeCognome: string) => {
    try {
      setQuickUploadingId(id);
      showToast(`Ottimizzazione e caricamento foto per ${nomeCognome}...`, "info");
      let url = '';
      try {
        const compResult = await compressImage(file, IMAGE_PRESETS.ATLETA);
        url = await caricaBlobSuStorage(compResult.blob, `staff/${Date.now()}_${nomeCognome.replace(/\s+/g, '_')}.webp`);
      } catch (compErr) {
        url = await caricaFileSuStorage(file, `staff/${Date.now()}_${file.name}`);
      }
      setStaffList(prev => prev.map(s => s.id === id ? {
        ...s,
        foto: { ...(s.foto || { positionY: 50, positionX: 50 }), url }
      } : s));
      if (!isDemoMode) {
        await updateDoc(doc(db, 'staff_profili', id), {
          'foto.url': url
        });
      }
      showToast(`Foto di ${nomeCognome} aggiornata con successo!`, "success");
    } catch (e) {
      showToast("Errore nel caricamento della foto.", "error");
    } finally {
      setQuickUploadingId(null);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    try {
      if (!isDemoMode) {
        await deleteDoc(doc(db, 'staff_profili', id));
      }
      showToast("Profilo staff eliminato!", "success");
      setDeletingId(null);
      await loadStaff();
    } catch (e) {
      showToast("Errore durante l'eliminazione.", "error");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-xs" id="admin-tab-staff">
      
      {/* Create / Edit Form */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
          <h3 className="text-md font-extrabold text-slate-900 uppercase tracking-wider font-sport italic flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-500" />
            {editingId ? `MODIFICA PROFILO STAFF: ${staffForm.nomeCognome}` : '+ CREA NUOVO PROFILO STAFF / COACH'}
          </h3>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setStaffForm({
                  nomeCognome: '',
                  qualificaTecnica: '',
                  palmares: '',
                  foto: { url: '', positionY: 50, positionX: 50 },
                  storicoCarriera: []
                });
              }}
              className="text-slate-500 hover:text-slate-900 flex items-center gap-1 font-mono"
            >
              <Undo className="w-3.5 h-3.5" /> Annulla Modifica
            </button>
          )}
        </div>

        <form onSubmit={handleSaveStaff} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Nome e Cognome *</label>
              <input
                type="text"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                placeholder="es. Silvia Marchetti"
                value={staffForm.nomeCognome}
                onChange={e => setStaffForm({ ...staffForm, nomeCognome: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Qualifica Tecnica / Ruolo</label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-amber-500"
                placeholder="es. 3° Grado FIPAV, Docente Nazionale"
                value={staffForm.qualificaTecnica}
                onChange={e => setStaffForm({ ...staffForm, qualificaTecnica: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Palmarès & Riconoscimenti</label>
            <input
              type="text"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-amber-500"
              placeholder="es. Promozione Serie C 2024, Titolo Regionale U18"
              value={staffForm.palmares}
              onChange={e => setStaffForm({ ...staffForm, palmares: e.target.value })}
            />
          </div>

          {/* Photo & Vertical Focus */}
          <div className="space-y-2">
            <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Foto Staff</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl p-2 font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                placeholder="https://..."
                value={staffForm.foto.url}
                onChange={e => setStaffForm({ ...staffForm, foto: { ...staffForm.foto, url: e.target.value } })}
              />
              <label className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors">
                <Upload className="w-4 h-4 text-amber-400" /> Sfoglia Foto
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
              </label>
            </div>

            {staffForm.foto.url && (
              <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <img
                  src={staffForm.foto.url}
                  alt="Anteprima"
                  className="w-16 h-16 rounded-xl object-cover border border-slate-300"
                  style={{ objectPosition: `${staffForm.foto.positionX ?? 50}% ${staffForm.foto.positionY}%` }}
                />
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between font-mono text-[10px] text-slate-500 font-bold">
                    <span>Posizione Verticale: {staffForm.foto.positionY}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={staffForm.foto.positionY}
                    onChange={e => setStaffForm({ ...staffForm, foto: { ...staffForm.foto, positionY: parseInt(e.target.value, 10) } })}
                    className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2.5 rounded-xl text-xs uppercase font-sport tracking-wider italic skew-x-[-6deg] shadow cursor-pointer transition-all"
          >
            👤 Salva Profilo Staff
          </button>
        </form>
      </div>

      {/* Staff List */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
        <h3 className="text-md font-extrabold text-slate-900 uppercase tracking-wider font-sport italic border-b border-slate-200 pb-2">
          👥 Staff & Tecnici Registrati ({staffList.length})
        </h3>

        {loading ? (
          <div className="text-center py-6 text-slate-400 font-mono">Caricamento staff...</div>
        ) : staffList.length === 0 ? (
          <div className="text-center py-8 text-slate-400 font-mono">Nessun membro dello staff inserito.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {staffList.map(member => (
              <div key={member.id} className="bg-slate-50/50 border border-slate-200 p-4 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={member.foto?.url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300'}
                    alt={member.nomeCognome}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-300 shrink-0"
                    style={{ objectPosition: `${member.foto?.positionX ?? 50}% ${member.foto?.positionY ?? 50}%` }}
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-950 uppercase font-sport tracking-wide truncate">
                      {member.nomeCognome}
                    </h4>
                    <p className="text-[10px] text-slate-500 line-clamp-1">
                      {member.qualificaTecnica || 'Staff Tecnico'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <label
                    className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 p-2 rounded-xl transition-colors cursor-pointer inline-flex items-center justify-center"
                    title="Cambia foto rapida"
                  >
                    {quickUploadingId === member.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                    ) : (
                      <Camera className="w-4 h-4 text-amber-500" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={quickUploadingId === member.id}
                      className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) handleQuickPhotoUpload(member.id, f, member.nomeCognome);
                      }}
                    />
                  </label>
                  <button
                    onClick={() => {
                      setEditingId(member.id);
                      setStaffForm({
                        nomeCognome: member.nomeCognome,
                        qualificaTecnica: member.qualificaTecnica || '',
                        palmares: member.palmares || '',
                        foto: member.foto || { url: '', positionY: 50, positionX: 50 },
                        storicoCarriera: member.storicoCarriera || []
                      });
                    }}
                    className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 p-2 rounded-xl transition-colors cursor-pointer"
                    title="Modifica staff"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {deletingId === member.id ? (
                    <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl text-xs animate-pulse">
                      <span className="text-rose-700 font-semibold select-none text-[11px]">Eliminare?</span>
                      <button
                        onClick={() => handleDeleteStaff(member.id)}
                        className="bg-rose-600 hover:bg-rose-700 text-white px-2 py-0.5 rounded font-bold text-xs cursor-pointer"
                      >
                        SÌ
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-0.5 rounded font-bold text-xs cursor-pointer"
                      >
                        NO
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(member.id)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 p-2 rounded-xl transition-colors cursor-pointer"
                      title="Elimina staff"
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

    </div>
  );
}
