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
import PwaInstallPrompt from './components/PwaInstallPrompt';
import VoltexCampPill from './components/VoltexCampPill';
import DirettaLivePill from './components/DirettaLivePill';

// Public pages eagerly loaded for instant tab switching
import Home from './pages/Home';
import Squadre from './pages/Squadre';
import SquadraDetail from './pages/SquadraDetail';
import News from './pages/News';
import Societa from './pages/Societa';
import SponsorPage from './pages/Sponsor';
import DirettaLive from './pages/DirettaLive';
import NotFound from './pages/NotFound';
import Maintenance from './pages/Maintenance';
import SitoInAggiornamento from './components/SitoInAggiornamento';

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
  EventiTorneo,
  sortSquadreByImportance
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
  error: Error | null;
}

class ChunkErrorBoundary extends React.Component<ChunkErrorBoundaryProps, ChunkErrorBoundaryState> {
  public props: ChunkErrorBoundaryProps;
  public state: ChunkErrorBoundaryState = {
    hasError: false,
    error: null
  };

  constructor(props: ChunkErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ChunkErrorBoundary] Errore catturato:", error, errorInfo);
  }

  handleReload = () => {
    try {
      sessionStorage.removeItem('nva_chunk_reload');
      // Ripristina anche eventuale tab admin problematica memorizzata per sicurezza
      localStorage.removeItem('nva_admin_active_tab');
    } catch {}
    window.location.reload();
  };

  handleResetHome = () => {
    try {
      sessionStorage.clear();
      localStorage.removeItem('nva_admin_active_tab');
    } catch {}
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isChunkError = 
        this.state.error?.message?.includes('Failed to fetch') ||
        this.state.error?.message?.includes('dynamically imported') ||
        this.state.error?.name === 'ChunkLoadError';

      return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 max-w-md mx-auto">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <RotateCcw className="w-8 h-8 mx-auto" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold font-sport uppercase text-zinc-900">
              {isChunkError ? "Aggiornamento applicazione disponibile" : "Errore temporaneo di caricamento"}
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {isChunkError 
                ? "Una nuova versione del sito è stata pubblicata. Clicca sotto per aggiornare la visualizzazione." 
                : "La sezione ha riscontrato un'eccezione temporanea. Puoi ricaricare o ripristinare la navigazione."}
            </p>
            {this.state.error?.message && !isChunkError && (
              <p className="text-[10px] font-mono text-red-500 bg-red-50 border border-red-100 p-2 rounded-lg text-left break-words mt-2">
                {this.state.error.message}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={this.handleReload}
              className="bg-[#FFE600] hover:bg-yellow-400 text-black font-bold py-2.5 px-6 rounded-xl text-xs uppercase font-sport tracking-wider flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ricarica e Aggiorna</span>
            </button>
            <button
              onClick={this.handleResetHome}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs uppercase font-sport tracking-wider transition-all cursor-pointer"
            >
              Home Page
            </button>
          </div>
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
const VoltexCampPage = lazyWithRetry(() => import('./pages/VoltexCamp'));

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
        if (parsed.societaSettings) {
          parsed.societaSettings.isMaintenanceMode = false;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Cache read error:', e);
  }
  return null;
}

export interface PageMeta {
  key: string;
  title: string;
  sezione: string;
  descrizione: string;
}

export const DEFAULT_PAGE_MAINTENANCE: Record<string, boolean> = {
  'home': false,
  'squadre': false,
  'camp-tornei': true,
  'societa': true,
  'news': true,
  'galleria': true,
  'modulistica': true,
  'albo-d-oro': true,
  'sponsor': true,
  'voltex': true,
  'privacy': false,
};

export const getPageMeta = (pathname: string): PageMeta => {
  if (pathname === '/' || pathname === '' || pathname === '/home' || pathname === '/index.html') {
    return {
      key: 'home',
      title: 'HOME',
      sezione: 'Home',
      descrizione: ''
    };
  }
  if (pathname.startsWith('/squadre')) {
    return {
      key: 'squadre',
      title: 'SQUADRE',
      sezione: 'Squadre & Roster',
      descrizione: ''
    };
  }
  if (pathname.startsWith('/camp-tornei') || pathname.startsWith('/eventi')) {
    return {
      key: 'camp-tornei',
      title: 'CAMP & TORNEI',
      sezione: 'Camp & Tornei',
      descrizione: 'Stiamo definendo il programma e il calendario eventi per la nuova stagione 2026/2027. A breve tutti i dettagli e le date!'
    };
  }
  if (pathname.startsWith('/societa')) {
    return {
      key: 'societa',
      title: 'LA SOCIETÀ',
      sezione: 'La Società',
      descrizione: "Stiamo aggiornando l'organigramma societario e i documenti ufficiali NVA per la nuova stagione agonistica."
    };
  }
  if (pathname.startsWith('/diretta') || pathname.startsWith('/live')) {
    return {
      key: 'diretta',
      title: 'DIRETTA STREAMING',
      sezione: 'Diretta Streaming',
      descrizione: 'La trasmissione streaming del match è in allestimento.'
    };
  }
  if (pathname.startsWith('/news')) {
    return {
      key: 'news',
      title: 'NEWS',
      sezione: 'News & Comunicazioni',
      descrizione: 'La redazione sta preparando i nuovi comunicati ufficiali e gli approfondimenti sul campionato delle Pantere.'
    };
  }
  if (pathname.startsWith('/galleria')) {
    return {
      key: 'galleria',
      title: 'GALLERIA',
      sezione: 'Galleria Foto',
      descrizione: 'I nuovi scatti fotografici ufficiali e le gallerie delle squadre sono in fase di allestimento. Torna presto!'
    };
  }
  if (pathname.startsWith('/modulistica')) {
    return {
      key: 'modulistica',
      title: 'MODULISTICA',
      sezione: 'Modulistica',
      descrizione: 'I moduli di iscrizione e la documentazione per la nuova stagione 2026/2027 sono in fase di predisposizione.'
    };
  }
  if (pathname.startsWith('/albo-d-oro') || pathname.startsWith('/hall-of-fame')) {
    return {
      key: 'albo-d-oro',
      title: 'MURO DEI FAMOSI',
      sezione: "Muro dei Famosi & Albo d'Oro",
      descrizione: 'Stiamo rinnovando la galleria delle memorie storiche e dei successi delle Pantere.'
    };
  }
  if (pathname.startsWith('/sponsor')) {
    return {
      key: 'sponsor',
      title: 'SPONSOR',
      sezione: 'I Nostri Sponsor',
      descrizione: 'Stiamo allestendo la vetrina ufficiale con tutti i partner e sostenitori delle Pantere.'
    };
  }
  if (pathname.startsWith('/voltex')) {
    return {
      key: 'voltex',
      title: 'VOLTEX CAMP',
      sezione: 'Voltex Camp',
      descrizione: 'Tutte le informazioni e le iscrizioni per il Voltex Camp estivo saranno rese disponibili a breve.'
    };
  }
  if (pathname.startsWith('/privacy')) {
    return {
      key: 'privacy',
      title: 'PRIVACY',
      sezione: 'Privacy Policy',
      descrizione: ''
    };
  }
  return {
    key: 'generale',
    title: 'PAGINA',
    sezione: 'Contenuti Ufficiali',
    descrizione: 'Pagina in fase di aggiornamento.'
  };
};

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

  // Reindirizzamento automatico dai vecchi domini tecnici al dominio ufficiale newvolleyacademy.it
  useEffect(() => {
    if (typeof window !== 'undefined' && (
      window.location.hostname === 'new-volley-academy.web.app' || 
      window.location.hostname === 'new-volley-academy.firebaseapp.com'
    )) {
      window.location.replace(`https://newvolleyacademy.it${window.location.pathname}${window.location.search}${window.location.hash}`);
    }
  }, []);

  // Scroll automatico in cima allo schermo ad ogni cambio rotta o navigazione
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname, location.search]);

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
  const [societaSettings, setSocietaSettings] = useState<any>(initialCache?.societaSettings || { logoUrl: '', isMaintenanceMode: false });

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

  const currentPageMeta = React.useMemo(() => getPageMeta(location.pathname), [location.pathname]);

  const isPageInMaintenance = (pageKey: string): boolean => {
    const custom = societaSettings?.pagineInManutenzione;
    if (custom && typeof custom === 'object' && custom[pageKey] !== undefined) {
      return Boolean(custom[pageKey]);
    }
    return DEFAULT_PAGE_MAINTENANCE[pageKey] ?? false;
  };

  const isCurrentPageInMaintenance = isPageInMaintenance(currentPageMeta.key);

  const toggleCurrentPageMaintenance = async () => {
    const pageKey = currentPageMeta.key;
    const nextStatus = !isCurrentPageInMaintenance;
    const currentMap = societaSettings?.pagineInManutenzione || { ...DEFAULT_PAGE_MAINTENANCE };
    const updatedMap = {
      ...currentMap,
      [pageKey]: nextStatus
    };
    const updatedSettings = {
      ...societaSettings,
      pagineInManutenzione: updatedMap
    };
    setSocietaSettings(updatedSettings);
    updateLocalCache({ societaSettings: updatedSettings });

    try {
      await updateSocietaSettings(updatedSettings);
      showToast(
        nextStatus
          ? `Manutenzione ATTIVATA per ${currentPageMeta.title}. I visitatori vedono la schermata di aggiornamento.`
          : `Manutenzione DISATTIVATA per ${currentPageMeta.title}! La pagina è ora PUBBLICA per tutti.`,
        "success"
      );
    } catch (err) {
      console.error("Errore salvataggio manutenzione pagina:", err);
      showToast("Errore durante l'aggiornamento dello stato della pagina.", "error");
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
        getSocietaSettings().catch(() => ({ logoUrl: '', isMaintenanceMode: false }))
      ]);

      const safeSettings = settings && typeof settings === 'object' ? settings : { logoUrl: '', isMaintenanceMode: false };
      // Il sito è ora pubblico per l'inizio del campionato
      safeSettings.isMaintenanceMode = false;

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

      const sortedSquads = sortSquadreByImportance(squads);
      setSquadreAll(sortedSquads);
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

      <div className="min-h-screen w-full max-w-full overflow-x-clip bg-[#f4f4f0] text-zinc-900 font-sans antialiased selection:bg-brand-yellow selection:text-black flex flex-col justify-between" id="main-container">
          
          <div>
            {/* ADMIN TOOLBAR: Always visible when currentUser is logged in, linked to CURRENT PAGE */}
            {currentUser && (
              <div className={`px-2.5 sm:px-4 py-2 text-xs font-black font-sport uppercase tracking-wider z-50 sticky top-0 shadow-lg border-b transition-colors w-full max-w-full overflow-hidden ${
                isCurrentPageInMaintenance
                  ? 'bg-[#FFE600] text-black border-black/15'
                  : 'bg-zinc-900 text-zinc-200 border-zinc-800'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full max-w-full">
                  {/* Left: Info pagina corrente e stato manutenzione */}
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isCurrentPageInMaintenance ? 'bg-black animate-ping' : 'bg-emerald-400'}`} />
                    <span className="font-barlow font-bold truncate max-w-[150px] sm:max-w-none">
                      PAGINA: <span className="underline decoration-2 underline-offset-2">{currentPageMeta.title}</span>
                    </span>
                    <span className="text-zinc-500 font-mono text-[11px] hidden sm:inline">—</span>
                    <span className="font-mono text-[10px] sm:text-[11px] flex items-center gap-1 shrink-0">
                      {isCurrentPageInMaintenance ? (
                        <span className="bg-black text-[#FFE600] px-1.5 sm:px-2 py-0.5 rounded font-bold">
                          MANUTENZIONE
                        </span>
                      ) : (
                        <span className="bg-emerald-600 text-white px-1.5 sm:px-2 py-0.5 rounded font-bold">
                          PUBBLICA
                        </span>
                      )}
                    </span>
                    {previewAsVisitor && (
                      <span className="bg-amber-600 text-white px-1.5 py-0.5 rounded font-mono text-[9px] sm:text-[10px] font-black animate-pulse shrink-0">
                        PANTERA ATTIVA
                      </span>
                    )}
                  </div>

                  {/* Right: Azioni legate alla pagina corrente (Grid compatto su mobile per evitare overflow) */}
                  <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto shrink-0">
                    {/* Tasto VEDI PANTERA / ESCI DA PANTERA (Anteprima visitatore della pagina) */}
                    <button
                      onClick={() => {
                        const next = !previewAsVisitor;
                        setPreviewAsVisitor(next);
                        showToast(
                          next
                            ? `Anteprima Pantera attiva: vedi "${currentPageMeta.title}" come visitatore.`
                            : `Tornato a vista Admin: vedi tutti i contenuti di "${currentPageMeta.title}".`,
                          "info"
                        );
                      }}
                      className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded text-[10px] sm:text-[11px] font-mono font-bold cursor-pointer transition-all flex items-center justify-center gap-1 shadow truncate ${
                        previewAsVisitor
                          ? 'bg-black text-[#FFE600] border-2 border-[#FFE600] ring-1 ring-black'
                          : isCurrentPageInMaintenance
                            ? 'bg-black/15 hover:bg-black/25 text-black border border-black/20'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700'
                      }`}
                      title={previewAsVisitor ? "Esci dall'anteprima visitatore" : "Vedi questa pagina come la vede un visitatore"}
                    >
                      <span>👁️</span>
                      <span className="truncate">{previewAsVisitor ? "ESCI" : "PANTERA"}</span>
                    </button>

                    {/* Toggle Admin CMS vs Public site view */}
                    <button
                      onClick={handleToggleAdmin}
                      className={`px-2 sm:px-2.5 py-1.5 sm:py-1 rounded text-[10px] sm:text-[10.5px] font-mono font-bold cursor-pointer transition-all flex items-center justify-center truncate ${
                        isCurrentPageInMaintenance
                          ? 'bg-black/10 hover:bg-black/20 text-black border border-black/20'
                          : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700'
                      }`}
                    >
                      {isAdminMode ? "🌐 SITO" : "⚙️ CMS"}
                    </button>

                    {/* 1-Click Toggle Maintenance Mode per la pagina corrente */}
                    <button
                      onClick={toggleCurrentPageMaintenance}
                      className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded text-[10px] sm:text-[11px] font-mono font-bold cursor-pointer transition-all shadow flex items-center justify-center gap-1 truncate ${
                        isCurrentPageInMaintenance
                          ? 'bg-black hover:bg-zinc-900 text-[#FFE600] border border-black'
                          : 'bg-[#FFE600] hover:bg-yellow-400 text-black'
                      }`}
                      title={isCurrentPageInMaintenance ? "Rendi questa pagina visibile e accessibile a tutti i visitatori" : "Nascondi questa pagina ai visitatori con la schermata di aggiornamento"}
                    >
                      <span className="truncate">{isCurrentPageInMaintenance ? "PUBBLICA" : "MANUTENZIONE"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Banner di avviso quando l'admin visualizza una pagina in manutenzione */}
            {currentUser && !previewAsVisitor && !isAdminMode && isCurrentPageInMaintenance && (
              <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-950 px-3 sm:px-4 py-1.5 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full max-w-full overflow-hidden">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  <span className="truncate sm:whitespace-normal">
                    <strong>VISTA ADMIN:</strong> Contenuti reali di <strong>{currentPageMeta.title}</strong>. Visitatori vedono aggiornamento.
                  </span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                  <button
                    onClick={() => setPreviewAsVisitor(true)}
                    className="underline font-bold hover:text-black cursor-pointer text-[11px]"
                  >
                    👁️ Vedi Pantera
                  </button>
                  <button
                    onClick={toggleCurrentPageMaintenance}
                    className="bg-black text-[#FFE600] px-2.5 py-0.5 rounded font-bold hover:bg-zinc-800 cursor-pointer text-[10px]"
                  >
                    Pubblica per Tutti
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

          {/* FLOATING ACTION PILLS (Live streaming a sinistra se attivo, Voltex Camp a destra) */}
          <div className="relative w-full z-30 pointer-events-none select-none">
            <div className="absolute left-0 top-0 pointer-events-auto">
              <DirettaLivePill />
            </div>
            <div className="absolute right-0 top-0 pointer-events-auto">
              <VoltexCampPill />
            </div>
          </div>

          {/* DYNAMIC CONTENT STAGE */}
          <main className={`w-full min-h-screen ${(location.pathname === '/' || location.pathname === '/squadre' || location.pathname.startsWith('/camp-tornei') || location.pathname.startsWith('/voltex') || location.pathname.startsWith('/societa') || location.pathname.startsWith('/news') || location.pathname.startsWith('/galleria') || location.pathname.startsWith('/albo-d-oro') || location.pathname.startsWith('/hall-of-fame') || location.pathname.startsWith('/diretta') || location.pathname.startsWith('/live')) ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`} id="content-stage">
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
                      const pageMeta = getPageMeta(path);
                      const isPageMaintenance = isPageInMaintenance(pageMeta.key);
                      const isVisitorView = !currentUser || previewAsVisitor;

                      // Se l'utente è un visitatore (o l'admin ha cliccato 'Vedi Pantera')
                      // E la pagina è contrassegnata in manutenzione: mostra Sito In Aggiornamento
                      if (isVisitorView && isPageMaintenance) {
                        return <SitoInAggiornamento sezione={pageMeta.sezione} descrizione={pageMeta.descrizione} />;
                      }

                      // ALTRIMENTI: rendering reale dei contenuti (visibile all'admin e ai visitatori se pubblicata)
                      if (path === '/privacy') return <Privacy />;
                      if (path === '/sponsor') return <SponsorPage />;
                      if (path === '/diretta' || path === '/live') return <DirettaLive sponsorsAll={sponsorsAll} societaInfo={societaInfo} />;
                      if (path === '/voltex' || path.startsWith('/voltex')) return <VoltexCampPage societaInfo={societaInfo} />;
                      if (path === '/' || path === '/home' || path === '/index.html') return (
                        <Home 
                          societaSettings={societaSettings} 
                          setSocietaSettings={setSocietaSettings} 
                          societaInfo={societaInfo}
                          newsAll={newsAll}
                          sponsorsAll={sponsorsAll}
                          squadreAll={squadreAll}
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
                      if (path.startsWith('/news')) return <News newsAll={newsAll} squadreAll={squadreAll} />;
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

        {/* PWA INSTALL PROMPT (Android prompt & iOS Add to Home guide) */}
        <PwaInstallPrompt />

        {/* COOKIE CONSENT BANNER & PREFERENCES (GDPR & Garante Privacy) */}
        <CookieBanner />

      </div>
    </ErrorBoundary>
  );
}
