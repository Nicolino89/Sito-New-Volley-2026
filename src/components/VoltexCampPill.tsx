import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const VoltexCampPill: React.FC = () => {
  const location = useLocation();
  const isVoltexPage = location.pathname.startsWith('/voltex');

  if (isVoltexPage) {
    return null;
  }

  return (
    <Link
      to="/voltex"
      aria-label="Voltex Academy Summer Camp - Scopri il camp ufficiale by Valentina Diouf"
      id="voltex-camp-pill"
      className={`flex items-center gap-2.5 sm:gap-3 pl-3 sm:pl-4 pr-3 sm:pr-4 py-2 sm:py-2.5 select-none cursor-pointer transition-all duration-300 group ${
        isVoltexPage 
          ? 'ring-2 ring-amber-300 shadow-[-6px_10px_28px_rgba(192,57,43,0.65)] scale-105' 
          : 'hover:brightness-115 hover:-translate-x-1.5 hover:shadow-[-5px_8px_25px_rgba(192,57,43,0.5)]'
      }`}
      style={{
        backgroundColor: '#C0392B',
        borderRadius: '25px 0 0 25px',
        boxShadow: '-4px 5px 16px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Cerchio logo con sfondo semi-trasparente bianco */}
      <div 
        className="w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0 p-0.5 overflow-hidden transition-transform duration-200 group-hover:scale-105 bg-white/20"
      >
        <img 
          src="/images/voltex-logo.png" 
          alt="Logo Voltex Camp" 
          className="w-full h-full object-contain rounded-full"
          loading="eager"
        />
      </div>

      {/* Due righe di testo impilate */}
      <div className="flex flex-col text-left leading-tight pr-0.5 sm:pr-1">
        <span 
          className="text-[9px] sm:text-[10px] uppercase tracking-wider text-amber-200/90 font-bold"
          style={{ letterSpacing: '0.08em' }}
        >
          SUMMER CAMP
        </span>
        <span 
          className="text-[12px] sm:text-[13px] font-black uppercase text-white tracking-wide flex items-center gap-1"
          style={{ fontWeight: 900 }}
        >
          VOLTEX
          {isVoltexPage && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping inline-block" />
          )}
        </span>
      </div>
    </Link>
  );
};

export default VoltexCampPill;
