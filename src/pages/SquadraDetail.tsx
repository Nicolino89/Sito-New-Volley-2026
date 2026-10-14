import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { RosaSquadra, Giocatore, getStoricoGiocatore, RecordStoricoCarriera, formatRuoloGiocatore, db, isDemoMode } from '../firebase-societa';
import { collection, getDocs, query } from 'firebase/firestore';
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  Trophy, 
  User, 
  ShieldAlert, 
  Sparkles, 
  Briefcase,
  TrendingUp,
  MapPin,
  Clock,
  X,
  Activity,
  History,
  ShieldCheck,
  Info,
  ExternalLink,
  Download,
  CalendarPlus
} from 'lucide-react';
import { downloadIcsCalendar, getGoogleCalendarLink } from '../utils/calendarExport';
import { updatePageMeta } from '../utils/seoHelper';
import PlayerJerseyPlaceholder from '../components/PlayerJerseyPlaceholder';

interface StaffProfilo {
  id: string;
  nomeCognome: string;
  fotoUrl?: string;
  qualificaTecnica?: string;
  palmares?: string;
  storicoCarriera?: Array<{
    anno: string;
    societa: string;
    ruolo: string;
    risultato?: string;
  }>;
  fotoPositionY?: number;
  fotoPositionX?: number;
  foto?: {
    url: string;
    positionY: number;
    positionX?: number;
  };
}

interface SquadraDetailProps {
  squadre: RosaSquadra[];
  giocatori: Giocatore[];
}

