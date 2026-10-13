/**
 * New Volley Academy - Main Application Entrypoint
 * Ultra-Fast SPA Architecture with Instant Navigation and Zero Latency
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  Sparkles,
  Loader2,
  MapPin,
  Lock,
  RotateCcw
} from 'lucide-react';

import { Navbar, NavTabId } from './components/Navbar';
import { Footer } from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingFallback from './components/LoadingFallback';
import WhatsAppFloatingButton from './components/WhatsAppFloatingButton';
import VoltexCampPill from './components/VoltexCampPill';

// Public pages eagerly loaded for instant tab switching
import Home from './pages/Home';
import Squadre from './pages/Squadre';
import SquadraDetail from './pages/SquadraDetail';
import News from './pages/News';
import Societa from './pages/Societa';
import SponsorPage from './pages/Sponsor';
import NotFound from './pages/NotFound';
import Maintenance from './pages/Maintenance';

import {
  ascoltaStatoAutenticazione,
  logoutUtente,
  getSocietaInfo,
  getSocietaConfig,
  getSocietaSettings,
  updateSocietaSettings,
  getSquadreAll,
  getGiocatoriAll,
  getNewsAll,
  getSponsorAll,
  getEventiAll,
  caricaFileSuStorage,
  tracciaVisitaPagina,
  AdminUser,
  SocietaInfo,
  SocietaConfig,
  RosaSquadra,
  Giocatore,
  NewsBlog,
  Sponsor,
  EventiTorneo
} from './firebase-societa';

import SplashScreen from './components/SplashScreen';
import CookieBanner from './components/CookieBanner';

// Wrapper for lazy imports with auto-reload on chunk fetch failure
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const hasReloaded = sessionStorage.getItem('nva_chunk_reload');
    try {
      const module = await factory();
      sessionStorage.removeItem('nva_chunk_reload');
      return module;
    } catch (error: any) {
      const isChunkError =
        error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.message?.includes('Importing a module script failed') ||
        error?.name === 'ChunkLoadError';

      if (isChunkError && !hasReloaded) {
        sessionStorage.setItem('nva_chunk_reload', 'true');
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }

      sessionStorage.removeItem('nva_chunk_reload');
      throw error;
    }
  });
}

// Error Boundary specific to chunk/lazy Suspense failures
interface ChunkErrorBoundaryProps {
  children: React.ReactNode;
  key?: any;
}

interface ChunkErrorBoundaryState {
  hasError: boolean;
}

class ChunkErrorBoundary extends React.Component<ChunkErrorBoundaryProps, ChunkErrorBoundaryState> {
  public props: ChunkErrorBoundaryProps;
  public state: ChunkErrorBoundaryState = {
    hasError: false
  };

  constructor(props: ChunkErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Chunk loading error in Suspense:", error, errorInfo);
  }

  handleReload = () => {
    sessionStorage.removeItem('nva_chunk_reload');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <RotateCcw className="w-8 h-8 mx-auto" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold font-sport uppercase text-zinc-900">
              Aggiornamento disponibile o errore di caricamento
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Una nuova versione della sezione è pronta oppure la connessione è stata interrotta. Clicca sotto per ricaricare.
            </p>
          </div>
          <button
            onClick={this.handleReload}
            className="bg-[#FFE600] hover:bg-yellow-400 text-black font-bold py-2.5 px-6 rounded-xl text-xs uppercase font-sport tracking-wider flex items-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Ricarica</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy-loaded secondary pages & CMS tools with chunk retry
const AlboDOro = lazyWithRetry(() => import('./pages/AlboDOro'));
const SquadreArchivio = lazyWithRetry(() => import('./pages/SquadreArchivio'));
const CampTornei = lazyWithRetry(() => import('./pages/CampTornei'));
const EventoDetail = lazyWithRetry(() => import('./pages/EventoDetail'));
const Galleria = lazyWithRetry(() => import('./components/Galleria'));
const Privacy = lazyWithRetry(() => import('./pages/Privacy'));

const LoginForm = lazyWithRetry(() => import('./components/LoginForm'));
const AdminPanel = lazyWithRetry(() => import('./components/AdminPanel'));

// Local storage snapshot cache key for 0ms instant loading
const CACHE_KEY = 'nva_platform_cache_v2';

function getInitialCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (parsed.societaInfo?.contatti) {
          if (!parsed.societaInfo.contatti.telefono || parsed.societaInfo.contatti.telefono.includes('0543') || parsed.societaInfo.contatti.telefono.includes('789')) {
            parsed.societaInfo.contatti.telefono = '+39 351 321 0332';
          }
          if (!parsed.societaInfo.contatti.email || parsed.societaInfo.contatti.email.includes('forli.it')) {
            parsed.societaInfo.contatti.email = 'info@newvolleyacademy.it';
          }
        }
        if (parsed.societaConfig && Array.isArray(parsed.societaConfig.staffTecnico)) {
          const mockNames = ['roberto baggio', 'ettore gulinelli', 'giulia neri', 'marco de marchi'];
          const isMock = parsed.societaConfig.staffTecnico.length > 0 && parsed.societaConfig.staffTecnico.every((s: any) =>
            !s.profiloId && mockNames.includes((s.nome || '').toLowerCase().trim())
          );
          if (isMock) {
            parsed.societaConfig.staffTecnico = [];
          }
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Cache read error:', e);
  }
  return null;
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Authentication & CMS State
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    try {
      localStorage.removeItem('nva_admin_mode');
    } catch {}
    return window.location.pathname.startsWith('/admin');
  });
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [previewAsVisitor, setPreviewAsVisitor] = useState(false);

  // Sync isAdminMode with URL pathname
  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      setIsAdminMode(true);
    } else {
      setIsAdminMode(false);
    }
  }, [location.pathname]);

  const handleToggleAdmin = () => {
    if (isAdminMode || location.pathname.startsWith('/admin')) {
      setIsAdminMode(false);
      navigate('/');
      showToast("Sei ritornato all'area pubblica del portale delle Pantere.", "info");
    } else {
      setIsAdminMode(true);
      navigate('/admin');
      showToast("Sei entrato nell'Area Riservata (CMS Amministrazione).", "info");
    }
  };

  // Global Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Core Data initialized immediately from cache for 0ms latency
  const initialCache = React.useMemo(() => getInitialCache(), []);

  const [loading, setLoading] = useState(!initialCache);
  const [showSplash, setShowSplash] = useState(!initialCache);

  const [squadreAll, setSquadreAll] = useState<RosaSquadra[]>(initialCache?.squadreAll || []);
  const [giocatoriAll, setGiocatoriAll] = useState<Giocatore[]>(initialCache?.giocatoriAll || []);
  const [newsAll, setNewsAll] = useState<NewsBlog[]>(initialCache?.newsAll || []);
  const [sponsorsAll, setSponsorsAll] = useState<Sponsor[]>(initialCache?.sponsorsAll || []);
  const [eventiAll, setEventiAll] = useState<EventiTorneo[]>(initialCache?.eventiAll || []);
  const [societaInfo, setSocietaInfo] = useState<SocietaInfo | null>(initialCache?.societaInfo || null);
  const [societaConfig, setSocietaConfig] = useState<SocietaConfig | null>(initialCache?.societaConfig || null);
  const [societaSettings, setSocietaSettings] = useState<any>(initialCache?.societaSettings || { logoUrl: '', isMaintenanceMode: true });

  // Synchronous LocalStorage Cache Updater for 0ms optimistic UI & instant refresh persistence
  const updateLocalCache = (partial: Record<string, any>) => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      const current = raw ? JSON.parse(raw) : {};
      const updated = { ...current, ...partial };
      localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
    } catch (e) {
      // quota or private mode
    }
  };

  const setGiocatoriAllOptimistic: React.Dispatch<React.SetStateAction<Giocatore[]>> = (updater) => {
    setGiocatoriAll(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      updateLocalCache({ giocatoriAll: next });
      return next;
    });
  };

  const setSquadreAllOptimistic: React.Dispatch<React.SetStateAction<RosaSquadra[]>> = (updater) => {
    setSquadreAll(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      updateLocalCache({ squadreAll: next });
      return next;
    });
  };

  // Show toast notification helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Automatic Analytics Pageview Tracker
  useEffect(() => {
    tracciaVisitaPagina(location.pathname);
  }, [location.pathname]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = ascoltaStatoAutenticazione((user) => {
      setCurrentUser(user);
      setLoadingAuth(false);
      // NON forzare la modalità admin se si apre la home o il sito pubblico
      if (user && location.pathname.startsWith('/admin')) {
        setIsAdminMode(true);
      } else if (!user) {
        setIsAdminMode(false);
      }
    });
    return () => unsubscribe();
  }, [location.pathname]);

  // Fetch all platform data (silent update when editing so views stay mounted)
  const loadAllData = async (showFullLoading = false) => {
    try {
      if (showFullLoading && !initialCache) {
        setLoading(true);
      }
      const [squads, players, news, sponsors, events, info, config, settings] = await Promise.all([
        getSquadreAll().catch(() => []),
        getGiocatoriAll().catch(() => []),
        getNewsAll(true).catch(() => []),
        getSponsorAll().catch(() => []),
        getEventiAll().catch(() => []),
        getSocietaInfo().catch(() => null),
        getSocietaConfig().catch(() => null),
        getSocietaSettings().catch(() => ({ logoUrl: '', isMaintenanceMode: true }))
      ]);

      const safeSettings = settings && typeof settings === 'object' ? settings : { logoUrl: '', isMaintenanceMode: true };
      if (safeSettings.isMaintenanceMode === undefined) {
        safeSettings.isMaintenanceMode = true;
      }

      // Sanitize info e config contatti per garantire dati reali NVA
      if (info && info.contatti) {
        if (!info.contatti.telefono || info.contatti.telefono.includes('0543') || info.contatti.telefono.includes('789')) {
          info.contatti.telefono = '+39 351 321 0332';
        }
        if (!info.contatti.email || info.contatti.email.includes('forli.it')) {
          info.contatti.email = 'info@newvolleyacademy.it';
        }
      }
      if (config) {
        if (!config.telefono || config.telefono.includes('0543') || config.telefono.includes('789')) {
          config.telefono = '+39 351 321 0332';
        }
        if (!config.email || config.email.includes('forli.it')) {
          config.email = 'info@newvolleyacademy.it';
        }
        if (config.staffTecnico && Array.isArray(config.staffTecnico)) {
          const mockNames = ['roberto baggio', 'ettore gulinelli', 'giulia neri', 'marco de marchi'];
          const isMock = config.staffTecnico.length > 0 && config.staffTecnico.every((s: any) =>
            !s.profiloId && mockNames.includes((s.nome || '').toLowerCase().trim())
          );
          if (isMock) {
            config.staffTecnico = [];
          }
        }
      }

      setSquadreAll(squads);
      setGiocatoriAll(players);
      setNewsAll(news);
      setSponsorsAll(sponsors);
      setEventiAll(events);
      setSocietaInfo(info);
      setSocietaConfig(config);
      setSocietaSettings(safeSettings);

      // Save fresh snapshot to local storage cache for instant 0ms future loads
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          squadreAll: squads,
          giocatoriAll: players,
          newsAll: news,
          sponsorsAll: sponsors,
          eventiAll: events,
          societaInfo: info,
          societaConfig: config,
          societaSettings: settings || { logoUrl: '' }
        }));
      } catch (e) {
        // quota exceeded or private mode
      }
    } catch (err) {
      console.error("Errore nel caricamento dei dati della società:", err);
      showToast("Errore durante il caricamento dei dati.", "error");
    } finally {
      setLoading(false);
      setTimeout(() => setShowSplash(false), 200);
    }
  };

  useEffect(() => {
    loadAllData(false);
  }, []);

  // Determine active navigation tab based on URL path
  const getActiveTab = (): NavTabId => {
    const path = location.pathname;
    if (path.startsWith('/squadre')) return 'squadre';
    if (path.startsWith('/camp-tornei')) return 'camp-tornei';
    if (path.startsWith('/albo-d-oro') || path.startsWith('/hall-of-fame')) return 'albo-d-oro';
    if (path.startsWith('/societa')) return 'societa';
    if (path.startsWith('/news')) return 'news-archive';
    if (path.startsWith('/galleria') || path.startsWith('/modulistica')) return 'galleria';
    return 'home';
  };

  const currentTab = getActiveTab();

  const handleTabChange = (tab: NavTabId, subSection?: string) => {
    if (tab === 'home') navigate('/');
    else if (tab === 'squadre') {
      if (subSection === 'archivio') {
        navigate('/squadre/archivio');
      } else {
        navigate('/squadre');
      }
    }
    else if (tab === 'camp-tornei') navigate('/camp-tornei');
    else if (tab === 'albo-d-oro') {
      if (subSection) {
        navigate(`/albo-d-oro?sezione=${subSection}`);
      } else {
        navigate('/albo-d-oro');
      }
    }
    else if (tab === 'societa') navigate('/societa');
    else if (tab === 'news-archive') navigate('/news');
    else if (tab === 'galleria' || tab === 'modulistica') navigate('/galleria');
  };

  const handleSettingsTextChange = async (field: string, val: string) => {
    const updated = { ...societaSettings, [field]: val };
    setSocietaSettings(updated);
    try {
      await updateSocietaSettings(updated);
    } catch (err) {
      console.error("Errore salvataggio impostazioni:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUtente();
      setIsAdminMode(false);
      navigate('/');
      showToast("Logout effettuato con successo.", "info");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ErrorBoundary>
      {/* FULLSCREEN BRAND SPLASH SCREEN (Cold Start First Visit) */}
      <AnimatePresence>
        {showSplash && (
          <SplashScreen logoUrl={societaSettings?.logoUrl} />
        )}
      </AnimatePresence>

      {/* MAINTENANCE MODE CHECK:
          Visitors (not logged in) see the Panther Maintenance page if isMaintenanceMode is true.
          If admin is logged in, they can browse the full public site freely, and can toggle Preview or toggle Maintenance.
      */}
      {((!currentUser && !loadingAuth && societaSettings?.isMaintenanceMode === true && location.pathname !== '/login') || 
        (currentUser && previewAsVisitor)) ? (
        <div className="relative">
          {currentUser && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#FFE600] text-black px-4 py-2 rounded-full font-sport uppercase tracking-wider text-xs font-black shadow-2xl flex items-center gap-3 border border-black/20">
              <span className="w-2 h-2 rounded-full bg-black animate-ping" />
              <span>ANTEPRIMA VISITATORE (ATTIVA)</span>
              <button 
                onClick={() => setPreviewAsVisitor(false)}
                className="bg-black text-[#FFE600] px-3 py-1 rounded-full text-[11px] font-mono font-bold cursor-pointer hover:bg-zinc-850 transition-all ml-2"
              >
                CHIUDI ANTEPRIMA
              </button>
            </div>
          )}
          <Maintenance 
            onAdminLogin={() => {
              if (currentUser) {
                setPreviewAsVisitor(false);
              } else {
                navigate('/login');
              }
            }}
            logoUrl={societaSettings?.logoUrl}
            societaInfo={societaInfo}
          />
        </div>
      ) : (
        <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f4f4f0] text-zinc-900 font-sans antialiased selection:bg-brand-yellow selection:text-black flex flex-col justify-between" id="main-container">
          
          <div>
            {/* ADMIN TOOLBAR: Always visible when currentUser is logged in */}
            {currentUser && (
              <div className={`px-4 py-2 text-xs font-black font-sport uppercase tracking-wider flex flex-wrap items-center justify-between z-50 sticky top-0 shadow-lg border-b transition-colors ${
                societaSettings?.isMaintenanceMode === true
                  ? 'bg-[#FFE600] text-black border-black/15'
                  : 'bg-zinc-900 text-zinc-200 border-zinc-800'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${societaSettings?.isMaintenanceMode === true ? 'bg-black animate-ping' : 'bg-emerald-400'}`} />
                  <span>
                    {societaSettings?.isMaintenanceMode === true 
                      ? "MODALITÀ MANUTENZIONE ATTIVA — I visitatori vedono la pantera" 
                      : "SITO PUBBLICO ATTIVO — Visibile a tutti"}
                  </span>
                  <span className="hidden md:inline text-[10px] font-mono font-normal opacity-75 pl-2">
                    ({currentUser.email})
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1 sm:mt-0">
                  {/* Preview Button (if maintenance is on) */}
                  {societaSettings?.isMaintenanceMode === true && (
                    <button
                      onClick={() => setPreviewAsVisitor(true)}
                      className="bg-black/15 hover:bg-black/25 text-black px-2.5 py-1 rounded text-[10.5px] font-mono font-bold cursor-pointer transition-all"
                      title="Guarda la pagina come la vede un visitatore non loggato"
                    >
                      👁️ VEDI PANTERA
                    </button>
                  )}

                  {/* Toggle Admin CMS vs Public site view */}
                  <button
                    onClick={handleToggleAdmin}
                    className={`px-2.5 py-1 rounded text-[10.5px] font-mono font-bold cursor-pointer transition-all ${
                      societaSettings?.isMaintenanceMode === true
                        ? 'bg-black/10 hover:bg-black/20 text-black border border-black/20'
                        : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700'
                    }`}
                  >
                    {isAdminMode ? "🌐 VEDI SITO PUBBLICO" : "⚙️ PANNELLO CMS"}
                  </button>

                  {/* 1-Click Toggle Maintenance Mode */}
                  <button
                    onClick={async () => {
                      const nextState = societaSettings?.isMaintenanceMode !== true;
                      const updated = { ...societaSettings, isMaintenanceMode: nextState };
                      setSocietaSettings(updated);
                      await updateSocietaSettings(updated);
                      showToast(
                        nextState 
                          ? "Modalità manutenzione ATTIVATA! I visitatori vedono la pantera." 
                          : "Modalità manutenzione DISATTIVATA! Il sito è ora pubblico.", 
                        "success"
                      );
                    }}
                    className={`px-3 py-1 rounded text-[11px] font-mono font-bold cursor-pointer transition-all shadow ${
                      societaSettings?.isMaintenanceMode === true
                        ? 'bg-black hover:bg-zinc-900 text-[#FFE600]'
                        : 'bg-[#FFE600] hover:bg-yellow-400 text-black'
                    }`}
                  >
                    {societaSettings?.isMaintenanceMode === true ? "DISATTIVA MANUTENZIONE" : "ATTIVA MANUTENZIONE"}
                  </button>
                </div>
              </div>
            )}
          {/* Toast Notification */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${
                  toast.type === 'success' 
                    ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30' 
                    : toast.type === 'error'
                    ? 'bg-rose-950/90 text-rose-200 border-rose-500/30'
                    : 'bg-zinc-900/95 text-brand-yellow border-brand-yellow/30'
                }`}
                id="toast-notification"
              >
                {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
                {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
                {toast.type === 'info' && <Sparkles className="w-5 h-5 text-brand-yellow shrink-0" />}
                <span className="text-sm font-semibold">{toast.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SITE BRANDING HEADER (OPZIONE 2C: BLOCCO OBLIQUO GIALLO) */}
          <Navbar 
            logoUrl={societaSettings?.logoUrl}
            logoSize={societaSettings?.logoSizeDraft ?? societaSettings?.logoSize ?? 70}
            navbarTitle={societaSettings?.navbarTitleDraft ?? societaSettings?.navbarTitle ?? "NEW VOLLEY ACADEMY"}
            navbarTitleSize={societaSettings?.navbarTitleSizeDraft ?? societaSettings?.navbarTitleSize ?? 28}
            navbarSubtitle={societaSettings?.navbarSubtitleDraft ?? societaSettings?.navbarSubtitle ?? "FORLÌ • VOLLEY CLUB UFFICIALE"}
            showSubtitle={societaSettings?.showSubtitleDraft !== undefined ? societaSettings.showSubtitleDraft : (societaSettings?.showSubtitle !== false)}
            currentTab={currentTab}
            setCurrentTab={handleTabChange}
            isAdminMode={isAdminMode}
            onToggleAdmin={handleToggleAdmin}
            setSelectedPlayerHistory={() => {}}
            onSettingsTextChange={handleSettingsTextChange}
          />

          {/* INTEGRATED DARK TICKER STRIP WITH YELLOW ACCENTS */}
          {(() => {
            const defaultTicker = [
              "ISCRIZIONI CAMP APERTE: PROVE GRATUITE IL SABATO",
              "SERIE D MASCHILE: NVA PROMOSSA",
              "NVA BEACH CUP A CESENATICO",
              "CAMPIONATO FIPAV SERIE D 2026/2027"
            ];
            const activeTickerAnnouncements = societaSettings?.tickerAnnouncements ?? defaultTicker;
            const tickerString = activeTickerAnnouncements.length > 0 
              ? `★ ${activeTickerAnnouncements.join(' ★ ')} ★` 
              : "★ NEW VOLLEY ACADEMY ★";
            return (
              <div className="bg-[#111216] text-[#FFE600] py-2 overflow-hidden border-b border-zinc-800/80 relative z-20 select-none">
                <div className="whitespace-nowrap flex items-center">
                  <div className="animate-ticker font-sport font-black text-xs md:text-sm uppercase tracking-wider flex gap-8">
                    <span>{tickerString}</span>
                    <span>{tickerString}</span>
                    <span>{tickerString}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* VOLTEX CAMP PILL (Subito sotto alla riga delle scritte che scorrono a destra) */}
          <div className="relative w-full z-30 pointer-events-none select-none">
            <div className="absolute right-0 top-0 pointer-events-auto">
              <VoltexCampPill />
            </div>
          </div>

          {/* DYNAMIC CONTENT STAGE */}
          <main className={`w-full min-h-screen ${(location.pathname === '/' || location.pathname === '/squadre' || location.pathname.startsWith('/camp-tornei') || location.pathname.startsWith('/societa') || location.pathname.startsWith('/news') || location.pathname.startsWith('/galleria') || location.pathname.startsWith('/albo-d-oro') || location.pathname.startsWith('/hall-of-fame')) ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`} id="content-stage">
            {location.pathname === '/login' ? (
              <ChunkErrorBoundary key={location.pathname}>
                <Suspense fallback={<LoadingFallback />}>
                  <LoginForm />
                </Suspense>
              </ChunkErrorBoundary>
            ) : (!isAdminMode && !location.pathname.startsWith('/admin')) ? (
              /* SITO PUBBLICO (Rendering Immediato a 0ms di latenza) */
              <div className={(location.pathname.startsWith('/albo-d-oro') || location.pathname.startsWith('/hall-of-fame')) ? '' : 'space-y-10'}>
                <ChunkErrorBoundary key={location.pathname}>
                  <Suspense fallback={<LoadingFallback />}>
                    {(() => {
                      const path = location.pathname;
                      if (path === '/privacy') return <Privacy />;
                      if (path === '/sponsor') return <SponsorPage />;
                      if (path === '/') return (
                        <Home 
                          societaSettings={societaSettings} 
                          setSocietaSettings={setSocietaSettings} 
                          societaInfo={societaInfo}
                          newsAll={newsAll}
                          sponsorsAll={sponsorsAll}
                        />
                      );
                      if (path.startsWith('/squadre')) {
                        if (path === '/squadre/archivio' || path.startsWith('/squadre/archivio')) {
                          return <SquadreArchivio squadreInCorso={squadreAll} giocatori={giocatoriAll} />;
                        }
                        return path === '/squadre' || path === '/squadre/'
                          ? <Squadre squadre={squadreAll} />
                          : <SquadraDetail squadre={squadreAll} giocatori={giocatoriAll} />;
                      }
                      if (path.startsWith('/news')) return <News newsAll={newsAll} />;
                      if (path.startsWith('/camp-tornei') || path.startsWith('/eventi')) {
                        const parts = path.split('/').filter(Boolean);
                        if (parts.length >= 2 && parts[1] !== '' && !['camp', 'tornei', 'generico', 'archivio'].includes(parts[1])) {
                          return <EventoDetail societaInfo={societaInfo} eventId={parts[1]} />;
                        }
                        return <CampTornei />;
                      }
                      if (path.startsWith('/albo-d-oro') || path.startsWith('/hall-of-fame')) return <AlboDOro />;
                      if (path.startsWith('/galleria') || path.startsWith('/modulistica')) return <Galleria squadre={squadreAll} />;
                      if (path.startsWith('/societa')) return <Societa societaInfo={societaInfo} societaConfig={societaConfig} />;
                      return <NotFound />;
                    })()}
                  </Suspense>
                </ChunkErrorBoundary>
              </div>
            ) : loadingAuth ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4" id="loading-spinner">
                <Loader2 className="w-10 h-10 text-brand-yellow animate-spin" />
                <p className="text-sm font-mono text-zinc-400">Verifica sessione di amministrazione...</p>
              </div>
            ) : !currentUser ? (
              <div className="w-full max-w-md mx-auto py-8">
                <ChunkErrorBoundary key={location.pathname}>
                  <Suspense fallback={<LoadingFallback />}>
                    <LoginForm />
                  </Suspense>
                </ChunkErrorBoundary>
              </div>
            ) : (
              /* CMS AMMINISTRAZIONE AUTENTICATO */
              <div className="w-full space-y-6" id="cms-dashboard">
                <ChunkErrorBoundary key={location.pathname}>
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminPanel
                      newsAll={newsAll}
                      squadreAll={squadreAll}
                      setSquadreAll={setSquadreAllOptimistic}
                      giocatoriAll={giocatoriAll}
                      setGiocatoriAll={setGiocatoriAllOptimistic}
                      sponsorsAll={sponsorsAll}
                      eventiAll={eventiAll}
                      societaInfo={societaInfo}
                      setSocietaInfo={setSocietaInfo}
                      societaConfig={societaConfig}
                      setSocietaConfig={setSocietaConfig}
                      currentUser={currentUser}
                      onLogout={handleLogout}
                      caricaFileSuStorage={caricaFileSuStorage}
                      societaSettings={societaSettings}
                      setSocietaSettings={setSocietaSettings}
                      loadAllData={loadAllData}
                      showToast={showToast}
                    />
                  </Suspense>
                </ChunkErrorBoundary>
              </div>
            )}
          </main>
        </div>

        {/* FOOTER */}
        <Footer 
          societaInfo={societaInfo}
          societaSettings={societaSettings}
          isAdminMode={isAdminMode}
          onSettingsTextChange={handleSettingsTextChange}
          onToggleAdmin={handleToggleAdmin}
        />

        {/* FLOATING WHATSAPP BUTTON (Visible on all screens) */}
        <WhatsAppFloatingButton 
          phoneNumber={societaInfo?.contatti?.whatsapp || '+39 351 321 0332'} 
        />

        {/* COOKIE CONSENT BANNER & PREFERENCES (GDPR & Garante Privacy) */}
        <CookieBanner />

      </div>
      )}
    </ErrorBoundary>
  );
}
