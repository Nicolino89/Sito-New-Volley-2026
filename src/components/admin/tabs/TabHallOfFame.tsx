import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Plus, 
  Trash2, 
  Edit3, 
  Upload, 
  Sparkles, 
  Award, 
  Calendar, 
  User, 
  Users,
  Search,
  Link,
  Unlink,
  Shirt,
  Sliders, 
  CheckCircle, 
  AlertCircle, 
  X,
  Eye,
  Camera,
  Layers,
  Star,
  Check
} from 'lucide-react';
import { 
  AtletaPremiato, 
  PremioVinto,
  Giocatore,
  RosaSquadra,
  getHallOfFameAll, 
  addAtletaPremiato, 
  updateAtletaPremiato, 
  deleteAtletaPremiato,
  getGiocatoriAll,
  getSquadreAll,
  caricaBlobSuStorage,
  OspiteIllustre,
  EventoOspite,
  getEventiOspite,
  getOspitiIllustriAll,
  addOspiteIllustre,
  updateOspiteIllustre,
  deleteOspiteIllustre,
  formatRuoloGiocatore
} from '../../../firebase-societa';
import { compressImage, IMAGE_PRESETS } from '../../../utils/imageCompressor';

const HOF_CACHE_KEY = 'nva_hof_cached_list';
const OSPITI_CACHE_KEY = 'nva_ospiti_cached_list';

interface TabHallOfFameProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  caricaFileSuStorage: (file: File, path: string) => Promise<string>;
  initialSquadre?: RosaSquadra[];
  initialGiocatori?: Giocatore[];
}

