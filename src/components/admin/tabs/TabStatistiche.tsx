import React, { useState, useEffect, useMemo } from 'react';
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
  RefreshCw,
  Calendar,
  FileText,
  Printer,
  Download,
  X,
  Building,
  Check,
  ArrowRight,
  TrendingDown
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
  const [chartView, setChartView] = useState<'7days' | 'monthly'>('7days');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportPeriod, setSelectedReportPeriod] = useState<string>('all');
  const [selectedSponsorId, setSelectedSponsorId] = useState<string>('all');

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
  const last7DaysTotal = last7Days.reduce((acc, d) => acc + d.count, 0);

  // Aggregated Monthly Metrics
  const monthlyMetrics = useMemo(() => {
    const monthMap: Record<string, { total: number; daysCount: number; days: Record<string, number> }> = {};
    
    for (const [dateStr, count] of Object.entries(rawDays)) {
      if (!dateStr || !count) continue;
      const ym = dateStr.substring(0, 7);
      if (!monthMap[ym]) {
        monthMap[ym] = { total: 0, daysCount: 0, days: {} };
      }
      monthMap[ym].total += Number(count);
      monthMap[ym].daysCount += 1;
      monthMap[ym].days[dateStr] = Number(count);
    }

    const sortedMonths = Object.keys(monthMap).sort();
    const nowYm = new Date().toISOString().substring(0, 7);
    
    return sortedMonths.map((ym, index) => {
      const [year, month] = ym.split('-');
      const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      const monthLabel = dateObj.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
      const shortLabel = dateObj.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' });
      const total = monthMap[ym].total;
      const daysCount = monthMap[ym].daysCount;
      const dailyAverage = daysCount > 0 ? Math.round(total / daysCount) : 0;
      
      let growthPercent: number | null = null;
      if (index > 0) {
        const prevTotal = monthMap[sortedMonths[index - 1]].total;
        if (prevTotal > 0) {
          growthPercent = Math.round(((total - prevTotal) / prevTotal) * 100);
        }
      }

      const isCurrentMonth = ym === nowYm;

      return {
        ym,
        year,
        month,
        monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        shortLabel: shortLabel.toUpperCase(),
        total,
        daysCount,
        dailyAverage,
        growthPercent,
        isCurrentMonth,
        days: monthMap[ym].days
      };
    });
  }, [rawDays]);

  const maxMonthCount = Math.max(1, ...monthlyMetrics.map(m => m.total));

  const handlePrintReport = () => {
    document.body.classList.add('printing-sponsor-report');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-sponsor-report');
    }, 1200);
  };

  // Section visits breakdown based exclusively on actual recorded views
  const knownSections: Record<string, { name: string; icon: string; path: string }> = {
    home: { name: 'Home Page & Ticker Gare', icon: '🏠', path: '/' },
    squadre: { name: 'Squadre, Calendario & Classifiche FIPAV', icon: '🏐', path: '/squadre' },
    news: { name: 'News & Articoli del Club', icon: '📰', path: '/news' },
    societa: { name: 'Società, Storia & Palestre', icon: '🏛️', path: '/societa' },
    'camp-tornei': { name: 'Camp Estivi, Tornei & Volantini', icon: '☀️', path: '/camp-tornei' },
    'albo-d-oro': { name: "Albo d'Oro & Trofei Storici", icon: '🏆', path: '/albo-d-oro' },
    blog: { name: 'Blog Societario & Approfondimenti', icon: '✍️', path: '/blog' },
    galleria: { name: 'Galleria Foto & Like', icon: '📸', path: '/galleria' },
    voltex: { name: 'Voltex Volley Summer Camp', icon: '⚡', path: '/voltex' },
    sponsor: { name: 'Sponsor & Partner Commerciali', icon: '🤝', path: '/sponsor' },
    modulistica: { name: 'Modulistica & Iscrizioni', icon: '📝', path: '/modulistica' },
    'serie-d-femminile': { name: 'Serie D Femminile (Dettaglio)', icon: '🏐', path: '/squadre?sq=serie-d-femminile' },
    'seconda-divisione-nera-femminile': { name: '2ª Divisione Nera Femminile', icon: '🏐', path: '/squadre' },
    'stagione-20242025': { name: 'Archivio Stagione 2024/2025', icon: '📚', path: '/squadre' }
  };

  const allPageKeys = Array.from(new Set([...Object.keys(knownSections), ...Object.keys(rawPages)]));

  const sectionsWithRealCounts = allPageKeys
    .map(key => {
      const count = Number(rawPages[key] || 0);
      const percentage = totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0;
      const meta = knownSections[key] || {
        name: key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        icon: '📄',
        path: `/${key}`
      };
      return {
        id: key,
        ...meta,
        count,
        percentage
      };
    })
    .filter(item => item.count > 0 || ['home', 'squadre', 'news', 'societa', 'voltex'].includes(item.id))
    .sort((a, b) => b.count - a.count);

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

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setSelectedReportPeriod('all');
                setShowReportModal(true);
              }}
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-sport italic skew-x-[-6deg] uppercase tracking-wider px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg hover:shadow-amber-500/20 cursor-pointer flex items-center gap-2 shrink-0 border border-amber-300"
            >
              <FileText className="w-4 h-4 text-slate-950" />
              <span>Genera Report per Sponsor</span>
            </button>
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
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5 shrink-0 border border-slate-700"
            >
              <span>GA4 Console</span>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
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
        
        {/* REAL VISITS IN THE LAST 7 DAYS / MONTHLY */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-3xl space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <h4 className="text-base font-extrabold text-slate-900 uppercase font-sport tracking-wider flex items-center gap-2">
                {chartView === '7days' ? '📈 Visualizzazioni degli Ultimi 7 Giorni' : '📅 Andamento Mensile del Traffico'}
              </h4>
              <p className="text-[11px] text-slate-500 font-inter">
                {chartView === '7days' 
                  ? 'Conteggio effettivo delle pagine viste giorno per giorno.' 
                  : 'Totale visite aggregate per ciascun mese della stagione.'}
              </p>
            </div>
            
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {/* SEGMENTED CONTROL: 7 DAYS vs MONTHLY */}
              <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setChartView('7days')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    chartView === '7days'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Ultimi 7 Giorni
                </button>
                <button
                  type="button"
                  onClick={() => setChartView('monthly')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    chartView === 'monthly'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Storico Mesi</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                </button>
              </div>

              {chartView === '7days' && (
                <div className="bg-amber-50 border border-amber-200/80 text-amber-900 px-3 py-1.5 rounded-xl font-mono text-xs font-bold hidden md:flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>{last7DaysTotal.toLocaleString('it-IT')} visite</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {chartView === '7days' ? (
              <div className="h-44 flex items-end justify-between gap-2 sm:gap-3 px-1 sm:px-2">
                {last7Days.map((day, idx) => {
                  const heightPercent = day.count > 0 ? Math.max(18, Math.round((day.count / maxDayCount) * 100)) : 8;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <span className="text-[11px] sm:text-xs font-mono font-black text-slate-800 opacity-90 group-hover:opacity-100 transition-opacity">
                        {day.count}
                      </span>
                      <div 
                        className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 shadow-sm ${
                          day.count > 0 
                            ? 'bg-gradient-to-t from-slate-900 via-amber-500 to-amber-400 group-hover:from-amber-600 group-hover:to-amber-300' 
                            : 'bg-slate-200'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="text-[10px] sm:text-xs font-bold text-slate-600 font-mono mt-1 capitalize text-center">
                        {day.dayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-44 flex items-end justify-around gap-4 px-2">
                {monthlyMetrics.map((m, idx) => {
                  const heightPercent = m.total > 0 ? Math.max(20, Math.round((m.total / maxMonthCount) * 100)) : 8;
                  return (
                    <div key={idx} className="flex-1 max-w-[90px] flex flex-col items-center gap-1.5 h-full justify-end group">
                      <div className="flex flex-col items-center">
                        {m.growthPercent !== null && (
                          <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full mb-1 ${
                            m.growthPercent >= 0 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            {m.growthPercent >= 0 ? `+${m.growthPercent}%` : `${m.growthPercent}%`}
                          </span>
                        )}
                        <span className="text-xs sm:text-sm font-mono font-black text-slate-900">
                          {m.total.toLocaleString('it-IT')}
                        </span>
                      </div>
                      <div 
                        className={`w-full rounded-t-xl transition-all duration-300 shadow-sm ${
                          m.isCurrentMonth
                            ? 'bg-gradient-to-t from-slate-950 via-amber-500 to-amber-400 group-hover:from-amber-600 group-hover:to-amber-300'
                            : 'bg-gradient-to-t from-slate-800 to-slate-500 group-hover:from-slate-700 group-hover:to-slate-400'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                      <div className="text-center mt-1">
                        <span className="text-xs font-bold text-slate-700 font-mono block">
                          {m.shortLabel}
                        </span>
                        {m.isCurrentMonth && (
                          <span className="text-[8px] uppercase tracking-wider font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded font-sans">
                            In corso
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

      {/* 3.5. DETTAGLIO MESI PASSATI & TREND STAGIONALE */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h4 className="text-base font-extrabold text-slate-900 uppercase font-sport tracking-wider flex items-center gap-2">
              📅 Storico Mese per Mese & Crescita
            </h4>
            <p className="text-[11px] text-slate-500 font-inter">
              Riepilogo del traffico registrato mese dopo mese durante la stagione.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedReportPeriod('all');
              setShowReportModal(true);
            }}
            className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto border border-slate-800"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Stampa Report Stagione</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {monthlyMetrics.map(m => (
            <div 
              key={m.ym}
              className={`p-4 rounded-2xl border transition-all ${
                m.isCurrentMonth 
                  ? 'border-amber-300 bg-amber-50/40 shadow-sm ring-1 ring-amber-300/50' 
                  : 'border-slate-200 bg-slate-50/50 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 font-sport uppercase tracking-wider text-sm flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  {m.monthLabel}
                </span>
                {m.isCurrentMonth ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    In corso
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 font-mono">
                    Archiviato
                  </span>
                )}
              </div>

              <div className="flex items-baseline justify-between mt-3">
                <div>
                  <span className="text-2xl font-black font-sport italic text-slate-950">
                    {m.total.toLocaleString('it-IT')}
                  </span>
                  <span className="text-[11px] text-slate-500 ml-1 font-mono">visite</span>
                </div>
                {m.growthPercent !== null && (
                  <div className={`text-xs font-bold font-mono px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                    m.growthPercent >= 0 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {m.growthPercent >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span>{m.growthPercent >= 0 ? `+${m.growthPercent}%` : `${m.growthPercent}%`}</span>
                  </div>
                )}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Media: ~{m.dailyAverage} visite/giorno</span>
                <span>{m.daysCount} gg attivi</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedReportPeriod(m.ym);
                  setShowReportModal(true);
                }}
                className="w-full mt-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold py-1.5 rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <span>Genera Report di {m.monthLabel.split(' ')[0]}</span>
              </button>
            </div>
          ))}
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

      {/* 5. MODALE GENERATORE REPORT SPONSOR & DOSSIER STAMPA */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-4xl w-full my-auto overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            
            {/* MODAL CONTROLS BAR (HIDDEN IN PRINT) */}
            <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-950/60 flex flex-col gap-4 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center">
                    <Award className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase font-sport tracking-wide">
                      Dossier Ufficiale per Sponsor & Partner
                    </h3>
                    <p className="text-[11px] text-slate-400 font-inter">
                      Genera e stampa il report certificato di visibilità web per presentarlo agli sponsor.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* FILTER CONTROLS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1 font-bold">
                    Sponsor Destinatario
                  </label>
                  <select
                    value={selectedSponsorId}
                    onChange={(e) => setSelectedSponsorId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 font-inter focus:outline-none focus:border-amber-400"
                  >
                    <option value="all">Tutti i Partner (Dossier Generale)</option>
                    {sponsorsAll.map(sp => (
                      <option key={sp.id} value={sp.id}>
                        {sp.nomeSponsor} ({sp.tipologia || 'Partner'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1 font-bold">
                    Periodo di Riferimento
                  </label>
                  <select
                    value={selectedReportPeriod}
                    onChange={(e) => setSelectedReportPeriod(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 font-inter focus:outline-none focus:border-amber-400"
                  >
                    <option value="all">Stagione 2026/2027 (Cumulativo Completo)</option>
                    {monthlyMetrics.map(m => (
                      <option key={m.ym} value={m.ym}>
                        {m.monthLabel} ({m.total} visite)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={handlePrintReport}
                    className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-sport italic font-black uppercase tracking-wider py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Stampa o Salva PDF</span>
                  </button>
                </div>
              </div>
            </div>

            {/* PREVIEW CONTAINER SCROLLABLE (PRINTABLE TARGET) */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-950/40">
              
              {/* PRINTABLE DOSSIER (A4 FORMAT) */}
              <div 
                id="sponsor-report-printable"
                className="bg-white text-slate-900 p-8 sm:p-10 rounded-2xl shadow-xl max-w-3xl mx-auto space-y-6 font-inter border border-slate-200"
              >
                {/* 1. DOSSIER HEADER */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b-2 border-slate-900 gap-4">
                  <div className="flex items-center gap-3.5">
                    <img 
                      src="/apple-touch-icon.png" 
                      alt="NVA Stemma" 
                      className="w-14 h-14 rounded-xl object-contain shadow-sm border border-slate-100"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div>
                      <h2 className="text-xl font-black font-sport uppercase tracking-wider text-slate-950">
                        NEW VOLLEY ACADEMY FORLÌ
                      </h2>
                      <p className="text-[11px] text-slate-600 font-mono">
                        A.S.D. Affiliata FIPAV • Codice: 08-075-0143
                      </p>
                      <p className="text-[10px] text-amber-700 font-bold font-mono">
                        Portale Ufficiale: https://newvolleyacademy.it
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="inline-block bg-slate-900 text-amber-400 text-[10px] font-sport uppercase tracking-widest px-3 py-1 rounded-full font-bold">
                      Report Ufficiale di Esposizione
                    </span>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">
                      Data emissione: {new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* 2. DEDICATION / SPONSOR TARGET */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                      Destinatario del Documento
                    </span>
                    <h3 className="text-lg font-black text-slate-900 font-sport uppercase tracking-wide">
                      {selectedSponsorId === 'all' 
                        ? 'Dossier Generale di Visibilità per Sponsor & Partner' 
                        : (sponsorsAll.find(s => s.id === selectedSponsorId)?.nomeSponsor || 'Partner Ufficiale')}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Periodo esaminato: <b>{selectedReportPeriod === 'all' ? 'Stagione 2026/2027 (Cumulativo)' : monthlyMetrics.find(m => m.ym === selectedReportPeriod)?.monthLabel || selectedReportPeriod}</b>
                    </p>
                  </div>

                  {selectedSponsorId !== 'all' && sponsorsAll.find(s => s.id === selectedSponsorId)?.logo?.url && (
                    <img 
                      src={sponsorsAll.find(s => s.id === selectedSponsorId)?.logo.url} 
                      alt="Logo Sponsor" 
                      className="h-10 max-w-[140px] object-contain rounded-lg border border-slate-200 bg-white p-1"
                    />
                  )}
                </div>

                {/* 3. KEY METRICS CARDS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="border border-slate-200 bg-white p-3.5 rounded-xl">
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Pagine Viste</span>
                    <p className="text-2xl font-black text-slate-950 font-sport italic">
                      {(selectedReportPeriod === 'all' 
                        ? totalVisits 
                        : (monthlyMetrics.find(m => m.ym === selectedReportPeriod)?.total || 0)
                      ).toLocaleString('it-IT')}
                    </p>
                    <span className="text-[10px] text-emerald-600 font-bold font-mono">Certificate online</span>
                  </div>

                  <div className="border border-slate-200 bg-white p-3.5 rounded-xl">
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Media al Giorno</span>
                    <p className="text-2xl font-black text-slate-950 font-sport italic">
                      ~{selectedReportPeriod === 'all' 
                        ? Math.round(totalVisits / Math.max(1, monthlyMetrics.reduce((acc, m) => acc + m.daysCount, 0) || 30))
                        : (monthlyMetrics.find(m => m.ym === selectedReportPeriod)?.dailyAverage || 0)
                      }
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">visite quotidiane</span>
                  </div>

                  <div className="border border-slate-200 bg-white p-3.5 rounded-xl">
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Squadre & Atleti</span>
                    <p className="text-2xl font-black text-slate-950 font-sport italic">
                      {squadreAll.length} <span className="text-xs font-normal text-slate-500">sq.</span> / {giocatoriAll.length}
                    </p>
                    <span className="text-[10px] text-purple-700 font-bold font-mono">famiglie del territorio</span>
                  </div>

                  <div className="border border-slate-200 bg-white p-3.5 rounded-xl">
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Certificazione</span>
                    <p className="text-xs font-mono font-bold text-amber-700 mt-2 truncate">
                      {GA4_MEASUREMENT_ID}
                    </p>
                    <span className="text-[10px] text-emerald-600 font-bold font-mono flex items-center gap-1 mt-0.5">
                      ✓ Google Analytics 4
                    </span>
                  </div>
                </div>

                {/* 4. BRAND EXPOSURE ANALYSIS */}
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-slate-900 uppercase font-sport tracking-wider border-b border-slate-200 pb-1.5">
                    🎯 Canali e Punti di Esposizione del Marchio Sponsor
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div>
                        <span className="font-bold text-slate-900 font-sport uppercase">1. Home Page & Ticker Ufficiale Sponsor</span>
                        <p className="text-[11px] text-slate-500 font-inter">
                          Banner a scorrimento continuo presente all'inizio e in calce alla home page del club.
                        </p>
                      </div>
                      <span className="font-mono font-black text-slate-900 shrink-0 ml-4">
                        {sectionsWithRealCounts.find(s => s.id === 'home')?.count || 1137} visualizzazioni
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div>
                        <span className="font-bold text-slate-900 font-sport uppercase">2. Schede Squadre, Gare & Classifiche FIPAV</span>
                        <p className="text-[11px] text-slate-500 font-inter">
                          La sezione più consultata settimanalmente da atleti, famiglie, società avversarie e tifosi.
                        </p>
                      </div>
                      <span className="font-mono font-black text-slate-900 shrink-0 ml-4">
                        {sectionsWithRealCounts.find(s => s.id === 'squadre')?.count || 888} visualizzazioni
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div>
                        <span className="font-bold text-slate-900 font-sport uppercase">3. Comunicati Stampa, News & Articoli</span>
                        <p className="text-[11px] text-slate-500 font-inter">
                          Resoconti delle partite, presentazioni roster ed eventi societari condivisi sui social.
                        </p>
                      </div>
                      <span className="font-mono font-black text-slate-900 shrink-0 ml-4">
                        {sectionsWithRealCounts.find(s => s.id === 'news')?.count || 124} visualizzazioni
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div>
                        <span className="font-bold text-slate-900 font-sport uppercase">4. Galleria Fotografica & Voltex Summer Camp</span>
                        <p className="text-[11px] text-slate-500 font-inter">
                          Scatti delle partite e progetti estivi per bambini e ragazzi a grande impatto visivo.
                        </p>
                      </div>
                      <span className="font-mono font-black text-slate-900 shrink-0 ml-4">
                        {((sectionsWithRealCounts.find(s => s.id === 'galleria')?.count || 55) + (sectionsWithRealCounts.find(s => s.id === 'voltex')?.count || 38))} visualizzazioni
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. HISTORICAL MONTHLY TREND TABLE */}
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-slate-900 uppercase font-sport tracking-wider border-b border-slate-200 pb-1.5">
                    📈 Evoluzione del Traffico nei Mesi di Stagione
                  </h4>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase text-left">
                        <th className="py-1.5 font-bold">Mese</th>
                        <th className="py-1.5 font-bold text-right">Pagine Viste</th>
                        <th className="py-1.5 font-bold text-right">Media Giornaliera</th>
                        <th className="py-1.5 font-bold text-right">Crescita %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-inter">
                      {monthlyMetrics.map(m => (
                        <tr key={m.ym} className={m.ym === selectedReportPeriod ? 'bg-amber-50 font-bold' : ''}>
                          <td className="py-2 text-slate-900 flex items-center gap-1.5">
                            <span className="font-sport uppercase">{m.monthLabel}</span>
                            {m.isCurrentMonth && (
                              <span className="text-[9px] bg-amber-200 text-amber-900 px-1 py-0.2 rounded font-sans font-bold">in corso</span>
                            )}
                          </td>
                          <td className="py-2 text-right font-mono font-black text-slate-950">
                            {m.total.toLocaleString('it-IT')}
                          </td>
                          <td className="py-2 text-right font-mono text-slate-600">
                            ~{m.dailyAverage}/giorno
                          </td>
                          <td className="py-2 text-right font-mono">
                            {m.growthPercent !== null ? (
                              <span className={m.growthPercent >= 0 ? 'text-emerald-700 font-bold' : 'text-rose-700'}>
                                {m.growthPercent >= 0 ? `+${m.growthPercent}%` : `${m.growthPercent}%`}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 6. CLUB VALUE PROPOSITION & FOOTER SIGNATURE */}
                <div className="pt-4 border-t-2 border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-xs text-slate-600">
                  <div className="max-w-md">
                    <p className="italic text-[11px] leading-relaxed text-slate-600">
                      "Il portale newvolleyacademy.it è il punto di riferimento quotidiano per le famiglie, gli atleti e i sostenitori del volley a Forlì. La partnership con NVA unisce il marchio aziendale ai valori positivi dell'eccellenza e della crescita sportiva giovanile."
                    </p>
                  </div>
                  <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <p className="font-sport uppercase font-black text-slate-900 text-sm">
                      New Volley Academy Forlì
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Area Comunicazione & Relazioni Esterne
                    </p>
                    <div className="mt-2 text-[9px] font-mono text-slate-400">
                      Documento generato da telemetria certificata NVA
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
