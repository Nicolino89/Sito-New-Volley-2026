import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  Users, 
  Newspaper, 
  Shield, 
  Eye, 
  CheckCircle, 
  ArrowUpRight,
  Sparkles,
  Layers,
  Award,
  RefreshCw
} from 'lucide-react';
import { NewsBlog, RosaSquadra, Giocatore, Sponsor, getStatisticheVisite } from '../../../firebase-societa';

interface TabStatisticheProps {
  newsAll?: NewsBlog[];
  squadreAll?: RosaSquadra[];
  giocatoriAll?: Giocatore[];
  sponsorsAll?: Sponsor[];
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const GA4_CONSOLE_URL = "https://analytics.google.com/";
const GA4_MEASUREMENT_ID = "G-6P73ZYB8BL";

export default function TabStatistiche({
  newsAll = [],
  squadreAll = [],
  giocatoriAll = [],
  sponsorsAll = [],
  showToast
}: TabStatisticheProps) {
  const [statsData, setStatsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await getStatisticheVisite();
      setStatsData(data);
    } catch (e) {
      console.warn("Errore fetchStats:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // 100% Real Live Metrics from Telemetry
  const totalVisits = Number(statsData?.totaleVisite || statsData?.total || 0);
  const rawPages: Record<string, number> = statsData?.pagine || statsData?.pages || {};
  const rawDays: Record<string, number> = statsData?.giorni || statsData?.days || {};

  // Build the last 7 calendar days dynamically with actual real counts
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const isoDate = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' });
    const count = Number(rawDays[isoDate] || 0);
    return { isoDate, dayLabel, count };
  });

  const maxDayCount = Math.max(1, ...last7Days.map(d => d.count));

  // Section visits breakdown based exclusively on actual recorded views
  const sectionDefinitions = [
    { id: 'home', name: 'Home Page & Ticker Gare', icon: '🏠', path: '/' },
    { id: 'squadre', name: 'Squadre, Calendario & Classifiche FIPAV', icon: '🏐', path: '/squadre' },
    { id: 'news', name: 'News & Articoli del Club', icon: '📰', path: '/news' },
    { id: 'camp-tornei', name: 'Camp Estivi, Tornei & Volantini', icon: '☀️', path: '/camp-tornei' },
    { id: 'galleria', name: 'Galleria Foto & Like', icon: '📸', path: '/galleria' },
    { id: 'societa', name: 'Società, Storia & Palestre', icon: '🏛️', path: '/societa' },
    { id: 'sponsor', name: 'Sponsor & Partner Commerciali', icon: '🤝', path: '/sponsor' }
  ];

  const sectionsWithRealCounts = sectionDefinitions.map(sec => {
    const count = Number(rawPages[sec.id] || 0);
    const percentage = totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0;
    return {
      ...sec,
      count,
      percentage
    };
  }).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6 animate-fade-in text-xs col-span-1 lg:col-span-3" id="admin-tab-statistiche">
      
      {/* 1. HEADER */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl text-white shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center">
                <BarChart2 className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider font-sport italic">
                  Statistiche Reali del Portale
                </h3>
                <p className="font-inter text-xs text-slate-400 mt-0.5">
                  Dati di navigazione reali rilevati in tempo reale dai visitatori del sito.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchStats}
              disabled={isLoading}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-amber-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Aggiorna Dati</span>
            </button>
            <a
              href={GA4_CONSOLE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-sport italic skew-x-[-6deg] uppercase tracking-wider px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer flex items-center gap-2 shrink-0"
            >
              <span>Google Analytics 4 Ufficiale</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* 2. REAL METRIC CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 pt-2">
          
          <div className="bg-slate-950/90 border border-slate-800 p-4 md:p-5 rounded-2xl space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold">Pagine Viste Totali</span>
              <Eye className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl md:text-3xl font-black font-sport italic text-white tracking-tight">
              {totalVisits.toLocaleString('it-IT')}
            </p>
            <div className="text-[10px] text-slate-400 font-mono">
              Registrate nel database
            </div>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 p-4 md:p-5 rounded-2xl space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold">Articoli & News</span>
              <Newspaper className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-2xl md:text-3xl font-black font-sport italic text-white tracking-tight">
              {newsAll.length}
            </p>
            <div className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Pubblicati online
            </div>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 p-4 md:p-5 rounded-2xl space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold">Squadre & Atleti</span>
              <Shield className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl md:text-3xl font-black font-sport italic text-white tracking-tight">
              {squadreAll.length} <span className="text-base text-slate-500 font-normal">sq.</span> / {giocatoriAll.length} <span className="text-base text-slate-500 font-normal">atl.</span>
            </p>
            <div className="text-[10px] text-purple-300 font-mono">
              In archivio societario
            </div>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 p-4 md:p-5 rounded-2xl space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold">Codice GA4 Attivo</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-sm font-mono font-bold text-amber-400 truncate mt-1">
              {GA4_MEASUREMENT_ID}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Attivo in produzione</span>
            </div>
          </div>

        </div>
      </div>

      {/* 3. REAL VISITS TIMELINE CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* REAL VISITS IN THE LAST 7 DAYS */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-3xl space-y-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h4 className="text-base font-extrabold text-slate-900 uppercase font-sport tracking-wider flex items-center gap-2">
                📈 Visualizzazioni degli Ultimi 7 Giorni
              </h4>
              <p className="text-[11px] text-slate-500 font-inter">Conteggio effettivo delle pagine viste giorno per giorno.</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="h-44 flex items-end justify-between gap-3 px-2">
              {last7Days.map((day, idx) => {
                const heightPercent = day.count > 0 ? Math.max(20, Math.round((day.count / maxDayCount) * 100)) : 8;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-mono font-bold text-slate-700 opacity-80 group-hover:opacity-100 transition-opacity">
                      {day.count}
                    </span>
                    <div 
                      className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 shadow-sm ${
                        day.count > 0 
                          ? 'bg-gradient-to-t from-slate-900 to-amber-400 group-hover:from-amber-500 group-hover:to-amber-300' 
                          : 'bg-slate-200'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[10px] font-bold text-slate-500 font-mono mt-1 capitalize text-center">
                      {day.dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* INFO CARD */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <h4 className="text-base font-extrabold text-slate-900 uppercase font-sport tracking-wider flex items-center gap-2">
              💡 Come funzionano i dati
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-inter">
              Questo pannello registra le <b>pagine effettivamente aperte</b> dai visitatori mentre navigano sul sito ufficiale.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed font-inter">
              Inoltre, il codice <b>Google Analytics 4</b> (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-amber-700 font-bold">{GA4_MEASUREMENT_ID}</code>) raccoglie in parallelo sessioni, città di provenienza e dati demografici accessibili direttamente dal portale ufficiale Google.
            </p>
          </div>

          <a
            href={GA4_CONSOLE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-center text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Vedi Report Google Completo</span>
            <ArrowUpRight className="w-4 h-4 text-amber-400" />
          </a>
        </div>

      </div>

      {/* 4. REAL SECTION POPULARITY BREAKDOWN */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm">
        <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
          <div>
            <h4 className="text-base font-extrabold text-slate-900 uppercase font-sport tracking-wider">
              🔥 Pagine del Portale Più Visitate (Dati Reali)
            </h4>
            <p className="text-[11px] text-slate-500 font-inter">Classifica effettiva basata sui click registrati sul portale.</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {sectionsWithRealCounts.map((sec, idx) => (
            <div key={sec.id} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50/70 rounded-xl px-2 transition-colors">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold flex items-center justify-center text-xs shrink-0">
                  #{idx + 1}
                </span>
                <span className="text-lg shrink-0">{sec.icon}</span>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-slate-900 font-sport uppercase tracking-wide truncate">
                    {sec.name}
                  </h5>
                  <span className="text-[10px] font-mono text-slate-400">{sec.path}</span>
                </div>
              </div>

              <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                <div className="w-28 bg-slate-100 h-2 rounded-full overflow-hidden hidden sm:block">
                  <div 
                    className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.max(sec.count > 0 ? 10 : 0, sec.percentage)}%` }}
                  />
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-black font-mono text-slate-900 block">
                    {sec.count} {sec.count === 1 ? 'visita' : 'visite'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {sec.percentage}% del totale
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
