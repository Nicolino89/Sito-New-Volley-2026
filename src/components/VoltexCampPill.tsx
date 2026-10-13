import React from 'react';

export const VoltexCampPill: React.FC = () => {
  const voltexUrl = "https://www.instagram.com/voltexcamp/";

  return (
    <a
      href={voltexUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Voltex Camp - scopri il camp estivo partner (link esterno)"
      id="voltex-camp-pill"
      className="flex items-center gap-2.5 sm:gap-3 pl-3 sm:pl-4 pr-3 sm:pr-4 py-2 sm:py-2.5 select-none cursor-pointer transition-all duration-200 hover:brightness-115 hover:-translate-x-1.5 hover:shadow-[-5px_8px_25px_rgba(192,57,43,0.5)] group"
      style={{
        backgroundColor: '#C0392B',
        borderRadius: '25px 0 0 25px',
        boxShadow: '-4px 5px 16px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Cerchio logo (aumentato da 26px a 32px) con sfondo semi-trasparente bianco */}
      <div 
        className="w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0 p-0.5 overflow-hidden transition-transform duration-200 group-hover:scale-105"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
      >
        <img 
          src="/images/voltex-logo.png" 
          alt="Logo Voltex Camp" 
          className="w-full h-full object-contain rounded-full"
          loading="eager"
        />
      </div>

      {/* Due righe di testo impilate (grandezza aumentata) */}
      <div className="flex flex-col text-left leading-tight pr-0.5 sm:pr-1">
        <span 
          className="text-[9px] sm:text-[10px] uppercase tracking-wider text-white/75 font-semibold"
          style={{ letterSpacing: '0.08em' }}
        >
          SUMMER CAMP
        </span>
        <span 
          className="text-[12px] sm:text-[13px] font-black uppercase text-white tracking-wide"
          style={{ fontWeight: 900 }}
        >
          VOLTEX
        </span>
      </div>
    </a>
  );
};

export default VoltexCampPill;
