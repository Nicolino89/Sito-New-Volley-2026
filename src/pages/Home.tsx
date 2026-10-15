import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { compressImage, IMAGE_PRESETS } from '../utils/imageCompressor';
import { updatePageMeta } from '../utils/seoHelper';
import InstagramLiveFeed from '../components/InstagramLiveFeed';
import { 
  Award, 
  Clock, 
  Sparkles, 
  Undo, 
  Briefcase, 
  ExternalLink, 
  Facebook, 
  Instagram, 
  ArrowRight, 
  BookOpen,
  Image as ImageIcon,
  Upload,
  Settings,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  AlignLeft,
  AlignCenter,
  Eye,
  EyeOff,
  Menu,
  MapPin
} from 'lucide-react';

import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import {
  auth,
  db,
  isDemoMode,
  ascoltaStatoAutenticazione,
  getSocietaInfo,
  getSocietaSettings,
  getConfigHome,
  updateConfigHome,
  publishDraftToLive,
  discardDraft,
  caricaBlobSuStorage,
  getSponsorAll,
  getSponsorPerLivello,
  getNewsAll,
  getProssimaGara,
  updateProssimaGara,
  updateSocietaSettings,
  handleFirestoreError,
  OperationType,
  // Types
  SocietaInfo,
  ConfigHome,
  ProssimaGara,
  Sponsor,
  NewsBlog,
  AdminUser
} from '../firebase-societa';
import { sanitizeLuogoDisplay } from '../utils/fipavScraper';
import { slugify } from './News';

declare module '../firebase-societa' {
  interface ConfigHome {
    cta1Link?: string;
    cta2Link?: string;
  }
}

// Preset font selection helper
function getTitleFontClass(preset?: string): string {
  switch (preset) {
    case 'tech':
      return 'font-sans font-black tracking-tight uppercase';
    case 'serif':
      return 'font-serif font-bold italic tracking-normal';
    case 'mono':
      return 'font-mono font-bold tracking-wide uppercase';
    case 'sport':
    default:
      return 'font-anton font-normal uppercase leading-none text-white';
  }
}

// Preset default configurations for 0ms instant render without network wait
const DEFAULT_CONFIG_HOME: ConfigHome = {
  id: "generale",
  hero_foto_url: "https://images.unsplash.com/photo-1592656094267-764a45068526?w=1600&auto=format&fit=crop&q=80",
  heroBgUrl: "https://images.unsplash.com/photo-1592656094267-764a45068526?w=1600&auto=format&fit=crop&q=80",
  heroTagline: "CAMPIONATO REGIONALE FIPAV 2026/2027",
  heroTitle: "SI GIOCA IN GIALLO E NERO.",
  heroDescription: "Due prime squadre in Serie D, un settore giovanile che cresce ogni stagione, un'unica maglia. Questa è New Volley Academy.",
  heroBtn1Text: "SCOPRI LE SQUADRE",
  heroBtn2Text: "CAMP ESTIVO 2026",
  storyTitle: "LA NOSTRA IDENTITÀ",
  storyDescription: "Fondata con la missione di formare atlete e atleti completi, la New Volley Academy unisce eccellenza tecnica, spirito di squadra e passione sportiva.",
  storyFotoUrl: "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=1200&auto=format&fit=crop&q=80"
};

const DEFAULT_PROSSIME_GARE: ProssimaGara[] = [
  {
    id: "gara_d_maschile",
    categoria: "Serie D Maschile",
    avversario: "Volley Club Cesena",
    data_ora: "SAB 18 OTT • 20:30",
    luogo: "PalaVolley NVA - Forlì",
    giornata: "1ª Giornata",
    casa: true,
    punti_nva: null,
    punti_avversario: null
  },
  {
    id: "gara_d_femminile",
    categoria: "Serie D Femminile",
    avversario: "Rainbow Forlimpopoli",
    data_ora: "DOM 19 OTT • 17:30",
    luogo: "PalaVolley NVA - Forlì",
    giornata: "1ª Giornata",
    casa: true,
    punti_nva: null,
    punti_avversario: null
  }
];

const HOME_CACHE_KEY = 'nva_home_page_cache_v2';

