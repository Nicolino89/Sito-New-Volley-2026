import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Trophy,
  RefreshCw,
  Plus,
  Trash2,
  Save,
  Check,
  Edit3,
  ExternalLink,
  MapPin,
  Clock,
  AlertCircle,
  Sparkles,
  Shield,
  X,
  Link as LinkIcon,
  EyeOff,
  CheckCircle2,
  ChevronRight,
  Code,
  FileText
} from 'lucide-react';
import { 
  RosaSquadra, 
  PartitaCampionato, 
  RigaClassifica, 
  updateSquadraFipavData,
  updateProssimaGara,
  ProssimaGara,
  getGenereSquadra
} from '../../../firebase-societa';
import { scrapeFipavFullData, parseFipavHtml, sanitizeLuogoDisplay } from '../../../utils/fipavScraper';


interface TabGareFipavProps {
  squadreAll: RosaSquadra[];
  loadAllData: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function TabGareFipav({
  squadreAll,
  loadAllData,
  showToast
}: TabGareFipavProps) {
  // Selected Team
  const [selectedTeamId, setSelectedTeamId] = useState<string>(squadreAll[0]?.id || '');
  const activeTeam = squadreAll.find(s => s.id === selectedTeamId) || squadreAll[0];

  // Active Sub Tab in this section (Partite vs Classifica)
  const [activeSection, setActiveSection] = useState<'partite' | 'classifica'>('partite');

  // Classification Mode per Team: 'FIPAV_SYNC' | 'LINK_ESTERNO' | 'DISABILITATA'
  const [tipoClassifica, setTipoClassifica] = useState<'FIPAV_SYNC' | 'LINK_ESTERNO' | 'DISABILITATA'>('FIPAV_SYNC');
  const [linkEsterno, setLinkEsterno] = useState<string>('');
  const [nomePortaleEsterno, setNomePortaleEsterno] = useState<string>('Portale Ufficiale FIPAV / Comitato');

  // Local States
  const [fipavUrl, setFipavUrl] = useState<string>('');
  const [nomeVisualizzatoGare, setNomeVisualizzatoGare] = useState<string>('');
  const [squadraFipavUfficiale, setSquadraFipavUfficiale] = useState<string>('');
  const [partite, setPartite] = useState<PartitaCampionato[]>([]);
  const [classifica, setClassifica] = useState<RigaClassifica[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Match Modal / Edit State
  const [editingMatch, setEditingMatch] = useState<PartitaCampionato | null>(null);
  const [isNewMatch, setIsNewMatch] = useState(false);

  // Sync state when active team changes
  useEffect(() => {
    if (activeTeam) {
      setFipavUrl(activeTeam.fipav_url || '');
      setPartite(activeTeam.partite || []);
      setClassifica(activeTeam.classifica || []);
      setNomeVisualizzatoGare(activeTeam.nome_visualizzato_gare || activeTeam.nome_squadra || '');
      setSquadraFipavUfficiale(activeTeam.squadra_fipav_ufficiale || '');
      
      const tc = (activeTeam as any).tipo_classifica || (activeTeam.fipav_url ? 'FIPAV_SYNC' : 'LINK_ESTERNO');
      setTipoClassifica(tc);
      setLinkEsterno((activeTeam as any).link_esterno_classifica || activeTeam.fipav_url || '');
      setNomePortaleEsterno((activeTeam as any).nome_portale_esterno || 'Portale Ufficiale FIPAV / CSI');
    }
  }, [activeTeam?.id]);

  useEffect(() => {
    if (editingMatch) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [editingMatch]);

  // Handle selecting which team in the standings is the official club team
  const handleSelectOfficialTeam = async (teamName: string) => {
    if (!activeTeam) return;
    setSquadraFipavUfficiale(teamName);
    const updatedClassifica = classifica.map(row => ({
      ...row,
      isMyTeam: row.squadra.toLowerCase().trim() === teamName.toLowerCase().trim()
    }));
    setClassifica(updatedClassifica);

    try {
      await updateSquadraFipavData(activeTeam.id, {
        squadra_fipav_ufficiale: teamName,
        nome_visualizzato_gare: nomeVisualizzatoGare || activeTeam.nome_squadra,
        classifica: updatedClassifica
      });
      showToast(`Impostata "${teamName}" come squadra societaria in classifica!`, "success");
    } catch (e) {
      console.error(e);
      showToast("Errore durante l'aggiornamento della squadra", "error");
    }
  };

  // Handle 1-Click FIPAV Scraping & Auto-Population
  const handleSyncFipav = async () => {
    if (!fipavUrl || !fipavUrl.startsWith('http')) {
      showToast("Inserisci un URL valido che inizi con http:// o https://", "error");
      return;
    }

    try {
      setIsSyncing(true);
      showToast(`Sincronizzazione in corso per ${activeTeam.nome_squadra}...`, "info");
      
      const res = await scrapeFipavFullData(fipavUrl, activeTeam.nome_squadra, squadraFipavUfficiale);
      
      setClassifica(res.classifica);
      setPartite(res.partite);

      // Auto-save immediately to database
      await updateSquadraFipavData(activeTeam.id, {
        fipav_url: fipavUrl,
        nome_visualizzato_gare: nomeVisualizzatoGare || activeTeam.nome_squadra,
        squadra_fipav_ufficiale: squadraFipavUfficiale,
        classifica: res.classifica,
        partite: res.partite,
        tipo_classifica: 'FIPAV_SYNC',
        link_esterno_classifica: fipavUrl
      } as any);

      // If next match was found and is Serie D, update Prossima Gara on Homepage
      if (res.prossimaGara && activeTeam.nome_squadra.toLowerCase().includes('serie d')) {
        await updateProssimaGara(res.prossimaGara);
      }

      await loadAllData();
      showToast(`Classifica (${res.classifica.length} squadre) e Calendario (${res.partite.length} gare) sincronizzati e salvati con successo!`, "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Errore durante la sincronizzazione da FIPAV.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  // HTML Paste Fallback State
  const [showHtmlPaste, setShowHtmlPaste] = useState(false);
  const [pastedHtml, setPastedHtml] = useState('');

  // Handle Pasted HTML / Source Extraction
  const handleImportPastedHtml = async () => {
    if (!pastedHtml.trim()) {
      showToast("Incolla prima il codice sorgente o il testo della pagina FIPAV.", "error");
      return;
    }
    try {
      const res = parseFipavHtml(pastedHtml, activeTeam.nome_squadra, squadraFipavUfficiale);
      if (res.classifica.length === 0 && res.partite.length === 0) {
        showToast("Nessun dato riconosciuto nel testo incollato. Assicurati di copiare la pagina o la tabella del campionato.", "error");
        return;
      }
      setClassifica(res.classifica);
      setPartite(res.partite);

      await updateSquadraFipavData(activeTeam.id, {
        fipav_url: fipavUrl || activeTeam.fipav_url,
        nome_visualizzato_gare: nomeVisualizzatoGare || activeTeam.nome_squadra,
        squadra_fipav_ufficiale: squadraFipavUfficiale,
        classifica: res.classifica,
        partite: res.partite,
        tipo_classifica: 'FIPAV_SYNC',
        link_esterno_classifica: fipavUrl || activeTeam.fipav_url
      } as any);

      if (res.prossimaGara && activeTeam.nome_squadra.toLowerCase().includes('serie d')) {
        await updateProssimaGara(res.prossimaGara);
      }

      await loadAllData();
      setShowHtmlPaste(false);
      setPastedHtml('');
      showToast(`Estratte con successo ${res.classifica.length} squadre in classifica e ${res.partite.length} gare in calendario!`, "success");
    } catch (err: any) {
      showToast(`Errore parsing: ${err.message}`, "error");
    }
  };

  // Save Classification Configuration (Link Esterno / Disabilitata / FIPAV)
  const handleSaveClassificaConfig = async () => {
    if (!activeTeam) return;
    try {
      setIsSaving(true);
      await updateSquadraFipavData(activeTeam.id, {
        fipav_url: fipavUrl,
        nome_visualizzato_gare: nomeVisualizzatoGare || activeTeam.nome_squadra,
        squadra_fipav_ufficiale: squadraFipavUfficiale,
        tipo_classifica: tipoClassifica,
        link_esterno_classifica: linkEsterno,
        nome_portale_esterno: nomePortaleEsterno,
        classifica,
        partite
      } as any);

      await loadAllData();
      showToast("Impostazioni salvate con successo!", "success");
    } catch (e) {
      console.error(e);
      showToast("Errore durante il salvataggio.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Match management: Save directly to Firestore in 1 single click
  const handleSaveMatchModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch || !activeTeam) return;
    if (!editingMatch.avversario.trim()) {
      showToast("Inserisci il nome della squadra avversaria.", "error");
      return;
    }

    try {
      let updatedList = [...partite];
      if (isNewMatch) {
        updatedList.push(editingMatch);
      } else {
        updatedList = updatedList.map(p => p.id === editingMatch.id ? editingMatch : p);
      }

      setPartite(updatedList);
      setEditingMatch(null);
      setIsNewMatch(false);

      // Direct write to Firestore
      await updateSquadraFipavData(activeTeam.id, {
        fipav_url: fipavUrl,
        classifica,
        partite: updatedList
      });

      // Update Prossima Gara if next unplayed match changed on Serie D
      const upcoming = updatedList.find(p => !p.terminata);
      if (upcoming && activeTeam.nome_squadra.toLowerCase().includes('serie d')) {
        const isMaschile = getGenereSquadra(activeTeam) === 'M';
        const payload: ProssimaGara = {
          id: isMaschile ? 'serie_d_maschile' : 'serie_d_femminile',
          categoria: isMaschile ? 'Serie D Maschile' : 'Serie D Femminile',
          avversario: upcoming.avversario,
          data_ora: `${upcoming.data} ${upcoming.ora}`,
          luogo: upcoming.luogo || 'PalaMaroncelli, Forlì',
          giornata: upcoming.giornata,
          casa: upcoming.casa,
          punti_nva: null,
          punti_avversario: null
        };
        await updateProssimaGara(payload);
      }

      await loadAllData();
      showToast(isNewMatch ? "Nuova gara pubblicata con successo!" : "Dati gara aggiornati!", "success");
    } catch (err) {
      console.error(err);
      showToast("Errore durante il salvataggio della partita.", "error");
    }
  };

  // Match management: Delete match
  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm("Sei sicuro di voler eliminare questa partita dal calendario?")) return;
    try {
      const updatedList = partite.filter(p => p.id !== matchId);
      setPartite(updatedList);

      await updateSquadraFipavData(activeTeam.id, {
        fipav_url: fipavUrl,
        classifica,
        partite: updatedList
      });

      await loadAllData();
      showToast("Partita eliminata dal calendario.", "info");
    } catch (e) {
      showToast("Errore durante l'eliminazione della partita.", "error");
    }
  };

  // Match management: Quick Result Toggle
  const handleQuickResultChange = async (matchId: string, setNva: number | null, setAvversario: number | null, terminata: boolean) => {
    const updatedList = partite.map(p => {
      if (p.id === matchId) {
        return {
          ...p,
          setNva,
          setAvversario,
          risultato: terminata ? `${setNva ?? 3} - ${setAvversario ?? 0}` : '',
          terminata
        };
      }
      return p;
    });

    setPartite(updatedList);
    try {
      await updateSquadraFipavData(activeTeam.id, {
        fipav_url: fipavUrl,
        classifica,
        partite: updatedList
      });
      await loadAllData();
      showToast("Risultato gara aggiornato!", "success");
    } catch (e) {
      showToast("Errore aggiornamento risultato.", "error");
    }
  };

  // Helper to open new match modal
  const handleOpenNewMatch = () => {
    setIsNewMatch(true);
    setEditingMatch({
      id: `p_manual_${Date.now()}`,
      giornata: `${partite.length + 1}ª Giornata`,
      data: new Date().toLocaleDateString('it-IT'),
      ora: '20:30',
      avversario: '',
      casa: true,
      luogo: 'PalaMaroncelli, Forlì',
      risultato: '',
      setNva: null,
      setAvversario: null,
      parzialiSet: '',
      terminata: false
    });
  };

  return (
    <div className="space-y-6 animate-fade-in text-sm font-sans" id="admin-tab-gare-fipav">
      
      {/* ========================================================================= */}
      {/* SELETTORE SQUADRA GRANDE E BEN VISIBILE */}
      {/* ========================================================================= */}
      <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-100 pb-3">
          <div>
            <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
              <Trophy className="w-4 h-4" />
              <span>Gestione Campionati, Gare & Classifiche</span>
            </div>
            <h3 className="text-xl font-bold text-zinc-950 mt-1">
              Scegli la Squadra da Amministrare
            </h3>
            <p className="text-xs text-zinc-500">
              Seleziona la squadra su cui vuoi caricare le partite o impostare la classifica.
            </p>
          </div>
        </div>

        {/* Big Team Selection Pills / Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-1">
          {squadreAll.map(sq => {
            const isSelected = sq.id === selectedTeamId;
            const gender = getGenereSquadra(sq);
            const matchesCount = sq.partite?.length || 0;
            const standingsCount = sq.classifica?.length || 0;

            return (
              <button
                key={sq.id}
                onClick={() => setSelectedTeamId(sq.id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2.5 relative ${
                  isSelected 
                    ? 'bg-zinc-900 text-white border-brand-yellow ring-2 ring-brand-yellow shadow-md' 
                    : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border-zinc-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      gender === 'F' 
                        ? isSelected ? 'bg-pink-900/80 text-pink-200' : 'bg-pink-100 text-pink-800'
                        : gender === 'MISTO'
                          ? isSelected ? 'bg-purple-900/80 text-purple-200' : 'bg-purple-100 text-purple-800'
                          : isSelected ? 'bg-blue-900/80 text-blue-200' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {gender === 'F' ? '♀ Femminile' : gender === 'MISTO' ? '👥 Misto' : '♂ Maschile'}
                    </span>
                    <span className={`text-[10px] font-mono ${isSelected ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      {sq.stagione}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm leading-snug truncate">
                    {sq.nome_squadra}
                  </h4>
                  <p className={`text-xs truncate ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    {sq.campionato}
                  </p>
                </div>

                <div className={`flex items-center justify-between text-[11px] pt-2 border-t ${
                  isSelected ? 'border-zinc-800 text-brand-yellow' : 'border-zinc-200 text-zinc-600'
                }`}>
                  <span>📅 {matchesCount} Gare</span>
                  <span>🏆 {standingsCount} Squadre</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {activeTeam && (
        <div className="space-y-6">

          {/* ========================================================================= */}
          {/* HEADER SQUADRA SELEZIONATA & MODALITÀ CLASSIFICA */}
          {/* ========================================================================= */}
          <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-5">
            <div className="border-b border-zinc-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">
                  Configurazione per:
                </span>
                <h3 className="text-2xl font-bold text-zinc-950">
                  {activeTeam.nome_squadra}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Campionato: <b className="text-zinc-700">{activeTeam.campionato}</b> • Stagione {activeTeam.stagione}
                </p>
              </div>

              {/* Navigation Tabs: Partite vs Classifica */}
              <div className="flex gap-1.5 bg-zinc-100 p-1.5 rounded-xl border border-zinc-200">
                <button
                  onClick={() => setActiveSection('partite')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 cursor-pointer ${
                    activeSection === 'partite'
                      ? 'bg-brand-yellow text-black shadow-sm font-black'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Calendario Gare ({partite.length})
                </button>
                <button
                  onClick={() => setActiveSection('classifica')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 cursor-pointer ${
                    activeSection === 'classifica'
                      ? 'bg-brand-yellow text-black shadow-sm font-black'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  Classifica & Impostazioni
                </button>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SEZIONE 1: CALENDARIO GARE */}
            {/* ========================================================================= */}
            {activeSection === 'partite' && (
              <div className="space-y-5">
                
                {/* Top Action Bar for Matches */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                  <div>
                    <h4 className="font-bold text-zinc-950 text-sm">
                      Calendario Incontri & Risultati
                    </h4>
                    <p className="text-xs text-zinc-500">
                      Aggiungi le partite a mano con salvataggio diretto o sincronizza l'intero campionato dal link FIPAV.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleOpenNewMatch}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow cursor-pointer transition-all"
                    >
                      <Plus className="w-4 h-4" /> + Aggiungi Nuova Gara
                    </button>
                  </div>
                </div>

                {/* Match List */}
                {partite.length === 0 ? (
                  <div className="bg-zinc-50 border border-dashed border-zinc-300 rounded-2xl p-10 text-center space-y-3">
                    <Calendar className="w-10 h-10 text-zinc-300 mx-auto" />
                    <p className="font-bold text-zinc-700 text-sm">Nessuna partita in calendario per questa squadra</p>
                    <p className="text-xs text-zinc-500">
                      Clicca su <b>"+ Aggiungi Nuova Gara"</b> oppure vai nella scheda Classifica per sincronizzare da FIPAV.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {partite.map((match, idx) => {
                      const isWon = match.terminata && (match.setNva ?? 0) > (match.setAvversario ?? 0);
                      return (
                        <div
                          key={match.id || idx}
                          className={`bg-white border rounded-xl p-4 shadow-sm transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden ${
                            match.terminata 
                              ? isWon ? 'border-emerald-300 bg-emerald-50/20' : 'border-rose-300 bg-rose-50/20'
                              : 'border-zinc-200 hover:border-zinc-300'
                          }`}
                        >
                          {/* Casa/Trasferta Indicator Bar */}
                          <div className={`absolute top-0 left-0 w-1.5 h-full ${match.casa ? 'bg-brand-yellow' : 'bg-zinc-400'}`} />

                          {/* Match Details */}
                          <div className="flex-1 pl-3 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="bg-zinc-900 text-brand-yellow font-bold text-[10px] px-2 py-0.5 rounded">
                                {match.giornata || `${idx + 1}ª Giornata`}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                match.casa ? 'bg-amber-100 text-amber-900' : 'bg-zinc-100 text-zinc-700'
                              }`}>
                                {match.casa ? 'In Casa' : 'Trasferta'}
                              </span>
                              <span className="text-zinc-500 text-xs">
                                📅 {match.data} ⏰ {match.ora || '20:30'}
                              </span>
                            </div>

                            <h4 className="text-base font-bold uppercase text-zinc-950 pt-0.5">
                              {match.casa 
                                ? `${nomeVisualizzatoGare || activeTeam.nome_squadra || 'NVA'} vs ${match.avversario}` 
                                : `${match.avversario} vs ${nomeVisualizzatoGare || activeTeam.nome_squadra || 'NVA'}`}
                            </h4>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 pt-0.5">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-zinc-400" /> {sanitizeLuogoDisplay(match.luogo, match.casa)}
                              </span>
                              {match.parzialiSet && (
                                <span className="bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded font-mono text-[11px] font-semibold">
                                  Set: {match.parzialiSet}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Score & Quick Controls */}
                          <div className="flex flex-wrap items-center gap-2.5 self-end md:self-center shrink-0">
                            
                            {/* Score Display */}
                            <div className="bg-zinc-900 text-brand-yellow px-3.5 py-1.5 rounded-xl font-bold text-sm min-w-[65px] text-center">
                              {match.terminata ? (match.risultato || `${match.setNva ?? 0} - ${match.setAvversario ?? 0}`) : 'VS'}
                            </div>

                            {/* Status Toggle Button */}
                            <button
                              onClick={() => {
                                if (match.terminata) {
                                  handleQuickResultChange(match.id, null, null, false);
                                } else {
                                  handleQuickResultChange(match.id, 3, 0, true);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                                match.terminata
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                              }`}
                            >
                              {match.terminata ? '✓ Disputata' : '⏳ Da Giocare'}
                            </button>

                            {/* Edit Match Button */}
                            <button
                              onClick={() => {
                                setIsNewMatch(false);
                                setEditingMatch(match);
                              }}
                              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 p-2 rounded-xl transition-colors cursor-pointer"
                              title="Modifica gara"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Delete Match Button */}
                            <button
                              onClick={() => handleDeleteMatch(match.id)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 p-2 rounded-xl transition-colors cursor-pointer"
                              title="Elimina partita"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* SEZIONE 2: MODALITÀ CLASSIFICA (FIPAV SYNC vs LINK ESTERNO vs DISATTIVA) */}
            {/* ========================================================================= */}
            {activeSection === 'classifica' && (
              <div className="space-y-6">
                
                {/* 3-Way Mode Selection Box */}
                <div className="bg-zinc-50 border border-zinc-200 p-5 rounded-2xl space-y-4">
                  <h4 className="font-bold text-zinc-950 text-sm">
                    Come vuoi gestire la Classifica per {activeTeam.nome_squadra}?
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Mode 1: FIPAV Sync */}
                    <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                      tipoClassifica === 'FIPAV_SYNC'
                        ? 'border-brand-yellow bg-white shadow-sm ring-1 ring-brand-yellow'
                        : 'border-zinc-200 bg-white/70 hover:border-zinc-300'
                    }`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="tipoClassifica"
                          checked={tipoClassifica === 'FIPAV_SYNC'}
                          onChange={() => setTipoClassifica('FIPAV_SYNC')}
                          className="text-amber-500"
                        />
                        <span className="font-bold text-zinc-900 text-xs uppercase">⚡ Sincronizzazione FIPAV</span>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        Incolla il link della scheda campionato FIPAV e scarica classifica e calendario in 1 click.
                      </p>
                    </label>

                    {/* Mode 2: Link Esterno */}
                    <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                      tipoClassifica === 'LINK_ESTERNO'
                        ? 'border-brand-yellow bg-white shadow-sm ring-1 ring-brand-yellow'
                        : 'border-zinc-200 bg-white/70 hover:border-zinc-300'
                    }`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="tipoClassifica"
                          checked={tipoClassifica === 'LINK_ESTERNO'}
                          onChange={() => setTipoClassifica('LINK_ESTERNO')}
                          className="text-amber-500"
                        />
                        <span className="font-bold text-zinc-900 text-xs uppercase">🌐 Link Esterno / Comitato</span>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        Zero fatica per giovanili: mostra un bel pulsante che rimanda al portale ufficiale (CSI, UISP, FIPAV).
                      </p>
                    </label>

                    {/* Mode 3: Disabilitata */}
                    <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                      tipoClassifica === 'DISABILITATA'
                        ? 'border-brand-yellow bg-white shadow-sm ring-1 ring-brand-yellow'
                        : 'border-zinc-200 bg-white/70 hover:border-zinc-300'
                    }`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="tipoClassifica"
                          checked={tipoClassifica === 'DISABILITATA'}
                          onChange={() => setTipoClassifica('DISABILITATA')}
                          className="text-amber-500"
                        />
                        <span className="font-bold text-zinc-900 text-xs uppercase">🚫 Disattiva Classifica</span>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        Per Minivolley o raduni: nasconde la scheda classifica dalla pagina pubblica di questa squadra.
                      </p>
                    </label>
                  </div>
                </div>

                {/* --- OPZIONE 1: FIPAV SYNC PANEL --- */}
                {tipoClassifica === 'FIPAV_SYNC' && (
                  <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4 text-white shadow-md">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                      <div>
                        <span className="text-xs font-bold text-brand-yellow uppercase tracking-wider block">
                          Sincronizzazione Automatica FIPAV / CRER
                        </span>
                        <p className="text-xs text-zinc-300 mt-0.5">
                          Incolla il link della pagina del girone FIPAV (es. <code>crer.portalefipav.net</code> o <code>fipavromagna.it</code>).
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setShowHtmlPaste(!showHtmlPaste)}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 uppercase tracking-wider border border-zinc-700 cursor-pointer transition-all"
                          title="Se il link è protetto da firewall, incolla il sorgente della pagina per importare in 1 secondo"
                        >
                          <Code className="w-3.5 h-3.5 text-brand-yellow" />
                          <span>{showHtmlPaste ? 'Chiudi Incolla' : '📋 Incolla Sorgente'}</span>
                        </button>

                        <button
                          onClick={handleSyncFipav}
                          disabled={isSyncing || !fipavUrl}
                          className="bg-brand-yellow hover:bg-yellow-400 text-black font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow"
                        >
                          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                          {isSyncing ? 'Scaricamento...' : '⚡ Sincronizza da FIPAV'}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://crer.portalefipav.net/risultati-classifiche.aspx?..."
                        value={fipavUrl}
                        onChange={(e) => setFipavUrl(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-brand-yellow font-mono focus:outline-none focus:border-brand-yellow"
                      />
                    </div>

                    {/* Custom Team Display Name & Club Team Selector Settings */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-950/70 p-4 border border-zinc-800 rounded-xl">
                      <div className="space-y-1">
                        <label className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider block">
                          Nome Squadra visualizzato nelle Partite
                        </label>
                        <input
                          type="text"
                          value={nomeVisualizzatoGare}
                          onChange={(e) => setNomeVisualizzatoGare(e.target.value)}
                          placeholder="es. Serie D Femminile o SALFEP Volley Academy"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-brand-yellow"
                        />
                        <p className="text-[10px] text-zinc-500">
                          Sostituisce il generico "NVA" nel calendario delle gare.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider block">
                          Squadra Ufficiale nel Girone FIPAV
                        </label>
                        {classifica.length > 0 ? (
                          <select
                            value={squadraFipavUfficiale}
                            onChange={(e) => handleSelectOfficialTeam(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-semibold text-brand-yellow focus:outline-none focus:border-brand-yellow"
                          >
                            <option value="">-- Seleziona quale squadra siamo noi --</option>
                            {classifica.map((r, i) => (
                              <option key={i} value={r.squadra}>
                                {r.pos}. {r.squadra}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={squadraFipavUfficiale}
                            onChange={(e) => setSquadraFipavUfficiale(e.target.value)}
                            placeholder="es. SALFEP VOLLEY ACADEMY FORLI'"
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-semibold text-brand-yellow focus:outline-none focus:border-brand-yellow"
                          />
                        )}
                        <p className="text-[10px] text-zinc-500">
                          La riga corrispondente verrà evidenziata in giallo nella classifica.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-zinc-950/50 p-3 border border-zinc-800 rounded-xl mt-2">
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveClassificaConfig}
                          disabled={isSaving}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer transition-all flex items-center gap-1.5"
                          title="Salva impostazioni e link"
                        >
                          <Save className="w-4 h-4" />
                          {isSaving ? 'Salvataggio...' : 'Salva Impostazioni'}
                        </button>
                      </div>

                      {fipavUrl ? (
                        <a
                          href={fipavUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-brand-yellow hover:bg-yellow-400 text-black px-4 py-2 rounded-xl border border-zinc-700 flex items-center gap-2 text-xs font-bold shadow shadow-brand-yellow/20 uppercase tracking-wider animate-pulse-slow"
                          title="Apri pagina FIPAV per copiare il sorgente (Ctrl+U)"
                        >
                          <span>🌐 Apri Pagina FIPAV</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-zinc-500 text-[10px] italic">Salva un link per abilitare l'apertura rapida.</span>
                      )}
                    </div>

                    {/* EXPANDABLE PASTE HTML BOX (100% RELIABLE ZERO FIREWALL BLOCK) */}
                    {showHtmlPaste && (
                      <div className="p-4 bg-zinc-950 border border-brand-yellow/50 rounded-xl space-y-3 animate-fade-in">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-brand-yellow uppercase flex items-center gap-1.5">
                            <FileText className="w-4 h-4" />
                            Importazione Rapida da Sorgente Pagina FIPAV / CRER
                          </span>
                          <span className="text-[11px] text-zinc-400">Zero dipendenza da server o proxy</span>
                        </div>
                        <p className="text-[11px] text-zinc-300 leading-relaxed">
                          Apri la pagina FIPAV nel browser, premi <b>Ctrl+U</b> (o tasto destro &rarr; <i>Visualizza sorgente pagina</i>), premi <b>Ctrl+A</b>, <b>Ctrl+C</b> e incolla qui sotto:
                        </p>
                        <textarea
                          rows={5}
                          value={pastedHtml}
                          onChange={(e) => setPastedHtml(e.target.value)}
                          placeholder="Incolla qui l'HTML o il testo copiato dalla pagina del campionato..."
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-brand-yellow"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowHtmlPaste(false)}
                            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                          >
                            Annulla
                          </button>
                          <button
                            type="button"
                            onClick={handleImportPastedHtml}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer transition-all flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            Estrai e Salva Subito su Squadra
                          </button>
                        </div>
                      </div>
                    )}


                    {/* Synchronized Standings Table Preview */}
                    {classifica.length > 0 && (
                      <div className="mt-4 bg-white text-zinc-900 rounded-xl overflow-hidden border border-zinc-200">
                        <div className="p-3 bg-zinc-100 border-b border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-bold">
                          <span>Classifica Sincronizzata ({classifica.length} squadre)</span>
                          <span className="text-[11px] text-zinc-500 font-normal">
                            💡 Clicca sul pulsante accanto a una squadra per contrassegnarla come <b>Nostra Squadra</b>.
                          </span>
                        </div>
                        <div className="overflow-x-auto max-h-80">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-zinc-900 text-brand-yellow font-bold text-[10px] uppercase">
                              <tr>
                                <th className="p-2.5 text-center w-10">Pos</th>
                                <th className="p-2.5">Squadra</th>
                                <th className="p-2.5 text-center w-40">Squadra Nostra?</th>
                                <th className="p-2.5 text-center w-16">Punti</th>
                                <th className="p-2.5 text-center w-14">Gare</th>
                                <th className="p-2.5 text-center w-14">Vinte</th>
                                <th className="p-2.5 text-center w-14">Perse</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 font-mono">
                              {classifica.map((row, idx) => (
                                <tr key={idx} className={row.isMyTeam ? 'bg-amber-100/80 font-bold' : 'hover:bg-zinc-50'}>
                                  <td className="p-2.5 text-center font-bold">{row.pos}</td>
                                  <td className="p-2.5 font-sans font-semibold uppercase">{row.squadra}</td>
                                  <td className="p-2.5 text-center font-sans">
                                    {row.isMyTeam ? (
                                      <span className="bg-amber-500 text-black font-black text-[10px] px-2.5 py-1 rounded-md uppercase tracking-wider inline-flex items-center gap-1 shadow-sm">
                                        ★ {nomeVisualizzatoGare || activeTeam.nome_squadra || 'Nostra'}
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleSelectOfficialTeam(row.squadra)}
                                        className="bg-zinc-100 hover:bg-amber-200 text-zinc-700 hover:text-black border border-zinc-300 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase transition-all cursor-pointer"
                                        title="Imposta come squadra societaria ufficiale"
                                      >
                                        ☆ Seleziona
                                      </button>
                                    )}
                                  </td>
                                  <td className="p-2.5 text-center font-black text-amber-700">{row.punti}</td>
                                  <td className="p-2.5 text-center text-zinc-600">{row.giocate}</td>
                                  <td className="p-2.5 text-center text-emerald-700">{row.vinte}</td>
                                  <td className="p-2.5 text-center text-rose-700">{row.perse}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* --- OPZIONE 2: LINK ESTERNO PANEL --- */}
                {tipoClassifica === 'LINK_ESTERNO' && (
                  <div className="bg-white border border-zinc-200 p-6 rounded-2xl space-y-4 shadow-sm">
                    <div>
                      <h4 className="font-bold text-zinc-950 text-base flex items-center gap-2">
                        <LinkIcon className="w-5 h-5 text-amber-500" />
                        Configura Link Diretto alla Classifica Ufficiale
                      </h4>
                      <p className="text-xs text-zinc-500 mt-1">
                        Incolla il link della pagina del comitato (FIPAV, CSI, UISP). Nella scheda pubblica della squadra comparirà un banner elegante che porterà direttamente alla classifica ufficiale sempre aggiornata.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-zinc-600 text-xs font-semibold uppercase">Nome del Portale / Comitato</label>
                        <input
                          type="text"
                          placeholder="es. FIPAV Romagna - Girone A"
                          value={nomePortaleEsterno}
                          onChange={(e) => setNomePortaleEsterno(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-zinc-600 text-xs font-semibold uppercase">URL Pagina Classifica *</label>
                        <input
                          type="url"
                          placeholder="https://www.fipavromagna.it/..."
                          value={linkEsterno}
                          onChange={(e) => setLinkEsterno(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                        />
                      </div>
                    </div>

                    {/* Preview of Public Banner */}
                    <div className="p-4 bg-zinc-50 border border-dashed border-zinc-300 rounded-xl space-y-2">
                      <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Anteprima Visualizzazione Pubblica:</span>
                      <div className="bg-white border border-zinc-200 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
                        <div>
                          <h5 className="font-bold text-zinc-900 text-sm">🏆 Classifica Ufficiale {activeTeam.campionato}</h5>
                          <p className="text-xs text-zinc-500">I risultati e le posizioni del girone sono gestiti su {nomePortaleEsterno || 'portale federale'}.</p>
                        </div>
                        <a
                          href={linkEsterno || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-brand-yellow hover:bg-yellow-400 text-black font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow shrink-0"
                        >
                          <span>Consulta Classifica Ufficiale</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleSaveClassificaConfig}
                        disabled={isSaving}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Salvataggio...' : 'Salva Impostazioni'}
                      </button>
                    </div>
                  </div>
                )}

                {/* --- OPZIONE 3: DISABILITATA PANEL --- */}
                {tipoClassifica === 'DISABILITATA' && (
                  <div className="bg-zinc-50 border border-zinc-200 p-6 rounded-2xl space-y-4 text-center">
                    <EyeOff className="w-10 h-10 text-zinc-400 mx-auto" />
                    <h4 className="font-bold text-zinc-800 text-base">Classifica Disattivata per questa Squadra</h4>
                    <p className="text-xs text-zinc-500 max-w-md mx-auto">
                      Gli utenti che visitano la scheda pubblica di <b>{activeTeam.nome_squadra}</b> vedranno solo l'Organico Atleti, lo Staff e il Calendario Gare.
                    </p>
                    <button
                      onClick={handleSaveClassificaConfig}
                      disabled={isSaving}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer transition-all inline-flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Salvataggio...' : 'Conferma e Salva'}
                    </button>
                  </div>
                )}

              </div>
            )}

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MATCH CREATE / EDIT MODAL (CON SALVATAGGIO DIRETTO SU FIRESTORE) */}
      {/* ========================================================================= */}
      {editingMatch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-300 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider font-mono">
                  {activeTeam?.nome_squadra}
                </span>
                <h3 className="text-base font-bold text-zinc-950 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-500" />
                  {isNewMatch ? 'Aggiungi Nuova Gara' : `Modifica Gara: ${editingMatch.giornata}`}
                </h3>
              </div>
              <button onClick={() => setEditingMatch(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMatchModal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-600 text-xs font-semibold uppercase">Giornata / Turno *</label>
                  <input
                    type="text"
                    required
                    placeholder="es. 1ª Giornata"
                    value={editingMatch.giornata}
                    onChange={(e) => setEditingMatch({ ...editingMatch, giornata: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-600 text-xs font-semibold uppercase">Casa / Trasferta</label>
                  <select
                    value={editingMatch.casa ? 'CASA' : 'TRASFERTA'}
                    onChange={(e) => setEditingMatch({ ...editingMatch, casa: e.target.value === 'CASA' })}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                  >
                    <option value="CASA">In Casa (New Volley Academy)</option>
                    <option value="TRASFERTA">In Trasferta</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-zinc-600 text-xs font-semibold uppercase">Squadra Avversaria *</label>
                  <input
                    type="text"
                    required
                    placeholder="es. Volley Cesena"
                    value={editingMatch.avversario}
                    onChange={(e) => setEditingMatch({ ...editingMatch, avversario: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-600 text-xs font-semibold uppercase">Data Incontro *</label>
                  <input
                    type="text"
                    required
                    placeholder="es. 20/10/2026"
                    value={editingMatch.data}
                    onChange={(e) => setEditingMatch({ ...editingMatch, data: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-600 text-xs font-semibold uppercase">Orario Inizio</label>
                  <input
                    type="text"
                    placeholder="20:30"
                    value={editingMatch.ora}
                    onChange={(e) => setEditingMatch({ ...editingMatch, ora: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-zinc-600 text-xs font-semibold uppercase">Luogo / Impianto</label>
                  <input
                    type="text"
                    placeholder="es. PalaMaroncelli, Forlì"
                    value={editingMatch.luogo || ''}
                    onChange={(e) => setEditingMatch({ ...editingMatch, luogo: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs font-medium text-zinc-900"
                  />
                </div>

                {/* Score & Sets */}
                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl sm:col-span-2 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-900 uppercase">Risultato Finale & Punteggio</span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-emerald-800">
                      <input
                        type="checkbox"
                        checked={editingMatch.terminata}
                        onChange={(e) => setEditingMatch({ ...editingMatch, terminata: e.target.checked })}
                        className="rounded text-emerald-600"
                      />
                      Gara Conclusa (Disputata)
                    </label>
                  </div>

                  {editingMatch.terminata && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-zinc-500 text-[10px] font-bold uppercase">Set Vinti NVA</label>
                        <input
                          type="number"
                          min="0"
                          max="3"
                          value={editingMatch.setNva ?? 3}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            setEditingMatch({
                              ...editingMatch,
                              setNva: v,
                              risultato: `${v} - ${editingMatch.setAvversario ?? 0}`
                            });
                          }}
                          className="w-full bg-white border border-zinc-300 rounded-xl p-2 text-xs font-bold text-center"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-zinc-500 text-[10px] font-bold uppercase">Set Avversario</label>
                        <input
                          type="number"
                          min="0"
                          max="3"
                          value={editingMatch.setAvversario ?? 0}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            setEditingMatch({
                              ...editingMatch,
                              setAvversario: v,
                              risultato: `${editingMatch.setNva ?? 3} - ${v}`
                            });
                          }}
                          className="w-full bg-white border border-zinc-300 rounded-xl p-2 text-xs font-bold text-center"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-zinc-500 text-[10px] font-bold uppercase">Parziali Set</label>
                        <input
                          type="text"
                          placeholder="es. 25-22, 23-25, 25-19, 25-18"
                          value={editingMatch.parzialiSet || ''}
                          onChange={(e) => setEditingMatch({ ...editingMatch, parzialiSet: e.target.value })}
                          className="w-full bg-white border border-zinc-300 rounded-xl p-2 text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setEditingMatch(null)}
                  className="bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-medium px-4 py-2.5 rounded-xl text-xs cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="bg-brand-yellow hover:bg-yellow-400 text-black font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer transition-all"
                >
                  Salva e Pubblica Gara
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
