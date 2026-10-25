import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Save, 
  MapPin, 
  Plus, 
  Trash2, 
  Upload, 
  Users, 
  Image as ImageIcon,
  Building,
  Sparkles,
  UserCheck,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  UserPlus,
  Camera,
  Sliders,
  Check,
  Loader2
} from 'lucide-react';
import { collection, getDocs, query, updateDoc, doc } from 'firebase/firestore';
import { 
  db,
  isDemoMode,
  SocietaInfo, 
  SocietaConfig, 
  updateSocietaInfo, 
  updateSocietaConfig,
  updateSocietaSettings,
  caricaBlobSuStorage
} from '../../../firebase-societa';
import { compressImage, IMAGE_PRESETS } from '../../../utils/imageCompressor';
import { StaffProfilo } from './TabStaff';

interface TabPagineProps {
  societaInfo: SocietaInfo | null;
  setSocietaInfo: React.Dispatch<React.SetStateAction<SocietaInfo | null>>;
  societaConfig: SocietaConfig | null;
  setSocietaConfig: React.Dispatch<React.SetStateAction<SocietaConfig | null>>;
  societaSettings: any;
  setSocietaSettings: React.Dispatch<React.SetStateAction<any>>;
  loadAllData: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  caricaFileSuStorage: (file: File, path: string) => Promise<string>;
}

