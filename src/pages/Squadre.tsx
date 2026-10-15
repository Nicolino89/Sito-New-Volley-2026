import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RosaSquadra } from '../firebase-societa';
import { Trophy, Users, ChevronRight, HelpCircle, Shield, Sparkles, ArrowRight, History } from 'lucide-react';

interface SquadreProps {
  squadre: RosaSquadra[];
}

export default function Squadre({ squadre }: SquadreProps) {
  const navigate = useNavigate();
  const [filterCategory, setFilterCategory] = useState<'TUTTE' | 'SENIOR' | 'GIOVANILI'>('TUTTE');

  useEffect(() => {
    document.title = "Le Squadre | New Volley Academy Forlì";
  }, []);

  const safeSquadre = Array.isArray(squadre) 
    ? squadre.filter(s => {
        if (!s) return false;
        const name = (s.nome_squadra || '').toUpperCase().trim();
        const camp = (s.campionato || '').toUpperCase().trim();
        return !name.includes('DA ASSEGNARE') && !camp.includes('DA ASSEGNARE');
      }) 
    : [];
  
  // Distinguish Male / Female based on name or gender property
  const isFemminile = (s: RosaSquadra) => {
    const nameLower = (s?.nome_squadra || '').toLowerCase();
    return nameLower.includes('femminile') || nameLower.includes(' fem') || (s as any)?.gender === 'F' || (s as any)?.genere === 'F';
  };
  
  const isMaschile = (s: RosaSquadra) => {
    const nameLower = (s?.nome_squadra || '').toLowerCase();
    return nameLower.includes('maschile') || nameLower.includes(' mas') || (s as any)?.gender === 'M' || (s as any)?.genere === 'M';
  };

  // Filter Serie D teams
  const serieDTeams = safeSquadre.filter(s => s?.category === 'SERIE_D' || (s?.nome_squadra || '').toUpperCase().includes('SERIE D'));
  
  const serieDFemminile = serieDTeams.find(isFemminile);
  const serieDMaschile = serieDTeams.find(isMaschile);

  // Other Serie D teams if any that didn't match the primary 2
  const otherSerieD = serieDTeams.filter(s => s !== serieDFemminile && s !== serieDMaschile);

  // Filter Senior categories
  const seniorTeams = safeSquadre.filter(s => {
    if (serieDTeams.includes(s)) return false;
    const cat = s?.category;
    const name = (s?.nome_squadra || '').toUpperCase();
    if (cat === 'GIOVANILI' || name.includes('UNDER') || name.includes('MINIVOLLEY')) return false;
    return true;
  });

  // Filter Youth categories
  const giovaniliTeams = safeSquadre.filter(s => {
    if (serieDTeams.includes(s)) return false;
    const cat = s?.category;
    const name = (s?.nome_squadra || '').toUpperCase();
    return cat === 'GIOVANILI' || name.includes('UNDER') || name.includes('MINIVOLLEY');
  });

  const renderSerieDCard = (team: RosaSquadra | undefined, label: string, gender: 'M' | 'F') => {
    const imageUrl = team ? (team.foto_copertina_url || (team as any).imageUrl) : null;
    const hasImage = imageUrl && imageUrl.trim() !== '';

    if (!team) {
      return (
        <div className="bg-zinc-900/70 backdrop-blur-md border border-dashed border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center min-h-[360px] relative overflow-hidden shadow-sm">
          <div className="absolute top-4 left-4 bg-zinc-800 text-zinc-400 text-[11px] font-mono font-bold tracking-wider uppercase px-3 py-1 rounded-md">
            SERIE D {gender === 'F' ? 'FEMMINILE' : 'MASCHILE'}
          </div>
          <HelpCircle className="w-12 h-12 text-zinc-700 mb-3 animate-pulse" />
          <h4 className="text-xl font-barlow font-bold text-zinc-500 uppercase tracking-wide">ORGANICO IN AGGIORNAMENTO</h4>
          <p className="text-zinc-500 text-xs font-inter mt-1 max-w-xs">La rosa per la stagione 2026/2027 sarà pubblicata a breve.</p>
        </div>
      );
    }

    const playersCount = team.id_atleti?.length || 0;

    return (
      <div 
        key={team.id}
        onClick={() => navigate(`/squadre/${team.id}`)}
        className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 hover:border-[#FFE600] rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col justify-between min-h-[360px] group relative cursor-pointer select-none hover:shadow-[0_10px_35px_rgba(255,230,0,0.15)]"
      >
        {/* Background Image / Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img 
            src={hasImage ? imageUrl : "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&auto=format&fit=crop&q=80"} 
            alt={team?.nome_squadra || label}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover opacity-50 group-hover:opacity-75 group-hover:scale-105 transition-all duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-black/30" />
        </div>

        {/* Top Badges */}
        <div className="p-5 flex justify-between items-center z-10 relative">
          <span className="bg-[#FFE600] text-zinc-950 text-xs font-black tracking-wider px-3 py-1.5 rounded-lg border border-[#FFE600] font-mono shadow-md uppercase">
            SERIE D {gender === 'F' ? 'FEMMINILE' : 'MASCHILE'}
          </span>
          <span className="bg-black/85 text-zinc-200 border border-zinc-700 text-xs font-mono font-bold tracking-wider px-3 py-1 rounded-md shadow-sm">
            {team?.stagione || '2026/2027'}
          </span>
        </div>

        {/* Content & Action */}
        <div className="p-6 z-10 relative space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-block w-3 h-3 rounded-full ${gender === 'F' ? 'bg-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.8)]' : 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]'}`} />
              <span className="text-xs font-bold font-mono text-zinc-300 uppercase tracking-widest">{gender === 'F' ? 'Femminile' : 'Maschile'}</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-barlow font-black text-white uppercase tracking-wide group-hover:text-[#FFE600] transition-colors leading-none mt-2 drop-shadow-md">
              {team?.nome_squadra || label}
            </h3>
            <p className="text-zinc-300 text-xs sm:text-sm font-mono font-medium truncate mt-1.5">
              {team?.campionato || 'Campionato Regionale FIPAV'}
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-800/90">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-200 font-mono">
              <Users className="w-4 h-4 text-[#FFE600]" />
              <span><strong>{playersCount}</strong> Atleti Convocati</span>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/squadre/${team.id}`);
              }}
              className="bg-[#FFE600] hover:bg-[#ebd400] text-zinc-950 text-xs sm:text-sm font-extrabold font-barlow uppercase tracking-wider px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-[#FFE600]/20 group-hover:scale-105 cursor-pointer"
            >
              <span>Scopri la rosa</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Banner Informativo: Rosa Squadre in Aggiornamento */}
      <div className="w-full bg-gradient-to-r from-amber-500/15 via-amber-400/25 to-amber-500/15 border-b border-amber-400/30 py-2.5 px-4 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2.5 text-center">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFE600] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFE600]"></span>
          </span>
          <span className="text-xs sm:text-sm font-barlow font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <span>🏐 Rose squadre in aggiornamento per la nuova stagione sportiva 2026/2027</span>
          </span>
        </div>
      </div>

      {/* ================= HERO SPOTLIGHT PRIME SQUADRE FULL-BLEED ================= */}
      <section className="relative w-full bg-zinc-950 border-b border-zinc-850 overflow-hidden pt-8 pb-12 sm:pt-10 sm:pb-14">
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,230,0,0.14),rgba(255,255,255,0))]" />
          <div className="absolute -top-24 left-1/3 w-96 h-96 bg-[#FFE600]/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          
          {/* Header Snello e Diretto */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/80 pb-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/80 border border-[#FFE600]/40 text-[#FFE600] text-xs font-mono font-bold tracking-widest uppercase shadow-sm mb-2.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>LE NOSTRE PANTERE • SERIE D REGIONALE FIPAV</span>
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-barlow font-black tracking-tight text-white uppercase leading-[0.95] drop-shadow-sm">
                PRIME SQUADRE IN EVIDENZA
              </h1>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-zinc-400 text-xs sm:text-sm font-inter max-w-md leading-relaxed">
                Due formazioni al vertice, un unico cuore giallo-nero. Scopri le rose ufficiali e lo staff tecnico delle nostre prime squadre.
              </p>
              <button
                onClick={() => navigate('/squadre/archivio')}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-400/10 hover:bg-amber-400 text-amber-400 hover:text-black border border-amber-400/30 hover:border-amber-400 font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 shadow-md"
              >
                <History className="w-3.5 h-3.5" />
                <span>Archivio Storico Annate</span>
              </button>
            </div>
          </div>

          {/* Grid Prime Squadre in Primo Piano */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {renderSerieDCard(serieDFemminile, "Serie D Femminile", "F")}
            {renderSerieDCard(serieDMaschile, "Serie D Maschile", "M")}
          </div>

          {/* Ulteriori squadre Serie D se presenti */}
          {otherSerieD.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {otherSerieD.map(t => renderSerieDCard(t, t.nome_squadra, isFemminile(t) ? 'F' : 'M'))}
            </div>
          )}
        </div>
      </section>

      {/* ================= CONTENUTO CATEGORIE & GIOVANILI DIVISE MA INSIEME ================= */}
      <div className="w-full bg-gradient-to-b from-zinc-950 via-slate-900/10 to-slate-100/95 py-12 transition-all relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Header Sezione Categorie & Filtri Rapidi */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-6 bg-[#FFE600] rounded-sm inline-block shadow-sm" />
              <Users className="w-5 h-5 text-[#FFE600]" />
              <h2 className="text-2xl font-barlow font-extrabold uppercase tracking-wide text-white drop-shadow-sm">
                TUTTE LE NOSTRE SQUADRE
              </h2>
            </div>

            {/* Pill Filter Buttons */}
            <div className="inline-flex bg-black/90 p-1.5 rounded-2xl border border-zinc-800 shadow-xl self-start sm:self-auto flex-wrap gap-1">
              <button
                onClick={() => setFilterCategory('TUTTE')}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-barlow uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  filterCategory === 'TUTTE'
                    ? 'bg-[#FFE600] text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Tutte ({seniorTeams.length + giovaniliTeams.length})
              </button>
              <button
                onClick={() => setFilterCategory('SENIOR')}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-barlow uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  filterCategory === 'SENIOR'
                    ? 'bg-[#FFE600] text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Campionati & Divisioni ({seniorTeams.length})
              </button>
              <button
                onClick={() => setFilterCategory('GIOVANILI')}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-barlow uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  filterCategory === 'GIOVANILI'
                    ? 'bg-[#FFE600] text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Settore Giovanile ({giovaniliTeams.length})
              </button>
            </div>
          </div>

          {/* SEZIONE 1: CAMPIONATI & DIVISIONI */}
          {(filterCategory === 'TUTTE' || filterCategory === 'SENIOR') && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-300/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <Shield className="w-5 h-5 text-amber-500" />
                  <h3 className="text-xl sm:text-2xl font-barlow font-bold uppercase tracking-wide text-zinc-900">
                    Campionati & Divisioni
                  </h3>
                  <span className="bg-amber-100 text-amber-900 border border-amber-200 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full">
                    {seniorTeams.length} {seniorTeams.length === 1 ? 'Squadra' : 'Squadre'}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-inter">
                  Formazioni impegnate nei campionati territoriali e interprovinciali
                </p>
              </div>

              {seniorTeams.length === 0 ? (
                <div className="text-center py-12 bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-3xl shadow-sm">
                  <Shield className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-700 font-bold font-barlow uppercase text-sm">Nessuna squadra in questa categoria</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {seniorTeams.map(team => {
                    const playersCount = team.id_atleti?.length || 0;
                    const genderLetter = isFemminile(team) ? 'F' : 'M';
                    return (
                      <div
                        key={team.id}
                        onClick={() => navigate(`/squadre/${team.id}`)}
                        className="bg-white/95 backdrop-blur-sm border border-slate-200/90 hover:border-[#FFE600] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] rounded-3xl p-6 shadow-sm transition-all duration-300 cursor-pointer group flex flex-col justify-between h-52 relative overflow-hidden"
                      >
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-center">
                            <span className={`inline-block text-[10px] font-bold font-inter px-2.5 py-0.5 rounded-md uppercase border ${
                              genderLetter === 'F' 
                                ? 'bg-pink-50 border-pink-200 text-pink-700' 
                                : 'bg-blue-50 border-blue-200 text-blue-700'
                            }`}>
                              {genderLetter === 'F' ? '♀ Femminile' : '♂ Maschile'}
                            </span>
                            <span className="text-[11px] font-mono font-semibold text-slate-400">{team?.stagione || '2026/2027'}</span>
                          </div>
                          <h3 className="text-xl font-barlow font-bold text-slate-950 uppercase tracking-wide group-hover:text-amber-600 transition-colors leading-snug">
                            {team?.nome_squadra || 'Squadra'}
                          </h3>
                          <p className="text-slate-500 text-xs font-mono line-clamp-1">{team?.campionato || 'Campionato Territoriale FIPAV'}</p>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs mt-4">
                          <span className="text-slate-600 font-mono"><strong>{playersCount}</strong> Atleti in Rosa</span>
                          <span className="text-amber-600 font-mono text-xs font-extrabold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            Vedi scheda <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SEZIONE 2: SETTORE GIOVANILE & MINIVOLLEY */}
          {(filterCategory === 'TUTTE' || filterCategory === 'GIOVANILI') && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-300/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-xl sm:text-2xl font-barlow font-bold uppercase tracking-wide text-zinc-900">
                    Settore Giovanile & Minivolley S3
                  </h3>
                  <span className="bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full">
                    {giovaniliTeams.length} {giovaniliTeams.length === 1 ? 'Squadra' : 'Squadre'}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-inter">
                  Il vivaio NVA: avviamento allo sport, Under agonistiche e Minivolley S3
                </p>
              </div>

              {giovaniliTeams.length === 0 ? (
                <div className="text-center py-12 bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-3xl shadow-sm">
                  <Shield className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-700 font-bold font-barlow uppercase text-sm">Nessuna squadra giovanile configurata</p>
                  <p className="text-slate-500 text-xs mt-1 font-inter">Le squadre giovanili (Under 18, 16, 14, 13, S3) verranno pubblicate a breve.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {giovaniliTeams.map(team => {
                    const playersCount = team?.id_atleti?.length || 0;
                    const genderLetter = isFemminile(team) ? 'F' : 'M';
                    return (
                      <div
                        key={team?.id || Math.random()}
                        onClick={() => team?.id && navigate(`/squadre/${team.id}`)}
                        className="bg-white/95 backdrop-blur-sm border border-slate-200/90 hover:border-[#FFE600] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] rounded-3xl p-6 shadow-sm transition-all duration-300 cursor-pointer group flex flex-col justify-between h-52 relative overflow-hidden"
                      >
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-center">
                            <span className={`inline-block text-[10px] font-bold font-inter px-2.5 py-0.5 rounded-md uppercase border ${
                              genderLetter === 'F' 
                                ? 'bg-pink-50 border-pink-200 text-pink-700' 
                                : 'bg-blue-50 border-blue-200 text-blue-700'
                            }`}>
                              {genderLetter === 'F' ? '♀ Femminile' : '♂ Maschile'}
                            </span>
                            <span className="text-[11px] font-mono font-semibold text-slate-400">{team?.stagione || '2026/2027'}</span>
                          </div>
                          <h3 className="text-xl font-barlow font-bold text-slate-950 uppercase tracking-wide group-hover:text-amber-600 transition-colors leading-snug">
                            {team?.nome_squadra || 'Squadra'}
                          </h3>
                          <p className="text-slate-500 text-xs font-mono line-clamp-1">{team?.campionato || 'Campionato Giovanile FIPAV'}</p>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs mt-4">
                          <span className="text-slate-600 font-mono"><strong>{playersCount}</strong> Atleti in Rosa</span>
                          <span className="text-amber-600 font-mono text-xs font-extrabold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            Vedi scheda <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
