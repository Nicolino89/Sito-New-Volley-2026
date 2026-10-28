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

  if (isDirettaPage || !diretta || !diretta.attiva) {
    return null;
  }

  const isLiveNow = diretta.stato === 'live';

  return (
    <Link
      to="/diretta"
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
          className="text-[10px] sm:text-[12px] font-black uppercase text-white tracking-wide font-sport"
        >
          GUARDA LA PARTITA
        </span>
      </div>
    </Link>
  );
};

export default DirettaLivePill;
