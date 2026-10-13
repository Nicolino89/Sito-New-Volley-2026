import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Edit3, 
  Archive, 
  Upload, 
  FileText, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Users, 
  ExternalLink,
  X,
  AlertCircle,
  Camera,
  Download,
  Info,
  Layers,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Move,
  Eye
} from 'lucide-react';
import { 
  db, 
  isDemoMode, 
  EventoCampTorneo,
  getCampTorneiAll,
  addCampTorneo,
  updateCampTorneo,
  deleteCampTorneo,
  mapToUnifiedEvento,
  openPdfDocument
} from '../../../firebase-societa';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

interface TabCampTorneiProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  caricaFileSuStorage: (file: File, path: string) => Promise<string>;
}

export default function TabCampTornei({ showToast, caricaFileSuStorage }: TabCampTorneiProps) {
  const [eventiList, setEventiList] = useState<EventoCampTorneo[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'attivi' | 'storico'>('attivi');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingEvent, setSavingEvent] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryProgress, setGalleryProgress] = useState<{ current: number; total: number } | null>(null);

  // Form State
  const [eventForm, setEventForm] = useState<Omit<EventoCampTorneo, 'id'>>({
    tipo: 'CAMP',
    titolo: '',
    sottotitolo: '',
    descrizione: '',
    dataPeriodo: '',
    location: 'Palasport Forlì',
    locationDettaglio: 'Via Maroncelli 15, Forlì',
    stato: 'ATTIVO',
    visibilitaIscrizioni: 'APERTE',
    linkIscrizione: '',
    locandinaUrl: '',
    locandinaFit: 'contain',
    locandinaAltezza: 480,
    locandinaPositionY: 50,
    locandinaPositionX: 50,
    fotoGallery: [],
    pdfModuloCartaceoUrl: '',
    pdfModuloCartaceoNome: '',
    ordine: 1,
    camp: {
      staffTecnico: 'Staff Qualificato NVA',
      staffDettaglio: 'Allenatori Federali FIPAV',
      quotaIscrizione: '150€ / settimana',
      scontiTariffe: 'Sconto fratelli del 10%',
      cosaCOffriamo: ['Kit Allenamento', 'Assicurazione FIPAV', 'Merenda']
    },
    torneo: {
      categoria: 'Under 16 Femminile',
      numeroSquadre: 8,
      statoTorneo: 'programmato'
    },
    archivio: {
      partecipanti: 50,
      etichettaEdizione: 'Edizione Passata',
      highlight: '',
      foto: []
    }
  });

  const [nuovaOfferta, setNuovaOfferta] = useState('');
  const [nuovaFotoUrl, setNuovaFotoUrl] = useState('');

  const loadEventi = async () => {
    try {
      setLoading(true);
      const data = await getCampTorneiAll();

      // Also check legacy collection 'eventi_tornei' for any old test documents
      if (!isDemoMode) {
        try {
          const legacySnap = await getDocs(collection(db, 'eventi_tornei'));
          legacySnap.forEach(d => {
            if (!data.some(e => e.id === d.id)) {
              data.push(mapToUnifiedEvento(d.data(), d.id));
            }
          });
        } catch (legacyErr) {
          console.warn("Nessuna collezione legacy da importare.");
        }
      }

      setEventiList(data);
    } catch (e) {
      console.error(e);
      showToast("Errore nel caricamento camp & tornei.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventi();
  }, []);

  const handleOpenNewModal = () => {
    setEditingId(null);
    setNuovaFotoUrl('');
    setEventForm({
      tipo: 'CAMP',
      titolo: '',
      sottotitolo: 'Estate 2026',
      descrizione: '',
      dataPeriodo: '',
      location: 'Palasport Forlì',
      locationDettaglio: '',
      stato: 'ATTIVO',
      visibilitaIscrizioni: 'APERTE',
      linkIscrizione: '',
      locandinaUrl: '',
      locandinaFit: 'contain',
      locandinaAltezza: 480,
      locandinaPositionY: 50,
      locandinaPositionX: 50,
      fotoGallery: [],
      pdfModuloCartaceoUrl: '',
      pdfModuloCartaceoNome: '',
      ordine: eventiList.length + 1,
      camp: {
        staffTecnico: 'Staff Qualificato NVA',
        staffDettaglio: '',
        quotaIscrizione: '150€ / settimana',
        scontiTariffe: '',
        cosaCOffriamo: ['Kit Tecnico Ufficiale', 'Assicurazione', 'Merenda']
      },
      torneo: {
        categoria: 'Under 16 Femminile',
        numeroSquadre: 8,
        statoTorneo: 'programmato'
      },
      archivio: {
        partecipanti: 50,
        etichettaEdizione: 'Edizione Passata',
        highlight: '',
        foto: []
      }
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: EventoCampTorneo) => {
    setEditingId(item.id);
    setNuovaFotoUrl('');
    const existingGallery = Array.isArray(item.fotoGallery) && item.fotoGallery.length > 0
      ? item.fotoGallery
      : (Array.isArray(item.archivio?.foto) ? item.archivio.foto : []);

    setEventForm({
      tipo: item.tipo || 'CAMP',
      titolo: item.titolo || '',
      sottotitolo: item.sottotitolo || '',
      descrizione: item.descrizione || '',
      dataPeriodo: item.dataPeriodo || '',
      location: item.location || '',
      locationDettaglio: item.locationDettaglio || '',
      stato: item.stato || 'ATTIVO',
      visibilitaIscrizioni: item.visibilitaIscrizioni || 'APERTE',
      linkIscrizione: item.linkIscrizione || '',
      locandinaUrl: item.locandinaUrl || '',
      locandinaFit: item.locandinaFit || 'contain',
      locandinaAltezza: typeof item.locandinaAltezza === 'number' ? item.locandinaAltezza : 480,
      locandinaPositionY: typeof item.locandinaPositionY === 'number' ? item.locandinaPositionY : 50,
      locandinaPositionX: typeof item.locandinaPositionX === 'number' ? item.locandinaPositionX : 50,
      fotoGallery: existingGallery,
      pdfModuloCartaceoUrl: item.pdfModuloCartaceoUrl || '',
      pdfModuloCartaceoNome: item.pdfModuloCartaceoNome || '',
      ordine: item.ordine || 1,
      camp: item.camp || {
        staffTecnico: 'Staff Qualificato NVA',
        staffDettaglio: '',
        quotaIscrizione: '',
        scontiTariffe: '',
        cosaCOffriamo: ['Kit Allenamento', 'Assicurazione']
      },
      torneo: item.torneo || {
        categoria: 'Under 16',
        numeroSquadre: 8,
        statoTorneo: 'programmato'
      },
      archivio: item.archivio || {
        partecipanti: 0,
        etichettaEdizione: 'Edizione Passata',
        highlight: '',
        foto: existingGallery
      }
    });
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.titolo.trim() || !eventForm.dataPeriodo.trim()) {
      showToast("Titolo e Periodo date sono obbligatori!", "error");
      return;
    }

    setSavingEvent(true);
    try {
      const payload = {
        ...eventForm,
        locandinaFit: eventForm.locandinaFit || 'contain',
        locandinaAltezza: eventForm.locandinaAltezza || 480,
        locandinaPositionY: typeof eventForm.locandinaPositionY === 'number' ? eventForm.locandinaPositionY : 50,
        locandinaPositionX: typeof eventForm.locandinaPositionX === 'number' ? eventForm.locandinaPositionX : 50,
        fotoGallery: eventForm.fotoGallery || [],
        archivio: {
          ...(eventForm.archivio || { partecipanti: 0, etichettaEdizione: '', highlight: '', foto: [] }),
          foto: eventForm.fotoGallery || []
        }
      };

      if (editingId) {
        setEventiList(prev => prev.map(ev => ev.id === editingId ? { ...ev, ...payload, id: editingId } : ev));
        showToast("Modifiche salvate con successo!", "success");
        setIsModalOpen(false);
        setEditingId(null);
        setSavingEvent(false);
        await updateCampTorneo(editingId, payload);
      } else {
        const tempId = `camp_${Date.now()}`;
        const newEv = { id: tempId, ...payload };
        setEventiList(prev => [newEv as any, ...prev]);
        showToast("Nuovo evento pubblicato online!", "success");
        setIsModalOpen(false);
        setEditingId(null);
        setSavingEvent(false);
        const res = await addCampTorneo(payload);
        if (res && res.id) {
          setEventiList(prev => prev.map(ev => ev.id === tempId ? { ...ev, id: res.id } : ev));
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Errore nel salvataggio dell'evento.", "error");
      setSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteCampTorneo(id);
      if (!isDemoMode) {
        try {
          await deleteDoc(doc(db, 'eventi_tornei', id));
        } catch (e) {}
      }
      showToast("Evento eliminato!", "success");
      setDeletingId(null);
      await loadEventi();
    } catch (e) {
      showToast("Errore durante l'eliminazione.", "error");
    }
  };

  const displayedList = eventiList.filter(e => activeTab === 'attivi' ? e.stato !== 'CONCLUSO' : e.stato === 'CONCLUSO');

  return (
    <div className="space-y-6 text-sm font-sans" id="admin-tab-camp-tornei">
      
      {/* Header Bar */}
      <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-amber-600 font-semibold text-xs uppercase tracking-wider">
              <Calendar className="w-4 h-4" />
              <span>Gestione Camp & Tornei</span>
            </div>
            <h3 className="text-xl font-bold text-zinc-950 mt-1">
              Camp Estivi e Manifestazioni Sportive
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              I contenuti inseriti qui si aggiornano in tempo reale nella pagina pubblica Camp & Tornei.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200">
              <button
                onClick={() => setActiveTab('attivi')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'attivi' ? 'bg-brand-yellow text-black shadow-sm' : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                Attivi ({eventiList.filter(e => e.stato !== 'CONCLUSO').length})
              </button>
              <button
                onClick={() => setActiveTab('storico')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'storico' ? 'bg-brand-yellow text-black shadow-sm' : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                Storico ({eventiList.filter(e => e.stato === 'CONCLUSO').length})
              </button>
            </div>

            <button
              onClick={handleOpenNewModal}
              className="bg-brand-yellow hover:bg-yellow-400 text-black font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow cursor-pointer transition-all shrink-0"
            >
              <Plus className="w-4 h-4" /> + Nuovo Evento
            </button>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-4">
        <h4 className="text-xs font-bold uppercase text-zinc-600 tracking-wider border-b border-zinc-100 pb-2">
          {activeTab === 'attivi' ? 'Eventi Attivi & Iscrizioni Aperte' : 'Storico Edizioni Concluse'} ({displayedList.length})
        </h4>

        {loading ? (
          <div className="py-12 text-center text-zinc-400">Caricamento eventi dal database...</div>
        ) : displayedList.length === 0 ? (
          <div className="py-10 text-center text-zinc-500 bg-zinc-50 border border-dashed border-zinc-300 rounded-2xl space-y-2">
            <Calendar className="w-8 h-8 text-zinc-300 mx-auto" />
            <p className="font-semibold text-zinc-700 text-sm">Nessun evento in questa sezione</p>
            <p className="text-xs text-zinc-400">Clicca sul pulsante in alto a destra per creare il tuo primo evento o camp estivo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedList.map(item => (
              <div key={item.id} className="bg-zinc-50/80 border border-zinc-200 hover:border-zinc-300 p-4 rounded-xl flex flex-col justify-between space-y-3 shadow-sm transition-all">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="bg-zinc-900 text-brand-yellow font-bold text-[10px] px-2 py-0.5 rounded uppercase">
                      {item.tipo}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      item.visibilitaIscrizioni === 'APERTE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {item.visibilitaIscrizioni === 'APERTE' ? 'Iscrizioni Aperte' : 'Iscrizioni Chiuse'}
                    </span>
                  </div>

                  <h4 className="font-bold text-zinc-950 text-base mt-2">
                    {item.titolo}
                  </h4>
                  {item.sottotitolo && (
                    <p className="text-xs font-semibold text-amber-700 mt-0.5">{item.sottotitolo}</p>
                  )}
                  <p className="text-zinc-600 text-xs mt-1 line-clamp-2">
                    {item.descrizione}
                  </p>

                  <div className="mt-3 pt-3 border-t border-zinc-200/80 flex items-center justify-between text-xs text-zinc-600 flex-wrap gap-2">
                    <span className="flex items-center gap-1 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-amber-500" /> {item.dataPeriodo}
                    </span>
                    <span>📍 {item.location}</span>
                  </div>
                </div>

                <div className="flex justify-end items-center gap-2 pt-2 border-t border-zinc-200">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Modifica
                  </button>

                  {deletingId === item.id ? (
                    <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg text-xs">
                      <span className="text-rose-700 font-bold text-[10px]">Eliminare?</span>
                      <button
                        onClick={() => handleDeleteEvent(item.id)}
                        className="bg-rose-600 hover:bg-rose-700 text-white px-2 py-0.5 rounded font-bold text-[10px] cursor-pointer"
                      >
                        SÌ
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="bg-zinc-200 hover:bg-zinc-300 text-zinc-700 px-1.5 py-0.5 rounded font-bold text-[10px] cursor-pointer"
                      >
                        NO
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(item.id)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 p-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Elimina evento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE / EDIT EVENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-300 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <h3 className="text-base font-bold text-zinc-950 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                {editingId ? `Modifica Evento: ${eventForm.titolo}` : 'Crea Nuovo Evento o Camp'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-600 text-xs font-semibold uppercase">Tipo Evento *</label>
                  <select
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                    value={eventForm.tipo}
                    onChange={e => setEventForm({ ...eventForm, tipo: e.target.value as any })}
                  >
                    <option value="CAMP">☀️ Summer Camp</option>
                    <option value="TORNEO">🏆 Torneo / NVA Cup</option>
                    <option value="GENERICO">📅 Evento Speciale / Open Day</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-600 text-xs font-semibold uppercase">Stato Pubblicazione *</label>
                  <select
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                    value={eventForm.stato}
                    onChange={e => setEventForm({ ...eventForm, stato: e.target.value as any })}
                  >
                    <option value="ATTIVO">Attivo (Visibile in HomePage / Camp)</option>
                    <option value="CONCLUSO">Concluso (Spostato nello Storico)</option>
                    <option value="NASCOSTO">Nascosto (Bozza)</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-zinc-600 text-xs font-semibold uppercase">Titolo Evento *</label>
                  <input
                    type="text"
                    required
                    placeholder="es. Summer Volley Camp 2026"
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                    value={eventForm.titolo}
                    onChange={e => setEventForm({ ...eventForm, titolo: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-600 text-xs font-semibold uppercase">Sottotitolo / Edizione</label>
                  <input
                    type="text"
                    placeholder="es. 18ª Edizione"
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                    value={eventForm.sottotitolo}
                    onChange={e => setEventForm({ ...eventForm, sottotitolo: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-600 text-xs font-semibold uppercase">Periodo / Date *</label>
                  <input
                    type="text"
                    required
                    placeholder="es. Dal 15 al 25 Luglio 2026"
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                    value={eventForm.dataPeriodo}
                    onChange={e => setEventForm({ ...eventForm, dataPeriodo: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-600 text-xs font-semibold uppercase">Sede / Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="es. PalaMaroncelli, Forlì"
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                    value={eventForm.location}
                    onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-600 text-xs font-semibold uppercase">Stato Iscrizioni</label>
                  <select
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                    value={eventForm.visibilitaIscrizioni}
                    onChange={e => setEventForm({ ...eventForm, visibilitaIscrizioni: e.target.value as any })}
                  >
                    <option value="APERTE">Iscrizioni Aperte</option>
                    <option value="CHIUSE">Iscrizioni Chiuse</option>
                    <option value="NASCOSTO">Gestite in segreteria (Nascosto)</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-zinc-600 text-xs font-semibold uppercase">Link Iscrizione (Golee o Google Forms)</label>
                  <input
                    type="url"
                    placeholder="https://golee.it/..."
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                    value={eventForm.linkIscrizione || ''}
                    onChange={e => setEventForm({ ...eventForm, linkIscrizione: e.target.value })}
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-zinc-600 text-xs font-semibold uppercase">Descrizione / Presentazione</label>
                  <textarea
                    rows={3}
                    placeholder="Descrivi l'evento o il camp..."
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                    value={eventForm.descrizione}
                    onChange={e => setEventForm({ ...eventForm, descrizione: e.target.value })}
                  />
                </div>

                {/* Specifics for CAMP */}
                {eventForm.tipo === 'CAMP' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-zinc-600 text-xs font-semibold uppercase">Staff Tecnico</label>
                      <input
                        type="text"
                        placeholder="es. Coach FIPAV Qualificati"
                        className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                        value={eventForm.camp?.staffTecnico || ''}
                        onChange={e => setEventForm({
                          ...eventForm,
                          camp: { ...eventForm.camp!, staffTecnico: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-600 text-xs font-semibold uppercase">Quota Iscrizione</label>
                      <input
                        type="text"
                        placeholder="es. 150€ / settimana"
                        className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                        value={eventForm.camp?.quotaIscrizione || ''}
                        onChange={e => setEventForm({
                          ...eventForm,
                          camp: { ...eventForm.camp!, quotaIscrizione: e.target.value }
                        })}
                      />
                    </div>
                  </>
                )}

                {/* Specifics for TORNEO */}
                {eventForm.tipo === 'TORNEO' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-zinc-600 text-xs font-semibold uppercase">Categoria Torneo</label>
                      <input
                        type="text"
                        placeholder="es. Under 16 Femminile"
                        className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                        value={eventForm.torneo?.categoria || ''}
                        onChange={e => setEventForm({
                          ...eventForm,
                          torneo: { ...eventForm.torneo!, categoria: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-600 text-xs font-semibold uppercase">Numero Squadre</label>
                      <input
                        type="number"
                        placeholder="8"
                        className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                        value={eventForm.torneo?.numeroSquadre || 8}
                        onChange={e => setEventForm({
                          ...eventForm,
                          torneo: { ...eventForm.torneo!, numeroSquadre: parseInt(e.target.value, 10) || 8 }
                        })}
                      />
                    </div>
                  </>
                )}

                {/* Locandina / Immagine di Copertina */}
                <div className="space-y-3 sm:col-span-2 bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-zinc-800 text-xs font-bold uppercase flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-amber-500" />
                        <span>Locandina / Foto di Copertina</span>
                      </label>
                      <p className="text-[11px] text-zinc-500">
                        Carica la locandina o foto principale. Puoi regolare altezza, centratura e visualizzazione intera senza tagli.
                      </p>
                    </div>
                    <label className="bg-zinc-900 hover:bg-black text-white px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer text-xs font-medium shrink-0 shadow-sm">
                      <Upload className="w-4 h-4 text-brand-yellow" /> Carica Foto
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            showToast("Caricamento immagine in corso...", "info");
                            const url = await caricaFileSuStorage(file, `eventi/${Date.now()}_${file.name}`);
                            setEventForm({ 
                              ...eventForm, 
                              locandinaUrl: url
                            });
                            showToast("Locandina caricata con successo!", "success");
                          } catch (err) {
                            showToast("Errore caricamento immagine.", "error");
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Input manuale URL */}
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://... o incolla link immagine"
                      className="flex-1 min-w-0 bg-white border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                      value={eventForm.locandinaUrl || ''}
                      onChange={e => setEventForm({ ...eventForm, locandinaUrl: e.target.value })}
                    />
                    {eventForm.locandinaUrl && (
                      <button
                        type="button"
                        onClick={() => setEventForm({ ...eventForm, locandinaUrl: '' })}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold border border-red-200 cursor-pointer"
                      >
                        Rimuovi
                      </button>
                    )}
                  </div>

                  {/* Controlli di Regolazione Centratura e Altezza (visibili se c'è un'immagine) */}
                  {eventForm.locandinaUrl && (
                    <div className="pt-3 border-t border-zinc-200 space-y-4">
                      {/* Selettore Modalità Fit */}
                      <div className="space-y-1.5">
                        <label className="text-zinc-700 text-xs font-bold flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-brand-yellow" />
                          <span>Modalità di Visualizzazione</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setEventForm({ ...eventForm, locandinaFit: 'contain' })}
                            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                              (eventForm.locandinaFit || 'contain') === 'contain'
                                ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-sm'
                                : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                            }`}
                          >
                            <span className="text-base">✨</span>
                            <div className="text-left">
                              <p className="font-bold">Adatta (Intera, Mai Tagliata)</p>
                              <p className="text-[10px] text-zinc-500 font-normal">Perfetta per locandine verticali e pantera, 100% visibile</p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEventForm({ ...eventForm, locandinaFit: 'cover' })}
                            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                              eventForm.locandinaFit === 'cover'
                                ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-sm'
                                : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                            }`}
                          >
                            <span className="text-base">🖼️</span>
                            <div className="text-left">
                              <p className="font-bold">Riempi / Panoramica (Cover)</p>
                              <p className="text-[10px] text-zinc-500 font-normal">Riempie l'intero spazio usando la centratura impostata</p>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Slider di Regolazione */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-zinc-200">
                        {/* Altezza Box */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-zinc-700">Altezza Riquadro:</span>
                            <span className="font-mono text-amber-700 font-bold">{eventForm.locandinaAltezza || 480}px</span>
                          </div>
                          <input
                            type="range"
                            min="300"
                            max="650"
                            step="10"
                            value={eventForm.locandinaAltezza || 480}
                            onChange={e => setEventForm({ ...eventForm, locandinaAltezza: parseInt(e.target.value, 10) })}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] text-zinc-400">
                            <span>Compatta (300px)</span>
                            <span>Alta (650px)</span>
                          </div>
                        </div>

                        {/* Centratura Verticale (Y) */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-zinc-700">Centratura Verticale (Y):</span>
                            <span className="font-mono text-amber-700 font-bold">{eventForm.locandinaPositionY ?? 50}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={eventForm.locandinaPositionY ?? 50}
                            onChange={e => setEventForm({ ...eventForm, locandinaPositionY: parseInt(e.target.value, 10) })}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] text-zinc-400">
                            <span>In alto (0%)</span>
                            <span>Centro (50%)</span>
                            <span>In basso (100%)</span>
                          </div>
                        </div>

                        {/* Centratura Orizzontale (X) */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-zinc-700">Centratura Orizzontale (X):</span>
                            <span className="font-mono text-amber-700 font-bold">{eventForm.locandinaPositionX ?? 50}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={eventForm.locandinaPositionX ?? 50}
                            onChange={e => setEventForm({ ...eventForm, locandinaPositionX: parseInt(e.target.value, 10) })}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] text-zinc-400">
                            <span>Sinistra (0%)</span>
                            <span>Centro (50%)</span>
                            <span>Destra (100%)</span>
                          </div>
                        </div>
                      </div>

                      {/* Anteprima Live nel form */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-zinc-600 text-xs font-semibold flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Anteprima dal Vivo (Come apparirà nella pagina dell'evento):</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setEventForm({ ...eventForm, locandinaPositionX: 50, locandinaPositionY: 50, locandinaAltezza: 480 })}
                            className="text-[11px] text-amber-600 hover:text-amber-700 font-medium underline cursor-pointer"
                          >
                            Ripristina default
                          </button>
                        </div>
                        <div 
                          className="relative w-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center shadow-inner"
                          style={{ height: `${Math.min(eventForm.locandinaAltezza || 480, 320)}px` }}
                        >
                          {/* Sfondo sfumato ambientale */}
                          <img
                            src={eventForm.locandinaUrl}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover blur-xl opacity-35 scale-110 pointer-events-none"
                          />
                          {/* Foto centrata con i parametri */}
                          <img
                            src={eventForm.locandinaUrl}
                            alt="Anteprima centratura"
                            className={`relative z-10 w-full h-full ${
                              eventForm.locandinaFit === 'cover' ? 'object-cover' : 'object-contain'
                            }`}
                            style={{
                              objectPosition: `${eventForm.locandinaPositionX ?? 50}% ${eventForm.locandinaPositionY ?? 50}%`
                            }}
                          />
                          <div className="absolute bottom-2 left-2 z-20 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono text-zinc-300">
                            Modalità: {eventForm.locandinaFit === 'cover' ? 'Riempi (Cover)' : 'Adatta Intera (Contain)'} • {eventForm.locandinaPositionX ?? 50}% X • {eventForm.locandinaPositionY ?? 50}% Y
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* PDF Volantino / Modulo */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-zinc-600 text-xs font-semibold uppercase">Volantino / Modulo PDF (Opzionale)</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://... o carica un PDF dal pulsante a destra"
                      className="flex-1 min-w-0 bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900 truncate"
                      value={eventForm.pdfModuloCartaceoUrl || ''}
                      onChange={e => setEventForm({ ...eventForm, pdfModuloCartaceoUrl: e.target.value })}
                    />
                    <label className="bg-zinc-900 hover:bg-black text-white px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer text-xs font-medium shrink-0">
                      <Upload className="w-4 h-4 text-brand-yellow" /> Carica PDF
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            showToast("Caricamento PDF in corso...", "info");
                            const url = await caricaFileSuStorage(file, `eventi/${Date.now()}_${file.name}`);
                            setEventForm({ 
                              ...eventForm, 
                              pdfModuloCartaceoUrl: url,
                              pdfModuloCartaceoNome: file.name
                            });
                            showToast("Documento PDF caricato!", "success");
                          } catch (err) {
                            showToast("Errore caricamento PDF.", "error");
                          }
                        }}
                      />
                    </label>
                  </div>
                  {eventForm.pdfModuloCartaceoUrl && (
                    <div className="flex items-center justify-between gap-2 p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-zinc-800">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="font-semibold truncate">{eventForm.pdfModuloCartaceoNome || 'Documento PDF allegato'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => openPdfDocument(eventForm.pdfModuloCartaceoUrl!, eventForm.pdfModuloCartaceoNome)}
                          className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" /> Apri PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => setEventForm({ ...eventForm, pdfModuloCartaceoUrl: '', pdfModuloCartaceoNome: '' })}
                          className="px-2.5 py-1.5 text-red-600 hover:bg-red-100/60 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                          title="Rimuovi allegato PDF"
                        >
                          Rimuovi
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Galleria Foto Scorse Edizioni (per il Carosello interno) */}
                <div className="space-y-2 sm:col-span-2 bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <label className="text-zinc-800 text-xs font-bold uppercase flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-amber-500" />
                        <span>Foto Scorse Edizioni (Carosello Interno)</span>
                      </label>
                      <p className="text-[11px] text-zinc-500">
                        Carica più foto insieme (selezione multipla attiva). Puoi riordinarle con le frecce.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {uploadingGallery && galleryProgress && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                          <span>Caricamento {galleryProgress.current} di {galleryProgress.total}...</span>
                        </div>
                      )}

                      <label className={`bg-[#FFE600] hover:bg-yellow-400 text-zinc-950 px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer text-xs font-bold shadow-sm shrink-0 transition-all ${
                        uploadingGallery ? 'opacity-50 pointer-events-none' : ''
                      }`}>
                        <Plus className="w-3.5 h-3.5" /> Aggiungi Foto (Anche Multiple)
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []) as File[];
                            if (files.length === 0) return;
                            
                            setUploadingGallery(true);
                            const uploadedUrls: string[] = [];
                            
                            for (let i = 0; i < files.length; i++) {
                              const f = files[i];
                              setGalleryProgress({ current: i + 1, total: files.length });
                              try {
                                const url = await caricaFileSuStorage(f, `eventi/gallery_${Date.now()}_${i}_${f.name}`);
                                if (url) uploadedUrls.push(url);
                              } catch (err) {
                                console.error("Errore upload file galleria:", err);
                              }
                            }
                            
                            if (uploadedUrls.length > 0) {
                              const updatedList = [...(eventForm.fotoGallery || []), ...uploadedUrls];
                              setEventForm({
                                ...eventForm,
                                fotoGallery: updatedList,
                                archivio: {
                                  ...(eventForm.archivio || { partecipanti: 0, etichettaEdizione: '', highlight: '', foto: [] }),
                                  foto: updatedList
                                }
                              });
                              showToast(`${uploadedUrls.length} foto aggiunte alla galleria!`, "success");
                            } else {
                              showToast("Errore nel caricamento delle foto.", "error");
                            }
                            
                            setUploadingGallery(false);
                            setGalleryProgress(null);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Thumbnail gallery con controlli di riordino ed eliminazione */}
                  {eventForm.fotoGallery && eventForm.fotoGallery.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2">
                      {eventForm.fotoGallery.map((foto, idx) => (
                        <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-zinc-300 group bg-zinc-950 shadow-sm">
                          <img src={foto} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                          
                          {/* Overlay con bottoni di riordino ed eliminazione */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-2">
                            {/* Sposta a sinistra */}
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => {
                                if (idx === 0) return;
                                const list = [...(eventForm.fotoGallery || [])];
                                const temp = list[idx - 1];
                                list[idx - 1] = list[idx];
                                list[idx] = temp;
                                setEventForm({
                                  ...eventForm,
                                  fotoGallery: list,
                                  archivio: {
                                    ...(eventForm.archivio || { partecipanti: 0, etichettaEdizione: '', highlight: '', foto: [] }),
                                    foto: list
                                  }
                                });
                              }}
                              className="p-1 rounded bg-zinc-800 text-white hover:bg-zinc-700 disabled:opacity-30 cursor-pointer"
                              title="Sposta prima"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>

                            {/* Elimina */}
                            <button
                              type="button"
                              onClick={() => {
                                const updatedList = (eventForm.fotoGallery || []).filter((_, i) => i !== idx);
                                setEventForm({
                                  ...eventForm,
                                  fotoGallery: updatedList,
                                  archivio: {
                                    ...(eventForm.archivio || { partecipanti: 0, etichettaEdizione: '', highlight: '', foto: [] }),
                                    foto: updatedList
                                  }
                                });
                              }}
                              className="p-1 rounded bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                              title="Elimina foto"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>

                            {/* Sposta a destra */}
                            <button
                              type="button"
                              disabled={idx === (eventForm.fotoGallery?.length || 0) - 1}
                              onClick={() => {
                                if (idx === (eventForm.fotoGallery?.length || 0) - 1) return;
                                const list = [...(eventForm.fotoGallery || [])];
                                const temp = list[idx + 1];
                                list[idx + 1] = list[idx];
                                list[idx] = temp;
                                setEventForm({
                                  ...eventForm,
                                  fotoGallery: list,
                                  archivio: {
                                    ...(eventForm.archivio || { partecipanti: 0, etichettaEdizione: '', highlight: '', foto: [] }),
                                    foto: list
                                  }
                                });
                              }}
                              className="p-1 rounded bg-zinc-800 text-white hover:bg-zinc-700 disabled:opacity-30 cursor-pointer"
                              title="Sposta dopo"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className="absolute bottom-1 left-1 bg-black/70 text-[9px] font-mono px-1 rounded text-zinc-300">
                            #{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-xs text-zinc-400 border border-dashed border-zinc-300 rounded-xl">
                      Nessuna foto aggiunta. Clicca su "+ Aggiungi Foto" per selezionare una o più foto contemporaneamente.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={savingEvent}
                  className="bg-zinc-200 hover:bg-zinc-300 disabled:opacity-50 text-zinc-700 font-medium px-4 py-2.5 rounded-xl text-xs cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={savingEvent}
                  className="bg-brand-yellow hover:bg-yellow-400 disabled:opacity-50 text-black font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer shadow flex items-center gap-2"
                >
                  {savingEvent && <Loader2 className="w-4 h-4 animate-spin text-black" />}
                  <span>
                    {savingEvent 
                      ? 'Salvataggio in corso...' 
                      : (editingId ? 'Salva Modifiche' : 'Pubblica Evento')
                    }
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
