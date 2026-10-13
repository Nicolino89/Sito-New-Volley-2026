import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, ShieldCheck, Sliders, X, Check, ExternalLink, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'nva_cookie_consent_v1';
const CONSENT_MAX_AGE_DAYS = 365;

export interface CookieConsentData {
  necessary: boolean;
  analytics: boolean;
  timestamp: number;
  version: string;
}

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  // Helper to apply consent to Google Consent Mode v2
  const applyGtagConsent = (analyticsGranted: boolean) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: analyticsGranted ? 'granted' : 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      });
    }
  };

  useEffect(() => {
    // Check existing stored consent
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: CookieConsentData = JSON.parse(stored);
        const ageDays = (Date.now() - parsed.timestamp) / (1000 * 60 * 60 * 24);
        if (ageDays < CONSENT_MAX_AGE_DAYS) {
          setAnalyticsEnabled(parsed.analytics === true);
          applyGtagConsent(parsed.analytics === true);
          return;
        }
      }
    } catch (e) {
      console.warn('Errore lettura consenso cookie:', e);
    }

    // If no valid consent found, show banner with slight delay for smooth appearance
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 700);

    return () => clearTimeout(timer);
  }, []);

  // Listen for custom trigger to re-open preferences anytime (e.g. from footer or privacy page)
  useEffect(() => {
    const handleOpenPreferences = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: CookieConsentData = JSON.parse(stored);
          setAnalyticsEnabled(parsed.analytics === true);
        }
      } catch (e) {}
      setIsCustomizeOpen(true);
      setIsVisible(true);
    };

    window.addEventListener('nva_open_cookie_preferences', handleOpenPreferences);
    return () => {
      window.removeEventListener('nva_open_cookie_preferences', handleOpenPreferences);
    };
  }, []);

  const saveConsent = (analytics: boolean) => {
    const consent: CookieConsentData = {
      necessary: true,
      analytics,
      timestamp: Date.now(),
      version: '1.0'
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    } catch (e) {}

    applyGtagConsent(analytics);
    setAnalyticsEnabled(analytics);
    setIsVisible(false);
    setIsCustomizeOpen(false);
  };

  const handleAcceptAll = () => {
    saveConsent(true);
  };

  const handleRejectAll = () => {
    saveConsent(false);
  };

  const handleSaveCustom = () => {
    saveConsent(analyticsEnabled);
  };

  if (!isVisible && !isCustomizeOpen) return null;

  return (
    <AnimatePresence>
      {/* 1. MAIN FLOATING BANNER */}
      {isVisible && !isCustomizeOpen && (
        <motion.aside
          role="region"
          aria-label="Informativa e Consenso Cookie"
          initial={{ opacity: 0, y: 50, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="fixed bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-6 md:left-auto md:right-6 md:max-w-2xl z-[99999]"
        >
          <div className="bg-zinc-950/95 text-white border border-[#FFE600]/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden ring-1 ring-white/10">
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFE600] via-amber-400 to-[#FFE600]" />

            {/* Close button (counts as rejection of non-essential cookies as per Garante Privacy guidelines) */}
            <button
              onClick={handleRejectAll}
              className="absolute top-3.5 right-3.5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800/60 transition-colors cursor-pointer"
              title="Rifiuta e continua con i soli cookie tecnici"
              aria-label="Chiudi e rifiuta cookie non necessari"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-start gap-3 pr-7">
                <div className="w-10 h-10 rounded-xl bg-[#FFE600]/15 border border-[#FFE600]/30 flex items-center justify-center shrink-0 text-[#FFE600]">
                  <Cookie className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-barlow font-bold text-base sm:text-lg uppercase tracking-wide text-white leading-tight">
                    Informativa Cookie & Privacy
                  </h3>
                  <p className="text-[10px] font-mono text-[#FFE600] font-semibold uppercase tracking-wider">
                    New Volley Academy Forlì
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-zinc-300 font-inter leading-relaxed">
                Utilizziamo cookie tecnici indispensabili per il corretto funzionamento del sito e per garantire la velocità di caricamento delle rose e delle news. Previo tuo consenso, utilizziamo inoltre <strong>Google Analytics 4</strong> per comprendere in forma aggregata l'utilizzo del portale e migliorarne i servizi.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-zinc-850">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAcceptAll}
                    className="flex-1 sm:flex-initial bg-[#FFE600] hover:bg-yellow-400 text-black font-extrabold px-4 py-2.5 rounded-xl uppercase font-sport italic tracking-wider text-xs shadow-lg transition-transform active:scale-95 cursor-pointer"
                  >
                    Accetta Tutti
                  </button>
                  <button
                    type="button"
                    onClick={handleRejectAll}
                    className="flex-1 sm:flex-initial bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold px-3.5 py-2.5 rounded-xl uppercase font-sport italic tracking-wider text-xs border border-zinc-700 hover:border-zinc-600 transition-colors cursor-pointer"
                  >
                    Solo Tecnici
                  </button>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => setIsCustomizeOpen(true)}
                    className="text-xs text-zinc-400 hover:text-white font-medium flex items-center gap-1.5 underline-offset-4 hover:underline cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#FFE600]" />
                    <span>Personalizza</span>
                  </button>
                  <Link
                    to="/privacy"
                    className="text-xs text-zinc-400 hover:text-[#FFE600] font-medium flex items-center gap-1 underline-offset-4 hover:underline"
                  >
                    <span>Policy</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.aside>
      )}

      {/* 2. CUSTOMIZE PREFERENCES MODAL */}
      {isCustomizeOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCustomizeOpen(false)}
            className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-zinc-950 text-white border border-[#FFE600]/40 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 shadow-2xl"
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-zinc-800 flex items-center justify-between relative bg-zinc-900/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFE600]/15 border border-[#FFE600]/30 flex items-center justify-center text-[#FFE600]">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-barlow font-bold text-lg uppercase tracking-wide text-white">
                    Gestione Preferenze Cookie
                  </h3>
                  <p className="text-[11px] font-mono text-zinc-400">
                    Scegli quali categorie di cookie autorizzare
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomizeOpen(false)}
                className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 cursor-pointer transition-colors"
                aria-label="Chiudi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="overflow-y-auto p-5 sm:p-6 space-y-4">
              <p className="text-xs text-zinc-300 font-inter leading-relaxed">
                In conformità al Regolamento UE 2016/679 (GDPR) e alle Linee Guida del Garante per la protezione dei dati personali, puoi selezionare o revocare il consenso per ciascuna finalità di trattamento.
              </p>

              {/* Category 1: Technical & Necessary */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <h4 className="font-barlow font-bold text-sm uppercase tracking-wide text-white">
                      Cookie Tecnici & Funzionali
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Sempre Attivi
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-inter leading-relaxed">
                  Necessari per il funzionamento essenziale della piattaforma: memorizzazione della sessione amministrativa protetta, sicurezza, salvataggio delle tue preferenze sui cookie e cache locale ad alte prestazioni per il caricamento istantaneo (0ms) dei calendari e delle rose. Non richiedono consenso preventivo.
                </p>
                <div className="text-[10px] font-mono text-zinc-500 pt-1 border-t border-zinc-800/60">
                  Fornitori: New Volley Academy Forlì, Firebase (Google LLC). Durata: sessione / fino a 1 anno.
                </div>
              </div>

              {/* Category 2: Analytics */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-2.5 hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Cookie className="w-4 h-4 text-[#FFE600] shrink-0" />
                    <h4 className="font-barlow font-bold text-sm uppercase tracking-wide text-white">
                      Cookie Analitici & Prestazioni
                    </h4>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={analyticsEnabled}
                      onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFE600] peer-checked:after:bg-slate-950"></div>
                  </label>
                </div>
                <p className="text-xs text-zinc-400 font-inter leading-relaxed">
                  Ci consentono di raccogliere dati statistici aggregati e anonimizzati sul numero di visite, sulle pagine più visualizzate e sull'efficacia delle comunicazioni. Vengono gestiti tramite Google Analytics 4 con mascheramento IP e rispetto di Google Consent Mode v2.
                </p>
                <div className="text-[10px] font-mono text-zinc-500 pt-1 border-t border-zinc-800/60">
                  Fornitore: Google LLC (Google Analytics 4 - ID: G-6P73ZYB8BL). Durata: fino a 2 anni.
                </div>
              </div>

              {/* Info Box */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-200/90 font-inter">
                <Info className="w-4 h-4 text-[#FFE600] shrink-0 mt-0.5" />
                <p>
                  Puoi modificare o revocare la tua scelta in qualsiasi momento tramite il link <strong>"Preferenze Cookie"</strong> presente nel footer di ogni pagina del portale.
                </p>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-6 border-t border-zinc-800 bg-zinc-900/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <Link
                to="/privacy"
                onClick={() => setIsCustomizeOpen(false)}
                className="text-xs text-zinc-400 hover:text-[#FFE600] flex items-center justify-center sm:justify-start gap-1.5 underline-offset-4 hover:underline"
              >
                <span>Leggi la Privacy & Cookie Policy completa</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRejectAll}
                  className="flex-1 sm:flex-initial bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-4 py-2.5 rounded-xl uppercase font-sport italic tracking-wider text-xs border border-zinc-700 transition-colors cursor-pointer"
                >
                  Rifiuta Tutti
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="flex-1 sm:flex-initial bg-[#FFE600] hover:bg-yellow-400 text-black font-black px-5 py-2.5 rounded-xl uppercase font-sport italic tracking-wider text-xs shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Salva Scelte</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
