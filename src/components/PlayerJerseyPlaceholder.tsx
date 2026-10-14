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
  const textFill = isLibero ? '#09090b' : '#e4e4e7';

  // Identificativo univoco per pattern e maschere SVG
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

      {/* SVG Maglia Ufficiale NVA */}
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

          {/* MASCHERA DI SFUMATURA AVANZATA: sfuma delicatamente tutti i 4 bordi del rettangolo della Pantera */}
          <mask id={`pantherMask-${uid}`} maskUnits="userSpaceOnUse" x="50" y="80" width="100" height="116">
            {/* Gradiente Radiale che dissolve i bordi a 0 opacità su tutti i lati */}
            <radialGradient id={`pantherRadial-${uid}`} cx="50%" cy="48%" r="48%" fx="50%" fy="48%">
              <stop offset="25%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="55%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="72%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="88%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
            <rect x="50" y="80" width="100" height="116" fill={`url(#pantherRadial-${uid})`} />
          </mask>
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

        {/* SPALLA SINISTRA (angolo sinistro sopra al cognome): NUMERO DI MAGLIA ATLETICO */}
        {hasValidNumber && (
          <g transform="translate(63, 44)">
            <rect
              x="-10"
              y="-10"
              width="20"
              height="20"
              rx="4.5"
              fill={jerseyAccent}
              stroke={isLibero ? '#09090b' : '#000000'}
              strokeWidth="0.8"
              style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.85))' }}
            />
            <text
              x="0"
              y="1"
              textAnchor="middle"
              dominantBaseline="central"
              fill={isLibero ? '#fcfe00' : '#09090b'}
              fontSize={displayNum.length > 2 ? "10" : displayNum.length === 2 ? "12" : "13.5"}
              fontFamily="Barlow Condensed, Bebas Neue, Impact, sans-serif"
              fontWeight="900"
              letterSpacing="-0.5"
            >
              {displayNum}
            </text>
          </g>
        )}

        {/* SPALLA DESTRA (sopra al cognome): STEMMA UFFICIALE NVA */}
        <g transform="translate(137, 44)">
          <circle
            cx="0"
            cy="0"
            r="7.5"
            fill={isLibero ? '#09090b' : '#18181b'}
            stroke={jerseyAccent}
            strokeWidth="1"
            style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.8))' }}
          />
          <text
            x="0"
            y="0.5"
            textAnchor="middle"
            dominantBaseline="central"
            fill={jerseyAccent}
            fontSize="6"
            fontFamily="system-ui, sans-serif"
            fontWeight="900"
            letterSpacing="0.5"
          >
            NVA
          </text>
        </g>

        {/* Dicitura Cognome Atleta sopra al petto */}
        <text
          x="100"
          y="74"
          textAnchor="middle"
          fill={textFill}
          fontSize={displayCognome.length > 12 ? "7" : displayCognome.length > 8 ? "8" : "9.5"}
          fontFamily="system-ui, sans-serif"
          fontWeight="800"
          letterSpacing="1"
        >
          {displayCognome}
        </text>

        {/* Barra del Capitano sotto al cognome se designato capitano */}
        {isCapitano && (
          <g transform="translate(82, 80)">
            <rect x="0" y="0" width="36" height="3" rx="1" fill="#fcfe00" />
            <rect x="0.5" y="0.5" width="35" height="2" rx="0.5" fill="#eab308" />
          </g>
        )}

        {/* ZONA CENTRALE: LA PANTERA NVA IN TUTTE LE MAGLIE (completamente integrata e sfumata) */}
        <g>
          {/* Aureola dorata soffusa dietro alla pantera */}
          <circle
            cx="100"
            cy="138"
            r="42"
            fill={jerseyAccent}
            opacity={isLibero ? "0.08" : "0.15"}
            className="pointer-events-none"
          />

          {/* Immagine Pantera con maschera radiale: elimina qualsiasi bordo rettangolare */}
          <image
            href="/images/pantera-hero.png"
            x="52"
            y="84"
            width="96"
            height="112"
            preserveAspectRatio="xMidYMid meet"
            mask={`url(#pantherMask-${uid})`}
            style={{
              mixBlendMode: isLibero ? 'multiply' : 'normal',
              filter: isLibero ? 'contrast(1.15) brightness(0.9)' : 'contrast(1.1) brightness(1.05)'
            }}
          />

          {/* Gradiente protettivo supplementare per fondere la base e il top nel colore esatto della maglia */}
          <rect
            x="56"
            y="84"
            width="88"
            height="112"
            fill={`url(#jerseyGrad-${uid})`}
            opacity="0.12"
            pointerEvents="none"
          />
        </g>

        {/* Scritta PANTERE sotto alla figura */}
        <text
          x="100"
          y="196"
          textAnchor="middle"
          fill={jerseyAccent}
          fontSize="7.5"
          fontFamily="system-ui, sans-serif"
          fontWeight="900"
          letterSpacing="2.5"
        >
          PANTERE
        </text>

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
