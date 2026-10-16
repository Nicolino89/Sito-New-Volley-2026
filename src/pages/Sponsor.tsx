import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { 
  Users, 
  ExternalLink, 
  Trophy, 
  Sparkles, 
  Flame, 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Download, 
  Send, 
  Shirt, 
  Building2, 
  Award,
  ChevronRight
} from 'lucide-react';
import { 
  db, 
  isDemoMode, 
  getSquadreAll, 
  getSocietaConfig,
  getSponsorPageConfig,
  inviaRichiestaSponsor,
  SponsorPageConfig,
  DEFAULT_SPONSOR_PAGE_CONFIG
} from '../firebase-societa';

interface SponsorDoc {
  id: string;
  nomeSponsor: string;
  linkSito: string;
  tipologia: 'Main Sponsor' | 'Gold Partner' | 'Sponsor Tecnico' | 'Partner Locale';
  logo: { url: string; positionY: number };
  squadreAssociate: string[];
  ordine: number;
}

const CAMPIONI_VOLLEY = [
  { nome: "Fabio Vullo", ruolo: "Leggenda Volley Italiano & Pluricampione d'Europa" },
  { nome: "Valentina Diouf", ruolo: "Opposto • Nazionale Italiana" },
  { nome: "Caterina Bosetti", ruolo: "Schiacciatrice • Oro Olimpico Parigi 2024" },
  { nome: "Serena Ortolani", ruolo: "Campionessa del Mondo & d'Europa" },
  { nome: "Salvatore 'Totò' Rossini", ruolo: "Libero • Argento Olimpico Rio 2016" },
  { nome: "Jurii Panchenko", ruolo: "Oro Olimpico • Coach Internazionale" },
  { nome: "Dmitrii Panchenko", ruolo: "Direttore Tecnico Attività Estiva NVA" },
  { nome: "Gabriel Kunda", ruolo: "Direttore Tecnico NVA" },
  { nome: "Giulia Leonardi", ruolo: "Libero • Pluricampionessa d'Italia ed Europa" },
  { nome: "Nicola Cianciotta", ruolo: "Talento Nazionale & Serie A" }
];

