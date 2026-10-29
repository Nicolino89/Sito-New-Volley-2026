import React, { Component, useState } from 'react';
import { 
  Newspaper, 
  Users, 
  Trophy, 
  BookOpen, 
  Image as ImageIcon, 
  Calendar, 
  Star, 
  BarChart2, 
  LogOut,
  Shield,
  ShieldCheck,
  Database,
  Flame,
  Radio,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

import { 
  NewsBlog, 
  RosaSquadra, 
  Giocatore, 
  SocietaInfo, 
  SocietaConfig, 
  Sponsor, 
  AdminUser, 
  EventiTorneo,
  sortSquadreByImportance
} from '../firebase-societa';

// Modular Sub-Tabs
import TabNews from './admin/tabs/TabNews';
import TabSquadre from './admin/tabs/TabSquadre';
import TabGareFipav from './admin/tabs/TabGareFipav';
import TabDirettaStreaming from './admin/tabs/TabDirettaStreaming';
import TabPagine from './admin/tabs/TabPagine';
import TabGalleria from './admin/tabs/TabGalleria';
import TabCampTornei from './admin/tabs/TabCampTornei';
import TabVoltexCamp from './admin/tabs/TabVoltexCamp';
import TabCollaboratori from './admin/tabs/TabCollaboratori';
import TabStaff from './admin/tabs/TabStaff';
import TabSponsor from './admin/tabs/TabSponsor';
import TabStatistiche from './admin/tabs/TabStatistiche';
import TabHallOfFame from './admin/tabs/TabHallOfFame';
import TabBackup from './admin/tabs/TabBackup';

export type AdminTabType = 
  | 'news' 
  | 'squadre' 
  | 'gare_fipav' 
  | 'diretta_streaming' 
  | 'pagine' 
  | 'galleria' 
  | 'camp_tornei' 
  | 'voltex' 
  | 'hall_of_fame' 
  | 'collaboratori' 
  | 'staff' 
  | 'sponsor' 
  | 'statistiche' 
  | 'backup';

interface AdminTabErrorBoundaryProps {
  tabName: string;
  onResetTab?: () => void;
  children: React.ReactNode;
}

interface AdminTabErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AdminTabErrorBoundary extends Component<AdminTabErrorBoundaryProps, AdminTabErrorBoundaryState> {
  public props: AdminTabErrorBoundaryProps;
  public state: AdminTabErrorBoundaryState = {
    hasError: false,
    error: null
  };

  constructor(props: AdminTabErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[AdminPanel] Errore critico nel tab "${this.props.tabName}":`, error, errorInfo);
  }

  handleRetry = () => {
    (this as any).setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white border border-red-200 rounded-3xl p-8 text-center space-y-4 shadow-sm max-w-xl mx-auto my-8 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-500 flex items-center justify-center mx-auto shadow-inner">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold font-sport uppercase text-slate-900 tracking-wider">
              Errore di caricamento: {this.props.tabName}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Si è verificato un problema isolato in questa scheda. La dashboard e le altre schede rimangono attive e accessibili.
            </p>
            {this.state.error?.message && (
              <p className="text-[11px] font-mono text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100 max-w-md mx-auto break-words mt-2">
                {this.state.error.message}
              </p>
            )}
          </div>
          <div className="flex items-center justify-center gap-3 pt-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Riprova Caricamento</span>
            </button>
            {this.props.onResetTab && (
              <button
                type="button"
                onClick={this.props.onResetTab}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Torna a Gestione Squadre
              </button>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export interface AdminPanelProps {
  newsAll: NewsBlog[];
  squadreAll: RosaSquadra[];
  setSquadreAll?: React.Dispatch<React.SetStateAction<RosaSquadra[]>>;
  giocatoriAll: Giocatore[];
  setGiocatoriAll?: React.Dispatch<React.SetStateAction<Giocatore[]>>;
  societaInfo: SocietaInfo | null;
  setSocietaInfo: React.Dispatch<React.SetStateAction<SocietaInfo | null>>;
  societaConfig: SocietaConfig | null;
  setSocietaConfig: React.Dispatch<React.SetStateAction<SocietaConfig | null>>;
  sponsorsAll: Sponsor[];
  eventiAll: EventiTorneo[];
  currentUser: AdminUser | null;
  onLogout: () => Promise<void>;
  caricaFileSuStorage: (file: File, pathDest: string) => Promise<string>;
  societaSettings?: { logoUrl?: string };
  setSocietaSettings?: React.Dispatch<React.SetStateAction<{ logoUrl?: string }>>;
  loadAllData?: () => Promise<void>;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

// Helpers exported for backward compatibility
export const displayCoachName = (coachField: any, fallback: string = 'Non Assegnato'): string => {
  if (!coachField) return fallback;
  if (typeof coachField === 'string') return coachField;
  return coachField.nome || fallback;
};

export const getCoachIdFromField = (coachField: any, staffProfili: any[]): string => {
  if (!coachField) return '';
  if (typeof coachField === 'string') {
    const match = staffProfili.find(p => p.nomeCognome?.toLowerCase() === coachField.toLowerCase());
    return match ? match.id : '';
  }
  return coachField.id || '';
};

export const getCoachPayloadFromProfileId = (profileId: string, staffProfili: any[]) => {
  if (!profileId) return null;
  const profile = staffProfili.find(p => p.id === profileId);
  if (!profile) return null;
  return {
    id: profile.id,
    nome: profile.nomeCognome,
    qualifica: profile.qualificaTecnica || '',
    fotoUrl: profile.foto?.url || profile.fotoUrl || ''
  };
};

export const AdminPanel: React.FC<AdminPanelProps> = ({
  newsAll,
  squadreAll,
  setSquadreAll,
  giocatoriAll,
  setGiocatoriAll,
  societaInfo,
  setSocietaInfo,
  societaConfig,
  setSocietaConfig,
  sponsorsAll,
  currentUser,
  onLogout,
  caricaFileSuStorage,
  societaSettings = {},
  setSocietaSettings = () => {},
  loadAllData = async () => {},
  showToast = (msg: string) => console.log(msg)
}) => {
  const defaultTab: AdminTabType = currentUser?.ruolo === 'Super Admin' ? 'news' : 'squadre';
  const [adminTab, setAdminTabState] = useState<AdminTabType>(() => {
    try {
      const saved = localStorage.getItem('nva_admin_active_tab') as AdminTabType;
      const valid: AdminTabType[] = ['news', 'squadre', 'gare_fipav', 'diretta_streaming', 'pagine', 'galleria', 'camp_tornei', 'voltex', 'hall_of_fame', 'collaboratori', 'staff', 'sponsor', 'statistiche', 'backup'];
      if (saved && valid.includes(saved)) {
        if (currentUser?.ruolo !== 'Super Admin' && ['news', 'pagine', 'galleria', 'camp_tornei', 'voltex', 'hall_of_fame', 'collaboratori', 'staff', 'sponsor', 'statistiche', 'backup'].includes(saved)) {
          return 'squadre';
        }
        return saved;
      }
    } catch {}
    return defaultTab;
  });

  // Squadre ordinate rigorosamente per importanza / categoria / età:
  // 1) Serie D (F, M)
  // 2) 1^ Divisione
  // 3) 2^ Divisione
  // 4) 3^ Divisione
  // 5) Altre Senior
  // 6) Giovanili decrescenti per età (Under 19 -> Under 12)
  // 7) Minivolley / S3
  const sortedSquadreAll = React.useMemo(() => {
    return sortSquadreByImportance(squadreAll || []);
  }, [squadreAll]);

  const setAdminTab = (tab: AdminTabType) => {
    setAdminTabState(tab);
    try {
      localStorage.setItem('nva_admin_active_tab', tab);
    } catch {}
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-full overflow-x-hidden bg-[#F8FAFC] p-4 md:p-6 rounded-3xl border border-slate-200 shadow-sm text-slate-900 font-sans" id="cms-dashboard">
      
      {/* Left Column: Vertical Sidebar Menu */}
      <div className="w-full lg:w-72 bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm shrink-0 h-fit">
        <div className="border-b border-slate-100 pb-3">
          <span className="text-[10px] uppercase font-bold text-amber-500 font-mono tracking-widest block">Dashboard CMS</span>
          <p className="text-[11px] text-slate-500 font-medium">Gestione moduli portale NVA</p>
        </div>

        <div className="flex flex-col gap-1.5">
          {currentUser?.ruolo === 'Super Admin' && (
            <button
              onClick={() => setAdminTab('news')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all font-sport italic skew-x-[-6deg] flex items-center gap-3 cursor-pointer ${
                adminTab === 'news'
                  ? 'bg-amber-400 text-slate-950 shadow font-black'
                  : 'bg-slate-50 text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Newspaper className="w-4 h-4 shrink-0" />
              <span className="not-italic text-sm">SEZIONE NEWS</span>
            </button>
          )}

          <button
            onClick={() => setAdminTab('squadre')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all font-sport italic skew-x-[-6deg] flex items-center gap-3 cursor-pointer ${
              adminTab === 'squadre'
                ? 'bg-amber-400 text-slate-950 shadow font-black'
                : 'bg-slate-50 text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="not-italic text-sm">SQUADRE & ATLETI</span>
          </button>

          <button
            onClick={() => setAdminTab('gare_fipav')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all font-sport italic skew-x-[-6deg] flex items-center gap-3 cursor-pointer ${
              adminTab === 'gare_fipav'
                ? 'bg-amber-400 text-slate-950 shadow font-black'
                : 'bg-slate-50 text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4 shrink-0 text-amber-600" />
            <span className="not-italic text-sm">GARE & FIPAV SYNC</span>
          </button>

          <button
            onClick={() => setAdminTab('diretta_streaming')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all font-sport italic skew-x-[-6deg] flex items-center justify-between cursor-pointer ${
              adminTab === 'diretta_streaming'
                ? 'bg-red-600 text-white shadow-md font-black ring-2 ring-red-400/30'
                : 'bg-slate-50 text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Radio className={`w-4 h-4 shrink-0 ${adminTab === 'diretta_streaming' ? 'text-white' : 'text-red-500 animate-pulse'}`} />
              <span className="not-italic text-sm">DIRETTA STREAMING</span>
            </div>
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
              adminTab === 'diretta_streaming' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'
            }`}>
              LIVE
            </span>
          </button>

          {currentUser?.ruolo === 'Super Admin' && (
            <>
              <button
                onClick={() => setAdminTab('pagine')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all font-sport italic skew-x-[-6deg] flex items-center gap-3 cursor-pointer ${
                  adminTab === 'pagine'
                    ? 'bg-amber-400 text-slate-950 shadow font-black'
                    : 'bg-slate-50 text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <span className="not-italic text-sm">SOCIETÀ & PAGINE</span>
              </button>

              <button
                onClick={() => setAdminTab('galleria')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all font-sport italic skew-x-[-6deg] flex items-center gap-3 cursor-pointer ${
                  adminTab === 'galleria'
                    ? 'bg-amber-400 text-slate-950 shadow font-black'
                    : 'bg-slate-50 text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <ImageIcon className="w-4 h-4 shrink-0" />
                <span className="not-italic text-sm">GALLERIA FOTO</span>
              </button>

              <button
                onClick={() => setAdminTab('camp_tornei')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all font-sport italic skew-x-[-6deg] flex items-center gap-3 cursor-pointer ${
                  adminTab === 'camp_tornei'
                    ? 'bg-amber-400 text-slate-950 shadow font-black'
                    : 'bg-slate-50 text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                <span className="not-italic text-sm">CAMP & TORNEI</span>
              </button>

              <button
                onClick={() => setAdminTab('voltex')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all font-sport italic skew-x-[-6deg] flex items-center gap-3 cursor-pointer ${
                  adminTab === 'voltex'
                    ? 'bg-gradient-to-r from-red-600 to-[#C0392B] text-white shadow font-black ring-1 ring-red-400'
                    : 'bg-red-50/50 text-red-950 hover:text-red-600 hover:bg-red-100/60 border border-red-200/60'
                }`}
              >
                <Flame className="w-4 h-4 shrink-0 text-red-600" />
                <span className="not-italic text-sm">CAMP VOLTEX</span>
              </button>

              <button
                onClick={() => setAdminTab('hall_of_fame')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all font-sport italic skew-x-[-6deg] flex items-center gap-3 cursor-pointer ${
                  adminTab === 'hall_of_fame'
                    ? 'bg-amber-400 text-slate-950 shadow font-black'
                    : 'bg-slate-50 text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Trophy className="w-4 h-4 shrink-0" />
                <span className="not-italic text-sm">ALBO D'ORO (HALL OF FAME)</span>
              </button>

              <button
                onClick={() => setAdminTab('collaboratori')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all font-sport italic skew-x-[-6deg] flex items-center gap-3 cursor-pointer ${
                  adminTab === 'collaboratori'
                    ? 'bg-amber-400 text-slate-950 shadow font-black'
                    : 'bg-slate-50 text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="not-italic text-sm">ADMIN & PERMESSI</span>
              </button>

              <button
                onClick={() => setAdminTab('staff')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all font-sport italic skew-x-[-6deg] flex items-center gap-3 cursor-pointer ${
                  adminTab === 'staff'
                    ? 'bg-amber-400 text-slate-950 shadow font-black'
                    : 'bg-slate-50 text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span className="not-italic text-sm">ANAGRAFICA STAFF</span>
              </button>

              <button
                onClick={() => setAdminTab('sponsor')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all font-sport italic skew-x-[-6deg] flex items-center gap-3 cursor-pointer ${
                  adminTab === 'sponsor'
                    ? 'bg-amber-400 text-slate-950 shadow font-black'
                    : 'bg-slate-50 text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Star className="w-4 h-4 shrink-0" />
                <span className="not-italic text-sm">SPONSOR & PARTNER</span>
              </button>

              <button
                onClick={() => setAdminTab('statistiche')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all font-sport italic skew-x-[-6deg] flex items-center gap-3 cursor-pointer ${
                  adminTab === 'statistiche'
                    ? 'bg-amber-400 text-slate-950 shadow font-black'
                    : 'bg-slate-50 text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <BarChart2 className="w-4 h-4 shrink-0" />
                <span className="not-italic text-sm">STATISTICHE GA4</span>
              </button>

              <button
                onClick={() => setAdminTab('backup')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all font-sport italic skew-x-[-6deg] flex items-center gap-3 cursor-pointer ${
                  adminTab === 'backup'
                    ? 'bg-amber-400 text-slate-950 shadow font-black'
                    : 'bg-slate-50 text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Database className="w-4 h-4 shrink-0 text-amber-600" />
                <span className="not-italic text-sm">BACKUP & RIPRISTINO</span>
              </button>
            </>
          )}
        </div>

        {currentUser && (
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 mt-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-amber-100 text-amber-900 border border-amber-300 rounded-full flex items-center justify-center font-black text-xs uppercase shrink-0">
                {currentUser.email.substring(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[12px] text-slate-700 font-bold block font-mono truncate">{currentUser.email}</span>
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded font-mono">
                  {currentUser.ruolo}
                </span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold py-2 rounded-xl text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> ESCI (LOGOUT)
            </button>
          </div>
        )}
      </div>

      {/* Right Column: Active Admin Tab Content Area */}
      <div className="flex-1 min-w-0 space-y-6 overflow-x-hidden">
        {adminTab === 'news' && (
          <AdminTabErrorBoundary tabName="Sezione News" onResetTab={() => setAdminTab('squadre')}>
            <TabNews
              newsAll={newsAll}
              squadreAll={sortedSquadreAll}
              loadAllData={loadAllData}
              showToast={showToast}
              caricaFileSuStorage={caricaFileSuStorage}
            />
          </AdminTabErrorBoundary>
        )}

        {adminTab === 'squadre' && (
          <AdminTabErrorBoundary tabName="Squadre & Atleti">
            <TabSquadre
              squadreAll={sortedSquadreAll}
              setSquadreAll={setSquadreAll}
              giocatoriAll={giocatoriAll}
              setGiocatoriAll={setGiocatoriAll}
              sponsorsAll={sponsorsAll}
              currentUser={currentUser}
              loadAllData={loadAllData}
              showToast={showToast}
              caricaFileSuStorage={caricaFileSuStorage}
            />
          </AdminTabErrorBoundary>
        )}

        {adminTab === 'gare_fipav' && (
          <AdminTabErrorBoundary tabName="Gare & FIPAV Sync" onResetTab={() => setAdminTab('squadre')}>
            <TabGareFipav
              squadreAll={sortedSquadreAll}
              loadAllData={loadAllData}
              showToast={showToast}
            />
          </AdminTabErrorBoundary>
        )}

        {adminTab === 'diretta_streaming' && (
          <AdminTabErrorBoundary tabName="Diretta Streaming" onResetTab={() => setAdminTab('squadre')}>
            <TabDirettaStreaming
              squadreAll={sortedSquadreAll}
              showToast={showToast}
            />
          </AdminTabErrorBoundary>
        )}

        {adminTab === 'pagine' && (
          <AdminTabErrorBoundary tabName="Società & Pagine" onResetTab={() => setAdminTab('squadre')}>
            <TabPagine
              societaInfo={societaInfo}
              setSocietaInfo={setSocietaInfo}
              societaConfig={societaConfig}
              setSocietaConfig={setSocietaConfig}
              societaSettings={societaSettings}
              setSocietaSettings={setSocietaSettings}
              loadAllData={loadAllData}
              showToast={showToast}
              caricaFileSuStorage={caricaFileSuStorage}
            />
          </AdminTabErrorBoundary>
        )}

        {adminTab === 'galleria' && (
          <AdminTabErrorBoundary tabName="Galleria Foto" onResetTab={() => setAdminTab('squadre')}>
            <TabGalleria
              showToast={showToast}
              caricaFileSuStorage={caricaFileSuStorage}
            />
          </AdminTabErrorBoundary>
        )}

        {adminTab === 'camp_tornei' && (
          <AdminTabErrorBoundary tabName="Camp & Tornei" onResetTab={() => setAdminTab('squadre')}>
            <TabCampTornei
              showToast={showToast}
              caricaFileSuStorage={caricaFileSuStorage}
            />
          </AdminTabErrorBoundary>
        )}

        {adminTab === 'voltex' && (
          <AdminTabErrorBoundary tabName="Voltex Camp" onResetTab={() => setAdminTab('squadre')}>
            <TabVoltexCamp
              showToast={showToast}
            />
          </AdminTabErrorBoundary>
        )}

        {adminTab === 'hall_of_fame' && (
          <AdminTabErrorBoundary tabName="Hall of Fame" onResetTab={() => setAdminTab('squadre')}>
            <TabHallOfFame
              showToast={showToast}
              caricaFileSuStorage={caricaFileSuStorage}
              initialSquadre={sortedSquadreAll}
              initialGiocatori={giocatoriAll}
            />
          </AdminTabErrorBoundary>
        )}

        {adminTab === 'collaboratori' && (
          <AdminTabErrorBoundary tabName="Collaboratori" onResetTab={() => setAdminTab('squadre')}>
            <TabCollaboratori
              currentUser={currentUser}
              squadreAll={sortedSquadreAll}
              showToast={showToast}
            />
          </AdminTabErrorBoundary>
        )}

        {adminTab === 'staff' && (
          <AdminTabErrorBoundary tabName="Staff Tecnico & Dirigenti" onResetTab={() => setAdminTab('squadre')}>
            <TabStaff
              showToast={showToast}
              caricaFileSuStorage={caricaFileSuStorage}
            />
          </AdminTabErrorBoundary>
        )}

        {adminTab === 'sponsor' && (
          <AdminTabErrorBoundary tabName="Sponsor" onResetTab={() => setAdminTab('squadre')}>
            <TabSponsor
              showToast={showToast}
              caricaFileSuStorage={caricaFileSuStorage}
            />
          </AdminTabErrorBoundary>
        )}

        {adminTab === 'statistiche' && (
          <AdminTabErrorBoundary tabName="Statistiche" onResetTab={() => setAdminTab('squadre')}>
            <TabStatistiche
              newsAll={newsAll}
              squadreAll={sortedSquadreAll}
              giocatoriAll={giocatoriAll}
              sponsorsAll={sponsorsAll}
              showToast={showToast}
            />
          </AdminTabErrorBoundary>
        )}

        {adminTab === 'backup' && (
          <AdminTabErrorBoundary tabName="Backup Dati" onResetTab={() => setAdminTab('squadre')}>
            <TabBackup
              showToast={showToast}
              loadAllData={loadAllData}
            />
          </AdminTabErrorBoundary>
        )}
      </div>

    </div>
  );
};

export default AdminPanel;
