import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Non mostrare se già aperta in modalità standalone (PWA installata)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    if (isStandalone) return;

    // Controllo dismissione recente (silenzia per 5 giorni se chiusa)
    const dismissedAt = localStorage.getItem('nva_pwa_dismissed_at');
    if (dismissedAt) {
      const days = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (days < 5) return;
    }

    // Rilevamento iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isSafari = ua.includes('safari') && !ua.includes('crios') && !ua.includes('fxios') && !ua.includes('chrome');

    if (isIosDevice && isSafari) {
      setIsIos(true);
      // Su iOS mostra il banner dopo 4 secondi di navigazione per non essere invadenti
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 4000);
      return () => clearTimeout(timer);
    }

    // Listener Android / Desktop prima installazione
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Mostra dopo 3 secondi
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIosGuide(false);
    localStorage.setItem('nva_pwa_dismissed_at', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <>
      {/* Banner Bottom per l'installazione */}
      <aside 
        aria-label="Installa l'App New Volley Academy"
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 bg-zinc-950/95 backdrop-blur-md border border-amber-500/30 rounded-2xl p-4 shadow-2xl shadow-black/80 text-white animate-in fade-in slide-in-from-bottom duration-300"
      >
        <div className="flex items-start gap-3">
          <img 
            src="/logo.png" 
            alt="Logo New Volley Academy" 
            className="w-12 h-12 object-contain rounded-xl bg-black/60 p-1 border border-white/10 shrink-0" 
          />
          <div className="flex-1 min-w-0 pr-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5 leading-tight">
              <span>App New Volley</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400 text-black font-extrabold uppercase">PWA</span>
            </h4>
            <p className="text-xs text-zinc-300 mt-0.5 leading-snug">
              Installa l'app ufficiale: orari, risultati e live sempre a portata di tocco!
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={handleInstallClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold rounded-lg shadow-sm transition active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isIos ? 'Come installare' : 'Installa Ora'}</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1.5 transition"
              >
                Più tardi
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Chiudi avviso installazione"
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Modale con guida passo-passo per iPhone/iPad */}
      {showIosGuide && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowIosGuide(false)}
        >
          <div 
            className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 text-white shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <img src="/logo.png" alt="NVA" className="w-8 h-8 object-contain" />
                <h3 className="font-bold text-base text-white">Installa su iPhone / iPad</h3>
              </div>
              <button 
                onClick={() => setShowIosGuide(false)}
                className="text-zinc-400 hover:text-white p-1"
                aria-label="Chiudi guida"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-300">
              Aggiungi il sito alla schermata Home del tuo iPhone per aprirlo come una vera applicazione a schermo intero:
            </p>

            <ol className="space-y-3 text-xs text-zinc-200">
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 text-black font-black shrink-0 text-[11px]">1</span>
                <span>Tocca l'icona <strong>Condividi</strong> <Share className="w-4 h-4 inline-block text-amber-400 mx-1 align-sub" /> nella barra in basso di Safari.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 text-black font-black shrink-0 text-[11px]">2</span>
                <span>Scorri il menu verso il basso e seleziona <strong>Aggiungi alla schermata Home</strong> <PlusSquare className="w-4 h-4 inline-block text-amber-400 mx-1 align-sub" />.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 text-black font-black shrink-0 text-[11px]">3</span>
                <span>Premi <strong>Aggiungi</strong> in alto a destra. Troverai l'icona ufficiale delle Pantere tra le tue app!</span>
              </li>
            </ol>

            <button
              onClick={() => {
                setShowIosGuide(false);
                handleDismiss();
              }}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-xl text-xs transition"
            >
              Ho capito
            </button>
          </div>
        </div>
      )}
    </>
  );
}
