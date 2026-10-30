import React, { useState } from 'react';
import { OFFICIAL_NVA_LOGO, getKnownTeamLogo, cleanTeamDisplayName, getTeamInitials } from '../firebase-societa';

interface TeamLogoBadgeProps {
  teamName: string;
  logoUrl?: string | null;
  isMyTeam?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export default function TeamLogoBadge({
  teamName,
  logoUrl,
  isMyTeam = false,
  size = 'sm',
  className = ''
}: TeamLogoBadgeProps) {
  const [imgError, setImgError] = useState(false);
  const cleanName = cleanTeamDisplayName(teamName);

  const sizeClasses = {
    xs: 'w-4 h-4 text-[9px]',
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-7 h-7 text-xs',
    lg: 'w-10 h-10 text-sm font-black'
  }[size];

  // 1. Il nostro club NVA usa sempre il logo ufficiale in alta definizione
  const isClub = isMyTeam || cleanName.toUpperCase().includes('NEW VOLLEY') || cleanName.toUpperCase().includes('NVA') || cleanName.toUpperCase().includes('SALFEP');
  if (isClub) {
    return (
      <img
        src={OFFICIAL_NVA_LOGO}
        alt="New Volley Academy"
        className={`${sizeClasses} object-contain shrink-0 ${className}`}
        loading="lazy"
        decoding="async"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/logo.png';
        }}
      />
    );
  }

  // 2. Controllo logo noto registrato localmente
  const knownLogo = getKnownTeamLogo(cleanName);
  const finalLogoUrl = !imgError && (knownLogo || (logoUrl && logoUrl !== '/logo.png' && !logoUrl.includes('ico_') ? logoUrl : null));

  if (finalLogoUrl) {
    return (
      <img
        src={finalLogoUrl}
        alt={cleanName}
        referrerPolicy="no-referrer"
        className={`${sizeClasses} object-contain shrink-0 ${className}`}
        loading="lazy"
        decoding="async"
        onError={() => setImgError(true)}
      />
    );
  }

  // 3. Fallback: Scudetto / Badge Sportivo con Iniziali dinamiche
  const initials = getTeamInitials(cleanName);

  return (
    <div 
      className={`${sizeClasses} rounded-md bg-gradient-to-br from-zinc-800 to-zinc-950 border border-zinc-700/80 flex items-center justify-center font-sport font-black uppercase text-amber-400 shrink-0 shadow-xs select-none tracking-tight ${className}`}
      title={cleanName}
    >
      <span>{initials}</span>
    </div>
  );
}
