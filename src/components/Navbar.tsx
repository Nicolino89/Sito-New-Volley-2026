import React, { useState } from 'react';
import { Lock, Shield, Menu, X, ArrowRight, ChevronDown, Trophy, Star, History, Users } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export type NavTabId = 'home' | 'squadre' | 'camp-tornei' | 'societa' | 'news-archive' | 'galleria' | 'modulistica' | 'albo-d-oro';

interface NavbarProps {
  logoUrl?: string;
  logoSize?: number;
  navbarTitle?: string;
  navbarTitleSize?: number;
  navbarSubtitle?: string;
  showSubtitle?: boolean;
  currentTab: NavTabId;
  setCurrentTab: (tab: NavTabId, subSection?: string) => void;
  isAdminMode: boolean;
  onToggleAdmin?: () => void;
  setSelectedPlayerHistory: (val: null) => void;
  onSettingsTextChange: (field: string, val: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  logoUrl,
  logoSize = 70,
  navbarTitle = 'NEW VOLLEY ACADEMY',
  navbarTitleSize = 28,
  navbarSubtitle = 'FORLÌ • VOLLEY CLUB UFFICIALE',
  showSubtitle = true,
  currentTab,
  setCurrentTab,
  isAdminMode,
  onToggleAdmin,
  setSelectedPlayerHistory,
  onSettingsTextChange
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [muroDropdownOpen, setMuroDropdownOpen] = useState(false);
  const [mobileMuroOpen, setMobileMuroOpen] = useState(false);
  const [squadreDropdownOpen, setSquadreDropdownOpen] = useState(false);
  const [mobileSquadreOpen, setMobileSquadreOpen] = useState(false);

  const currentLogoSize = Math.max(30, Math.min(Number(logoSize) || 60, 140));
  const currentTitleSize = Math.max(16, Math.min(Number(navbarTitleSize) || 28, 52));

  const navItems = [
    { id: 'home', label: 'HOME' },
    { id: 'squadre', label: 'SQUADRE' },
    { id: 'camp-tornei', label: 'CAMP & TORNEI' },
    { id: 'albo-d-oro', label: "MURO DEI FAMOSI" },
    { id: 'societa', label: 'LA SOCIETÀ' },
    { id: 'news-archive', label: 'NEWS' },
    { id: 'galleria', label: 'GALLERIA' },
  ];

  const handleNavClick = (id: string, subSection?: string) => {
    setCurrentTab(id as NavTabId, subSection);
    setSelectedPlayerHistory(null);
    setIsMobileMenuOpen(false);
    setMuroDropdownOpen(false);
    setSquadreDropdownOpen(false);
  };

  return (
    <header className="bg-[#0A0B0E] border-b border-zinc-850 relative z-40 w-full select-none" id="site-branding-header">
      
      {/* ========================================================================= */}
      {/* DESKTOP HEADER (Opzione 2C: Blocco Obliquo Giallo + Navigazione Estesa)    */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex flex-row items-center justify-between w-full h-[84px] overflow-visible">
        
        {/* Blocco Obliquo Giallo Sinistro */}
        <div 
          className="relative flex items-center cursor-pointer select-none shrink-0 h-full pl-5 sm:pl-8 pr-12 sm:pr-16"
          id="brand-identity"
          onClick={() => handleNavClick('home')}
        >
          {/* Sfondo trapezoidale giallo */}
          <div 
            className="absolute inset-0 bg-[#FFE600] z-0 pointer-events-none"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 30px) 0, 100% 100%, 0 100%)'
            }}
          />

          {/* Contenuto Logo + Testi */}
          <div className="relative z-10 flex items-center gap-3.5 sm:gap-4.5 h-full">
            {/* Logo */}
            <div className="flex items-center justify-center shrink-0">
              {logoUrl && logoUrl.trim() !== "" ? (
                <img 
                  src={logoUrl} 
                  alt="Logo NVA" 
                  style={{ 
                    height: `${currentLogoSize}px`,
                    width: 'auto'
                  }}
                  className="object-contain shrink-0 transition-transform hover:scale-105 drop-shadow-[0_2px_5px_rgba(0,0,0,0.65)]" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div 
                  style={{ 
                    height: `${currentLogoSize}px`, 
                    width: `${currentLogoSize}px`
                  }}
                  className="bg-zinc-950 border-2 border-black rounded-full flex items-center justify-center text-[#FFE600] font-black text-sm font-sport shrink-0 shadow-md"
                >
                  NVA
                </div>
              )}
            </div>

            {/* Testi Brand in Nero */}
            <div className="flex flex-col justify-center">
              <span 
                contentEditable={isAdminMode}
                suppressContentEditableWarning={true}
                onBlur={(e) => {
                  onSettingsTextChange('navbarTitleDraft', e.currentTarget.innerText.trim());
                }}
                style={{
                  fontSize: `${currentTitleSize}px`
                }}
                className={`font-black font-barlow tracking-wider uppercase text-black leading-none focus:outline-none focus:bg-yellow-400/50 ${
                  isAdminMode ? 'border border-dashed border-black/40 p-0.5 rounded cursor-text' : ''
                }`}
              >
                {navbarTitle}
              </span>
              {showSubtitle && (
                <span 
                  contentEditable={isAdminMode}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => {
                    onSettingsTextChange('navbarSubtitleDraft', e.currentTarget.innerText.trim());
                  }}
                  style={{
                    fontSize: `${Math.max(9, Math.round(currentTitleSize * 0.36))}px`
                  }}
                  className={`font-bold font-sport tracking-widest uppercase text-black/90 mt-1 focus:outline-none focus:bg-yellow-400/50 ${
                    isAdminMode 
                      ? 'border border-dashed border-black/40 p-0.5 rounded cursor-text' 
                      : ''
                  }`}
                >
                  {navbarSubtitle}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Navigazione Desktop su sfondo nero */}
        <div className="flex-1 bg-[#0A0B0E] flex items-center justify-end px-3 xl:px-8 gap-3 xl:gap-6 z-10 h-full">
          {!isAdminMode ? (
            <nav className="flex items-center gap-3.5 xl:gap-6 py-1" id="main-navigation">
              {navItems.map((item) => {
                const active = currentTab === item.id || (item.id === 'galleria' && currentTab === 'modulistica');

                if (item.id === 'squadre') {
                  return (
                    <div
                      key={item.id}
                      className="relative group py-2"
                      onMouseEnter={() => setSquadreDropdownOpen(true)}
                      onMouseLeave={() => setSquadreDropdownOpen(false)}
                    >
                      <button
                        id={`nav-${item.id}`}
                        onClick={() => handleNavClick('squadre')}
                        className={`font-barlow font-extrabold text-sm xl:text-base uppercase tracking-wider transition-all duration-150 relative py-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                          active
                            ? 'text-[#FFE600] font-black'
                            : 'text-zinc-300 hover:text-white'
                        }`}
                      >
                        <span>{item.label}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${squadreDropdownOpen ? 'rotate-180 text-[#FFE600]' : 'opacity-70'}`} />
                        {active && (
                          <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#FFE600] rounded-full shadow-[0_0_8px_rgba(255,230,0,0.8)]" />
                        )}
                      </button>

                      {/* DROPDOWN SQUADRE A SCOMPARSA (HOVER) */}
                      <div className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50 transition-all duration-200 ${
                        squadreDropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2 pointer-events-none'
                      }`}>
                        <div className="bg-[#0f1015] border border-[#FFE600]/40 rounded-2xl shadow-[0_20px_45px_rgba(0,0,0,0.95),0_0_25px_rgba(255,230,0,0.15)] backdrop-blur-xl p-2 w-64 space-y-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavClick('squadre');
                            }}
                            className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-zinc-800/90 transition-all text-left cursor-pointer group/sub"
                          >
                            <div className="p-2 rounded-lg bg-[#FFE600]/10 border border-[#FFE600]/30 text-[#FFE600] group-hover/sub:bg-[#FFE600] group-hover/sub:text-black transition-colors shrink-0">
                              <Users className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-barlow font-bold text-xs uppercase tracking-wider text-white group-hover/sub:text-[#FFE600] transition-colors">
                                Squadre in Corso
                              </p>
                              <p className="text-[10px] font-mono text-zinc-400">Stagione attuale, calendari e rose</p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavClick('squadre', 'archivio');
                            }}
                            className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-zinc-800/90 transition-all text-left cursor-pointer group/sub"
                          >
                            <div className="p-2 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-400 group-hover/sub:bg-amber-400 group-hover/sub:text-black transition-colors shrink-0">
                              <History className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-barlow font-bold text-xs uppercase tracking-wider text-white group-hover/sub:text-amber-400 transition-colors">
                                Archivio Storico Annate
                              </p>
                              <p className="text-[10px] font-mono text-zinc-400">Foto ufficiali e formazioni passate</p>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (item.id === 'albo-d-oro') {
                  return (
                    <div
                      key={item.id}
                      className="relative group py-2"
                      onMouseEnter={() => setMuroDropdownOpen(true)}
                      onMouseLeave={() => setMuroDropdownOpen(false)}
                    >
                      <button
                        id={`nav-${item.id}`}
                        onClick={() => handleNavClick('albo-d-oro')}
                        className={`font-barlow font-extrabold text-sm xl:text-base uppercase tracking-wider transition-all duration-150 relative py-2 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                          active
                            ? 'text-[#FFE600] font-black'
                            : 'text-zinc-300 hover:text-white'
                        }`}
                      >
                        <span>{item.label}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${muroDropdownOpen ? 'rotate-180 text-[#FFE600]' : 'opacity-70'}`} />
                        {active && (
                          <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#FFE600] rounded-full shadow-[0_0_8px_rgba(255,230,0,0.8)]" />
                        )}
                      </button>

                      {/* DROPDOWN A SCOMPARSA (HOVER) */}
                      <div className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50 transition-all duration-200 ${
                        muroDropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2 pointer-events-none'
                      }`}>
                        <div className="bg-[#0f1015] border border-amber-400/40 rounded-2xl shadow-[0_20px_45px_rgba(0,0,0,0.95),0_0_25px_rgba(245,158,11,0.15)] backdrop-blur-xl p-2 w-64 space-y-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavClick('albo-d-oro', 'nostri');
                            }}
                            className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-zinc-800/90 transition-all text-left cursor-pointer group/sub"
                          >
                            <div className="p-2 rounded-lg bg-[#FFE600]/10 border border-[#FFE600]/30 text-[#FFE600] group-hover/sub:bg-[#FFE600] group-hover/sub:text-black transition-colors shrink-0">
                              <Trophy className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-barlow font-bold text-xs uppercase tracking-wider text-white group-hover/sub:text-[#FFE600] transition-colors">
                                Albo d'Oro Pantere
                              </p>
                              <p className="text-[10px] font-mono text-zinc-400">Atlete e atleti premiati NVA</p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavClick('albo-d-oro', 'ospiti');
                            }}
                            className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-zinc-800/90 transition-all text-left cursor-pointer group/sub"
                          >
                            <div className="p-2 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-400 group-hover/sub:bg-amber-400 group-hover/sub:text-black transition-colors shrink-0">
                              <Star className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-barlow font-bold text-xs uppercase tracking-wider text-white group-hover/sub:text-amber-400 transition-colors">
                                Ospiti Illustri &amp; Leggende
                              </p>
                              <p className="text-[10px] font-mono text-zinc-400">Grandi campioni e personalità</p>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    onClick={() => handleNavClick(item.id)}
                    className={`font-barlow font-extrabold text-sm xl:text-base uppercase tracking-wider transition-all duration-150 relative py-2 cursor-pointer whitespace-nowrap ${
                      active
                        ? 'text-[#FFE600] font-black'
                        : 'text-zinc-300 hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                    {active && (
                      <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#FFE600] rounded-full shadow-[0_0_8px_rgba(255,230,0,0.8)]" />
                    )}
                  </button>
                );
              })}
            </nav>
          ) : (
            <div className="flex items-center gap-2.5 bg-[#FFE600]/10 border border-[#FFE600]/30 px-3.5 py-1.5 rounded-lg my-1" id="admin-mode-indicator">
              <Shield className="w-4 h-4 text-[#FFE600] animate-pulse" />
              <div>
                <p className="text-xs font-barlow font-black text-[#FFE600] tracking-wider uppercase">CMS AREA RISERVATA</p>
              </div>
            </div>
          )}

          {/* Admin Button Desktop */}
          {onToggleAdmin && (
            <button
              onClick={onToggleAdmin}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all font-bold text-xs uppercase tracking-wider cursor-pointer border whitespace-nowrap ${
                isAdminMode
                  ? 'bg-[#FFE600] text-black border-[#FFE600] shadow-[0_0_10px_rgba(255,230,0,0.4)]'
                  : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800 hover:border-zinc-700'
              }`}
              id="btn-navbar-admin"
              title={isAdminMode ? "Ritorna all'area pubblica" : "Accedi all'Area Riservata CMS"}
            >
              <Lock className={`w-3.5 h-3.5 ${isAdminMode ? 'text-black' : 'text-[#FFE600]'}`} />
              <span>{isAdminMode ? 'ESCI' : 'ADMIN'}</span>
            </button>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MOBILE HEADER (Blocco Compatto + Hamburger Menu Senza Overflow)           */}
      {/* ========================================================================= */}
      <div className="flex lg:hidden items-center justify-between w-full max-w-full h-[66px] sm:h-[72px] bg-[#0A0B0E] relative z-40 overflow-hidden">
        
        {/* Blocco Brand Giallo Compatto Mobile */}
        <div 
          className="relative flex items-center cursor-pointer select-none h-full pl-2.5 sm:pl-4 pr-5 sm:pr-8 flex-1 min-w-0 max-w-[calc(100%-85px)] overflow-hidden"
          onClick={() => handleNavClick('home')}
        >
          {/* Sfondo trapezoidale */}
          <div 
            className="absolute inset-0 bg-[#FFE600] z-0 pointer-events-none"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 100%, 0 100%)'
            }}
          />

          <div className="relative z-10 flex items-center gap-2 sm:gap-3 h-full min-w-0 overflow-hidden pr-2">
            {/* Logo Mobile */}
            <div className="flex items-center justify-center shrink-0">
              {logoUrl && logoUrl.trim() !== "" ? (
                <img 
                  src={logoUrl} 
                  alt="Logo NVA" 
                  className="h-10 sm:h-12 w-auto object-contain shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)]" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 bg-zinc-950 border-2 border-black rounded-full flex items-center justify-center text-[#FFE600] font-black text-xs font-sport shrink-0">
                  NVA
                </div>
              )}
            </div>

            {/* Testo Brand Mobile */}
            <div className="flex flex-col justify-center min-w-0 overflow-hidden pr-1">
              <span className="font-black font-barlow text-sm sm:text-base uppercase tracking-tight text-black leading-tight truncate">
                {navbarTitle}
              </span>
              {showSubtitle && (
                <span className="font-bold font-sport text-[9px] sm:text-[10px] uppercase tracking-wider text-black/85 leading-none truncate mt-0.5">
                  {navbarSubtitle}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tasti Destra Mobile (Admin + Hamburger) */}
        <div className="flex items-center gap-1.5 sm:gap-2 pr-2.5 sm:pr-4 shrink-0">
          {onToggleAdmin && (
            <button
              onClick={onToggleAdmin}
              className={`p-2 rounded-lg border transition-all ${
                isAdminMode 
                  ? 'bg-[#FFE600] text-black border-[#FFE600]' 
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800'
              }`}
              title="Admin"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-zinc-900 hover:bg-zinc-850 text-[#FFE600] border border-zinc-800 rounded-lg flex items-center justify-center transition-all cursor-pointer active:scale-95"
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MOBILE DRAWER ACCORDION MENU                                              */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden w-full bg-[#0D0E11] border-b border-zinc-800 shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-5 space-y-3">
              <nav className="flex flex-col space-y-1">
                {navItems.map((item) => {
                  const active = currentTab === item.id || (item.id === 'galleria' && currentTab === 'modulistica');

                  if (item.id === 'squadre') {
                    return (
                      <div key={item.id} className="space-y-1">
                        <div
                          className={`flex items-center justify-between w-full py-3 px-3.5 rounded-xl font-barlow font-bold text-base uppercase tracking-wider transition-all text-left cursor-pointer ${
                            active
                              ? 'bg-[#FFE600]/10 text-[#FFE600] font-black border-l-4 border-[#FFE600]'
                              : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                          }`}
                          onClick={() => setMobileSquadreOpen(!mobileSquadreOpen)}
                        >
                          <span>{item.label}</span>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileSquadreOpen ? 'rotate-180 text-[#FFE600]' : 'text-zinc-500'}`} />
                        </div>

                        {/* SUB-LINK SQUADRE MOBILE ACCORDION */}
                        {mobileSquadreOpen && (
                          <div className="pl-3 pr-1 py-1.5 space-y-1.5 border-l-2 border-[#FFE600]/30 ml-4">
                            <button
                              type="button"
                              onClick={() => handleNavClick('squadre')}
                              className="flex items-center gap-2.5 w-full py-2.5 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 transition-colors text-left cursor-pointer"
                            >
                              <Users className="w-3.5 h-3.5 text-[#FFE600]" />
                              <span>Squadre in Corso</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleNavClick('squadre', 'archivio')}
                              className="flex items-center gap-2.5 w-full py-2.5 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 transition-colors text-left cursor-pointer"
                            >
                              <History className="w-3.5 h-3.5 text-amber-400" />
                              <span>Archivio Storico Annate</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }

                if (item.id === 'albo-d-oro') {
                    return (
                      <div key={item.id} className="space-y-1">
                        <div
                          className={`flex items-center justify-between w-full py-3 px-3.5 rounded-xl font-barlow font-bold text-base uppercase tracking-wider transition-all text-left cursor-pointer ${
                            active
                              ? 'bg-[#FFE600]/10 text-[#FFE600] font-black border-l-4 border-[#FFE600]'
                              : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                          }`}
                          onClick={() => setMobileMuroOpen(!mobileMuroOpen)}
                        >
                          <span>{item.label}</span>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileMuroOpen ? 'rotate-180 text-[#FFE600]' : 'text-zinc-500'}`} />
                        </div>

                        {/* SUB-LINK MURO DEI FAMOSI MOBILE */}
                        {mobileMuroOpen && (
                          <div className="pl-3 pr-1 py-1.5 space-y-1.5 border-l-2 border-[#FFE600]/30 ml-4">
                            <button
                              type="button"
                              onClick={() => handleNavClick('albo-d-oro', 'nostri')}
                              className="flex items-center gap-2.5 w-full py-2.5 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 transition-colors text-left"
                            >
                              <Trophy className="w-3.5 h-3.5 text-[#FFE600]" />
                              <span>Albo d'Oro Pantere</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleNavClick('albo-d-oro', 'ospiti')}
                              className="flex items-center gap-2.5 w-full py-2.5 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 transition-colors text-left"
                            >
                              <Star className="w-3.5 h-3.5 text-amber-400" />
                              <span>Ospiti Illustri &amp; Leggende</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`flex items-center justify-between w-full py-3 px-3.5 rounded-xl font-barlow font-bold text-base uppercase tracking-wider transition-all text-left cursor-pointer ${
                        active
                          ? 'bg-[#FFE600]/10 text-[#FFE600] font-black border-l-4 border-[#FFE600]'
                          : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                      }`}
                    >
                      <span>{item.label}</span>
                      <ArrowRight className={`w-4 h-4 ${active ? 'text-[#FFE600]' : 'text-zinc-600'}`} />
                    </button>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-zinc-800/80 flex flex-col gap-2.5">

                <button
                  onClick={() => handleNavClick('camp-tornei')}
                  className="w-full bg-[#FFE600] hover:bg-[#ebd400] text-zinc-950 font-barlow font-black text-sm uppercase tracking-wider py-3 rounded-xl transition-all shadow-md shadow-[#FFE600]/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>ISCRIZIONI CAMP 2026</span>
                </button>

                {onToggleAdmin && (
                  <button
                    onClick={() => {
                      onToggleAdmin();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 text-zinc-500 hover:text-zinc-300 font-mono text-xs uppercase tracking-wider border border-zinc-850 rounded-lg hover:bg-zinc-900 transition-colors"
                  >
                    <Lock className="w-3 h-3 text-zinc-500" />
                    <span>{isAdminMode ? 'ESCI DA CMS' : 'ACCESSO ADMIN CMS'}</span>
                  </button>
                )}

                {isAdminMode && (
                  <div className="flex items-center gap-2 bg-[#FFE600]/10 border border-[#FFE600]/30 px-3.5 py-2 rounded-xl text-center justify-center">
                    <Shield className="w-4 h-4 text-[#FFE600]" />
                    <span className="text-xs font-barlow font-black text-[#FFE600] uppercase tracking-wider">CMS ATTIVO</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </header>
  );
};

export default Navbar;
