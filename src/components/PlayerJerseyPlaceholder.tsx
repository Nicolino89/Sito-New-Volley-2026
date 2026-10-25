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
  const jerseyBg = isLibero ? '#facc15' : '#141416';
  const jerseyAccent = isLibero ? '#09090b' : '#fcfe00';
  const textFill = isLibero ? '#09090b' : '#ffffff';

  // Calcolo dinamico dimensione e scaling del cognome per massimo risalto grafico atletico
  const getCognomeFontSize = (len: number) => {
    if (len <= 5) return '15.5'; // es. FIORE, NERI
    if (len <= 7) return '14';   // es. SEVERI, GAROIA
    if (len <= 9) return '12.5'; // es. VERSARI, ZANOTTI
    if (len <= 11) return '11';  // es. VALMAGGI
    return '9.5';
  };
  const cognomeFontSize = getCognomeFontSize(displayCognome.length);
  const shouldLimitLength = displayCognome.length > 9;

  // Identificativo univoco per pattern e gradienti SVG
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
          {/* Clip-Path Sagoma Canotta: impedisce rigorosamente a qualsiasi elemento di sbordare */}
          <clipPath id={`jerseyClip-${uid}`}>
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
            />
          </clipPath>

          {/* Texture tessuto microforato mesh */}
          <pattern id={`mesh-${uid}`} width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="0.8" fill={isLibero ? '#000000' : '#ffffff'} opacity={isLibero ? 0.05 : 0.06} />
          </pattern>

          {/* Sfumatura corpo maglia */}
          <linearGradient id={`jerseyGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isLibero ? '#fff23a' : '#222226'} />
            <stop offset="50%" stopColor={jerseyBg} />
            <stop offset="100%" stopColor={isLibero ? '#eab308' : '#0c0c0e'} />
          </linearGradient>

          {/* Sfumatura inserti laterali */}
          <linearGradient id={`accentGrad-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={jerseyAccent} />
            <stop offset="100%" stopColor={isLibero ? '#18181b' : '#f59e0b'} />
          </linearGradient>

          {/* Sfumatura orizzontale (per maglia nera titolare con foto pantera) */}
          <linearGradient id={`pantherFadeX-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={jerseyBg} stopOpacity="1" />
            <stop offset="12%" stopColor={jerseyBg} stopOpacity="0.85" />
            <stop offset="28%" stopColor={jerseyBg} stopOpacity="0" />
            <stop offset="72%" stopColor={jerseyBg} stopOpacity="0" />
            <stop offset="88%" stopColor={jerseyBg} stopOpacity="0.85" />
            <stop offset="100%" stopColor={jerseyBg} stopOpacity="1" />
          </linearGradient>

          {/* Sfumatura verticale (per maglia nera titolare con foto pantera) */}
          <linearGradient id={`pantherFadeY-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={jerseyBg} stopOpacity="1" />
            <stop offset="10%" stopColor={jerseyBg} stopOpacity="0.85" />
            <stop offset="26%" stopColor={jerseyBg} stopOpacity="0" />
            <stop offset="74%" stopColor={jerseyBg} stopOpacity="0" />
            <stop offset="90%" stopColor={jerseyBg} stopOpacity="0.85" />
            <stop offset="100%" stopColor={jerseyBg} stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Appendino / Colletto Superiore */}
        <path
          d="M 68 20 Q 100 6 132 20"
          fill="none"
          stroke="#52525b"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* CONTENUTO INTERNO RITAGLIATO ALLA SAGOMA DELLA MAGLIA */}
        <g clipPath={`url(#jerseyClip-${uid})`}>
          {/* Fondo Maglia */}
          <rect x="0" y="0" width="200" height="230" fill={`url(#jerseyGrad-${uid})`} />

          {/* Texture Mesh Traspirante sulla maglia */}
          <rect x="0" y="0" width="200" height="230" fill={`url(#mesh-${uid})`} pointerEvents="none" />

          {/* Speed-Lines Geometriche Sportive (solo maglia Libero per dinamismo atletico) */}
          {isLibero && (
            <g opacity="0.08" pointerEvents="none">
              <path d="M 40 100 L 160 70 L 160 78 L 40 108 Z" fill="#000000" />
              <path d="M 40 115 L 160 85 L 160 96 L 40 126 Z" fill="#000000" />
              <path d="M 40 135 L 160 105 L 160 110 L 40 140 Z" fill="#000000" />
            </g>
          )}

          {/* Inserti Fianchi Giallo/Nero Pantera */}
          <path
            d="M 56 78 L 64 88 L 62 216 L 56 216 Z"
            fill={`url(#accentGrad-${uid})`}
          />
          <path
            d="M 144 78 L 136 88 L 138 216 L 144 216 Z"
            fill={`url(#accentGrad-${uid})`}
          />

          {/* Pinstripe sportivo di separazione fianco per maglia libero */}
          {isLibero && (
            <>
              <line x1="64" y1="88" x2="62" y2="216" stroke="#facc15" strokeWidth="1" opacity="0.6" />
              <line x1="136" y1="88" x2="138" y2="216" stroke="#facc15" strokeWidth="1" opacity="0.6" />
            </>
          )}

          {/* ZONA CENTRALE MAGLIA */}
          {isLibero ? (
            /* SOLUZIONE 1: MAGLIA GARA LIBERO CON GRANDE NUMERO ATLETICO FIPAV */
            <g>
              {hasValidNumber ? (
                <g transform="translate(100, 134)">
                  {/* Ombra di stacco dinamica 3D */}
                  <text
                    x="1.5"
                    y="2.5"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#ca8a04"
                    fontSize={displayNum.length > 2 ? "52" : displayNum.length === 2 ? "62" : "72"}
                    fontFamily="'Barlow Condensed', 'Bebas Neue', 'Anton', Impact, sans-serif"
                    fontWeight="900"
                    letterSpacing="-1.5"
                    opacity="0.35"
                  >
                    {displayNum}
                  </text>

                  {/* Grande Numero Atletico da Gara Nero Profondo */}
                  <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#09090b"
                    fontSize={displayNum.length > 2 ? "52" : displayNum.length === 2 ? "62" : "72"}
                    fontFamily="'Barlow Condensed', 'Bebas Neue', 'Anton', Impact, sans-serif"
                    fontWeight="900"
                    letterSpacing="-1.5"
                  >
                    {displayNum}
                  </text>

                  {/* Profilo interno sportivo tipo termosaldatura */}
                  <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="none"
                    stroke="#fef08a"
                    strokeWidth="0.8"
                    strokeDasharray="10 5"
                    fontSize={displayNum.length > 2 ? "52" : displayNum.length === 2 ? "62" : "72"}
                    fontFamily="'Barlow Condensed', 'Bebas Neue', 'Anton', Impact, sans-serif"
                    fontWeight="900"
                    letterSpacing="-1.5"
                    opacity="0.8"
                  >
                    {displayNum}
                  </text>
                </g>
              ) : (
                /* Se il giocatore non ha ancora un numero di maglia assegnato */
                <g transform="translate(100, 132)">
                  <circle cx="0" cy="0" r="28" fill="#09090b" stroke="#facc15" strokeWidth="2" />
                  <text
                    x="0"
                    y="1"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#facc15"
                    fontSize="18"
                    fontFamily="'Barlow Condensed', 'Bebas Neue', Impact, sans-serif"
                    fontWeight="900"
                    letterSpacing="1"
                  >
                    NVA
                  </text>
                </g>
              )}

              {/* Badge LIBERO sotto al numero */}
              <g transform="translate(100, 178)">
                <rect x="-30" y="-8" width="60" height="16" rx="4" fill="#09090b" />
                <text
                  x="0"
                  y="0.5"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#facc15"
                  fontSize="7.5"
                  fontFamily="system-ui, sans-serif"
                  fontWeight="900"
                  letterSpacing="2"
                >
                  LIBERO
                </text>
              </g>
            </g>
          ) : (
            /* MAGLIA TITOLARE NERA: LA PANTERA NVA CON SFUMATURA MORBIDA */
            <g>
              <image
                href="/images/pantera-hero.png"
                x="54"
                y="81"
                width="92"
                height="114"
                preserveAspectRatio="xMidYMid meet"
                style={{
                  mixBlendMode: 'normal',
                  filter: 'contrast(1.08) brightness(1.02)'
                }}
              />

              <rect
                x="53"
                y="80"
                width="94"
                height="116"
                fill={`url(#pantherFadeX-${uid})`}
                pointerEvents="none"
              />

              <rect
                x="53"
                y="80"
                width="94"
                height="116"
                fill={`url(#pantherFadeY-${uid})`}
                pointerEvents="none"
              />

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
            </g>
          )}
        </g>

        {/* BORDO ESTERNO SAGOMA CANOTTA */}
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
          fill="none"
          stroke={isLibero ? "#09090b" : "#27272a"}
          strokeWidth="1.6"
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

        {/* SPALLA SINISTRA (angolo sinistro sopra al cognome): BADGE O NUMERO */}
        {isLibero ? (
          <g transform="translate(68, 44)">
            <circle
              cx="0"
              cy="0"
              r="7.5"
              fill="#09090b"
              stroke="#facc15"
              strokeWidth="1"
              style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.6))' }}
            />
            <text
              x="0"
              y="0.5"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#facc15"
              fontSize="5.5"
              fontFamily="system-ui, sans-serif"
              fontWeight="900"
              letterSpacing="0.5"
            >
              NVA
            </text>
          </g>
        ) : (
          hasValidNumber && (
            <g transform="translate(63, 44)">
              <rect
                x="-10"
                y="-10"
                width="20"
                height="20"
                rx="4.5"
                fill={jerseyAccent}
                stroke="#000000"
                strokeWidth="0.8"
                style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.85))' }}
              />
              <text
                x="0"
                y="1"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#09090b"
                fontSize={displayNum.length > 2 ? "10" : displayNum.length === 2 ? "12" : "13.5"}
                fontFamily="Barlow Condensed, Bebas Neue, Impact, sans-serif"
                fontWeight="900"
                letterSpacing="-0.5"
              >
                {displayNum}
              </text>
            </g>
          )
        )}

        {/* SPALLA DESTRA (sopra al cognome): STEMMA UFFICIALE NVA O PALLAVOLO */}
        <g transform="translate(isLibero ? 132 : 137, 44)">
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
            fontSize={isLibero ? "7" : "6"}
            fontFamily="system-ui, sans-serif"
            fontWeight="900"
            letterSpacing={isLibero ? "0" : "0.5"}
          >
            {isLibero ? '🏐' : 'NVA'}
          </text>
        </g>

        {/* Dicitura Cognome Atleta ad alto impatto visivo atletico */}
        <text
          x="100"
          y="63.5"
          textAnchor="middle"
          dominantBaseline="central"
          fill={textFill}
          fontSize={cognomeFontSize}
          fontFamily="Barlow Condensed, Bebas Neue, Anton, Impact, sans-serif"
          fontWeight="900"
          letterSpacing="1.2"
          textLength={shouldLimitLength ? "74" : undefined}
          lengthAdjust={shouldLimitLength ? "spacingAndGlyphs" : undefined}
          style={{
            filter: isLibero ? 'none' : 'drop-shadow(0px 2px 4px rgba(0,0,0,0.95))'
          }}
        >
          {displayCognome}
        </text>

        {/* Barra del Capitano sotto al cognome se designato capitano */}
        {isCapitano && (
          <g transform="translate(80, 73.5)">
            <rect x="0" y="0" width="40" height="2.8" rx="1" fill={isLibero ? '#09090b' : '#fcfe00'} />
            <rect x="0.5" y="0.5" width="39" height="1.8" rx="0.5" fill={isLibero ? '#27272a' : '#eab308'} />
          </g>
        )}

        {/* Dicitura New Volley Academy sul fondo */}
        <text
          x="100"
          y="206"
          textAnchor="middle"
          fill={textFill}
          opacity={0.6}
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
