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
  const rawNumStr = String(numeroMaglia ?? '').trim();
  const hasValidNumber = rawNumStr !== '' && rawNumStr !== '0' && rawNumStr !== 'undefined' && rawNumStr !== 'null';
  const displayNum = hasValidNumber ? rawNumStr : '';
  const displayCognome = cognome.trim().toUpperCase() || 'NVA PANTERE';
  const isLibero = ruolo.toLowerCase().includes('libero');

  // Colori divisa: Maglia classica (Nera con dettagli Giallo Brand) vs Maglia Libero (Giallo Brand con dettagli Neri)
  const jerseyBg = isLibero ? '#fcfe00' : '#141416';
  const jerseyAccent = isLibero ? '#09090b' : '#fcfe00';
  const numberFill = isLibero ? '#09090b' : '#ffffff';
  const numberStroke = isLibero ? '#ffffff' : '#fcfe00';
  const textFill = isLibero ? '#09090b' : '#e4e4e7';

  // Identificativo univoco per pattern SVG
  const uid = `${displayNum || 'pantera'}-${displayCognome.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div className={`relative w-full h-full bg-gradient-to-b from-[#18181b] via-[#0e0e10] to-[#08080a] flex flex-col items-center justify-center overflow-hidden select-none p-1 sm:p-2 ${className}`}>
      
      {/* Sfondo Spogliatoio & Neon Radente */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent pointer-events-none" />
      
      {/* Linee Geometriche Sottili da Campo di Pallavolo */}
      <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="35%" x2="100%" y2="35%" stroke="#ffffff" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="0" y1="65%" x2="100%" y2="65%" stroke="#ffffff" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx="50%" cy="50%" r="65" fill="none" stroke="#ffffff" strokeWidth="1" />
      </svg>

      {/* SVG Maglia Ufficiale NVA - Proporzioni ampliate per valorizzare la divisa */}
      <svg
        viewBox="25 8 150 216"
        className="w-[92%] max-w-[275px] max-h-[305px] h-auto drop-shadow-[0_16px_32px_rgba(0,0,0,0.85)] transition-transform duration-300 group-hover:scale-105"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Texture tessuto microforato mesh */}
          <pattern id={`mesh-${uid}`} width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="0.8" fill="#ffffff" opacity="0.06" />
          </pattern>

          {/* Sfumatura corpo maglia */}
          <linearGradient id={`jerseyGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isLibero ? '#ffff33' : '#222226'} />
            <stop offset="50%" stopColor={jerseyBg} />
            <stop offset="100%" stopColor={isLibero ? '#d4d600' : '#0c0c0e'} />
          </linearGradient>

          {/* Sfumatura inserti laterali */}
          <linearGradient id={`accentGrad-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={jerseyAccent} />
            <stop offset="100%" stopColor={isLibero ? '#18181b' : '#f59e0b'} />
          </linearGradient>

          {/* Glow dorato pantera centrale */}
          <radialGradient id={`pantherGlow-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={jerseyAccent} stopOpacity="0.4" />
            <stop offset="100%" stopColor={jerseyAccent} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Appendino / Colletto Superiore */}
        <path
          d="M 68 20 Q 100 6 132 20"
          fill="none"
          stroke="#52525b"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Sagoma Principale Canotta / Maglia Gara */}
        <path
          d="M 52 26 
             L 76 26 
             Q 100 46 124 26 
             L 148 26 
             L 165 60 
             L 148 74 
             L 143 63 
             L 144 216 
             L 56 216 
             L 57 63 
             L 52 74 
             L 35 60 
             Z"
          fill={`url(#jerseyGrad-${uid})`}
          stroke="#27272a"
          strokeWidth="1.5"
        />

        {/* Texture Mesh Traspirante sulla maglia */}
        <path
          d="M 56 33 L 144 33 L 144 214 L 56 214 Z"
          fill={`url(#mesh-${uid})`}
          pointerEvents="none"
        />

        {/* Inserti Fianchi Giallo/Nero Pantera */}
        <path
          d="M 56 78 L 63 88 L 61 214 L 56 214 Z"
          fill={`url(#accentGrad-${uid})`}
        />
        <path
          d="M 144 78 L 137 88 L 139 214 L 144 214 Z"
          fill={`url(#accentGrad-${uid})`}
        />

        {/* Bordatura Scollo a V */}
        <path
          d="M 76 26 Q 100 48 124 26"
          fill="none"
          stroke={jerseyAccent}
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Giromanica Rifiniti */}
        <path
          d="M 148 26 Q 138 50 148 74"
          fill="none"
          stroke={jerseyAccent}
          strokeWidth="2.5"
        />
        <path
          d="M 52 26 Q 62 50 52 74"
          fill="none"
          stroke={jerseyAccent}
          strokeWidth="2.5"
        />

        {/* Stemma Ufficiale Pantera NVA sul Petto */}
        <g transform="translate(67, 43)">
          <circle cx="8" cy="8" r="8" fill={isLibero ? '#09090b' : '#18181b'} stroke={jerseyAccent} strokeWidth="1" />
          <image
            href="/images/pantera-hero.png"
            x="1.5"
            y="1"
            width="13"
            height="14"
            preserveAspectRatio="xMidYMid meet"
          />
        </g>
        <text
          x="87"
          y="54"
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
          y="80"
          textAnchor="middle"
          fill={textFill}
          fontSize={displayCognome.length > 12 ? "7" : displayCognome.length > 8 ? "8" : "9.5"}
          fontFamily="system-ui, sans-serif"
          fontWeight="800"
          letterSpacing="1"
        >
          {displayCognome}
        </text>

        {/* ZONA CENTRALE: NUMERO UFFICIALE o PANTERA ICONICA (per atleti senza numero / minivolley) */}
        {hasValidNumber ? (
          <>
            {/* Filigrana Pantera sfumata nel tessuto */}
            <image
              href="/images/pantera-hero.png"
              x="65"
              y="98"
              width="70"
              height="70"
              opacity={isLibero ? "0.07" : "0.14"}
              preserveAspectRatio="xMidYMid meet"
              className="pointer-events-none"
            />

            {/* NUMERO DI MAGLIA CENTRALE (Monumentale) */}
            <text
              x="100"
              y="150"
              textAnchor="middle"
              dominantBaseline="central"
              fill={numberFill}
              stroke={numberStroke}
              strokeWidth={displayNum.length > 1 ? "1.5" : "2"}
              fontSize={displayNum.length > 2 ? "58" : displayNum.length === 2 ? "72" : "82"}
              fontFamily="Barlow Condensed, Bebas Neue, Impact, sans-serif"
              fontWeight="900"
              letterSpacing="-1"
              style={{
                filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.85))'
              }}
            >
              {displayNum}
            </text>
          </>
        ) : (
          /* Atleti senza numero (Minivolley, S3 o giovanili senza numero assegnato): Pantera Ufficiale in grande */
          <g transform="translate(63, 90)">
            {/* Aureola dorata soffusa */}
            <circle cx="37" cy="42" r="36" fill={`url(#pantherGlow-${uid})`} />
            <image
              href="/images/pantera-hero.png"
              x="2"
              y="4"
              width="70"
              height="76"
              preserveAspectRatio="xMidYMid meet"
              style={{
                filter: 'drop-shadow(0px 6px 14px rgba(0,0,0,0.95))'
              }}
            />
            {/* Scritta PANTERE sotto alla figura */}
            <text
              x="37"
              y="96"
              textAnchor="middle"
              fill={jerseyAccent}
              fontSize="8"
              fontFamily="system-ui, sans-serif"
              fontWeight="900"
              letterSpacing="2.5"
            >
              PANTERE
            </text>
          </g>
        )}

        {/* Barra del Capitano sotto al numero */}
        {isCapitano && hasValidNumber && (
          <g transform="translate(80, 192)">
            <rect x="0" y="0" width="40" height="4.5" rx="1" fill="#fcfe00" />
            <rect x="1" y="1" width="38" height="2.5" rx="0.5" fill="#eab308" />
          </g>
        )}

        {/* Dicitura New Volley Academy sul fondo */}
        <text
          x="100"
          y="208"
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
