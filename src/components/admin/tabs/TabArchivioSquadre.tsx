import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Upload, 
  Users, 
  Calendar, 
  Shield, 
  Search, 
  Sliders, 
  Check, 
  History,
  Archive,
  Star,
  Award,
  Crown,
  ChevronDown,
  UserCheck,
  Link as LinkIcon,
  Briefcase
} from 'lucide-react';
import { 
  SquadraStorica, 
  AtletaRosterStorico, 
  getStoricoSquadreAll, 
  saveStoricoSquadra, 
  deleteStoricoSquadra,
  RosaSquadra, 
  Giocatore,
  formatRuoloGiocatore,
  sortRosterStorico,
  db
} from '../../../firebase-societa';
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { compressImage, IMAGE_PRESETS } from '../../../utils/imageCompressor';

interface TabArchivioSquadreProps {
  squadreAll: RosaSquadra[];
  giocatoriAll: Giocatore[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  caricaFileSuStorage: (file: File, path: string) => Promise<string>;
}

export default function TabArchivioSquadre({
  squadreAll,
  giocatoriAll,
  showToast,
  caricaFileSuStorage
}: TabArchivioSquadreProps) {
  const [storicoList, setStoricoList] = useState<SquadraStorica[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroStagione, setFiltroStagione] = useState('TUTTE');

  // Elenco Allenatori e Staff censiti per cronostoria automatica
  const [staffList, setStaffList] = useState<Array<{ id: string; nomeCognome: string; qualificaTecnica?: string; fotoUrl?: string }>>([]);

  // Modal creazione / modifica
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Omit<SquadraStorica, 'id'>>({
    nome_squadra: '',
    stagione: '2023/2024',
    categoria: 'SERIE_D',
    foto_ufficiale_url: '',
    gallery_foto: [],
    fotoPositionY: 40,
    traguardo: '',
    note_storiche: '',
    allenatori: {
      primo: '',
      secondo: '',
      dirigente: ''
    },
    roster: []
  });

  // Modal conferma eliminazione
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Selettore rapido "Archivia da squadra in corso"
  const [selectedSquadraDaClonare, setSelectedSquadraDaClonare] = useState<string>('');

  useEffect(() => {
    caricaDati();
    loadStaffList();
  }, []);

  const loadStaffList = async () => {
    try {
      const snap = await getDocs(collection(db, 'staff_profili'));
      const list: Array<{ id: string; nomeCognome: string; qualificaTecnica?: string; fotoUrl?: string }> = [];
      snap.forEach(d => {
        const data = d.data();
        if (data.nomeCognome) {
          list.push({
            id: d.id,
            nomeCognome: data.nomeCognome,
            qualificaTecnica: data.qualificaTecnica || '',
            fotoUrl: data.foto?.url || data.fotoUrl || ''
          });
        }
      });
      setStaffList(list);
    } catch (err) {
      console.error("Errore caricamento staff per archivio:", err);
    }
  };

  const caricaDati = async () => {
    try {
      setLoading(true);
      const data = await getStoricoSquadreAll();
      setStoricoList(data);
    } catch (e) {
      console.error("Errore caricamento storico squadre:", e);
      showToast("Errore nel caricamento dell'archivio", "error");
    } finally {
      setLoading(false);
    }
  };

  const stagioniDisponibili = useMemo(() => {
    const set = new Set<string>();
    storicoList.forEach(s => {
      if (s.stagione) set.add(s.stagione.trim());
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [storicoList]);

  const filteredList = useMemo(() => {
    return storicoList.filter(s => {
      if (filtroStagione !== 'TUTTE' && s.stagione !== filtroStagione) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const nomeM = (s.nome_squadra || '').toLowerCase().includes(q);
        const traguardoM = (s.traguardo || '').toLowerCase().includes(q);
        const coachM = (s.allenatori?.primo || '').toLowerCase().includes(q);
        if (!nomeM && !traguardoM && !coachM) return false;
      }
      return true;
    });
  }, [storicoList, filtroStagione, search]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setSelectedSquadraDaClonare('');
    setFormData({
      nome_squadra: '',
      stagione: '2023/2024',
      categoria: 'SERIE_D',
      foto_ufficiale_url: '',
      gallery_foto: [],
      fotoPositionY: 40,
      traguardo: '',
      note_storiche: '',
      allenatori: {
        primo: '',
        secondo: '',
        dirigente: ''
      },
      roster: [
        { nome: '', numero: 1, ruolo: 'Schiacciatore', capitano: true },
        { nome: '', numero: 2, ruolo: 'Palleggiatore' },
        { nome: '', numero: 3, ruolo: 'Centrale' }
      ]
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (squadra: SquadraStorica) => {
    setEditingId(squadra.id);
    setSelectedSquadraDaClonare('');
    setFormData({
      nome_squadra: squadra.nome_squadra,
      stagione: squadra.stagione,
      categoria: squadra.categoria,
      foto_ufficiale_url: squadra.foto_ufficiale_url,
      gallery_foto: squadra.gallery_foto ? [...squadra.gallery_foto] : [],
      fotoPositionY: squadra.fotoPositionY ?? 40,
      traguardo: squadra.traguardo || '',
      note_storiche: squadra.note_storiche || '',
      allenatori: {
        primo: squadra.allenatori?.primo || '',
        secondo: squadra.allenatori?.secondo || '',
        dirigente: squadra.allenatori?.dirigente || ''
      },
      roster: squadra.roster ? [...squadra.roster] : []
    });
    setModalOpen(true);
  };

  // Clona i dati da una squadra in corso
  const handleClonaDaSquadraInCorso = (squadraId: string) => {
    setSelectedSquadraDaClonare(squadraId);
    if (!squadraId) return;

    const sq = squadreAll.find(s => s.id === squadraId);
    if (!sq) return;

    // Costruisci roster partendo dai giocatori associati
    const rosterCostruito: AtletaRosterStorico[] = (sq.id_atleti || []).map((atletaId, idx) => {
      const g = giocatoriAll.find(x => x.id === atletaId);
      const isCapitano = sq.capitano_id === atletaId || idx === 0;
      return {
        id: atletaId,
        nome: g ? `${g.nome} ${g.cognome}` : `Atleta ${idx + 1}`,
        numero: g?.numero_maglia ?? (idx + 1),
        ruolo: g?.ruolo || 'Giocatore',
        capitano: isCapitano,
        giocatoreId: atletaId
      };
    });

    setFormData(prev => ({
      ...prev,
      nome_squadra: sq.nome_squadra,
      stagione: sq.stagione || prev.stagione,
      categoria: sq.category || 'SERIE_D',
      foto_ufficiale_url: sq.foto_copertina_url || prev.foto_ufficiale_url,
      fotoPositionY: sq.coverPositionY ?? 40,
      allenatori: {
        primo: sq.allenatori?.primo || '',
        secondo: sq.allenatori?.secondo || '',
        dirigente: sq.allenatori?.dirigente_accompagnatore || ''
      },
      roster: rosterCostruito.length > 0 ? sortRosterStorico(rosterCostruito) : prev.roster
    }));

    showToast(`Dati importati da "${sq.nome_squadra}"!`, "info");
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      const compressed = await compressImage(file, IMAGE_PRESETS.SQUAD_COVER);
      const compressedFile = new File([compressed.blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: "image/webp" });
      const path = `storico_squadre/foto_${Date.now()}_${file.name}`;
      const url = await caricaFileSuStorage(compressedFile, path);
      setFormData(prev => ({ ...prev, foto_ufficiale_url: url }));
      showToast("Foto ufficiale caricata con successo!", "success");
    } catch (err) {
      console.error("Errore upload foto squadra storica:", err);
      showToast("Errore durante il caricamento della foto", "error");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleUploadGalleryPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      const compressed = await compressImage(file, IMAGE_PRESETS.SQUAD_COVER);
      const compressedFile = new File([compressed.blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: "image/webp" });
      const path = `storico_squadre/gallery_${Date.now()}_${file.name}`;
      const url = await caricaFileSuStorage(compressedFile, path);
      setFormData(prev => ({
        ...prev,
        gallery_foto: [...(prev.gallery_foto || []), url]
      }));
      showToast("Foto aggiunta al carosello!", "success");
    } catch (err) {
      console.error("Errore upload foto gallery:", err);
      showToast("Errore durante il caricamento della foto per il carosello", "error");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemoveGalleryPhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      gallery_foto: (prev.gallery_foto || []).filter((_, i) => i !== index)
    }));
  };

  // Gestione Roster nel Form
  const handleAddRosterRow = () => {
    setFormData(prev => ({
      ...prev,
      roster: [
        ...prev.roster,
        { nome: '', numero: (prev.roster.length + 1), ruolo: 'Schiacciatore' }
      ]
    }));
  };

  const handleRemoveRosterRow = (index: number) => {
    setFormData(prev => ({
      ...prev,
      roster: prev.roster.filter((_, i) => i !== index)
    }));
  };

  const handleRosterChange = (index: number, field: keyof AtletaRosterStorico, val: any) => {
    setFormData(prev => {
      const updated = [...prev.roster];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, roster: updated };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome_squadra.trim()) {
      showToast("Inserisci il nome della squadra", "error");
      return;
    }
    if (!formData.stagione.trim()) {
      showToast("Inserisci la stagione sportiva", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      await saveStoricoSquadra(formData, editingId || undefined);

      // Sincronizza automaticamente la cronostoria degli allenatori in staff_profili
      const syncCoachHistory = async (coachName: string, roleLabel: string) => {
        if (!coachName || !coachName.trim()) return;
        const cTrimmed = coachName.trim().toLowerCase();
        const matched = staffList.find(s => s.nomeCognome.trim().toLowerCase() === cTrimmed);
        if (matched && matched.id) {
          try {
            const coachRef = doc(db, 'staff_profili', matched.id);
            const coachSnap = await getDoc(coachRef);
            if (coachSnap.exists()) {
              const data = coachSnap.data();
              const history: Array<any> = Array.isArray(data.storicoCarriera) ? [...data.storicoCarriera] : [];
              const exists = history.some(h => 
                h.anno === formData.stagione && 
                (h.ruolo || '').toLowerCase().includes(formData.nome_squadra.toLowerCase())
              );
              if (!exists) {
                history.unshift({
                  anno: formData.stagione,
                  societa: 'New Volley Academy',
                  ruolo: `${roleLabel} (${formData.nome_squadra})`,
                  risultato: formData.traguardo || '-'
                });
                await updateDoc(coachRef, { storicoCarriera: history });
              }
            }
          } catch (err) {
            console.warn("Errore sincronizzazione cronostoria coach:", err);
          }
        }
      };

      if (formData.allenatori?.primo) {
        await syncCoachHistory(formData.allenatori.primo, '1° Allenatore');
      }
      if (formData.allenatori?.secondo) {
        await syncCoachHistory(formData.allenatori.secondo, '2° Allenatore');
      }

      showToast(editingId ? "Formazione storica aggiornata e cronostoria staff collegata!" : "Formazione registrata e collegata alla cronostoria allenatori!", "success");
      setModalOpen(false);
      await caricaDati();
    } catch (err) {
      console.error("Errore salvataggio:", err);
      showToast("Errore durante il salvataggio", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteStoricoSquadra(id);
      showToast("Formazione rimossa dall'archivio", "info");
      setDeletingId(null);
      await caricaDati();
    } catch (err) {
      console.error("Errore eliminazione:", err);
      showToast("Errore durante l'eliminazione", "error");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER DELLA TAB ARCHIVIO STORICO */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-400/30 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-400/20 text-amber-800 text-[11px] font-mono font-bold uppercase tracking-wider mb-1.5">
            <History className="w-3.5 h-3.5 text-amber-600" />
            <span>Almanacco &amp; Memoria Storica</span>
          </div>
          <h2 className="text-xl font-bold font-barlow text-zinc-900 uppercase tracking-tight">
            Archivio Storico delle Squadre
          </h2>
          <p className="text-xs text-zinc-600 font-inter max-w-xl">
            Registra le formazioni delle annate passate con foto ufficiale di gruppo, traguardi raggiunti, staff tecnico e la rosa dei protagonisti dell'epoca.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs uppercase font-barlow tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nuova Formazione Storica</span>
        </button>
      </div>

      {/* BARRA RICERCA E FILTRI */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-50 p-3 rounded-2xl border border-zinc-200">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-zinc-500 uppercase font-bold">Stagione:</span>
          <button
            onClick={() => setFiltroStagione('TUTTE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
              filtroStagione === 'TUTTE'
                ? 'bg-amber-400 text-black shadow-sm'
                : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
            }`}
          >
            Tutte ({storicoList.length})
          </button>
          {stagioniDisponibili.map(st => (
            <button
              key={st}
              onClick={() => setFiltroStagione(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                filtroStagione === st
                  ? 'bg-amber-400 text-black shadow-sm'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cerca squadra o coach..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-amber-400 font-mono"
          />
        </div>
      </div>

      {/* LISTA DELLE FORMAZIONI STORICHE */}
      {loading ? (
        <div className="text-center py-12 text-zinc-400 text-xs font-mono">
          Caricamento formazioni storiche...
        </div>
      ) : filteredList.length === 0 ? (
        <div className="text-center py-16 bg-zinc-50 rounded-2xl border border-dashed border-zinc-300 p-6 space-y-3">
          <History className="w-10 h-10 text-zinc-400 mx-auto" />
          <p className="text-sm font-bold text-zinc-700 uppercase font-barlow">
            Nessuna squadra storica trovata
          </p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto font-inter">
            Puoi iniziare inserendo le formazioni delle stagioni passate cliccando sul pulsante in alto o clonando una squadra attuale.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-2 px-4 py-2 bg-amber-400 text-black font-bold text-xs uppercase font-barlow rounded-xl cursor-pointer"
          >
            Aggiungi la prima squadra
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredList.map(squadra => (
            <div 
              key={squadra.id}
              className="bg-white rounded-2xl border border-zinc-200 hover:border-amber-400 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Foto Anteprima con Badge */}
                <div className="relative aspect-[16/9] w-full bg-zinc-900 overflow-hidden">
                  <img
                    src={squadra.foto_ufficiale_url || "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&auto=format&fit=crop&q=80"}
                    alt={squadra.nome_squadra}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{
                      objectPosition: `50% ${squadra.fotoPositionY ?? 40}%`
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                  
                  {/* Badge Stagione */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/80 border border-amber-400/40 text-amber-300 font-mono text-[11px] font-bold">
                    #{squadra.stagione}
                  </span>

                  {/* Badge Categoria */}
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-zinc-800/90 text-zinc-200 font-mono text-[10px] font-bold uppercase">
                    {squadra.categoria}
                  </span>

                  {/* Traguardo */}
                  {squadra.traguardo && (
                    <div className="absolute bottom-2.5 inset-x-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-400/90 text-black font-barlow font-bold text-xs uppercase shadow">
                        <Trophy className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{squadra.traguardo}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Dati Formazione */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-barlow font-black text-lg text-zinc-900 uppercase leading-snug">
                      {squadra.nome_squadra}
                    </h3>
                    {squadra.allenatori?.primo && (
                      <p className="text-xs font-mono text-zinc-500">
                        1° Coach: <strong className="text-zinc-700">{squadra.allenatori.primo}</strong>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-zinc-500 border-t border-zinc-100 pt-2.5">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-amber-500" />
                      <span>{squadra.roster?.length || 0} Atleti registrati</span>
                    </span>
                    {squadra.note_storiche && (
                      <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">
                        Con cronistoria
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottoni Azione */}
              <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(squadra)}
                  className="p-2 rounded-lg bg-white border border-zinc-200 hover:border-amber-400 text-zinc-700 hover:text-black transition-colors cursor-pointer"
                  title="Modifica squadra storica"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeletingId(squadra.id)}
                  className="p-2 rounded-lg bg-white border border-zinc-200 hover:border-rose-400 text-zinc-700 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Elimina dall'archivio"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CREAZIONE / MODIFICA SQUADRA STORICA                                */}
      {/* ========================================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full shadow-2xl border border-zinc-200 my-auto sm:my-6 flex flex-col max-h-[92vh] overflow-hidden animate-fade-in">
            
            {/* Header Modal - Sticky in alto */}
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 bg-white sticky top-0 z-20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-800">
                  <History className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-barlow font-black text-xl text-zinc-900 uppercase">
                    {editingId ? "Modifica Formazione Storica" : "Nuova Formazione Storica"}
                  </h3>
                  <p className="text-xs text-zinc-500 font-inter">
                    Registrazione per l'almanacco ufficiale NVA
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                title="Chiudi form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form scrollabile con sticky footer */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto px-6 py-5 flex-1 space-y-6">
                
                {/* SELETTORE RAPIDO: CLONA DA SQUADRA IN CORSO (SE NON IN EDITING) */}
                {!editingId && squadreAll.length > 0 && (
                  <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-amber-900 uppercase font-barlow flex items-center gap-1.5">
                        <Archive className="w-4 h-4 text-amber-600" />
                        <span>Clona con 1 Click da Squadra in Corso</span>
                      </p>
                      <p className="text-[11px] text-amber-800 font-inter">
                        Precompila subito nome, foto, coach e atleti della rosa selezionata.
                      </p>
                    </div>
                    <select
                      value={selectedSquadraDaClonare}
                      onChange={e => handleClonaDaSquadraInCorso(e.target.value)}
                      className="bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-mono text-zinc-800 focus:outline-none font-bold"
                    >
                      <option value="">-- Seleziona una squadra --</option>
                      {squadreAll.map(sq => (
                        <option key={sq.id} value={sq.id}>
                          {sq.nome_squadra} ({sq.stagione || 'Stagione in corso'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              
              {/* RIGA 1: Nome Squadra, Stagione, Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                    Nome Squadra *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="es. Serie D Maschile"
                    value={formData.nome_squadra}
                    onChange={e => setFormData({ ...formData, nome_squadra: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                    Stagione Sportiva *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="es. 2023/2024"
                    value={formData.stagione}
                    onChange={e => setFormData({ ...formData, stagione: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={e => setFormData({ ...formData, categoria: e.target.value as any })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:border-amber-400"
                  >
                    <option value="SERIE_D">Serie D</option>
                    <option value="CAMPIONATI_SENIOR">Campionati Senior</option>
                    <option value="GIOVANILI">Settore Giovanile</option>
                  </select>
                </div>
              </div>

              {/* RIGA 2: FOTO UFFICIALE DI SQUADRA */}
              <div className="space-y-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold uppercase text-zinc-700">
                    Foto Ufficiale di Squadra (Panoramica)
                  </label>
                  <label className="bg-zinc-800 hover:bg-black text-white text-[11px] font-mono font-bold uppercase px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isUploadingPhoto ? "Caricamento..." : "Carica Foto"}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleUploadPhoto}
                      disabled={isUploadingPhoto}
                    />
                  </label>
                </div>

                {formData.foto_ufficiale_url ? (
                  <div className="space-y-2">
                    <div className="relative aspect-[16/9] w-full max-w-md mx-auto rounded-xl overflow-hidden border border-zinc-300 shadow">
                      <img
                        src={formData.foto_ufficiale_url}
                        alt="Anteprima foto squadra"
                        className="w-full h-full object-cover"
                        style={{
                          objectPosition: `50% ${formData.fotoPositionY ?? 40}%`
                        }}
                      />
                    </div>
                    {/* Centratura verticale Y */}
                    <div className="flex items-center gap-3 max-w-md mx-auto">
                      <Sliders className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="text-[11px] font-mono text-zinc-600 shrink-0">Centratura Y:</span>
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        value={formData.fotoPositionY ?? 40}
                        onChange={e => setFormData({ ...formData, fotoPositionY: Number(e.target.value) })}
                        className="w-full accent-amber-500"
                      />
                      <span className="text-[11px] font-mono text-zinc-600 shrink-0">{formData.fotoPositionY ?? 40}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 border-2 border-dashed border-zinc-300 rounded-xl text-zinc-400 text-xs font-mono">
                    Nessuna foto caricata. Verrà usato un placeholder predefinito.
                  </div>
                )}
              </div>

              {/* RIGA FOTO AGGIUNTIVE PER IL CAROSELLO */}
              <div className="space-y-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-mono font-bold uppercase text-zinc-700">
                      Foto Aggiuntive per il Carosello ({formData.gallery_foto?.length || 0})
                    </label>
                    <p className="text-[11px] text-zinc-500 font-inter">
                      Aggiungi altre foto della stagione (es. premiazione, festa, esultanze) per farle scorrere nel carosello.
                    </p>
                  </div>
                  <label className="bg-amber-400 hover:bg-amber-500 text-black text-[11px] font-mono font-bold uppercase px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors shadow-sm">
                    <Plus className="w-3.5 h-3.5 text-black" />
                    <span>Aggiungi Foto</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleUploadGalleryPhoto}
                      disabled={isUploadingPhoto}
                    />
                  </label>
                </div>

                {formData.gallery_foto && formData.gallery_foto.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    {formData.gallery_foto.map((url, idx) => (
                      <div key={idx} className="relative aspect-[16/9] rounded-xl overflow-hidden border border-zinc-300 shadow-sm group/thumb">
                        <img src={url} alt={`Foto carosello ${idx + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute top-1.5 left-1.5 bg-black/70 text-white font-mono text-[9px] px-1.5 py-0.5 rounded">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryPhoto(idx)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-md bg-rose-600 text-white opacity-80 hover:opacity-100 transition-opacity cursor-pointer shadow"
                          title="Rimuovi foto dal carosello"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] font-mono text-zinc-400 italic">
                    Nessuna foto aggiuntiva. Verrà mostrata solo la foto ufficiale principale.
                  </p>
                )}
              </div>

              {/* RIGA 3: Traguardo / Palmarès & Cronistoria */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                    Traguardo / Palmarès Raggiunto (Opzionale)
                  </label>
                  <input
                    type="text"
                    placeholder="es. Promozione Storica in Serie D & Campioni Regionali FIPAV"
                    value={formData.traguardo}
                    onChange={e => setFormData({ ...formData, traguardo: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                    La Cronistoria / Note Storiche dell'Annata (Opzionale)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Racconta come andò la stagione, partite memorabili, aneddoti o record..."
                    value={formData.note_storiche}
                    onChange={e => setFormData({ ...formData, note_storiche: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-amber-400 font-inter"
                  />
                </div>
              </div>

              {/* RIGA 4: STAFF TECNICO & CRONOSTORIA ALLENATORI */}
              <div className="space-y-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-mono font-bold uppercase text-zinc-700 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <span>Staff Tecnico dell'Epoca &amp; Cronostoria</span>
                    </label>
                    <p className="text-[11px] text-zinc-500 font-inter">
                      Collega gli allenatori dall'Anagrafica Staff per aggiornare automaticamente la loro carriera e i link interni.
                    </p>
                  </div>
                  {staffList.length > 0 && (
                    <span className="text-[10px] bg-amber-100/80 text-amber-800 px-2.5 py-1 rounded-lg font-mono font-bold flex items-center gap-1 w-fit">
                      <LinkIcon className="w-3 h-3 text-amber-600" />
                      <span>{staffList.length} Profili Staff Collegabili</span>
                    </span>
                  )}
                </div>

                {/* Datalist per autocompletamento veloce */}
                <datalist id="staff-allenatori-datalist">
                  {staffList.map(s => (
                    <option key={s.id} value={s.nomeCognome}>
                      {s.qualificaTecnica ? `${s.nomeCognome} (${s.qualificaTecnica})` : s.nomeCognome}
                    </option>
                  ))}
                </datalist>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 1° Allenatore */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-zinc-600 font-bold block">1° Allenatore</span>
                      {staffList.some(s => s.nomeCognome.trim().toLowerCase() === (formData.allenatori?.primo || '').trim().toLowerCase()) && (
                        <span className="text-[9px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-bold font-mono">
                          ✓ Collegato
                        </span>
                      )}
                    </div>

                    {/* Quick select dropdown */}
                    {staffList.length > 0 && (
                      <select
                        onChange={e => {
                          if (e.target.value) {
                            setFormData(prev => ({
                              ...prev,
                              allenatori: { ...prev.allenatori, primo: e.target.value }
                            }));
                          }
                        }}
                        className="w-full bg-amber-50/70 border border-amber-200 rounded-lg px-2 py-1 text-[11px] text-amber-900 font-mono cursor-pointer"
                        value=""
                      >
                        <option value="">⚡ Scegli da Staff...</option>
                        {staffList.map(s => (
                          <option key={s.id} value={s.nomeCognome}>
                            {s.nomeCognome} {s.qualificaTecnica ? `(${s.qualificaTecnica})` : ''}
                          </option>
                        ))}
                      </select>
                    )}

                    <input
                      type="text"
                      list="staff-allenatori-datalist"
                      placeholder="Nome 1° Coach"
                      value={formData.allenatori?.primo || ''}
                      onChange={e => setFormData({
                        ...formData,
                        allenatori: { ...formData.allenatori, primo: e.target.value }
                      })}
                      className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 font-medium"
                    />
                  </div>

                  {/* 2° Allenatore */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-zinc-600 font-bold block">2° Allenatore</span>
                      {staffList.some(s => s.nomeCognome.trim().toLowerCase() === (formData.allenatori?.secondo || '').trim().toLowerCase()) && (
                        <span className="text-[9px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-bold font-mono">
                          ✓ Collegato
                        </span>
                      )}
                    </div>

                    {/* Quick select dropdown */}
                    {staffList.length > 0 && (
                      <select
                        onChange={e => {
                          if (e.target.value) {
                            setFormData(prev => ({
                              ...prev,
                              allenatori: { ...prev.allenatori, secondo: e.target.value }
                            }));
                          }
                        }}
                        className="w-full bg-amber-50/70 border border-amber-200 rounded-lg px-2 py-1 text-[11px] text-amber-900 font-mono cursor-pointer"
                        value=""
                      >
                        <option value="">⚡ Scegli da Staff...</option>
                        {staffList.map(s => (
                          <option key={s.id} value={s.nomeCognome}>
                            {s.nomeCognome} {s.qualificaTecnica ? `(${s.qualificaTecnica})` : ''}
                          </option>
                        ))}
                      </select>
                    )}

                    <input
                      type="text"
                      list="staff-allenatori-datalist"
                      placeholder="Nome 2° Coach"
                      value={formData.allenatori?.secondo || ''}
                      onChange={e => setFormData({
                        ...formData,
                        allenatori: { ...formData.allenatori, secondo: e.target.value }
                      })}
                      className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 font-medium"
                    />
                  </div>

                  {/* Dirigente */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-zinc-600 font-bold block">Dirigente</span>
                    {staffList.length > 0 && (
                      <select
                        onChange={e => {
                          if (e.target.value) {
                            setFormData(prev => ({
                              ...prev,
                              allenatori: { ...prev.allenatori, dirigente: e.target.value }
                            }));
                          }
                        }}
                        className="w-full bg-amber-50/70 border border-amber-200 rounded-lg px-2 py-1 text-[11px] text-amber-900 font-mono cursor-pointer"
                        value=""
                      >
                        <option value="">⚡ Scegli da Staff...</option>
                        {staffList.map(s => (
                          <option key={s.id} value={s.nomeCognome}>
                            {s.nomeCognome}
                          </option>
                        ))}
                      </select>
                    )}
                    <input
                      type="text"
                      list="staff-allenatori-datalist"
                      placeholder="Nome Dirigente"
                      value={formData.allenatori?.dirigente || ''}
                      onChange={e => setFormData({
                        ...formData,
                        allenatori: { ...formData.allenatori, dirigente: e.target.value }
                      })}
                      className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* RIGA 5: ROSTER DEI PROTAGONISTI */}
              <div className="space-y-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-mono font-bold uppercase text-zinc-700 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-600" />
                      <span>Roster della Formazione ({formData.roster.length} Atleti)</span>
                    </label>
                    <p className="text-[11px] text-zinc-500 font-inter">
                      Inserisci atleti manuali o pesca velocemente da quelli già censiti in anagrafica societaria.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Selettore Rapido: Pesca da Atleti Registrati */}
                    {giocatoriAll.length > 0 && (
                      <select
                        className="bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold cursor-pointer shadow-sm"
                        defaultValue=""
                        onChange={(e) => {
                          const pId = e.target.value;
                          if (!pId) return;
                          const p = giocatoriAll.find(g => g.id === pId);
                          if (p) {
                            const formattedName = `${p.cognome} ${p.nome}`.trim();
                            setFormData(prev => ({
                              ...prev,
                              roster: [
                                ...prev.roster,
                                {
                                  nome: formattedName,
                                  numero: p.numero_maglia || (prev.roster.length + 1),
                                  ruolo: p.ruolo || 'Schiacciatore',
                                  giocatoreId: p.id,
                                  capitano: false
                                }
                              ]
                            }));
                            showToast(`Atleta "${formattedName}" aggiunto alla formazione!`, "success");
                          }
                          e.target.value = '';
                        }}
                      >
                        <option value="" disabled>+ Pesca da Atleti Registrati...</option>
                        {giocatoriAll
                          .slice()
                          .sort((a, b) => (a.cognome || '').localeCompare(b.cognome || ''))
                          .map(p => (
                            <option key={p.id} value={p.id}>
                              {p.cognome} {p.nome} {p.numero_maglia ? `(#${p.numero_maglia})` : ''} - {p.ruolo}
                            </option>
                          ))}
                      </select>
                    )}

                    <button
                      type="button"
                      onClick={handleAddRosterRow}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-black text-amber-300 hover:text-white font-mono text-[11px] font-bold uppercase flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Riga Vuota</span>
                    </button>
                  </div>
                </div>

                {/* Datalist per suggerimenti atleti */}
                <datalist id="atleti-registrati-datalist">
                  {giocatoriAll.map(p => (
                    <option key={p.id} value={`${p.cognome} ${p.nome}`.trim()}>
                      {p.ruolo} {p.numero_maglia ? `(#${p.numero_maglia})` : ''}
                    </option>
                  ))}
                </datalist>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {formData.roster.map((atleta, idx) => (
                    <div 
                      key={idx}
                      className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 bg-white rounded-xl border border-zinc-200 shadow-sm"
                    >
                      {/* Numero */}
                      <input
                        type="number"
                        placeholder="N°"
                        value={atleta.numero ?? ''}
                        onChange={e => handleRosterChange(idx, 'numero', e.target.value ? Number(e.target.value) : '')}
                        className="w-14 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-center"
                        title="Numero di Maglia"
                      />

                      {/* Nome e Cognome con Autocomplete Datalist */}
                      <input
                        type="text"
                        list="atleti-registrati-datalist"
                        placeholder="Nome e Cognome Atleta (o scegli da lista)"
                        value={atleta.nome}
                        onChange={e => {
                          const val = e.target.value;
                          const matched = giocatoriAll.find(g => 
                            `${g.cognome} ${g.nome}`.trim().toLowerCase() === val.trim().toLowerCase() ||
                            `${g.nome} ${g.cognome}`.trim().toLowerCase() === val.trim().toLowerCase()
                          );
                          setFormData(prev => {
                            const updated = [...prev.roster];
                            updated[idx] = {
                              ...updated[idx],
                              nome: val,
                              giocatoreId: matched ? matched.id : updated[idx].giocatoreId,
                              numero: matched && !updated[idx].numero ? matched.numero_maglia : updated[idx].numero,
                              ruolo: matched && (!updated[idx].ruolo || updated[idx].ruolo === 'Schiacciatore') ? matched.ruolo : updated[idx].ruolo
                            };
                            return { ...prev, roster: updated };
                          });
                        }}
                        className="flex-1 min-w-[160px] bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-900"
                      />

                      {/* Ruolo (Menu a tendina rapido) */}
                      <select
                        value={atleta.ruolo || ''}
                        onChange={e => handleRosterChange(idx, 'ruolo', e.target.value)}
                        className="w-36 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-medium text-zinc-800 cursor-pointer"
                        title="Ruolo in campo"
                      >
                        <option value="">-- Nessun Ruolo --</option>
                        <option value="Schiacciatore">Schiacciatore / Schiacciatrice</option>
                        <option value="Palleggiatore">Palleggiatore / Palleggiatrice</option>
                        <option value="Centrale">Centrale</option>
                        <option value="Opposto">Opposto / Opposta</option>
                        <option value="Libero">Libero</option>
                        <option value="Universale">Universale</option>
                        {atleta.ruolo && !['', 'Schiacciatore', 'Palleggiatore', 'Centrale', 'Opposto', 'Libero', 'Universale'].includes(atleta.ruolo) && (
                          <option value={atleta.ruolo}>{atleta.ruolo}</option>
                        )}
                      </select>

                      {/* Capitano */}
                      <button
                        type="button"
                        onClick={() => handleRosterChange(idx, 'capitano', !atleta.capitano)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                          atleta.capitano
                            ? 'bg-amber-400 border-amber-500 text-black shadow-sm'
                            : 'bg-zinc-100 border-zinc-200 text-zinc-400 hover:text-zinc-600'
                        }`}
                        title="Capitano della squadra"
                      >
                        <Crown className="w-4 h-4" />
                      </button>

                      {/* Rimuovi riga */}
                      <button
                        type="button"
                        onClick={() => handleRemoveRosterRow(idx)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer shrink-0"
                        title="Rimuovi atleta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottoni Footer Modal - Sticky in basso */}
              <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-zinc-200 bg-zinc-50 sticky bottom-0 z-20 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold uppercase text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs uppercase font-barlow tracking-wider px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? "Salvataggio..." : "Salva Formazione"}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL CONFERMA ELIMINAZIONE */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center border border-zinc-200">
            <Trash2 className="w-10 h-10 text-rose-500 mx-auto" />
            <h4 className="font-barlow font-bold text-lg text-zinc-900 uppercase">
              Confermi l'eliminazione?
            </h4>
            <p className="text-xs text-zinc-600 font-inter">
              Questa formazione verrà rimossa definitivamente dall'archivio storico delle Pantere.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md cursor-pointer"
              >
                Elimina Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
