import React, { useState } from 'react';
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
  Database
} from 'lucide-react';

import { 
  NewsBlog, 
  RosaSquadra, 
  Giocatore, 
  SocietaInfo, 
  SocietaConfig, 
  Sponsor, 
  AdminUser, 
  EventiTorneo 
} from '../firebase-societa';

// Modular Sub-Tabs
import TabNews from './admin/tabs/TabNews';
import TabSquadre from './admin/tabs/TabSquadre';
import TabGareFipav from './admin/tabs/TabGareFipav';
import TabPagine from './admin/tabs/TabPagine';
import TabGalleria from './admin/tabs/TabGalleria';
import TabCampTornei from './admin/tabs/TabCampTornei';
import TabCollaboratori from './admin/tabs/TabCollaboratori';
import TabStaff from './admin/tabs/TabStaff';
import TabSponsor from './admin/tabs/TabSponsor';
import TabStatistiche from './admin/tabs/TabStatistiche';
import TabHallOfFame from './admin/tabs/TabHallOfFame';
import TabBackup from './admin/tabs/TabBackup';

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
  const defaultTab = currentUser?.ruolo === 'Super Admin' ? 'news' : 'squadre';
  const [adminTab, setAdminTabState] = useState<
    'news' | 'squadre' | 'gare_fipav' | 'pagine' | 'galleria' | 'camp_tornei' | 'hall_of_fame' | 'collaboratori' | 'staff' | 'sponsor' | 'statistiche' | 'backup'
  >(() => {
    try {
      const saved = localStorage.getItem('nva_admin_active_tab');
      const valid = ['news', 'squadre', 'gare_fipav', 'pagine', 'galleria', 'camp_tornei', 'hall_of_fame', 'collaboratori', 'staff', 'sponsor', 'statistiche', 'backup'];
      if (saved && valid.includes(saved)) {
        if (currentUser?.ruolo !== 'Super Admin' && ['news', 'pagine', 'galleria', 'camp_tornei', 'hall_of_fame', 'collaboratori', 'staff', 'sponsor', 'statistiche', 'backup'].includes(saved)) {
          return 'squadre';
        }
        return saved as any;
      }
    } catch {}
    return defaultTab;
  });

  const setAdminTab = (tab: 'news' | 'squadre' | 'gare_fipav' | 'pagine' | 'galleria' | 'camp_tornei' | 'hall_of_fame' | 'collaboratori' | 'staff' | 'sponsor' | 'statistiche' | 'backup') => {
    setAdminTabState(tab);
    try {
      localStorage.setItem('nva_admin_active_tab', tab);
    } catch {}
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-full bg-[#F8FAFC] p-4 md:p-6 rounded-3xl border border-slate-200 shadow-sm text-slate-900 font-sans" id="cms-dashboard">
      
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
                <span className="not-italic text-sm">PAGINE & PALESTRE</span>
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
      <div className="flex-1 min-w-0 space-y-6">
        {adminTab === 'news' && (
          <TabNews
            newsAll={newsAll}
            squadreAll={squadreAll}
            loadAllData={loadAllData}
            showToast={showToast}
            caricaFileSuStorage={caricaFileSuStorage}
          />
        )}

        {adminTab === 'squadre' && (
          <TabSquadre
            squadreAll={squadreAll}
            setSquadreAll={setSquadreAll}
            giocatoriAll={giocatoriAll}
            setGiocatoriAll={setGiocatoriAll}
            sponsorsAll={sponsorsAll}
            currentUser={currentUser}
            loadAllData={loadAllData}
            showToast={showToast}
            caricaFileSuStorage={caricaFileSuStorage}
          />
        )}

        {adminTab === 'gare_fipav' && (
          <TabGareFipav
            squadreAll={squadreAll}
            loadAllData={loadAllData}
            showToast={showToast}
          />
        )}

        {adminTab === 'pagine' && (
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
        )}

        {adminTab === 'galleria' && (
          <TabGalleria
            showToast={showToast}
            caricaFileSuStorage={caricaFileSuStorage}
          />
        )}

        {adminTab === 'camp_tornei' && (
          <TabCampTornei
            showToast={showToast}
            caricaFileSuStorage={caricaFileSuStorage}
          />
        )}

        {adminTab === 'hall_of_fame' && (
          <TabHallOfFame
            showToast={showToast}
            caricaFileSuStorage={caricaFileSuStorage}
            initialSquadre={squadreAll}
            initialGiocatori={giocatoriAll}
          />
        )}

        {adminTab === 'collaboratori' && (
          <TabCollaboratori
            currentUser={currentUser}
            squadreAll={squadreAll}
            showToast={showToast}
          />
        )}

        {adminTab === 'staff' && (
          <TabStaff
            showToast={showToast}
            caricaFileSuStorage={caricaFileSuStorage}
          />
        )}

        {adminTab === 'sponsor' && (
          <TabSponsor
            showToast={showToast}
            caricaFileSuStorage={caricaFileSuStorage}
          />
        )}

        {adminTab === 'statistiche' && (
          <TabStatistiche
            newsAll={newsAll}
            squadreAll={squadreAll}
            giocatoriAll={giocatoriAll}
            sponsorsAll={sponsorsAll}
            showToast={showToast}
          />
        )}

        {adminTab === 'backup' && (
          <TabBackup
            showToast={showToast}
            loadAllData={loadAllData}
          />
        )}
      </div>

    </div>
  );
};

export default AdminPanel;