export default function SponsorPage() {
  const location = useLocation();
  const [sponsors, setSponsors] = useState<SponsorDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamNames, setTeamNames] = useState<Record<string, string>>({});
  const [pageConfig, setPageConfig] = useState<SponsorPageConfig>(DEFAULT_SPONSOR_PAGE_CONFIG);

  // Form richiesta sponsor state
  const [formAzienda, setFormAzienda] = useState('');
  const [formReferente, setFormReferente] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formInteresse, setFormInteresse] = useState('Divise e Maglie da Gara');
  const [formMessaggio, setFormMessaggio] = useState('');
  const [invioInCorso, setInvioInCorso] = useState(false);
  const [invioSuccesso, setInvioSuccesso] = useState(false);

  // Scroll to hash on load (es. #diventa-partner)
  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }, [location.hash, loading]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teams, configSponsor] = await Promise.all([
          getSquadreAll(),
          getSponsorPageConfig()
        ]);
        
        const mapping: Record<string, string> = {};
        teams.forEach((t) => { mapping[t.id] = t.nome_squadra; });
        setTeamNames(mapping);
        if (configSponsor) setPageConfig(configSponsor);
      } catch (err) {
        console.error("Errore fetch ausiliari:", err);
      }

      // Fetch sponsors
      try {
        let fetched: SponsorDoc[] = [];
        if (!isDemoMode && db) {
          const sponsorsRef = collection(db, 'sponsors');
          const q = query(sponsorsRef, orderBy('ordine', 'asc'));
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((docSnap) => {
            const docData = docSnap.data();
            fetched.push({
              id: docSnap.id,
              nomeSponsor: docData.nomeSponsor || docData.nome || '',
              linkSito: docData.linkSito || docData.sito_web || '',
              tipologia: docData.tipologia || (docData.livello === 'Main' ? 'Main Sponsor' : docData.livello === 'Gold' ? 'Gold Partner' : 'Partner Locale'),
              logo: docData.logo || { url: docData.logo_url || '', positionY: docData.logoPositionY ?? 50 },
              squadreAssociate: docData.squadreAssociate || [],
              ordine: typeof docData.ordine === 'number' ? docData.ordine : 99,
            });
          });
        }
        setSponsors(fetched);
      } catch (err) {
        console.error("Errore recupero sponsor:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmitRichiesta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAzienda || !formTelefono || !formEmail) return;

    setInvioInCorso(true);
    try {
      await inviaRichiestaSponsor({
        nomeAzienda: formAzienda,
        referente: formReferente,
        telefono: formTelefono,
        email: formEmail,
        categoriaInteresse: formInteresse,
        messaggio: formMessaggio
      });
      setInvioSuccesso(true);
      setFormAzienda('');
      setFormReferente('');
      setFormTelefono('');
      setFormEmail('');
      setFormMessaggio('');
    } catch (err) {
      console.error("Errore invio richiesta partnership:", err);
      alert("Si è verificato un errore durante l'invio. Riprova o contattaci telefonicamente.");
    } finally {
      setInvioInCorso(false);
    }
  };

  const mainSponsors = sponsors.filter(s => s.tipologia === 'Main Sponsor');
  const goldPartners = sponsors.filter(s => s.tipologia === 'Gold Partner');
  const techSponsors = sponsors.filter(s => s.tipologia === 'Sponsor Tecnico');
  const localPartners = sponsors.filter(s => s.tipologia === 'Partner Locale');

  const renderCardInner = (sponsor: SponsorDoc, logoHeightClass: string, isMain = false) => (
    <>
      <div className={`${logoHeightClass} overflow-hidden bg-white relative flex items-center justify-center p-4`}>
        {sponsor.logo?.url ? (
          <img
            src={sponsor.logo.url}
            alt={`Logo ${sponsor.nomeSponsor}`}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            style={{ objectPosition: `center ${sponsor.logo?.positionY ?? 50}%` }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
            }}
          />
        ) : (
          <span className="font-inter text-slate-300 text-xs uppercase tracking-widest">Logo non disponibile</span>
        )}
      </div>

      {isMain && (
        <div className="bg-slate-50 border-t border-slate-100 px-4 py-3 text-center">
          <h3 className="font-barlow font-bold text-lg text-slate-900 uppercase tracking-tight">
            {sponsor.nomeSponsor}
          </h3>
        </div>
      )}

      <div className="border-t border-slate-100 px-4 py-3 bg-white">
        <div className="font-inter font-semibold text-slate-900 text-sm truncate">
          {sponsor.nomeSponsor}
        </div>
        {sponsor.linkSito && (
          <div className="font-inter text-amber-600 text-xs font-semibold mt-0.5 group-hover:underline flex items-center gap-1">
            Visita il sito <ExternalLink className="w-3 h-3 inline" />
          </div>
        )}
        {sponsor.squadreAssociate && sponsor.squadreAssociate.length > 0 && (
          <div className="font-inter text-slate-400 text-[10px] mt-2 flex items-center gap-1.5 border-t border-slate-50 pt-1.5">
            <Users className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
            <span className="truncate">
              Partner di: {sponsor.squadreAssociate.map(id => teamNames[id] || id).join(', ')}
            </span>
          </div>
        )}
      </div>
    </>
  );

  const renderCard = (sponsor: SponsorDoc, logoHeightClass: string, isMain = false) => {
    if (sponsor.linkSito) {
      return (
        <a
          key={sponsor.id}
          href={sponsor.linkSito}
          target="_blank"
          rel="noopener noreferrer"
          className="group block bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-[#FFE600] hover:shadow-xl transition-all duration-200 shadow-xs"
        >
          {renderCardInner(sponsor, logoHeightClass, isMain)}
        </a>
      );
    }
    return (
      <div key={sponsor.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {renderCardInner(sponsor, logoHeightClass, isMain)}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ================= HERO SECTION ================= */}
      <section className="relative bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden border-b-4 border-[#FFE600]">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FFE600_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-mono text-[#FFE600] hover:underline uppercase tracking-wider mb-6">
            ← Torna alla Home
          </Link>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFE600]/15 border border-[#FFE600]/30 text-[#FFE600] text-xs font-mono font-bold tracking-widest uppercase mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              AREA AZIENDE & PARTNERSHIP
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-anton uppercase tracking-tight leading-none text-white mb-6">
              {pageConfig.titoloHero || "PLAY WITH US"}
            </h1>

            <p className="text-base sm:text-lg text-zinc-300 font-inter leading-relaxed mb-8">
              {pageConfig.sottotitoloHero}
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="#diventa-partner"
                className="bg-[#FFE600] text-black font-barlow font-bold uppercase tracking-wider px-6 py-3 rounded-xl hover:bg-white transition-all shadow-lg hover:shadow-[#FFE600]/20 flex items-center gap-2 text-sm"
              >
                Diventa Nostro Partner <ChevronRight className="w-4 h-4" />
              </a>
              <a
                href="#sponsor-attuali"
                className="bg-zinc-800/80 hover:bg-zinc-800 text-white font-barlow font-semibold uppercase tracking-wider px-5 py-3 rounded-xl border border-zinc-700 transition-all text-sm"
              >
                I Nostri Partner Attuali
              </a>
              {pageConfig.brochurePdfUrl && (
                <a
                  href={pageConfig.brochurePdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-transparent hover:bg-white/10 text-zinc-300 hover:text-white font-mono text-xs uppercase tracking-wider px-4 py-3 rounded-xl border border-zinc-700 transition-all"
                >
                  <Download className="w-4 h-4 text-[#FFE600]" /> Scarica Presentazione PDF
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================= SEZIONE NUMERI CHIAVE ================= */}
      <section className="bg-black py-12 px-4 sm:px-6 lg:px-8 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-[11px] font-mono text-[#FFE600] uppercase tracking-widest font-bold">L'impatto sul territorio</span>
            <h2 className="text-2xl sm:text-3xl font-anton text-white uppercase tracking-wide mt-1">
              I Numeri del New Volley Academy
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl text-center">
              <span className="text-3xl sm:text-4xl font-anton text-[#FFE600] block">{pageConfig.numeroAtleti || "387+"}</span>
              <span className="text-xs font-mono uppercase text-zinc-400 mt-1 block">Atleti Tesserati (FIPAV/CSI/AICS)</span>
            </div>
            <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl text-center">
              <span className="text-3xl sm:text-4xl font-anton text-white block">{pageConfig.numeroGruppi || "10+"}</span>
              <span className="text-xs font-mono uppercase text-zinc-400 mt-1 block">Gruppi Adulti & Giovanili</span>
            </div>
            <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl text-center">
              <span className="text-3xl sm:text-4xl font-anton text-[#FFE600] block">{pageConfig.numeroPartite || "280+"}</span>
              <span className="text-xs font-mono uppercase text-zinc-400 mt-1 block">Partite Ufficiali / Anno</span>
            </div>
            <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl text-center">
              <span className="text-3xl sm:text-4xl font-anton text-white block">{pageConfig.numeroStaff || "20+"}</span>
              <span className="text-xs font-mono uppercase text-zinc-400 mt-1 block">Staff e Dirigenti Qualificati</span>
            </div>
            <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl text-center">
              <span className="text-3xl sm:text-4xl font-anton text-[#FFE600] block">{pageConfig.numeroEventi || "10"}</span>
              <span className="text-xs font-mono uppercase text-zinc-400 mt-1 block">Grandi Eventi Prodotti</span>
            </div>
            <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl text-center">
              <span className="text-3xl sm:text-4xl font-anton text-white block">{pageConfig.numeroFamiglie || "500+"}</span>
              <span className="text-xs font-mono uppercase text-zinc-400 mt-1 block">Famiglie Coinvolte</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SEZIONE GRANDI NOMI DEL VOLLEY ================= */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-zinc-950 text-white border-b border-zinc-800">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-mono text-[#FFE600] uppercase tracking-widest font-bold">Un palcoscenico di eccellenza</span>
            <h2 className="text-3xl sm:text-4xl font-anton uppercase text-white mt-2 leading-tight">
              Hanno vestito i loghi dei nostri Main Partner
            </h2>
            <p className="text-zinc-400 text-sm font-inter mt-3 leading-relaxed">
              Campioni olimpici, leggende della pallavolo italiana e atleti azzurri hanno indossato e promosso le divise con i marchi dei nostri sponsor nei nostri eventi, camp e palazzetti.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {CAMPIONI_VOLLEY.map((campione, idx) => (
              <div 
                key={idx}
                className="bg-zinc-900/70 border border-zinc-800/80 p-4 rounded-xl hover:border-[#FFE600]/50 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#FFE600]/10 border border-[#FFE600]/30 flex items-center justify-center text-[#FFE600] mb-3 group-hover:scale-110 transition-transform">
                  <Award className="w-4 h-4" />
                </div>
                <h4 className="font-barlow font-bold text-white text-base uppercase tracking-wide group-hover:text-[#FFE600] transition-colors">
                  {campione.nome}
                </h4>
                <p className="text-[11px] font-mono text-zinc-400 mt-1">
                  {campione.ruolo}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SEZIONE FORMAT PARTNERSHIP ================= */}
      <section id="diventa-partner" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 border-b border-slate-200 scroll-mt-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-mono font-bold tracking-widest uppercase mb-3">
              OPPORTUNITÀ MODULABILI
            </div>
            <h2 className="text-3xl sm:text-5xl font-anton uppercase text-slate-950 tracking-tight">
              I Format di Visibilità
            </h2>
            <p className="text-slate-600 font-inter text-base mt-4 leading-relaxed">
              Costruiamo partnership personalizzate a supporto dei tuoi obiettivi aziendali: dal posizionamento su maglia alla presenza in arena, fino alla titolazione dei grandi eventi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Format 1 */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 p-8 flex flex-col justify-between shadow-sm hover:border-slate-900 hover:shadow-xl transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-black text-[#FFE600] flex items-center justify-center shadow-md">
                  <Shirt className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono font-bold text-amber-600 uppercase tracking-wider block">Format Divise</span>
                <h3 className="text-2xl font-barlow font-extrabold text-slate-950 uppercase tracking-tight">
                  Game & Warm-Up Partner
                </h3>
                <p className="text-xs text-slate-600 font-inter leading-relaxed">
                  Ogni anno realizziamo una grafica esclusiva per le nostre mute da gara. Il tuo brand sarà protagonista su tutti i campi regionali ed extra-regionali.
                </p>
                <ul className="space-y-2.5 text-xs text-slate-700 font-inter pt-3 border-t border-slate-100">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Logo frontale o retro sulle maglie di Serie D (Maschile / Femminile)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Logo sui completi pre-gara e riscaldamento</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Possibilità di abbinamento alle divise di tutto il settore giovanile</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Format 2 */}
            <div className="bg-zinc-950 text-white rounded-3xl border-2 border-[#FFE600] p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-[#FFE600] text-black text-[10px] font-barlow font-black uppercase px-2.5 py-0.5 rounded shadow">
                PIÙ RICHIESTO
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FFE600] text-black flex items-center justify-center shadow-md">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono font-bold text-[#FFE600] uppercase tracking-wider block">Format Arena</span>
                <h3 className="text-2xl font-barlow font-extrabold text-white uppercase tracking-tight">
                  Palasport & Matchday
                </h3>
                <p className="text-xs text-zinc-300 font-inter leading-relaxed">
                  Massima visibilità durante tutte le gare casalinghe di campionato, le finali playoff e i tornei territoriali con centinaia di spettatori ogni weekend.
                </p>
                <ul className="space-y-2.5 text-xs text-zinc-200 font-inter pt-3 border-t border-zinc-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#FFE600] shrink-0 mt-0.5" />
                    <span>Esposizione cartellone o striscione a bordo campo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#FFE600] shrink-0 mt-0.5" />
                    <span>Visibilità durante tutte le partite casalinghe di campionato FIPAV e CSI</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#FFE600] shrink-0 mt-0.5" />
                    <span>Presenza sui canali social NVA e sul sito web ufficiale con backlink</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Format 3 */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 p-8 flex flex-col justify-between shadow-sm hover:border-slate-900 hover:shadow-xl transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-black text-[#FFE600] flex items-center justify-center shadow-md">
                  <Trophy className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono font-bold text-amber-600 uppercase tracking-wider block">Format Eventi & Title</span>
                <h3 className="text-2xl font-barlow font-extrabold text-slate-950 uppercase tracking-tight">
                  Title & Event Partner
                </h3>
                <p className="text-xs text-slate-600 font-inter leading-relaxed">
                  Lega il nome della tua azienda ai nostri eventi di riferimento nazionale: la NVA Cup, il Summer Camp in Riviera Romagnola o il festival Volleyland.
                </p>
                <ul className="space-y-2.5 text-xs text-slate-700 font-inter pt-3 border-t border-slate-100">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Denominazione ufficiale dell'evento o della squadra ("Team [Nome Sponsor]")</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Main Partner del Summer Camp con i Super Ospiti del volley italiano</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Campagne di comunicazione dedicate su media e stampa</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Form di candidatura diretta B2B */}
          <div className="mt-16 bg-white rounded-3xl border border-slate-300 p-8 sm:p-12 shadow-xl max-w-3xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-8">
              <h3 className="text-2xl sm:text-3xl font-anton uppercase text-slate-900">
                Richiedi Informazioni o un Incontro
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-inter mt-2">
                Compila il modulo sottostante: il nostro responsabile relazioni esterne ti ricontatterà entro 24 ore senza alcun impegno.
              </p>
            </div>

            {invioSuccesso ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-barlow font-bold text-lg text-emerald-950 uppercase">Richiesta Inviata con Successo!</h4>
                <p className="text-xs text-emerald-800 font-inter max-w-md mx-auto">
                  Grazie per il tuo interesse. Abbiamo ricevuto i tuoi dati e ti contatteremo a breve per illustrarti tutte le opportunità.
                </p>
                <button
                  onClick={() => setInvioSuccesso(false)}
                  className="mt-2 text-xs font-mono font-bold uppercase text-emerald-700 underline"
                >
                  Invia un'altra richiesta
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitRichiesta} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 uppercase">Ragione Sociale / Azienda *</label>
                    <input
                      type="text"
                      required
                      placeholder="es. Acme S.r.l."
                      value={formAzienda}
                      onChange={(e) => setFormAzienda(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 uppercase">Nome Referente</label>
                    <input
                      type="text"
                      placeholder="es. Mario Rossi"
                      value={formReferente}
                      onChange={(e) => setFormReferente(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 uppercase">Telefono / Cellulare *</label>
                    <input
                      type="tel"
                      required
                      placeholder="es. +39 333 1234567"
                      value={formTelefono}
                      onChange={(e) => setFormTelefono(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 uppercase">Email Aziendale *</label>
                    <input
                      type="email"
                      required
                      placeholder="es. info@azienda.it"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase">Ambito di Interesse Principale</label>
                  <select
                    value={formInteresse}
                    onChange={(e) => setFormInteresse(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  >
                    <option value="Divise e Maglie da Gara">Divise e Maglie da Gara (Serie D / Giovanili)</option>
                    <option value="Cartellonistica Palazzetto">Cartellonistica & Banner in Palazzetto</option>
                    <option value="Title Partner Eventi/Camp">Title Partner Eventi (Summer Camp, NVA Cup, Volleyland)</option>
                    <option value="Sponsor Tecnico e Forniture">Sponsor Tecnico / Fornitura</option>
                    <option value="Altro">Altro / Partnership Personalizzata</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase">Note o Richieste Particolari</label>
                  <textarea
                    rows={3}
                    placeholder="Scrivi qui eventuali domande o preferenze per essere ricontattato..."
                    value={formMessaggio}
                    onChange={(e) => setFormMessaggio(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-slate-900 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={invioInCorso}
                  className="w-full bg-[#121212] text-[#FFE600] font-barlow font-bold uppercase tracking-wider py-3.5 rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer disabled:opacity-50"
                >
                  {invioInCorso ? "Invio in corso..." : (
                    <>
                      <Send className="w-4 h-4" /> Invia Richiesta di Contatto
                    </>
                  )}
                </button>

                <p className="text-[10px] text-slate-400 text-center font-inter pt-1">
                  Oppure contatta direttamente: {pageConfig.emailReferenteSponsor} • {pageConfig.telefonoReferenteSponsor}
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ================= SEZIONE SPONSOR ATTUALI ================= */}
      <section id="sponsor-attuali" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-10">
        <div className="mb-12">
          <span className="text-xs font-mono text-amber-600 uppercase tracking-widest font-bold">La nostra rete</span>
          <h2 className="font-anton uppercase tracking-wide text-3xl sm:text-4xl text-slate-950 mt-1">
            I Nostri Partner & Sponsor Ufficiali
          </h2>
          <p className="font-inter text-slate-600 text-sm mt-2 max-w-2xl leading-relaxed">
            Le aziende che hanno scelto di scendere in campo al nostro fianco, sostenendo il progetto New Volley Academy.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-40" />
            ))}
          </div>
        ) : (
          <>
            {/* Gruppo "Main Sponsor" */}
            {mainSponsors.length > 0 && (
              <div className="mb-14">
                <span className="font-barlow font-bold text-black text-xs tracking-widest uppercase bg-[#FFE600] px-3.5 py-1 inline-block mb-6 rounded-md shadow-sm">
                  MAIN SPONSOR
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {mainSponsors.map(sponsor => renderCard(sponsor, "h-56", true))}
                </div>
              </div>
            )}

            {/* Gruppo "Gold Partner" */}
            {goldPartners.length > 0 && (
              <div className="mb-14">
                <span className="bg-amber-100 text-amber-900 font-barlow font-bold text-xs tracking-widest uppercase px-3.5 py-1 inline-block mb-6 rounded-md">
                  GOLD PARTNER
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {goldPartners.map(sponsor => renderCard(sponsor, "h-40", false))}
                </div>
              </div>
            )}

            {/* Gruppo "Sponsor Tecnico" */}
            {techSponsors.length > 0 && (
              <div className="mb-14">
                <span className="bg-blue-100 text-blue-900 font-barlow font-bold text-xs tracking-widest uppercase px-3.5 py-1 inline-block mb-6 rounded-md">
                  SPONSOR TECNICO
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                  {techSponsors.map(sponsor => renderCard(sponsor, "h-28", false))}
                </div>
              </div>
            )}

            {/* Gruppo "Partner Locale" */}
            {localPartners.length > 0 && (
              <div className="mb-14">
                <span className="bg-slate-200 text-slate-800 font-barlow font-bold text-xs tracking-widest uppercase px-3.5 py-1 inline-block mb-6 rounded-md">
                  PARTNER LOCALE
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {localPartners.map(sponsor => renderCard(sponsor, "h-24", false))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
