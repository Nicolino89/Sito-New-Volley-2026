import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Calendar, 
  Users, 
  ArrowLeft, 
  Search, 
  Sparkles, 
  Maximize2, 
  X, 
  Medal, 
  Shield, 
  Award,
  Crown,
  History,
  Filter,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Images,
  User,
  Activity,
  TrendingUp,
  ShieldCheck,
  Briefcase,
  Link as LinkIcon
} from 'lucide-react';
import { 
  SquadraStorica, 
  getStoricoSquadreAll, 
  AtletaRosterStorico,
  RosaSquadra,
  Giocatore,
  getStoricoGiocatore,
  RecordStoricoCarriera,
  formatRuoloGiocatore,
  sortRosterStorico,
  db
} from '../firebase-societa';
import { collection, getDocs } from 'firebase/firestore';
import { updatePageMeta } from '../utils/seoHelper';

interface SquadreArchivioProps {
  squadreInCorso?: RosaSquadra[];
  giocatori?: Giocatore[];
}

export default function SquadreArchivio({ squadreInCorso, giocatori }: SquadreArchivioProps) {
  const navigate = useNavigate();
  const [squadreStoriche, setSquadreStoriche] = useState<SquadraStorica[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Drawer Atleta in Società
  const [selectedPlayerModal, setSelectedPlayerModal] = useState<{
    giocatore: Giocatore;
    teamAttuale: RosaSquadra | null;
  } | null>(null);

  // Filtri
  const [stagioneSelezionata, setStagioneSelezionata] = useState<string>('TUTTE');
  const [categoriaSelezionata, setCategoriaSelezionata] = useState<string>('TUTTE');
  const [searchQuery, setSearchQuery] = useState('');

  // Lightbox Foto di Squadra a Tutto Schermo
  const [lightboxData, setLightboxData] = useState<{ squadra: SquadraStorica; index: number } | null>(null);

  // Elenco profili staff per collegamenti interni e cronostoria allenatori
  const [staffList, setStaffList] = useState<Array<{
    id: string;
    nomeCognome: string;
    qualificaTecnica?: string;
    palmares?: string;
    fotoUrl?: string;
    storicoCarriera?: Array<{ anno: string; societa: string; ruolo: string; risultato?: string }>;
  }>>([]);

  // Modal Cronostoria Coach
  const [selectedCoachModal, setSelectedCoachModal] = useState<{
    nome: string;
    coach?: {
      id: string;
      nomeCognome: string;
      qualificaTecnica?: string;
      palmares?: string;
      fotoUrl?: string;
      storicoCarriera?: Array<{ anno: string; societa: string; ruolo: string; risultato?: string }>;
    };
    squadreAllenate: SquadraStorica[];
  } | null>(null);

  useEffect(() => {
    updatePageMeta({
      title: "Archivio Storico Squadre | New Volley Academy Forlì",
      description: "Esplora l'archivio storico delle formazioni, delle foto ufficiali di squadra e dei traguardi sportivi della New Volley Academy Forlì nelle varie annate agonistiche.",
      url: "https://newvolleyacademy.it/squadre-archivio"
    });
    caricaArchivio();
  }, []);

  const caricaArchivio = async () => {
    try {
      setLoading(true);
      const [data, staffSnap] = await Promise.all([
        getStoricoSquadreAll(),
        getDocs(collection(db, 'staff_profili'))
      ]);
      setSquadreStoriche(data);

      const staff: any[] = [];
      staffSnap.forEach(d => {
        const item = d.data();
        if (item.nomeCognome) {
          staff.push({
            id: d.id,
            nomeCognome: item.nomeCognome,
            qualificaTecnica: item.qualificaTecnica || '',
            palmares: item.palmares || '',
            fotoUrl: item.foto?.url || item.fotoUrl || '',
            storicoCarriera: item.storicoCarriera || []
          });
        }
      });
      setStaffList(staff);
    } catch (e) {
      console.error("Errore caricamento archivio storico squadre:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCoach = (coachName: string) => {
    if (!coachName || !coachName.trim()) return;
    const cleanName = coachName.trim().toLowerCase();

    // Trova riscontro in staffList
    const staffMatch = staffList.find(s => {
      const sName = s.nomeCognome.trim().toLowerCase();
      return sName === cleanName || sName.includes(cleanName) || cleanName.includes(sName);
    });

    // Trova tutte le squadre storiche collegate a questo allenatore
    const squadreAllenate = squadreStoriche.filter(sq => {
      const p = (sq.allenatori?.primo || '').trim().toLowerCase();
      const s = (sq.allenatori?.secondo || '').trim().toLowerCase();
      const d = (sq.allenatori?.dirigente || '').trim().toLowerCase();
      return (p && (p === cleanName || p.includes(cleanName) || cleanName.includes(p))) ||
             (s && (s === cleanName || s.includes(cleanName) || cleanName.includes(s))) ||
             (d && (d === cleanName || d.includes(cleanName) || cleanName.includes(d)));
    });

    setSelectedCoachModal({
      nome: coachName,
      coach: staffMatch,
      squadreAllenate
    });
  };

  // Estrai tutte le stagioni uniche ordinate decrescenti
  const stagioniDisponibili = useMemo(() => {
    const set = new Set<string>();
    squadreStoriche.forEach(s => {
      if (s.stagione) set.add(s.stagione.trim());
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [squadreStoriche]);

  // Squadre filtrate
  const squadreFiltrate = useMemo(() => {
    return squadreStoriche.filter(s => {
      // Filtro stagione
      if (stagioneSelezionata !== 'TUTTE' && s.stagione !== stagioneSelezionata) {
        return false;
      }
      // Filtro categoria
      if (categoriaSelezionata !== 'TUTTE' && s.categoria !== categoriaSelezionata) {
        return false;
      }
      // Filtro ricerca
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nomeMatch = (s.nome_squadra || '').toLowerCase().includes(q);
        const traguardoMatch = (s.traguardo || '').toLowerCase().includes(q);
        const coachMatch = (s.allenatori?.primo || '').toLowerCase().includes(q);
        const rosterMatch = (s.roster || []).some(r => r.nome.toLowerCase().includes(q));
        if (!nomeMatch && !traguardoMatch && !coachMatch && !rosterMatch) {
          return false;
        }
      }
      return true;
    });
  }, [squadreStoriche, stagioneSelezionata, categoriaSelezionata, searchQuery]);

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white selection:bg-amber-400 selection:text-black select-none relative overflow-hidden flex flex-col justify-between">
      
      {/* Texture di fondo con griglia d'epoca architettonica */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.15) 1px, transparent 1px)`,
          backgroundSize: '28px 28px'
        }}
      />

      {/* Fasci di luce d'onore superiore (Atmospheric Spotlights) */}
      <div 
        className="absolute top-0 left-1/4 w-[600px] h-[450px] pointer-events-none opacity-40 blur-3xl"
        style={{
          background: `radial-gradient(circle, rgba(245, 158, 11, 0.18) 0%, rgba(217, 119, 6, 0.05) 50%, transparent 80%)`
        }}
      />
      <div 
        className="absolute top-0 right-1/4 w-[500px] h-[450px] pointer-events-none opacity-30 blur-3xl"
        style={{
          background: `radial-gradient(circle, rgba(234, 179, 8, 0.15) 0%, transparent 70%)`
        }}
      />

      {/* HEADER DELLA GALLERIA STORICA */}
      <header className="relative z-30 pt-10 pb-6 px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Navigazione rapida indietro alle squadre in corso */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/squadre')}
            className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
            <span>TORNA ALLE SQUADRE IN CORSO</span>
          </button>

          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest hidden sm:inline">
            ARCHIVIO UFFICIALE SOCIETARIO • NVA FORLÌ
          </span>
        </div>

        {/* Titolo e Badge della Sezione */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/10 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-mono font-bold tracking-widest uppercase mb-2.5">
              <History className="w-3.5 h-3.5" />
              <span>ALMANACCO &amp; MEMORIA STORICA • LE ANNATE</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black font-barlow uppercase tracking-tight text-white drop-shadow-md">
              ARCHIVIO STORICO <span className="text-amber-400">&amp; FORMAZIONI D'EPOCA</span>
            </h1>
            
            <p className="text-zinc-400 text-xs sm:text-sm font-inter max-w-2xl mt-1.5 leading-relaxed">
              Il grande registro storico della New Volley Academy: le foto ufficiali di squadra, le rose e i traguardi sportivi che hanno segnato ogni annata delle nostre Pantere.
            </p>
          </div>

          {/* Contatore Formazioni */}
          <div className="bg-zinc-900/80 border border-zinc-800 px-4 py-2.5 rounded-2xl flex items-center gap-3 shrink-0 shadow-lg">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Formazioni Archiviate</p>
              <p className="text-sm font-mono font-bold text-white">
                <strong>{squadreFiltrate.length}</strong> {squadreFiltrate.length === 1 ? 'Squadra Storica' : 'Squadre Storiche'}
              </p>
            </div>
          </div>
        </div>

        {/* BARRA DEI FILTRI & TIMELINE DELLE STAGIONI */}
        <div className="space-y-4">
          
          {/* Timeline Orizzontale delle Stagioni */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-bold shrink-0 mr-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Stagione:</span>
            </span>
            
            <button
              onClick={() => setStagioneSelezionata('TUTTE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition-all shrink-0 ${
                stagioneSelezionata === 'TUTTE'
                  ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                  : 'bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              Tutte le Annate
            </button>

            {stagioniDisponibili.map(stagione => (
              <button
                key={stagione}
                onClick={() => setStagioneSelezionata(stagione)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wider cursor-pointer transition-all shrink-0 ${
                  stagioneSelezionata === stagione
                    ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                    : 'bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                {stagione}
              </button>
            ))}
          </div>

          {/* Riga 2: Categorie e Ricerca Libera */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mr-1 hidden sm:inline">
                Categoria:
              </span>
              {[
                { id: 'TUTTE', label: 'Tutte' },
                { id: 'SERIE_D', label: 'Serie D' },
                { id: 'CAMPIONATI_SENIOR', label: 'Senior' },
                { id: 'GIOVANILI', label: 'Giovanili' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaSelezionata(cat.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition-all ${
                    categoriaSelezionata === cat.id
                      ? 'bg-zinc-800 text-amber-400 border border-amber-400/50 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Input Cerca */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Cerca atleta, squadra, coach..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/70 font-mono"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

        </div>

      </header>

      {/* CONTENUTO PRINCIPALE: LE FORMAZIONI STORICHE D'EPOCA */}
      <main className="relative z-20 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8">
        
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2].map(sk => (
              <div key={sk} className="h-[480px] rounded-3xl bg-zinc-900/60 border border-zinc-800 animate-pulse p-6" />
            ))}
          </div>
        ) : squadreFiltrate.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/40 rounded-3xl border border-zinc-800 p-8 max-w-lg mx-auto space-y-4">
            <History className="w-12 h-12 text-zinc-600 mx-auto" />
            <h3 className="text-xl font-bold font-barlow uppercase text-zinc-300">
              Nessuna formazione trovata
            </h3>
            <p className="text-xs text-zinc-500 font-inter max-w-sm mx-auto">
              Non ci sono squadre storiche corrispondenti ai filtri impostati. Prova a selezionare un'altra annata o categoria.
            </p>
            {(stagioneSelezionata !== 'TUTTE' || categoriaSelezionata !== 'TUTTE' || searchQuery) && (
              <button
                onClick={() => {
                  setStagioneSelezionata('TUTTE');
                  setCategoriaSelezionata('TUTTE');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-amber-400 text-black font-bold text-xs uppercase font-barlow rounded-xl cursor-pointer hover:bg-yellow-400 transition-colors shadow-md"
              >
                Azzera Filtri
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {squadreFiltrate.map((squadra) => (
              <CardSquadraStorica 
                key={squadra.id} 
                squadra={squadra} 
                squadreInCorso={squadreInCorso}
                giocatori={giocatori}
                staffList={staffList}
                onOpenLightbox={(idx) => setLightboxData({ squadra, index: idx ?? 0 })}
                onSelectPlayer={(gio, curTeam) => setSelectedPlayerModal({ giocatore: gio, teamAttuale: curTeam })}
                onSelectCoach={handleSelectCoach}
              />
            ))}
          </div>
        )}

      </main>

      {/* FOOTER ARCHIVIO */}
      <footer className="relative z-20 py-8 text-center text-xs text-zinc-500 font-mono border-t border-white/10 mt-12 bg-black/40">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-bold text-zinc-400">New Volley Academy Forlì • Archivio Storico Societario &amp; Memoria d'Oro</p>
          <p className="text-[11px] text-zinc-600">Documentazione ufficiale delle formazioni e degli organigrammi tecnici delle Pantere.</p>
        </div>
      </footer>

      {/* LIGHTBOX FOTO DI SQUADRA A TUTTO SCHERMO */}
      {lightboxData && (
        <ModalLightboxFotoSquadra 
          squadra={lightboxData.squadra} 
          initialIndex={lightboxData.index}
          onClose={() => setLightboxData(null)} 
        />
      )}

      {/* DRAWER SCHEDA ATLETA IN SOCIETÀ */}
      <AnimatePresence>
        {selectedPlayerModal && (
          <DrawerAtletaStorico 
            giocatore={selectedPlayerModal.giocatore}
            teamAttuale={selectedPlayerModal.teamAttuale}
            onClose={() => setSelectedPlayerModal(null)}
          />
        )}
      </AnimatePresence>

      {/* MODAL CRONOSTORIA ALLENATORE / STAFF TECNICO */}
      <AnimatePresence>
        {selectedCoachModal && (
          <ModalCronostoriaCoach 
            data={selectedCoachModal}
            onClose={() => setSelectedCoachModal(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

// ============================================================================
// COMPONENTE: CARD DELLA SQUADRA STORICA / D'EPOCA CON CAROSELLO FOTO
// ============================================================================
interface CardSquadraStoricaProps {
  key?: React.Key;
  squadra: SquadraStorica;
  squadreInCorso?: RosaSquadra[];
  giocatori?: Giocatore[];
  staffList?: Array<{
    id: string;
    nomeCognome: string;
    qualificaTecnica?: string;
    palmares?: string;
    fotoUrl?: string;
    storicoCarriera?: Array<{ anno: string; societa: string; ruolo: string; risultato?: string }>;
  }>;
  onOpenLightbox: (fotoIndex?: number) => void;
  onSelectPlayer: (giocatore: Giocatore, teamAttuale: RosaSquadra | null) => void;
  onSelectCoach?: (coachName: string) => void;
}

function findRegisteredPlayer(
  atleta: AtletaRosterStorico,
  giocatori?: Giocatore[],
  squadreInCorso?: RosaSquadra[]
): { giocatore: Giocatore | null; teamAttuale: RosaSquadra | null } {
  if (!giocatori || giocatori.length === 0) return { giocatore: null, teamAttuale: null };

  let found: Giocatore | undefined;
  if (atleta.giocatoreId) {
    found = giocatori.find(g => g.id === atleta.giocatoreId);
  }
  if (!found && atleta.nome) {
    const raw = atleta.nome.toLowerCase().trim().replace(/\s+/g, ' ');
    found = giocatori.find(g => {
      const fn = `${g.nome} ${g.cognome}`.toLowerCase().trim().replace(/\s+/g, ' ');
      const ln = `${g.cognome} ${g.nome}`.toLowerCase().trim().replace(/\s+/g, ' ');
      return fn === raw || ln === raw;
    });
  }

  if (!found) return { giocatore: null, teamAttuale: null };

  // Escludi squadre fittizie o di parcheggio temporaneo ("DA ASSEGNARE")
  const realSquads = (squadreInCorso || []).filter(sq => {
    const name = (sq.nome_squadra || '').toUpperCase().trim();
    const camp = (sq.campionato || '').toUpperCase().trim();
    return !name.includes('DA ASSEGNARE') && !camp.includes('DA ASSEGNARE') && name !== '';
  });

  // Trova le squadre reali in cui è presente l'ID dell'atleta
  const targetId = String(found.id).trim();
  const matchingTeams = realSquads.filter(sq => {
    const list = [...(sq.id_atleti || []), ...((sq as any).giocatori_ids || [])];
    return list.some(item => {
      const sid = typeof item === 'string' ? item : item?.id;
      return sid && String(sid).trim() === targetId;
    });
  });

  // Se è presente in più squadre, ordina per annata più recente (es. 2026/2027 > 2025/2026)
  let currentTeam: RosaSquadra | null = null;
  if (matchingTeams.length > 0) {
    matchingTeams.sort((a, b) => (b.stagione || '').localeCompare(a.stagione || ''));
    currentTeam = matchingTeams[0];
  }

  return { giocatore: found, teamAttuale: currentTeam };
}

function CardSquadraStorica({ 
  squadra, 
  squadreInCorso, 
  giocatori, 
  staffList,
  onOpenLightbox, 
  onSelectPlayer,
  onSelectCoach
}: CardSquadraStoricaProps) {
  const [tabAttivo, setTabAttivo] = useState<'roster' | 'cronistoria'>('roster');
  const [currentFotoIndex, setCurrentFotoIndex] = useState(0);

  // Lista dinamica di tutte le foto della stagione per il carosello
  const fotoList = useMemo(() => {
    const list: string[] = [];
    if (squadra.foto_ufficiale_url && squadra.foto_ufficiale_url.trim()) {
      list.push(squadra.foto_ufficiale_url.trim());
    }
    if (Array.isArray(squadra.gallery_foto)) {
      squadra.gallery_foto.forEach(url => {
        if (url && url.trim() && !list.includes(url.trim())) {
          list.push(url.trim());
        }
      });
    }
    if (list.length === 0) {
      list.push("https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200&auto=format&fit=crop&q=80");
    }
    return list;
  }, [squadra.foto_ufficiale_url, squadra.gallery_foto]);

  const nextFoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentFotoIndex(prev => (prev + 1) % fotoList.length);
  };

  const prevFoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentFotoIndex(prev => (prev - 1 + fotoList.length) % fotoList.length);
  };

  const capitano = useMemo(() => {
    return (squadra.roster || []).find(r => r.capitano);
  }, [squadra.roster]);

  const sortedRoster = useMemo(() => {
    return sortRosterStorico(squadra.roster || []);
  }, [squadra.roster]);

  return (
    <article className="relative bg-[#0f1118] border-2 border-zinc-800/90 hover:border-amber-400/60 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 group">
      
      {/* TESTATA METALLICA & TIMBRO ANNATA */}
      <div className="relative z-10 px-6 py-4 bg-gradient-to-r from-[#171923] via-[#12141c] to-[#0c0e14] border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
        
        {/* Titolo e Categoria */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                {squadra.categoria === 'SERIE_D' ? 'CAMPIONATO REGIONALE' : squadra.categoria === 'GIOVANILI' ? 'SETTORE GIOVANILE' : 'CAMPIONATO SENIOR'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-barlow uppercase text-white tracking-tight">
              {squadra.nome_squadra}
            </h2>
          </div>
        </div>

        {/* Sigillo / Timbro dell'Annata */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-black/70 border border-amber-400/40 text-amber-300 font-mono text-xs sm:text-sm font-bold tracking-wider shadow-inner flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>STAGIONE {squadra.stagione}</span>
          </div>
        </div>

      </div>

      {/* GRIGLIA PRINCIPALE: CAROSELLO FOTO A SINISTRA + ROSTER & DETTAGLI A DESTRA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        
        {/* COLONNA FOTO IN MODALITÀ CAROSELLO (7 COLONNE SU DESKTOP) */}
        <div className="lg:col-span-7 relative flex flex-col justify-between overflow-hidden bg-black min-h-[340px] sm:min-h-[420px] select-none">
          
          {/* Foto del Carosello con transizione */}
          <div className="relative w-full h-full min-h-[340px] sm:min-h-[420px] overflow-hidden">
            <img 
              key={currentFotoIndex}
              src={fotoList[currentFotoIndex]} 
              alt={`Foto ${squadra.nome_squadra} ${squadra.stagione} (${currentFotoIndex + 1})`}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105"
              style={{
                objectPosition: `50% ${squadra.fotoPositionY ?? 40}%`
              }}
              loading="lazy"
            />

            {/* Gradienti di profondità */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1118] via-transparent to-black/35 pointer-events-none" />

            {/* BADGE CONTATORE CAROSELLO IN ALTO A SINISTRA */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-amber-300 text-[10.5px] font-mono font-bold uppercase tracking-wider shadow-md">
                <Images className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentFotoIndex + 1} / {fotoList.length}</span>
              </span>
            </div>

            {/* PULSANTE INGRANDIMENTO CINEMA HD IN ALTO A DESTRA */}
            <button
              onClick={() => onOpenLightbox(currentFotoIndex)}
              className="absolute top-4 right-4 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-amber-400 text-zinc-300 hover:text-black border border-white/20 hover:border-amber-400 backdrop-blur-md text-[11px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg group/btn"
              title="Guarda questa foto a tutto schermo in alta risoluzione"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Ingrandisci HD</span>
            </button>

            {/* FRECCE DI NAVIGAZIONE DEL CAROSELLO (SE MULTIPLE FOTO) */}
            {fotoList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevFoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/60 hover:bg-amber-400 text-white hover:text-black border border-white/20 hover:border-amber-400 backdrop-blur-md transition-all cursor-pointer shadow-xl hover:scale-110 active:scale-95"
                  title="Foto precedente"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={nextFoto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/60 hover:bg-amber-400 text-white hover:text-black border border-white/20 hover:border-amber-400 backdrop-blur-md transition-all cursor-pointer shadow-xl hover:scale-110 active:scale-95"
                  title="Foto successiva"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* INDICATORI A PALLINI (DOTS) IN BASSO */}
                <div className="absolute bottom-16 inset-x-0 z-20 flex items-center justify-center gap-1.5 pointer-events-auto">
                  {fotoList.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentFotoIndex(dotIdx);
                      }}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        currentFotoIndex === dotIdx
                          ? 'w-7 bg-amber-400 shadow-[0_0_10px_#f59e0b]'
                          : 'w-2 bg-white/50 hover:bg-white'
                      }`}
                      title={`Vai alla foto ${dotIdx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Traguardo / Palmarès dell'Annata (in basso sulla foto) */}
          {squadra.traguardo && (
            <div className="relative z-10 p-5 bg-gradient-to-t from-[#0f1118] via-[#0f1118]/90 to-transparent">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/50 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider shadow-md backdrop-blur-md">
                <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{squadra.traguardo}</span>
              </div>
            </div>
          )}

        </div>

        {/* COLONNA DETTAGLI: STAFF & ROSTER DEI PROTAGONISTI (5 COLONNE SU DESKTOP) */}
        <div className="lg:col-span-5 p-6 flex flex-col justify-between space-y-6 bg-gradient-to-b from-[#0f1118] to-[#0a0b10] border-t lg:border-t-0 lg:border-l border-white/10">
          
          <div className="space-y-5">
            
            {/* Staff Tecnico dell'Epoca */}
            <div className="space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Staff Tecnico dell'Annata</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {squadra.allenatori?.primo && (
                  <CoachPill
                    titolo="1° Allenatore"
                    nome={squadra.allenatori.primo}
                    staffList={staffList}
                    onSelectCoach={onSelectCoach}
                  />
                )}
                {squadra.allenatori?.secondo && (
                  <CoachPill
                    titolo="2° Allenatore"
                    nome={squadra.allenatori.secondo}
                    staffList={staffList}
                    onSelectCoach={onSelectCoach}
                  />
                )}
                {squadra.allenatori?.dirigente && (
                  <CoachPill
                    titolo="Dirigente Accompagnatore"
                    nome={squadra.allenatori.dirigente}
                    staffList={staffList}
                    onSelectCoach={onSelectCoach}
                    colSpan2
                  />
                )}
              </div>
            </div>

            {/* Selettore Sub-Tab: Formazione vs Cronistoria */}
            <div className="flex border-b border-zinc-800">
              <button
                onClick={() => setTabAttivo('roster')}
                className={`pb-2 px-3 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition-colors border-b-2 ${
                  tabAttivo === 'roster'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Formazione ({squadra.roster?.length || 0})
              </button>
              {squadra.note_storiche && (
                <button
                  onClick={() => setTabAttivo('cronistoria')}
                  className={`pb-2 px-3 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition-colors border-b-2 ${
                    tabAttivo === 'cronistoria'
                      ? 'border-amber-400 text-amber-400'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  La Cronistoria
                </button>
              )}
            </div>

            {/* TAB 1: ROSTER ATLETI */}
            {tabAttivo === 'roster' && (
              <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1 no-scrollbar">
                {sortedRoster.map((atleta, idx) => {
                  const match = findRegisteredPlayer(atleta, giocatori, squadreInCorso);
                  const isRegistered = !!match.giocatore;

                  return (
                    <div 
                      key={idx}
                      onClick={() => {
                        if (match.giocatore) {
                          onSelectPlayer(match.giocatore, match.teamAttuale);
                        }
                      }}
                      className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                        isRegistered
                          ? 'bg-zinc-900/90 border border-amber-400/40 hover:border-amber-400 hover:bg-amber-400/10 cursor-pointer shadow-sm group/row'
                          : 'bg-zinc-900/60 border border-zinc-850'
                      }`}
                      title={isRegistered ? "Clicca per visualizzare la scheda personale atleta" : undefined}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Numero Maglia */}
                        <span className="w-6 h-6 rounded-lg bg-black border border-zinc-700 flex items-center justify-center text-xs font-mono font-bold text-amber-400 shrink-0">
                          {atleta.numero ?? '-'}
                        </span>
                        {/* Nome & Ruolo */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-xs font-barlow font-bold uppercase truncate ${
                              isRegistered ? 'text-white group-hover/row:text-amber-300' : 'text-zinc-200'
                            }`}>
                              {atleta.nome}
                            </span>
                            {atleta.capitano && (
                              <span className="text-[10px] font-mono text-amber-400 font-black shrink-0" title="Capitano della squadra">
                                (C)
                              </span>
                            )}
                          </div>
                          {atleta.ruolo && (
                            <span className="text-[10px] font-mono text-zinc-400 block truncate">
                              {atleta.ruolo}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Badge di Stato / Società a Destra */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {isRegistered ? (
                          match.teamAttuale ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-mono font-bold group-hover/row:bg-amber-400 group-hover/row:text-black transition-colors">
                              <span className="hidden sm:inline">Attuale:</span>
                              <span className="max-w-[100px] truncate">{match.teamAttuale.nome_squadra}</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                              <span>In Società</span>
                              <ChevronRight className="w-2.5 h-2.5 shrink-0" />
                            </span>
                          )
                        ) : atleta.capitano ? (
                          <span className="p-1 rounded-md bg-amber-400/10 text-amber-400" title="Capitano Ufficiale">
                            <Crown className="w-3.5 h-3.5" />
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: CRONISTORIA / ANEDDOTO */}
            {tabAttivo === 'cronistoria' && squadra.note_storiche && (
              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold block">
                  Memorie dell'Annata
                </span>
                <p className="text-xs font-inter text-zinc-300 leading-relaxed italic border-l-2 border-amber-400/60 pl-3">
                  "{squadra.note_storiche}"
                </p>
              </div>
            )}

          </div>

          {/* Footer Card */}
          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>Matricola FIPAV Forlì</span>
            <span className="text-amber-400 font-bold">New Volley Academy</span>
          </div>

        </div>

      </div>

    </article>
  );
}

// ============================================================================
// COMPONENTE: MODALE LIGHTBOX FOTO DI SQUADRA CON CAROSELLO A TUTTO SCHERMO
// ============================================================================
interface ModalLightboxFotoSquadraProps {
  squadra: SquadraStorica;
  initialIndex?: number;
  onClose: () => void;
}

function ModalLightboxFotoSquadra({ squadra, initialIndex = 0, onClose }: ModalLightboxFotoSquadraProps) {
  const fotoList = useMemo(() => {
    const list: string[] = [];
    if (squadra.foto_ufficiale_url && squadra.foto_ufficiale_url.trim()) {
      list.push(squadra.foto_ufficiale_url.trim());
    }
    if (Array.isArray(squadra.gallery_foto)) {
      squadra.gallery_foto.forEach(url => {
        if (url && url.trim() && !list.includes(url.trim())) {
          list.push(url.trim());
        }
      });
    }
    if (list.length === 0) {
      list.push("https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200&auto=format&fit=crop&q=80");
    }
    return list;
  }, [squadra.foto_ufficiale_url, squadra.gallery_foto]);

  const [currentIndex, setCurrentIndex] = useState(
    initialIndex >= 0 && initialIndex < fotoList.length ? initialIndex : 0
  );

  const nextFoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % fotoList.length);
  };

  const prevFoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + fotoList.length) % fotoList.length);
  };

  // Navigazione tastiera (frecce e escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setCurrentIndex(prev => (prev + 1) % fotoList.length);
      if (e.key === 'ArrowLeft') setCurrentIndex(prev => (prev - 1 + fotoList.length) % fotoList.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, fotoList.length]);

  const sortedRoster = useMemo(() => {
    return sortRosterStorico(squadra.roster || []);
  }, [squadra.roster]);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-8 animate-fadeIn select-none overscroll-contain safe-bottom"
      onClick={onClose}
    >
      {/* Header Modal Lightbox */}
      <div 
        className="flex items-center justify-between max-w-7xl mx-auto w-full pb-4 border-b border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-400 text-black">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black font-barlow uppercase text-white tracking-tight">
              {squadra.nome_squadra} • Stagione {squadra.stagione}
            </h3>
            {squadra.traguardo && (
              <p className="text-xs font-mono text-amber-400">{squadra.traguardo}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {fotoList.length > 1 && (
            <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full">
              Foto {currentIndex + 1} di {fotoList.length}
            </span>
          )}
          <button 
            onClick={onClose}
            className="p-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white transition-colors cursor-pointer"
            title="Chiudi visualizzazione"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Immagine a Tutta Risoluzione al Centro con Frecce */}
      <div 
        className="relative flex-1 flex items-center justify-center max-w-7xl mx-auto w-full py-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {fotoList.length > 1 && (
          <button
            onClick={prevFoto}
            className="absolute left-2 sm:left-4 z-30 p-3 rounded-full bg-black/70 hover:bg-amber-400 text-white hover:text-black border border-white/20 transition-all cursor-pointer shadow-2xl hover:scale-110"
            title="Foto precedente"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <img 
          key={currentIndex}
          src={fotoList[currentIndex]} 
          alt={`Foto ${squadra.nome_squadra} (${currentIndex + 1})`}
          className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl border-2 border-amber-400/40 transition-all duration-300"
        />

        {fotoList.length > 1 && (
          <button
            onClick={nextFoto}
            className="absolute right-2 sm:right-4 z-30 p-3 rounded-full bg-black/70 hover:bg-amber-400 text-white hover:text-black border border-white/20 transition-all cursor-pointer shadow-2xl hover:scale-110"
            title="Foto successiva"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Didascalia e Roster in Basso */}
      <div 
        className="max-w-7xl mx-auto w-full pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-zinc-400"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-zinc-500 uppercase font-bold">Atleti in foto:</span>
          {sortedRoster.map((a, i) => (
            <span key={i} className="text-zinc-300">
              #{a.numero ?? '-'} {a.nome}{a.capitano ? ' (C)' : ''}{i < sortedRoster.length - 1 ? ' • ' : ''}
            </span>
          ))}
        </div>

        <button
          onClick={onClose}
          className="px-4 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white cursor-pointer"
        >
          Chiudi Schermata
        </button>
      </div>

    </div>
  );
}

// ============================================================================
// COMPONENTE: DRAWER SCHEDA PERSONALE ATLETA IN SOCIETÀ
// ============================================================================
interface DrawerAtletaStoricoProps {
  giocatore: Giocatore;
  teamAttuale: RosaSquadra | null;
  onClose: () => void;
}

function DrawerAtletaStorico({ giocatore, teamAttuale, onClose }: DrawerAtletaStoricoProps) {
  const navigate = useNavigate();
  const [storico, setStorico] = useState<RecordStoricoCarriera[]>([]);
  const [loadingStorico, setLoadingStorico] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadingStorico(true);
    getStoricoGiocatore(giocatore.id)
      .then(res => {
        if (active) {
          setStorico(res);
          setLoadingStorico(false);
        }
      })
      .catch(err => {
        console.error("Errore fetch carriera atleta:", err);
        if (active) setLoadingStorico(false);
      });

    return () => {
      active = false;
    };
  }, [giocatore.id]);

  // Lock scroll del body quando il drawer è aperto
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const photoUrl = giocatore.foto?.url ?? giocatore.foto_url;
  const posX = giocatore.fotoPositionX ?? giocatore.foto?.positionX ?? 50;
  const posY = giocatore.fotoPositionY ?? giocatore.foto?.positionY ?? 50;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end overflow-hidden select-none">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
      />

      {/* Slide-over Content Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-lg h-full bg-[#11131c] text-white shadow-2xl flex flex-col z-10 border-l border-zinc-800"
      >
        {/* Header Drawer */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 flex justify-between items-center bg-[#0d0f17] shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-amber-400 text-black font-barlow font-black text-2xl tracking-wider px-3.5 py-1 rounded-xl shadow-md">
              #{giocatore.numero_maglia}
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-amber-400 block uppercase tracking-widest">
                SCHEDA PERSONALE ATLETA
              </span>
              <h3 className="text-xl font-barlow font-black tracking-wide text-white uppercase">
                {giocatore.nome} {giocatore.cognome}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Chiudi scheda"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* BANNER SQUADRA ATTUALE CON LINK DIRETTO */}
          {teamAttuale ? (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-400/20 via-amber-400/10 to-transparent border-2 border-amber-400/50 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-amber-300 uppercase tracking-widest font-black flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>IN FORZA ATTUALMENTE</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold">
                  ATTIVA ORA
                </span>
              </div>
              <div>
                <h4 className="text-lg font-black font-barlow uppercase text-white">
                  {teamAttuale.nome_squadra}
                </h4>
                <p className="text-xs font-mono text-zinc-400">
                  {teamAttuale.campionato}
                </p>
              </div>
              <button
                onClick={() => {
                  navigate(`/squadre/${teamAttuale.id}?atleta=${giocatore.id}`);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-yellow-400 text-black font-barlow font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
              >
                <span>Vai alla Scheda Squadra Attuale</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono text-zinc-300">Tesserato in Società</span>
              </div>
              <span className="text-xs font-mono text-amber-400 font-bold">New Volley Academy</span>
            </div>
          )}

          {/* TOTEM FOTO ATLETA 3:4 CON SFONDO ATMOSFERICO */}
          <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#171923] via-[#0f1118] to-black border border-zinc-800 p-4 flex flex-col items-center justify-center shrink-0 shadow-lg">
            {photoUrl && (
              <div 
                className="absolute inset-0 bg-cover bg-center blur-2xl opacity-20 scale-125 pointer-events-none"
                style={{ backgroundImage: `url(${photoUrl})` }}
              />
            )}

            <div className="relative w-full max-w-[260px] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-400/50 bg-black flex items-center justify-center">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={`${giocatore.nome} ${giocatore.cognome}`}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: `${posX}% ${posY}%` }}
                />
              ) : (
                <div className="text-center text-zinc-600 select-none">
                  <User className="w-16 h-16 mx-auto text-zinc-700 animate-pulse mb-2" />
                  <span className="text-[10px] font-mono uppercase tracking-widest block text-zinc-500">NEW VOLLEY ACADEMY</span>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-amber-300 bg-black/60 px-2 py-0.5 rounded-md border border-white/10 backdrop-blur-sm">
                  #{giocatore.numero_maglia}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider ${
                  giocatore.attivo ? 'bg-emerald-500/80 text-white' : 'bg-rose-500/80 text-white'
                }`}>
                  {giocatore.attivo ? 'ATTIVO' : 'INATTIVO'}
                </span>
              </div>
            </div>
          </div>

          {/* DATI TECNICI & FISICI */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold border-b border-zinc-800 pb-2">
              DATI TECNICI &amp; FISICI
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-xl flex items-center gap-3">
                <div className="bg-amber-400/10 p-2 rounded-lg text-amber-400 shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 block uppercase">RUOLO</span>
                  <span className="text-sm font-semibold text-white">
                    {giocatore.ruolo ? formatRuoloGiocatore(giocatore.ruolo, (giocatore as any).genere || 'F') : '—'}
                  </span>
                </div>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-xl flex items-center gap-3">
                <div className="bg-amber-400/10 p-2 rounded-lg text-amber-400 shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 block uppercase">ALTEZZA</span>
                  <span className="text-sm font-semibold text-white">
                    {giocatore.altezza ? `${giocatore.altezza} cm` : '—'}
                  </span>
                </div>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-xl flex items-center gap-3">
                <div className="bg-amber-400/10 p-2 rounded-lg text-amber-400 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 block uppercase">ANNO NASCITA</span>
                  <span className="text-sm font-semibold text-white">
                    {giocatore.data_nascita ? giocatore.data_nascita.split('-')[0] : 'n/d'}
                  </span>
                </div>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-xl flex items-center gap-3">
                <div className="bg-amber-400/10 p-2 rounded-lg text-amber-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 block uppercase">STATO AGONISTICO</span>
                  <span className="text-sm font-semibold text-white">
                    {giocatore.attivo ? 'Idoneo / In Attività' : 'Non Disponibile / Infortunato'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* TIMELINE CARRIERA NELLA SOCIETÀ */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold border-b border-zinc-800 pb-2 flex items-center justify-between">
              <span>STORICO CARRIERA NVA</span>
              {loadingStorico && <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />}
            </h4>

            {storico.length > 0 || (giocatore.storico_manuale && giocatore.storico_manuale.length > 0) ? (
              <div className="space-y-2 border-l-2 border-amber-400/40 ml-2 pl-4 py-1">
                {storico.map((st, i) => (
                  <div key={`db-${i}`} className="relative group/timeline">
                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-[#11131c]" />
                    <p className="text-xs font-bold text-white uppercase">{st.nome_squadra}</p>
                    <p className="text-[11px] font-mono text-zinc-400">
                      Stagione {st.stagione} • {st.campionato}
                    </p>
                  </div>
                ))}
                {(giocatore.storico_manuale || []).map((sm: any, i: number) => (
                  <div key={`man-${i}`} className="relative group/timeline">
                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-500 border-2 border-[#11131c]" />
                    <p className="text-xs font-bold text-zinc-300 uppercase">{sm.squadra || sm.squadra_o_premio || 'Squadra'}</p>
                    <p className="text-[11px] font-mono text-zinc-500">
                      Stagione {sm.stagione} {sm.categoria || sm.ruolo ? `• ${sm.categoria || sm.ruolo}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 font-mono italic">
                {loadingStorico ? 'Caricamento storico...' : 'Prima annata registrata nella New Volley Academy.'}
              </p>
            )}
          </div>

        </div>

      </motion.div>
    </div>
  );
}

// ============================================================================
// COMPONENTE: BOTTONE INTERATTIVO PER LO STAFF TECNICO (COLLEGAMENTO CRONOSTORIA)
// ============================================================================
function CoachPill({
  titolo,
  nome,
  staffList,
  onSelectCoach,
  colSpan2
}: {
  titolo: string;
  nome: string;
  staffList?: Array<{
    id: string;
    nomeCognome: string;
    qualificaTecnica?: string;
    palmares?: string;
    fotoUrl?: string;
    storicoCarriera?: Array<{ anno: string; societa: string; ruolo: string; risultato?: string }>;
  }>;
  onSelectCoach?: (nome: string) => void;
  colSpan2?: boolean;
}) {
  const match = staffList?.find(s => {
    const sn = s.nomeCognome.trim().toLowerCase();
    const n = nome.trim().toLowerCase();
    return sn === n || sn.includes(n) || n.includes(sn);
  });

  return (
    <button
      type="button"
      onClick={() => onSelectCoach?.(nome)}
      className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer group/coach flex items-center justify-between gap-2 ${
        match 
          ? 'bg-zinc-900/90 border-amber-400/40 hover:border-amber-400 hover:bg-zinc-850 shadow-sm' 
          : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850'
      } ${colSpan2 ? 'sm:col-span-2' : ''}`}
      title={`Clicca per vedere la cronostoria di ${nome}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700/80 flex items-center justify-center shrink-0">
          {match?.fotoUrl ? (
            <img src={match.fotoUrl} alt={nome} className="w-full h-full object-cover" />
          ) : (
            <User className="w-4 h-4 text-zinc-500 group-hover/coach:text-amber-400 transition-colors" />
          )}
        </div>
        <div className="min-w-0">
          <span className="text-[10px] text-zinc-500 block uppercase font-mono">{titolo}</span>
          <strong className="text-white text-xs truncate block group-hover/coach:text-amber-300 transition-colors">
            {nome}
          </strong>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-1 text-[10px] font-mono text-zinc-500 group-hover/coach:text-amber-400 transition-colors">
        {match ? (
          <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/30 text-[9px] font-bold">
            Staff NVA ↗
          </span>
        ) : (
          <span className="text-[10px]">Cronostoria ↗</span>
        )}
      </div>
    </button>
  );
}

// ============================================================================
// COMPONENTE: MODAL CRONOSTORIA COACH / ALLENATORE
// ============================================================================
function ModalCronostoriaCoach({
  data,
  onClose
}: {
  data: {
    nome: string;
    coach?: {
      id: string;
      nomeCognome: string;
      qualificaTecnica?: string;
      palmares?: string;
      fotoUrl?: string;
      storicoCarriera?: Array<{ anno: string; societa: string; ruolo: string; risultato?: string }>;
    };
    squadreAllenate: SquadraStorica[];
  };
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { nome, coach, squadreAllenate } = data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative z-10 w-full max-w-2xl bg-zinc-950 border border-amber-400/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]"
      >
        {/* Sticky Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 bg-zinc-900/80 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-zinc-900 border-2 border-amber-400/50 shadow-lg flex items-center justify-center shrink-0">
              {coach?.fotoUrl ? (
                <img src={coach.fotoUrl} alt={nome} className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-600" />
              )}
            </div>
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                <Briefcase className="w-3 h-3" />
                <span>Profilo Tecnico &amp; Cronostoria</span>
              </span>
              <h3 className="text-xl sm:text-2xl font-black font-barlow uppercase tracking-tight text-white">
                {coach?.nomeCognome || nome}
              </h3>
              {coach?.qualificaTecnica ? (
                <p className="text-xs font-mono text-zinc-300">
                  🎖️ {coach.qualificaTecnica}
                </p>
              ) : (
                <p className="text-xs font-mono text-zinc-500">
                  Tecnico / Staff New Volley Academy
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-700 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1">
          {/* Palmares se presente */}
          {coach?.palmares && coach.palmares.trim() !== '' && (
            <div className="bg-amber-400/5 border border-amber-400/20 p-4 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Palmarès &amp; Riconoscimenti</span>
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed font-inter whitespace-pre-line">
                {coach.palmares}
              </p>
            </div>
          )}

          {/* Squadre Storiche Allenate in NVA */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h4 className="text-xs font-bold font-mono uppercase tracking-widest text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Formazioni Storiche Allenate in NVA ({squadreAllenate.length})</span>
              </h4>
              <span className="text-[10px] font-mono text-zinc-500">Archivio Ufficiale</span>
            </div>

            {squadreAllenate.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {squadreAllenate.map((sq) => {
                  const isPrimo = (sq.allenatori?.primo || '').toLowerCase().includes(nome.toLowerCase());
                  const isSecondo = (sq.allenatori?.secondo || '').toLowerCase().includes(nome.toLowerCase());
                  const ruoloSvolto = isPrimo ? '1° Allenatore' : isSecondo ? '2° Allenatore' : 'Staff Tecnico';

                  return (
                    <div
                      key={sq.id}
                      className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/90 hover:border-amber-400/40 transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-md">
                          Stagione {sq.stagione}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400 font-semibold uppercase">
                          {ruoloSvolto}
                        </span>
                      </div>
                      <div>
                        <h5 className="text-sm font-bold font-barlow uppercase text-white truncate">
                          {sq.nome_squadra}
                        </h5>
                        <p className="text-xs font-mono text-zinc-400">
                          {sq.categoria}
                        </p>
                      </div>
                      {sq.traguardo && (
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-amber-300 bg-black/40 px-2 py-0.5 rounded border border-amber-400/20">
                          <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">{sq.traguardo}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 font-mono italic">
                Nessuna squadra associata a questo nominativo nell'archivio storico digitale.
              </p>
            )}
          </div>

          {/* Storico Carriera Completo (se censito nel profilo Staff) */}
          {coach?.storicoCarriera && coach.storicoCarriera.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold font-mono uppercase tracking-widest text-white flex items-center gap-2 border-b border-zinc-800 pb-2">
                <History className="w-4 h-4 text-amber-400" />
                <span>Cronostoria &amp; Carriera Completa</span>
              </h4>

              <div className="overflow-x-auto border border-zinc-800 rounded-2xl">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-900 text-zinc-400 font-mono text-[10px] uppercase border-b border-zinc-800">
                    <tr>
                      <th className="p-2.5">Anno</th>
                      <th className="p-2.5">Società</th>
                      <th className="p-2.5">Ruolo</th>
                      <th className="p-2.5">Risultato</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {coach.storicoCarriera.map((c, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/40">
                        <td className="p-2.5 font-mono font-bold text-white text-[11px]">{c.anno}</td>
                        <td className="p-2.5 font-semibold text-zinc-200">{c.societa}</td>
                        <td className="p-2.5 text-zinc-400">{c.ruolo}</td>
                        <td className="p-2.5 font-mono text-amber-400 font-bold text-[11px]">{c.risultato || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="p-4 bg-zinc-900/90 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          {coach ? (
            <button
              onClick={() => {
                onClose();
                navigate('/societa');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
            >
              <span>Vedi scheda completa nello Staff Societario</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="text-[11px] font-mono text-zinc-500">
              Profilo non ancora collegato all'organigramma attivo
            </span>
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-yellow-400 text-black font-barlow font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors shadow-md ml-auto"
          >
            Chiudi
          </button>
        </div>
      </motion.div>
    </div>
  );
}