export default function SquadraDetail({ squadre, giocatori }: SquadraDetailProps) {
  const { teamId: routeTeamId } = useParams<{ teamId: string }>();
  const location = useLocation();
  const rawTeamId = routeTeamId || (location.pathname.startsWith('/squadre/') ? location.pathname.split('/squadre/')[1] : undefined);
  const teamId = rawTeamId ? decodeURIComponent(rawTeamId) : undefined;
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'schedule' | 'classifica' | 'staff'>('roster');

  // States for selected athlete detail modal and dynamic history loader
  const [selectedPlayer, setSelectedPlayer] = useState<Giocatore | null>(null);
  const [playerHistory, setPlayerHistory] = useState<RecordStoricoCarriera[] | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handlePlayerClick = (player: Giocatore) => {
    setSelectedPlayer(player);
    setPlayerHistory(null);
    setShowHistory(false);
  };

  const handleCloseModal = () => {
    setSelectedPlayer(null);
    setPlayerHistory(null);
    setShowHistory(false);
  };

  const handleFetchHistory = async () => {
    if (!selectedPlayer) return;
    setLoadingHistory(true);
    try {
      const history = await getStoricoGiocatore(selectedPlayer.id);
      setPlayerHistory(history);
      setShowHistory(true);
    } catch (err) {
      console.error("Errore nel caricamento dello storico:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const [staffProfili, setStaffProfili] = useState<Record<string, StaffProfilo>>({});
  const [selectedStaffProfilo, setSelectedStaffProfilo] = useState<StaffProfilo | null>(null);

  useEffect(() => {
    const loadProfiliData = async () => {
      try {
        let list: StaffProfilo[] = [];
        if (isDemoMode) {
          const local = localStorage.getItem('staff_profili');
          list = local ? JSON.parse(local) : [];
        } else {
          const q = query(collection(db, 'staff_profili'));
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() } as StaffProfilo);
          });
        }
        
        const mapped = list.reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {} as Record<string, StaffProfilo>);
        
        setStaffProfili(mapped);
      } catch (err) {
        console.error("Errore nel caricamento dei profili staff:", err);
      }
    };
    loadProfiliData();
  }, []);

  // Lock body scroll on mobile/desktop when modal is active
  useEffect(() => {
    if (selectedPlayer || selectedStaffProfilo) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedPlayer, selectedStaffProfilo]);

  const parseCoach = (coachField: any, roleLabel: string, fallbackName: string) => {
    if (!coachField) return null;
    let id = '';
    let nome = '';
    let qualifica = '';
    let fotoUrl = '';

    if (typeof coachField === 'string') {
      nome = coachField;
    } else {
      id = coachField.id || '';
      nome = coachField.nome || fallbackName;
      qualifica = coachField.qualifica || '';
      fotoUrl = coachField.fotoUrl || '';
    }

    const matchingProfile = id 
      ? staffProfili[id] 
      : Object.values(staffProfili).find((p: any) => p.nomeCognome?.toLowerCase() === nome.toLowerCase()) as StaffProfilo | undefined;
    
    return {
      id: id || matchingProfile?.id || '',
      nome: nome,
      qualifica: qualifica || matchingProfile?.qualificaTecnica || '',
      fotoUrl: fotoUrl || matchingProfile?.foto?.url || matchingProfile?.fotoUrl || '',
      fotoPositionY: matchingProfile?.foto?.positionY ?? matchingProfile?.fotoPositionY ?? coachField?.fotoPositionY ?? 15,
      fotoPositionX: matchingProfile?.foto?.positionX ?? matchingProfile?.fotoPositionX ?? coachField?.fotoPositionX ?? 50,
      profile: matchingProfile || null
    };
  };

  const renderStaffCard = (
    roleKey: 'primo' | 'secondo' | 'dirigente_accompagnatore',
    label: string,
    badgeIcon: React.ReactNode
  ) => {
    const coachField = team?.allenatori?.[roleKey];
    const fallbackName = roleKey === 'primo' ? 'Non Assegnato' : roleKey === 'secondo' ? 'Nessuno Assistente' : 'Non Assegnato';
    
    if (!coachField) {
      return (
        <div className="bg-zinc-50 border border-dashed border-zinc-250 rounded-2xl p-6 flex flex-col items-center justify-center text-center min-h-[460px] space-y-3">
          <div className="bg-zinc-100 text-zinc-400 p-3.5 rounded-full">
            {badgeIcon}
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-400 block uppercase font-bold">{label}</span>
            <h3 className="text-sm font-barlow font-bold uppercase tracking-wider text-zinc-400 mt-1">
              {fallbackName}
            </h3>
          </div>
        </div>
      );
    }

    const parsed = parseCoach(coachField, label, fallbackName);
    if (!parsed) return null;

    return (
      <div 
        onClick={() => {
          if (parsed.profile) {
            setSelectedStaffProfilo(parsed.profile);
          }
        }}
        className={`bg-white border border-zinc-250 rounded-2xl overflow-hidden shadow-sm flex flex-col group transition-all duration-300 ${parsed.profile ? 'cursor-pointer hover:border-brand-yellow hover:scale-[1.02] hover:shadow-md' : ''}`}
      >
        {/* Photo header container - Inquadratura ritratto verticale senza tagli (380px min) */}
        <div 
          className="w-full bg-zinc-950 relative overflow-hidden flex items-center justify-center shrink-0"
          style={{ minHeight: '380px', height: '380px' }}
        >
          {parsed.fotoUrl ? (
            <img 
              src={parsed.fotoUrl} 
              alt={parsed.nome}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              style={{
                objectPosition: `center ${parsed.fotoPositionY ?? 15}%`
              }}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="text-center text-zinc-600 select-none">
              <User className="w-24 h-24 mx-auto text-zinc-800 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest mt-2 block">STAFF</span>
            </div>
          )}
          
          {/* Sfumatura inferiore graduale */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

          {/* Role Badge */}
          <div className="absolute top-4 left-4 bg-brand-yellow text-black font-barlow font-bold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 z-10">
            {badgeIcon} {label}
          </div>
        </div>

        <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-zinc-400 block uppercase font-bold">Nome & Cognome</span>
            <h3 className="text-lg font-barlow font-black uppercase tracking-wide text-zinc-950 leading-tight">
              {parsed.nome}
            </h3>
            {parsed.qualifica && (
              <div className="pt-1.5">
                <span className="text-[10px] font-mono text-zinc-400 block uppercase font-bold">Qualifica Tecnica</span>
                <span className="text-xs text-zinc-900 bg-brand-yellow/15 border border-brand-yellow/30 rounded-md px-2 py-0.5 inline-block font-mono font-semibold uppercase tracking-wide mt-0.5">
                  🎖️ {parsed.qualifica}
                </span>
              </div>
            )}
          </div>

          {parsed.profile && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedStaffProfilo(parsed.profile);
              }}
              className="w-full bg-zinc-900 hover:bg-[#F5D800] hover:text-black text-zinc-300 text-[10px] font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 uppercase font-mono tracking-wider transition-all duration-300 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 animate-pulse" /> Vedi Carriera
            </button>
          )}
        </div>
      </div>
    );
  };

  const team = squadre.find(s => s.id === teamId || s.id === rawTeamId);

  useEffect(() => {
    if (team) {
      document.title = `${team.nome_squadra || 'Squadra'} | New Volley Academy`;
      updatePageMeta({
        title: `${team.nome_squadra || 'Squadra'} - ${team.campionato || 'Campionato'}`,
        description: `Scopri la rosa atleti, lo staff, i risultati e la classifica della squadra ${team.nome_squadra || ''} della New Volley Academy Forlì.`,
        image: team.foto_copertina_url
      });
    } else {
      document.title = "Squadra | New Volley Academy Forlì";
      updatePageMeta({
        title: "Squadra | New Volley Academy Forlì",
        description: "Scheda informativa e dettagli della squadra della New Volley Academy Forlì."
      });
    }
  }, [team?.id]);

  // Filter athletes that belong to this team's roster (support both id_atleti and giocatori_ids)
  const teamPlayers = React.useMemo(() => {
    if (!team) return [];
    return giocatori.filter(p => 
      team.id_atleti?.includes(p.id) || ((team as any).giocatori_ids || []).includes(p.id)
    );
  }, [team, giocatori]);

  const [searchParams] = useSearchParams();
  const atletaParam = searchParams.get('atleta');

  // Auto-open athlete sheet if requested via URL param ?atleta=id
  useEffect(() => {
    if (atletaParam && (teamPlayers.length > 0 || giocatori.length > 0)) {
      const match = teamPlayers.find(p => p.id === atletaParam) || giocatori.find(p => p.id === atletaParam);
      if (match) {
        setSelectedPlayer(match);
      }
    }
  }, [atletaParam, teamPlayers, giocatori]);

  if (!team) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-brand-yellow mx-auto animate-bounce" />
        <h2 className="text-2xl font-barlow font-bold uppercase tracking-wide text-zinc-950">Squadra non trovata</h2>
        <p className="text-zinc-500 font-inter text-sm">La squadra che stai cercando non esiste o è stata archiviata.</p>
        <button
          onClick={() => navigate('/squadre')}
          className="bg-black text-white hover:bg-brand-yellow hover:text-black font-barlow font-semibold uppercase text-xs tracking-wider px-6 py-3 rounded-lg transition-all"
        >
          Torna alle Squadre
        </button>
      </div>
    );
  }

  // Distinguish Male / Female based on team name, championship or gender property
  const isFemminile = (s?: RosaSquadra) => {
    if (!s) return false;
    const nameLower = (s.nome_squadra || '').toLowerCase();
    const campLower = (s.campionato || '').toLowerCase();
    return nameLower.includes('femminile') || nameLower.includes(' fem') || campLower.includes('femminile') || (s as any)?.gender === 'F' || (s as any)?.genere === 'F';
  };
  const genderLetter = isFemminile(team) ? 'F' : 'M';

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <div>
        <button
          onClick={() => navigate('/squadre')}
          className="group inline-flex items-center gap-2 text-xs font-barlow font-semibold uppercase tracking-widest text-zinc-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-brand-yellow group-hover:-translate-x-1 transition-transform" />
          Torna alle Squadre
        </button>
      </div>

      {/* TEAM HERO BANNER */}
      <div 
        className="bg-black border border-zinc-850 rounded-3xl overflow-hidden relative shadow-2xl h-72 md:h-96 flex flex-col justify-end"
        id="team-detail-hero"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src={team.foto_copertina_url || "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=1200&auto=format&fit=crop&q=80"} 
            alt={team.nome_squadra}
            className="w-full h-full object-cover opacity-45"
            style={{
              objectPosition: `center ${team.coverPositionY ?? 50}%`
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/75 to-transparent" />
        </div>

        <div className="p-6 md:p-10 z-10 relative space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-brand-yellow text-black text-[10px] font-black tracking-widest px-3 py-1 rounded-md uppercase font-mono shadow-md">
              {team.stagione}
            </span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-black font-mono px-2.5 py-1 rounded-md uppercase border ${
              genderLetter === 'F' 
                ? 'bg-pink-950/60 border-pink-500/30 text-pink-400' 
                : 'bg-blue-950/60 border-blue-500/30 text-blue-400'
            }`}>
              {genderLetter === 'F' ? '♀ Femminile' : '♂ Maschile'}
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl md:text-5xl font-barlow font-bold text-white uppercase tracking-wide leading-tight">
              {team.nome_squadra}
            </h1>
            <p className="text-brand-yellow font-barlow font-semibold uppercase text-sm tracking-wider">
              {team.campionato}
            </p>
          </div>
        </div>
      </div>

      {/* SUB TAB NAVIGATION */}
      <div className="flex justify-start border-b border-zinc-200 pb-px">
        <div className="flex gap-2 bg-zinc-100 p-1 rounded-xl border border-zinc-250">
          <button
            onClick={() => setActiveSubTab('roster')}
            className={`px-5 py-2 rounded-lg text-xs font-semibold font-barlow uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${
              activeSubTab === 'roster'
                ? 'bg-black text-white font-semibold shadow-md'
                : 'text-zinc-500 hover:text-black'
            }`}
          >
            <Users className="w-4 h-4 text-brand-yellow" />
            Roster / Atleti
          </button>
          <button
            onClick={() => setActiveSubTab('schedule')}
            className={`px-5 py-2 rounded-lg text-xs font-semibold font-barlow uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${
              activeSubTab === 'schedule'
                ? 'bg-black text-white font-semibold shadow-md'
                : 'text-zinc-500 hover:text-black'
            }`}
          >
            <Calendar className="w-4 h-4 text-brand-yellow" />
            Calendario / Gare
          </button>
          <button
            onClick={() => setActiveSubTab('classifica')}
            className={`px-5 py-2 rounded-lg text-xs font-semibold font-barlow uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${
              activeSubTab === 'classifica'
                ? 'bg-black text-white font-semibold shadow-md'
                : 'text-zinc-500 hover:text-black'
            }`}
          >
            <Trophy className="w-4 h-4 text-brand-yellow" />
            Classifica Girone
          </button>
          <button
            onClick={() => setActiveSubTab('staff')}
            className={`px-5 py-2 rounded-lg text-xs font-semibold font-barlow uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${
              activeSubTab === 'staff'
                ? 'bg-black text-white font-semibold shadow-md'
                : 'text-zinc-500 hover:text-black'
            }`}
          >
            <Briefcase className="w-4 h-4 text-brand-yellow" />
            Staff Tecnico
          </button>
        </div>
      </div>

      {/* TAB SUB-CONTENTS */}
      <div className="pt-2">
        {/* TAB 1: ROSTER / ATHLETES */}
        {activeSubTab === 'roster' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-yellow shrink-0" />
              <h2 className="text-xl font-barlow font-semibold uppercase tracking-wide text-slate-900">
                ORGANICO ATLETI CONVOCATI
              </h2>
            </div>

            {teamPlayers.length === 0 ? (
              <div className="text-center py-12 bg-white border border-zinc-200 rounded-2xl">
                <Users className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
                <p className="text-zinc-500 font-medium font-sport uppercase text-sm">Nessun atleta registrato nell'organico</p>
                <p className="text-zinc-400 text-xs mt-1">Usa l'area amministrativa per associare atleti a questa squadra.</p>
              </div>
             ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {teamPlayers.map(player => (
                  <div 
                    key={player.id}
                    onClick={() => handlePlayerClick(player)}
                    className="bg-white border border-zinc-250 hover:border-brand-yellow rounded-2xl overflow-hidden shadow-sm hover:shadow-md cursor-pointer hover:scale-[1.02] transition-all duration-300 flex flex-col group"
                  >
                    {/* Athlete photo placeholder - Proporzione 3:4 consistente */}
                    <div className="aspect-[3/4] w-full bg-zinc-900 relative overflow-hidden flex items-center justify-center">
                      {player.foto?.url || player.foto_url ? (
                        <img 
                          src={player.foto?.url ?? player.foto_url} 
                          alt={`${player.nome} ${player.cognome}`}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          style={{
                            objectPosition: `${player.fotoPositionX ?? player.foto?.positionX ?? 50}% ${player.fotoPositionY ?? player.foto?.positionY ?? 50}%`
                          }}
                        />
                      ) : (
                        <PlayerJerseyPlaceholder
                          numeroMaglia={player.numero_maglia}
                          cognome={player.cognome}
                          isCapitano={team.capitano_id === player.id}
                          ruolo={player.ruolo}
                        />
                      )}
                      
                      {/* Shirt Number Badge / NVA Panther Badge */}
                      {player.numero_maglia && player.numero_maglia !== 0 && String(player.numero_maglia).trim() !== '0' ? (
                        <div className="absolute top-4 left-4 bg-brand-yellow text-black font-bebas text-2xl tracking-wider px-3 py-1.5 rounded-lg shadow-md z-10">
                          #{player.numero_maglia}
                        </div>
                      ) : (
                        <div className="absolute top-3.5 left-3.5 bg-black/85 backdrop-blur-md border border-brand-yellow/50 text-brand-yellow font-barlow font-black text-xs tracking-wider px-2.5 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 z-10">
                          <img src="/images/pantera-hero.png" alt="NVA" className="w-4 h-4 object-contain" />
                          <span>PANTERE</span>
                        </div>
                      )}

                      {/* Captain Badge */}
                      {team.capitano_id === player.id && (
                        <div className="absolute top-16 left-4 bg-amber-500 text-black font-barlow font-semibold text-xs px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1 z-10">
                          <Trophy className="w-3.5 h-3.5 shrink-0" /> CAPITANO
                        </div>
                      )}

                      {/* Active State */}
                      <div className="absolute top-4 right-4 bg-black/75 border border-zinc-800 text-[9px] font-mono text-emerald-400 font-bold tracking-wider px-2 py-0.5 rounded shadow-sm">
                        ATTIVO
                      </div>
                    </div>

                    <div className="p-4 flex-grow space-y-2 flex flex-col justify-between">
                      <div>
                        <h4 className="text-base font-inter font-semibold tracking-wide text-zinc-950 uppercase leading-tight flex items-center gap-1.5 flex-wrap">
                          {player.nome} {player.cognome}
                          {team.capitano_id === player.id && (
                            <span className="inline-block text-[9px] bg-brand-yellow text-black font-inter px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                              (C) CAPITANO
                            </span>
                          )}
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] border-t border-zinc-100 pt-2 font-mono">
                          <div>
                            <span className="text-zinc-400 block uppercase">Ruolo</span>
                            <span className="text-zinc-900 font-extrabold">
                              {player.ruolo ? formatRuoloGiocatore(player.ruolo, (player as any).genere || genderLetter) : '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block uppercase">Altezza</span>
                            <span className="text-zinc-900 font-extrabold">{player.altezza ? `${player.altezza} cm` : '—'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] font-mono text-zinc-400 border-t border-zinc-100 pt-2 flex justify-between items-center mt-2">
                        <span>NATO NEL: {player.data_nascita ? player.data_nascita.split('-')[0] : 'n/d'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CALENDAR / SCHEDULE */}
        {activeSubTab === 'schedule' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-yellow shrink-0" />
                <h2 className="text-xl font-barlow font-semibold uppercase tracking-wide text-slate-900">
                  CALENDARIO INCONTRI E RISULTATI
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {((team.partite && team.partite.length > 0) || (team.cronologia_gare && team.cronologia_gare.length > 0)) && (
                  <button
                    onClick={() => {
                      const matchesList = team.partite && team.partite.length > 0 
                        ? team.partite 
                        : (team.cronologia_gare || []);
                      downloadIcsCalendar(team.nome_squadra, matchesList as any, team.nome_visualizzato_gare || team.nome_squadra);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-900 hover:bg-brand-yellow font-bold bg-amber-100/80 border border-amber-300 px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                    title="Scarica tutte le partite per Apple Calendar, Outlook e Google Calendar"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-800" /> Sincronizza Calendario (.ics)
                  </button>
                )}
                {team.fipav_url && (
                  <a
                    href={team.fipav_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-600 hover:text-zinc-950 font-bold bg-white border border-zinc-200 px-3 py-1.5 rounded-lg shadow-sm transition-all"
                  >
                    Portale FIPAV <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {(!team.partite || team.partite.length === 0) && (!team.cronologia_gare || team.cronologia_gare.length === 0) ? (
              <div className="text-center py-12 bg-white border border-zinc-200 rounded-2xl">
                <Calendar className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
                <p className="text-zinc-500 font-medium font-barlow uppercase text-sm">Nessun incontro in calendario</p>
                <p className="text-zinc-400 text-xs mt-1 font-inter">Le gare ufficiali di campionato saranno caricate a breve.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(team.partite && team.partite.length > 0 ? team.partite : team.cronologia_gare?.map((cg, idx) => ({
                  id: `cg_${idx}`,
                  giornata: cg.giornata || `${idx + 1}ª Giornata`,
                  data: cg.data,
                  ora: cg.ora,
                  avversario: cg.avversario,
                  casa: cg.casa,
                  luogo: cg.luogo || 'PalaMaroncelli, Forlì',
                  risultato: cg.terminata ? `${cg.set_vinti} - ${cg.set_persi}` : '',
                  setNva: cg.set_vinti,
                  setAvversario: cg.set_persi,
                  parzialiSet: cg.parzialiSet || '',
                  terminata: cg.terminata
                })) || []).map((match, idx) => {
                  const setNva = match.setNva ?? 0;
                  const setOpp = match.setAvversario ?? 0;
                  const hasWon = match.terminata && setNva > setOpp;
                  return (
                    <div 
                      key={match.id || idx}
                      className={`bg-white border rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-stretch gap-6 relative overflow-hidden transition-all ${
                        match.terminata ? 'border-zinc-250' : 'border-brand-yellow/60 bg-amber-50/10'
                      }`}
                    >
                      {/* Home / Away badge */}
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${match.casa ? 'bg-brand-yellow' : 'bg-zinc-400'}`} />

                      <div className="flex-1 flex flex-col md:flex-row md:items-center gap-6 pl-2">
                        {/* Match date and status */}
                        <div className="space-y-1 md:w-36 shrink-0">
                          <span className="text-[9.5px] font-mono text-zinc-400 block uppercase font-bold">
                            {match.giornata || `${idx + 1}ª Gara`}
                          </span>
                          <span className="text-zinc-900 text-sm font-extrabold font-mono block">{match.data}</span>
                          <span className="text-zinc-500 text-xs font-mono block">⏰ {match.ora || '20:30'}</span>
                        </div>

                        {/* Match matchup */}
                        <div className="flex-1 flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] uppercase font-bold border ${
                              match.casa 
                                ? 'bg-amber-50 border-amber-200 text-amber-900 font-mono' 
                                : 'bg-zinc-100 border-zinc-200 text-zinc-700 font-mono'
                            }`}>
                              {match.casa ? 'In Casa' : 'Trasferta'}
                            </span>
                            {match.luogo && (
                              <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-zinc-400" /> {match.luogo}
                              </span>
                            )}
                          </div>
                          
                          <h3 className="text-lg font-barlow font-bold uppercase tracking-wide text-zinc-950">
                            {match.casa 
                              ? `${team.nome_visualizzato_gare || team.nome_squadra || 'NVA'} vs ${match.avversario}` 
                              : `${match.avversario} vs ${team.nome_visualizzato_gare || team.nome_squadra || 'NVA'}`}
                          </h3>

                          {match.parzialiSet && (
                            <p className="text-[11px] font-mono text-zinc-500 mt-1">
                              Parziali: <span className="font-semibold text-zinc-700">{match.parzialiSet}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Score section */}
                      <div className="md:w-52 shrink-0 flex items-center justify-start md:justify-end border-t md:border-t-0 md:border-l border-zinc-100 pt-4 md:pt-0 md:pl-6">
                        {match.terminata ? (
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-[9px] font-mono text-zinc-400 block uppercase tracking-wider">Punteggio</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                {hasWon ? (
                                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black tracking-widest px-2 py-0.5 rounded uppercase font-mono">
                                    VITTORIA
                                  </span>
                                ) : (
                                  <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-black tracking-widest px-2 py-0.5 rounded uppercase font-mono">
                                    SCONFITTA
                                  </span>
                                )}
                                <span className="text-3xl font-sport font-black tabular-nums text-zinc-950 tracking-tight leading-none">
                                  {setNva} - {setOpp}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-2 font-bold">
                            <Clock className="w-4 h-4 text-brand-yellow animate-spin" />
                            Da Disputare
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2.B: STANDINGS / CLASSIFICA */}
        {activeSubTab === 'classifica' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-brand-yellow shrink-0" />
                <h2 className="text-xl font-barlow font-semibold uppercase tracking-wide text-slate-900">
                  CLASSIFICA UFFICIALE {team.campionato?.toUpperCase()}
                </h2>
              </div>
              {(team.fipav_url || (team as any).link_esterno_classifica) && (
                <a
                  href={(team as any).link_esterno_classifica || team.fipav_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-600 hover:text-zinc-950 font-bold bg-white border border-zinc-200 px-3 py-1.5 rounded-lg shadow-sm transition-all"
                >
                  {(team as any).nome_portale_esterno || 'Scheda Ufficiale Esterna'} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* If Mode is LINK_ESTERNO or if no table rows exist but an external link is provided */}
            {((team as any).tipo_classifica === 'LINK_ESTERNO' || (!team.classifica || team.classifica.length === 0)) && ((team as any).link_esterno_classifica || team.fipav_url) ? (
              <div className="bg-white border-2 border-brand-yellow/40 rounded-3xl p-8 shadow-sm space-y-5 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-900 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider">
                    <Trophy className="w-4 h-4 text-amber-700" />
                    <span>{(team as any).nome_portale_esterno || 'Portale Ufficiale del Campionato'}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-950 uppercase font-barlow tracking-tight">
                    Classifica & Risultati Ufficiali del Girone
                  </h3>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    La classifica aggiornata in tempo reale e i risultati di tutte le gare del campionato <b>{team.campionato}</b> sono consultabili direttamente sul portale ufficiale del comitato.
                  </p>
                </div>

                <a
                  href={(team as any).link_esterno_classifica || team.fipav_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-brand-yellow hover:bg-yellow-400 text-black font-black font-barlow uppercase tracking-wider px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all shrink-0 text-sm hover:scale-105"
                >
                  <span>Consulta Classifica Ufficiale</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ) : (!team.classifica || team.classifica.length === 0) ? (
              <div className="text-center py-12 bg-white border border-zinc-200 rounded-2xl">
                <Trophy className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
                <p className="text-zinc-500 font-medium font-barlow uppercase text-sm">Classifica non ancora disponibile</p>
                <p className="text-zinc-400 text-xs mt-1 font-inter">La classifica verrà aggiornata all'avvio della prima giornata di campionato.</p>
              </div>
            ) : (
              <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-black text-brand-yellow font-sport uppercase text-[12px] tracking-wider border-b border-zinc-800">
                        <th className="p-3.5 w-14 text-center">Pos</th>
                        <th className="p-3.5">Squadra</th>
                        <th className="p-3.5 w-24 text-center font-black">Punti</th>
                        <th className="p-3.5 w-20 text-center font-mono">Giocate</th>
                        <th className="p-3.5 w-20 text-center font-mono">Vinte</th>
                        <th className="p-3.5 w-20 text-center font-mono">Perse</th>
                        <th className="p-3.5 w-28 text-center font-mono">Set V/P</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-mono text-[13px]">
                      {team.classifica.map((row, idx) => {
                        const isMyTeam = team.squadra_fipav_ufficiale 
                          ? row.squadra.toLowerCase().trim() === team.squadra_fipav_ufficiale.toLowerCase().trim()
                          : (row.isMyTeam || row.squadra.toLowerCase().includes('new volley') || (row.squadra.toLowerCase().includes('salfep') && row.squadra.toLowerCase().includes('forli')));

                        return (
                          <tr 
                            key={idx}
                            className={`transition-colors ${
                              isMyTeam 
                                ? 'bg-amber-100/70 text-black font-black border-l-4 border-brand-yellow' 
                                : 'hover:bg-zinc-50 text-zinc-800'
                            }`}
                          >
                            <td className="p-3.5 text-center font-bold text-sm">
                              {row.pos}
                            </td>
                            <td className="p-3.5 font-sport uppercase text-sm tracking-wide flex items-center gap-2">
                              <span>{row.squadra}</span>
                              {isMyTeam && (
                                <span className="bg-black text-brand-yellow text-[9px] font-sans font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  {team.nome_visualizzato_gare || team.nome_squadra || 'IL NOSTRO CLUB'}
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-center font-black text-base text-amber-600">
                              {row.punti}
                            </td>
                            <td className="p-3.5 text-center text-zinc-700">
                              {row.giocate}
                            </td>
                            <td className="p-3.5 text-center text-emerald-700 font-bold">
                              {row.vinte}
                            </td>
                            <td className="p-3.5 text-center text-rose-700 font-bold">
                              {row.perse}
                            </td>
                            <td className="p-3.5 text-center text-zinc-500 text-xs">
                              {row.setVinti ?? '-'}:{row.setPersi ?? '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}


        {/* TAB 3: STAFF */}
        {activeSubTab === 'staff' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-brand-yellow shrink-0" />
              <h2 className="text-xl font-barlow font-semibold uppercase tracking-wide text-slate-900">
                STAFF TECNICO E DIRIGENZIALE
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderStaffCard('primo', '1° ALLENATORE', <Trophy className="w-4 h-4 text-black" />)}
              {renderStaffCard('secondo', '2° ALLENATORE', <User className="w-4 h-4 text-brand-yellow" />)}
              {renderStaffCard('dirigente_accompagnatore', 'DIRIGENTE ACCOMPAGNATORE', <TrendingUp className="w-4 h-4 text-brand-yellow" />)}
            </div>
          </div>
        )}
      </div>

      {/* ATHLETE PROFILE MODAL/DRAWER */}
      <AnimatePresence>
        {selectedPlayer && (
          <div className="fixed inset-0 z-50 flex items-center justify-end overflow-hidden" id="athlete-modal-container">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
              id="athlete-backdrop"
            />

            {/* Slide-over Content Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg h-full bg-white shadow-2xl flex flex-col z-10 border-l border-zinc-200"
              id="athlete-drawer"
            >
              {/* Header */}
              <div className="p-6 border-b border-zinc-200 flex justify-between items-center bg-zinc-50 shrink-0">
                <div className="flex items-center gap-3">
                  {selectedPlayer.numero_maglia && selectedPlayer.numero_maglia !== 0 && String(selectedPlayer.numero_maglia).trim() !== '0' ? (
                    <div className="bg-brand-yellow text-black font-bebas text-3xl tracking-wider px-3.5 py-1.5 rounded-xl shadow-sm">
                      #{selectedPlayer.numero_maglia}
                    </div>
                  ) : (
                    <div className="bg-black text-brand-yellow border border-brand-yellow/40 font-barlow font-black text-sm tracking-wider px-3 py-2 rounded-xl shadow-sm flex items-center gap-1.5">
                      <img src="/images/pantera-hero.png" alt="NVA" className="w-5 h-5 object-contain" />
                      <span>PANTERE</span>
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-inter font-semibold text-zinc-400 block uppercase tracking-widest">SCHEDA ATLETA</span>
                    <h3 className="text-xl font-inter font-semibold tracking-wide text-zinc-900 uppercase">
                      {selectedPlayer.nome} {selectedPlayer.cognome}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-full hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                  aria-label="Chiudi"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-grow overflow-y-auto p-6 space-y-8 animate-fade-in">
                {/* Profile Photo Block - Presentazione Totem 3:4 con Sfondo Atmosferico */}
                {(() => {
                  const photoUrl = selectedPlayer.foto?.url ?? selectedPlayer.foto_url;
                  const posX = selectedPlayer.fotoPositionX ?? selectedPlayer.foto?.positionX ?? 50;
                  const posY = selectedPlayer.fotoPositionY ?? selectedPlayer.foto?.positionY ?? 50;

                  return (
                    <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-900 to-black border border-zinc-200 shadow-md p-4 sm:p-5 flex flex-col items-center justify-center shrink-0">
                      {/* Sfondo d'atmosfera sfocato */}
                      {photoUrl && (
                        <div 
                          className="absolute inset-0 bg-cover bg-center blur-2xl opacity-25 scale-125 pointer-events-none"
                          style={{ backgroundImage: `url(${photoUrl})` }}
                        />
                      )}

                      {/* Totem Foto Proporzione 3:4 (identica ad Admin e Griglia) */}
                      <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-2 border-brand-yellow/60 bg-zinc-950 flex items-center justify-center">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={`${selectedPlayer.nome} ${selectedPlayer.cognome}`}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                            style={{
                              objectPosition: `${posX}% ${posY}%`
                            }}
                          />
                        ) : (
                          <PlayerJerseyPlaceholder
                            numeroMaglia={selectedPlayer.numero_maglia}
                            cognome={selectedPlayer.cognome}
                            isCapitano={team.capitano_id === selectedPlayer.id}
                            ruolo={selectedPlayer.ruolo}
                          />
                        )}

                        {/* Sfumatura leggera alla base per risaltare i badge */}
                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

                        {/* Badges sulla foto */}
                        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5 items-center justify-between">
                          {team.capitano_id === selectedPlayer.id && (
                            <span className="bg-brand-yellow text-black font-barlow font-bold text-xs px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
                              <Trophy className="w-3.5 h-3.5 shrink-0" /> CAPITANO
                            </span>
                          )}
                          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-inter font-bold tracking-wider shadow-md ${
                            selectedPlayer.attivo 
                              ? 'bg-emerald-500 text-white' 
                              : 'bg-rose-500 text-white'
                          }`}>
                            {selectedPlayer.attivo ? 'STATO: ATTIVO' : 'STATO: INATTIVO'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Technical / Physical Data Grid */}
                <div className="space-y-4">
                  <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold border-b border-zinc-100 pb-2">
                    DATI TECNICI & FISICI
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Ruolo */}
                    <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl flex items-center gap-3">
                      <div className="bg-brand-yellow/10 p-2 rounded-lg text-brand-yellow shrink-0">
                        <Activity className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-zinc-400 block uppercase">RUOLO</span>
                        <span className="text-sm font-semibold text-zinc-900">
                          {selectedPlayer.ruolo ? formatRuoloGiocatore(selectedPlayer.ruolo, (selectedPlayer as any).genere || genderLetter) : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Altezza */}
                    <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl flex items-center gap-3">
                      <div className="bg-brand-yellow/10 p-2 rounded-lg text-brand-yellow shrink-0">
                        <TrendingUp className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-zinc-400 block uppercase">ALTEZZA</span>
                        <span className="text-sm font-semibold text-zinc-900">
                          {selectedPlayer.altezza ? `${selectedPlayer.altezza} cm` : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Anno Di Nascita */}
                    <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl flex items-center gap-3">
                      <div className="bg-brand-yellow/10 p-2 rounded-lg text-brand-yellow shrink-0">
                        <Calendar className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-zinc-400 block uppercase">NASCITA</span>
                        <span className="text-sm font-semibold text-zinc-900">
                          {selectedPlayer.data_nascita ? selectedPlayer.data_nascita.split('-')[0] : 'n/d'}
                        </span>
                      </div>
                    </div>

                    {/* Stato Atleta */}
                    <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl flex items-center gap-3">
                      <div className="bg-brand-yellow/10 p-2 rounded-lg text-brand-yellow shrink-0">
                        <ShieldCheck className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-zinc-400 block uppercase">STATO AGONISTICO</span>
                        <span className="text-sm font-semibold text-zinc-900">
                          {selectedPlayer.attivo ? 'Idoneo / In Attività' : 'Non Disponibile / Infortunato'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline History Block */}
                <div className="space-y-4">
                  {!showHistory ? (
                    <div className="pt-2">
                      <button
                        onClick={handleFetchHistory}
                        disabled={loadingHistory}
                        className="w-full bg-white border border-amber-400 hover:border-amber-500 text-zinc-950 font-semibold py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                      >
                        {loadingHistory ? (
                          <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <History className="w-4 h-4 text-amber-600" />
                        )}
                        Vedi Storico Giocatore
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold border-b border-zinc-100 pb-2 flex items-center gap-2">
                        <History className="w-4 h-4 text-amber-600" />
                        CARRIERA IN NEW VOLLEY ACADEMY
                      </h4>
                      
                      {!playerHistory || playerHistory.length === 0 ? (
                        <p className="text-xs text-zinc-500 italic py-4 text-center">
                          Nessun dato storico registrato per questo atleta.
                        </p>
                      ) : (
                        <div className="relative pl-6 border-l-2 border-zinc-200 space-y-6 pt-2">
                          {playerHistory.map((h, index) => (
                            <div key={index} className="relative">
                              {/* Connector Dot */}
                              <div className="absolute -left-[31px] top-1 bg-white border-2 border-brand-yellow rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                                <div className="bg-black rounded-full w-1.5 h-1.5" />
                              </div>

                              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-2">
                                <div className="flex justify-between items-center gap-2">
                                  <span className="bg-brand-yellow text-black font-barlow font-black text-xs tracking-wider px-2.5 py-0.5 rounded-md uppercase shadow-sm">
                                    {h.stagione}
                                  </span>
                                  <span className="text-xs font-mono text-zinc-600 font-bold uppercase">
                                    {h.campionato}
                                  </span>
                                </div>
                                <h5 className="font-bold text-sm text-zinc-950 uppercase">
                                  {h.nome_squadra}
                                </h5>
                                {h.allenatore && (
                                  <p className="text-xs text-zinc-600 font-mono">
                                    Coach: {h.allenatore}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STAFF CAREER MODAL */}
      <AnimatePresence>
        {selectedStaffProfilo && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" id="staff-modal-container">
            {/* Backdrop with elegant blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStaffProfilo(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm cursor-pointer"
              id="staff-backdrop"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-zinc-950 border border-brand-yellow/40 rounded-3xl w-full max-w-3xl overflow-hidden relative shadow-2xl z-10 flex flex-col max-h-[90vh]"
              id="staff-modal-box"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedStaffProfilo(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 p-2 rounded-full cursor-pointer transition-colors z-20 border border-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Body (Scrollable) */}
              <div className="overflow-y-auto p-6 md:p-8 space-y-6">
                
                {/* Header Profile Info - Foto Grande e Dettagliata */}
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start border-b border-zinc-800/80 pb-7">
                  {/* Photo Profile Grande Verticale */}
                  <div 
                    className="w-52 sm:w-60 bg-zinc-900 rounded-3xl overflow-hidden border-2 border-brand-yellow/50 shadow-[0_10px_35px_rgba(0,0,0,0.8)] flex items-center justify-center shrink-0 relative group"
                    style={{ minHeight: '300px', height: '320px', width: '230px' }}
                  >
                    {selectedStaffProfilo.foto?.url || selectedStaffProfilo.fotoUrl ? (
                      <img 
                        src={selectedStaffProfilo.foto?.url ?? selectedStaffProfilo.fotoUrl} 
                        alt={selectedStaffProfilo.nomeCognome} 
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover object-top"
                        style={{
                          objectPosition: `center ${selectedStaffProfilo.foto?.positionY ?? selectedStaffProfilo.fotoPositionY ?? 15}%`
                        }}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User className="w-20 h-20 text-zinc-600" />
                    )}

                    {/* Sfumatura inferiore di design */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  </div>

                  <div className="space-y-3.5 text-center md:text-left flex-1 pt-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-yellow/15 border border-brand-yellow/40 text-brand-yellow font-mono text-[11px] font-bold uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>SCHEDA TECNICA UFFICIALE</span>
                    </div>

                    <h3 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight font-barlow leading-none">
                      {selectedStaffProfilo.nomeCognome}
                    </h3>

                    {selectedStaffProfilo.qualificaTecnica && (
                      <div className="pt-1">
                        <span className="bg-[#F5D800] text-black font-barlow font-black text-xs sm:text-sm uppercase tracking-wider px-4 py-1.5 rounded-xl inline-block shadow-md">
                          🎖️ {selectedStaffProfilo.qualificaTecnica}
                        </span>
                      </div>
                    )}

                    <p className="text-xs font-mono text-zinc-400">
                      Staff Tecnico & Dirigenziale • New Volley Academy
                    </p>
                  </div>
                </div>

                {/* Palmarès Section */}
                {selectedStaffProfilo.palmares && selectedStaffProfilo.palmares.trim() !== '' && (
                  <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl space-y-3 shadow-inner">
                    <h4 className="text-xs font-black text-[#F5D800] font-mono uppercase tracking-widest flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-[#F5D800]" /> Palmarès & Riconoscimenti
                    </h4>
                    <p className="text-xs text-zinc-300 leading-relaxed font-medium whitespace-pre-line">
                      {selectedStaffProfilo.palmares}
                    </p>
                  </div>
                )}

                {/* Career History Table Section */}
                {selectedStaffProfilo.storicoCarriera && selectedStaffProfilo.storicoCarriera.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-white font-mono uppercase tracking-widest flex items-center gap-2 border-l-2 border-[#F5D800] pl-2">
                      <Briefcase className="w-4 h-4 text-[#F5D800]" /> Storico Carriera
                    </h4>

                    <div className="overflow-x-auto border border-zinc-850 rounded-2xl shadow-lg">
                      <table className="w-full text-left text-xs text-zinc-300 border-collapse">
                        <thead className="bg-zinc-900 text-zinc-400 font-mono border-b border-zinc-850">
                          <tr>
                            <th className="p-3 text-[10px] uppercase font-bold tracking-wider">Anno</th>
                            <th className="p-3 text-[10px] uppercase font-bold tracking-wider">Società / Squadra</th>
                            <th className="p-3 text-[10px] uppercase font-bold tracking-wider">Ruolo</th>
                            <th className="p-3 text-[10px] uppercase font-bold tracking-wider">Risultato</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900 bg-black/40">
                          {selectedStaffProfilo.storicoCarriera.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-zinc-900/40 transition-colors">
                              <td className="p-3 font-mono font-bold text-white text-[11px]">
                                {row.anno}
                              </td>
                              <td className="p-3 font-semibold text-zinc-200">
                                {row.societa}
                              </td>
                              <td className="p-3 text-zinc-300">
                                {row.ruolo}
                              </td>
                              <td className="p-3 text-[11px] font-mono text-[#F5D800] font-semibold">
                                {row.risultato || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Footer close description */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setSelectedStaffProfilo(null)}
                    className="bg-[#F5D800] hover:bg-[#d6bc00] text-black font-extrabold px-6 py-2 rounded-xl text-xs uppercase tracking-widest transition-all duration-200 shadow-md cursor-pointer"
                  >
                    Chiudi Dettagli
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
