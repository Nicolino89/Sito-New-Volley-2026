import React from 'react';

interface PlayerJerseyPlaceholderProps {
  numeroMaglia?: number | string;
  cognome?: string;
  isCapitano?: boolean;
  ruolo?: string;
  className?: string;
}

export const PlayerJerseyPlaceholder: React.FC<PlayerJerseyPlaceholderProps> = ({
  numeroMaglia = 0,
  cognome = '',
  isCapitano = false,
  ruolo = '',
  className = ''
}) => {
  const displayNum = String(numeroMaglia ?? '0');
  const displayCognome = cognome.trim().toUpperCase() || 'NVA PANTERE';
  const isLibero = ruolo.toLowerCase().includes('libero');

  // Colori divisa: Maglia classica (Nera con dettagli Giallo Brand) vs Maglia Libero (Giallo Brand con dettagli Neri)
  const jerseyBg = isLibero ? '#fcfe00' : '#141416';
  const jerseyAccent = isLibero ? '#09090b' : '#fcfe00';
  const numberFill = isLibero ? '#09090b' : '#ffffff';
  const numberStroke = isLibero ? '#ffffff' : '#fcfe00';
  const textFill = isLibero ? '#09090b' : '#e4e4e7';

  return (
    <div className={`relative w-full h-full bg-gradient-to-b from-[#18181b] via-[#0f0f11] to-[#09090b] flex flex-col items-center justify-center overflow-hidden select-none p-3 ${className}`}>
      
      {/* Sfondo Spogliatoio & Neon Radente */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent pointer-events-none" />
      
      {/* Linee Geometriche Sottili da Campo di Pallavolo */}
      <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="35%" x2="100%" y2="35%" stroke="#ffffff" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="0" y1="65%" x2="100%" y2="65%" stroke="#ffffff" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx="50%" cy="50%" r="60" fill="none" stroke="#ffffff" strokeWidth="1" />
      </svg>

      {/* SVG Maglia Ufficiale NVA */}
      <svg
        viewBox="0 0 200 240"
        className="w-full max-w-[210px] max-h-[225px] h-auto drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover:scale-105"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Texture tessuto microforato mesh */}
          <pattern id={`mesh-${displayNum}`} width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="0.8" fill="#ffffff" opacity="0.06" />
          </pattern>

          {/* Sfumatura corpo maglia */}
          <linearGradient id={`jerseyGrad-${displayNum}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isLibero ? '#ffff33' : '#222226'} />
            <stop offset="50%" stopColor={jerseyBg} />
            <stop offset="100%" stopColor={isLibero ? '#d4d600' : '#0c0c0e'} />
          </linearGradient>

          {/* Sfumatura inserti laterali */}
          <linearGradient id={`accentGrad-${displayNum}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={jerseyAccent} />
            <stop offset="100%" stopColor={isLibero ? '#18181b' : '#f59e0b'} />
          </linearGradient>
        </defs>

        {/* Appendino / Colletto Superiore */}
        <path
          d="M 68 22 Q 100 8 132 22"
          fill="none"
          stroke="#52525b"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Sagoma Principale Canotta / Maglia Gara */}
        <path
          d="M 52 28 
             L 76 28 
             Q 100 48 124 28 
             L 148 28 
             L 165 62 
             L 148 76 
             L 143 65 
             L 144 218 
             L 56 218 
             L 57 65 
             L 52 76 
             L 35 62 
             Z"
          fill={`url(#jerseyGrad-${displayNum})`}
          stroke="#27272a"
          strokeWidth="1.5"
        />

        {/* Texture Mesh Traspirante sulla maglia */}
        <path
          d="M 56 35 L 144 35 L 144 216 L 56 216 Z"
          fill={`url(#mesh-${displayNum})`}
          pointerEvents="none"
        />

        {/* Inserti Fianchi Giallo/Nero Pantera */}
        <path
          d="M 56 80 L 63 90 L 61 216 L 56 216 Z"
          fill={`url(#accentGrad-${displayNum})`}
        />
        <path
          d="M 144 80 L 137 90 L 139 216 L 144 216 Z"
          fill={`url(#accentGrad-${displayNum})`}
        />

        {/* Bordatura Scollo a V */}
        <path
          d="M 76 28 Q 100 50 124 28"
          fill="none"
          stroke={jerseyAccent}
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Giromanica Rifiniti */}
        <path
          d="M 148 28 Q 138 52 148 76"
          fill="none"
          stroke={jerseyAccent}
          strokeWidth="2.5"
        />
        <path
          d="M 52 28 Q 62 52 52 76"
          fill="none"
          stroke={jerseyAccent}
          strokeWidth="2.5"
        />

        {/* Stemma / Logo NVA sul Petto */}
        <g transform="translate(70, 52)">
          <circle cx="6" cy="6" r="5.5" fill={jerseyAccent} />
          <path d="M 4 8 L 8 4 M 4 4 L 8 8" stroke={isLibero ? '#ffffff' : '#000000'} strokeWidth="1.2" strokeLinecap="round" />
        </g>
        <text
          x="88"
          y="60"
          fill={textFill}
          fontSize="6.5"
          fontFamily="system-ui, sans-serif"
          fontWeight="900"
          letterSpacing="0.8"
        >
          NVA
        </text>

        {/* Dicitura Cognome o NVA sopra al numero */}
        <text
          x="100"
          y="84"
          textAnchor="middle"
          fill={textFill}
          fontSize={displayCognome.length > 10 ? "7.5" : "9"}
          fontFamily="system-ui, sans-serif"
          fontWeight="800"
          letterSpacing="1"
        >
          {displayCognome}
        </text>

        {/* NUMERO DI MAGLIA CENTRALE (Monumentale) */}
        <text
          x="100"
          y="152"
          textAnchor="middle"
          dominantBaseline="central"
          fill={numberFill}
          stroke={numberStroke}
          strokeWidth={displayNum.length > 1 ? "1.5" : "2"}
          fontSize={displayNum.length > 2 ? "60" : displayNum.length === 2 ? "74" : "84"}
          fontFamily="Barlow Condensed, Bebas Neue, Impact, sans-serif"
          fontWeight="900"
          letterSpacing="-1"
          style={{
            filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.85))'
          }}
        >
          {displayNum}
        </text>

        {/* Barra del Capitano sotto al numero */}
        {isCapitano && (
          <g transform="translate(80, 195)">
            <rect x="0" y="0" width="40" height="4.5" rx="1" fill="#fcfe00" />
            <rect x="1" y="1" width="38" height="2.5" rx="0.5" fill="#eab308" />
          </g>
        )}

        {/* Dicitura New Volley Academy sul fondo */}
        <text
          x="100"
          y="210"
          textAnchor="middle"
          fill={textFill}
          opacity="0.6"
          fontSize="5"
          fontFamily="system-ui, sans-serif"
          fontWeight="700"
          letterSpacing="1.5"
        >
          NEW VOLLEY ACADEMY
        </text>
      </svg>

      {/* Sfumatura inferiore per sfumare dolcemente sulla base */}
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

      {/* Didascalia di ruolo in fondo alla card se specificato */}
      {ruolo && (
        <span className="relative z-10 text-[10px] font-mono uppercase font-bold tracking-widest text-zinc-400 mt-1">
          {ruolo}
        </span>
      )}
    </div>
  );
};
export default PlayerJerseyPlaceholder;
