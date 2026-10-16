import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Flame, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Trophy, 
  CheckCircle2, 
  Sparkles, 
  Send, 
  MessageCircle, 
  Instagram, 
  ChevronRight, 
  ShieldCheck, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { 
  getVoltexCampConfig, 
  salvaIscrizioneVoltex, 
  VoltexCampConfig, 
  DEFAULT_VOLTEX_CAMP_CONFIG,
  VoltexIscrizione,
  SocietaInfo
} from '../firebase-societa';
import { updatePageMeta } from '../utils/seoHelper';

interface VoltexCampPageProps {
  societaInfo?: SocietaInfo;
}

export default function VoltexCampPage({ societaInfo }: VoltexCampPageProps) {
  const [config, setConfig] = useState<VoltexCampConfig>(DEFAULT_VOLTEX_CAMP_CONFIG);
  const [loading, setLoading] = useState(true);
  const [selectedTappaId, setSelectedTappaId] = useState<string>('');
  
  // Form stato
  const [nomeAtleta, setNomeAtleta] = useState('');
  const [cognomeAtleta, setCognomeAtleta] = useState('');
  const [dataNascita, setDataNascita] = useState('');
  const [sesso, setSesso] = useState<'M' | 'F'>('F');
  const [ruolo, setRuolo] = useState('Schiacciatore');
  const [livelloSquadra, setLivelloSquadra] = useState('');
  const [nomeGenitore, setNomeGenitore] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [tagliaKit, setTagliaKit] = useState('M');
  const [note, setNote] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState('');

  useEffect(() => {
    updatePageMeta({
      title: 'Voltex Academy Summer Camp - Alta Specializzazione Volley by Valentina Diouf',
      description: 'Scopri il Voltex Academy Summer Camp con Valentina Diouf: camp estivo di alta specializzazione tecnica e mental coaching per giovani atleti. Iscrizioni aperte!',
      image: 'https://newvolleyacademy.it/images/voltex/voltex-riccione-cover.jpg',
      url: 'https://newvolleyacademy.it/voltex'
    });

    let mounted = true;
    getVoltexCampConfig().then((data) => {
      if (mounted) {
        setConfig(data);
        const primaAttiva = data.date_camp?.find(d => d.attivo && d.stato !== 'chiuse');
        if (primaAttiva) {
          setSelectedTappaId(primaAttiva.id);
        }
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeAtleta || !cognomeAtleta || !telefono || !selectedTappaId) return;

    setIsSubmitting(true);
    const tappaScelta = config.date_camp.find(d => d.id === selectedTappaId);
    const tappaNome = tappaScelta ? `${tappaScelta.titolo} (${tappaScelta.localita})` : 'Tappa Voltex';

    const nuovaIscrizione: VoltexIscrizione = {
      id: `volt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      data_richiesta: new Date().toISOString(),
      nome_atleta: nomeAtleta.trim(),
      cognome_atleta: cognomeAtleta.trim(),
      data_nascita: dataNascita,
      sesso,
      ruolo,
      livello_squadra: livelloSquadra.trim(),
      tappa_selezionata_id: selectedTappaId,
      tappa_nome: tappaNome,
      nome_genitore: nomeGenitore.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      taglia_kit: tagliaKit,
      note: note.trim(),
      stato: 'nuova'
    };

    try {
      await salvaIscrizioneVoltex(nuovaIscrizione);
      
      const numeroWa = (config.contatti_whatsapp || societaInfo?.contatti?.telefono || '393400000000').replace(/[^0-9]/g, '');
      const testoWa = encodeURIComponent(
        `🏐 *RICHIESTA ISCRIZIONE VOLTEX CAMP 2026*\n\n` +
        `• *Atleta:* ${nomeAtleta} ${cognomeAtleta} (${dataNascita || 'N.D.'})\n` +
        `• *Ruolo/Livello:* ${ruolo} - ${livelloSquadra || 'Standard'}\n` +
        `• *Tappa:* ${tappaNome}\n` +
        `• *Genitore:* ${nomeGenitore || 'N.D.'}\n` +
        `• *Telefono:* ${telefono}\n` +
        `• *Email:* ${email}\n` +
        `• *Taglia Kit:* ${tagliaKit}\n` +
        (note ? `• *Note:* ${note}\n` : '') +
        `\nInviato dal portale ufficiale New Volley Academy.`
      );
      setWhatsappLink(`https://wa.me/${numeroWa}?text=${testoWa}`);
      setSubmitSuccess(true);
    } catch (err) {
      console.error("Errore salvataggio iscrizione:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectTappa = (tappaId: string) => {
    setSelectedTappaId(tappaId);
    const formElem = document.getElementById('iscrizione-form');
    if (formElem) {
      formElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-[#C0392B] animate-spin" />
        <p className="font-mono text-sm text-slate-400">Caricamento Voltex Academy...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1320] text-slate-100 font-sans selection:bg-[#C0392B] selection:text-white pb-20">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 border-b border-red-950/40">
        <div className="absolute inset-0 bg-gradient-to-b from-[#C0392B]/20 via-[#0b1320] to-[#0b1320] pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C0392B]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Testi Hero */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-red-950/70 border border-red-600/40 text-red-400 text-xs font-bold uppercase tracking-wider shadow-inner">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                CAMP DI ALTA SPECIALIZZAZIONE
              </div>

              <div className="space-y-2">
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black font-sport uppercase tracking-tight text-white leading-none">
                  {config.titolo_hero || "VOLTEX ACADEMY"}
                </h1>
                <p className="text-xl sm:text-2xl font-bold text-amber-300 font-sport italic">
                  {config.sottotitolo_hero || "Il Primo Camp di Alta Specializzazione by Valentina Diouf"}
                </p>
              </div>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                {config.descrizione_breve}
              </p>

              {config.testo_annuncio && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/60 to-slate-900 border border-red-700/30 flex items-center gap-3 text-sm text-red-200">
                  <Flame className="w-5 h-5 text-red-400 shrink-0" />
                  <span>{config.testo_annuncio}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
                <a 
                  href="#iscrizione-form" 
                  className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#C0392B] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-red-900/40 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
                >
                  Iscriviti al Camp
                  <ChevronRight className="w-4 h-4" />
                </a>
                <a 
                  href="#tappe" 
                  className="px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold text-sm uppercase tracking-wider border border-slate-700/80 transition-all flex items-center gap-2"
                >
                  Date e Sedi
                </a>
                {config.instagram_username && (
                  <a 
                    href={`https://instagram.com/${config.instagram_username}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-pink-400 border border-slate-700/80 transition-all"
                    aria-label="Instagram Voltex Camp"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
              </div>
            </motion.div>

            {/* Immagini Visual Hero */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-5 relative"
            >
              <div className="relative mx-auto max-w-sm sm:max-w-md">
                <div className="rounded-3xl overflow-hidden border-2 border-red-500/30 shadow-2xl shadow-red-950/60 bg-slate-900 flex flex-col">
                  {/* Foto Principale senza coperture */}
                  <div className="relative w-full bg-slate-950 overflow-hidden flex items-center justify-center min-h-[380px]">
                    <img 
                      src={config.hero_image_url || "/images/voltex/voltex-riccione-cover.jpg"} 
                      alt="Voltex Academy Camp - Valentina Diouf" 
                      className="w-full h-auto max-h-[480px] object-contain mx-auto block"
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                    />
                  </div>
                  
                  {/* Didascalia e crediti sotto la foto, pulito ed elegante */}
                  <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-t border-red-950/60 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold">
                        Head Coach & Founder
                      </p>
                      <p className="text-base font-bold text-white font-sport">
                        {config.testimonial_nome}
                      </p>
                      <p className="text-xs text-slate-300">
                        {config.testimonial_ruolo}
                      </p>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-red-600/20 border border-red-500/30 text-right shrink-0">
                      <span className="text-[9px] uppercase tracking-wider text-amber-300 block font-bold">Formula</span>
                      <span className="text-[11px] font-black uppercase text-white font-sport">Specialist</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 2. STATISTICHE & PUNTI DI FORZA (Stile Recap Instagram) */}
      <section className="py-16 bg-gradient-to-b from-[#0b1320] to-[#0d1726]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold font-mono tracking-widest text-red-400 uppercase">La Differenza Voltex</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-sport uppercase tracking-tight">
              Un'esperienza di crescita tecnica e mentale
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {config.punti_forza?.map((pf, idx) => (
              <div 
                key={idx}
                className="relative rounded-2xl p-6 bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800/80 hover:border-red-600/50 transition-all group overflow-hidden shadow-lg"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-bl-full group-hover:bg-red-600/10 transition-colors" />
                <p className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-300 font-sport tracking-tight mb-2">
                  {pf.valore}
                </p>
                <h3 className="text-base font-bold text-white mb-2 uppercase tracking-wide font-sport">{pf.titolo}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{pf.descrizione}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. COSA COMPRENDE IL PROGRAMMA */}
      <section className="py-16 border-t border-slate-800/60 bg-[#0b1320]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold font-mono tracking-widest text-amber-400 uppercase">Metodologia Pro</span>
                <h2 className="text-3xl sm:text-4xl font-black text-white font-sport uppercase">
                  Programma Tecnico & Atletico
                </h2>
              </div>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {config.descrizione_completa}
              </p>

              <div className="space-y-3">
                {config.programma_tecnico?.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs sm:text-sm text-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              {/* Box Mental Coaching */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-red-950/40 via-slate-900 to-slate-950 border border-red-700/40 shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-amber-400 font-bold tracking-wider">Modulo Speciale</span>
                    <h3 className="text-lg font-bold text-white font-sport uppercase">Mental Coaching con Specialista</h3>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {config.mental_coaching_info}
                </p>
              </div>

              {/* Galleria Highlights Dinamica */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                    Scatti & Momenti dal Camp
                  </span>
                  <span className="text-[11px] text-red-400 font-bold">
                    {(config.galleria_foto || []).length} foto
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(config.galleria_foto && config.galleria_foto.length > 0 ? config.galleria_foto : [
                    { url: "/images/voltex/voltex-recap-stats.jpg", caption: "Recap Numeri" },
                    { url: "/images/voltex/voltex-team-group.jpg", caption: "Gruppo Atleti" },
                    { url: "/images/voltex/voltex-sassari-locandina.jpg", caption: "Sassari Camp" },
                    { url: "/images/voltex/voltex-training-diouf.jpg", caption: "Valentina Diouf" },
                    { url: "/images/voltex/voltex-ready-diouf.jpg", caption: "Allenamento" }
                  ]).map((foto, idx) => (
                    <div key={idx} className="group relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 aspect-[4/3] shadow-sm">
                      <img 
                        src={foto.url} 
                        alt={foto.caption || `Voltex Camp Highlight ${idx + 1}`} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                        loading="lazy"
                        decoding="async"
                      />
                      {foto.caption && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                          <p className="text-[10px] text-white font-medium truncate">{foto.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. TAPPE & DATE (id="tappe") */}
      <section id="tappe" className="py-20 bg-gradient-to-b from-[#0d1726] to-[#0b1320] border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold font-mono tracking-widest text-red-400 uppercase">Calendario 2026</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white font-sport uppercase tracking-tight">
              Prossime Date & Località
            </h2>
            <p className="text-sm text-slate-400">
              Scegli la tappa più adatta a te e prenota il tuo posto prima del sold-out.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {config.date_camp?.filter(d => d.attivo).map((tappa) => {
              const isClosed = tappa.stato === 'chiuse';
              const isInEsaurimento = tappa.stato === 'in_esaurimento';

              return (
                <div 
                  key={tappa.id}
                  className={`rounded-3xl p-6 sm:p-8 border transition-all relative overflow-hidden flex flex-col justify-between ${
                    selectedTappaId === tappa.id 
                      ? 'bg-slate-900 border-red-500 shadow-2xl shadow-red-950/50 ring-2 ring-red-500/20' 
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-5">
                    {/* Header Card con Badge Stato */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-red-500" />
                          {tappa.localita}
                        </span>
                        <h3 className="text-2xl font-black text-white font-sport uppercase mt-1">
                          {tappa.titolo}
                        </h3>
                      </div>
                      
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        isClosed 
                          ? 'bg-red-950 text-red-400 border border-red-800' 
                          : isInEsaurimento 
                          ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}>
                        {isClosed ? 'Sold Out' : isInEsaurimento ? 'Quasi Pieno' : 'Iscrizioni Aperte'}
                      </span>
                    </div>

                    {/* Dettagli Tappa */}
                    <div className="space-y-2.5 text-xs sm:text-sm text-slate-300 pt-2">
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="font-semibold text-white">{tappa.periodo}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{tappa.struttura}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{tappa.destinatari}</span>
                      </div>
                    </div>

                    {/* Barra Posti Disponibili */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">Disponibilità posti</span>
                        <span className="text-slate-200 font-bold">
                          {tappa.posti_occupati} / {tappa.posti_totali}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            isClosed ? 'bg-red-500' : isInEsaurimento ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.round(((tappa.posti_occupati || 0) / (tappa.posti_totali || 30)) * 100))}%` }}
                        />
                      </div>
                    </div>

                    {tappa.note && (
                      <p className="text-xs text-slate-400 italic bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                        {tappa.note}
                      </p>
                    )}
                  </div>

                  <div className="pt-6 mt-4 border-t border-slate-800/60 flex items-center justify-between gap-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{tappa.quota}</span>
                    <button
                      type="button"
                      disabled={isClosed}
                      onClick={() => handleSelectTappa(tappa.id)}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                        isClosed 
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : selectedTappaId === tappa.id
                          ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isClosed ? 'Chiuso' : selectedTappaId === tappa.id ? 'Selezionata ✓' : 'Scegli questa data'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. MODULO DI ISCRIZIONE (id="iscrizione-form") */}
      <section id="iscrizione-form" className="py-20 border-t border-slate-800 bg-[#0b1320]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-400 to-red-600" />
            
            <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-red-400">Modulo Online</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-sport uppercase">
                Iscrizione / Richiesta Informazioni
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Compila i dati per registrare la richiesta. Riceverai conferma immediata dallo staff Voltex.
              </p>
            </div>

            {submitSuccess ? (
              <div className="p-8 rounded-2xl bg-emerald-950/40 border border-emerald-600/40 text-center space-y-5 animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white font-sport uppercase">Richiesta Ricevuta con Successo!</h3>
                  <p className="text-sm text-slate-300">
                    Abbiamo registrato i dati dell'atleta <strong>{nomeAtleta} {cognomeAtleta}</strong>.
                  </p>
                </div>
                {whatsappLink && (
                  <div className="pt-2">
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Invia Conferma su WhatsApp allo Staff
                    </a>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSubmitSuccess(false);
                    setNomeAtleta('');
                    setCognomeAtleta('');
                    setTelefono('');
                    setEmail('');
                    setNote('');
                  }}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer mt-4 block mx-auto"
                >
                  Compila un'altra iscrizione
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Selezione Tappa */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Tappa Selezionata *
                  </label>
                  <select
                    value={selectedTappaId}
                    onChange={(e) => setSelectedTappaId(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500"
                  >
                    {config.date_camp?.filter(d => d.attivo).map((d) => (
                      <option key={d.id} value={d.id} disabled={d.stato === 'chiuse'}>
                        {d.titolo} - {d.localita} ({d.periodo}) {d.stato === 'chiuse' ? '[SOLD OUT]' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dati Atleta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Nome Atleta *</label>
                    <input
                      type="text"
                      required
                      value={nomeAtleta}
                      onChange={(e) => setNomeAtleta(e.target.value)}
                      placeholder="es. Martina"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Cognome Atleta *</label>
                    <input
                      type="text"
                      required
                      value={cognomeAtleta}
                      onChange={(e) => setCognomeAtleta(e.target.value)}
                      placeholder="es. Rossi"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Data di Nascita</label>
                    <input
                      type="date"
                      value={dataNascita}
                      onChange={(e) => setDataNascita(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Ruolo</label>
                    <select
                      value={ruolo}
                      onChange={(e) => setRuolo(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="Schiacciatore">Schiacciatore</option>
                      <option value="Opposto">Opposto</option>
                      <option value="Palleggiatore">Palleggiatore</option>
                      <option value="Centrale">Centrale</option>
                      <option value="Libero">Libero</option>
                      <option value="Non definito">Non definito</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Taglia Kit Voltex</label>
                    <select
                      value={tagliaKit}
                      onChange={(e) => setTagliaKit(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="12A">12 Anni</option>
                      <option value="14A">14 Anni</option>
                      <option value="XS">XS</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Squadra / Categoria Attuale</label>
                  <input
                    type="text"
                    value={livelloSquadra}
                    onChange={(e) => setLivelloSquadra(e.target.value)}
                    placeholder="es. Under 14 New Volley Academy"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Contatti */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Nome Genitore (se minorenne)</label>
                    <input
                      type="text"
                      value={nomeGenitore}
                      onChange={(e) => setNomeGenitore(e.target.value)}
                      placeholder="es. Mario Rossi"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Telefono / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="es. 340 1234567"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Email Contatto</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="es. email@esempio.it"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Note o Richieste Particolari</label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Allergie alimentari, formula giorno/residenziale preferita, ecc."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#C0392B] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-red-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Registrazione in corso...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Invia Iscrizione al Camp
                    </>
                  )}
                </button>

              </form>
            )}

          </div>
        </div>
      </section>

    </div>
  );
}