export default function TabHallOfFame({ 
  showToast, 
  caricaFileSuStorage, 
  initialSquadre = [], 
  initialGiocatori = [] 
}: TabHallOfFameProps) {
  // Sezione attiva: "nostri" (Albo d'Oro atleti NVA) oppure "ospiti" (Ospiti Illustri & Campioni)
  const [activeSection, setActiveSection] = useState<'nostri' | 'ospiti'>('nostri');

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

  const [giocatori, setGiocatori] = useState<Giocatore[]>(initialGiocatori);
  const [squadre, setSquadre] = useState<RosaSquadra[]>(initialSquadre);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [uploadingSfondo, setUploadingSfondo] = useState(false);

  // Stati dedicati a Ospiti Illustri
  const [isOspiteModalOpen, setIsOspiteModalOpen] = useState(false);
  const [editingOspiteId, setEditingOspiteId] = useState<string | null>(null);
  const [savingOspite, setSavingOspite] = useState(false);
  const [uploadingFotoOspite, setUploadingFotoOspite] = useState(false);
  const [formOspite, setFormOspite] = useState<Omit<OspiteIllustre, 'id'>>({
    nome: '',
    ruoloTitolo: '',
    anno: '2024',
    occasione: 'Summer Camp 2024',
    eventiPartecipazione: [{ anno: '2024', evento: 'Summer Camp 2024' }],
    testoPassaggio: '',
    testoIspirazione: '',
    fotoUrl: '',
    fotoPositionY: 30,
    fotoPositionX: 50,
    descrizione: '',
    fotoMomentoUrl: '',
    sfondoUrl: '',
    inEvidenza: false,
    ordine: 1
  });

  // Form state Atleta Premiato
  const [form, setForm] = useState<Omit<AtletaPremiato, 'id'>>({
    nome: '',
    anno: '2024/2025',
    titoloPremio: '',
    categoria: 'Serie D Femminile',
    ruolo: 'Schiacciatrice',
    fotoUrl: '',
    fotoPositionY: 30,
    fotoPositionX: 50,
    descrizione: '',
    fotoPremiazioneUrl: '',
    inEvidenza: false,
    ordine: 1,
    premi: [],
    sfondoUrl: '',
    sfondoPositionY: 50,
    giocatoreId: undefined
  });

  useEffect(() => {
    if (initialSquadre && initialSquadre.length > 0) {
      setSquadre(initialSquadre);
    }
  }, [initialSquadre]);

  useEffect(() => {
    if (initialGiocatori && initialGiocatori.length > 0) {
      setGiocatori(initialGiocatori);
    }
  }, [initialGiocatori]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
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

      setGiocatori(prev => (gioData && gioData.length > 0 ? gioData : prev));
      setSquadre(prev => (sqData && sqData.length > 0 ? sqData : prev));
    } catch (err) {
      console.error(err);
      showToast("Errore nel caricamento della Hall of Fame e Ospiti.", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadAtleti = async () => {
    try {
      const data = await getHallOfFameAll();
      setAtleti(data);
      try {
        localStorage.setItem(HOF_CACHE_KEY, JSON.stringify(data));
      } catch (e) {}
    } catch (err) {
      console.error(err);
    }
  };

  const getPlayerTeamName = (giocatoreId: string, giocatoreObj?: Giocatore): string => {
    if (!giocatoreId) return '';
    const cleanId = String(giocatoreId).trim();
    // 1. Cerca per presenza dell'ID atleta nella rosa
    const s = squadre.find(team => 
      team.id_atleti && (
        team.id_atleti.includes(giocatoreId) ||
        team.id_atleti.some(id => String(id).trim() === cleanId)
      )
    );
    if (s?.nome_squadra) return s.nome_squadra;

    // 2. Se passato giocatore o trovato per ID, cerca nello storico o per categoria
    const g = giocatoreObj || giocatori.find(p => String(p.id).trim() === cleanId);
    if (g) {
      if (g.storico_manuale && g.storico_manuale.length > 0) {
        const lastStagione = g.storico_manuale[0]?.squadra_o_premio;
        if (lastStagione) {
          const matchSq = squadre.find(sq => sq.nome_squadra.toLowerCase().includes(lastStagione.toLowerCase()));
          if (matchSq) return matchSq.nome_squadra;
        }
      }
    }
    return '';
  };

  const handleSelectGiocatore = (g: Giocatore) => {
    const nomeSquadra = getPlayerTeamName(g.id, g);
    const newPremi = [...(form.premi || [])];

    // Se il giocatore ha storico_manuale, importiamo i traguardi come titoli aggiuntivi
    if (g.storico_manuale && g.storico_manuale.length > 0) {
      g.storico_manuale.forEach((st) => {
        const titoloStr = st.squadra_o_premio;
        if (titoloStr && !newPremi.some(p => p.titolo?.toLowerCase() === titoloStr.toLowerCase())) {
          newPremi.push({
            id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            titolo: titoloStr,
            anno: st.stagione || form.anno || '2024/2025',
            categoria: nomeSquadra || form.categoria || '',
            descrizione: st.note || (st.ruolo ? `Ruolo: ${st.ruolo}` : '')
          });
        }
      });
    }

    const photoUrl = g.foto?.url || g.foto_url || form.fotoUrl;
    const posX = g.fotoPositionX ?? g.foto?.positionX ?? form.fotoPositionX ?? 50;
    const posY = g.fotoPositionY ?? g.foto?.positionY ?? form.fotoPositionY ?? 30;

    setForm(prev => ({
      ...prev,
      giocatoreId: g.id,
      nome: `${g.nome} ${g.cognome}`.trim(),
      ruolo: g.ruolo || prev.ruolo,
      categoria: nomeSquadra || prev.categoria,
      fotoUrl: photoUrl,
      fotoPositionX: posX,
      fotoPositionY: posY,
      premi: newPremi
    }));

    setIsPickerOpen(false);
    showToast(`Dati di ${g.nome} ${g.cognome} importati con successo!`, 'success');
  };

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Anteprima istantanea a schermo
    const localUrl = URL.createObjectURL(file);
    setForm(prev => ({ ...prev, fotoUrl: localUrl }));
    setUploadingFoto(true);

    // Timeout di sicurezza per sbloccare la UI in qualsiasi circostanza
    const safetyTimeout = setTimeout(() => {
      setUploadingFoto(false);
    }, 10000);

    try {
      showToast("Compressione e ottimizzazione foto...", "info");
      
      // Compressione automatica client-side in WebP (Preset ATLETA 800x1000)
      let blobToUpload: Blob = file;
      try {
        const compResult = await compressImage(file, IMAGE_PRESETS.ATLETA);
        blobToUpload = compResult.blob;
      } catch (compErr) {
        console.warn("Compressione foto fallita, uso file originale:", compErr);
      }

      // Upload su Storage con timeout di 8 secondi
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePromise = caricaBlobSuStorage(blobToUpload, `hall_of_fame/${Date.now()}_${cleanName}.webp`);
      const timeoutPromise = new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error("Timeout caricamento foto")), 8000)
      );

      const storageUrl = await Promise.race([storagePromise, timeoutPromise]);
      setForm(prev => ({ ...prev, fotoUrl: storageUrl }));
      showToast("Foto caricata con successo!", "success");
    } catch (err) {
      console.warn("Upload Storage foto non completato o timeout, fallback su Base64 compresso:", err);
      // Fallback a base64 DataURL permanente
      try {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string || localUrl);
          reader.onerror = () => resolve(localUrl);
          reader.readAsDataURL(file);
        });
        setForm(prev => ({ ...prev, fotoUrl: dataUrl }));
      } catch (convErr) {}
      showToast("Foto salvata localmente in modalità ottimizzata.", "info");
    } finally {
      clearTimeout(safetyTimeout);
      setUploadingFoto(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSfondoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Anteprima sfondo istantanea
    const localUrl = URL.createObjectURL(file);
    setForm(prev => ({ ...prev, sfondoUrl: localUrl }));
    setUploadingSfondo(true);

    const safetyTimeout = setTimeout(() => {
      setUploadingSfondo(false);
    }, 10000);

    try {
      showToast("Compressione e ottimizzazione sfondo...", "info");
      
      let blobToUpload: Blob = file;
      try {
        const compResult = await compressImage(file, IMAGE_PRESETS.EVENTO_COVER);
        blobToUpload = compResult.blob;
      } catch (compErr) {
        console.warn("Compressione sfondo fallita, uso file originale:", compErr);
      }

      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePromise = caricaBlobSuStorage(blobToUpload, `hall_of_fame_sfondi/${Date.now()}_${cleanName}.webp`);
      const timeoutPromise = new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error("Timeout caricamento sfondo")), 8000)
      );

      const storageUrl = await Promise.race([storagePromise, timeoutPromise]);
      setForm(prev => ({ ...prev, sfondoUrl: storageUrl }));
      showToast("Foto di sfondo caricata con successo!", "success");
    } catch (err) {
      console.warn("Upload Storage sfondo non completato o timeout, fallback su Base64:", err);
      try {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string || localUrl);
          reader.onerror = () => resolve(localUrl);
          reader.readAsDataURL(file);
        });
        setForm(prev => ({ ...prev, sfondoUrl: dataUrl }));
      } catch (convErr) {}
      showToast("Sfondo salvato localmente in modalità ottimizzata.", "info");
    } finally {
      clearTimeout(safetyTimeout);
      setUploadingSfondo(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      nome: '',
      anno: '2024/2025',
      titoloPremio: '',
      categoria: 'Serie D Femminile',
      ruolo: 'Schiacciatrice',
      fotoUrl: '',
      fotoPositionY: 30,
      fotoPositionX: 50,
      descrizione: '',
      fotoPremiazioneUrl: '',
      inEvidenza: false,
      ordine: (atleti.length + 1),
      premi: [],
      sfondoUrl: '',
      sfondoPositionY: 50,
      giocatoreId: undefined
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: AtletaPremiato) => {
    setEditingId(item.id);
    setForm({
      nome: item.nome || '',
      anno: item.anno || '2024/2025',
      titoloPremio: item.titoloPremio || '',
      categoria: item.categoria || '',
      ruolo: item.ruolo || '',
      fotoUrl: item.fotoUrl || '',
      fotoPositionY: item.fotoPositionY ?? 30,
      fotoPositionX: item.fotoPositionX ?? 50,
      descrizione: item.descrizione || '',
      fotoPremiazioneUrl: item.fotoPremiazioneUrl || '',
      inEvidenza: item.inEvidenza || false,
      ordine: item.ordine || 1,
      premi: item.premi ? [...item.premi] : [],
      sfondoUrl: item.sfondoUrl || '',
      sfondoPositionY: item.sfondoPositionY ?? 50,
      giocatoreId: item.giocatoreId
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!window.confirm(`Sei sicuro di voler rimuovere "${nome}" dall'Albo d'Oro?`)) return;
    
    // Aggiornamento ottimistico immediato a 0ms
    const previousAtleti = [...atleti];
    const updated = atleti.filter(item => item.id !== id);
    setAtleti(updated);
    try {
      localStorage.setItem(HOF_CACHE_KEY, JSON.stringify(updated));
    } catch (e) {}
    showToast("Quadro rimosso dall'Albo d'Oro.", "success");

    try {
      await deleteAtletaPremiato(id);
    } catch (err) {
      console.error("Errore cancellazione quadro:", err);
      // Ripristino in caso di errore
      setAtleti(previousAtleti);
      try {
        localStorage.setItem(HOF_CACHE_KEY, JSON.stringify(previousAtleti));
      } catch (e) {}
      showToast("Errore durante l'eliminazione su Cloud Firestore.", "error");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.titoloPremio.trim()) {
      showToast("Inserisci almeno il Nome e il Titolo del Premio.", "error");
      return;
    }
    if (!form.fotoUrl) {
      showToast("Carica una foto per il quadro dell'atleta.", "error");
      return;
    }
    if (uploadingFoto || uploadingSfondo) {
      showToast("Attendi il completamento dell'ottimizzazione immagine...", "info");
      return;
    }

    // Se per qualche motivo la foto è ancora blob:, convertila in DataURL prima del salvataggio
    let finalFotoUrl = form.fotoUrl;
    if (finalFotoUrl.startsWith('blob:')) {
      try {
        const resp = await fetch(finalFotoUrl);
        const bl = await resp.blob();
        const reader = new FileReader();
        finalFotoUrl = await new Promise<string>((res) => {
          reader.onloadend = () => res(reader.result as string || finalFotoUrl);
          reader.onerror = () => res(finalFotoUrl);
          reader.readAsDataURL(bl);
        });
      } catch (e) {}
    }

    let finalSfondoUrl = form.sfondoUrl || '';
    if (finalSfondoUrl && finalSfondoUrl.startsWith('blob:')) {
      try {
        const resp = await fetch(finalSfondoUrl);
        const bl = await resp.blob();
        const reader = new FileReader();
        finalSfondoUrl = await new Promise<string>((res) => {
          reader.onloadend = () => res(reader.result as string || finalSfondoUrl);
          reader.onerror = () => res(finalSfondoUrl);
          reader.readAsDataURL(bl);
        });
      } catch (e) {}
    }

    const payload = {
      ...form,
      fotoUrl: finalFotoUrl,
      sfondoUrl: finalSfondoUrl
    };

    try {
      setSaving(true);
      if (editingId) {
        await updateAtletaPremiato(editingId, payload);
        const updated = atleti.map(item => item.id === editingId ? { ...item, ...payload, id: editingId } : item);
        setAtleti(updated);
        try {
          localStorage.setItem(HOF_CACHE_KEY, JSON.stringify(updated));
        } catch (e) {}
        showToast("Quadro aggiornato con successo!", "success");
      } else {
        const nuovo = await addAtletaPremiato(payload);
        const updated = [...atleti, nuovo];
        setAtleti(updated);
        try {
          localStorage.setItem(HOF_CACHE_KEY, JSON.stringify(updated));
        } catch (e) {}
        showToast("Nuovo quadro aggiunto all'Albo d'Oro!", "success");
      }
      setIsModalOpen(false);
      setEditingId(null);
    } catch (err) {
      console.error(err);
      showToast("Errore durante il salvataggio: " + (err instanceof Error ? err.message : String(err)), "error");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // GESTIONE OSPITI ILLUSTRI & LEGGENDE
  // ==========================================
  const handleOpenAddOspite = () => {
    setEditingOspiteId(null);
    setFormOspite({
      nome: '',
      ruoloTitolo: '',
      anno: '2026',
      occasione: '',
      eventiPartecipazione: [{ anno: '2026', evento: '' }],
      testoPassaggio: '',
      testoIspirazione: '',
      fotoUrl: '',
      fotoPositionY: 30,
      fotoPositionX: 50,
      descrizione: '',
      fotoMomentoUrl: '',
      sfondoUrl: '',
      inEvidenza: false,
      ordine: (ospiti.length + 1)
    });
    setIsOspiteModalOpen(true);
  };

  const handleOpenEditOspite = (item: OspiteIllustre) => {
    setEditingOspiteId(item.id);
    const parsedEventi = getEventiOspite(item);
    setFormOspite({
      nome: item.nome || '',
      ruoloTitolo: item.ruoloTitolo || '',
      anno: item.anno || '2024',
      occasione: item.occasione || '',
      eventiPartecipazione: parsedEventi.length > 0 ? parsedEventi : [{ anno: item.anno || '', evento: item.occasione || '' }],
      testoPassaggio: item.testoPassaggio || '',
      testoIspirazione: item.testoIspirazione || '',
      fotoUrl: item.fotoUrl || '',
      fotoPositionY: item.fotoPositionY ?? 30,
      fotoPositionX: item.fotoPositionX ?? 50,
      descrizione: item.descrizione || '',
      fotoMomentoUrl: item.fotoMomentoUrl || '',
      sfondoUrl: item.sfondoUrl || '',
      inEvidenza: item.inEvidenza || false,
      ordine: item.ordine || 1
    });
    setIsOspiteModalOpen(true);
  };

  const handleDeleteOspite = async (id: string, nome: string) => {
    if (!window.confirm(`Sei sicuro di voler rimuovere "${nome}" dagli Ospiti Illustri?`)) return;

    // Aggiornamento ottimistico a 0ms
    const previousOspiti = [...ospiti];
    const updated = ospiti.filter(item => item.id !== id);
    setOspiti(updated);
    try {
      localStorage.setItem(OSPITI_CACHE_KEY, JSON.stringify(updated));
    } catch (e) {}
    showToast("Ospite illustre rimosso.", "success");

    try {
      await deleteOspiteIllustre(id);
    } catch (err) {
      console.error("Errore cancellazione ospite:", err);
      setOspiti(previousOspiti);
      try {
        localStorage.setItem(OSPITI_CACHE_KEY, JSON.stringify(previousOspiti));
      } catch (e) {}
      showToast("Errore durante l'eliminazione su Cloud Firestore.", "error");
    }
  };

  const handleFotoOspiteUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setFormOspite(prev => ({ ...prev, fotoUrl: localUrl }));
    setUploadingFotoOspite(true);

    const safetyTimeout = setTimeout(() => {
      setUploadingFotoOspite(false);
    }, 10000);

    try {
      showToast("Compressione e ottimizzazione foto ospite...", "info");
      let blobToUpload: Blob = file;
      try {
        const compResult = await compressImage(file, IMAGE_PRESETS.ATLETA);
        blobToUpload = compResult.blob;
      } catch (compErr) {
        console.warn("Compressione foto fallita, uso file originale:", compErr);
      }

      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePromise = caricaBlobSuStorage(blobToUpload, `ospiti_illustri/${Date.now()}_${cleanName}.webp`);
      const timeoutPromise = new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error("Timeout caricamento foto ospite")), 8000)
      );

      const storageUrl = await Promise.race([storagePromise, timeoutPromise]);
      setFormOspite(prev => ({ ...prev, fotoUrl: storageUrl }));
      showToast("Foto ospite caricata con successo!", "success");
    } catch (err) {
      console.warn("Upload Storage fallito o timeout, uso fallback Base64:", err);
      try {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string || localUrl);
          reader.onerror = () => resolve(localUrl);
          reader.readAsDataURL(file);
        });
        setFormOspite(prev => ({ ...prev, fotoUrl: dataUrl }));
      } catch (convErr) {}
      showToast("Foto ospite salvata in modalità ottimizzata.", "info");
    } finally {
      clearTimeout(safetyTimeout);
      setUploadingFotoOspite(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveOspite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formOspite.nome.trim() || !formOspite.ruoloTitolo.trim()) {
      showToast("Inserisci il Nome e il Ruolo / Titolo dell'Ospite Illustre.", "error");
      return;
    }
    if (!formOspite.fotoUrl) {
      showToast("Carica una foto per l'ospite illustre.", "error");
      return;
    }
    if (uploadingFotoOspite) {
      showToast("Attendi il completamento del caricamento della foto...", "info");
      return;
    }

    let finalFotoUrl = formOspite.fotoUrl;
    if (finalFotoUrl.startsWith('blob:')) {
      try {
        const resp = await fetch(finalFotoUrl);
        const bl = await resp.blob();
        const reader = new FileReader();
        finalFotoUrl = await new Promise<string>((res) => {
          reader.onloadend = () => res(reader.result as string || finalFotoUrl);
          reader.onerror = () => res(finalFotoUrl);
          reader.readAsDataURL(bl);
        });
      } catch (e) {}
    }

    const eventiValidi = (formOspite.eventiPartecipazione || []).filter(e => e.anno?.trim() || e.evento?.trim());
    const fallbackAnno = eventiValidi.map(e => e.anno?.trim()).filter(Boolean).join(' - ') || formOspite.anno || '2024';
    const fallbackOccasione = eventiValidi.map(e => e.evento?.trim()).filter(Boolean).join(' - ') || formOspite.occasione || 'Ospite NVA';

    const payload: Omit<OspiteIllustre, 'id'> = {
      ...formOspite,
      eventiPartecipazione: eventiValidi,
      anno: fallbackAnno,
      occasione: fallbackOccasione,
      fotoUrl: finalFotoUrl
    };

    try {
      setSavingOspite(true);
      if (editingOspiteId) {
        await updateOspiteIllustre(editingOspiteId, payload);
        const updated = ospiti.map(item => item.id === editingOspiteId ? { ...item, ...payload, id: editingOspiteId } : item);
        setOspiti(updated);
        try {
          localStorage.setItem(OSPITI_CACHE_KEY, JSON.stringify(updated));
        } catch (e) {}
        showToast("Ospite illustre aggiornato con successo!", "success");
      } else {
        const nuovo = await addOspiteIllustre(payload);
        const updated = [...ospiti, nuovo];
        setOspiti(updated);
        try {
          localStorage.setItem(OSPITI_CACHE_KEY, JSON.stringify(updated));
        } catch (e) {}
        showToast("Nuovo ospite illustre registrato con successo!", "success");
      }
      setIsOspiteModalOpen(false);
      setEditingOspiteId(null);
    } catch (err) {
      console.error(err);
      showToast("Errore durante il salvataggio: " + (err instanceof Error ? err.message : String(err)), "error");
    } finally {
      setSavingOspite(false);
    }
  };

  return (
    <div className="space-y-6 text-sm font-sans" id="admin-tab-hall-of-fame">
      
      {/* Header bar con Sub-Tabs */}
      <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-amber-600 font-semibold text-xs uppercase tracking-wider">
              <Trophy className="w-4 h-4" />
              <span>Hall of Fame &amp; Albo d'Oro</span>
            </div>
            <h3 className="text-xl font-bold text-zinc-950 mt-1">
              {activeSection === 'nostri' 
                ? "Quadri d'Onore delle Nostre Giocatrici e Giocatori" 
                : "Campioni & Ospiti Illustri Passati dalla Società"}
            </h3>
            <p className="text-zinc-500 text-xs mt-0.5">
              {activeSection === 'nostri'
                ? "Gestisci i quadri appesi alla parete museale: targhette d'oro, premi territoriali, regionali e nazionali."
                : "Gestisci i grandi campioni, personalità e tecnici che hanno visitato o partecipato alle attività NVA."}
            </p>
          </div>

          <button
            onClick={activeSection === 'nostri' ? handleOpenAdd : handleOpenAddOspite}
            className="bg-zinc-950 hover:bg-[#FFE600] text-[#FFE600] hover:text-black font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 text-xs uppercase font-barlow tracking-wider cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{activeSection === 'nostri' ? "Nuovo Quadro d'Onore" : "Nuovo Ospite Illustre"}</span>
          </button>
        </div>

        {/* Sub-Tabs Switcher & Counter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSection('nostri')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeSection === 'nostri'
                  ? 'bg-zinc-950 text-[#FFE600] shadow'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Albo d'Oro Pantere ({atleti.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('ospiti')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeSection === 'ospiti'
                  ? 'bg-amber-500 text-black font-black shadow'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              <Star className="w-4 h-4" />
              <span>Ospiti Illustri &amp; Leggende ({ospiti.length})</span>
            </button>
          </div>

          <div className="text-xs text-zinc-500 font-mono">
            {activeSection === 'nostri' ? (
              <span><strong>{atleti.length}</strong> quadri esposti</span>
            ) : (
              <span><strong>{ospiti.length}</strong> ospiti illustri registrati</span>
            )}
          </div>
        </div>
      </div>

      {/* VISTA 1: ALBO D'ORO ATLETI NOSTRI */}
      {activeSection === 'nostri' && (
        <>
          {loading && atleti.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((sk) => (
                <div key={sk} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 animate-pulse space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-20 aspect-[3/4] bg-zinc-850 rounded border border-zinc-800" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-zinc-800 rounded w-1/3" />
                      <div className="h-5 bg-zinc-700 rounded w-2/3" />
                      <div className="h-3 bg-zinc-800 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="pt-3 border-t border-zinc-850 flex justify-between">
                    <div className="h-3 bg-zinc-800 rounded w-1/4" />
                    <div className="h-6 bg-zinc-800 rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : atleti.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center space-y-3">
              <Trophy className="w-12 h-12 text-zinc-300 mx-auto" />
              <h4 className="text-base font-bold text-zinc-800">Nessun quadro presente nell'Albo d'Oro</h4>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                La galleria è attualmente vuota. Clicca sul pulsante "+ Nuovo Quadro d'Onore" in alto a destra per inserire la prima giocatrice o giocatore premiato.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {atleti.map((item) => (
                <div 
                  key={item.id}
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white shadow-md flex flex-col justify-between space-y-4 relative group"
                >
                  {item.inEvidenza && (
                    <span className="absolute top-3 right-3 bg-[#FFE600] text-black text-[10px] font-black font-barlow px-2 py-0.5 rounded uppercase tracking-wider shadow">
                      ⭐ D'Onore
                    </span>
                  )}

                  <div className="flex items-start gap-4">
                    {/* Mini quadro con cornice dorata */}
                    <div className="w-20 aspect-[3/4] shrink-0 bg-[#141518] p-1 rounded border border-[#FFE600]/40 shadow">
                      <div className="bg-[#f5f3ed] p-1 rounded w-full h-full overflow-hidden">
                        <img 
                          src={item.fotoUrl} 
                          alt={item.nome}
                          className="w-full h-full object-cover rounded-xs"
                          style={{
                            objectPosition: `${item.fotoPositionX ?? 50}% ${item.fotoPositionY ?? 30}%`
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-[#FFE600] font-mono font-bold">
                        <Calendar className="w-3 h-3" />
                        <span>{item.anno}</span>
                      </div>
                      <h4 className="font-black font-barlow text-base uppercase text-white truncate">
                        {item.nome}
                      </h4>
                      <p className="text-xs font-mono font-semibold text-amber-400 truncate">
                        {item.titoloPremio}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate font-inter">
                        {item.categoria} {item.ruolo ? `• ${item.ruolo}` : ''}
                      </p>
                      {item.giocatoreId && (
                        <div className="pt-0.5">
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-mono font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                            <Link className="w-2.5 h-2.5" />
                            <span>Rosa Ufficiale</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Azioni Admin */}
                  <div className="pt-3 border-t border-zinc-850 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-zinc-500">#{item.ordine ?? 1}</span>
                      {item.sfondoUrl === 'none' ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-850 text-zinc-400 font-mono border border-zinc-700">
                          🌑 Fumé
                        </span>
                      ) : item.sfondoUrl ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 font-mono border border-amber-800/50">
                          🖼️ Custom
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 font-mono border border-blue-800/50">
                          🏟️ Stadio
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer transition-colors"
                        title="Modifica quadro"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.nome)}
                        className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-400 cursor-pointer transition-colors"
                        title="Elimina quadro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* VISTA 2: OSPITI ILLUSTRI & LEGGENDE */}
      {activeSection === 'ospiti' && (
        <>
          {loading && ospiti.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((sk) => (
                <div key={sk} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 animate-pulse space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-20 aspect-[3/4] bg-zinc-850 rounded border border-zinc-800" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-zinc-800 rounded w-1/3" />
                      <div className="h-5 bg-zinc-700 rounded w-2/3" />
                      <div className="h-3 bg-zinc-800 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : ospiti.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center space-y-3">
              <Star className="w-12 h-12 text-amber-400 mx-auto" />
              <h4 className="text-base font-bold text-zinc-800">Nessun ospite illustre registrato</h4>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Non hai ancora inserito campioni o personalità illustri passati dalla società. Clicca su "+ Nuovo Ospite Illustre" in alto per aggiungere la prima stella.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ospiti.map((item) => (
                <div 
                  key={item.id}
                  className="bg-zinc-950 border border-amber-500/20 hover:border-amber-400/50 rounded-2xl p-4 text-white shadow-md flex flex-col justify-between space-y-4 relative group transition-all"
                >
                  {item.inEvidenza && (
                    <span className="absolute top-3 right-3 bg-amber-400 text-black text-[10px] font-black font-barlow px-2 py-0.5 rounded uppercase tracking-wider shadow">
                      ⭐ Leggenda
                    </span>
                  )}

                  <div className="flex items-start gap-4">
                    {/* Quadro Ospite con finitura argentata/dorata */}
                    <div className="w-20 aspect-[3/4] shrink-0 bg-[#16171b] p-1.5 rounded-lg border-2 border-amber-400/40 shadow-lg">
                      <div className="bg-black/60 rounded w-full h-full overflow-hidden">
                        <img 
                          src={item.fotoUrl} 
                          alt={item.nome}
                          className="w-full h-full object-cover"
                          style={{
                            objectPosition: `${item.fotoPositionX ?? 50}% ${item.fotoPositionY ?? 30}%`
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono font-bold">
                        <Calendar className="w-3 h-3" />
                        <span>{item.anno}</span>
                        {item.occasione && (
                          <span className="text-zinc-500">• {item.occasione}</span>
                        )}
                      </div>
                      <h4 className="font-black font-barlow text-base uppercase text-white truncate">
                        {item.nome}
                      </h4>
                      <p className="text-xs font-mono font-bold text-amber-300 truncate">
                        {item.ruoloTitolo}
                      </p>
                      {item.descrizione && (
                        <p className="text-[11px] text-zinc-400 line-clamp-2 font-inter leading-relaxed">
                          {item.descrizione}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Azioni Admin */}
                  <div className="pt-3 border-t border-zinc-850 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-500">Posizione #{item.ordine ?? 1}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditOspite(item)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer transition-colors"
                        title="Modifica ospite illustre"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteOspite(item.id, item.nome)}
                        className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-400 cursor-pointer transition-colors"
                        title="Elimina ospite"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* MODAL AGGIUNGI / MODIFICA QUADRO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-zinc-200 text-zinc-900 p-6 sm:p-8 space-y-6">
            
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-6 bg-[#FFE600] rounded-sm inline-block" />
                <h3 className="text-lg font-black font-barlow uppercase tracking-wider text-zinc-950">
                  {editingId ? "Modifica Quadro d'Onore" : "Nuovo Quadro nell'Albo d'Oro"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-zinc-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              
              {/* BANNER PESCA DA ATLETA DELLA ROSA */}
              {form.giocatoreId ? (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-400 text-black font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                      <Link className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5 flex-wrap">
                        <span>Collegato all'Atleta della Rosa:</span>
                        <span className="font-extrabold text-amber-950 underline">{form.nome}</span>
                      </div>
                      <div className="text-[11px] text-amber-800 flex items-center gap-2 mt-0.5 font-mono">
                        {form.categoria && <span>{form.categoria}</span>}
                        {form.ruolo && <span>• {form.ruolo}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => { setPickerSearch(''); setIsPickerOpen(true); }}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 text-xs font-bold font-barlow uppercase tracking-wider cursor-pointer transition-colors"
                    >
                      Cambia
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, giocatoreId: undefined }))}
                      className="p-1.5 rounded-lg text-amber-700 hover:text-red-600 hover:bg-amber-100 cursor-pointer transition-colors"
                      title="Scollega da atleta rosa"
                    >
                      <Unlink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-gradient-to-r from-amber-50 via-yellow-50/60 to-white border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FFE600] text-black font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-zinc-950 font-barlow">
                        Pesca da Atleta della Rosa ({giocatori.length} disponibili)
                      </h4>
                      <p className="text-[11px] text-zinc-600">
                        Importa istantaneamente anagrafica, squadra attuale, ruolo, storico e foto dalla rosa ufficiale.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setPickerSearch(''); setIsPickerOpen(true); }}
                    className="px-3.5 py-2 bg-zinc-950 hover:bg-[#FFE600] text-[#FFE600] hover:text-black font-extrabold text-xs uppercase font-barlow tracking-wider rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Scegli Giocatore</span>
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome e Cognome */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-zinc-700">Nome e Cognome Atleta *</label>
                  <input
                    type="text"
                    required
                    placeholder="es. Sofia Bianchi"
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                    value={form.nome}
                    onChange={e => setForm({ ...form, nome: e.target.value })}
                  />
                </div>

                {/* Titolo Premio */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-zinc-700">Premio / Riconoscimento Vinto *</label>
                  <input
                    type="text"
                    required
                    placeholder="es. MVP Campionato Regionale U16"
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                    value={form.titoloPremio}
                    onChange={e => setForm({ ...form, titoloPremio: e.target.value })}
                  />
                </div>

                {/* Stagione / Anno */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-zinc-700">Stagione / Anno *</label>
                  <input
                    type="text"
                    required
                    placeholder="es. 2024/2025"
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                    value={form.anno}
                    onChange={e => setForm({ ...form, anno: e.target.value })}
                  />
                </div>

                {/* Categoria / Squadra */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-zinc-700">Categoria / Squadra</label>
                  <input
                    type="text"
                    placeholder="es. Under 16 Femminile o Serie D"
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                    value={form.categoria || ''}
                    onChange={e => setForm({ ...form, categoria: e.target.value })}
                  />
                </div>

                {/* Ruolo */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-zinc-700">Ruolo in Campo</label>
                  <input
                    type="text"
                    placeholder="es. Palleggiatrice, Libero, Schiacciatrice..."
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                    value={form.ruolo || ''}
                    onChange={e => setForm({ ...form, ruolo: e.target.value })}
                  />
                </div>

                {/* Ordinamento */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-zinc-700">Priorità / Ordine Parete</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                    value={form.ordine ?? 1}
                    onChange={e => setForm({ ...form, ordine: parseInt(e.target.value, 10) || 1 })}
                  />
                </div>
              </div>

              {/* SEZIONE FOTO & REGOLATORE CENTRATURA CON ANTEPRIMA QUADRO */}
              <div className="p-4 bg-zinc-900 text-white rounded-2xl space-y-4 border border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#FFE600]" />
                    <span className="text-xs font-bold uppercase tracking-wider font-barlow text-[#FFE600]">
                      Fotografia per il Quadro &amp; Centratura
                    </span>
                  </div>
                  <label className="bg-[#FFE600] hover:bg-yellow-400 text-black px-3 py-1.5 rounded-xl font-barlow font-extrabold text-xs uppercase tracking-wider cursor-pointer flex items-center gap-1.5 shadow">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingFoto ? "Caricamento..." : "Carica Foto"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingFoto}
                      className="hidden"
                      onChange={handleFotoUpload}
                    />
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 items-center">
                  
                  {/* ANTEPRIMA REALISTICA DEL QUADRO IN TEMPO REALE */}
                  <div className="w-44 aspect-[3/4] shrink-0 bg-[#141518] p-2 rounded-lg border-2 border-[#FFE600]/40 shadow-2xl flex flex-col items-center justify-center relative">
                    {form.fotoUrl ? (
                      <div className="bg-[#f5f3ed] p-1.5 rounded w-full h-full overflow-hidden shadow-inner relative">
                        <img 
                          src={form.fotoUrl} 
                          alt="Anteprima" 
                          className="w-full h-full object-cover rounded-xs"
                          style={{
                            objectPosition: `${form.fotoPositionX ?? 50}% ${form.fotoPositionY ?? 30}%`
                          }}
                        />
                        {uploadingFoto && (
                          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 p-2">
                            <div className="w-6 h-6 border-2 border-[#FFE600] border-t-transparent rounded-full animate-spin" />
                            <span className="text-[10px] font-mono text-[#FFE600] uppercase tracking-wider text-center font-bold">
                              Salvataggio Foto...
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center p-3 text-zinc-500 space-y-1">
                        <Camera className="w-8 h-8 mx-auto stroke-1" />
                        <span className="text-[10px] font-mono">Nessuna foto</span>
                      </div>
                    )}
                  </div>

                  {/* SLIDERS CENTRATURA X E Y */}
                  <div className="flex-1 w-full space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-zinc-400">Centratura Verticale (Y):</span>
                        <span className="text-[#FFE600] font-bold">{form.fotoPositionY ?? 30}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={form.fotoPositionY ?? 30}
                        onChange={e => setForm({ ...form, fotoPositionY: parseInt(e.target.value, 10) })}
                        className="w-full accent-[#FFE600] cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                        <span>Alto (0%)</span>
                        <span>Centro (50%)</span>
                        <span>Basso (100%)</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-zinc-400">Centratura Orizzontale (X):</span>
                        <span className="text-[#FFE600] font-bold">{form.fotoPositionX ?? 50}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={form.fotoPositionX ?? 50}
                        onChange={e => setForm({ ...form, fotoPositionX: parseInt(e.target.value, 10) })}
                        className="w-full accent-[#FFE600] cursor-pointer"
                      />
                    </div>

                    {/* URL Diretto opzionale */}
                    <div className="pt-2">
                      <input
                        type="url"
                        placeholder="Oppure inserisci URL immagine https://..."
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2 text-xs text-zinc-200"
                        value={form.fotoUrl}
                        onChange={e => setForm({ ...form, fotoUrl: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SEZIONE FOTO DI SFONDO SCHERMATA IMMERSIVA (STADIO / PALAZZETTO) */}
              <div className="p-4 bg-zinc-900 text-white rounded-2xl space-y-4 border border-zinc-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#FFE600]" />
                    <span className="text-xs font-bold uppercase tracking-wider font-barlow text-[#FFE600]">
                      Foto Sfondo Schermo Immersivo (Stadio / Palazzetto)
                    </span>
                  </div>
                  <label className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-xl font-barlow font-bold text-xs uppercase tracking-wider cursor-pointer flex items-center gap-1.5 border border-zinc-700">
                    <Upload className="w-3.5 h-3.5 text-[#FFE600]" />
                    <span>{uploadingSfondo ? "Caricamento..." : "Carica Altro Sfondo"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingSfondo}
                      className="hidden"
                      onChange={handleSfondoUpload}
                    />
                  </label>
                </div>

                <p className="text-[11px] text-zinc-400">
                  Scegli cosa mostrare sullo sfondo quando l'utente clicca sul quadro per visualizzare la scheda completa dell'atleta.
                </p>

                {/* Scelta modalità sfondo a 4 pulsanti */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, sfondoUrl: 'foto_atleta' })}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      form.sfondoUrl === 'foto_atleta' || (!form.sfondoUrl && form.fotoUrl)
                        ? 'bg-[#FFE600] text-black font-black shadow-md border-[#FFE600]'
                        : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <span>📸 Foto Giocatore</span>
                    <span className="text-[10px] opacity-80 font-normal">Allargata &amp; Sfocata</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, sfondoUrl: 'palazzetto' })}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      form.sfondoUrl === 'palazzetto' || form.sfondoUrl === '/images/palazzetto-sfondo.jpg'
                        ? 'bg-[#FFE600] text-black font-black shadow-md border-[#FFE600]'
                        : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <span>🏟️ Palazzetto NVA</span>
                    <span className="text-[10px] opacity-80 font-normal">Campo con Spalti</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, sfondoUrl: 'none' })}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      form.sfondoUrl === 'none'
                        ? 'bg-[#FFE600] text-black font-black shadow-md border-[#FFE600]'
                        : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <span>🌑 Nero Sfumato</span>
                    <span className="text-[10px] opacity-80 font-normal">Nessuna Immagine</span>
                  </button>

                  <div className="relative">
                    <input
                      type="url"
                      placeholder="Altro URL foto..."
                      className={`w-full h-full bg-zinc-800 border rounded-xl p-2.5 text-xs text-zinc-200 transition-colors ${
                        form.sfondoUrl && !['foto_atleta', 'palazzetto', 'none', '/images/palazzetto-sfondo.jpg'].includes(form.sfondoUrl)
                          ? 'border-[#FFE600] text-[#FFE600]'
                          : 'border-zinc-700'
                      }`}
                      value={['foto_atleta', 'palazzetto', 'none', '/images/palazzetto-sfondo.jpg'].includes(form.sfondoUrl || '') ? '' : form.sfondoUrl || ''}
                      onChange={e => setForm({ ...form, sfondoUrl: e.target.value })}
                    />
                    {form.sfondoUrl && !['foto_atleta', 'palazzetto', 'none', '/images/palazzetto-sfondo.jpg'].includes(form.sfondoUrl) && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, sfondoUrl: 'foto_atleta' })}
                        className="absolute right-2 top-3 text-zinc-400 hover:text-white cursor-pointer"
                        title="Torna a Foto Atleta"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* ANTEPRIMA VISIVA IN TEMPO REALE DELLO SFONDO IMMERSIVO */}
                {(() => {
                  const previewSfondoSrc = form.sfondoUrl === 'none'
                    ? null
                    : (form.sfondoUrl === 'palazzetto' || form.sfondoUrl === '/images/palazzetto-sfondo.jpg')
                    ? '/images/palazzetto-sfondo.jpg'
                    : (form.sfondoUrl === 'foto_atleta' || !form.sfondoUrl)
                    ? (form.fotoUrl || '/images/palazzetto-sfondo.jpg')
                    : form.sfondoUrl;

                  return (
                    <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-zinc-700/80 shadow-inner flex items-center justify-between p-4 bg-[#07080b]">
                      {previewSfondoSrc && (
                        <img 
                          src={previewSfondoSrc} 
                          alt="Anteprima Sfondo" 
                          className="absolute inset-0 w-full h-full object-cover filter blur-[8px] scale-110 brightness-[0.70] contrast-[1.05] transition-all duration-300"
                          style={{
                            objectPosition: `50% ${form.sfondoPositionY ?? 50}%`
                          }}
                        />
                      )}
                      {uploadingSfondo && (
                        <div className="absolute inset-0 z-20 bg-black/75 backdrop-blur-xs flex items-center justify-center gap-2.5">
                          <div className="w-5 h-5 border-2 border-[#FFE600] border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs font-mono text-[#FFE600] font-bold uppercase tracking-wider">
                            Caricamento sfondo su Storage...
                          </span>
                        </div>
                      )}
                      {/* Gradiente nero e faretto bilanciati per nitidezza */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#07080b]/90 via-[#07080b]/40 to-transparent pointer-events-none" />
                      <div className="absolute top-0 left-1/4 w-48 h-48 bg-[#FFE600]/15 rounded-full blur-3xl pointer-events-none" />

                      {/* Dettagli modalità attiva */}
                      <div className="relative z-10 space-y-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-300">
                          Anteprima Live Sfondo
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full text-xs font-black font-barlow tracking-wider uppercase shadow-sm bg-[#FFE600] text-black">
                            {form.sfondoUrl === 'none'
                              ? '🌑 Solo Nero Sfumato'
                              : (form.sfondoUrl === 'palazzetto' || form.sfondoUrl === '/images/palazzetto-sfondo.jpg')
                              ? '🏟️ Palazzetto NVA'
                              : (form.sfondoUrl === 'foto_atleta' || !form.sfondoUrl)
                              ? '📸 Foto Giocatore Ingrandita'
                              : '🖼️ Sfondo Personalizzato'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-200 font-inter">
                          {form.sfondoUrl === 'none'
                            ? 'Nessuna foto di sfondo, solo nero e faretto dorato.'
                            : (form.sfondoUrl === 'palazzetto' || form.sfondoUrl === '/images/palazzetto-sfondo.jpg')
                            ? 'Foto del Palazzetto ufficiale NVA.'
                            : (form.sfondoUrl === 'foto_atleta' || !form.sfondoUrl)
                            ? 'La foto stessa del giocatore allargata e sfocata a tutto schermo!'
                            : 'Foto personalizzata caricata da te.'}
                        </p>
                      </div>

                      {/* Mini foto giocatrice sopra lo sfondo */}
                      {form.fotoUrl && (
                        <div className="relative z-10 shrink-0 w-14 aspect-[3/4] rounded-xl overflow-hidden border-2 border-white/40 shadow-2xl bg-zinc-950">
                          <img 
                            src={form.fotoUrl} 
                            alt="Mini Atleta" 
                            className="w-full h-full object-cover"
                            style={{
                              objectPosition: `${form.fotoPositionX ?? 50}% ${form.fotoPositionY ?? 30}%`
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* SLIDER CENTRATURA VERTICALE SFONDO (DESKTOP & SMARTPHONE IN VERTICALE) */}
                {form.sfondoUrl !== 'none' && (
                  <div className="space-y-1 pt-1 border-t border-zinc-800">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-400">Centratura Verticale Sfondo (Mobile &amp; Verticale):</span>
                      <span className="text-[#FFE600] font-bold">{form.sfondoPositionY ?? 50}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={form.sfondoPositionY ?? 50}
                      onChange={e => setForm({ ...form, sfondoPositionY: parseInt(e.target.value, 10) })}
                      className="w-full accent-[#FFE600] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                      <span>Inquadra Alto (Spalti/Riflettori)</span>
                      <span>Centro (Campo da Gioco)</span>
                      <span>Inquadra Basso</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Descrizione / Motivazione */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-zinc-700">Motivazione / Racconto dell'Impresa</label>
                <textarea
                  rows={3}
                  placeholder="Racconta brevemente il traguardo o il momento della vittoria..."
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs text-zinc-900"
                  value={form.descrizione || ''}
                  onChange={e => setForm({ ...form, descrizione: e.target.value })}
                />
              </div>

              {/* SEZIONE PALMARÈS & ALTRI TITOLI VINTI */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-800">
                      Palmarès &amp; Altri Titoli Vinti ({form.premi?.length || 0})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newPremi = [...(form.premi || [])];
                      newPremi.push({
                        id: `p_${Date.now()}`,
                        titolo: '',
                        anno: form.anno || '2024/2025',
                        categoria: form.categoria || '',
                        descrizione: ''
                      });
                      setForm({ ...form, premi: newPremi });
                    }}
                    className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Aggiungi Altro Titolo</span>
                  </button>
                </div>

                {(!form.premi || form.premi.length === 0) ? (
                  <p className="text-[11px] text-zinc-500 italic">
                    Oltre al riconoscimento primario sopra, puoi inserire qui ulteriori vittorie e trofei conseguiti da questa giocatrice.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {form.premi.map((p, idx) => (
                      <div key={idx} className="p-3 bg-white border border-zinc-200 rounded-xl space-y-2 relative shadow-xs">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = form.premi?.filter((_, i) => i !== idx);
                            setForm({ ...form, premi: updated });
                          }}
                          className="absolute top-2 right-2 text-zinc-400 hover:text-red-600 p-1 cursor-pointer"
                          title="Rimuovi trofeo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="Stagione es. 2023/2024"
                            className="bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-xs"
                            value={p.anno}
                            onChange={e => {
                              const updated = [...(form.premi || [])];
                              updated[idx].anno = e.target.value;
                              setForm({ ...form, premi: updated });
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Titolo es. Miglior Difensore Coppa"
                            className="sm:col-span-2 bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-xs font-semibold"
                            value={p.titolo}
                            onChange={e => {
                              const updated = [...(form.premi || [])];
                              updated[idx].titolo = e.target.value;
                              setForm({ ...form, premi: updated });
                            }}
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Motivazione o dettaglio vittoria (facoltativo)..."
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-xs"
                          value={p.descrizione || ''}
                          onChange={e => {
                            const updated = [...(form.premi || [])];
                            updated[idx].descrizione = e.target.value;
                            setForm({ ...form, premi: updated });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Checkbox Quadro d'Onore (In Evidenza) */}
              <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                <input
                  type="checkbox"
                  id="inEvidenza"
                  checked={form.inEvidenza || false}
                  onChange={e => setForm({ ...form, inEvidenza: e.target.checked })}
                  className="w-4 h-4 accent-[#FFE600] cursor-pointer"
                />
                <label htmlFor="inEvidenza" className="text-xs font-bold text-zinc-800 cursor-pointer">
                  Metti in Evidenza come "Quadro d'Onore" (badge speciale ⭐)
                </label>
              </div>

              {/* Pulsanti invio */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 hover:bg-zinc-100 text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-zinc-950 hover:bg-[#FFE600] text-[#FFE600] hover:text-black font-extrabold text-xs uppercase font-barlow tracking-wider transition-all shadow cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Salvataggio..." : editingId ? "Salva Modifiche" : "Appendi Quadro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SELETTORE GIOCATORE DELLA ROSA */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-zinc-200 text-zinc-900 overflow-hidden">
            
            {/* Header del Picker */}
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-6 bg-[#FFE600] rounded-sm inline-block" />
                <div>
                  <h3 className="text-lg font-black font-barlow uppercase tracking-wider text-zinc-950">
                    Scegli Atleta dalla Rosa Ufficiale
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Seleziona una giocatrice o un giocatore per importare foto, squadra, ruolo e carriera.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPickerOpen(false)}
                className="p-2 text-zinc-400 hover:text-zinc-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ricerca Rapida */}
            <div className="p-4 border-b border-zinc-100 bg-zinc-50">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Cerca per nome, cognome, ruolo o squadra..."
                  value={pickerSearch}
                  onChange={e => setPickerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#FFE600] transition-colors"
                />
              </div>
            </div>

            {/* Lista Atleti Filtrati */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-zinc-100">
              {(() => {
                const searchLower = pickerSearch.toLowerCase().trim();
                const filtered = giocatori.filter(g => {
                  const nomeCompleto = `${g.nome} ${g.cognome}`.toLowerCase();
                  const ruolo = (g.ruolo || '').toLowerCase();
                  const squadra = getPlayerTeamName(g.id, g).toLowerCase();
                  return !searchLower || 
                    nomeCompleto.includes(searchLower) || 
                    ruolo.includes(searchLower) || 
                    squadra.includes(searchLower);
                });

                if (filtered.length === 0) {
                  return (
                    <div className="py-12 text-center text-zinc-400 space-y-2">
                      <Users className="w-8 h-8 mx-auto text-zinc-300" />
                      <p className="text-xs font-bold uppercase tracking-wider">Nessun atleta trovato</p>
                      <p className="text-[11px] text-zinc-500">Prova con un altro termine di ricerca o verifica i giocatori registrati.</p>
                    </div>
                  );
                }

                return filtered.map(g => {
                  const photo = g.foto?.url || g.foto_url;
                  const squadraName = getPlayerTeamName(g.id, g);
                  const isSelected = form.giocatoreId === g.id;

                  return (
                    <div 
                      key={g.id}
                      className={`pt-2.5 flex items-center justify-between gap-4 p-3 rounded-2xl transition-colors ${
                        isSelected ? 'bg-amber-50 border border-amber-200' : 'hover:bg-zinc-50'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Avatar */}
                        <div className="w-12 h-14 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-200 shrink-0 relative">
                          {photo ? (
                            <img 
                              src={photo} 
                              alt={`${g.nome} ${g.cognome}`} 
                              className="w-full h-full object-cover"
                              style={{
                                objectPosition: `${g.fotoPositionX ?? g.foto?.positionX ?? 50}% ${g.fotoPositionY ?? g.foto?.positionY ?? 30}%`
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-500">
                              <User className="w-6 h-6 stroke-1" />
                            </div>
                          )}
                          {g.numero_maglia ? (
                            <span className="absolute bottom-0 right-0 bg-[#FFE600] text-black text-[9px] font-black font-sport px-1 rounded-tl">
                              #{g.numero_maglia}
                            </span>
                          ) : null}
                        </div>

                        {/* Info Giocatore */}
                        <div className="min-w-0 space-y-0.5">
                          <h4 className="text-sm font-black font-barlow uppercase text-zinc-950 truncate">
                            {g.nome} {g.cognome}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
                            {g.ruolo && (
                              <span className="text-amber-600 font-bold">
                                {formatRuoloGiocatore(g.ruolo, (g as any).genere || 'F')}
                              </span>
                            )}
                            {squadraName && (
                              <span>• {squadraName}</span>
                            )}
                          </div>
                          {g.storico_manuale && g.storico_manuale.length > 0 && (
                            <div className="text-[10px] text-emerald-600 font-mono flex items-center gap-1">
                              <Trophy className="w-2.5 h-2.5" />
                              <span>{g.storico_manuale.length} trofei/tappe nello storico</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottone Selezione */}
                      <button
                        type="button"
                        onClick={() => handleSelectGiocatore(g)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase font-barlow tracking-wider cursor-pointer transition-all shrink-0 flex items-center gap-1.5 ${
                          isSelected 
                            ? 'bg-amber-500 text-black font-black shadow-sm'
                            : 'bg-zinc-950 hover:bg-[#FFE600] text-white hover:text-black'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Selezionato</span>
                          </>
                        ) : (
                          <span>Importa</span>
                        )}
                      </button>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between text-xs text-zinc-500">
              <span>{giocatori.length} atleti registrati nel database societario</span>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="px-4 py-2 rounded-xl border border-zinc-300 text-zinc-700 hover:bg-zinc-200 font-bold uppercase tracking-wider cursor-pointer"
              >
                Chiudi
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL NUOVO / MODIFICA OSPITE ILLUSTRE & LEGGENDA       */}
      {/* ======================================================== */}
      {isOspiteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-zinc-200 text-zinc-900 p-6 sm:p-8 space-y-6">
            
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-6 bg-amber-400 rounded-sm inline-block" />
                <h3 className="text-lg font-black font-barlow uppercase tracking-wider text-zinc-950">
                  {editingOspiteId ? "Modifica Ospite Illustre" : "Nuova Leggenda & Ospite d'Onore"}
                </h3>
              </div>
              <button
                onClick={() => setIsOspiteModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-zinc-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOspite} className="space-y-6">
              
              {/* Riga 1: Nome e Ruolo/Titolo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase text-zinc-700">Nome e Cognome *</label>
                  <input 
                    type="text" 
                    required
                    value={formOspite.nome}
                    onChange={e => setFormOspite({ ...formOspite, nome: e.target.value })}
                    placeholder="es. Osmany Juantorena"
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-hidden font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase text-zinc-700">Ruolo / Titolo Sportivo *</label>
                  <input 
                    type="text" 
                    required
                    value={formOspite.ruoloTitolo}
                    onChange={e => setFormOspite({ ...formOspite, ruoloTitolo: e.target.value })}
                    placeholder="es. Campione del Mondo • Schiacciatore"
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Eventi & Partecipazioni Distinte per Anno */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <label className="text-xs font-mono font-bold uppercase text-zinc-900 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <span>Partecipazioni & Eventi NVA (Divisi per Anno)</span>
                    </label>
                    <p className="text-[11px] text-zinc-500">
                      Aggiungi ciascun evento e anno separatamente per impaginarli in modo chiaro.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const current = formOspite.eventiPartecipazione && formOspite.eventiPartecipazione.length > 0
                        ? formOspite.eventiPartecipazione
                        : [{ anno: formOspite.anno || '2024', evento: formOspite.occasione || '' }];
                      const lastYear = current[current.length - 1]?.anno || '2026';
                      setFormOspite({
                        ...formOspite,
                        eventiPartecipazione: [...current, { anno: lastYear, evento: '' }]
                      });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-black text-xs font-bold uppercase flex items-center gap-1 cursor-pointer transition-all shadow-xs shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Aggiungi Partecipazione
                  </button>
                </div>

                <div className="space-y-2">
                  {(formOspite.eventiPartecipazione && formOspite.eventiPartecipazione.length > 0 
                    ? formOspite.eventiPartecipazione 
                    : [{ anno: formOspite.anno || '2024', evento: formOspite.occasione || '' }]
                  ).map((ev, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-zinc-200 shadow-2xs">
                      <div className="w-28 sm:w-32 shrink-0">
                        <label className="text-[10px] font-mono text-zinc-400 uppercase block">Anno</label>
                        <input
                          type="text"
                          value={ev.anno}
                          placeholder="es. 2024"
                          onChange={e => {
                            const updated = [...(formOspite.eventiPartecipazione || [{ anno: '', evento: '' }])];
                            updated[idx] = { ...updated[idx], anno: e.target.value };
                            setFormOspite({ ...formOspite, eventiPartecipazione: updated });
                          }}
                          className="w-full text-xs font-mono font-bold p-2 rounded-lg border border-zinc-300 focus:border-amber-400 focus:outline-hidden"
                        />
                      </div>

                      <div className="flex-1">
                        <label className="text-[10px] font-mono text-zinc-400 uppercase block">Nome Evento / Camp / Occasione</label>
                        <input
                          type="text"
                          value={ev.evento}
                          placeholder="es. Salfep Summer Camp 2024"
                          onChange={e => {
                            const updated = [...(formOspite.eventiPartecipazione || [{ anno: '', evento: '' }])];
                            updated[idx] = { ...updated[idx], evento: e.target.value };
                            setFormOspite({ ...formOspite, eventiPartecipazione: updated });
                          }}
                          className="w-full text-xs p-2 rounded-lg border border-zinc-300 focus:border-amber-400 focus:outline-hidden font-medium"
                        />
                      </div>

                      {(formOspite.eventiPartecipazione || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...(formOspite.eventiPartecipazione || [])];
                            updated.splice(idx, 1);
                            setFormOspite({ ...formOspite, eventiPartecipazione: updated });
                          }}
                          className="p-2 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors mt-3 cursor-pointer"
                          title="Rimuovi questo evento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sezione Foto con Upload rapido e Regolazione X/Y */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase text-zinc-900 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-amber-500" />
                      <span>Foto del Quadro Ospite *</span>
                    </h4>
                    <p className="text-[11px] text-zinc-500">Ottimizzazione WebP automatica ad alta velocità.</p>
                  </div>
                  <label className="cursor-pointer bg-zinc-950 hover:bg-amber-400 text-white hover:text-black font-bold text-xs uppercase px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingFotoOspite ? "Caricamento..." : "Carica Foto"}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFotoOspiteUpload}
                      disabled={uploadingFotoOspite}
                    />
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {/* Anteprima Quadro */}
                  <div className="w-28 aspect-[3/4] bg-[#16171b] p-1.5 rounded-lg border-2 border-amber-400/40 shadow-md shrink-0 relative overflow-hidden flex items-center justify-center">
                    {formOspite.fotoUrl ? (
                      <div className="w-full h-full bg-black/60 rounded overflow-hidden relative">
                        <img 
                          src={formOspite.fotoUrl} 
                          alt="Anteprima Ospite" 
                          className="w-full h-full object-cover"
                          style={{
                            objectPosition: `${formOspite.fotoPositionX ?? 50}% ${formOspite.fotoPositionY ?? 30}%`
                          }}
                        />
                        {uploadingFotoOspite && (
                          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 p-2">
                            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">Caricamento...</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center p-3 text-zinc-400 space-y-1">
                        <User className="w-8 h-8 mx-auto stroke-1" />
                        <span className="text-[10px] font-mono">Nessuna foto</span>
                      </div>
                    )}
                  </div>

                  {/* Slider Centratura */}
                  <div className="flex-1 w-full space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-zinc-600">Altezza Inquadratura (Y):</span>
                        <span className="font-bold text-amber-600">{formOspite.fotoPositionY ?? 30}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={formOspite.fotoPositionY ?? 30}
                        onChange={e => setFormOspite({ ...formOspite, fotoPositionY: Number(e.target.value) })}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-zinc-600">Centratura Orizzontale (X):</span>
                        <span className="font-bold text-amber-600">{formOspite.fotoPositionX ?? 50}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={formOspite.fotoPositionX ?? 50}
                        onChange={e => setFormOspite({ ...formOspite, fotoPositionX: Number(e.target.value) })}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Descrizione / Aneddoto */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase text-zinc-700">
                  Racconto della Visita / Aneddoto / Citazione
                </label>
                <textarea 
                  rows={3}
                  value={formOspite.descrizione || ''}
                  onChange={e => setFormOspite({ ...formOspite, descrizione: e.target.value })}
                  placeholder="es. Presente come testimonial d'eccezione, ha condotto una sessione tecnica speciale di attacco e motivato le nostre giovani atlete con il suo percorso in Superlega..."
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3 text-sm focus:border-amber-400 focus:outline-hidden leading-relaxed"
                />
              </div>

              {/* Frasi Ufficiali della Scheda Personaggio (Modificabili) */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-4">
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase text-zinc-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Dediche & Frasi della Scheda (Personalizzabili)</span>
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    Se lasci vuoto, vengono utilizzate le frasi celebrative predefinite. Puoi personalizzarle per scrivere testi specifici.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono font-bold uppercase text-zinc-700">
                      Frase 1 • L'Occasione del Passaggio
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormOspite({
                        ...formOspite,
                        testoPassaggio: `La New Volley Academy ha avuto l'onore di ospitare ${formOspite.nome || "l'ospite"} per condividere con atlete, atleti e staff tecnico l'esperienza, la dedizione e la mentalità che contraddistinguono i vertici della pallavolo italiana ed internazionale.`
                      })}
                      className="text-[10px] text-amber-600 hover:underline cursor-pointer"
                    >
                      Inserisci testo predefinito
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={formOspite.testoPassaggio || ''}
                    onChange={e => setFormOspite({ ...formOspite, testoPassaggio: e.target.value })}
                    placeholder={`La New Volley Academy ha avuto l'onore di ospitare ${formOspite.nome || "l'ospite"} per condividere con atlete, atleti e staff tecnico l'esperienza, la dedizione e la mentalità... (lascia vuoto per testo standard)`}
                    className="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-xs focus:border-amber-400 focus:outline-hidden leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono font-bold uppercase text-zinc-700">
                      Frase 2 • Ispirazione Continua per la Società
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormOspite({
                        ...formOspite,
                        testoIspirazione: `La presenza di campioni del calibro di ${formOspite.nome || "questo atleta"} testimonia l'impegno costante della New Volley Academy nella crescita sportiva, etica ed umana del nostro settore giovanile.`
                      })}
                      className="text-[10px] text-amber-600 hover:underline cursor-pointer"
                    >
                      Inserisci testo predefinito
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={formOspite.testoIspirazione || ''}
                    onChange={e => setFormOspite({ ...formOspite, testoIspirazione: e.target.value })}
                    placeholder={`La presenza di campioni del calibro di ${formOspite.nome || "questo atleta"} testimonia l'impegno costante della New Volley Academy nella crescita sportiva... (lascia vuoto per testo standard)`}
                    className="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-xs focus:border-amber-400 focus:outline-hidden leading-relaxed"
                  />
                </div>
              </div>

              {/* Opzioni: Ordine e In Evidenza */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="ospiteInEvidenza"
                    checked={formOspite.inEvidenza || false}
                    onChange={e => setFormOspite({ ...formOspite, inEvidenza: e.target.checked })}
                    className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                  />
                  <label htmlFor="ospiteInEvidenza" className="text-xs font-bold text-zinc-800 cursor-pointer select-none">
                    ⭐ Ospite d'Onore (In Evidenza con targa speciale)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-mono font-bold text-zinc-600">Ordine:</label>
                  <input 
                    type="number" 
                    min="1"
                    value={formOspite.ordine ?? 1}
                    onChange={e => setFormOspite({ ...formOspite, ordine: Number(e.target.value) })}
                    className="w-16 bg-white border border-zinc-300 rounded-lg p-1.5 text-center text-xs font-bold"
                  />
                </div>
              </div>

              {/* Pulsanti Azione */}
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsOspiteModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 font-bold hover:bg-zinc-100 text-xs uppercase cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={savingOspite || uploadingFotoOspite}
                  className="bg-amber-400 hover:bg-yellow-400 disabled:opacity-50 text-black font-extrabold px-6 py-2.5 rounded-xl transition-all shadow-md text-xs uppercase font-barlow tracking-wider cursor-pointer"
                >
                  {savingOspite ? "Salvataggio..." : (editingOspiteId ? "Aggiorna Ospite" : "Registra Ospite")}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}
    </div>
  );
}
