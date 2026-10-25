import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Save, 
  Undo, 
  Search, 
  History, 
  FileSpreadsheet, 
  Loader2, 
  Upload, 
  Star, 
  Check, 
  X, 
  ArrowLeft, 
  Filter, 
  Trophy, 
  Sliders, 
  Camera,
  UserCheck,
  UserX,
  Sparkles
} from 'lucide-react';
import { 
  RosaSquadra, 
  Giocatore, 
  Sponsor, 
  AdminUser, 
  RecordStoricoCarriera,
  creaSquadraEAssociaAtleti, 
  aggiornaElementoCompleto, 
  eliminaElemento, 
  addGiocatore,
  getStoricoGiocatore,
  caricaBlobSuStorage,
  formatRuoloGiocatore,
  CARICHE_STAFF_DEFAULT,
  getGenereSquadra,
  GenereSquadra,
  sortSquadreByImportance,
  db
} from '../../../firebase-societa';
import { collection, getDocs } from 'firebase/firestore';
import { compressImage, IMAGE_PRESETS } from '../../../utils/imageCompressor';
import TabArchivioSquadre from './TabArchivioSquadre';

interface TabSquadreProps {
  squadreAll: RosaSquadra[];
  setSquadreAll?: React.Dispatch<React.SetStateAction<RosaSquadra[]>>;
  giocatoriAll: Giocatore[];
  setGiocatoriAll?: React.Dispatch<React.SetStateAction<Giocatore[]>>;
  sponsorsAll: Sponsor[];
  currentUser: AdminUser | null;
  loadAllData: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  caricaFileSuStorage: (file: File, path: string) => Promise<string>;
}

