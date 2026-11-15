import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Radio } from 'lucide-react';
import { getDirettaStreaming, DirettaStreaming } from '../firebase-societa';

export const DirettaLivePill: React.FC = () => {
  const location = useLocation();
  const isDirettaPage = location.pathname.startsWith('/diretta') || location.pathname.startsWith('/live');
  const [diretta, setDiretta] = useState<DirettaStreaming | null>(null);

  useEffect(() => {
    getDirettaStreaming()
      .then(d => setDiretta(d))
      .catch(() => {});
  }, [location.pathname]);

  const isDoppia = Boolean(diretta?.doppia_diretta);
  const isC1Active = isDoppia && Boolean(diretta?.canale_1?.attiva && (diretta?.canale_1?.stato === 'live' || diretta?.canale_1?.stato === 'in_programma'));
  const isC2Active = isDoppia && Boolean(diretta?.canale_2?.attiva && (diretta?.canale_2?.stato === 'live' || diretta?.canale_2?.stato === 'in_programma'));
  const isSingleActive = !isDoppia && Boolean(diretta?.attiva && (diretta?.stato === 'live' || diretta?.stato === 'in_programma'));
  const isExtraActive = Boolean(diretta?.canale_extra?.attiva && (diretta?.canale_extra?.stato === 'live' || diretta?.canale_extra?.stato === 'in_programma'));

  const isEffectivelyActive = isC1Active || isC2Active || isSingleActive || isExtraActive;

  if (isDirettaPage || !isEffectivelyActive || !diretta) {
    return null;
  }

  // Almeno un canale è LIVE adesso
  const isLiveNow = (isDoppia && (diretta.canale_1?.stato === 'live' || diretta.canale_2?.stato === 'live')) ||
    diretta.stato === 'live' ||
    (isExtraActive && diretta.canale_extra?.stato === 'live');

  // Destinazione URL diretta: se solo l'extra è attivo, porta a ?canale=extra
  let targetUrl = '/diretta';
  if (isExtraActive && !isC1Active && !isC2Active && !isSingleActive) {
    targetUrl = '/diretta?canale=extra';
  } else if (isC1Active && !isC2Active) {
    targetUrl = '/diretta?canale=maschile';
  } else if (isC2Active && !isC1Active) {
    targetUrl = '/diretta?canale=femminile';
  }

  // Label descrittiva
  let label = 'GUARDA LA PARTITA';
  const activeCount = [isC1Active, isC2Active, isSingleActive, isExtraActive].filter(Boolean).length;
  if (activeCount > 1) {
    label = `${activeCount} PARTITE STREAMING`;
  } else if (isExtraActive && !isC1Active && !isC2Active && !isSingleActive && diretta.canale_extra?.categoria) {
    label = diretta.canale_extra.categoria.toUpperCase();
  } else if (diretta.doppia_diretta) {
    label = '2 PARTITE IN DIRETTA';
  }

  return (
    <Link
      to={targetUrl}
      aria-label="Segui la diretta streaming della partita"
      id="diretta-live-pill"
      className="flex items-center gap-2 pl-3 sm:pl-4 pr-3 sm:pr-4 py-1.5 sm:py-2 select-none cursor-pointer transition-all duration-300 group max-w-full hover:brightness-115 sm:hover:translate-x-1 hover:shadow-[5px_8px_25px_rgba(220,38,38,0.5)]"
      style={{
        backgroundColor: isLiveNow ? '#DC2626' : '#B45309',
        borderRadius: '0 20px 20px 0',
        boxShadow: '3px 4px 14px rgba(0, 0, 0, 0.45)',
      }}
    >
      {/* Indicatore antenna / radio con pulse */}
      <div className="w-[22px] h-[22px] sm:w-[26px] sm:h-[26px] rounded-full flex items-center justify-center shrink-0 bg-white/20">
        <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white animate-pulse" />
      </div>

      {/* Testo del live */}
      <div className="flex flex-col text-left leading-tight pr-1">
        <span 
          className="text-[8px] sm:text-[9px] uppercase tracking-wider text-white/90 font-mono font-bold flex items-center gap-1"
        >
          {isLiveNow ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              IN DIRETTA ORA
            </>
          ) : (
            'STREAMING MATCH'
          )}
        </span>
        <span 
          className="text-[10px] sm:text-[12px] font-black uppercase text-white tracking-wide font-sport truncate max-w-[170px]"
        >
          {label}
        </span>
      </div>
    </Link>
  );
};

export default DirettaLivePill;
