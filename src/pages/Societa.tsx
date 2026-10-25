import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  MapPin, 
  Mail, 
  Phone, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Info, 
  X, 
  Award, 
  Briefcase, 
  Calendar,
  Trophy,
  Sparkles,
  CheckCircle2,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, isDemoMode } from '../firebase-societa';
import { collection, getDocs, query } from 'firebase/firestore';

// Types to match firebase-societa interfaces
interface SocietaProps {
  societaInfo: any;
  societaConfig: any;
}

interface StaffProfilo {
  id: string;
  nomeCognome: string;
  fotoUrl?: string;
  qualificaTecnica?: string;
  palmares?: string;
  storicoCarriera?: Array<{
    anno: string;
    societa: string;
    ruolo: string;
    risultato?: string;
  }>;
  fotoPositionY?: number;
  fotoPositionX?: number;
  foto?: {
    url: string;
    positionY: number;
    positionX?: number;
  };
}

// Carousel Component
const CarouselHero = ({ carosello }: { carosello?: { foto: Array<{ url: string; positionY: number }>; intervallo: number } }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<any>(null);

  const foto = carosello?.foto || [];
  const intervallo = (carosello?.intervallo || 5) * 1000;

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (foto.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % foto.length);
    }, intervallo);
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [foto, intervallo]);

  if (foto.length === 0) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + foto.length) % foto.length);
    startTimer();
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % foto.length);
    startTimer();
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
    startTimer();
  };

  return (
    <div className="relative w-full h-[280px] md:h-[440px] bg-zinc-950 rounded-3xl overflow-hidden select-none border border-zinc-800 shadow-2xl">
      {/* Slides */}
      <div className="absolute inset-0 w-full h-full">
        {foto.map((slide, index) => (
          <img
            key={(slide.url || '') + index}
            src={slide.url}
            alt="Foto Società"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out"
            style={{
              opacity: index === currentIndex ? 1 : 0,
              zIndex: index === currentIndex ? 10 : 0,
              objectPosition: `center ${slide.positionY ?? 50}%`
            }}
            referrerPolicy="no-referrer"
          />
        ))}
      </div>

      {foto.length > 1 && (
        <>
          {/* Frecce */}
          <button
            onClick={handlePrev}
            style={{ zIndex: 20 }}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white p-2.5 rounded-full cursor-pointer transition-all shadow-lg"
            aria-label="Precedente"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            style={{ zIndex: 20 }}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white p-2.5 rounded-full cursor-pointer transition-all shadow-lg"
            aria-label="Successivo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div
            style={{ zIndex: 20 }}
            className="absolute bottom-4 left-1/2 -translate-y-0 -translate-x-1/2 flex gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full"
          >
            {foto.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`h-2 rounded-full cursor-pointer transition-all ${
                  index === currentIndex ? "bg-[#FFE600] w-5" : "bg-white/50 w-2"
                }`}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function Societa({ societaInfo, societaConfig }: SocietaProps) {
  const navigate = useNavigate();
  const [staffProfili, setStaffProfili] = useState<Record<string, StaffProfilo>>({});
  const [selectedProfilo, setSelectedProfilo] = useState<StaffProfilo | null>(null);
  const [loadingProfili, setLoadingProfili] = useState(true);

  useEffect(() => {
    document.title = "La Società | New Volley Academy Forlì";
  }, []);

  // Load all staff profiles once on page mount to easily match with the organigramma.
  useEffect(() => {
    const loadProfiliData = async () => {
      try {
        let list: StaffProfilo[] = [];
        if (isDemoMode) {
          const local = localStorage.getItem('staff_profili');
          list = local ? JSON.parse(local) : [];
        } else {
          const snap = await getDocs(query(collection(db, 'staff_profili')));
          snap.forEach(docSnap => {
            list.push({ id: docSnap.id, ...docSnap.data() } as StaffProfilo);
          });
        }
        const mapped: Record<string, StaffProfilo> = {};
        list.forEach(p => {
          if (p.id) mapped[p.id] = p;
        });
        setStaffProfili(mapped);
      } catch (err) {
        console.error("Errore nel caricamento dei profili staff estesi:", err);
      } finally {
        setLoadingProfili(false);
      }
    };
    loadProfiliData();
  }, []);

  // Extraction and sorting of the organigramma list
  const organigrammaList = (() => {
    // 1. Check if configured in societaConfig.staffTecnico or organigramma
    const configured = (societaConfig?.staffTecnico && societaConfig.staffTecnico.length > 0)
      ? societaConfig.staffTecnico
      : (societaConfig?.organigramma && societaConfig.organigramma.length > 0)
        ? societaConfig.organigramma
        : (societaInfo?.organigramma?.staff_tecnico && societaInfo.organigramma.staff_tecnico.length > 0)
          ? societaInfo.organigramma.staff_tecnico
          : [];

    // Check if the configured list is just the old hardcoded mock data (Roberto Baggio, Ettore Gulinelli, Giulia Neri, Marco De Marchi)
    const mockNames = ['roberto baggio', 'ettore gulinelli', 'giulia neri', 'marco de marchi'];
    const isOnlyMockData = configured.length > 0 && configured.every((s: any) => 
      !s.profiloId && mockNames.includes((s.nome || '').toLowerCase().trim())
    );

    // If configured and not just mock data, use it!
    if (configured.length > 0 && !isOnlyMockData) {
      return configured;
    }

    // 2. If configured is empty or only has mock data, auto-display real profiles from Anagrafica Staff!
    const profiliArray = Object.values(staffProfili) as StaffProfilo[];
    if (profiliArray.length > 0) {
      return profiliArray.map((p, idx) => ({
        id: p.id,
        profiloId: p.id,
        nome: p.nomeCognome,
        ruolo: p.qualificaTecnica ? (p.qualificaTecnica.includes('Direttore') ? 'Direttore Tecnico' : p.qualificaTecnica.includes('Allenat') ? 'Staff Tecnico / Allenatore' : p.qualificaTecnica) : 'Staff Tecnico',
        qualifica: p.qualificaTecnica || '',
        ordine: idx + 1
      }));
    }

    // 3. Dynamic staff roles from societaInfo.organigramma
    const dynamicStaff: any[] = [];
    if (societaInfo?.organigramma?.direttore_tecnico) {
      dynamicStaff.push({
        id: 'st-dt',
        nome: societaInfo.organigramma.direttore_tecnico,
        ruolo: 'Direttore Tecnico',
        qualifica: 'FIPAV',
        ordine: 1
      });
    }
    if (societaInfo?.organigramma?.responsabile_settore_giovanile) {
      dynamicStaff.push({
        id: 'st-rsg',
        nome: societaInfo.organigramma.responsabile_settore_giovanile,
        ruolo: 'Responsabile Settore Giovanile',
        qualifica: 'FIPAV',
        ordine: 2
      });
    }
    if (dynamicStaff.length > 0) {
      return dynamicStaff;
    }
    return configured;
  })();
  const sortedOrganigramma = [...organigrammaList].sort((a, b) => (a.ordine || 0) - (b.ordine || 0));

  // Consiglio direttivo section: prioritize societaInfo.organigramma Presidente/Vice Presidente if set
  const direttivoList = (() => {
    const pres = societaInfo?.organigramma?.presidente?.trim();
    const vp = societaInfo?.organigramma?.vice_presidente?.trim();

    const baseList: Array<{ id?: string; ruolo: string; nome: string; ordine?: number }> = 
      (societaConfig?.consiglioDirettivo && societaConfig.consiglioDirettivo.length > 0)
        ? [...societaConfig.consiglioDirettivo]
        : (societaInfo?.organigramma?.direttivo && societaInfo.organigramma.direttivo.length > 0)
          ? societaInfo.organigramma.direttivo.map((d: any, idx: number) => ({ id: `dir-${idx}`, ruolo: d.ruolo, nome: d.nome, ordine: idx + 1 }))
          : [];

    if (pres || vp) {
      const result: Array<{ id?: string; ruolo: string; nome: string; ordine?: number }> = [];
      if (pres) {
        result.push({ id: 'dir-pres', ruolo: 'Presidente', nome: pres, ordine: 1 });
      }
      if (vp) {
        result.push({ id: 'dir-vp', ruolo: 'Vice Presidente', nome: vp, ordine: 2 });
      }
      baseList.forEach((m, idx) => {
        const r = (m.ruolo || '').toLowerCase().trim();
        if (pres && r === 'presidente') return;
        if (vp && (r === 'vice presidente' || r.includes('vice'))) return;
        if (!pres && r === 'presidente') {
          result.push({ ...m, ordine: 1 });
          return;
        }
        if (!vp && (r === 'vice presidente' || r.includes('vice'))) {
          result.push({ ...m, ordine: 2 });
          return;
        }
        result.push({ ...m, ordine: m.ordine || (10 + idx) });
      });
      return result.sort((a, b) => (a.ordine || 0) - (b.ordine || 0));
    }

    return baseList.sort((a, b) => (a.ordine || 0) - (b.ordine || 0));
  })();

  // Gyms section: prioritize societaInfo.palestre when populated, else societaConfig.palestre
  const palestreList = (() => {
    if (societaInfo?.palestre && societaInfo.palestre.length > 0) {
      return societaInfo.palestre;
    }
    if (societaConfig?.palestre && societaConfig.palestre.length > 0) {
      return [...societaConfig.palestre].sort((a, b) => (a.ordine || 0) - (b.ordine || 0));
    }
    return [];
  })();

  const annoFondazione = societaConfig?.annoFondazione || societaInfo?.anno_fondazione || "2018";

  return (
    <div className="w-full" id="societa-tab">
      
      {/* ================= HERO HEADER SOCIETÀ FULL-BLEED ================= */}
      <section className="relative w-full bg-zinc-950 border-b border-zinc-850 overflow-hidden pt-6 pb-6 sm:pt-8 sm:pb-8">
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,230,0,0.14),rgba(255,255,255,0))]" />
          <div className="absolute -top-24 left-1/3 w-96 h-96 bg-[#FFE600]/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Header Snello e Diretto */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/80 pb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/80 border border-[#FFE600]/40 text-[#FFE600] text-xs font-mono font-bold tracking-widest uppercase shadow-sm mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>IDENTITÀ & VALORI • FONDATA NEL {annoFondazione}</span>
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-barlow font-black tracking-tight text-white uppercase leading-[0.95] drop-shadow-sm flex items-center gap-3">
                <span>LA NOSTRA SOCIETÀ</span>
              </h1>
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm font-inter max-w-md leading-relaxed">
              Un progetto solido e una visione moderna: staff tecnico qualificato, palestre all'avanguardia e passione pura per la pallavolo.
            </p>
          </div>

          {/* 1. CAROUSEL HERO (Se presente foto nel CMS) */}
          {societaConfig?.carosello?.foto && societaConfig.carosello.foto.length > 0 && (
            <div className="pt-2">
              <CarouselHero carosello={societaConfig.carosello} />
            </div>
          )}
        </div>
      </section>

      {/* ================= CONTENUTO SOCIETÀ CON TRANSIZIONE SFUMATA ================= */}
      <div className="w-full bg-gradient-to-b from-zinc-950 via-slate-900/10 to-slate-100/95 py-8 sm:py-10 transition-all relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* 2. STORIA & VALORI (Se configurata nel CMS) */}
          {(societaConfig?.storia?.descrizione || societaConfig?.descrizione) && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden space-y-4">
              <div className="absolute top-0 left-0 w-2 bg-[#FFE600] h-full" />
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-3.5">
                <div className="w-8 h-8 rounded-lg bg-[#FFE600]/15 flex items-center justify-center text-[#FFE600]">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-[#FFE600] font-barlow">
                  {societaConfig?.storia?.titolo || "Storia, Valori e Mission Societaria"}
                </h3>
              </div>
              <div className="text-zinc-300 text-sm sm:text-base leading-relaxed font-inter whitespace-pre-line pt-1">
                {societaConfig?.storia?.descrizione || societaConfig?.descrizione}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column (Main content): Organigramma & Consiglio Direttivo */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* A. ORGANIGRAMMA SOCIO-TECNICO */}
              <div className="bg-white/95 backdrop-blur-sm border border-slate-200/90 p-6 sm:p-8 rounded-3xl space-y-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-6 bg-[#FFE600] rounded-sm inline-block shadow-sm" />
                    <Shield className="w-5 h-5 text-slate-900" />
                    <h3 className="text-xl sm:text-2xl font-extrabold uppercase tracking-wide text-slate-950 font-barlow">
                      Organigramma Societario
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                    Dal {annoFondazione}
                  </span>
                </div>

                {/* 1. CONSIGLIO DIRETTIVO (POSTO IN ALTO PRIMA DELLO STAFF) */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">
                    Consiglio Direttivo
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {direttivoList.length === 0 ? (
                      <p className="text-xs text-slate-400 italic col-span-full">Nessun membro configurato.</p>
                    ) : (
                      direttivoList.map((dir, idx) => (
                        <div 
                          key={dir.id || idx} 
                          className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 p-3.5 rounded-2xl flex justify-between items-center transition-all shadow-sm"
                        >
                          <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">{dir.ruolo}</span>
                          <strong className="text-slate-950 font-barlow font-black uppercase tracking-wide text-sm">{dir.nome}</strong>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. STAFF TECNICO & DIRIGENZIALE - VERTICAL CARDS GRID CON FOTO */}
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">
                    Staff Tecnico & Dirigenziale
                  </h4>

                  {sortedOrganigramma.length === 0 ? (
                    <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-medium">Nessun membro configurato al momento.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                      {sortedOrganigramma.map((st, idx) => {
                        const mappedId = st.id || idx;
                        const nameToShow = st.nomeCognome || st.nome || "Membro Staff";
                        const roleToShow = st.ruoloIncarico || st.ruolo || "Collaboratore";
                        const qualificaToShow = st.qualifica || st.qualificaTecnica || "";
                        
                        const matchingProfile = (st.profiloId ? staffProfili[st.profiloId] : null) || 
                          (Object.values(staffProfili) as StaffProfilo[]).find(p => p.nomeCognome?.toLowerCase().trim() === nameToShow.toLowerCase().trim());
                        const hasCareerInfo = matchingProfile && (
                          (matchingProfile.palmares && matchingProfile.palmares.trim() !== '') || 
                          (matchingProfile.storicoCarriera && matchingProfile.storicoCarriera.length > 0)
                        );

                        const photoToShow = matchingProfile?.foto?.url ?? matchingProfile?.fotoUrl ?? st.fotoUrl ?? "";
                        const positionYToShow = matchingProfile?.foto?.positionY ?? matchingProfile?.fotoPositionY ?? st.fotoPositionY ?? 50;
                        const positionXToShow = matchingProfile?.foto?.positionX ?? matchingProfile?.fotoPositionX ?? st.fotoPositionX ?? 50;

                        return (
                          <div 
                            key={st.profiloId || mappedId} 
                            className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden hover:border-[#FFE600] transition-all shadow-sm hover:shadow-[0_6px_25px_rgba(0,0,0,0.06)] duration-300 flex flex-col justify-between h-full group relative"
                          >
                            {/* Photo Container */}
                            <div className="relative w-full h-48 bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                              {photoToShow ? (
                                <img 
                                  src={photoToShow} 
                                  alt={nameToShow} 
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  style={{
                                    objectPosition: `${positionXToShow}% ${positionYToShow}%`
                                  }}
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5">
                                  <User className="w-10 h-10 text-slate-300" />
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Nessuna Foto</span>
                                </div>
                              )}
                              {/* Soft overlay gradient */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 pointer-events-none" />
                            </div>

                            {/* Card Content */}
                            <div className="p-4 flex flex-col justify-between flex-1 space-y-2.5">
                              <div className="space-y-1">
                                <h5 className="font-barlow font-bold text-sm text-slate-950 uppercase tracking-wide leading-tight group-hover:text-amber-600 transition-colors">
                                  {nameToShow}
                                </h5>
                                <span className="text-[11px] font-extrabold text-amber-600 uppercase tracking-wider block leading-tight font-mono">
                                  {roleToShow}
                                </span>
                                {qualificaToShow && (
                                  <p className="text-[10.5px] text-slate-500 font-mono tracking-wide leading-snug">
                                    {qualificaToShow}
                                  </p>
                                )}
                              </div>

                              {/* "Vedi Carriera" discrete trigger */}
                              {hasCareerInfo && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedProfilo(matchingProfile)}
                                  className="w-full mt-2 bg-slate-950 hover:bg-[#FFE600] hover:text-black text-[#FFE600] text-[10px] font-bold py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 uppercase font-mono tracking-wider transition-all duration-200 cursor-pointer shadow-sm"
                                >
                                  <Info className="w-3.5 h-3.5" /> Vedi Carriera
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Right Column: Contact Details & Gym Locations */}
            <div className="space-y-6">
              
              {/* C. RECAPITI UFFICIALI */}
              <div className="bg-zinc-950 border border-zinc-800 p-6 sm:p-7 rounded-3xl space-y-5 text-white shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-3.5">
                  <span className="w-2 h-5 bg-[#FFE600] rounded-sm inline-block shadow-sm" />
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#FFE600] font-barlow">
                    Recapiti Ufficiali
                  </h3>
                </div>

                <div className="space-y-4 text-xs pt-1">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#FFE600]/15 flex items-center justify-center text-[#FFE600] shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-zinc-400 font-mono text-[10px] uppercase tracking-wider block mb-0.5">Sede Sociale</span>
                      <span className="text-white font-bold text-sm leading-snug block">
                        {societaConfig?.sedeLegale || societaInfo?.sede_legale}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#FFE600]/15 flex items-center justify-center text-[#FFE600] shrink-0 mt-0.5">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-zinc-400 font-mono text-[10px] uppercase tracking-wider block mb-0.5">E-mail Segreteria</span>
                      <a 
                        href={`mailto:${societaConfig?.email || societaInfo?.contatti?.email}`} 
                        className="text-[#FFE600] font-extrabold text-sm hover:underline tracking-wide block"
                      >
                        {societaConfig?.email || societaInfo?.contatti?.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#FFE600]/15 flex items-center justify-center text-[#FFE600] shrink-0 mt-0.5">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-zinc-400 font-mono text-[10px] uppercase tracking-wider block mb-0.5">Telefono</span>
                      <a 
                        href={`tel:${societaConfig?.telefono || societaInfo?.contatti?.telefono}`}
                        className="text-white font-bold text-sm tracking-wider block hover:text-[#FFE600] transition-colors"
                      >
                        {societaConfig?.telefono || societaInfo?.contatti?.telefono}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#FFE600]/15 flex items-center justify-center text-[#FFE600] shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-zinc-400 font-mono text-[10px] uppercase tracking-wider block mb-0.5">Pec Istituzionale</span>
                      <span className="text-zinc-300 font-mono font-bold text-xs tracking-wider block">
                        {societaConfig?.pec || societaInfo?.contatti?.pec}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-850 flex items-center gap-2 text-zinc-400 text-[11px] font-inter">
                  <CheckCircle2 className="w-4 h-4 text-[#FFE600] shrink-0" />
                  <span>Segreteria aperta per informazioni e tesseramenti</span>
                </div>
              </div>

              {/* D. LE NOSTRE PALESTRE */}
              <div className="bg-zinc-950 border border-zinc-800 p-6 sm:p-7 rounded-3xl space-y-5 text-white shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-3.5">
                  <span className="w-2 h-5 bg-[#FFE600] rounded-sm inline-block shadow-sm" />
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#FFE600] font-barlow">
                    Le Nostre Palestre
                  </h3>
                </div>

                <div className="space-y-4 pt-1">
                  {palestreList.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">Nessuna palestra configurata.</p>
                  ) : (
                    palestreList.map((palestra, idx) => (
                      <div 
                        key={palestra.id || idx} 
                        className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl space-y-2 hover:border-[#FFE600]/40 transition-all shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#FFE600]" />
                          <h4 className="font-extrabold text-white text-sm uppercase font-barlow tracking-wide">
                            {palestra.nome}
                          </h4>
                        </div>
                        <p className="text-xs text-zinc-300 font-medium leading-relaxed font-inter">
                          {palestra.indirizzo}
                        </p>
                        {palestra.capienza && (
                          <span className="text-[10px] text-[#FFE600] font-mono font-bold uppercase tracking-wider block bg-black/60 px-2.5 py-1 rounded-md border border-[#FFE600]/20 w-fit mt-1">
                            Capienza: {palestra.capienza}
                          </span>
                        )}
                        {palestra.note && (
                          <p className="text-[11px] text-zinc-400 italic mt-2 border-l-2 border-[#FFE600]/40 pl-2 font-inter">
                            Note: {palestra.note}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* 3. STUNNING MODAL FOR CAREER & PALMARES */}
      <AnimatePresence>
        {selectedProfilo && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            {/* Backdrop with elegant blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProfilo(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm cursor-pointer"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-zinc-950 border border-[#FFE600]/40 rounded-3xl w-full max-w-2xl overflow-hidden relative shadow-2xl z-10 flex flex-col max-h-[85vh]"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedProfilo(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 p-2 rounded-full cursor-pointer transition-colors z-20 border border-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Body (Scrollable) */}
              <div className="overflow-y-auto p-6 md:p-8 space-y-6">
                
                {/* Header Profile Info */}
                <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start border-b border-zinc-800/80 pb-6">
                  {/* Photo Profile */}
                  <div className="w-24 h-28 bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-inner flex items-center justify-center shrink-0">
                    {selectedProfilo.foto?.url || selectedProfilo.fotoUrl ? (
                      <img 
                        src={selectedProfilo.foto?.url ?? selectedProfilo.fotoUrl} 
                        alt={selectedProfilo.nomeCognome} 
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                        style={{
                          objectPosition: `${selectedProfilo.foto?.positionX ?? selectedProfilo.fotoPositionX ?? 50}% ${selectedProfilo.foto?.positionY ?? selectedProfilo.fotoPositionY ?? 50}%`
                        }}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User className="w-10 h-10 text-zinc-600" />
                    )}
                  </div>

                  <div className="space-y-2 text-center sm:text-left">
                    <h3 className="text-2xl font-black text-white font-barlow uppercase tracking-wider">
                      {selectedProfilo.nomeCognome}
                    </h3>
                    {selectedProfilo.qualificaTecnica && (
                      <span className="bg-[#FFE600]/10 text-[#FFE600] border border-[#FFE600]/25 text-[10px] md:text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-block">
                        🎖️ {selectedProfilo.qualificaTecnica}
                      </span>
                    )}
                  </div>
                </div>

                {/* Palmarès Section */}
                {selectedProfilo.palmares && selectedProfilo.palmares.trim() !== '' && (
                  <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl space-y-3 shadow-inner">
                    <h4 className="text-xs font-black text-[#FFE600] font-mono uppercase tracking-widest flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-[#FFE600]" /> Palmarès & Riconoscimenti
                    </h4>
                    <p className="text-xs text-zinc-300 leading-relaxed font-medium whitespace-pre-line font-inter">
                      {selectedProfilo.palmares}
                    </p>
                  </div>
                )}

                {/* Career History Table Section */}
                {selectedProfilo.storicoCarriera && selectedProfilo.storicoCarriera.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-white font-mono uppercase tracking-widest flex items-center gap-2 border-l-2 border-[#FFE600] pl-2">
                      <Briefcase className="w-4 h-4 text-[#FFE600]" /> Storico Carriera
                    </h4>

                    <div className="overflow-x-auto border border-zinc-850 rounded-2xl shadow-lg">
                      <table className="w-full text-left text-xs text-zinc-300 border-collapse">
                        <thead className="bg-zinc-900 text-zinc-400 font-mono border-b border-zinc-850">
                          <tr>
                            <th className="p-3 text-[10px] uppercase font-bold tracking-wider">Anno</th>
                            <th className="p-3 text-[10px] uppercase font-bold tracking-wider">Società / Squadra</th>
                            <th className="p-3 text-[10px] uppercase font-bold tracking-wider">Ruolo</th>
                            <th className="p-3 text-[10px] uppercase font-bold tracking-wider">Risultato</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900 bg-black/40">
                          {selectedProfilo.storicoCarriera.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-zinc-900/40 transition-colors">
                              <td className="p-3 font-mono font-bold text-white text-[11px]">
                                {row.anno}
                              </td>
                              <td className="p-3 font-semibold text-zinc-200">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span>{row.societa}</span>
                                  {(row.societa.toLowerCase().includes('new volley') || row.societa.toLowerCase().includes('nva')) && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedProfilo(null);
                                        navigate('/squadre-archivio');
                                      }}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#FFE600]/10 text-[#FFE600] hover:bg-[#FFE600]/25 border border-[#FFE600]/30 text-[9px] font-mono font-bold uppercase transition-colors cursor-pointer"
                                      title="Consulta l'Archivio Storico Squadre"
                                    >
                                      Archivio ↗
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 text-zinc-300">
                                {row.ruolo}
                              </td>
                              <td className="p-3 text-[11px] font-mono text-[#FFE600] font-semibold">
                                {row.risultato || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Footer close description */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setSelectedProfilo(null)}
                    className="bg-[#FFE600] hover:bg-[#ebd400] text-zinc-950 font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest transition-all duration-200 shadow-md cursor-pointer"
                  >
                    Chiudi Dettagli
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