export default function TabPagine({
  societaInfo,
  setSocietaInfo,
  societaConfig,
  setSocietaConfig,
  societaSettings,
  setSocietaSettings,
  loadAllData,
  showToast,
  caricaFileSuStorage
}: TabPagineProps) {
  const [activeSection, setActiveSection] = useState<'info' | 'organigramma' | 'staff' | 'carosello' | 'palestre' | 'storia' | 'branding'>('info');
  const [isSaving, setIsSaving] = useState(false);

  // Available staff from Anagrafica Staff (staff_profili)
  const [availableStaff, setAvailableStaff] = useState<StaffProfilo[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('');
  const [newStaffQualifica, setNewStaffQualifica] = useState('');
  const hasAutoInitializedStaff = React.useRef(false);
  const [uploadingStaffId, setUploadingStaffId] = useState<string | null>(null);
  const [activePhotoAdjustId, setActivePhotoAdjustId] = useState<string | null>(null);

  // Carosello Foto Società states
  const [isUploadingCarosello, setIsUploadingCarosello] = useState(false);
  const [newCaroselloUrl, setNewCaroselloUrl] = useState('');

  // Auto-sync staffTecnico with availableStaff if empty or containing mock data
  useEffect(() => {
    if (availableStaff.length > 0 && societaConfig && !hasAutoInitializedStaff.current) {
      const mockNames = ['roberto baggio', 'ettore gulinelli', 'giulia neri', 'marco de marchi'];
      const currentList = societaConfig.staffTecnico || [];
      const cleanList = currentList.filter((s: any) =>
        s.profiloId || !mockNames.includes((s.nome || '').toLowerCase().trim())
      );
      if (cleanList.length === 0) {
        hasAutoInitializedStaff.current = true;
        const initialRealStaff = availableStaff.map((s, idx) => {
          const q = (s.qualificaTecnica || '').toLowerCase();
          const role = q.includes('direttore')
            ? 'Direttore Tecnico'
            : q.includes('allenat')
            ? 'Primo Allenatore'
            : q.includes('preparatore')
            ? 'Preparatore Atletico'
            : s.qualificaTecnica || 'Staff Tecnico';

          return {
            id: `st_${Date.now()}_${idx}`,
            profiloId: s.id,
            nome: s.nomeCognome,
            ruolo: role,
            qualifica: s.qualificaTecnica || '',
            ordine: idx + 1,
            fotoUrl: s.foto?.url || '',
            fotoPositionY: s.foto?.positionY ?? 50,
            fotoPositionX: s.foto?.positionX ?? 50
          };
        });
        setSocietaConfig(prev => prev ? ({ ...prev, staffTecnico: initialRealStaff, organigramma: initialRealStaff }) : null);
      } else if (cleanList.length !== currentList.length) {
        hasAutoInitializedStaff.current = true;
        setSocietaConfig(prev => prev ? ({ ...prev, staffTecnico: cleanList, organigramma: cleanList }) : null);
      }
    }
  }, [availableStaff, societaConfig?.staffTecnico]);

  // Fetch registered staff from Anagrafica Staff
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoadingStaff(true);
        if (isDemoMode) {
          const local = localStorage.getItem('staff_profili');
          if (local) setAvailableStaff(JSON.parse(local));
          return;
        }
        const snap = await getDocs(query(collection(db, 'staff_profili')));
        const list: StaffProfilo[] = [];
        snap.forEach(d => {
          list.push({ id: d.id, ...d.data() } as StaffProfilo);
        });
        setAvailableStaff(list);
      } catch (err) {
        console.error("Errore recupero anagrafica staff per organigramma:", err);
      } finally {
        setLoadingStaff(false);
      }
    };
    fetchStaff();
  }, []);

  // New Gym Form & Edit Gym State
  const [editingPalestraId, setEditingPalestraId] = useState<string | null>(null);
  const [newPalestra, setNewPalestra] = useState({
    nome: '',
    indirizzo: '',
    cap: '47121',
    citta: 'Forlì',
    capienza: '',
    note: ''
  });

  // Keep gyms aligned if societaInfo has no gyms but societaConfig does
  useEffect(() => {
    if (societaInfo && (!societaInfo.palestre || societaInfo.palestre.length === 0) && societaConfig?.palestre && societaConfig.palestre.length > 0) {
      setSocietaInfo(prev => prev ? ({
        ...prev,
        palestre: societaConfig.palestre!.map(p => ({
          id: p.id,
          nome: p.nome,
          indirizzo: p.indirizzo,
          citta: 'Forlì',
          cap: '47121',
          capienza: p.capienza ? parseInt(p.capienza.replace(/\D/g, ''), 10) || 0 : 0,
          note: p.note || ''
        }))
      }) : null);
    }
  }, [societaConfig?.palestre]);

  // Keep presidente/vice_presidente aligned from societaConfig if empty in societaInfo
  useEffect(() => {
    if (societaInfo && (!societaInfo.organigramma?.presidente) && societaConfig?.consiglioDirettivo) {
      const p = societaConfig.consiglioDirettivo.find(m => (m.ruolo || '').toLowerCase().includes('presidente') && !(m.ruolo || '').toLowerCase().includes('vice'));
      const vp = societaConfig.consiglioDirettivo.find(m => (m.ruolo || '').toLowerCase().includes('vice'));
      if (p || vp) {
        setSocietaInfo(prev => prev ? ({
          ...prev,
          organigramma: {
            ...(prev.organigramma || {}),
            presidente: prev.organigramma?.presidente || p?.nome || '',
            vice_presidente: prev.organigramma?.vice_presidente || vp?.nome || '',
            direttivo: prev.organigramma?.direttivo || []
          }
        }) : null);
      }
    }
  }, [societaConfig?.consiglioDirettivo]);

  // 1. Salvataggio Dati Istituzionali & Organigramma
  const handleSaveInfo = async () => {
    if (!societaInfo) return;
    try {
      setIsSaving(true);

      const cleanPalestre = (societaInfo.palestre || []).map(p => ({
        id: p.id || `pal_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        nome: (p.nome || '').trim(),
        indirizzo: (p.indirizzo || '').trim(),
        citta: (p.citta || 'Forlì').trim(),
        cap: (p.cap || '47121').trim(),
        capienza: typeof p.capienza === 'string' ? parseInt(p.capienza, 10) || 0 : (p.capienza || 0),
        note: (p.note || '').trim()
      }));

      // 2. Synchronize Consiglio Direttivo
      const presNome = (societaInfo.organigramma?.presidente || '').trim();
      const vpNome = (societaInfo.organigramma?.vice_presidente || '').trim();
      const dtNome = (societaInfo.organigramma?.direttore_tecnico || '').trim();
      const rsgNome = (societaInfo.organigramma?.responsabile_settore_giovanile || '').trim();

      const direttivoSync: Array<{ id: string; ruolo: string; nome: string; ordine: number }> = [];
      if (presNome) {
        direttivoSync.push({ id: 'dir-pres', ruolo: 'Presidente', nome: presNome, ordine: 1 });
      }
      if (vpNome) {
        direttivoSync.push({ id: 'dir-vp', ruolo: 'Vice Presidente', nome: vpNome, ordine: 2 });
      }

      // Preserve other board members from societaConfig
      const existingMembers = societaConfig?.consiglioDirettivo || [];
      existingMembers.forEach((m, idx) => {
        const r = (m.ruolo || '').toLowerCase().trim();
        if (r === 'presidente' || r === 'vice presidente' || r.includes('vice')) return;
        direttivoSync.push({
          id: m.id || `dir-other-${idx}`,
          ruolo: m.ruolo,
          nome: m.nome,
          ordine: direttivoSync.length + 1
        });
      });

      // 3. Prepare clean updated societaInfo
      const updatedSocietaInfo: SocietaInfo = {
        ...societaInfo,
        palestre: cleanPalestre,
        organigramma: {
          ...societaInfo.organigramma,
          presidente: presNome,
          vice_presidente: vpNome,
          direttore_tecnico: dtNome,
          responsabile_settore_giovanile: rsgNome,
          direttivo: direttivoSync.map(d => ({ ruolo: d.ruolo, nome: d.nome })),
          staff_tecnico: societaInfo.organigramma?.staff_tecnico || []
        }
      };

      // 4. Save societaInfo
      await updateSocietaInfo(updatedSocietaInfo);
      setSocietaInfo(updatedSocietaInfo);

      // 5. Sync societaConfig with safety try-catch
      try {
        const palestreForConfig = cleanPalestre.map((p, idx) => ({
          id: p.id,
          nome: p.nome,
          indirizzo: p.indirizzo,
          capienza: p.capienza ? `${p.capienza} Spettatori` : '',
          note: p.note,
          ordine: idx + 1
        }));

        const updatedConfig: SocietaConfig = {
          ...(societaConfig || {} as any),
          sedeLegale: updatedSocietaInfo.sede_legale || societaConfig?.sedeLegale || '',
          email: updatedSocietaInfo.contatti?.email || societaConfig?.email || '',
          telefono: updatedSocietaInfo.contatti?.telefono || societaConfig?.telefono || '',
          pec: updatedSocietaInfo.contatti?.pec || societaConfig?.pec || '',
          consiglioDirettivo: direttivoSync,
          palestre: palestreForConfig
        };

        await updateSocietaConfig(updatedConfig);
        setSocietaConfig(updatedConfig);
      } catch (syncErr) {
        console.warn("Avviso sync secondario societaConfig:", syncErr);
      }

      showToast("Dati istituzionali e organigramma salvati con successo!", "success");
      await loadAllData();
    } catch (e: any) {
      console.error("Errore salvataggio dati istituzionali:", e);
      showToast("Errore durante il salvataggio: " + (e?.message || ""), "error");
    } finally {
      setIsSaving(false);
    }
  };

  // 2. Salvataggio Specifico e Autonomo Palestre
  const handleSavePalestre = async () => {
    if (!societaInfo) return;
    try {
      setIsSaving(true);
      const cleanPalestre = (societaInfo.palestre || []).map(p => ({
        id: p.id || `pal_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        nome: (p.nome || '').trim(),
        indirizzo: (p.indirizzo || '').trim(),
        citta: (p.citta || 'Forlì').trim(),
        cap: (p.cap || '47121').trim(),
        capienza: typeof p.capienza === 'string' ? parseInt(p.capienza, 10) || 0 : (p.capienza || 0),
        note: (p.note || '').trim()
      }));

      const updatedInfo: SocietaInfo = {
        ...societaInfo,
        palestre: cleanPalestre
      };

      await updateSocietaInfo(updatedInfo);
      setSocietaInfo(updatedInfo);

      // Allinea anche societaConfig in modo sicuro
      try {
        const palestreForConfig = cleanPalestre.map((p, idx) => ({
          id: p.id,
          nome: p.nome,
          indirizzo: p.indirizzo,
          capienza: p.capienza ? `${p.capienza} Spettatori` : '',
          note: p.note,
          ordine: idx + 1
        }));
        if (societaConfig) {
          const updatedConfig: SocietaConfig = {
            ...societaConfig,
            palestre: palestreForConfig
          };
          await updateSocietaConfig(updatedConfig);
          setSocietaConfig(updatedConfig);
        }
      } catch (err) {
        console.warn("Avviso allineamento config palestre:", err);
      }

      showToast("Elenco palestre salvato con successo!", "success");
      await loadAllData();
    } catch (e: any) {
      console.error("Errore salvataggio palestre:", e);
      showToast("Errore durante il salvataggio delle palestre: " + (e?.message || ""), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!societaConfig) return;
    try {
      setIsSaving(true);
      await updateSocietaConfig(societaConfig);
      showToast("Configurazione societaria e testi aggiornati!", "success");
      await loadAllData();
    } catch (e) {
      showToast("Errore durante il salvataggio della configurazione.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPalestra = () => {
    if (!societaInfo || !newPalestra.nome.trim() || !newPalestra.indirizzo.trim()) {
      showToast("Inserisci almeno il nome della palestra e l'indirizzo.", "error");
      return;
    }

    if (editingPalestraId) {
      // Modifica palestra esistente
      const updated = {
        ...societaInfo,
        palestre: (societaInfo.palestre || []).map(p => p.id === editingPalestraId ? {
          ...p,
          nome: newPalestra.nome.trim(),
          indirizzo: newPalestra.indirizzo.trim(),
          cap: newPalestra.cap?.trim() || '47121',
          citta: newPalestra.citta?.trim() || 'Forlì',
          capienza: newPalestra.capienza ? parseInt(newPalestra.capienza, 10) || 0 : 0,
          note: newPalestra.note?.trim() || ''
        } : p)
      };
      setSocietaInfo(updated);
      setEditingPalestraId(null);
      setNewPalestra({ nome: '', indirizzo: '', cap: '47121', citta: 'Forlì', capienza: '', note: '' });
      showToast("Dati palestra aggiornati in elenco! Clicca 'Salva Modifiche Palestre' per confermare.", "info");
      return;
    }

    const updated = {
      ...societaInfo,
      palestre: [
        ...(societaInfo.palestre || []),
        {
          id: `pal_${Date.now()}`,
          nome: newPalestra.nome.trim(),
          indirizzo: newPalestra.indirizzo.trim(),
          cap: newPalestra.cap?.trim() || '47121',
          citta: newPalestra.citta?.trim() || 'Forlì',
          capienza: newPalestra.capienza ? parseInt(newPalestra.capienza, 10) || 0 : 0,
          note: newPalestra.note?.trim() || ''
        }
      ]
    };
    setSocietaInfo(updated);
    setNewPalestra({ nome: '', indirizzo: '', cap: '47121', citta: 'Forlì', capienza: '', note: '' });
    showToast("Palestra inserita in elenco! Clicca 'Salva Modifiche Palestre' per confermare.", "info");
  };

  const handleStartEditPalestra = (p: any) => {
    setEditingPalestraId(p.id);
    setNewPalestra({
      nome: p.nome || '',
      indirizzo: p.indirizzo || '',
      cap: p.cap || '47121',
      citta: p.citta || 'Forlì',
      capienza: p.capienza ? String(p.capienza) : '',
      note: p.note || ''
    });
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleCancelEditPalestra = () => {
    setEditingPalestraId(null);
    setNewPalestra({ nome: '', indirizzo: '', cap: '47121', citta: 'Forlì', capienza: '', note: '' });
  };

  const handleRemovePalestra = (id: string) => {
    if (!societaInfo) return;
    if (editingPalestraId === id) {
      handleCancelEditPalestra();
    }
    setSocietaInfo({
      ...societaInfo,
      palestre: (societaInfo.palestre || []).filter(p => p.id !== id)
    });
    showToast("Palestra rimossa. Clicca 'Salva Modifiche Palestre' per confermare.", "info");
  };

  // Staff Tecnico & Dirigenziale Handlers
  const onSelectStaff = (id: string) => {
    setSelectedStaffId(id);
    const found = availableStaff.find(s => s.id === id);
    if (found) {
      const q = (found.qualificaTecnica || '').toLowerCase();
      const suggestedRole = q.includes('direttore')
        ? 'Direttore Tecnico'
        : q.includes('allenat')
        ? 'Primo Allenatore'
        : q.includes('preparatore')
        ? 'Preparatore Atletico'
        : found.qualificaTecnica || 'Staff Tecnico';
      setNewStaffRole(suggestedRole);
      setNewStaffQualifica(found.qualificaTecnica || '');
    }
  };

  const handleAddStaffToOrganigramma = () => {
    if (!selectedStaffId) {
      showToast("Seleziona prima un membro dall'elenco di Anagrafica Staff.", "error");
      return;
    }
    const found = availableStaff.find(s => s.id === selectedStaffId);
    if (!found) return;

    const currentList = societaConfig?.staffTecnico || [];
    if (currentList.some(s => s.profiloId === selectedStaffId)) {
      showToast(`${found.nomeCognome} è già presente nell'elenco dello Staff.`, "info");
      return;
    }

    const newItem = {
      id: `st_${Date.now()}`,
      profiloId: found.id,
      nome: found.nomeCognome,
      ruolo: newStaffRole.trim() || found.qualificaTecnica || 'Staff Tecnico',
      qualifica: newStaffQualifica.trim() || found.qualificaTecnica || '',
      ordine: currentList.length + 1,
      fotoUrl: found.foto?.url || '',
      fotoPositionY: found.foto?.positionY ?? 50,
      fotoPositionX: found.foto?.positionX ?? 50
    };

    const updated = [...currentList, newItem];
    setSocietaConfig(prev => prev ? ({
      ...prev,
      staffTecnico: updated,
      organigramma: updated
    }) : null);

    setSelectedStaffId('');
    setNewStaffRole('');
    setNewStaffQualifica('');
    showToast(`${found.nomeCognome} aggiunto allo staff! Ricordati di salvare le modifiche.`, "success");
  };

  const handleImportAllStaff = () => {
    if (availableStaff.length === 0) {
      showToast("Nessun profilo trovato in Anagrafica Staff.", "error");
      return;
    }
    const imported = availableStaff.map((s, idx) => {
      const q = (s.qualificaTecnica || '').toLowerCase();
      const role = q.includes('direttore')
        ? 'Direttore Tecnico'
        : q.includes('allenat')
        ? 'Primo Allenatore'
        : q.includes('preparatore')
        ? 'Preparatore Atletico'
        : s.qualificaTecnica || 'Staff Tecnico';

      return {
        id: `st_${Date.now()}_${idx}`,
        profiloId: s.id,
        nome: s.nomeCognome,
        ruolo: role,
        qualifica: s.qualificaTecnica || '',
        ordine: idx + 1,
        fotoUrl: s.foto?.url || '',
        fotoPositionY: s.foto?.positionY ?? 50,
        fotoPositionX: s.foto?.positionX ?? 50
      };
    });

    setSocietaConfig(prev => prev ? ({
      ...prev,
      staffTecnico: imported,
      organigramma: imported
    }) : null);

    showToast(`Importati ${imported.length} membri da Anagrafica Staff! Modifica i ruoli desiderati e clicca Salva.`, "success");
  };

  const handleClearStaff = () => {
    setSocietaConfig(prev => prev ? ({
      ...prev,
      staffTecnico: [],
      organigramma: []
    }) : null);
    showToast("Elenco staff svuotato. Clicca Salva per confermare.", "info");
  };

  const handleRemoveStaffItem = (id: string) => {
    setSocietaConfig(prev => {
      if (!prev) return null;
      const filtered = (prev.staffTecnico || []).filter(item => item.id !== id);
      return {
        ...prev,
        staffTecnico: filtered,
        organigramma: filtered
      };
    });
  };

  const handleMoveStaff = (index: number, direction: 'up' | 'down') => {
    if (!societaConfig?.staffTecnico) return;
    const list = [...societaConfig.staffTecnico];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    const updated = list.map((item, idx) => ({ ...item, ordine: idx + 1 }));
    setSocietaConfig(prev => prev ? ({ ...prev, staffTecnico: updated, organigramma: updated }) : null);
  };

  const handleUploadStaffPhoto = async (file: File, member: any, index: number) => {
    const memberKey = member.id || member.profiloId || `idx_${index}`;
    try {
      setUploadingStaffId(memberKey);
      showToast(`Ottimizzazione e caricamento foto per ${member.nome}...`, 'info');

      let newPhotoUrl = '';
      try {
        const compResult = await compressImage(file, IMAGE_PRESETS.ATLETA);
        newPhotoUrl = await caricaBlobSuStorage(compResult.blob, `staff/${Date.now()}_${(member.nome || 'coach').replace(/\s+/g, '_')}.webp`);
      } catch (compErr) {
        newPhotoUrl = await caricaFileSuStorage(file, `staff/${Date.now()}_${file.name}`);
      }

      // Find matching staff profile in availableStaff
      const matched = (member.profiloId ? availableStaff.find(s => s.id === member.profiloId) : null) || 
        availableStaff.find(s => s.nomeCognome?.toLowerCase().trim() === (member.nome || '').toLowerCase().trim());

      const targetProfiloId = member.profiloId || matched?.id;

      // 1. If linked to anagrafica staff_profili, update Firestore doc
      if (targetProfiloId && !isDemoMode) {
        try {
          await updateDoc(doc(db, 'staff_profili', targetProfiloId), {
            'foto.url': newPhotoUrl
          });
        } catch (dbErr) {
          console.error("Errore aggiornamento staff_profili:", dbErr);
        }
      }

      // 2. Update local availableStaff state
      if (targetProfiloId) {
        setAvailableStaff(prev => prev.map(s => s.id === targetProfiloId ? {
          ...s,
          foto: { ...(s.foto || { positionY: 50, positionX: 50 }), url: newPhotoUrl }
        } : s));
      }

      // 3. Update societaConfig.staffTecnico & organigramma
      const currentList = societaConfig?.staffTecnico || [];
      const updatedList = currentList.map((m, i) => {
        if (i === index) {
          return {
            ...m,
            profiloId: targetProfiloId || m.profiloId,
            fotoUrl: newPhotoUrl
          };
        }
        return m;
      });

      const updatedConfig = {
        ...(societaConfig || {}),
        staffTecnico: updatedList,
        organigramma: updatedList
      };

      setSocietaConfig(prev => prev ? ({
        ...prev,
        staffTecnico: updatedList,
        organigramma: updatedList
      }) : null);

      if (!isDemoMode && societaConfig) {
        await updateSocietaConfig(updatedConfig as any);
      }

      showToast(`Foto di ${member.nome} aggiornata e salvata!`, 'success');
      setActivePhotoAdjustId(memberKey);
    } catch (err: any) {
      console.error("Errore caricamento foto tecnico:", err);
      showToast("Errore durante il caricamento della foto: " + (err?.message || ''), 'error');
    } finally {
      setUploadingStaffId(null);
    }
  };

  const handleUpdateStaffPhotoPosition = async (member: any, index: number, positionY: number) => {
    const matched = (member.profiloId ? availableStaff.find(s => s.id === member.profiloId) : null) || 
      availableStaff.find(s => s.nomeCognome?.toLowerCase().trim() === (member.nome || '').toLowerCase().trim());
    const targetProfiloId = member.profiloId || matched?.id;

    // Update local availableStaff
    if (targetProfiloId) {
      setAvailableStaff(prev => prev.map(s => s.id === targetProfiloId ? {
        ...s,
        foto: { ...(s.foto || { url: '', positionX: 50 }), positionY }
      } : s));

      if (!isDemoMode) {
        updateDoc(doc(db, 'staff_profili', targetProfiloId), {
          'foto.positionY': positionY
        }).catch(e => console.error("Errore salvataggio posizione foto:", e));
      }
    }

    // Update societaConfig.staffTecnico
    setSocietaConfig(prev => {
      if (!prev) return null;
      const updated = (prev.staffTecnico || []).map((m, i) => 
        i === index ? { ...m, fotoPositionY: positionY } : m
      );
      return {
        ...prev,
        staffTecnico: updated,
        organigramma: updated
      };
    });
  };

  const handleSaveStaffTecnico = async () => {
    if (!societaConfig) return;
    try {
      setIsSaving(true);
      const cleanStaff = (societaConfig.staffTecnico || []).map((s, idx) => ({
        id: s.id || `st_${Date.now()}_${idx}`,
        profiloId: s.profiloId || '',
        nome: (s.nome || '').trim(),
        ruolo: (s.ruolo || '').trim(),
        qualifica: (s.qualifica || '').trim(),
        ordine: idx + 1,
        fotoUrl: s.fotoUrl || '',
        fotoPositionY: s.fotoPositionY ?? 50,
        fotoPositionX: s.fotoPositionX ?? 50
      }));

      const updatedConfig = {
        ...societaConfig,
        staffTecnico: cleanStaff,
        organigramma: cleanStaff
      };

      await updateSocietaConfig(updatedConfig);
      setSocietaConfig(updatedConfig);

      if (societaInfo) {
        const updatedInfo = {
          ...societaInfo,
          organigramma: {
            ...societaInfo.organigramma,
            staff_tecnico: cleanStaff.map(s => ({
              ruolo: s.ruolo,
              nome: s.nome,
              qualifica: s.qualifica,
              fotoUrl: s.fotoUrl || '',
              fotoPositionY: s.fotoPositionY ?? 50
            }))
          }
        };
        await updateSocietaInfo(updatedInfo);
        setSocietaInfo(updatedInfo);
      }

      showToast("Staff Tecnico & Dirigenziale salvato con successo!", "success");
      await loadAllData();
    } catch (e: any) {
      console.error("Errore salvataggio staff tecnico:", e);
      showToast("Errore durante il salvataggio: " + (e?.message || ""), "error");
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // CAROSELLO FOTO SOCIETÀ HANDLERS
  // ==========================================
  const handleUploadCaroselloPhoto = async (file: File) => {
    try {
      setIsUploadingCarosello(true);
      showToast("Compressione e caricamento foto carosello in corso...", "info");

      let url = '';
      try {
        const compResult = await compressImage(file, IMAGE_PRESETS.HERO);
        url = await caricaBlobSuStorage(compResult.blob, `societa/carosello/${Date.now()}_${file.name.replace(/\s+/g, '_')}.webp`);
      } catch (compErr) {
        url = await caricaFileSuStorage(file, `societa/carosello/${Date.now()}_${file.name}`);
      }

      const currentFoto = societaConfig?.carosello?.foto || [];
      const updatedFoto = [...currentFoto, { url, positionY: 50 }];
      const updatedCarosello = {
        foto: updatedFoto,
        intervallo: societaConfig?.carosello?.intervallo || 5
      };

      setSocietaConfig(prev => prev ? ({ ...prev, carosello: updatedCarosello }) : null);
      await updateSocietaConfig({ carosello: updatedCarosello });
      showToast("Foto aggiunta al carosello e salvata online!", "success");
    } catch (err: any) {
      console.error("Errore upload carosello:", err);
      showToast("Errore durante il caricamento della foto: " + (err?.message || ''), "error");
    } finally {
      setIsUploadingCarosello(false);
    }
  };

  const handleAddCaroselloByUrl = async () => {
    if (!newCaroselloUrl.trim()) return;
    const currentFoto = societaConfig?.carosello?.foto || [];
    const updatedFoto = [...currentFoto, { url: newCaroselloUrl.trim(), positionY: 50 }];
    const updatedCarosello = {
      foto: updatedFoto,
      intervallo: societaConfig?.carosello?.intervallo || 5
    };
    setSocietaConfig(prev => prev ? ({ ...prev, carosello: updatedCarosello }) : null);
    setNewCaroselloUrl('');
    try {
      await updateSocietaConfig({ carosello: updatedCarosello });
      showToast("Foto aggiunta al carosello!", "success");
    } catch (e: any) {
      showToast("Errore salvataggio foto carosello: " + (e?.message || ''), "error");
    }
  };

  const handleRemoveCaroselloPhoto = async (index: number) => {
    const currentFoto = societaConfig?.carosello?.foto || [];
    const updatedFoto = currentFoto.filter((_, i) => i !== index);
    const updatedCarosello = {
      foto: updatedFoto,
      intervallo: societaConfig?.carosello?.intervallo || 5
    };
    setSocietaConfig(prev => prev ? ({ ...prev, carosello: updatedCarosello }) : null);
    try {
      await updateSocietaConfig({ carosello: updatedCarosello });
      showToast("Foto rimossa dal carosello!", "success");
    } catch (e: any) {
      showToast("Errore rimozione foto: " + (e?.message || ''), "error");
    }
  };

  const handleMoveCaroselloPhoto = async (index: number, direction: 'up' | 'down') => {
    const currentFoto = [...(societaConfig?.carosello?.foto || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentFoto.length) return;
    const temp = currentFoto[index];
    currentFoto[index] = currentFoto[targetIndex];
    currentFoto[targetIndex] = temp;
    const updatedCarosello = {
      foto: currentFoto,
      intervallo: societaConfig?.carosello?.intervallo || 5
    };
    setSocietaConfig(prev => prev ? ({ ...prev, carosello: updatedCarosello }) : null);
    try {
      await updateSocietaConfig({ carosello: updatedCarosello });
    } catch (e) {
      console.error("Errore riordino carosello:", e);
    }
  };

  const handleUpdateCaroselloPositionY = (index: number, positionY: number) => {
    const currentFoto = societaConfig?.carosello?.foto || [];
    const updatedFoto = currentFoto.map((f, i) => i === index ? { ...f, positionY } : f);
    setSocietaConfig(prev => prev ? ({
      ...prev,
      carosello: {
        foto: updatedFoto,
        intervallo: prev.carosello?.intervallo || 5
      }
    }) : null);
  };

  const handleSaveCarosello = async () => {
    if (!societaConfig?.carosello) return;
    try {
      setIsSaving(true);
      await updateSocietaConfig({ carosello: societaConfig.carosello });
      showToast("Carosello foto della Società salvato con successo!", "success");
    } catch (e: any) {
      showToast("Errore durante il salvataggio del carosello: " + (e?.message || ''), "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!societaInfo) {
    return (
      <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center text-slate-400 font-mono">
        Caricamento dati istituzionali...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-xs" id="admin-tab-pagine">
      
      {/* Section Sub-Navigation */}
      <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
        <button
          onClick={() => setActiveSection('info')}
          className={`px-4 py-2 rounded-lg text-xs font-bold font-sport uppercase italic tracking-wider transition-all ${
            activeSection === 'info' ? 'bg-amber-500 text-slate-950 font-black shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building className="w-4 h-4 inline mr-1.5" /> Dati & Sede Legale
        </button>
        <button
          onClick={() => setActiveSection('organigramma')}
          className={`px-4 py-2 rounded-lg text-xs font-bold font-sport uppercase italic tracking-wider transition-all ${
            activeSection === 'organigramma' ? 'bg-amber-500 text-slate-950 font-black shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 inline mr-1.5" /> Organigramma & Consiglio
        </button>
        <button
          onClick={() => setActiveSection('staff')}
          className={`px-4 py-2 rounded-lg text-xs font-bold font-sport uppercase italic tracking-wider transition-all ${
            activeSection === 'staff' ? 'bg-amber-500 text-slate-950 font-black shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4 inline mr-1.5" /> Staff con Foto (Allenatori)
        </button>
        <button
          onClick={() => setActiveSection('carosello')}
          className={`px-4 py-2 rounded-lg text-xs font-bold font-sport uppercase italic tracking-wider transition-all ${
            activeSection === 'carosello' ? 'bg-amber-500 text-slate-950 font-black shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ImageIcon className="w-4 h-4 inline mr-1.5" /> Carosello Foto Società
        </button>
        <button
          onClick={() => setActiveSection('palestre')}
          className={`px-4 py-2 rounded-lg text-xs font-bold font-sport uppercase italic tracking-wider transition-all ${
            activeSection === 'palestre' ? 'bg-amber-500 text-slate-950 font-black shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-4 h-4 inline mr-1.5" /> Palestre & Impianti
        </button>
        <button
          onClick={() => setActiveSection('storia')}
          className={`px-4 py-2 rounded-lg text-xs font-bold font-sport uppercase italic tracking-wider transition-all ${
            activeSection === 'storia' ? 'bg-amber-500 text-slate-950 font-black shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-1.5" /> Storia & Valori
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: DATI & SEDE LEGALE */}
      {/* ========================================================================= */}
      {activeSection === 'info' && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-6 shadow-sm">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-md font-extrabold text-slate-900 uppercase tracking-wider font-sport italic">
              Informazioni Istituzionali Società
            </h3>
            <p className="text-[11px] text-slate-500">Ragione sociale, anno di fondazione, contatti e dati fiscali.</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Ragione Sociale / Nome</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:border-amber-500"
                  value={societaInfo.nome}
                  onChange={e => setSocietaInfo({ ...societaInfo, nome: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Anno Fondazione</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                    value={societaInfo.anno_fondazione}
                    onChange={e => setSocietaInfo({ ...societaInfo, anno_fondazione: parseInt(e.target.value, 10) || 2018 })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">P.IVA / CF</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                    value={societaInfo.partita_iva}
                    onChange={e => setSocietaInfo({ ...societaInfo, partita_iva: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Sede Legale</label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-amber-500"
                value={societaInfo.sede_legale}
                onChange={e => setSocietaInfo({ ...societaInfo, sede_legale: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
              <div className="space-y-1">
                <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Email Principale</label>
                <input
                  type="email"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-amber-500"
                  value={societaInfo.contatti.email}
                  onChange={e => setSocietaInfo({
                    ...societaInfo,
                    contatti: { ...societaInfo.contatti, email: e.target.value }
                  })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Telefono Segreteria</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-amber-500"
                  value={societaInfo.contatti?.telefono || '+39 351 321 0332'}
                  onChange={e => setSocietaInfo({
                    ...societaInfo,
                    contatti: { ...societaInfo.contatti, telefono: e.target.value }
                  })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-mono text-[10px] uppercase font-bold text-emerald-700 flex items-center gap-1">
                  <span>📱 Numero WhatsApp (Pulsante Flottante)</span>
                </label>
                <input
                  type="text"
                  placeholder="+39 351 321 0332"
                  className="w-full bg-emerald-50/50 border border-emerald-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:border-emerald-500 font-mono"
                  value={societaInfo.contatti?.whatsapp || '+39 351 321 0332'}
                  onChange={e => setSocietaInfo({
                    ...societaInfo,
                    contatti: { ...societaInfo.contatti, whatsapp: e.target.value }
                  })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">PEC Ufficiale</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                  value={societaInfo.contatti?.pec || ''}
                  onChange={e => setSocietaInfo({
                    ...societaInfo,
                    contatti: { ...societaInfo.contatti, pec: e.target.value }
                  })}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleSaveInfo}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-2.5 rounded-xl uppercase font-sport italic skew-x-[-6deg] shadow transition-all cursor-pointer"
              >
                <Save className="w-4 h-4 inline mr-1" />
                {isSaving ? 'Salvataggio...' : 'Salva Informazioni Istituzionali'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: ORGANIGRAMMA */}
      {/* ========================================================================= */}
      {activeSection === 'organigramma' && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-6 shadow-sm">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-md font-extrabold text-slate-900 uppercase tracking-wider font-sport italic">
              Organigramma e Ruoli Direttivi
            </h3>
            <p className="text-[11px] text-slate-500">I vertici societari e i responsabili tecnici della New Volley Academy.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Presidente</label>
              <input
                type="text"
                placeholder="es. Walter Gagliardi"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:border-amber-500"
                value={societaInfo.organigramma?.presidente || ''}
                onChange={e => setSocietaInfo({
                  ...societaInfo,
                  organigramma: { ...(societaInfo.organigramma || {}), presidente: e.target.value }
                })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Vice Presidente</label>
              <input
                type="text"
                placeholder="es. Debora Montanari"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-amber-500"
                value={societaInfo.organigramma?.vice_presidente || ''}
                onChange={e => setSocietaInfo({
                  ...societaInfo,
                  organigramma: { ...(societaInfo.organigramma || {}), vice_presidente: e.target.value }
                })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Direttore Tecnico</label>
              <input
                type="text"
                placeholder="es. Roberto Baggio"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-amber-500"
                value={societaInfo.organigramma?.direttore_tecnico || ''}
                onChange={e => setSocietaInfo({
                  ...societaInfo,
                  organigramma: { ...(societaInfo.organigramma || {}), direttore_tecnico: e.target.value }
                })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Responsabile Settore Giovanile</label>
              <input
                type="text"
                placeholder="es. Giulia Neri"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-amber-500"
                value={societaInfo.organigramma?.responsabile_settore_giovanile || ''}
                onChange={e => setSocietaInfo({
                  ...societaInfo,
                  organigramma: { ...(societaInfo.organigramma || {}), responsabile_settore_giovanile: e.target.value }
                })}
              />
            </div>
          </div>

          {/* Altri Membri del Consiglio Direttivo */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase font-sport tracking-wider">
                  Altri Membri del Consiglio Direttivo
                </h4>
                <p className="text-[11px] text-slate-500">
                  Consiglieri, Segretario, Direttore Sportivo o Responsabili aggiuntivi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newMember = { id: `dir_${Date.now()}`, ruolo: 'Consigliere', nome: '', ordine: 99 };
                  setSocietaConfig(prev => prev ? ({
                    ...prev,
                    consiglioDirettivo: [...(prev.consiglioDirettivo || []), newMember]
                  }) : null);
                }}
                className="text-[11px] bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg font-sport uppercase italic flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> + Aggiungi Ruolo
              </button>
            </div>

            <div className="space-y-2">
              {(societaConfig?.consiglioDirettivo || [])
                .filter(m => {
                  const r = (m.ruolo || '').toLowerCase().trim();
                  return r !== 'presidente' && r !== 'vice presidente' && !r.includes('vice');
                })
                .map((m, idx) => (
                  <div key={m.id || idx} className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                    <input
                      type="text"
                      placeholder="Ruolo (es. Direttore Sportivo)"
                      value={m.ruolo}
                      onChange={e => {
                        const updated = (societaConfig?.consiglioDirettivo || []).map(item =>
                          item.id === m.id ? { ...item, ruolo: e.target.value } : item
                        );
                        setSocietaConfig(prev => prev ? ({ ...prev, consiglioDirettivo: updated }) : null);
                      }}
                      className="w-1/3 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500"
                    />
                    <input
                      type="text"
                      placeholder="Nome e Cognome"
                      value={m.nome}
                      onChange={e => {
                        const updated = (societaConfig?.consiglioDirettivo || []).map(item =>
                          item.id === m.id ? { ...item, nome: e.target.value } : item
                        );
                        setSocietaConfig(prev => prev ? ({ ...prev, consiglioDirettivo: updated }) : null);
                      }}
                      className="flex-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const filtered = (societaConfig?.consiglioDirettivo || []).filter(item => item.id !== m.id);
                        setSocietaConfig(prev => prev ? ({ ...prev, consiglioDirettivo: filtered }) : null);
                      }}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-2 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Banner di collegamento diretto a Staff Tecnico & Dirigenziale */}
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-amber-950 font-sport uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-amber-600" /> Staff Tecnico & Dirigenziale con Foto
              </h4>
              <p className="text-[11px] text-slate-600">
                Vuoi mostrare gli allenatori e i responsabili tecnici con le loro foto ufficiali pescate dall'Anagrafica Staff?
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSection('staff')}
              className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold px-4 py-2 rounded-xl text-xs uppercase font-sport italic skew-x-[-6deg] shrink-0 cursor-pointer shadow-sm transition-all"
            >
              Gestisci Staff con Foto →
            </button>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={handleSaveInfo}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-2.5 rounded-xl uppercase font-sport italic skew-x-[-6deg] shadow transition-all cursor-pointer"
            >
              <Save className="w-4 h-4 inline mr-1" />
              {isSaving ? 'Salvataggio...' : 'Salva Organigramma'}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2B: STAFF TECNICO & DIRIGENZIALE (CON FOTO DA ANAGRAFICA STAFF) */}
      {/* ========================================================================= */}
      {activeSection === 'staff' && (
        <div className="space-y-6">
          
          {/* Top Banner explaining the feature */}
          <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 text-[10px] font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Vetrina Pagina Società
              </div>
              <h3 className="text-base font-extrabold text-slate-900 uppercase font-sport tracking-wider">
                Staff Tecnico & Dirigenziale con Foto
              </h3>
              <p className="text-[11px] text-slate-600 max-w-2xl leading-relaxed">
                Pesca direttamente dall'<strong>Anagrafica Staff</strong> per mostrare gli allenatori e i responsabili tecnici nella pagina pubblica <em>/societa</em> con le loro foto ufficiali, inquadratura centrata, qualifica e carriera!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleImportAllStaff}
                disabled={availableStaff.length === 0}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl uppercase font-sport italic skew-x-[-6deg] flex items-center gap-1.5 shadow-sm cursor-pointer transition-all disabled:opacity-50"
                title="Aggiungi automaticamente tutti i membri presenti in Anagrafica Staff"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Importa Tutti ({availableStaff.length})
              </button>
              {(societaConfig?.staffTecnico || []).length > 0 && (
                <button
                  type="button"
                  onClick={handleClearStaff}
                  className="bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 text-xs px-3 py-2 rounded-xl uppercase font-sport italic skew-x-[-6deg] flex items-center gap-1 cursor-pointer transition-all"
                  title="Svuota l'elenco dello staff attuale"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Svuota
                </button>
              )}
            </div>
          </div>

          {/* Form to Pick and Add from Anagrafica Staff */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-sport italic flex items-center gap-2 border-b border-slate-200 pb-2">
              <UserCheck className="w-4 h-4 text-amber-500" />
              Pesca Membro da Anagrafica Staff
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              
              {/* Select Member */}
              <div className="space-y-1">
                <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">
                  Allenatore / Dirigente da Anagrafica Staff *
                </label>
                <select
                  value={selectedStaffId}
                  onChange={e => onSelectStaff(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:border-amber-500 text-xs"
                >
                  <option value="">-- Seleziona ({availableStaff.length} disponibili in anagrafica) --</option>
                  {availableStaff.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nomeCognome} {s.qualificaTecnica ? `— ${s.qualificaTecnica}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ruolo nel Club */}
              <div className="space-y-1">
                <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">
                  Ruolo Visualizzato nella Scheda *
                </label>
                <input
                  type="text"
                  placeholder="es. Direttore Tecnico, Primo Allenatore, Preparatore..."
                  value={newStaffRole}
                  onChange={e => setNewStaffRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Qualifica / Titolo */}
              <div className="space-y-1">
                <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">
                  Qualifica Federale o Titolo
                </label>
                <input
                  type="text"
                  placeholder="es. 3° Grado FIPAV, Laurea..."
                  value={newStaffQualifica}
                  onChange={e => setNewStaffQualifica(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

            </div>

            {/* Quick Badge Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-mono uppercase font-bold mr-1">Suggerimenti Ruolo:</span>
              {['Direttore Tecnico', 'Responsabile Settore Giovanile', 'Primo Allenatore Serie D', 'Allenatore Giovanili', 'Preparatore Atletico', 'Fisioterapista', 'Responsabile Minivolley S3'].map(badge => (
                <button
                  key={badge}
                  type="button"
                  onClick={() => setNewStaffRole(badge)}
                  className="text-[10px] bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 px-2 py-0.5 rounded-md font-mono transition-colors cursor-pointer border border-slate-200"
                >
                  {badge}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddStaffToOrganigramma}
              disabled={!selectedStaffId}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-amber-400 font-black py-2.5 rounded-xl uppercase font-sport italic skew-x-[-6deg] cursor-pointer shadow-sm transition-all"
            >
              + Inserisci nello Staff Tecnico & Dirigenziale
            </button>
          </div>

          {/* List of Active Staff in Organigramma */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <div>
                <h3 className="text-md font-extrabold text-slate-900 uppercase tracking-wider font-sport italic">
                  Membri Attivi nell'Organigramma ({(societaConfig?.staffTecnico || []).length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Queste persone appariranno con la loro foto e il ruolo configurato nella pagina pubblica.
                </p>
              </div>
              <button
                onClick={handleSaveStaffTecnico}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-2 rounded-xl text-xs uppercase font-sport italic skew-x-[-6deg] flex items-center gap-1.5 cursor-pointer shadow transition-all"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Salvataggio...' : 'Salva Modifiche Staff'}
              </button>
            </div>

            {(societaConfig?.staffTecnico || []).length === 0 ? (
              <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-3">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">
                  Nessun membro configurato nello Staff Tecnico & Dirigenziale.
                </p>
                <button
                  type="button"
                  onClick={handleImportAllStaff}
                  className="text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl uppercase font-sport italic skew-x-[-6deg] cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Importa Subito da Anagrafica Staff ({availableStaff.length})
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {(societaConfig?.staffTecnico || []).map((member, idx) => {
                  const memberKey = member.id || member.profiloId || `idx_${idx}`;
                  const matched = (member.profiloId ? availableStaff.find(s => s.id === member.profiloId) : null) || 
                    availableStaff.find(s => s.nomeCognome?.toLowerCase().trim() === (member.nome || '').toLowerCase().trim());
                  const photoUrl = member.fotoUrl || matched?.foto?.url || '';
                  const posX = member.fotoPositionX ?? matched?.foto?.positionX ?? 50;
                  const posY = member.fotoPositionY ?? matched?.foto?.positionY ?? 50;
                  const isUploading = uploadingStaffId === memberKey;
                  const isAdjusting = activePhotoAdjustId === memberKey;

                  return (
                    <div
                      key={member.id || idx}
                      className="bg-slate-50 border border-slate-200 p-3 sm:p-4 rounded-xl flex flex-col gap-3 hover:border-amber-400 transition-all shadow-sm"
                    >
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
                        {/* Left: Thumbnail, Name & Photo Change Actions */}
                        <div className="flex items-center gap-3 min-w-[240px]">
                          <div className="relative group shrink-0">
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 flex items-center justify-center shadow-inner">
                              {photoUrl ? (
                                <img
                                  src={photoUrl}
                                  alt={member.nome}
                                  className="w-full h-full object-cover"
                                  style={{ objectPosition: `${posX}% ${posY}%` }}
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <Users className="w-7 h-7 text-slate-400" />
                              )}
                              {isUploading && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                                  <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                                </div>
                              )}
                            </div>

                            {/* Quick Upload Hover overlay */}
                            <label
                              className="absolute inset-0 bg-black/60 text-white rounded-xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-[9px] font-bold uppercase tracking-wider"
                              title="Cambia foto tecnico"
                            >
                              <Camera className="w-4 h-4 text-amber-400 mb-0.5" />
                              <span>Cambia</span>
                              <input
                                type="file"
                                accept="image/*"
                                disabled={isUploading}
                                className="hidden"
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadStaffPhoto(file, member, idx);
                                }}
                              />
                            </label>
                          </div>

                          <div className="space-y-1">
                            <h4 className="font-extrabold text-slate-950 text-sm font-barlow uppercase tracking-wide leading-tight">
                              {member.nome}
                            </h4>
                            
                            <div className="flex flex-wrap items-center gap-1.5">
                              <label className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300/80 px-2 py-0.5 rounded-lg cursor-pointer transition-colors shadow-2xs">
                                <Camera className="w-3 h-3 text-amber-600" />
                                <span>{photoUrl ? 'Cambia Foto' : 'Carica Foto'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  disabled={isUploading}
                                  className="hidden"
                                  onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUploadStaffPhoto(file, member, idx);
                                  }}
                                />
                              </label>

                              {photoUrl && (
                                <button
                                  type="button"
                                  onClick={() => setActivePhotoAdjustId(isAdjusting ? null : memberKey)}
                                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                                    isAdjusting 
                                      ? 'bg-amber-500 text-slate-950 border-amber-600' 
                                      : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-300'
                                  }`}
                                  title="Regola inquadratura e centratura viso"
                                >
                                  <Sliders className="w-3 h-3" />
                                  <span>{isAdjusting ? 'Chiudi' : 'Inquadratura'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Middle: Inputs for Role and Qualifica */}
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                          <div className="space-y-0.5">
                            <label className="text-[9.5px] font-mono uppercase font-bold text-slate-400">Ruolo Scheda</label>
                            <input
                              type="text"
                              placeholder="Ruolo"
                              value={member.ruolo}
                              onChange={e => {
                                const updated = (societaConfig.staffTecnico || []).map((m, i) =>
                                  i === idx ? { ...m, ruolo: e.target.value } : m
                                );
                                setSocietaConfig(prev => prev ? ({ ...prev, staffTecnico: updated, organigramma: updated }) : null);
                              }}
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <label className="text-[9.5px] font-mono uppercase font-bold text-slate-400">Qualifica Federale</label>
                            <input
                              type="text"
                              placeholder="Qualifica"
                              value={member.qualifica}
                              onChange={e => {
                                const updated = (societaConfig.staffTecnico || []).map((m, i) =>
                                  i === idx ? { ...m, qualifica: e.target.value } : m
                                );
                                setSocietaConfig(prev => prev ? ({ ...prev, staffTecnico: updated, organigramma: updated }) : null);
                              }}
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>

                        {/* Right: Order controls & Delete */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveStaff(idx, 'up')}
                            className="p-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                            title="Sposta in alto"
                          >
                            <ArrowUp className="w-3.5 h-3.5 text-slate-700" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === (societaConfig.staffTecnico || []).length - 1}
                            onClick={() => handleMoveStaff(idx, 'down')}
                            className="p-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                            title="Sposta in basso"
                          >
                            <ArrowDown className="w-3.5 h-3.5 text-slate-700" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveStaffItem(member.id)}
                            className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                            title="Rimuovi da Organigramma"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Photo Inquadratura & Crop Drawer */}
                      {isAdjusting && (
                        <div className="w-full bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-amber-200/60 pb-2">
                            <div className="flex items-center gap-1.5">
                              <Sliders className="w-3.5 h-3.5 text-amber-600" />
                              <span className="text-xs font-bold text-slate-900 font-sport uppercase tracking-wider">
                                Centratura Viso / Inquadratura ({member.nome})
                              </span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded w-fit">
                              Posizione Verticale: {posY}%
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-slate-500 font-mono font-bold shrink-0">In Alto (0%)</span>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={posY}
                                onChange={e => handleUpdateStaffPhotoPosition(member, idx, parseInt(e.target.value, 10))}
                                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                              />
                              <span className="text-[10px] text-slate-500 font-mono font-bold shrink-0">In Basso (100%)</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                              <span className="text-slate-500 font-mono">Preset rapidi:</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateStaffPhotoPosition(member, idx, 20)}
                                className="bg-white hover:bg-amber-100/80 border border-slate-200 hover:border-amber-300 px-2 py-0.5 rounded font-mono font-medium cursor-pointer"
                              >
                                Viso in Alto (20%)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateStaffPhotoPosition(member, idx, 50)}
                                className="bg-white hover:bg-amber-100/80 border border-slate-200 hover:border-amber-300 px-2 py-0.5 rounded font-mono font-medium cursor-pointer"
                              >
                                Centro Naturale (50%)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateStaffPhotoPosition(member, idx, 75)}
                                className="bg-white hover:bg-amber-100/80 border border-slate-200 hover:border-amber-300 px-2 py-0.5 rounded font-mono font-medium cursor-pointer"
                              >
                                In Basso (75%)
                              </button>
                              <button
                                type="button"
                                onClick={() => setActivePhotoAdjustId(null)}
                                className="ml-auto bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-0.5 rounded font-bold font-sport uppercase tracking-wider cursor-pointer"
                              >
                                Fatto ✓
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={handleSaveStaffTecnico}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-2.5 rounded-xl uppercase font-sport italic skew-x-[-6deg] shadow transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Salvataggio...' : 'Salva Modifiche Staff'}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2C: CAROSELLO FOTO SOCIETÀ                                        */}
      {/* ========================================================================= */}
      {activeSection === 'carosello' && (
        <div className="space-y-6">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 text-[10px] font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Vetrina Principale Società
              </div>
              <h3 className="text-base font-extrabold text-slate-900 uppercase font-sport tracking-wider">
                Carosello Fotografico in Cima alla Pagina
              </h3>
              <p className="text-[11px] text-slate-600 max-w-2xl leading-relaxed">
                Queste foto scorrono automaticamente in cima alla pagina pubblica <em>/societa</em> (sotto al titolo "LA NOSTRA SOCIETÀ"). Puoi caricare nuove foto dal computer o smartphone, riordinarle con le frecce, regolare la centratura dell'inquadratura e impostare i secondi di transizione.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveCarosello}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2 rounded-xl uppercase font-sport italic skew-x-[-6deg] flex items-center gap-1.5 shadow-sm cursor-pointer transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Salvataggio...' : 'Salva Carosello'}
              </button>
            </div>
          </div>

          {/* Upload / Add New Slide Card */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-sport italic flex items-center gap-2 border-b border-slate-200 pb-2">
              <Plus className="w-4 h-4 text-amber-500" />
              Aggiungi Nuova Foto al Carosello
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Caricamento File */}
              <div className="p-5 border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/40 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 transition-colors">
                <div className="w-12 h-12 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-600">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 uppercase font-sport tracking-wider">
                    Carica Foto da Computer o Telefono
                  </p>
                  <p className="text-[10.5px] text-slate-500 mt-0.5">
                    JPG, PNG o WebP (ottimizzata automaticamente in alta risoluzione)
                  </p>
                </div>
                <label className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold px-4 py-2 rounded-xl text-xs uppercase font-sport italic skew-x-[-6deg] cursor-pointer shadow-sm transition-all flex items-center gap-1.5">
                  {isUploadingCarosello ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Caricamento in corso...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-3.5 h-3.5" />
                      <span>Scegli Foto dal Dispositivo</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingCarosello}
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadCaroselloPhoto(file);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>

              {/* Inserimento da Link Esterno */}
              <div className="p-5 border border-slate-200 bg-slate-50/60 rounded-2xl flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900 uppercase font-sport tracking-wider flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    Oppure Inserisci Link / URL Foto
                  </p>
                  <p className="text-[10.5px] text-slate-500">
                    Se hai già un'immagine ospitata online, incolla direttamente il link:
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newCaroselloUrl}
                    onChange={e => setNewCaroselloUrl(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCaroselloByUrl}
                    disabled={!newCaroselloUrl.trim()}
                    className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black px-4 py-2 rounded-xl text-xs uppercase font-sport italic skew-x-[-6deg] shrink-0 cursor-pointer shadow-sm transition-all"
                  >
                    + Aggiungi
                  </button>
                </div>
              </div>

            </div>

            {/* Impostazioni Carosello: Tempo transizione */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 uppercase font-sport tracking-wider block">
                  Tempo di Scorrimento Automatico: {societaConfig?.carosello?.intervallo || 5} secondi
                </span>
                <span className="text-[11px] text-slate-500">
                  Intervallo di permanenza di ciascuna slide prima di passare alla successiva.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-slate-400 font-mono">2s</span>
                <input
                  type="range"
                  min="2"
                  max="12"
                  value={societaConfig?.carosello?.intervallo || 5}
                  onChange={e => {
                    const intervallo = parseInt(e.target.value, 10);
                    setSocietaConfig(prev => prev ? ({
                      ...prev,
                      carosello: {
                        foto: prev.carosello?.foto || [],
                        intervallo
                      }
                    }) : null);
                  }}
                  className="w-32 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <span className="text-[10px] text-slate-400 font-mono">12s</span>
              </div>
            </div>
          </div>

          {/* Slides List Card */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-sport italic">
                  Foto Attualmente nel Carosello ({(societaConfig?.carosello?.foto || []).length})
                </h4>
                <p className="text-[11px] text-slate-500">
                  Scorrono nell'ordine mostrato qui sotto. Usa le frecce per cambiare l'ordine o regola la centratura verticale.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveCarosello}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-xl text-xs uppercase font-sport italic skew-x-[-6deg] flex items-center gap-1.5 cursor-pointer shadow transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Salvataggio...' : 'Salva Modifiche'}
              </button>
            </div>

            {(!societaConfig?.carosello?.foto || societaConfig.carosello.foto.length === 0) ? (
              <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
                <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">
                  Nessuna foto nel carosello al momento. Caricane una per farla apparire in cima a /societa!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {societaConfig.carosello.foto.map((slide, idx) => {
                  const posY = slide.positionY ?? 50;
                  return (
                    <div 
                      key={idx}
                      className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden p-3.5 space-y-3 hover:border-amber-400 transition-all shadow-sm flex flex-col justify-between"
                    >
                      {/* Anteprima Slide */}
                      <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-300 shadow-inner">
                        <img 
                          src={slide.url} 
                          alt={`Slide ${idx + 1}`} 
                          className="w-full h-full object-cover transition-all"
                          style={{ objectPosition: `center ${posY}%` }}
                        />
                        
                        {/* Slide Number Badge */}
                        <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-amber-400 font-mono text-[11px] font-black border border-amber-400/30">
                          #{idx + 1}
                        </div>

                        {/* Order & Delete Buttons Overlay */}
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleMoveCaroselloPhoto(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 rounded-lg bg-black/75 hover:bg-amber-400 hover:text-black text-white disabled:opacity-30 disabled:hover:bg-black/75 disabled:hover:text-white transition-colors cursor-pointer"
                            title="Sposta prima"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveCaroselloPhoto(idx, 'down')}
                            disabled={idx === (societaConfig.carosello!.foto.length - 1)}
                            className="p-1.5 rounded-lg bg-black/75 hover:bg-amber-400 hover:text-black text-white disabled:opacity-30 disabled:hover:bg-black/75 disabled:hover:text-white transition-colors cursor-pointer"
                            title="Sposta dopo"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveCaroselloPhoto(idx)}
                            className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white transition-colors cursor-pointer ml-1"
                            title="Rimuovi questa foto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="absolute bottom-2 left-2.5 px-2 py-0.5 rounded bg-black/60 text-[10px] font-mono text-zinc-300">
                          Centratura: {posY}%
                        </div>
                      </div>

                      {/* Slider Centratura Verticale */}
                      <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-700">
                          <span>Inquadratura Verticale:</span>
                          <span className="text-amber-600">{posY}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={posY}
                          onChange={e => handleUpdateCaroselloPositionY(idx, parseInt(e.target.value, 10))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                        <div className="flex justify-between text-[9px] font-mono text-slate-400">
                          <button
                            type="button"
                            onClick={() => handleUpdateCaroselloPositionY(idx, 20)}
                            className="hover:text-slate-900 cursor-pointer"
                          >
                            Alto (20%)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateCaroselloPositionY(idx, 50)}
                            className="hover:text-slate-900 cursor-pointer font-bold text-slate-600"
                          >
                            Centro (50%)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateCaroselloPositionY(idx, 80)}
                            className="hover:text-slate-900 cursor-pointer"
                          >
                            Basso (80%)
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
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: PALESTRE & IMPIANTI */}
      {/* ========================================================================= */}
      {activeSection === 'palestre' && (
        <div className="space-y-6">
          {/* Add Gym Form */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-md font-extrabold text-slate-900 uppercase tracking-wider font-sport italic flex items-center gap-2 border-b border-slate-200 pb-2">
              <Plus className="w-5 h-5 text-amber-500" /> + AGGIUNGI PALESTRA O IMPIANTO DI GIOCO
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Nome Impianto *</label>
                <input
                  type="text"
                  placeholder="es. PalaRomiti o Centro Studi"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  value={newPalestra.nome}
                  onChange={e => setNewPalestra({ ...newPalestra, nome: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Indirizzo *</label>
                <input
                  type="text"
                  placeholder="es. Via Antonio Gramsci 2"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-amber-500"
                  value={newPalestra.indirizzo}
                  onChange={e => setNewPalestra({ ...newPalestra, indirizzo: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Città</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-amber-500"
                    value={newPalestra.citta}
                    onChange={e => setNewPalestra({ ...newPalestra, citta: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">CAP</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                    value={newPalestra.cap}
                    onChange={e => setNewPalestra({ ...newPalestra, cap: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1">
                <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Capienza Spettatori (opzionale)</label>
                <input
                  type="number"
                  placeholder="es. 500"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                  value={newPalestra.capienza}
                  onChange={e => setNewPalestra({ ...newPalestra, capienza: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Note / Info Accesso (opzionale)</label>
                <input
                  type="text"
                  placeholder="es. Campo taraflex, ingresso tifosi lato nord"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-amber-500"
                  value={newPalestra.note}
                  onChange={e => setNewPalestra({ ...newPalestra, note: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddPalestra}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-amber-400 font-black py-2.5 rounded-xl uppercase font-sport italic skew-x-[-6deg] cursor-pointer"
              >
                {editingPalestraId ? '✓ Salva Modifiche alla Palestra' : '+ Inserisci Palestra in Elenco'}
              </button>
              {editingPalestraId && (
                <button
                  type="button"
                  onClick={handleCancelEditPalestra}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2.5 rounded-xl uppercase font-sport italic skew-x-[-6deg] cursor-pointer text-xs"
                >
                  Annulla
                </button>
              )}
            </div>
          </div>

          {/* List of Gyms */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="text-md font-extrabold text-slate-900 uppercase tracking-wider font-sport italic">
                Palestre Attive ({societaInfo.palestre?.length || 0})
              </h3>
              <button
                onClick={handleSavePalestre}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-xl text-xs uppercase font-sport italic skew-x-[-6deg] cursor-pointer"
              >
                <Save className="w-4 h-4 inline mr-1" />
                {isSaving ? 'Salvataggio...' : 'Salva Modifiche Palestre'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(societaInfo.palestre || []).map(p => (
                <div key={p.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <h4 className="font-bold text-slate-950 font-sport uppercase tracking-wide truncate">
                      {p.nome}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                      {p.indirizzo}, {p.citta || 'Forlì'} ({p.cap || '47121'})
                    </p>
                    {p.capienza ? (
                      <span className="text-[10px] text-amber-700 font-mono font-bold block">
                        Capienza: {p.capienza}
                      </span>
                    ) : null}
                    {p.note && (
                      <p className="text-[10.5px] text-slate-600 italic border-l-2 border-amber-400 pl-1.5 mt-0.5 line-clamp-2">
                        {p.note}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleStartEditPalestra(p)}
                      className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 p-2 rounded-xl transition-colors cursor-pointer"
                      title="Modifica dati palestra"
                    >
                      <Sliders className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={() => handleRemovePalestra(p.id!)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-2 rounded-xl transition-colors cursor-pointer"
                      title="Elimina palestra"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: STORIA & VALORI */}
      {/* ========================================================================= */}
      {activeSection === 'storia' && societaConfig && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-6 shadow-sm">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-md font-extrabold text-slate-900 uppercase tracking-wider font-sport italic">
              Storia, Valori e Mission Societaria
            </h3>
            <p className="text-[11px] text-slate-500">I testi e le descrizioni visibili nella pagina Chi Siamo / Società.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Titolo Sezione Storia</label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:border-amber-500"
                value={societaConfig.storia?.titolo || ''}
                onChange={e => setSocietaConfig(prev => prev ? ({
                  ...prev,
                  storia: { ...(prev.storia || {}), titolo: e.target.value }
                }) : null)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Descrizione / Racconto</label>
              <textarea
                rows={5}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 leading-relaxed focus:outline-none focus:border-amber-500"
                value={societaConfig.storia?.descrizione || ''}
                onChange={e => setSocietaConfig(prev => prev ? ({
                  ...prev,
                  storia: { ...(prev.storia || {}), descrizione: e.target.value }
                }) : null)}
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-2.5 rounded-xl uppercase font-sport italic skew-x-[-6deg] shadow transition-all cursor-pointer"
              >
                <Save className="w-4 h-4 inline mr-1" />
                {isSaving ? 'Salvataggio...' : 'Salva Storia & Valori'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