export default function TabSquadre({
  squadreAll,
  setSquadreAll,
  giocatoriAll,
  setGiocatoriAll,
  sponsorsAll,
  currentUser,
  loadAllData,
  showToast,
  caricaFileSuStorage
}: TabSquadreProps) {
  // Navigation: 'squadre' | 'giocatori' | 'archivio'
  const [squadSubTab, setSquadSubTab] = useState<'squadre' | 'giocatori' | 'archivio'>('squadre');
  
  // Selected Squad for Detailed Roster Management
  const [selectedSquadId, setSelectedSquadId] = useState<string | null>(null);
  
  // Create Squad Form visibility
  const [showCreateSquadForm, setShowCreateSquadForm] = useState(false);

  // Lista squadre ordinata rigorosamente per importanza/gerarchia ed età
  const sortedSquadreList = React.useMemo(() => {
    return sortSquadreByImportance(squadreAll || []);
  }, [squadreAll]);

  // Global Athlete Filters
  const [playerSearch, setPlayerSearch] = useState('');
  const [playerRoleFilter, setPlayerRoleFilter] = useState('Tutti');
  const [playerGenderFilter, setPlayerGenderFilter] = useState<'Tutti' | 'F' | 'M'>('Tutti');
  const [playerAgeFilter, setPlayerAgeFilter] = useState<'Tutti' | 'U13' | 'U14' | 'U16' | 'U18' | 'Senior'>('Tutti');

  // Add Athlete to Selected Squad Modal / Sub-tab: 'select' | 'create'
  const [addPlayerMode, setAddPlayerMode] = useState<'select' | 'create'>('select');
  const [addPlayerSearch, setAddPlayerSearch] = useState('');
  const [addPlayerRoleFilter, setAddPlayerRoleFilter] = useState('Tutti');
  const [addPlayerGenderFilter, setAddPlayerGenderFilter] = useState<'Tutti' | 'F' | 'M'>('Tutti');
  const [addPlayerAgeFilter, setAddPlayerAgeFilter] = useState<'Tutti' | 'U13' | 'U14' | 'U16' | 'U18' | 'Senior'>('Tutti');

  // CSV Import state
  const [isImportingCsv, setIsImportingCsv] = useState(false);

  // Quick Squad Creation Form
  const [squadraForm, setSquadraForm] = useState({
    nome_squadra: '',
    stagione: '2025/2026',
    campionato: '',
    genere: 'F' as GenereSquadra,
    allenatore_primo: '',
    allenatore_secondo: '',
    dirigente: '',
    sponsor_abbinato_id: '',
    category: 'SERIE_D' as 'SERIE_D' | 'CAMPIONATI_SENIOR' | 'GIOVANILI',
    foto_copertina_url: '',
    coverPositionY: 50
  });

  // Player Creation Form (both for global and in-squad quick add)
  const [playerForm, setPlayerForm] = useState<{
    nome: string;
    cognome: string;
    data_nascita: string;
    ruolo: string;
    altezza: number | string;
    numero_maglia: number;
    genere: 'F' | 'M';
    foto_url: string;
    fotoPositionY: number;
    fotoPositionX: number;
  }>({
    nome: '',
    cognome: '',
    data_nascita: '2006-01-01',
    ruolo: '',
    altezza: '',
    numero_maglia: 1,
    genere: 'F',
    foto_url: '',
    fotoPositionY: 50,
    fotoPositionX: 50
  });

  const [isSubmittingPlayer, setIsSubmittingPlayer] = useState(false);

  // Editing squad details state
  const [editingSquadData, setEditingSquadData] = useState<Partial<RosaSquadra> | null>(null);
  const [deletingSquadId, setDeletingSquadId] = useState<string | null>(null);

  // Editing individual athlete state
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingPlayerData, setEditingPlayerData] = useState<(Partial<Giocatore> & { genere?: 'F' | 'M' }) | null>(null);
  const [deletingPlayerId, setDeletingPlayerId] = useState<string | null>(null);

  // Historical Career Modal
  const [historyPlayer, setHistoryPlayer] = useState<{ player: Giocatore; history: RecordStoricoCarriera[] } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Elenco profili dello staff disponibili per le tendine di selezione allenatori
  const [availableStaff, setAvailableStaff] = useState<Array<{ id: string; nomeCognome: string; qualificaTecnica?: string }>>([]);

  React.useEffect(() => {
    const loadStaffOptions = async () => {
      try {
        const snap = await getDocs(collection(db, 'staff_profili'));
        const list: Array<{ id: string; nomeCognome: string; qualificaTecnica?: string }> = [];
        snap.forEach(d => {
          const data = d.data();
          if (data.nomeCognome) {
            list.push({
              id: d.id,
              nomeCognome: data.nomeCognome,
              qualificaTecnica: data.qualificaTecnica
            });
          }
        });
        // Ordina alfabeticamente
        list.sort((a, b) => a.nomeCognome.localeCompare(b.nomeCognome));
        setAvailableStaff(list);
      } catch (err) {
        console.error("Errore caricamento staff profili per tendina:", err);
      }
    };
    loadStaffOptions();
  }, []);

  // Get active squad object
  const activeSquad = useMemo(() => {
    return squadreAll.find(s => s.id === selectedSquadId) || null;
  }, [squadreAll, selectedSquadId]);

  // Helper to extract year from birthdate
  const getBirthYear = (dateStr?: string) => {
    if (!dateStr) return null;
    const year = parseInt(dateStr.split('-')[0], 10);
    return isNaN(year) ? null : year;
  };

  // Helper to test if a player matches age filter
  const matchesAgeFilter = (p: Giocatore, filter: 'Tutti' | 'U13' | 'U14' | 'U16' | 'U18' | 'Senior') => {
    if (filter === 'Tutti') return true;
    const birthYear = getBirthYear(p.data_nascita);
    if (!birthYear) return true;
    const currentYear = 2026;
    const age = currentYear - birthYear;

    if (filter === 'U13') return age <= 13 || birthYear >= 2013;
    if (filter === 'U14') return age <= 14 || birthYear >= 2012;
    if (filter === 'U16') return age <= 16 || birthYear >= 2010;
    if (filter === 'U18') return age <= 18 || birthYear >= 2008;
    if (filter === 'Senior') return age >= 19 || birthYear <= 2007;
    return true;
  };

  // Helper to test if a player matches gender filter
  const matchesGenderFilter = (p: any, filter: 'Tutti' | 'F' | 'M') => {
    if (filter === 'Tutti') return true;
    const g = (p.genere || p.gender || '').toUpperCase();
    if (filter === 'M') return g === 'M';
    if (filter === 'F') return g === 'F' || !g; // If unset, defaults to F
    return true;
  };

  // Helper to match role
  const matchesRoleFilter = (pRuolo: string | undefined | null, filter: string) => {
    if (filter === 'Tutti') return true;
    if (filter === 'SENZA_RUOLO') return !pRuolo || pRuolo.trim() === '';
    if (!pRuolo) return false;
    const rLower = pRuolo.toLowerCase().trim();
    const fLower = filter.toLowerCase().trim();
    if (rLower === fLower) return true;
    // Cross-gender matching
    if (fLower === 'schiacciatore' && (rLower === 'schiacciatore' || rLower === 'schiacciatrice')) return true;
    if (fLower === 'palleggiatore' && (rLower === 'palleggiatore' || rLower === 'palleggiatrice')) return true;
    if (fLower === 'opposto' && (rLower === 'opposto' || rLower === 'opposta')) return true;
    return false;
  };

  // Filtered Players for Global List
  const displayedGlobalGiocatori = useMemo(() => {
    return giocatoriAll.filter(p => {
      const fullName = `${p.nome} ${p.cognome} ${p.cognome} ${p.nome}`.toLowerCase();
      const matchSearch = fullName.includes(playerSearch.toLowerCase()) || (p.numero_maglia?.toString() === playerSearch.trim());
      const matchRole = matchesRoleFilter(p.ruolo, playerRoleFilter);
      const matchGender = matchesGenderFilter(p, playerGenderFilter);
      const matchAge = matchesAgeFilter(p, playerAgeFilter);
      return matchSearch && matchRole && matchGender && matchAge;
    });
  }, [giocatoriAll, playerSearch, playerRoleFilter, playerGenderFilter, playerAgeFilter]);

  // Filtered Players available to be added to active squad
  const availablePlayersForSquad = useMemo(() => {
    if (!activeSquad) return [];
    const currentSquadPlayerIds = new Set((activeSquad.id_atleti || []).map((id: any) => String(typeof id === 'string' ? id : id?.id || '').trim()));
    
    return giocatoriAll.filter(p => {
      const isAlreadyInSquad = currentSquadPlayerIds.has(String(p.id).trim());
      if (isAlreadyInSquad) return false;

      const fullName = `${p.nome} ${p.cognome} ${p.cognome} ${p.nome}`.toLowerCase();
      const matchSearch = fullName.includes(addPlayerSearch.toLowerCase()) || (p.numero_maglia?.toString() === addPlayerSearch.trim());
      const matchRole = matchesRoleFilter(p.ruolo, addPlayerRoleFilter);
      const matchGender = matchesGenderFilter(p, addPlayerGenderFilter);
      const matchAge = matchesAgeFilter(p, addPlayerAgeFilter);
      return matchSearch && matchRole && matchGender && matchAge;
    });
  }, [giocatoriAll, activeSquad, addPlayerSearch, addPlayerRoleFilter, addPlayerGenderFilter, addPlayerAgeFilter]);

  // Set univoco degli ID atleti validi esistenti nell'anagrafica
  const validPlayerIdsSet = useMemo(() => {
    return new Set(giocatoriAll.map(p => String(p.id).trim()));
  }, [giocatoriAll]);

  // Squad Players (Athletes currently in active squad)
  const activeSquadPlayers = useMemo(() => {
    if (!activeSquad || !activeSquad.id_atleti) return [];
    const idMap = new Map(giocatoriAll.map(p => [String(p.id).trim(), p]));
    const seen = new Set<string>();
    const matched: Giocatore[] = [];
    activeSquad.id_atleti.forEach((rawId: any) => {
      const cleanId = String(typeof rawId === 'string' ? rawId : rawId?.id || '').trim();
      if (cleanId && idMap.has(cleanId) && !seen.has(cleanId)) {
        seen.add(cleanId);
        matched.push(idMap.get(cleanId)!);
      }
    });
    return matched;
  }, [giocatoriAll, activeSquad]);

  // Sincronizzazione automatica e pulizia degli ID orfani o duplicati dalla rosa della squadra attiva
  React.useEffect(() => {
    if (!activeSquad || !activeSquad.id_atleti || activeSquad.id_atleti.length === 0 || giocatoriAll.length === 0) return;
    const validIds = new Set(giocatoriAll.map(p => String(p.id).trim()));
    const seen = new Set<string>();
    const validSquadIds: string[] = [];
    let needsCleanup = false;

    for (const rawId of activeSquad.id_atleti) {
      const cleanId = String(typeof rawId === 'string' ? rawId : (rawId as any)?.id || '').trim();
      if (cleanId && validIds.has(cleanId) && !seen.has(cleanId)) {
        seen.add(cleanId);
        validSquadIds.push(cleanId);
        if (cleanId !== rawId) needsCleanup = true;
      } else {
        // ID orfano (non presente nell'anagrafica) o duplicato
        needsCleanup = true;
      }
    }

    if (needsCleanup && validSquadIds.length !== activeSquad.id_atleti.length) {
      setSquadreAll?.(prev => prev.map(s => s.id === activeSquad.id ? { ...s, id_atleti: validSquadIds } : s));
      aggiornaElementoCompleto('rose_squadre', activeSquad.id, { id_atleti: validSquadIds }).catch(err => {
        console.warn("Pulizia automatica ID orfani rosa:", err);
      });
    }
  }, [activeSquad?.id, activeSquad?.id_atleti, giocatoriAll]);

  // Auto-cleanup: rimuovi dal pool "DA ASSEGNARE" gli atleti che hanno già una squadra reale assegnata
  React.useEffect(() => {
    const daAssegnareSquad = squadreAll.find(s => 
      (s.nome_squadra || '').toUpperCase().includes('DA ASSEGNARE') || 
      (s.campionato || '').toUpperCase().includes('DA ASSEGNARE')
    );
    if (!daAssegnareSquad || !daAssegnareSquad.id_atleti || daAssegnareSquad.id_atleti.length === 0) return;

    const realSquads = squadreAll.filter(s => s.id !== daAssegnareSquad.id);
    const assignedIds = new Set<string>();
    realSquads.forEach(s => {
      (s.id_atleti || []).forEach((id: any) => {
        const sid = typeof id === 'string' ? id : id?.id;
        if (sid) assignedIds.add(String(sid).trim());
      });
    });

    const currentPool = daAssegnareSquad.id_atleti;
    const cleanedPool = currentPool.filter((id: any) => {
      const sid = typeof id === 'string' ? id : id?.id;
      return sid && !assignedIds.has(String(sid).trim());
    });

    if (cleanedPool.length !== currentPool.length) {
      setSquadreAll?.(prev => prev.map(s => s.id === daAssegnareSquad.id ? { ...s, id_atleti: cleanedPool } : s));
      aggiornaElementoCompleto('rose_squadre', daAssegnareSquad.id, { id_atleti: cleanedPool }).catch(err => {
        console.error("Errore pulizia automatica pool DA ASSEGNARE:", err);
      });
    }
  }, [squadreAll]);

  // --- ACTIONS ---

  // 1. Add Existing Athlete to Squad
  const handleAddPlayerToSquad = async (playerId: string) => {
    if (!activeSquad) return;
    try {
      const currentIds = activeSquad.id_atleti || [];
      if (currentIds.some(id => String(id).trim() === String(playerId).trim())) return;

      const updatedIds = [...currentIds, playerId];

      // Optimistic 0ms update in state and cache
      setSquadreAll?.(prev => prev.map(s => s.id === activeSquad.id ? { ...s, id_atleti: updatedIds } : s));
      showToast("Atleta aggiunto alla squadra!", "success");

      await aggiornaElementoCompleto('rose_squadre', activeSquad.id, {
        id_atleti: updatedIds
      });

      // Se l'atleta era presente nel pool "DA ASSEGNARE", rimuovilo automaticamente
      const daAssegnareSquad = squadreAll.find(s => 
        s.id !== activeSquad.id && 
        ((s.nome_squadra || '').toUpperCase().includes('DA ASSEGNARE') || (s.campionato || '').toUpperCase().includes('DA ASSEGNARE'))
      );
      if (daAssegnareSquad && daAssegnareSquad.id_atleti?.includes(playerId)) {
        const cleanedPoolIds = daAssegnareSquad.id_atleti.filter(id => (typeof id === 'string' ? id : (id as any)?.id) !== playerId);
        setSquadreAll?.(prev => prev.map(s => s.id === daAssegnareSquad.id ? { ...s, id_atleti: cleanedPoolIds } : s));
        await aggiornaElementoCompleto('rose_squadre', daAssegnareSquad.id, { id_atleti: cleanedPoolIds });
      }
    } catch (e) {
      console.error(e);
      showToast("Errore durante l'inserimento dell'atleta.", "error");
      await loadAllData();
    }
  };

  // 2. Remove Athlete from Squad
  const handleRemovePlayerFromSquad = async (playerId: string, playerFullName: string) => {
    if (!activeSquad) return;
    if (!confirm(`Rimuovere ${playerFullName} dalla rosa di ${activeSquad.nome_squadra}? L'atleta rimarrà salvato nell'anagrafica societaria.`)) {
      return;
    }
    try {
      const currentIds = activeSquad.id_atleti || [];
      const updatedIds = currentIds.filter(id => String(id).trim() !== String(playerId).trim());
      const updatedCapitano = activeSquad.capitano_id === playerId ? undefined : activeSquad.capitano_id;

      // Optimistic 0ms update in state and cache
      setSquadreAll?.(prev => prev.map(s => s.id === activeSquad.id ? { ...s, id_atleti: updatedIds, capitano_id: updatedCapitano } : s));
      showToast(`${playerFullName} rimosso dalla rosa.`, "info");

      await aggiornaElementoCompleto('rose_squadre', activeSquad.id, {
        id_atleti: updatedIds,
        capitano_id: updatedCapitano || undefined
      });
    } catch (e) {
      console.error(e);
      showToast("Errore durante la rimozione dell'atleta.", "error");
      await loadAllData();
    }
  };

  // 3. Toggle Captain Status
  const handleToggleCaptain = async (playerId: string) => {
    if (!activeSquad) return;
    try {
      const newCapitanoId = activeSquad.capitano_id === playerId ? undefined : playerId;

      // Optimistic 0ms update in state and cache
      setSquadreAll?.(prev => prev.map(s => s.id === activeSquad.id ? { ...s, capitano_id: newCapitanoId } : s));
      showToast(newCapitanoId ? "Capitano assegnato!" : "Fascia capitano rimossa.", "success");

      await aggiornaElementoCompleto('rose_squadre', activeSquad.id, {
        capitano_id: newCapitanoId || ''
      });
    } catch (e) {
      console.error(e);
      showToast("Errore durante l'aggiornamento del capitano.", "error");
      await loadAllData();
    }
  };

  // 4. Quick Create & Add Athlete to Active Squad
  const handleCreateAndAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerForm.nome.trim() || !playerForm.cognome.trim()) {
      showToast("Nome e Cognome sono obbligatori!", "error");
      return;
    }

    try {
      setIsSubmittingPlayer(true);
      const cleanNome = playerForm.nome.trim();
      const cleanCognome = playerForm.cognome.trim();

      const finalUrl = (playerForm.foto_url || '').trim();
      const posX = playerForm.fotoPositionX ?? 50;
      const posY = playerForm.fotoPositionY ?? 50;

      // 1. Salva prima l'atleta su Firestore
      const savedPlayer = await addGiocatore({
        nome: cleanNome,
        cognome: cleanCognome,
        data_nascita: playerForm.data_nascita,
        ruolo: playerForm.ruolo,
        altezza: playerForm.altezza && !isNaN(Number(playerForm.altezza)) && Number(playerForm.altezza) > 0 ? Number(playerForm.altezza) : undefined,
        numero_maglia: Number(playerForm.numero_maglia) || 1,
        foto_url: finalUrl,
        fotoPositionX: posX,
        fotoPositionY: posY,
        foto: finalUrl ? {
          url: finalUrl,
          positionX: posX,
          positionY: posY
        } : undefined,
        attivo: true,
        genere: playerForm.genere
      } as any);

      if (!savedPlayer || !savedPlayer.id) {
        throw new Error("Salvataggio dell'atleta non riuscito.");
      }

      const realId = savedPlayer.id;

      // 2. Aggiungi il nuovo atleta all'anagrafica generale
      setGiocatoriAll?.(prev => [savedPlayer, ...prev.filter(p => p.id !== realId)]);

      // 3. Se ci troviamo nella schermata di una squadra specifica, inseriscilo subito nella rosa
      if (activeSquad) {
        const currentIds = (activeSquad.id_atleti || []).map((id: any) => {
          return String(typeof id === 'string' ? id : id?.id || '').trim();
        }).filter(Boolean);

        const updatedIds = Array.from(new Set([...currentIds, realId]));

        // Aggiorna immediatamente lo state React delle squadre
        setSquadreAll?.(prev => prev.map(s => s.id === activeSquad.id ? { ...s, id_atleti: updatedIds } : s));

        // Persisti la nuova rosa su Firestore
        await aggiornaElementoCompleto('rose_squadre', activeSquad.id, {
          id_atleti: updatedIds
        });

        // Se l'atleta era presente nel pool "DA ASSEGNARE", rimuovilo
        const daAssegnareSquad = squadreAll.find(s => 
          s.id !== activeSquad.id && 
          ((s.nome_squadra || '').toUpperCase().includes('DA ASSEGNARE') || (s.campionato || '').toUpperCase().includes('DA ASSEGNARE'))
        );
        if (daAssegnareSquad && daAssegnareSquad.id_atleti?.some(id => String(typeof id === 'string' ? id : (id as any)?.id || '').trim() === realId)) {
          const cleanedPoolIds = (daAssegnareSquad.id_atleti || []).filter(id => String(typeof id === 'string' ? id : (id as any)?.id || '').trim() !== realId);
          setSquadreAll?.(prev => prev.map(s => s.id === daAssegnareSquad.id ? { ...s, id_atleti: cleanedPoolIds } : s));
          await aggiornaElementoCompleto('rose_squadre', daAssegnareSquad.id, { id_atleti: cleanedPoolIds });
        }
      }

      // 4. Reset del form
      setPlayerForm({
        nome: '',
        cognome: '',
        data_nascita: '2006-01-01',
        ruolo: '',
        altezza: '',
        numero_maglia: 1,
        genere: 'F',
        foto_url: '',
        fotoPositionY: 50,
        fotoPositionX: 50
      });

      setIsSubmittingPlayer(false);
      showToast(`Atleta "${cleanCognome} ${cleanNome}" registrato e inserito in rosa con successo!`, "success");

      // Allinea filtri per mostrare subito il nuovo atleta
      setPlayerSearch(cleanCognome);
      setPlayerRoleFilter('Tutti');
      setPlayerGenderFilter('Tutti');
      setPlayerAgeFilter('Tutti');
    } catch (e) {
      console.error("Errore creazione atleta:", e);
      showToast("Errore durante la registrazione dell'atleta: " + (e instanceof Error ? e.message : String(e)), "error");
      setIsSubmittingPlayer(false);
    }
  };

  // 5. Create Squad
  const handleCreateSquadra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!squadraForm.nome_squadra.trim() || !squadraForm.campionato.trim()) {
      showToast("Inserisci nome squadra e campionato!", "error");
      return;
    }

    try {
      const createdSquad = await creaSquadraEAssociaAtleti({
        nome_squadra: squadraForm.nome_squadra.trim(),
        stagione: squadraForm.stagione.trim() || '2025/2026',
        campionato: squadraForm.campionato.trim(),
        genere: squadraForm.genere,
        allenatori: {
          primo: squadraForm.allenatore_primo.trim() || 'Coach NVA',
          ...(squadraForm.allenatore_secondo.trim() ? { secondo: squadraForm.allenatore_secondo.trim() } : {}),
          ...(squadraForm.dirigente.trim() ? { dirigente_accompagnatore: squadraForm.dirigente.trim() } : {})
        },
        ...(squadraForm.sponsor_abbinato_id ? { sponsor_abbinato_id: squadraForm.sponsor_abbinato_id } : {}),
        category: squadraForm.category,
        foto_copertina_url: squadraForm.foto_copertina_url || '',
        coverPositionY: squadraForm.coverPositionY ?? 50,
        cronologia_gare: []
      }, []);

      if (createdSquad) {
        setSquadreAll?.(prev => [...prev, createdSquad]);
      }

      showToast(`Squadra "${squadraForm.nome_squadra}" creata con successo!`, "success");
      setSquadraForm({
        nome_squadra: '',
        stagione: '2025/2026',
        campionato: '',
        genere: 'F',
        allenatore_primo: '',
        allenatore_secondo: '',
        dirigente: '',
        sponsor_abbinato_id: '',
        category: 'SERIE_D',
        foto_copertina_url: '',
        coverPositionY: 50
      });
      setShowCreateSquadForm(false);
    } catch (e) {
      console.error("Errore creazione squadra:", e);
      const msg = e instanceof Error ? e.message : String(e);
      showToast(`Errore durante la creazione della squadra: ${msg}`, "error");
    }
  };

  // 6. Save Squad Details Updates
  const handleSaveSquadDetails = async () => {
    if (!activeSquad || !editingSquadData) return;
    try {
      const targetGender: GenereSquadra = editingSquadData.genere || (editingSquadData as any).gender || getGenereSquadra(editingSquadData as RosaSquadra);
      const updated: RosaSquadra = { 
        ...activeSquad, 
        ...editingSquadData,
        genere: targetGender,
        ruoli_staff: {
          primo: (editingSquadData.ruoli_staff?.primo || activeSquad.ruoli_staff?.primo || '1° Allenatore').trim(),
          secondo: (editingSquadData.ruoli_staff?.secondo || activeSquad.ruoli_staff?.secondo || '2° Allenatore').trim(),
          dirigente_accompagnatore: (editingSquadData.ruoli_staff?.dirigente_accompagnatore || activeSquad.ruoli_staff?.dirigente_accompagnatore || 'Dirigente Accompagnatore').trim()
        }
      };
      setSquadreAll?.(prev => prev.map(s => s.id === activeSquad.id ? updated : s));
      showToast("Dati squadra aggiornati!", "success");
      setEditingSquadData(null);
      await aggiornaElementoCompleto('rose_squadre', activeSquad.id, updated);
    } catch (e) {
      console.error(e);
      showToast("Errore durante l'aggiornamento della squadra.", "error");
      await loadAllData();
    }
  };

  // 7. Save Single Player Updates
  const handleSavePlayerData = async () => {
    if (!editingPlayerId || !editingPlayerData) return;
    try {
      const finalUrl = (editingPlayerData.foto?.url || editingPlayerData.foto_url || '').trim();
      const posX = editingPlayerData.fotoPositionX ?? (editingPlayerData.foto as any)?.positionX ?? 50;
      const posY = editingPlayerData.fotoPositionY ?? (editingPlayerData.foto as any)?.positionY ?? 50;

      const updatedPlayer: Giocatore = {
        ...editingPlayerData,
        id: editingPlayerId,
        altezza: editingPlayerData.altezza ? Number(editingPlayerData.altezza) : null,
        foto_url: finalUrl,
        fotoPositionX: posX,
        fotoPositionY: posY,
        foto: finalUrl ? {
          url: finalUrl,
          positionX: posX,
          positionY: posY
        } : undefined,
        genere: editingPlayerData.genere || 'F'
      } as any;
      setGiocatoriAll?.(prev => prev.map(p => p.id === editingPlayerId ? updatedPlayer : p));
      showToast("Dati atleta salvati con successo!", "success");
      setEditingPlayerId(null);
      setEditingPlayerData(null);
      await aggiornaElementoCompleto('giocatori', editingPlayerId, updatedPlayer);
    } catch (e) {
      console.error(e);
      showToast("Errore durante il salvataggio dell'atleta.", "error");
      await loadAllData();
    }
  };

  // Helper to open player edit modal
  const handleStartEditPlayer = (player: Giocatore) => {
    setEditingPlayerId(player.id);
    const posX = player.fotoPositionX ?? player.foto?.positionX ?? 50;
    const posY = player.fotoPositionY ?? player.foto?.positionY ?? 50;
    const photoUrl = player.foto?.url || player.foto_url || '';
    setEditingPlayerData({
      ...player,
      foto_url: photoUrl,
      fotoPositionX: posX,
      fotoPositionY: posY,
      foto: photoUrl ? {
        url: photoUrl,
        positionX: posX,
        positionY: posY
      } : undefined,
      genere: (player as any).genere || (player as any).gender || 'F'
    });
  };

  // 8. View Career History
  const handleViewHistory = async (player: Giocatore) => {
    try {
      setLoadingHistory(true);
      const history = await getStoricoGiocatore(player.id);
      setHistoryPlayer({ player, history });
    } catch (e) {
      showToast("Impossibile caricare lo storico carriera.", "error");
    } finally {
      setLoadingHistory(false);
    }
  };

  // 9. Golee CSV import
  const handleImportCsvGolee = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsImportingCsv(true);
      showToast("Lettura file CSV Golee in corso...", "info");
      const text = await file.text();
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        showToast("File CSV non valido o vuoto.", "error");
        return;
      }

      let count = 0;
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(/[,;]/).map(p => p.replace(/["']/g, '').trim());
        if (parts.length >= 2 && parts[0] && parts[1]) {
          const parsedAltezza = parts[5] && !isNaN(parseInt(parts[5], 10)) && parseInt(parts[5], 10) > 0 ? parseInt(parts[5], 10) : undefined;
          await addGiocatore({
            nome: parts[0],
            cognome: parts[1],
            data_nascita: parts[2] || '2006-01-01',
            ruolo: (parts[3] as any) || 'Schiacciatore',
            numero_maglia: parseInt(parts[4], 10) || (i),
            altezza: parsedAltezza,
            attivo: true,
            genere: 'F',
            foto_url: ''
          } as any);
          count++;
        }
      }

      showToast(`Importazione completata: ${count} atleti aggiunti!`, "success");
      await loadAllData();
    } catch (err) {
      console.error(err);
      showToast("Errore durante l'importazione del file CSV.", "error");
    } finally {
      setIsImportingCsv(false);
    }
  };

  // 10. Clean default heights (178 cm)
  const [isCleaningHeights, setIsCleaningHeights] = useState(false);
  const handleCleanDefaultHeights = async () => {
    const playersWith178 = giocatoriAll.filter(p => p.altezza === 178);
    if (playersWith178.length === 0) {
      showToast("Nessun atleta con altezza predefinita di 178 cm trovato.", "info");
      return;
    }

    const confermato = window.confirm(
      `Trovati ${playersWith178.length} atleti con altezza fittizia a 178 cm.\n\nVuoi rimuovere questo valore e lasciare l'altezza vuota/non specificata per tutti? Potrai poi inserire l'altezza reale solo per chi la possiede.`
    );
    if (!confermato) return;

    setIsCleaningHeights(true);
    showToast(`Pulizia di ${playersWith178.length} atleti in corso...`, "info");

    try {
      // 1. Aggiornamento ottimistico dello stato a 0ms
      setGiocatoriAll?.(prev => prev.map(p => p.altezza === 178 ? { ...p, altezza: undefined } : p));

      // 2. Aggiornamento su Cloud Firestore in background
      let count = 0;
      for (const p of playersWith178) {
        await aggiornaElementoCompleto('giocatori', p.id, { altezza: null });
        count++;
      }

      showToast(`Pulizia completata! Altezza rimossa con successo da ${count} atleti.`, "success");
    } catch (err) {
      console.error("Errore durante la pulizia delle altezze:", err);
      showToast("Errore durante la pulizia su Cloud. Ricarica la pagina.", "error");
    } finally {
      setIsCleaningHeights(false);
    }
  };

  return (
    <div className="space-y-6 text-sm font-sans" id="admin-tab-squadre">
      
      {/* ========================================================================= */}
      {/* TOP HEADER: SUB-TABS & IMPORT CSV */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div className="flex gap-2 bg-zinc-100 p-1 rounded-xl border border-zinc-200">
          <button
            onClick={() => {
              setSquadSubTab('squadre');
              setSelectedSquadId(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              squadSubTab === 'squadre'
                ? 'bg-brand-yellow text-black shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <Users className="w-4 h-4" /> Gestione Squadre & Rose ({squadreAll.length})
          </button>
          <button
            onClick={() => {
              setSquadSubTab('giocatori');
              setSelectedSquadId(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              squadSubTab === 'giocatori'
                ? 'bg-brand-yellow text-black shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <UserPlus className="w-4 h-4" /> Anagrafica Generale Atleti ({giocatoriAll.length})
          </button>
          <button
            onClick={() => {
              setSquadSubTab('archivio');
              setSelectedSquadId(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              squadSubTab === 'archivio'
                ? 'bg-amber-400 text-black shadow-sm font-bold'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <History className="w-4 h-4" /> Archivio Storico Annate
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {squadSubTab === 'giocatori' && (
            <button
              onClick={handleCleanDefaultHeights}
              disabled={isCleaningHeights}
              className="bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-black font-semibold px-4 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow transition-all"
              title="Rimuovi l'altezza fittizia di 178 cm da tutti gli atleti"
            >
              <Sparkles className="w-4 h-4" />
              {isCleaningHeights ? 'Pulizia in corso...' : 'Azzera Altezze Fittizie (178 cm)'}
            </button>
          )}

          <label className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow transition-all">
            <FileSpreadsheet className="w-4 h-4" />
            {isImportingCsv ? 'Importazione...' : 'Importa CSV Golee'}
            <input
              type="file"
              accept=".csv"
              disabled={isImportingCsv}
              className="hidden"
              onChange={handleImportCsvGolee}
            />
          </label>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: DETTAGLIO SQUADRA SELEZIONATA (DASHBOARD ROSA & STAFF) */}
      {/* ========================================================================= */}
      {squadSubTab === 'squadre' && selectedSquadId && activeSquad && (
        <div className="space-y-6" id="squad-detail-dashboard">
          
          {/* Squad Header Bar */}
          <div className="bg-zinc-900 text-white p-6 rounded-2xl border border-zinc-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2">
              <button
                onClick={() => setSelectedSquadId(null)}
                className="inline-flex items-center gap-1.5 text-xs text-brand-yellow hover:text-white uppercase font-bold tracking-wider transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Torna a Tutte le Squadre
              </button>
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="bg-brand-yellow text-black font-semibold text-xs px-2.5 py-0.5 rounded uppercase">
                  {activeSquad.stagione}
                </span>
                {(() => {
                  const g = getGenereSquadra(activeSquad);
                  return (
                    <span className={`text-xs px-2.5 py-0.5 rounded uppercase font-semibold border ${
                      g === 'F' 
                        ? 'bg-pink-950/80 text-pink-300 border-pink-700/50' 
                        : g === 'MISTO'
                          ? 'bg-purple-950/80 text-purple-300 border-purple-700/50'
                          : 'bg-blue-950/80 text-blue-300 border-blue-700/50'
                    }`}>
                      {g === 'F' ? '♀ Femminile' : g === 'MISTO' ? '👥 Misto' : '♂ Maschile'}
                    </span>
                  );
                })()}
                <span className="bg-zinc-800 text-zinc-300 text-xs px-2.5 py-0.5 rounded uppercase border border-zinc-700">
                  {activeSquad.campionato}
                </span>
                <span className="bg-amber-950/80 text-amber-300 text-xs px-2.5 py-0.5 rounded uppercase border border-amber-800/40">
                  👥 {activeSquadPlayers.length} Atleti in Rosa
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {activeSquad.nome_squadra}
              </h2>
              <p className="text-xs text-zinc-400">
                {activeSquad.ruoli_staff?.primo || '1° Allenatore'}: <b className="text-zinc-200">{typeof activeSquad.allenatori?.primo === 'string' ? activeSquad.allenatori.primo : (activeSquad.allenatori?.primo as any)?.nome || 'Non assegnato'}</b>
                {activeSquad.allenatori?.secondo && ` • ${activeSquad.ruoli_staff?.secondo || '2° Allenatore'}: ${typeof activeSquad.allenatori.secondo === 'string' ? activeSquad.allenatori.secondo : (activeSquad.allenatori.secondo as any)?.nome || activeSquad.allenatori.secondo}`}
                {activeSquad.allenatori?.dirigente_accompagnatore && ` • ${activeSquad.ruoli_staff?.dirigente_accompagnatore || 'Dirigente Accompagnatore'}: ${typeof activeSquad.allenatori.dirigente_accompagnatore === 'string' ? activeSquad.allenatori.dirigente_accompagnatore : (activeSquad.allenatori.dirigente_accompagnatore as any)?.nome || activeSquad.allenatori.dirigente_accompagnatore}`}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setEditingSquadData({
                  ...activeSquad,
                  genere: activeSquad.genere || (activeSquad as any).gender || getGenereSquadra(activeSquad),
                  ruoli_staff: {
                    primo: activeSquad.ruoli_staff?.primo || '1° Allenatore',
                    secondo: activeSquad.ruoli_staff?.secondo || '2° Allenatore',
                    dirigente_accompagnatore: activeSquad.ruoli_staff?.dirigente_accompagnatore || 'Dirigente Accompagnatore',
                    ...activeSquad.ruoli_staff
                  }
                })}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 border border-zinc-700 transition-all cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-brand-yellow" /> Modifica Dati & Staff
              </button>
            </div>
          </div>

          {/* EDIT SQUAD MODAL */}
          {editingSquadData && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-zinc-300 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
                  <h3 className="text-base font-bold text-zinc-950 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-amber-500" /> Modifica Squadra: {activeSquad.nome_squadra}
                  </h3>
                  <button onClick={() => setEditingSquadData(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-zinc-600 text-xs font-semibold uppercase">Nome Squadra *</label>
                    <input
                      type="text"
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-sm font-medium text-zinc-900"
                      value={editingSquadData.nome_squadra || ''}
                      onChange={e => setEditingSquadData({ ...editingSquadData, nome_squadra: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-600 text-xs font-semibold uppercase">Campionato *</label>
                    <input
                      type="text"
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-sm font-medium text-zinc-900"
                      value={editingSquadData.campionato || ''}
                      onChange={e => setEditingSquadData({ ...editingSquadData, campionato: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-600 text-xs font-semibold uppercase">Stagione</label>
                    <input
                      type="text"
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-sm font-medium text-zinc-900"
                      value={editingSquadData.stagione || '2025/2026'}
                      onChange={e => setEditingSquadData({ ...editingSquadData, stagione: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-600 text-xs font-semibold uppercase">Categoria</label>
                    <select
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-sm font-medium text-zinc-900"
                      value={editingSquadData.category || 'SERIE_D'}
                      onChange={e => setEditingSquadData({ ...editingSquadData, category: e.target.value as any })}
                    >
                      <option value="SERIE_D">Serie D (In Evidenza)</option>
                      <option value="CAMPIONATI_SENIOR">Campionati Senior (1° Div / 2° Div)</option>
                      <option value="GIOVANILI">Settore Giovanile (Under 13 - Under 18)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-600 text-xs font-semibold uppercase flex items-center justify-between">
                      <span>Settore / Genere *</span>
                      <span className="text-[10px] text-amber-600 font-mono font-bold">Scelta Badge Squadra</span>
                    </label>
                    <select
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-sm font-medium text-zinc-900 focus:bg-white focus:border-amber-400 focus:outline-none"
                      value={editingSquadData.genere || (editingSquadData as any).gender || getGenereSquadra(editingSquadData as RosaSquadra)}
                      onChange={e => setEditingSquadData({ ...editingSquadData, genere: e.target.value as GenereSquadra })}
                    >
                      <option value="F">♀ Femminile (Rosa)</option>
                      <option value="M">♂ Maschile (Blu)</option>
                      <option value="MISTO">👥 Misto (Viola)</option>
                    </select>
                  </div>
                  {/* 1° MEMBRO STAFF */}
                  <div className="space-y-2 p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-zinc-600 text-xs font-semibold uppercase">Carica / Ruolo 1</label>
                        <span className="text-[10px] text-zinc-400 font-mono">Modificabile a mano</span>
                      </div>
                      <input
                        type="text"
                        list="staff-roles-options"
                        placeholder="1° Allenatore"
                        className="w-full bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-zinc-900 focus:bg-amber-50/50 focus:border-amber-400 focus:outline-none uppercase"
                        value={editingSquadData.ruoli_staff?.primo ?? ''}
                        onChange={e => setEditingSquadData({
                          ...editingSquadData,
                          ruoli_staff: { ...editingSquadData.ruoli_staff, primo: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-zinc-500 text-[11px] font-semibold uppercase">Nome & Cognome</label>
                        {availableStaff.length > 0 && (
                          <span className="text-[10px] text-amber-700 font-mono font-medium">💡 Seleziona o digita</span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          list="staff-list-primo"
                          placeholder="Seleziona o digita es. Gabriel Pablo Kunda"
                          className="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-sm font-medium text-zinc-900 focus:border-amber-400 focus:outline-none"
                          value={typeof editingSquadData.allenatori?.primo === 'string' ? editingSquadData.allenatori.primo : (editingSquadData.allenatori?.primo as any)?.nome || ''}
                          onChange={e => setEditingSquadData({ 
                            ...editingSquadData, 
                            allenatori: { ...editingSquadData.allenatori, primo: e.target.value } as any 
                          })}
                        />
                        <datalist id="staff-list-primo">
                          {availableStaff.map(st => (
                            <option key={st.id} value={st.nomeCognome}>
                              {st.qualificaTecnica ? `${st.nomeCognome} (${st.qualificaTecnica})` : st.nomeCognome}
                            </option>
                          ))}
                        </datalist>
                      </div>
                    </div>
                  </div>

                  {/* 2° MEMBRO STAFF */}
                  <div className="space-y-2 p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-zinc-600 text-xs font-semibold uppercase">Carica / Ruolo 2</label>
                        <span className="text-[10px] text-zinc-400 font-mono">Modificabile a mano</span>
                      </div>
                      <input
                        type="text"
                        list="staff-roles-options"
                        placeholder="2° Allenatore"
                        className="w-full bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-zinc-900 focus:bg-amber-50/50 focus:border-amber-400 focus:outline-none uppercase"
                        value={editingSquadData.ruoli_staff?.secondo ?? ''}
                        onChange={e => setEditingSquadData({
                          ...editingSquadData,
                          ruoli_staff: { ...editingSquadData.ruoli_staff, secondo: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-zinc-500 text-[11px] font-semibold uppercase">Nome & Cognome</label>
                        {availableStaff.length > 0 && (
                          <span className="text-[10px] text-amber-700 font-mono font-medium">💡 Seleziona o digita</span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          list="staff-list-secondo"
                          placeholder="Seleziona o digita es. Giulia Leonardi"
                          className="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-sm font-medium text-zinc-900 focus:border-amber-400 focus:outline-none"
                          value={typeof editingSquadData.allenatori?.secondo === 'string' ? editingSquadData.allenatori.secondo : (editingSquadData.allenatori?.secondo as any)?.nome || ''}
                          onChange={e => setEditingSquadData({ 
                            ...editingSquadData, 
                            allenatori: { ...editingSquadData.allenatori, secondo: e.target.value } as any 
                          })}
                        />
                        <datalist id="staff-list-secondo">
                          {availableStaff.map(st => (
                            <option key={st.id} value={st.nomeCognome}>
                              {st.qualificaTecnica ? `${st.nomeCognome} (${st.qualificaTecnica})` : st.nomeCognome}
                            </option>
                          ))}
                        </datalist>
                      </div>
                    </div>
                  </div>

                  {/* 3° MEMBRO STAFF / DIRIGENZIALE */}
                  <div className="space-y-2 p-3 bg-zinc-50 border border-zinc-200 rounded-xl sm:col-span-2">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-zinc-600 text-xs font-semibold uppercase">Carica / Ruolo 3 (Dirigente / Tecnico)</label>
                        <span className="text-[10px] text-zinc-400 font-mono">Modificabile a mano</span>
                      </div>
                      <input
                        type="text"
                        list="staff-roles-options"
                        placeholder="Dirigente Accompagnatore"
                        className="w-full bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-zinc-900 focus:bg-amber-50/50 focus:border-amber-400 focus:outline-none uppercase"
                        value={editingSquadData.ruoli_staff?.dirigente_accompagnatore ?? ''}
                        onChange={e => setEditingSquadData({
                          ...editingSquadData,
                          ruoli_staff: { ...editingSquadData.ruoli_staff, dirigente_accompagnatore: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-zinc-500 text-[11px] font-semibold uppercase">Nome & Cognome</label>
                        {availableStaff.length > 0 && (
                          <span className="text-[10px] text-amber-700 font-mono font-medium">💡 Seleziona o digita</span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          list="staff-list-dirigente"
                          placeholder="Seleziona o digita es. Zuppone Massimiliano"
                          className="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-sm font-medium text-zinc-900 focus:border-amber-400 focus:outline-none"
                          value={typeof editingSquadData.allenatori?.dirigente_accompagnatore === 'string' ? editingSquadData.allenatori.dirigente_accompagnatore : (editingSquadData.allenatori?.dirigente_accompagnatore as any)?.nome || ''}
                          onChange={e => setEditingSquadData({ 
                            ...editingSquadData, 
                            allenatori: { ...editingSquadData.allenatori, dirigente_accompagnatore: e.target.value } as any 
                          })}
                        />
                        <datalist id="staff-list-dirigente">
                          {availableStaff.map(st => (
                            <option key={st.id} value={st.nomeCognome}>
                              {st.qualificaTecnica ? `${st.nomeCognome} (${st.qualificaTecnica})` : st.nomeCognome}
                            </option>
                          ))}
                        </datalist>
                      </div>
                    </div>
                  </div>

                  {/* Datalist globale per i suggerimenti di cariche e ruoli */}
                  <datalist id="staff-roles-options">
                    {CARICHE_STAFF_DEFAULT.map(carica => (
                      <option key={carica} value={carica} />
                    ))}
                  </datalist>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-zinc-600 text-xs font-semibold uppercase">Foto di Copertina Squadra</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://..."
                        className="flex-1 min-w-0 bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-sm font-medium text-zinc-900"
                        value={editingSquadData.foto_copertina_url || ''}
                        onChange={e => setEditingSquadData({ ...editingSquadData, foto_copertina_url: e.target.value })}
                      />
                      <label className="bg-zinc-900 hover:bg-black text-white px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer text-xs font-medium shrink-0">
                        <Camera className="w-4 h-4 text-brand-yellow" /> Carica
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              showToast("Ottimizzazione e caricamento foto copertina...", "info");
                              let url = '';
                              try {
                                const compResult = await compressImage(file, IMAGE_PRESETS.SQUAD_COVER);
                                url = await caricaBlobSuStorage(compResult.blob, `squadre/${activeSquad.id}_cover_${Date.now()}.webp`);
                              } catch (compErr) {
                                url = await caricaFileSuStorage(file, `squadre/${activeSquad.id}_cover_${Date.now()}`);
                              }
                              setEditingSquadData({ ...editingSquadData, foto_copertina_url: url });
                              showToast("Foto copertina caricata!", "success");
                            } catch (err) {
                              showToast("Errore caricamento foto.", "error");
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
                  <button
                    onClick={() => setEditingSquadData(null)}
                    className="bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-medium px-4 py-2.5 rounded-xl text-xs cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleSaveSquadDetails}
                    className="bg-brand-yellow hover:bg-yellow-400 text-black font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer shadow"
                  >
                    Salva Modifiche
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ROSTER SECTION (ELENCO ATLETI IN ROSA) */}
          <div className="bg-white border border-zinc-200 p-6 rounded-2xl space-y-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-950 flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  Atleti Convocati in Rosa ({activeSquadPlayers.length})
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Elenco degli atleti che compongono l'organico di questa squadra.
                </p>
              </div>
            </div>

            {/* List of Players Currently in this Squad */}
            {activeSquadPlayers.length === 0 ? (
              <div className="text-center py-10 bg-zinc-50 border border-dashed border-zinc-300 rounded-2xl space-y-2">
                <Users className="w-8 h-8 text-zinc-300 mx-auto" />
                <p className="font-semibold text-zinc-700 text-sm">Nessun atleta in rosa</p>
                <p className="text-xs text-zinc-500">Usa il pannello sottostante per associare atleti a questa squadra.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeSquadPlayers.map(player => {
                  const isCapitano = activeSquad.capitano_id === player.id;
                  const birthYear = getBirthYear(player.data_nascita);
                  const playerGender = (player as any).genere || (player as any).gender || 'F';

                  return (
                    <div 
                      key={player.id} 
                      className={`bg-zinc-50/80 border rounded-xl p-3.5 flex items-center justify-between gap-3 transition-all relative ${
                        isCapitano ? 'border-amber-400 bg-amber-50/60 shadow-sm ring-1 ring-amber-300' : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-zinc-900 text-brand-yellow font-bold text-xs px-2 py-0.5 rounded">
                            #{player.numero_maglia}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            playerGender === 'M' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                          }`}>
                            {playerGender === 'M' ? '♂ Maschio' : '♀ Femmina'}
                          </span>
                          {isCapitano && (
                            <span className="bg-amber-500 text-black font-bold text-[10px] uppercase px-2 py-0.5 rounded flex items-center gap-1">
                              <Trophy className="w-3 h-3" /> Capitano
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-zinc-950 text-base mt-1 leading-snug">
                          {player.cognome} {player.nome}
                        </h4>
                        
                        <div className="flex items-center gap-3 text-xs text-zinc-600 mt-1 flex-wrap">
                          {player.ruolo ? (
                            <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                              {formatRuoloGiocatore(player.ruolo, playerGender)}
                            </span>
                          ) : (
                            <span className="font-medium text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 text-[11px]">
                              Nessun ruolo
                            </span>
                          )}
                          {player.altezza && player.altezza > 0 ? <span>{player.altezza} cm</span> : null}
                          {birthYear && <span>Anno {birthYear}</span>}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button
                          onClick={() => handleStartEditPlayer(player)}
                          className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          title="Modifica scheda atleta (dati, foto, altezza, genere)"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-zinc-600" /> Modifica
                        </button>

                        <button
                          onClick={() => handleToggleCaptain(player.id)}
                          className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isCapitano 
                              ? 'bg-amber-200 text-amber-900 border border-amber-300' 
                              : 'bg-zinc-200 hover:bg-amber-100 text-zinc-700'
                          }`}
                          title="Assegna/Rimuovi fascia di Capitano"
                        >
                          <Star className={`w-3.5 h-3.5 ${isCapitano ? 'fill-amber-500 text-amber-500' : 'text-zinc-500'}`} />
                          {isCapitano ? 'Capitano' : 'Fai Capitano'}
                        </button>

                        <button
                          onClick={() => handleRemovePlayerFromSquad(player.id, `${player.cognome} ${player.nome}`)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          title="Rimuovi dalla squadra"
                        >
                          <UserX className="w-3.5 h-3.5" /> Rimuovi
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SEZIONE: AGGIUNGI ATLETI ALLA SQUADRA ATTIVA (ELENCO AMPIO) */}
          {/* ========================================================================= */}
          <div className="bg-white border border-zinc-200 p-6 rounded-2xl space-y-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-950 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-600" />
                  Aggiungi Atleta in {activeSquad.nome_squadra}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Cerca e seleziona atleti registrati o creane uno nuovo inserendolo direttamente in questa rosa.
                </p>
              </div>

              {/* Mode Toggle: Select vs Create */}
              <div className="flex gap-1.5 bg-zinc-100 p-1 rounded-xl border border-zinc-200">
                <button
                  onClick={() => setAddPlayerMode('select')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    addPlayerMode === 'select' 
                      ? 'bg-zinc-900 text-brand-yellow shadow-sm' 
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  🔍 Scegli da Anagrafica
                </button>
                <button
                  onClick={() => setAddPlayerMode('create')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    addPlayerMode === 'create' 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  ⚡ Crea e Aggiungi Subito
                </button>
              </div>
            </div>

            {/* MODE 1: SELECT EXISTING ATHLETE WITH ADVANCED FILTERS */}
            {addPlayerMode === 'select' && (
              <div className="space-y-4">
                {/* Filter & Search Bar */}
                <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Text Search */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Cerca per nome o cognome..."
                        className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400"
                        value={addPlayerSearch}
                        onChange={e => setAddPlayerSearch(e.target.value)}
                      />
                    </div>

                    {/* Role Filter */}
                    <select
                      className="w-full bg-white border border-zinc-300 rounded-xl p-2 text-xs font-medium text-zinc-900"
                      value={addPlayerRoleFilter}
                      onChange={e => setAddPlayerRoleFilter(e.target.value)}
                    >
                      <option value="Tutti">Tutti i Ruoli</option>
                      <option value="SENZA_RUOLO">Senza Ruolo (Minivolley)</option>
                      <option value="Palleggiatore">Palleggiatori / Palleggiatrici</option>
                      <option value="Schiacciatore">Schiacciatori / Schiacciatrici</option>
                      <option value="Opposto">Opposti / Opposte</option>
                      <option value="Centrale">Centrali</option>
                      <option value="Libero">Liberi</option>
                      <option value="Universale">Universali</option>
                    </select>

                    {/* Gender Filter */}
                    <select
                      className="w-full bg-white border border-zinc-300 rounded-xl p-2 text-xs font-medium text-zinc-900"
                      value={addPlayerGenderFilter}
                      onChange={e => setAddPlayerGenderFilter(e.target.value as any)}
                    >
                      <option value="Tutti">Tutti i Generi (F / M)</option>
                      <option value="F">Solo Femmine (F)</option>
                      <option value="M">Solo Maschi (M)</option>
                    </select>

                    {/* Age / Category Filter */}
                    <select
                      className="w-full bg-white border border-zinc-300 rounded-xl p-2 text-xs font-medium text-zinc-900"
                      value={addPlayerAgeFilter}
                      onChange={e => setAddPlayerAgeFilter(e.target.value as any)}
                    >
                      <option value="Tutti">Tutte le Età</option>
                      <option value="U13">Under 13 (2013 e succ.)</option>
                      <option value="U14">Under 14 (2012)</option>
                      <option value="U16">Under 16 (2010 - 2011)</option>
                      <option value="U18">Under 18 (2008 - 2009)</option>
                      <option value="Senior">Senior (2007 e prec.)</option>
                    </select>
                  </div>
                </div>

                {/* Available Athletes List (ELENCO AMPIO AD ALTA LEGGIBILITÀ) */}
                {availablePlayersForSquad.length === 0 ? (
                  <div className="text-center py-10 bg-zinc-50 border border-zinc-200 rounded-xl">
                    <p className="text-xs text-zinc-500 font-medium">Nessun atleta disponibile con i filtri selezionati.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto p-1">
                    {availablePlayersForSquad.map(player => {
                      const birthYear = getBirthYear(player.data_nascita);
                      const playerGender = (player as any).genere || (player as any).gender || 'F';

                      return (
                        <div key={player.id} className="bg-white border border-zinc-200 hover:border-emerald-500 p-3.5 rounded-xl flex items-center justify-between gap-3 shadow-sm hover:shadow transition-all">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-zinc-100 text-zinc-800 font-bold text-xs px-2 py-0.5 rounded">
                                #{player.numero_maglia}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                playerGender === 'M' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                              }`}>
                                {playerGender === 'M' ? '♂ Maschio' : '♀ Femmina'}
                              </span>
                            </div>

                            <h5 className="font-bold text-zinc-950 text-base mt-1">
                              {player.cognome} {player.nome}
                            </h5>

                            <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1 flex-wrap">
                              {player.ruolo ? (
                                <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                                  {formatRuoloGiocatore(player.ruolo, playerGender)}
                                </span>
                              ) : (
                                <span className="font-medium text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 text-[11px]">
                                  Nessun ruolo
                                </span>
                              )}
                              {player.altezza && player.altezza > 0 ? <span>{player.altezza} cm</span> : null}
                              {birthYear && <span>Anno {birthYear}</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleStartEditPlayer(player)}
                              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 p-2 rounded-xl transition-all cursor-pointer"
                              title="Modifica scheda atleta"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAddPlayerToSquad(player.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-all cursor-pointer font-bold text-xs flex items-center gap-1.5 shadow"
                              title="Aggiungi alla rosa"
                            >
                              <Plus className="w-4 h-4" /> Aggiungi
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* MODE 2: CREATE NEW ATHLETE DIRECTLY IN THIS SQUAD */}
            {addPlayerMode === 'create' && (
              <form onSubmit={handleCreateAndAddPlayer} className="bg-emerald-50/60 border border-emerald-200 p-5 rounded-2xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-zinc-700 text-xs font-semibold uppercase">Nome *</label>
                    <input
                      type="text"
                      required
                      placeholder="es. Giulia"
                      className="w-full bg-white border border-zinc-300 rounded-xl p-2 text-xs font-medium text-zinc-900"
                      value={playerForm.nome}
                      onChange={e => setPlayerForm({ ...playerForm, nome: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-700 text-xs font-semibold uppercase">Cognome *</label>
                    <input
                      type="text"
                      required
                      placeholder="es. Rossi"
                      className="w-full bg-white border border-zinc-300 rounded-xl p-2 text-xs font-medium text-zinc-900"
                      value={playerForm.cognome}
                      onChange={e => setPlayerForm({ ...playerForm, cognome: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-700 text-xs font-semibold uppercase">Ruolo (Opzionale)</label>
                    <select
                      className="w-full bg-white border border-zinc-300 rounded-xl p-2 text-xs font-medium text-zinc-900"
                      value={playerForm.ruolo}
                      onChange={e => setPlayerForm({ ...playerForm, ruolo: e.target.value })}
                    >
                      <option value="">-- Nessun Ruolo (es. Minivolley) --</option>
                      <option value="Schiacciatore">{playerForm.genere === 'F' ? 'Schiacciatrice' : 'Schiacciatore'}</option>
                      <option value="Palleggiatore">{playerForm.genere === 'F' ? 'Palleggiatrice' : 'Palleggiatore'}</option>
                      <option value="Opposto">{playerForm.genere === 'F' ? 'Opposta' : 'Opposto'}</option>
                      <option value="Centrale">Centrale</option>
                      <option value="Libero">Libero</option>
                      <option value="Universale">Universale</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-700 text-xs font-semibold uppercase">Sesso / Genere *</label>
                    <select
                      className="w-full bg-white border border-zinc-300 rounded-xl p-2 text-xs font-medium text-zinc-900"
                      value={playerForm.genere}
                      onChange={e => setPlayerForm({ ...playerForm, genere: e.target.value as any })}
                    >
                      <option value="F">Femmina (F)</option>
                      <option value="M">Maschio (M)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-700 text-xs font-semibold uppercase">Numero Maglia *</label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      required
                      className="w-full bg-white border border-zinc-300 rounded-xl p-2 text-xs font-medium text-zinc-900"
                      value={playerForm.numero_maglia}
                      onChange={e => setPlayerForm({ ...playerForm, numero_maglia: parseInt(e.target.value, 10) || 1 })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-700 text-xs font-semibold uppercase">Data di Nascita</label>
                    <input
                      type="date"
                      className="w-full bg-white border border-zinc-300 rounded-xl p-2 text-xs font-medium text-zinc-900"
                      value={playerForm.data_nascita}
                      onChange={e => setPlayerForm({ ...playerForm, data_nascita: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-700 text-xs font-semibold uppercase">Altezza (cm)</label>
                    <input
                      type="number"
                      min="100"
                      max="230"
                      placeholder="Opzionale (es. 180)"
                      className="w-full bg-white border border-zinc-300 rounded-xl p-2 text-xs font-medium text-zinc-900"
                      value={playerForm.altezza}
                      onChange={e => setPlayerForm({ ...playerForm, altezza: e.target.value ? parseInt(e.target.value, 10) : '' })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-700 text-xs font-semibold uppercase">Azione</label>
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer transition-all"
                    >
                      + Crea e Inserisci
                    </button>
                  </div>
                </div>
              </form>
            )}

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: ELENCO GENERALE SQUADRE */}
      {/* ========================================================================= */}
      {squadSubTab === 'squadre' && !selectedSquadId && (
        <div className="space-y-6">
          
          {/* Header Action to Create Squad */}
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-zinc-950">
                Squadre & Rose Registrate ({squadreAll.length})
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Clicca su una squadra per aprirla, gestire gli atleti e nominare il capitano.
              </p>
            </div>

            <button
              onClick={() => setShowCreateSquadForm(!showCreateSquadForm)}
              className="bg-brand-yellow hover:bg-yellow-400 text-black font-bold uppercase text-xs tracking-wider px-4 py-2.5 rounded-xl transition-all shadow cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> {showCreateSquadForm ? 'Chiudi Form' : 'Nuova Squadra'}
            </button>
          </div>

          {/* CREATE SQUAD FORM (ACCORDION) */}
          {showCreateSquadForm && (
            <div className="bg-white border-2 border-brand-yellow p-6 rounded-2xl space-y-4 shadow-md">
              <h4 className="text-base font-bold text-zinc-950 flex items-center gap-2 border-b border-zinc-200 pb-2">
                <Plus className="w-5 h-5 text-amber-500" /> Crea Nuova Squadra / Organico
              </h4>

              <form onSubmit={handleCreateSquadra} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-zinc-600 text-xs font-semibold uppercase">Nome Squadra *</label>
                    <input
                      type="text"
                      required
                      placeholder="es. Serie D Maschile"
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                      value={squadraForm.nome_squadra}
                      onChange={e => setSquadraForm({ ...squadraForm, nome_squadra: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-600 text-xs font-semibold uppercase">Campionato *</label>
                    <input
                      type="text"
                      required
                      placeholder="es. FIPAV Serie D - Girone A"
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                      value={squadraForm.campionato}
                      onChange={e => setSquadraForm({ ...squadraForm, campionato: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-600 text-xs font-semibold uppercase">Stagione</label>
                    <input
                      type="text"
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                      value={squadraForm.stagione}
                      onChange={e => setSquadraForm({ ...squadraForm, stagione: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-600 text-xs font-semibold uppercase">Categoria</label>
                    <select
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                      value={squadraForm.category}
                      onChange={e => setSquadraForm({ ...squadraForm, category: e.target.value as any })}
                    >
                      <option value="SERIE_D">Serie D (In Evidenza)</option>
                      <option value="CAMPIONATI_SENIOR">Campionati Senior</option>
                      <option value="GIOVANILI">Settore Giovanile</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-600 text-xs font-semibold uppercase flex items-center justify-between">
                      <span>Settore / Genere *</span>
                      <span className="text-[10px] text-amber-600 font-mono font-bold">Scelta Badge Squadra</span>
                    </label>
                    <select
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900 focus:bg-white focus:border-amber-400 focus:outline-none"
                      value={squadraForm.genere}
                      onChange={e => setSquadraForm({ ...squadraForm, genere: e.target.value as GenereSquadra })}
                    >
                      <option value="F">♀ Femminile (Rosa)</option>
                      <option value="M">♂ Maschile (Blu)</option>
                      <option value="MISTO">👥 Misto (Viola)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-600 text-xs font-semibold uppercase">1° Allenatore</label>
                    <input
                      type="text"
                      list="create-staff-list-primo"
                      placeholder="Seleziona o digita es. Marco Rossi"
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900 focus:bg-white focus:border-amber-400 focus:outline-none"
                      value={squadraForm.allenatore_primo}
                      onChange={e => setSquadraForm({ ...squadraForm, allenatore_primo: e.target.value })}
                    />
                    <datalist id="create-staff-list-primo">
                      {availableStaff.map(st => (
                        <option key={st.id} value={st.nomeCognome}>
                          {st.qualificaTecnica ? `${st.nomeCognome} (${st.qualificaTecnica})` : st.nomeCognome}
                        </option>
                      ))}
                    </datalist>
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-600 text-xs font-semibold uppercase">2° Allenatore</label>
                    <input
                      type="text"
                      list="create-staff-list-secondo"
                      placeholder="Seleziona o digita es. Laura Bianchi"
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900 focus:bg-white focus:border-amber-400 focus:outline-none"
                      value={squadraForm.allenatore_secondo}
                      onChange={e => setSquadraForm({ ...squadraForm, allenatore_secondo: e.target.value })}
                    />
                    <datalist id="create-staff-list-secondo">
                      {availableStaff.map(st => (
                        <option key={st.id} value={st.nomeCognome}>
                          {st.qualificaTecnica ? `${st.nomeCognome} (${st.qualificaTecnica})` : st.nomeCognome}
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateSquadForm(false)}
                    className="bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-medium px-4 py-2 rounded-xl text-xs cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="bg-brand-yellow hover:bg-yellow-400 text-black font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer transition-all"
                  >
                    Registra Squadra
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TEAMS GRID LIST */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedSquadreList.map(team => {
              const playersCount = (team.id_atleti || []).filter((id: any) => {
                const cleanId = String(typeof id === 'string' ? id : id?.id || '').trim();
                return cleanId && validPlayerIdsSet.has(cleanId);
              }).length;
              const coachName = typeof team.allenatori?.primo === 'string' ? team.allenatori.primo : (team.allenatori?.primo as any)?.nome || 'Non assegnato';

              return (
                <div 
                  key={team.id}
                  className="bg-white border border-zinc-200 hover:border-brand-yellow rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="bg-zinc-900 text-brand-yellow font-bold text-[10px] px-2 py-0.5 rounded uppercase">
                        {team.stagione}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(() => {
                          const g = getGenereSquadra(team);
                          return (
                            <span className={`font-semibold text-[10px] px-2 py-0.5 rounded uppercase border ${
                              g === 'F' 
                                ? 'bg-pink-50 border-pink-200 text-pink-700' 
                                : g === 'MISTO'
                                  ? 'bg-purple-50 border-purple-200 text-purple-700'
                                  : 'bg-blue-50 border-blue-200 text-blue-700'
                            }`}>
                              {g === 'F' ? '♀ Femminile' : g === 'MISTO' ? '👥 Misto' : '♂ Maschile'}
                            </span>
                          );
                        })()}
                        <span className="bg-amber-100 text-amber-900 font-semibold text-[10px] px-2 py-0.5 rounded uppercase">
                          {team.category || 'SERIE_D'}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-lg font-bold text-zinc-950 group-hover:text-amber-600 transition-colors leading-snug">
                      {team.nome_squadra}
                    </h4>
                    <p className="text-zinc-500 text-xs line-clamp-1">
                      {team.campionato}
                    </p>
                    <p className="text-zinc-600 text-xs">
                      1° Coach: <b>{coachName}</b>
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-zinc-100">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>👥 <strong>{playersCount}</strong> Atleti in Rosa</span>
                      {team.capitano_id && (
                        <span className="text-amber-600 font-semibold flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5" /> Capitano
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedSquadId(team.id)}
                        className="flex-1 bg-zinc-900 hover:bg-brand-yellow hover:text-black text-white font-semibold uppercase text-xs tracking-wider py-2 px-3 rounded-xl transition-all shadow flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" /> Gestisci Rosa & Atleti
                      </button>

                      {deletingSquadId === team.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 px-2 py-1 rounded-xl text-xs animate-pulse">
                          <span className="text-rose-700 font-bold text-[10px]">Eliminare?</span>
                          <button
                            onClick={async () => {
                              try {
                                const sId = team.id;
                                setSquadreAll?.(prev => prev.filter(s => s.id !== sId));
                                showToast("Squadra eliminata!", "success");
                                setDeletingSquadId(null);
                                if (selectedSquadId === sId) {
                                  setSelectedSquadId(null);
                                }
                                await eliminaElemento('rose_squadre', sId);
                              } catch (e) {
                                showToast("Errore eliminazione.", "error");
                                await loadAllData();
                              }
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-2 py-0.5 rounded font-bold text-[10px] cursor-pointer"
                          >
                            SÌ
                          </button>
                          <button
                            onClick={() => setDeletingSquadId(null)}
                            className="bg-zinc-200 hover:bg-zinc-300 text-zinc-700 px-1.5 py-0.5 rounded font-bold text-[10px] cursor-pointer"
                          >
                            NO
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingSquadId(team.id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 p-2 rounded-xl transition-colors cursor-pointer"
                          title="Elimina squadra"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 3: ANAGRAFICA GENERALE ATLETI (ELENCO AMPIO) */}
      {/* ========================================================================= */}
      {squadSubTab === 'giocatori' && (
        <div className="space-y-6" id="global-players-anagrafica">
          
          {/* Filter Bar with Search, Role, Gender, Age */}
          <div className="bg-white border border-zinc-200 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-950 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-amber-500" />
                  Filtra Anagrafica Atleti ({displayedGlobalGiocatori.length} di {giocatoriAll.length})
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Text Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cerca per nome o cognome..."
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400"
                  value={playerSearch}
                  onChange={e => setPlayerSearch(e.target.value)}
                />
              </div>

              {/* Role Filter */}
              <select
                className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2 text-xs font-medium text-zinc-900"
                value={playerRoleFilter}
                onChange={e => setPlayerRoleFilter(e.target.value)}
              >
                <option value="Tutti">Tutti i Ruoli</option>
                <option value="SENZA_RUOLO">Senza Ruolo (Minivolley)</option>
                <option value="Palleggiatore">Palleggiatori / Palleggiatrici</option>
                <option value="Schiacciatore">Schiacciatori / Schiacciatrici</option>
                <option value="Opposto">Opposti / Opposte</option>
                <option value="Centrale">Centrali</option>
                <option value="Libero">Liberi</option>
                <option value="Universale">Universali</option>
              </select>

              {/* Gender Filter */}
              <select
                className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2 text-xs font-medium text-zinc-900"
                value={playerGenderFilter}
                onChange={e => setPlayerGenderFilter(e.target.value as any)}
              >
                <option value="Tutti">Tutti i Generi (F / M)</option>
                <option value="F">Solo Femmine (F)</option>
                <option value="M">Solo Maschi (M)</option>
              </select>

              {/* Age / Category Filter */}
              <select
                className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2 text-xs font-medium text-zinc-900"
                value={playerAgeFilter}
                onChange={e => setPlayerAgeFilter(e.target.value as any)}
              >
                <option value="Tutti">Tutte le Età</option>
                <option value="U13">Under 13 (2013 e succ.)</option>
                <option value="U14">Under 14 (2012)</option>
                <option value="U16">Under 16 (2010 - 2011)</option>
                <option value="U18">Under 18 (2008 - 2009)</option>
                <option value="Senior">Senior (2007 e prec.)</option>
              </select>
            </div>
          </div>

          {/* Form Create New Athlete */}
          <div className="bg-white border border-zinc-200 p-6 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-zinc-950 flex items-center gap-2 border-b border-zinc-200 pb-2">
              <UserPlus className="w-5 h-5 text-amber-500" /> Registra Nuovo Atleta in Società
            </h3>

            <form onSubmit={handleCreateAndAddPlayer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-600 text-xs font-semibold uppercase">Nome *</label>
                  <input
                    type="text"
                    required
                    placeholder="es. Silvia"
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                    value={playerForm.nome}
                    onChange={e => setPlayerForm({ ...playerForm, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-600 text-xs font-semibold uppercase">Cognome *</label>
                  <input
                    type="text"
                    required
                    placeholder="es. Marchetti"
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                    value={playerForm.cognome}
                    onChange={e => setPlayerForm({ ...playerForm, cognome: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-600 text-xs font-semibold uppercase">Ruolo (Opzionale)</label>
                  <select
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                    value={playerForm.ruolo}
                    onChange={e => setPlayerForm({ ...playerForm, ruolo: e.target.value })}
                  >
                    <option value="">-- Nessun Ruolo (es. Minivolley) --</option>
                    <option value="Schiacciatore">{playerForm.genere === 'F' ? 'Schiacciatrice' : 'Schiacciatore'}</option>
                    <option value="Palleggiatore">{playerForm.genere === 'F' ? 'Palleggiatrice' : 'Palleggiatore'}</option>
                    <option value="Opposto">{playerForm.genere === 'F' ? 'Opposta' : 'Opposto'}</option>
                    <option value="Centrale">Centrale</option>
                    <option value="Libero">Libero</option>
                    <option value="Universale">Universale</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-600 text-xs font-semibold uppercase">Sesso / Genere *</label>
                  <select
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                    value={playerForm.genere}
                    onChange={e => setPlayerForm({ ...playerForm, genere: e.target.value as any })}
                  >
                    <option value="F">Femmina (F)</option>
                    <option value="M">Maschio (M)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-600 text-xs font-semibold uppercase">Numero Maglia *</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    required
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                    value={playerForm.numero_maglia}
                    onChange={e => setPlayerForm({ ...playerForm, numero_maglia: parseInt(e.target.value, 10) || 1 })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-600 text-xs font-semibold uppercase">Data di Nascita</label>
                  <input
                    type="date"
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                    value={playerForm.data_nascita}
                    onChange={e => setPlayerForm({ ...playerForm, data_nascita: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-600 text-xs font-semibold uppercase">Altezza (cm)</label>
                  <input
                    type="number"
                    min="100"
                    max="230"
                    placeholder="Opzionale (es. 180)"
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                    value={playerForm.altezza}
                    onChange={e => setPlayerForm({ ...playerForm, altezza: e.target.value ? parseInt(e.target.value, 10) : '' })}
                  />
                </div>
                <div className="space-y-1 sm:col-span-3 lg:col-span-4">
                  <div className="flex items-center justify-between">
                    <label className="text-zinc-600 text-xs font-semibold uppercase">Foto & Inquadratura Atleta</label>
                    {playerForm.foto_url && (
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                        ✓ Foto Pronta
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl">
                    {/* Anteprima Real-Time */}
                    <div className="w-28 sm:w-32 aspect-[3/4] shrink-0 bg-zinc-900 rounded-xl overflow-hidden border-2 border-brand-yellow/60 shadow-md relative flex items-center justify-center">
                      {playerForm.foto_url ? (
                        <img
                          src={playerForm.foto_url}
                          alt="Anteprima Atleta"
                          className="w-full h-full object-cover"
                          style={{
                            objectPosition: `${playerForm.fotoPositionX ?? 50}% ${playerForm.fotoPositionY ?? 50}%`
                          }}
                        />
                      ) : (
                        <div className="text-center p-2 text-zinc-500 space-y-1">
                          <Camera className="w-6 h-6 mx-auto stroke-1 text-zinc-400" />
                          <span className="text-[9px] font-mono block">Nessuna foto</span>
                        </div>
                      )}
                    </div>

                    {/* Controlli di Caricamento & Slider Altezza / Larghezza (Focal Point Y / X) */}
                    <div className="flex-1 space-y-3 justify-center flex flex-col">
                      <div className="flex gap-2">
                        <label className="bg-zinc-900 hover:bg-black text-white px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer text-xs font-medium shrink-0 shadow-sm transition-colors">
                          <Camera className="w-3.5 h-3.5 text-brand-yellow" /> 
                          {playerForm.foto_url ? 'Cambia Foto' : 'Scegli File Foto'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                showToast("Ottimizzazione e caricamento foto atleta...", "info");
                                let url = '';
                                try {
                                  const compResult = await compressImage(file, IMAGE_PRESETS.ATLETA);
                                  url = await caricaBlobSuStorage(compResult.blob, `giocatori/${Date.now()}_atleta.webp`);
                                } catch (compErr) {
                                  url = await caricaFileSuStorage(file, `giocatori/${Date.now()}_${file.name}`);
                                }
                                setPlayerForm({ ...playerForm, foto_url: url });
                                showToast("Foto atleta caricata!", "success");
                              } catch (err) {
                                showToast("Errore caricamento foto.", "error");
                              }
                            }}
                          />
                        </label>

                        {playerForm.foto_url && (
                          <button
                            type="button"
                            onClick={() => setPlayerForm({ ...playerForm, foto_url: '', fotoPositionY: 50, fotoPositionX: 50 })}
                            className="text-rose-600 hover:bg-rose-50 px-2.5 py-2 rounded-xl text-xs font-medium border border-rose-200 transition-colors"
                          >
                            Rimuovi
                          </button>
                        )}
                      </div>

                      {/* Slider Altezza / Regolazione Verticale Y */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-zinc-600 font-medium">Inquadratura Verticale (Altezza):</span>
                          <span className="text-amber-700 font-bold">{playerForm.fotoPositionY ?? 50}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          disabled={!playerForm.foto_url}
                          value={playerForm.fotoPositionY ?? 50}
                          onChange={e => setPlayerForm({ ...playerForm, fotoPositionY: parseInt(e.target.value, 10) })}
                          className="w-full accent-amber-500 cursor-pointer disabled:opacity-40"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
                          <span>Alto (0%)</span>
                          <span>Centro (50%)</span>
                          <span>Basso (100%)</span>
                        </div>
                      </div>

                      {/* Slider Larghezza / Regolazione Orizzontale X */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-zinc-600 font-medium">Inquadratura Orizzontale (Larghezza):</span>
                          <span className="text-amber-700 font-bold">{playerForm.fotoPositionX ?? 50}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          disabled={!playerForm.foto_url}
                          value={playerForm.fotoPositionX ?? 50}
                          onChange={e => setPlayerForm({ ...playerForm, fotoPositionX: parseInt(e.target.value, 10) })}
                          className="w-full accent-amber-500 cursor-pointer disabled:opacity-40"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
                          <span>Sinistra (0%)</span>
                          <span>Centro (50%)</span>
                          <span>Destra (100%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingPlayer}
                className="w-full bg-brand-yellow hover:bg-yellow-400 disabled:opacity-60 text-black font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                {isSubmittingPlayer ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Salvataggio atleta in corso...</span>
                  </>
                ) : (
                  <span>+ Registra Tesserato in Anagrafica</span>
                )}
              </button>
            </form>
          </div>

          {/* PLAYERS LIST (ELENCO AMPIO AD ALTA LEGGIBILITÀ) */}
          <div className="bg-white border border-zinc-200 p-6 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-zinc-950 border-b border-zinc-200 pb-2">
              Elenco Tesserati ({displayedGlobalGiocatori.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {displayedGlobalGiocatori.map(player => {
                const birthYear = getBirthYear(player.data_nascita);
                const playerGender = (player as any).genere || (player as any).gender || 'F';
                // Find all squads where this player is enrolled
                const playerSquads = squadreAll.filter(s => s.id_atleti && (s.id_atleti.includes(player.id) || s.id_atleti.some(id => String(id).trim() === String(player.id).trim())));

                return (
                  <div key={player.id} className="bg-zinc-50/80 border border-zinc-200 p-3.5 rounded-xl flex items-center justify-between gap-3 hover:border-zinc-300 transition-all">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-zinc-900 text-brand-yellow font-bold text-xs px-2 py-0.5 rounded">
                          #{player.numero_maglia}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          playerGender === 'M' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                        }`}>
                          {playerGender === 'M' ? '♂ Maschio' : '♀ Femmina'}
                        </span>
                      </div>

                      <h4 className="font-bold text-zinc-950 text-base mt-1 leading-snug">
                        {player.cognome} {player.nome}
                      </h4>

                      <div className="flex items-center gap-2 text-xs text-zinc-600 mt-1 flex-wrap">
                        {player.ruolo ? (
                          <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                            {formatRuoloGiocatore(player.ruolo, playerGender)}
                          </span>
                        ) : (
                          <span className="font-medium text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 text-[11px]">
                            Nessun ruolo
                          </span>
                        )}
                        {player.altezza && player.altezza > 0 ? <span>{player.altezza} cm</span> : null}
                        {birthYear && <span>Anno {birthYear}</span>}
                      </div>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {playerSquads.length === 0 ? (
                          <span className="text-[11px] text-zinc-400 italic">Nessuna squadra assegnata</span>
                        ) : (
                          playerSquads.map(sq => (
                            <span key={sq.id} className="bg-zinc-200 text-zinc-800 text-[11px] font-medium px-2 py-0.5 rounded">
                              {sq.nome_squadra}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleViewHistory(player)}
                        className="bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-300 p-2 rounded-lg transition-colors cursor-pointer"
                        title="Storico carriera"
                      >
                        <History className="w-4 h-4 text-amber-600" />
                      </button>
                      <button
                        onClick={() => handleStartEditPlayer(player)}
                        className="bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-300 p-2 rounded-lg transition-colors cursor-pointer"
                        title="Modifica atleta"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Sei sicuro di voler eliminare definitivamente ${player.nome} ${player.cognome} dall'anagrafica? Verrà rimosso anche dalle rose.`)) {
                            const pId = player.id;
                            // 0ms Optimistic removal from state and cache
                            setGiocatoriAll?.(prev => prev.filter(p => p.id !== pId));
                            setSquadreAll?.(prev => prev.map(s => ({
                              ...s,
                              id_atleti: (s.id_atleti || []).filter(id => String(id).trim() !== String(pId).trim()),
                              capitano_id: s.capitano_id === pId ? undefined : s.capitano_id
                            })));
                            showToast("Atleta eliminato!", "success");

                            try {
                              await eliminaElemento('giocatori', pId);
                            } catch (e) {
                              showToast("Errore durante l'eliminazione.", "error");
                              await loadAllData();
                            }
                          }
                        }}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 p-2 rounded-lg transition-colors cursor-pointer"
                        title="Elimina atleta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MODIFICA ATLETA (CON CAMPO GENERE F / M E PULSANTE CARICA FISSO) */}
      {/* ========================================================================= */}
      {editingPlayerId && editingPlayerData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-300 rounded-2xl w-full max-w-2xl p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <h3 className="text-base font-bold text-zinc-950 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-500" />
                Modifica Atleta: {editingPlayerData.cognome} {editingPlayerData.nome}
              </h3>
              <button onClick={() => setEditingPlayerId(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-zinc-600 text-xs font-semibold uppercase">Nome</label>
                <input
                  type="text"
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                  value={editingPlayerData.nome || ''}
                  onChange={e => setEditingPlayerData({ ...editingPlayerData, nome: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-zinc-600 text-xs font-semibold uppercase">Cognome</label>
                <input
                  type="text"
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                  value={editingPlayerData.cognome || ''}
                  onChange={e => setEditingPlayerData({ ...editingPlayerData, cognome: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-zinc-600 text-xs font-semibold uppercase">Ruolo (Opzionale)</label>
                <select
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                  value={editingPlayerData.ruolo || ''}
                  onChange={e => setEditingPlayerData({ ...editingPlayerData, ruolo: e.target.value })}
                >
                  <option value="">-- Nessun Ruolo (es. Minivolley) --</option>
                  <option value="Schiacciatore">{(editingPlayerData.genere || 'F') === 'F' ? 'Schiacciatrice' : 'Schiacciatore'}</option>
                  <option value="Palleggiatore">{(editingPlayerData.genere || 'F') === 'F' ? 'Palleggiatrice' : 'Palleggiatore'}</option>
                  <option value="Opposto">{(editingPlayerData.genere || 'F') === 'F' ? 'Opposta' : 'Opposto'}</option>
                  <option value="Centrale">Centrale</option>
                  <option value="Libero">Libero</option>
                  <option value="Universale">Universale</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-zinc-600 text-xs font-semibold uppercase">Sesso / Genere *</label>
                <select
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                  value={editingPlayerData.genere || 'F'}
                  onChange={e => setEditingPlayerData({ ...editingPlayerData, genere: e.target.value as any })}
                >
                  <option value="F">Femmina (F)</option>
                  <option value="M">Maschio (M)</option>
                </select>
              </div>

              {/* Riga a 3 colonne per numeri e date */}
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-600 text-xs font-semibold uppercase">Numero Maglia</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                    value={editingPlayerData.numero_maglia || 1}
                    onChange={e => setEditingPlayerData({ ...editingPlayerData, numero_maglia: parseInt(e.target.value, 10) || 1 })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-600 text-xs font-semibold uppercase">Data di Nascita</label>
                  <input
                    type="date"
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                    value={editingPlayerData.data_nascita || '2006-01-01'}
                    onChange={e => setEditingPlayerData({ ...editingPlayerData, data_nascita: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-600 text-xs font-semibold uppercase">Altezza (cm)</label>
                  <input
                    type="number"
                    min="100"
                    max="230"
                    placeholder="Non specificata"
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                    value={editingPlayerData.altezza ?? ''}
                    onChange={e => setEditingPlayerData({ ...editingPlayerData, altezza: e.target.value ? parseInt(e.target.value, 10) : null })}
                  />
                </div>
              </div>

              {/* Sezione Foto & Centratura */}
              <div className="sm:col-span-2 space-y-2 pt-2 border-t border-zinc-200">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-800 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <Camera className="w-4 h-4 text-amber-500" /> Foto & Inquadratura Atleta (3:4)
                  </label>
                  {(editingPlayerData.foto?.url || editingPlayerData.foto_url) && (
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Foto Impostata
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-5 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                  {/* Anteprima Real-Time 3:4 */}
                  {(() => {
                    const currentPhotoUrl = editingPlayerData.foto?.url || editingPlayerData.foto_url;
                    const posX = editingPlayerData.fotoPositionX ?? (editingPlayerData.foto as any)?.positionX ?? 50;
                    const posY = editingPlayerData.fotoPositionY ?? (editingPlayerData.foto as any)?.positionY ?? 50;
                    return (
                      <div className="w-32 sm:w-36 aspect-[3/4] shrink-0 bg-zinc-900 rounded-xl overflow-hidden border-2 border-brand-yellow/80 shadow-md relative flex items-center justify-center self-center sm:self-start">
                        {currentPhotoUrl ? (
                          <img
                            src={currentPhotoUrl}
                            alt="Anteprima Modifica Atleta"
                            className="w-full h-full object-cover"
                            style={{
                              objectPosition: `${posX}% ${posY}%`
                            }}
                          />
                        ) : (
                          <div className="text-center p-2 text-zinc-500 space-y-1">
                            <Camera className="w-6 h-6 mx-auto stroke-1 text-zinc-400" />
                            <span className="text-[9px] font-mono block">Nessuna foto</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Controlli di Caricamento & Slider */}
                  <div className="flex-1 min-w-0 space-y-3.5 justify-center flex flex-col">
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                      <label className="bg-zinc-900 hover:bg-black text-white px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer text-xs font-semibold shrink-0 shadow-sm transition-colors">
                        <Camera className="w-3.5 h-3.5 text-brand-yellow" /> Carica Nuova Foto
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              showToast("Ottimizzazione e caricamento foto...", "info");
                              let url = '';
                              try {
                                const compResult = await compressImage(file, IMAGE_PRESETS.ATLETA);
                                url = await caricaBlobSuStorage(compResult.blob, `giocatori/${editingPlayerId}_${Date.now()}.webp`);
                              } catch (compErr) {
                                url = await caricaFileSuStorage(file, `giocatori/${editingPlayerId}_${Date.now()}`);
                              }
                              const currentPosX = editingPlayerData.fotoPositionX ?? (editingPlayerData.foto as any)?.positionX ?? 50;
                              const currentPosY = editingPlayerData.fotoPositionY ?? (editingPlayerData.foto as any)?.positionY ?? 50;
                              setEditingPlayerData({
                                ...editingPlayerData,
                                foto_url: url,
                                fotoPositionX: currentPosX,
                                fotoPositionY: currentPosY,
                                foto: {
                                  url,
                                  positionX: currentPosX,
                                  positionY: currentPosY
                                }
                              });
                              showToast("Foto aggiornata!", "success");
                            } catch (err) {
                              showToast("Errore caricamento foto.", "error");
                            }
                          }}
                        />
                      </label>

                      <input
                        type="url"
                        placeholder="Incolla URL https://..."
                        className="flex-1 min-w-0 bg-white border border-zinc-300 rounded-xl p-2 text-xs font-medium text-zinc-900"
                        value={editingPlayerData.foto?.url || editingPlayerData.foto_url || ''}
                        onChange={e => {
                          const url = e.target.value;
                          const currentPosX = editingPlayerData.fotoPositionX ?? (editingPlayerData.foto as any)?.positionX ?? 50;
                          const currentPosY = editingPlayerData.fotoPositionY ?? (editingPlayerData.foto as any)?.positionY ?? 50;
                          setEditingPlayerData({
                            ...editingPlayerData,
                            foto_url: url,
                            foto: url ? {
                              url,
                              positionX: currentPosX,
                              positionY: currentPosY
                            } : undefined
                          });
                        }}
                      />

                      {(editingPlayerData.foto?.url || editingPlayerData.foto_url) && (
                        <button
                          type="button"
                          onClick={() => setEditingPlayerData({
                            ...editingPlayerData,
                            foto_url: '',
                            fotoPositionX: 50,
                            fotoPositionY: 50,
                            foto: undefined
                          })}
                          className="text-rose-600 hover:bg-rose-50 px-2.5 py-2 rounded-xl text-xs font-semibold border border-rose-200 transition-colors shrink-0 cursor-pointer"
                        >
                          Rimuovi
                        </button>
                      )}
                    </div>

                    {/* Slider Altezza / Regolazione Verticale Y */}
                    {(() => {
                      const hasPhoto = Boolean(editingPlayerData.foto?.url || editingPlayerData.foto_url);
                      const posY = editingPlayerData.fotoPositionY ?? (editingPlayerData.foto as any)?.positionY ?? 50;
                      const posX = editingPlayerData.fotoPositionX ?? (editingPlayerData.foto as any)?.positionX ?? 50;

                      return (
                        <>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs font-mono">
                              <span className="text-zinc-700 font-medium">Inquadratura Verticale (Altezza):</span>
                              <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">{posY}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              disabled={!hasPhoto}
                              value={posY}
                              onChange={e => {
                                const val = parseInt(e.target.value, 10);
                                const currentUrl = editingPlayerData.foto?.url || editingPlayerData.foto_url || '';
                                setEditingPlayerData({
                                  ...editingPlayerData,
                                  fotoPositionY: val,
                                  foto: currentUrl ? {
                                    url: currentUrl,
                                    positionX: posX,
                                    positionY: val
                                  } : undefined
                                });
                              }}
                              className="w-full accent-amber-500 cursor-pointer disabled:opacity-40"
                            />
                            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                              <span>0% (Alto)</span>
                              <span>50% (Centro)</span>
                              <span>100% (Basso)</span>
                            </div>
                          </div>

                          {/* Slider Larghezza / Regolazione Orizzontale X */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs font-mono">
                              <span className="text-zinc-700 font-medium">Inquadratura Orizzontale (Larghezza):</span>
                              <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">{posX}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              disabled={!hasPhoto}
                              value={posX}
                              onChange={e => {
                                const val = parseInt(e.target.value, 10);
                                const currentUrl = editingPlayerData.foto?.url || editingPlayerData.foto_url || '';
                                setEditingPlayerData({
                                  ...editingPlayerData,
                                  fotoPositionX: val,
                                  foto: currentUrl ? {
                                    url: currentUrl,
                                    positionX: val,
                                    positionY: posY
                                  } : undefined
                                });
                              }}
                              className="w-full accent-amber-500 cursor-pointer disabled:opacity-40"
                            />
                            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                              <span>0% (Sinistra)</span>
                              <span>50% (Centro)</span>
                              <span>100% (Destra)</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}

                    <p className="text-[10px] text-zinc-400 font-mono leading-tight">
                      ℹ️ La proporzione 3:4 dell'anteprima corrisponde esattamente alla scheda atleta sul sito pubblico e nella lista squadra.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
              <button
                onClick={() => setEditingPlayerId(null)}
                className="bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-medium px-4 py-2.5 rounded-xl text-xs cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={handleSavePlayerData}
                className="bg-brand-yellow hover:bg-yellow-400 text-black font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer shadow"
              >
                Salva Modifiche
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: STORICO CARRIERA ATLETA */}
      {/* ========================================================================= */}
      {historyPlayer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-300 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <h3 className="text-base font-bold text-zinc-950 flex items-center gap-2">
                <History className="w-5 h-5 text-amber-500" />
                Storico Carriera: {historyPlayer.player.cognome} {historyPlayer.player.nome}
              </h3>
              <button onClick={() => setHistoryPlayer(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {loadingHistory ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                </div>
              ) : historyPlayer.history.length === 0 ? (
                <p className="text-center py-6 text-zinc-400">Nessun record storico registrato per questo atleta.</p>
              ) : (
                historyPlayer.history.map((rec, idx) => (
                  <div key={idx} className="bg-zinc-50 border border-zinc-200 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="inline-block bg-brand-yellow text-black font-barlow font-bold text-xs px-2 py-0.5 rounded uppercase shadow-sm mb-1">{rec.stagione}</span>
                      <h5 className="font-bold text-zinc-900 text-xs">{rec.nome_squadra}</h5>
                      <span className="text-[11px] text-zinc-500 font-medium">{rec.campionato}</span>
                    </div>
                    {rec.allenatore && (
                      <span className="text-[10px] text-zinc-400">Coach: {rec.allenatore}</span>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-200">
              <button
                onClick={() => setHistoryPlayer(null)}
                className="bg-zinc-900 text-white font-medium px-4 py-2 rounded-xl text-xs cursor-pointer"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 4: ARCHIVIO STORICO DELLE ANNATE SQUADRE                            */}
      {/* ========================================================================= */}
      {squadSubTab === 'archivio' && (
        <TabArchivioSquadre
          squadreAll={squadreAll}
          giocatoriAll={giocatoriAll}
          showToast={showToast}
          caricaFileSuStorage={caricaFileSuStorage}
        />
      )}

    </div>
  );
}