function getHomeCache() {
  try {
    const raw = localStorage.getItem(HOME_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {
    console.warn(e);
  }
  return null;
}

// In-Memory Persistent Module Cache for Instantaneous Transitions
let cachedHomeInfo: SocietaInfo | null = null;
let cachedConfigHome: ConfigHome | null = null;
let cachedProssimeGare: ProssimaGara[] = [];
let cachedNewsAll: NewsBlog[] = [];
let cachedSponsorMain: any[] = [];
let cachedSponsorGold: any[] = [];
let cachedSponsorSilver: any[] = [];

interface HomeProps {
  societaSettings?: any;
  setSocietaSettings?: React.Dispatch<React.SetStateAction<any>>;
  societaInfo?: any;
  newsAll?: NewsBlog[];
  sponsorsAll?: Sponsor[];
}

export default function Home({ 
  societaSettings: propsSocietaSettings, 
  setSocietaSettings: propsSetSocietaSettings,
  societaInfo: propsSocietaInfo,
  newsAll: propsNewsAll,
  sponsorsAll: propsSponsorsAll
}: HomeProps = {}) {
  const navigate = useNavigate();

  // Authentication & Admin state
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(false);

  // Sidebar visual state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: boolean }>({
    logo: false,
    hero_text: false,
    hero_img: false,
    storia: false,
    ticker: false,
    scoreboard: false,
    footer: false
  });

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Database states with Instant Cache Hydration & Default Fallbacks
  const homeCache = React.useMemo(() => getHomeCache(), []);

  const [societaInfo, setSocietaInfo] = useState<SocietaInfo | null>(propsSocietaInfo || homeCache?.societaInfo || cachedHomeInfo);
  const [configHome, setConfigHome] = useState<ConfigHome>(homeCache?.configHome || cachedConfigHome || DEFAULT_CONFIG_HOME);
  const [societaSettingsLocal, setSocietaSettingsLocal] = useState<{ 
    logoUrl?: string; 
    logoSize?: number; 
    logoSizeDraft?: number;
    navbarTitle?: string;
    navbarTitleDraft?: string;
    navbarTitleSize?: number;
    navbarTitleSizeDraft?: number;
    navbarSubtitle?: string;
    navbarSubtitleDraft?: string;
    showSubtitle?: boolean;
    showSubtitleDraft?: boolean;
    tickerAnnouncements?: string[];
    tickerAnnouncementsDraft?: string[];
    footerDescription?: string;
    footerDescriptionDraft?: string;
    footerCopyright?: string;
    footerCopyrightDraft?: string;
    footerCredits?: string;
    footerCreditsDraft?: string;
  }>({ logoUrl: '' });
  
  const [prossimeGare, setProssimeGare] = useState<ProssimaGara[]>(homeCache?.prossimeGare || (cachedProssimeGare.length > 0 ? cachedProssimeGare : DEFAULT_PROSSIME_GARE));
  const [newsAll, setNewsAll] = useState<NewsBlog[]>(propsNewsAll || homeCache?.newsAll || cachedNewsAll);
  const [sponsorMain, setSponsorMain] = useState<any[]>(homeCache?.sponsorMain || cachedSponsorMain);
  const [sponsorGold, setSponsorGold] = useState<any[]>(homeCache?.sponsorGold || cachedSponsorGold);
  const [sponsorSilver, setSponsorSilver] = useState<any[]>(homeCache?.sponsorSilver || cachedSponsorSilver);
  const [loadingData, setLoadingData] = useState<boolean>(false);

  // Fallback to local states if props not supplied
  const societaSettings = propsSocietaSettings !== undefined ? propsSocietaSettings : societaSettingsLocal;
  
  const setSocietaSettings = (val: any) => {
    if (propsSetSocietaSettings) {
      propsSetSocietaSettings(val);
    } else {
      setSocietaSettingsLocal(val);
    }
  };

  // UI state
  const [selectedMatchCategory, setSelectedMatchCategory] = useState<'D Maschile' | 'D Femminile'>('D Maschile');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [compState, setCompState] = useState<{
    progress: number;
    error: string | null;
    stats: {
      originalSize: string;
      compressedSize: string;
      reductionPercent: number;
    } | null;
    activeId: string | null;
  }>({
    progress: 0,
    error: null,
    stats: null,
    activeId: null
  });

  const compressWithUI = async (
    file: File,
    preset: any,
    id: string
  ): Promise<{ file: File; objectUrl: string } | null> => {
    setCompState({
      progress: 1,
      error: null,
      stats: null,
      activeId: id
    });

    try {
      const result = await compressImage(file, preset, (percent) => {
        setCompState(prev => prev.activeId === id ? { ...prev, progress: percent } : prev);
      });

      const origKB = (result.originalSize / 1024).toFixed(1) + ' KB';
      const compKB = (result.compressedSize / 1024).toFixed(1) + ' KB';

      setCompState({
        progress: 100,
        error: null,
        stats: {
          originalSize: origKB,
          compressedSize: compKB,
          reductionPercent: result.reductionPercent
        },
        activeId: id
      });

      // Scompare dopo 5 secondi
      setTimeout(() => {
        setCompState(prev => prev.activeId === id ? { ...prev, stats: null, activeId: null } : prev);
      }, 5000);

      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const finalFile = new File([result.blob], `${baseName}.webp`, {
        type: result.format,
        lastModified: Date.now()
      });

      return { file: finalFile, objectUrl: result.objectUrl };

    } catch (err: any) {
      setCompState({
        progress: 0,
        error: "Errore durante la compressione. Riprova con un file diverso.",
        stats: null,
        activeId: id
      });
      return null;
    }
  };

  const renderCompressionFeedback = (id: string) => {
    if (compState.activeId !== id) return null;

    return (
      <div className="space-y-1.5 mt-1.5">
        {compState.progress > 0 && compState.progress < 100 && (
          <div className="w-full space-y-1">
            <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono">
              <span>Compressione in corso...</span>
              <span>{compState.progress}%</span>
            </div>
            <div className="w-full bg-zinc-800 h-1 rounded overflow-hidden">
              <div className="bg-[#FFE500] h-full transition-all duration-150" style={{ width: `${compState.progress}%` }} />
            </div>
          </div>
        )}
        {compState.stats && (
          <div className="p-2 bg-green-950/40 border border-green-800 rounded text-green-400 text-xs font-inter animate-fade-in flex items-center gap-1">
            <span>✓ Immagine ottimizzata: [{compState.stats.originalSize} → {compState.stats.compressedSize}] · riduzione [{compState.stats.reductionPercent}%]</span>
          </div>
        )}
        {compState.error && (
          <div className="p-2 bg-red-950/40 border border-red-900 rounded text-red-400 text-xs font-inter animate-fade-in">
            {compState.error}
          </div>
        )}
      </div>
    );
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Listen for user authentication status & check if user is admin
  useEffect(() => {
    const unsubscribe = ascoltaStatoAutenticazione((user) => {
      setCurrentUser(user);
      setLoadingAuth(false);
      if (user && user.ruolo === 'Super Admin') {
        setIsAdminMode(true);
      } else {
        setIsAdminMode(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch all homepage content
  const loadHomeData = async (isEditorAdmin: boolean) => {
    try {
      if (!cachedConfigHome && !configHome) {
        setLoadingData(true);
      }
      const [
        info,
        confHome,
        gareMaschile,
        gareFemminile,
        news,
        sMain,
        sGold,
        sSilver,
        settings
      ] = await Promise.all([
        getSocietaInfo(),
        getConfigHome(isEditorAdmin ? 'draft' : 'live'),
        getProssimaGara("Serie D Maschile"),
        getProssimaGara("Serie D Femminile"),
        getNewsAll(true),
        isDemoMode || !db ? getSponsorPerLivello('Main') : getDocs(query(collection(db, 'sponsors'), where('tipologia', '==', 'Main Sponsor'), orderBy('ordine'))).then(s => s.docs.map(d => ({ id: d.id, ...d.data() }))).catch(() => getSponsorPerLivello('Main')),
        isDemoMode || !db ? getSponsorPerLivello('Gold') : getDocs(query(collection(db, 'sponsors'), where('tipologia', '==', 'Gold Partner'), orderBy('ordine'))).then(s => s.docs.map(d => ({ id: d.id, ...d.data() }))).catch(() => getSponsorPerLivello('Gold')),
        isDemoMode || !db ? getSponsorPerLivello('Silver') : getDocs(query(collection(db, 'sponsors'), where('tipologia', '==', 'Sponsor Tecnico'), orderBy('ordine'))).then(s => s.docs.map(d => ({ id: d.id, ...d.data() }))).catch(() => getSponsorPerLivello('Silver')),
        getSocietaSettings()
      ]);

      cachedHomeInfo = info || null;
      cachedConfigHome = confHome || null;
      cachedProssimeGare = [gareMaschile, gareFemminile].filter(Boolean);
      cachedNewsAll = news || [];
      cachedSponsorMain = sMain || [];
      cachedSponsorGold = sGold || [];
      cachedSponsorSilver = sSilver || [];

      setSocietaInfo(info || null);
      setConfigHome(confHome || DEFAULT_CONFIG_HOME);
      setProssimeGare([gareMaschile, gareFemminile].filter(Boolean));
      setNewsAll(news || []);
      setSponsorMain(sMain || []);
      setSponsorGold(sGold || []);
      setSponsorSilver(sSilver || []);

      // Persist to local storage for instant 0ms future visits
      try {
        localStorage.setItem(HOME_CACHE_KEY, JSON.stringify({
          societaInfo: info || null,
          configHome: confHome || DEFAULT_CONFIG_HOME,
          prossimeGare: [gareMaschile, gareFemminile].filter(Boolean),
          newsAll: news || [],
          sponsorMain: sMain || [],
          sponsorGold: sGold || [],
          sponsorSilver: sSilver || []
        }));
      } catch (e) {
        // storage quota
      }
      
      const loadedSettings = (settings || { logoUrl: '' }) as any;
      // Pre-populate drafts if they don't exist yet
      if (loadedSettings.logoSizeDraft === undefined) loadedSettings.logoSizeDraft = loadedSettings.logoSize || 70;
      if (loadedSettings.navbarTitleDraft === undefined) loadedSettings.navbarTitleDraft = loadedSettings.navbarTitle || "NEW VOLLEY ACADEMY";
      if (loadedSettings.navbarTitleSizeDraft === undefined) loadedSettings.navbarTitleSizeDraft = loadedSettings.navbarTitleSize || 34;
      if (loadedSettings.navbarSubtitleDraft === undefined) loadedSettings.navbarSubtitleDraft = loadedSettings.navbarSubtitle || "FORLÌ • VOLLEY CLUB UFFICIALE";
      if (loadedSettings.showSubtitleDraft === undefined) loadedSettings.showSubtitleDraft = loadedSettings.showSubtitle !== false;
      if (loadedSettings.footerDescriptionDraft === undefined) loadedSettings.footerDescriptionDraft = loadedSettings.footerDescription || "Società sportiva dilettantistica di pallavolo a Forlì. Promuoviamo i valori dello sport e la crescita dei giovani atleti, dal minivolley e settore giovanile fino ai campionati regionali di Serie D.";
      if (loadedSettings.tickerAnnouncementsDraft === undefined) loadedSettings.tickerAnnouncementsDraft = loadedSettings.tickerAnnouncements || [
        "ISCRIZIONI CAMP ESTIVO APERTE",
        "SERIE D MASCHILE – NVA PROMOSSA 2026/2027",
        "NVA BEACH CUP - SECONDA EDIZIONE A SETTEMBRE"
      ];
      
      setSocietaSettings(loadedSettings);
    } catch (err) {
      console.error("Errore nel caricamento dei dati della Home:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    updatePageMeta({
      title: "New Volley Academy Forlì | Le Pantere",
      description: "Sito ufficiale della New Volley Academy Forlì: squadre, classifiche FIPAV, calendari gare, news e camp estivi."
    });
  }, []);

  useEffect(() => {
    loadHomeData(isAdminMode);
  }, [currentUser, isAdminMode]);

  // Real-time live text updates for ConfigHome
  const handleConfigHomeLiveUpdate = (field: string, val: any) => {
    if (!configHome) return;
    const updated = { ...configHome, [field]: val } as any;
    setConfigHome(updated);
    updateConfigHome(updated, 'draft').catch(err => console.error("Error draft-saving config:", err));
  };

  // Real-time live updates for Settings draft values
  const handleSettingsLiveUpdate = (field: string, val: any) => {
    const updated = { ...societaSettings, [field]: val };
    setSocietaSettings(updated);
  };

  // Upload Logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compResult = await compressWithUI(file, IMAGE_PRESETS.LOGO, 'home-logo');
      if (!compResult) return;

      const url = await caricaBlobSuStorage(compResult.file, `settings/logo_${Date.now()}.webp`);
      handleSettingsLiveUpdate('logoUrl', url);
      URL.revokeObjectURL(compResult.objectUrl);
      showToast("Logo caricato in anteprima!", "success");
    } catch (err) {
      console.error("Errore caricamento logo:", err);
      showToast("Errore nel caricamento del logo.", "error");
    }
  };

  // Upload Hero image
  const handleHeroPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !configHome) return;
    try {
      const compResult = await compressWithUI(file, IMAGE_PRESETS.HERO, 'home-hero');
      if (!compResult) return;

      const url = await caricaBlobSuStorage(compResult.file, `homepage/hero_${Date.now()}.webp`);
      handleConfigHomeLiveUpdate('heroBgUrl', url);
      handleConfigHomeLiveUpdate('hero_foto_url', url);
      URL.revokeObjectURL(compResult.objectUrl);
      showToast("Sfondo Hero caricato in anteprima!", "success");
    } catch (err) {
      console.error("Errore caricamento foto hero:", err);
      showToast("Errore nel caricamento della foto hero.", "error");
    }
  };

  // Upload Story image
  const handleStoryPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !configHome) return;
    try {
      const compResult = await compressWithUI(file, IMAGE_PRESETS.STORIA, 'home-story');
      if (!compResult) return;

      const url = await caricaBlobSuStorage(compResult.file, `homepage/storia_${Date.now()}.webp`);
      handleConfigHomeLiveUpdate('storyFotoUrl', url);
      URL.revokeObjectURL(compResult.objectUrl);
      showToast("Foto Storia caricata in anteprima!", "success");
    } catch (err) {
      console.error("Errore caricamento foto storia:", err);
      showToast("Errore nel caricamento della foto storia.", "error");
    }
  };

  // Update Scoreboard Values Live
  const handleScoreboardLiveUpdate = (category: "Serie D Maschile" | "Serie D Femminile", field: keyof ProssimaGara, val: any) => {
    const updated = prossimeGare.map(g => {
      if (g.categoria === category) {
        return { ...g, [field]: val };
      }
      return g;
    });
    setProssimeGare(updated);
  };

  // Publish changes to Firebase Firestore (persisting all states)
  const handlePublishAll = async () => {
    try {
      showToast("Salvataggio e pubblicazione modifiche...", "info");
      
      // 1. Publish Home layout texts & hero configurations
      if (configHome) {
        await updateConfigHome(configHome, 'draft');
        await publishDraftToLive();
      }

      // 2. Publish Societa Settings (promote drafts to live)
      const currentSettings = societaSettings || {};
      const publishedSettings = {
        ...currentSettings,
        logoSize: currentSettings.logoSizeDraft !== undefined ? Number(currentSettings.logoSizeDraft) : (currentSettings.logoSize || 70),
        navbarTitle: currentSettings.navbarTitleDraft || currentSettings.navbarTitle || "NEW VOLLEY ACADEMY",
        navbarTitleSize: currentSettings.navbarTitleSizeDraft !== undefined ? Number(currentSettings.navbarTitleSizeDraft) : (currentSettings.navbarTitleSize || 34),
        navbarSubtitle: currentSettings.navbarSubtitleDraft || currentSettings.navbarSubtitle || "FORLÌ • VOLLEY CLUB UFFICIALE",
        showSubtitle: currentSettings.showSubtitleDraft !== false,
        tickerAnnouncements: currentSettings.tickerAnnouncementsDraft || currentSettings.tickerAnnouncements || [],
        footerDescription: currentSettings.footerDescriptionDraft || currentSettings.footerDescription || "Società sportiva dilettantistica di pallavolo a Forlì. Promuoviamo i valori dello sport e la crescita dei giovani atleti, dal minivolley e settore giovanile fino ai campionati regionali di Serie D.",
        footerCopyright: currentSettings.footerCopyrightDraft || currentSettings.footerCopyright || `© ${new Date().getFullYear()} New Volley Academy S.S.D. a R.L. Tutti i diritti riservati. P.IVA ${societaInfo?.partita_iva || '01234567890'}.`,
        footerCredits: currentSettings.footerCreditsDraft || currentSettings.footerCredits || "Sviluppato con React, Vite & Tailwind CSS.",
        isMaintenanceMode: false
      };
      await updateSocietaSettings(publishedSettings);
      setSocietaSettings(publishedSettings);

      // 3. Save Scoreboards
      for (const gara of prossimeGare) {
        await updateProssimaGara(gara);
      }

      showToast("Tutte le modifiche sono state pubblicate con successo!", "success");
    } catch (err) {
      console.error("Errore salvataggio modifiche:", err);
      showToast("Errore durante il salvataggio dei dati.", "error");
    }
  };

  // Cancel & rollback changes
  const handleCancelAll = async () => {
    if (!window.confirm("Annullare tutte le modifiche non salvate? L'anteprima verrà reimpostata ai valori correnti sul database.")) {
      return;
    }
    try {
      showToast("Ripristino valori originali...", "info");
      await discardDraft();
      await loadHomeData(isAdminMode);
      showToast("Modifiche annullate e ripristinate!", "success");
    } catch (err) {
      console.error("Errore nel ripristino:", err);
      showToast("Impossibile ripristinare i valori precedenti.", "error");
    }
  };

  // Visual helper values
  const heroBgPositionY = configHome?.heroBgPositionY !== undefined ? configHome.heroBgPositionY : '50';
  const heroAlignment = configHome?.hero_foto_url && (configHome as any).heroAlignment ? (configHome as any).heroAlignment : 'left';

  // Get active match for view rendering
  const activeGara = prossimeGare.find(g => g?.categoria === (selectedMatchCategory === 'D Maschile' ? "Serie D Maschile" : "Serie D Femminile")) || prossimeGare[0];

  return (
    <div className="relative min-h-screen w-full flex flex-col lg:flex-row gap-0" id="home-layout-container">
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-[120] px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-2.5 font-sans border text-sm max-w-sm ${
              toast.type === 'success' 
                ? 'bg-emerald-950 text-emerald-250 border-emerald-800/40 shadow-emerald-950/20' 
                : toast.type === 'error'
                  ? 'bg-red-950 text-red-250 border-red-800/40 shadow-red-950/20'
                  : 'bg-zinc-950 text-white border-zinc-800 shadow-zinc-950/30'
            }`}
          >
            <span className="text-base">
              {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span className="font-semibold leading-tight">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOAT FLOATING SIDEBAR OPEN/CLOSE TRIGGER */}
      {isAdminMode && (
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed bottom-6 right-6 z-[110] bg-zinc-950 hover:bg-zinc-900 text-brand-yellow border-2 border-brand-yellow p-3.5 rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
          title={isSidebarOpen ? "Chiudi pannello di amministrazione" : "Apri pannello di amministrazione"}
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {/* MAIN HOMEPAGE CONTENT SECTION */}
      <div className={`flex-1 transition-all duration-300 ${isAdminMode && isSidebarOpen ? 'lg:mr-[320px]' : ''}`}>
        
        {/* ================= HERO SECTION FULL-BLEED ================= */}
        <section className="relative w-full min-h-[560px] lg:min-h-[640px] flex items-center bg-zinc-950 border-b border-zinc-850 overflow-hidden" id="hero-banner-card">
          
          {/* Layer Sfondo: Foto con gradienti protettivi automatici o Texture di fallback */}
          <div className="absolute inset-0 z-0">
            {(configHome?.hero_foto_url || configHome?.heroBgUrl) ? (
              <img
                src={configHome.hero_foto_url || configHome.heroBgUrl}
                alt="NVA Volley Action"
                className="w-full h-full object-cover object-center filter brightness-90 contrast-105"
                style={{
                  objectPosition: `center ${configHome?.heroBgPositionY || 50}%`
                }}
              />
            ) : (
              <div className="w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,230,0,0.15),rgba(255,255,255,0))]" />
            )}

            {/* Gradienti CSS: Leggeri e morbidi per garantire perfetta leggibilità lasciando viva e nitida la foto */}
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/40 to-transparent sm:to-zinc-950/15" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/20" />
            
            {/* Soft Yellow Glow d'atmosfera */}
            <div className="absolute -top-24 left-1/4 w-96 h-96 bg-[#FFE600]/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Contenuto Allineato al Grid di Pagina */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10 sm:pt-8 sm:pb-12 lg:pt-8 lg:pb-14 w-full max-w-full overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Colonna Sinistra: Brand & Call To Actions */}
              <div className="lg:col-span-7 space-y-6 max-w-full overflow-hidden">
                
                {/* Tagline / Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFE600]/10 border border-[#FFE600]/30 text-[#FFE600] text-xs font-bold tracking-widest uppercase max-w-full truncate">
                  <span className="w-2 h-2 rounded-full bg-[#FFE600] animate-ping shrink-0" />
                  <span className="truncate">{configHome?.heroTagline || "FORLÌ · PALLAVOLO DAL 1800"}</span>
                </div>

                {/* Titolo Principale */}
                <h1 className={`text-4xl sm:text-6xl lg:text-7xl uppercase tracking-tight text-white leading-[0.95] ${getTitleFontClass(configHome?.fontPreset)}`}>
                  {configHome?.heroTitle || (
                    <>
                      Si gioca in <br />
                      <span className="text-[#FFE600]">giallo e nero.</span>
                    </>
                  )}
                </h1>

                {/* Descrizione */}
                <p 
                  className="text-zinc-300 text-sm sm:text-base lg:text-lg max-w-xl font-normal leading-relaxed"
                  style={{ color: configHome?.heroDescriptionColor || undefined }}
                >
                  {configHome?.heroDescription || "Due prime squadre in Serie D, un settore giovanile che cresce ogni stagione, un'unica maglia. Questa è New Volley Academy."}
                </p>

                {/* Pulsanti CTA */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => navigate(configHome?.cta1Link || '/squadre')}
                    className="inline-flex items-center gap-2 bg-[#FFE600] hover:bg-[#ebd400] text-zinc-950 font-bold text-sm uppercase px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-[#FFE600]/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    <span>{configHome?.heroBtn1Text || "SCOPRI LE SQUADRE"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => navigate(configHome?.cta2Link || '/camp-tornei/camp')}
                    className="inline-flex items-center gap-2 bg-zinc-900/80 hover:bg-zinc-800 text-white font-bold text-sm uppercase px-6 py-3.5 rounded-xl border border-zinc-700/80 transition-all hover:border-zinc-500 active:scale-[0.98] cursor-pointer"
                  >
                    <span>{configHome?.heroBtn2Text || "CAMP ESTIVO 2026"}</span>
                  </button>
                </div>
              </div>

              {/* Colonna Destra: Widget Prossima Gara */}
              <div className="lg:col-span-5" id="hero-next-match-card">
                <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
                  
                  {/* Selettore Maschile / Femminile */}
                  <div className="flex bg-black/60 p-1 rounded-xl border border-zinc-800 mb-4" id="match-category-toggles">
                    <button
                      onClick={() => setSelectedMatchCategory('D Maschile')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                        selectedMatchCategory === 'D Maschile'
                          ? 'bg-[#FFE600] text-zinc-950 shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      D Maschile
                    </button>
                    <button
                      onClick={() => setSelectedMatchCategory('D Femminile')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                        selectedMatchCategory === 'D Femminile'
                          ? 'bg-[#FFE600] text-zinc-950 shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      D Femminile
                    </button>
                  </div>

                  {/* Match Header Info */}
                  <div className="flex items-center justify-between text-xs text-zinc-400 pb-3 border-b border-zinc-800">
                    <span className="flex items-center gap-1.5 uppercase font-bold tracking-wider text-zinc-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Prossima Gara
                    </span>
                    <span className="font-bold text-[#FFE600]">
                      {activeGara?.data_ora || "15/10/26 20:45"}
                    </span>
                  </div>

                  {/* Squadre */}
                  <div className="py-4 space-y-3">
                    {/* Squadra 1 */}
                    <div className="flex items-center justify-between bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          activeGara ? (activeGara.casa ? 'bg-[#FFE600] text-zinc-950' : 'bg-zinc-800 text-zinc-300') : 'bg-[#FFE600] text-zinc-950'
                        }`}>
                          {activeGara ? (activeGara.casa ? 'Casa' : 'Ospiti') : 'Casa'}
                        </span>
                        <span className="font-bold text-sm sm:text-base text-white uppercase tracking-wide truncate max-w-[180px] sm:max-w-none">
                          {activeGara ? (activeGara.casa ? (societaSettings?.navbarTitleDraft ?? societaSettings?.navbarTitle ?? "NEW VOLLEY ACADEMY") : activeGara.avversario) : "NEW VOLLEY ACADEMY"}
                        </span>
                      </div>
                      <span className="text-base font-bold text-brand-yellow">
                        {activeGara?.punti_nva !== null && activeGara?.punti_nva !== undefined ? activeGara.punti_nva : "-"}
                      </span>
                    </div>

                    {/* Squadra 2 */}
                    <div className="flex items-center justify-between bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          activeGara ? (!activeGara.casa ? 'bg-[#FFE600] text-zinc-950' : 'bg-zinc-800 text-zinc-300') : 'bg-zinc-800 text-zinc-300'
                        }`}>
                          {activeGara ? (!activeGara.casa ? 'Casa' : 'Ospiti') : 'Ospiti'}
                        </span>
                        <span className="font-bold text-sm sm:text-base text-zinc-300 uppercase tracking-wide truncate max-w-[180px] sm:max-w-none">
                          {activeGara ? (!activeGara.casa ? (societaSettings?.navbarTitleDraft ?? societaSettings?.navbarTitle ?? "NEW VOLLEY ACADEMY") : activeGara.avversario) : "RAINBOW EMMECI FC"}
                        </span>
                      </div>
                      <span className="text-base font-bold text-zinc-400">
                        {activeGara?.punti_avversario !== null && activeGara?.punti_avversario !== undefined ? activeGara.punti_avversario : "-"}
                      </span>
                    </div>
                  </div>

                  {/* Match Footer Info */}
                  <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
                    <div className="flex items-center gap-1.5 truncate mr-2">
                      <MapPin className="w-3.5 h-3.5 text-[#FFE600] flex-shrink-0" />
                      <span className="truncate">{sanitizeLuogoDisplay(activeGara?.luogo, activeGara?.casa ?? true)}</span>
                    </div>
                    <span className="font-bold text-zinc-300 flex-shrink-0">
                      {activeGara?.giornata || "1ª Giornata"}
                    </span>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ================= SEZIONI SUCCESSIVE CON SFUMATURA MORBIDA E MASSIMO CONTRASTO ================= */}
        <div className="w-full bg-gradient-to-b from-zinc-950 via-slate-900/10 to-slate-100/95 py-12 transition-all relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            {/* L'ANGOLO SOCIAL LIVE DA INSTAGRAM (Subito sopra le notizie) */}
            <InstagramLiveFeed instagramUsername={societaInfo?.contatti?.instagram || "newvolleyacademy"} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left & Center: News Feed */}
            <div className="lg:col-span-2 space-y-8">
              <div className="flex justify-between items-center border-b border-zinc-800/80 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-6 bg-[#FFE600] rounded-sm inline-block shadow-sm" />
                  <BookOpen className="w-5 h-5 text-[#FFE600]" />
                  <h2 className="text-2xl font-barlow font-extrabold uppercase tracking-wide text-white drop-shadow-sm">Ultime Notizie & Comunicati</h2>
                </div>
                <button 
                  onClick={() => navigate('/news')} 
                  className="text-[13px] bg-[#FFE600] hover:bg-[#ebd400] text-zinc-950 font-barlow font-bold uppercase tracking-wider px-4 py-1.5 rounded-xl transition-all shadow-md shadow-[#FFE600]/15 cursor-pointer flex items-center gap-1.5"
                >
                  <span>Archivio News</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {newsAll.filter(n => n.stato_pubblicazione !== 'bozza').length === 0 ? (
                <div className="bg-white border border-slate-200/90 p-8 rounded-2xl text-center shadow-sm">
                  <p className="text-zinc-500 text-sm">Nessuna notizia pubblicata sul portale al momento.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {newsAll.filter(n => n.stato_pubblicazione !== 'bozza').slice(0, 3).map((news, idx) => (
                    <div 
                       key={news.id || idx} 
                       id={`news-card-${news.id}`}
                       onClick={() => navigate(`/news/${slugify(news.titolo)}`)}
                       className="bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-2xl overflow-hidden hover:border-[#FFE600] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col md:flex-row shadow-sm group cursor-pointer"
                    >
                    {/* News Image */}
                    <div className="md:w-2/5 h-48 md:h-auto overflow-hidden relative shrink-0 bg-zinc-100">
                      <img 
                        src={news.foto_copertina_url} 
                        alt={news.titolo} 
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-3 left-3 bg-black text-brand-yellow text-[12px] font-barlow font-semibold tracking-wider px-2.5 py-1 rounded-md border border-zinc-850 uppercase shadow-md">
                        {news.tag_categoria}
                      </span>
                    </div>

                    {/* News Content */}
                    <div className="p-6 flex flex-col justify-between flex-1 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-xs text-zinc-500 font-inter font-medium uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-zinc-600" />
                            {new Date(news.data_pubblicazione).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span>•</span>
                          <span>Autore: {news.autore}</span>
                        </div>

                        <h3 className="text-lg md:text-xl font-barlow font-semibold leading-snug text-zinc-950 group-hover:text-amber-600 transition-colors uppercase tracking-wide">
                          {news.titolo}
                        </h3>
                        <p className="font-inter font-normal text-sm leading-relaxed text-slate-600 line-clamp-3">
                          {news.testo}
                        </p>
                      </div>


                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Active Sponsors & Info Grid */}
          <div className="space-y-8">
            {/* Institutional Mini Card / Story */}
            <div className="bg-white/95 backdrop-blur-sm border border-slate-200/90 p-6 rounded-2xl space-y-4 relative overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-[#FFE600]/15 to-transparent rounded-full pointer-events-none" />
              <h3 className="text-lg font-barlow font-bold uppercase tracking-wide text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Award className="w-5 h-5 text-amber-500 shrink-0" />
                <span>
                  {configHome?.storyTitle || 'La Nostra Storia'}
                </span>
              </h3>
              <p className="font-inter font-normal text-sm leading-relaxed text-slate-600">
                {configHome?.storyDescription || `La New Volley Academy Forlì è nata nel 2018 per creare un polo pallavolistico d'eccellenza sul territorio romagnolo. Offriamo percorsi agonistici federali e corsi S3 giovanili per formare non solo grandi atleti, ma solide persone.`}
              </p>
              {configHome?.storyFotoUrl && (
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 shadow-sm mt-3 relative">
                  <img 
                    src={configHome.storyFotoUrl} 
                    alt="La Nostra Storia" 
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover object-top" 
                    referrerPolicy="no-referrer" 
                  />
                </div>
              )}
              <div className="text-xs text-zinc-500 space-y-2 font-inter font-medium uppercase tracking-wider pt-3 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>Fondazione:</span>
                  <span className="font-bold text-slate-900">{societaInfo?.anno_fondazione || '2018'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Colori:</span>
                  <span className="font-bold text-slate-900">{societaInfo?.colori_sociali || 'Giallo / Nero'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cod. Fipav:</span>
                  <span className="font-bold text-slate-900">{societaInfo?.codice_fipav || '080390199'}</span>
                </div>
              </div>
            </div>

            {/* SPONSOR SECTION */}
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3 flex items-center gap-2">
                <span className="w-2 h-5 bg-[#FFE600] rounded-sm inline-block" />
                <h3 className="text-lg font-barlow font-bold uppercase tracking-wide text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-4.5 h-4.5 text-slate-900" />
                  I Nostri Partner
                </h3>
              </div>

              {/* LEVEL 1: MAIN SPONSORS */}
              <div className="space-y-3" id="main-sponsors-section">
                <span className="text-[11px] uppercase tracking-widest font-bold text-black bg-[#FFE600] px-3 py-1 rounded-md font-barlow shadow-sm">Main Sponsor</span>
                {sponsorMain.length === 0 ? (
                  <p className="text-xs text-zinc-500 font-inter">Nessun main sponsor configurato.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {sponsorMain.map((sponsor) => (
                      <a 
                        href={sponsor.linkSito || sponsor.sito_web || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        key={sponsor.id} 
                        id={`sponsor-link-${sponsor.id}`}
                        className="block bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-2xl p-4 hover:border-[#FFE600] hover:shadow-md transition-all group shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl border border-zinc-200 bg-white p-1.5 flex items-center justify-center shrink-0 shadow-xs">
                            <img 
                              src={sponsor.logo?.url || sponsor.logoUrl || sponsor.logo_url || ''} 
                              alt={sponsor.nomeSponsor || sponsor.nome || ''} 
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-contain" 
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
                              }}
                            />
                          </div>
                          <div>
                            <h4 className="text-base font-inter font-semibold text-slate-900 flex items-center gap-1 group-hover:text-amber-600 transition-colors uppercase tracking-wide">
                              {sponsor.nomeSponsor || sponsor.nome || ''}
                              <ExternalLink className="w-3.5 h-3.5 opacity-60 text-zinc-600" />
                            </h4>
                            <p className="font-inter font-normal text-xs text-slate-600 mt-1 line-clamp-2">
                              {sponsor.descrizione || 'Sponsor ufficiale New Volley Academy'}
                            </p>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* LEVEL 2: GOLD SPONSORS */}
              <div className="space-y-3" id="gold-sponsors-section">
                <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-700 bg-white border border-zinc-300 px-2.5 py-1 rounded-md font-barlow">Gold Partner</span>
                {sponsorGold.length === 0 ? (
                  <p className="text-xs text-zinc-500 font-inter">Nessun gold sponsor configurato.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {sponsorGold.map((sponsor) => (
                      <a 
                        href={sponsor.linkSito || sponsor.sito_web || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        key={sponsor.id} 
                        className="bg-white border border-zinc-200 p-3 rounded-lg hover:border-brand-yellow hover:shadow-md transition-all text-center group block shadow-sm"
                      >
                        <div className="h-12 w-full flex items-center justify-center">
                          <img 
                            src={sponsor.logo?.url || sponsor.logoUrl || sponsor.logo_url || ''} 
                            alt={sponsor.nomeSponsor || sponsor.nome || ''} 
                            loading="lazy"
                            decoding="async"
                            className="max-h-full max-w-full object-contain mx-auto" 
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
                            }}
                          />
                        </div>
                        <h5 className="font-inter font-semibold text-[10px] text-slate-900 mt-2 truncate group-hover:text-amber-600 uppercase tracking-wide">{sponsor.nomeSponsor || sponsor.nome || ''}</h5>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <Link
                  to="/sponsor"
                  style={{ backgroundColor: '#050000' }}
                  className="inline-flex items-center gap-2 font-barlow font-semibold uppercase tracking-wide text-sm text-[#F5D800] hover:text-white border border-[#F5D800] hover:bg-[#F5D800] hover:text-black px-5 py-2 transition-all duration-200"
                >
                  Tutti i partner e sponsor
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      </div>

      {/* REVOLUTIONARY SIDEBAR PANEL FOR CMS ADMINS */}
      {isAdminMode && isSidebarOpen && (
        <aside 
          className="fixed top-0 right-0 h-full w-[320px] bg-[#121212] border-l-2 border-[#F5D800] z-[100] overflow-y-auto flex flex-col shadow-2xl text-white font-sans select-none"
          id="admin-sidebar-panel"
        >
          {/* Header Panel Controls */}
          <div className="p-4 border-b border-zinc-800 bg-[#171717] sticky top-0 z-10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sport uppercase tracking-widest text-[#F5D800] font-black italic">⚙️ CMS ADMIN HOME</span>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="text-zinc-400 hover:text-white font-mono text-[10px] uppercase tracking-widest bg-zinc-900 py-1 px-2 rounded border border-zinc-850 cursor-pointer"
              >
                CHIUDI
              </button>
            </div>

            {/* ACTION BUTTONS (ALWAYS VISIBLE ON TOP) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handlePublishAll}
                className="bg-brand-yellow hover:bg-yellow-400 text-black font-sport font-extrabold italic uppercase tracking-wider text-xs py-2.5 rounded shadow-[0_0_15px_rgba(245,216,0,0.3)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                PUBBLICA
              </button>
              <button
                onClick={handleCancelAll}
                className="bg-transparent border border-brand-yellow text-brand-yellow hover:bg-brand-yellow/10 font-sport font-extrabold italic uppercase tracking-wider text-xs py-2.5 rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Undo className="w-3.5 h-3.5" />
                ANNULLA
              </button>
            </div>
          </div>

          {/* Collapsible Content Area */}
          <div className="flex-1 p-4 space-y-4">
            
            {/* SECTION 1: LOGO */}
            <div className="border border-zinc-800 rounded-lg overflow-hidden bg-[#181818]">
              <button 
                onClick={() => toggleSection('logo')}
                className="w-full px-3.5 py-3 bg-zinc-900 flex items-center justify-between text-left border-b border-zinc-850 cursor-pointer"
              >
                <span className="font-bebas text-lg tracking-wider text-[#F5D800] uppercase font-bold">LOGO SOCIETARIO</span>
                {collapsedSections.logo ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronUp className="w-4 h-4 text-[#F5D800]" />}
              </button>
              
              {!collapsedSections.logo && (
                <div className="p-3.5 space-y-4">
                  {/* Logo Image Upload */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block font-mono">Immagine Logo:</label>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 bg-zinc-950 border border-zinc-800 rounded py-2 px-3 text-[11px] text-zinc-300 hover:text-white hover:border-brand-yellow transition-all cursor-pointer flex items-center justify-center gap-2">
                        <Upload className="w-3.5 h-3.5 text-brand-yellow" />
                        <span>CARICA LOGO</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      </label>
                    </div>
                    {renderCompressionFeedback('home-logo')}
                  </div>

                  {/* Logo Size Range Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono">
                      <span>Grandezza Logo:</span>
                      <span className="text-[#FFE600] font-bold">{societaSettings?.logoSizeDraft ?? societaSettings?.logoSize ?? 70}px</span>
                    </div>
                    <input 
                      type="range"
                      min="36"
                      max="140"
                      step="2"
                      value={societaSettings?.logoSizeDraft ?? societaSettings?.logoSize ?? 70}
                      onChange={(e) => handleSettingsLiveUpdate('logoSizeDraft', Number(e.target.value))}
                      className="w-full accent-[#FFE600] cursor-pointer"
                    />
                  </div>

                  {/* Navbar Title Size Slider */}
                  <div className="space-y-1.5 pt-1 border-t border-zinc-850/40">
                    <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono">
                      <span>Grandezza Titolo Header:</span>
                      <span className="text-[#FFE600] font-bold">{societaSettings?.navbarTitleSizeDraft ?? societaSettings?.navbarTitleSize ?? 34}px</span>
                    </div>
                    <input 
                      type="range"
                      min="18"
                      max="52"
                      step="1"
                      value={societaSettings?.navbarTitleSizeDraft ?? societaSettings?.navbarTitleSize ?? 34}
                      onChange={(e) => handleSettingsLiveUpdate('navbarTitleSizeDraft', Number(e.target.value))}
                      className="w-full accent-[#FFE600] cursor-pointer"
                    />
                  </div>

                  {/* Subtitle Toggle */}
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-850/40">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono">Sottotitolo Logo:</span>
                    <button
                      onClick={() => handleSettingsLiveUpdate('showSubtitleDraft', societaSettings?.showSubtitleDraft !== false ? false : true)}
                      className={`py-1 px-3.5 rounded text-[10px] font-sport uppercase tracking-wider transition-all font-bold ${
                        societaSettings?.showSubtitleDraft !== false 
                          ? 'bg-brand-yellow text-black' 
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-750'
                      }`}
                    >
                      {societaSettings?.showSubtitleDraft !== false ? 'ATTIVO' : 'NASCOSTO'}
                    </button>
                  </div>

                  {/* Subtitle Text Field */}
                  {societaSettings?.showSubtitleDraft !== false && (
                    <div className="space-y-1 pt-2 border-t border-zinc-850/40">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono">Testo Sottotitolo:</label>
                      <input 
                        type="text"
                        value={societaSettings?.navbarSubtitleDraft ?? ''}
                        onChange={(e) => handleSettingsLiveUpdate('navbarSubtitleDraft', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow text-xs rounded p-2 focus:outline-none text-white font-sans"
                        placeholder="Le Pantere della Bassa"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SECTION 2: HERO - TESTO */}
            <div className="border border-zinc-800 rounded-lg overflow-hidden bg-[#181818]">
              <button 
                onClick={() => toggleSection('hero_text')}
                className="w-full px-3.5 py-3 bg-zinc-900 flex items-center justify-between text-left border-b border-zinc-850 cursor-pointer"
              >
                <span className="font-bebas text-lg tracking-wider text-[#F5D800] uppercase font-bold">HERO - TESTI E CTA</span>
                {collapsedSections.hero_text ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronUp className="w-4 h-4 text-[#F5D800]" />}
              </button>
              
              {!collapsedSections.hero_text && (
                <div className="p-3.5 space-y-3.5">
                  {/* Eyebrow Tagline */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono">Testo Eyebrow (Tagline):</label>
                    <input 
                      type="text"
                      value={configHome?.heroTagline || ''}
                      onChange={(e) => handleConfigHomeLiveUpdate('heroTagline', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow text-xs rounded p-2 focus:outline-none text-white font-sans"
                      placeholder="FORLÌ · PALLAVOLO DAL BASSO IN ALTO"
                    />
                  </div>

                  {/* Main Title Hero */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono">Titolo Principale (Hero):</label>
                    <textarea 
                      rows={2}
                      value={configHome?.heroTitle || ''}
                      onChange={(e) => handleConfigHomeLiveUpdate('heroTitle', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow text-xs rounded p-2 focus:outline-none text-white font-sans"
                      placeholder="SI GIOCA IN GIALLO E NERO."
                    />
                  </div>

                  {/* Description Paragraph */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono">Paragrafo Descrizione:</label>
                    <textarea 
                      rows={3}
                      value={configHome?.heroDescription || ''}
                      onChange={(e) => handleConfigHomeLiveUpdate('heroDescription', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow text-xs rounded p-2 focus:outline-none text-white font-sans leading-relaxed"
                      placeholder="Due prime squadre in Serie D..."
                    />
                  </div>

                  {/* Paragraph Description Color Picker */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono">
                      <span>Colore Testo Paragrafo:</span>
                      <span className="text-white font-bold font-mono">{configHome?.heroDescriptionColor || '#ffffff'}</span>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="color"
                        value={configHome?.heroDescriptionColor || '#ffffff'}
                        onChange={(e) => handleConfigHomeLiveUpdate('heroDescriptionColor', e.target.value)}
                        className="w-10 h-8 bg-zinc-950 border border-zinc-850 rounded p-0.5 cursor-pointer"
                      />
                      <button 
                        onClick={() => handleConfigHomeLiveUpdate('heroDescriptionColor', '#ffffff')}
                        className="text-[9px] bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-zinc-300 font-mono px-2 rounded py-1 shrink-0 uppercase tracking-widest cursor-pointer"
                      >
                        Reset Bianco
                      </button>
                    </div>
                  </div>

                  {/* CTA 1 Text */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono">Pulsante CTA 1 (Testo):</label>
                    <input 
                      type="text"
                      value={configHome?.heroBtn1Text || ''}
                      onChange={(e) => handleConfigHomeLiveUpdate('heroBtn1Text', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow text-xs rounded p-2 focus:outline-none text-white font-sans"
                      placeholder="SCOPRI LE SQUADRE"
                    />
                  </div>

                  {/* CTA 1 Destination */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono">DESTINAZIONE PULSANTE:</label>
                    <select
                      value={configHome?.cta1Link || '/squadre'}
                      onChange={(e) => handleConfigHomeLiveUpdate('cta1Link', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow text-xs rounded p-2 focus:outline-none text-white font-sans"
                    >
                      <option value="/">Home</option>
                      <option value="/squadre">Le Squadre</option>
                      <option value="/camp-tornei/camp">Camp Estivi</option>
                      <option value="/camp-tornei/tornei">Tornei</option>
                      <option value="/societa">La Società</option>
                      <option value="/news">Archivio News</option>
                      <option value="/modulistica">Modulistica</option>
                      <option value="/sponsor">Sponsor & Partner</option>
                    </select>
                  </div>

                  {/* CTA 2 Text */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono">Pulsante CTA 2 (Testo):</label>
                    <input 
                      type="text"
                      value={configHome?.heroBtn2Text || ''}
                      onChange={(e) => handleConfigHomeLiveUpdate('heroBtn2Text', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow text-xs rounded p-2 focus:outline-none text-white font-sans"
                      placeholder="CAMP ESTIVO 2026"
                    />
                  </div>

                  {/* CTA 2 Destination */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono">DESTINAZIONE PULSANTE:</label>
                    <select
                      value={configHome?.cta2Link || '/camp-tornei/camp'}
                      onChange={(e) => handleConfigHomeLiveUpdate('cta2Link', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow text-xs rounded p-2 focus:outline-none text-white font-sans"
                    >
                      <option value="/">Home</option>
                      <option value="/squadre">Le Squadre</option>
                      <option value="/camp-tornei/camp">Camp Estivi</option>
                      <option value="/camp-tornei/tornei">Tornei</option>
                      <option value="/societa">La Società</option>
                      <option value="/news">Archivio News</option>
                      <option value="/modulistica">Modulistica</option>
                      <option value="/sponsor">Sponsor & Partner</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: HERO - COPERTINA */}
            <div className="border border-zinc-800 rounded-lg overflow-hidden bg-[#181818]">
              <button 
                onClick={() => toggleSection('hero_img')}
                className="w-full px-3.5 py-3 bg-zinc-900 flex items-center justify-between text-left border-b border-zinc-850 cursor-pointer"
              >
                <span className="font-bebas text-lg tracking-wider text-[#F5D800] uppercase font-bold">HERO - SFONDO E LAYOUT</span>
                {collapsedSections.hero_img ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronUp className="w-4 h-4 text-[#F5D800]" />}
              </button>
              
              {!collapsedSections.hero_img && (
                <div className="p-3.5 space-y-3.5">
                  {/* Hero Background Image Upload */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block font-mono">Carica Sfondo Hero:</label>
                    <label className="w-full bg-zinc-950 border border-zinc-800 rounded py-2 px-3 text-[11px] text-zinc-300 hover:text-white hover:border-brand-yellow transition-all cursor-pointer flex items-center justify-center gap-2">
                      <Upload className="w-3.5 h-3.5 text-brand-yellow" />
                      <span>CAMBIA FOTO HERO</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleHeroPhotoUpload} />
                    </label>
                    {renderCompressionFeedback('home-hero')}
                  </div>

                  {/* Vertical Position Range Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono">
                      <span>Posizionamento Verticale:</span>
                      <span className="text-[#F5D800] font-bold">{heroBgPositionY}%</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      value={Number(heroBgPositionY)}
                      onChange={(e) => handleConfigHomeLiveUpdate('heroBgPositionY', e.target.value)}
                      className="w-full accent-brand-yellow cursor-pointer"
                    />
                  </div>

                  {/* Horizontal Alignment Option */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block font-mono">Allineamento Contenuto:</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => handleConfigHomeLiveUpdate('heroAlignment', 'left')}
                        className={`py-1.5 rounded text-[10px] uppercase font-sport tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                          heroAlignment === 'left' 
                            ? 'bg-brand-yellow text-black font-bold' 
                            : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                        <span>SINISTRA</span>
                      </button>
                      <button
                        onClick={() => handleConfigHomeLiveUpdate('heroAlignment', 'center')}
                        className={`py-1.5 rounded text-[10px] uppercase font-sport tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                          heroAlignment === 'center' 
                            ? 'bg-brand-yellow text-black font-bold' 
                            : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                        <span>CENTRO</span>
                      </button>
                    </div>
                  </div>

                  {/* Font Preset Option */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block font-mono">Stile Carattere (Font):</label>
                    <select
                      value={configHome?.fontPreset || 'sport'}
                      onChange={(e) => handleConfigHomeLiveUpdate('fontPreset', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-white text-xs rounded p-2 focus:outline-none focus:border-brand-yellow font-mono cursor-pointer"
                    >
                      <option value="sport">Sportivo / Skew (Barlow)</option>
                      <option value="tech">Moderno / Grotesk (Space)</option>
                      <option value="serif">Editoriale / Serif (Playfair)</option>
                      <option value="mono">Brutalista / Mono (JetBrains)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3.5: STORIA — SOCIETÀ */}
            <div className="border border-zinc-800 rounded-lg overflow-hidden bg-[#181818]">
              <button 
                onClick={() => toggleSection('storia')}
                className="w-full px-3.5 py-3 bg-zinc-900 flex items-center justify-between text-left border-b border-zinc-850 cursor-pointer"
              >
                <span className="font-bebas text-lg tracking-wider text-[#F5D800] uppercase font-bold">STORIA — SOCIETÀ</span>
                {collapsedSections.storia ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronUp className="w-4 h-4 text-[#F5D800]" />}
              </button>
              
              {!collapsedSections.storia && (
                <div className="p-3.5 space-y-3.5">
                  {/* Title of the Story section */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono">Titolo Sezione Storia:</label>
                    <input 
                      type="text"
                      value={configHome?.storyTitle || ''}
                      onChange={(e) => handleConfigHomeLiveUpdate('storyTitle', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow text-xs rounded p-2 focus:outline-none text-white font-sans"
                      placeholder="La Nostra Storia"
                    />
                  </div>

                  {/* Description of the Story section */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono">Descrizione Sezione Storia:</label>
                    <textarea 
                      rows={4}
                      value={configHome?.storyDescription || ''}
                      onChange={(e) => handleConfigHomeLiveUpdate('storyDescription', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow text-xs rounded p-2 focus:outline-none text-white font-sans leading-relaxed"
                      placeholder="La New Volley Academy Forlì è nata nel 2018..."
                    />
                  </div>

                  {/* Story Image Upload */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block font-mono">Carica Foto Storia:</label>
                    <label className="w-full bg-zinc-950 border border-zinc-800 rounded py-2 px-3 text-[11px] text-zinc-300 hover:text-white hover:border-brand-yellow transition-all cursor-pointer flex items-center justify-center gap-2">
                      <Upload className="w-3.5 h-3.5 text-brand-yellow" />
                      <span>CAMBIA FOTO STORIA</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleStoryPhotoUpload} />
                    </label>
                    {renderCompressionFeedback('home-story')}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 4: TICKER NEWS */}
            <div className="border border-zinc-800 rounded-lg overflow-hidden bg-[#181818]">
              <button 
                onClick={() => toggleSection('ticker')}
                className="w-full px-3.5 py-3 bg-zinc-900 flex items-center justify-between text-left border-b border-zinc-850 cursor-pointer"
              >
                <span className="font-bebas text-lg tracking-wider text-[#F5D800] uppercase font-bold">TICKER NEWS SCROLL</span>
                {collapsedSections.ticker ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronUp className="w-4 h-4 text-[#F5D800]" />}
              </button>
              
              {!collapsedSections.ticker && (
                <div className="p-3.5 space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono block">Lista Annunci Scorrevoli:</span>
                    
                    {(() => {
                      const currentAnnouncements = societaSettings?.tickerAnnouncementsDraft || [];
                      return (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {currentAnnouncements.map((ann, index) => (
                            <div key={index} className="flex items-center gap-1.5">
                              <input 
                                type="text"
                                value={ann}
                                onChange={(e) => {
                                  const listCopy = [...currentAnnouncements];
                                  listCopy[index] = e.target.value;
                                  handleSettingsLiveUpdate('tickerAnnouncementsDraft', listCopy);
                                }}
                                className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-brand-yellow text-xs rounded p-1.5 text-white font-sans"
                                placeholder={`Annuncio ${index + 1}`}
                              />
                              <button
                                onClick={() => {
                                  const listCopy = currentAnnouncements.filter((_, i) => i !== index);
                                  handleSettingsLiveUpdate('tickerAnnouncementsDraft', listCopy);
                                }}
                                className="bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-400 p-1.5 rounded transition-all cursor-pointer"
                                title="Elimina annuncio"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}

                          <button
                            onClick={() => {
                              const listCopy = [...currentAnnouncements, "NUOVO ANNUNCIO SOCIETARIO"];
                              handleSettingsLiveUpdate('tickerAnnouncementsDraft', listCopy);
                            }}
                            className="w-full mt-2 bg-zinc-900 hover:bg-zinc-850 hover:text-brand-yellow border border-dashed border-zinc-800 text-zinc-400 text-[10px] font-sport uppercase py-1.5 rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Aggiungi Annuncio</span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 5: PROSSIMA GARA SCOREBOARD */}
            <div className="border border-zinc-800 rounded-lg overflow-hidden bg-[#181818]">
              <button 
                onClick={() => toggleSection('scoreboard')}
                className="w-full px-3.5 py-3 bg-zinc-900 flex items-center justify-between text-left border-b border-zinc-850 cursor-pointer"
              >
                <span className="font-bebas text-lg tracking-wider text-[#F5D800] uppercase font-bold">SCOREBOARD PROSSIMA GARA</span>
                {collapsedSections.scoreboard ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronUp className="w-4 h-4 text-[#F5D800]" />}
              </button>
              
              {!collapsedSections.scoreboard && (
                <div className="p-3.5 space-y-3.5">
                  <div className="bg-zinc-950 border border-zinc-850/80 p-2 rounded text-center mb-1">
                    <p className="text-[9px] uppercase tracking-widest text-[#F5D800] font-sport italic font-black">
                      SELEZIONE PORTALE VISUALIZZATO:
                    </p>
                    <p className="text-[11px] font-mono font-bold text-zinc-300">
                      {selectedMatchCategory === 'D Maschile' ? 'Serie D Maschile' : 'Serie D Femminile'}
                    </p>
                  </div>

                  {(() => {
                    const activeMatchCategoryText = selectedMatchCategory === 'D Maschile' ? "Serie D Maschile" : "Serie D Femminile";
                    const match = prossimeGare.find(g => g?.categoria === activeMatchCategoryText);
                    if (!match) {
                      return (
                        <p className="text-[10px] text-zinc-500 text-center font-mono py-2">
                          Gara non trovata per la categoria.
                        </p>
                      );
                    }
                    return (
                      <div className="space-y-3">
                        
                        {/* Casa / Trasferta Radio Toggle */}
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block font-mono">NVA gioca in casa?</label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => handleScoreboardLiveUpdate(activeMatchCategoryText, 'casa', true)}
                              className={`py-1.5 rounded text-[10px] uppercase font-sport tracking-wider flex items-center justify-center gap-1 transition-all ${
                                match.casa 
                                  ? 'bg-brand-yellow text-black font-bold' 
                                  : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white'
                              }`}
                            >
                              SÌ (CASA)
                            </button>
                            <button
                              onClick={() => handleScoreboardLiveUpdate(activeMatchCategoryText, 'casa', false)}
                              className={`py-1.5 rounded text-[10px] uppercase font-sport tracking-wider flex items-center justify-center gap-1 transition-all ${
                                !match.casa 
                                  ? 'bg-brand-yellow text-black font-bold' 
                                  : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white'
                              }`}
                            >
                              NO (TRASFERTA)
                            </button>
                          </div>
                        </div>

                        {/* Custom Opponent Name */}
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono">Squadra Avversaria:</label>
                          <input 
                            type="text"
                            value={match.avversario || ''}
                            onChange={(e) => handleScoreboardLiveUpdate(activeMatchCategoryText, 'avversario', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow text-xs rounded p-2 focus:outline-none text-white font-sans"
                            placeholder="Nome squadra avversaria"
                          />
                        </div>

                        {/* Scores Grid */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono">Punti NVA (Set):</label>
                            <input 
                              type="number"
                              min="0"
                              max="3"
                              value={match.punti_nva !== null && match.punti_nva !== undefined ? match.punti_nva : ''}
                              onChange={(e) => handleScoreboardLiveUpdate(activeMatchCategoryText, 'punti_nva', e.target.value !== '' ? Number(e.target.value) : null)}
                              className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow text-xs rounded p-2 focus:outline-none text-white font-sans"
                              placeholder="-"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono">Punti Avversario:</label>
                            <input 
                              type="number"
                              min="0"
                              max="3"
                              value={match.punti_avversario !== null && match.punti_avversario !== undefined ? match.punti_avversario : ''}
                              onChange={(e) => handleScoreboardLiveUpdate(activeMatchCategoryText, 'punti_avversario', e.target.value !== '' ? Number(e.target.value) : null)}
                              className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow text-xs rounded p-2 focus:outline-none text-white font-sans"
                              placeholder="-"
                            />
                          </div>
                        </div>

                        {/* Date and Time */}
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono">Data e Orario:</label>
                          <input 
                            type="text"
                            value={match.data_ora || ''}
                            onChange={(e) => handleScoreboardLiveUpdate(activeMatchCategoryText, 'data_ora', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow text-xs rounded p-2 focus:outline-none text-white font-sans"
                            placeholder="Sabato 18 Ottobre, ore 18:00"
                          />
                        </div>

                        {/* Gymnasium Venue */}
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono">Palestra / Luogo:</label>
                          <input 
                            type="text"
                            value={match.luogo || ''}
                            onChange={(e) => handleScoreboardLiveUpdate(activeMatchCategoryText, 'luogo', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow text-xs rounded p-2 focus:outline-none text-white font-sans"
                            placeholder="PalaNove, Forlì"
                          />
                        </div>

                        {/* Matchday Label */}
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono">Giornata / Girone:</label>
                          <input 
                            type="text"
                            value={match.giornata || ''}
                            onChange={(e) => handleScoreboardLiveUpdate(activeMatchCategoryText, 'giornata', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow text-xs rounded p-2 focus:outline-none text-white font-sans"
                            placeholder="1ª GIORNATA - GIRONE A"
                          />
                        </div>

                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* SECTION 6: FOOTER & INFORMAZIONI */}
            <div className="border border-zinc-800 rounded-lg overflow-hidden bg-[#181818]">
              <button 
                onClick={() => toggleSection('footer')}
                className="w-full px-3.5 py-3 bg-zinc-900 flex items-center justify-between text-left border-b border-zinc-850 cursor-pointer"
              >
                <span className="font-bebas text-lg tracking-wider text-[#F5D800] uppercase font-bold">FOOTER & INFORMAZIONI</span>
                {collapsedSections.footer ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronUp className="w-4 h-4 text-[#F5D800]" />}
              </button>
              
              {!collapsedSections.footer && (
                <div className="p-3.5 space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono">Descrizione Footer (Chi Siamo / Mission):</label>
                    <textarea 
                      rows={4}
                      value={societaSettings?.footerDescriptionDraft ?? societaSettings?.footerDescription ?? "Società sportiva dilettantistica di pallavolo a Forlì. Promuoviamo i valori dello sport e la crescita dei giovani atleti, dal minivolley e settore giovanile fino ai campionati regionali di Serie D."}
                      onChange={(e) => handleSettingsLiveUpdate('footerDescriptionDraft', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow text-xs rounded p-2 focus:outline-none text-white font-sans leading-relaxed"
                      placeholder="Descrizione societaria a piè di pagina..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono">Testo Copyright:</label>
                    <input 
                      type="text"
                      value={societaSettings?.footerCopyrightDraft ?? societaSettings?.footerCopyright ?? ''}
                      onChange={(e) => handleSettingsLiveUpdate('footerCopyrightDraft', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow text-xs rounded p-2 focus:outline-none text-white font-sans"
                      placeholder={`© ${new Date().getFullYear()} New Volley Academy...`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono">Crediti Sviluppo:</label>
                    <input 
                      type="text"
                      value={societaSettings?.footerCreditsDraft ?? societaSettings?.footerCredits ?? ''}
                      onChange={(e) => handleSettingsLiveUpdate('footerCreditsDraft', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-brand-yellow text-xs rounded p-2 focus:outline-none text-white font-sans"
                      placeholder="Sviluppato con React, Vite & Tailwind CSS."
                    />
                  </div>
                </div>
              )}
            </div>

          </div>
        </aside>
      )}

    </div>
  );
}
