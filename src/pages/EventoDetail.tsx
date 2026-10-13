import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Award, 
  ArrowLeft, 
  Download, 
  ExternalLink, 
  MessageCircle, 
  Share2, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  FileText, 
  Sparkles,
  Phone,
  Mail,
  Sun,
  Trophy,
  Check,
  Camera,
  Eye
} from 'lucide-react';
import { 
  db, 
  isDemoMode, 
  EventoCampTorneo, 
  mapToUnifiedEvento, 
  getCampTorneiAll,
  openPdfDocument,
  downloadPdfDocument
} from '../firebase-societa';
import { StoricoCarousel } from './CampTornei';

interface EventoDetailProps {
  societaInfo?: any;
  eventId?: string;
}

export default function EventoDetail({ societaInfo, eventId }: EventoDetailProps) {
  const { id: routeId } = useParams<{ id: string }>();
  const location = useLocation();
  const rawId = eventId || routeId || (
    location.pathname.startsWith('/camp-tornei/') 
      ? location.pathname.split('/camp-tornei/')[1] 
      : location.pathname.startsWith('/eventi/') 
        ? location.pathname.split('/eventi/')[1] 
        : undefined
  );
  const id = rawId ? decodeURIComponent(rawId.split('?')[0].split('#')[0]) : undefined;
  const navigate = useNavigate();

  const [evento, setEvento] = useState<EventoCampTorneo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  useEffect(() => {
    if (!id) {
      navigate('/camp-tornei');
      return;
    }

    const loadEvent = async () => {
      setLoading(true);
      try {
        // 1. Try Firestore direct get
        if (!isDemoMode && db) {
          const docRef = doc(db, 'eventi_camp_tornei', id);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const mapped = mapToUnifiedEvento(snap.data(), snap.id);
            setEvento(mapped);
            document.title = `${mapped.titolo} | New Volley Academy`;
            setLoading(false);
            return;
          }
        }

        // 2. Fallback to list search (for demo or cached records)
        const all = await getCampTorneiAll();
        const found = all.find(e => e.id === id || e.titolo.toLowerCase().replace(/\s+/g, '-') === id.toLowerCase());
        if (found) {
          setEvento(found);
          document.title = `${found.titolo} | New Volley Academy`;
        } else {
          // If not found in primary collection, check other events
          const ref = collection(db, 'eventi_camp_tornei');
          const snapAll = await getDocs(ref);
          let match: EventoCampTorneo | null = null;
          snapAll.forEach(d => {
            if (d.id === id) {
              match = mapToUnifiedEvento(d.data(), d.id);
            }
          });
          if (match) {
            setEvento(match);
            document.title = `${match.titolo} | New Volley Academy`;
          }
        }
      } catch (err) {
        console.error("Errore caricamento evento:", err);
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [id, navigate]);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const telefono = societaInfo?.contatti?.telefono || '+39 347 1234567';
  const whatsappNumber = telefono.replace(/[^0-9]/g, '');

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 py-24">
        <div className="w-12 h-12 border-4 border-[#FFE600] border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-sm uppercase tracking-wider text-zinc-400">Caricamento scheda evento...</p>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mx-auto text-2xl">
          🏐
        </div>
        <h2 className="text-3xl font-black font-barlow uppercase tracking-tight text-zinc-900">
          Evento Non Trovato
        </h2>
        <p className="text-zinc-600 text-sm font-inter max-w-md mx-auto">
          L'evento che stai cercando non è più disponibile, le date sono terminate oppure il link non è corretto.
        </p>
        <button
          onClick={() => navigate('/camp-tornei')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FFE600] text-zinc-950 font-bold font-barlow uppercase text-sm shadow-md hover:bg-yellow-400 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>TORNA A TUTTI I CAMP & TORNEI</span>
        </button>
      </div>
    );
  }

  const isGolee = evento.linkIscrizione?.toLowerCase().includes('golee');
  const hasMultiplePhotos = (evento.archivio?.foto && evento.archivio.foto.length > 0) || (evento.fotoGallery && evento.fotoGallery.length > 0);
  const photosList = evento.fotoGallery || evento.archivio?.foto || [];

  return (
    <div className="w-full bg-[#f8f8f5] text-zinc-900 min-h-screen pb-20">
      
      {/* TOP SUB-HEADER & BREADCRUMBS */}
      <div className="bg-zinc-950 text-zinc-400 border-b border-zinc-850 py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <Link
            to="/camp-tornei"
            className="inline-flex items-center gap-2 text-zinc-300 hover:text-[#FFE600] transition-colors font-bold uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4 text-[#FFE600]" />
            <span>Tutti i Camp & Tornei</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Link Copiato!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#FFE600]" />
                  <span>Condividi Scheda</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* HERO BANNER DELL'EVENTO */}
      <section className="relative w-full bg-zinc-950 text-white overflow-hidden py-10 sm:py-16 border-b border-zinc-850">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,230,0,0.25),transparent_60%)]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3.5 py-1 rounded-md bg-[#FFE600] text-zinc-950 text-xs font-black font-mono uppercase tracking-wider shadow-sm">
                {evento.tipo === 'CAMP' ? '☀️ SUMMER CAMP' : evento.tipo === 'TORNEO' ? '🏆 TORNEO UFFICIALE' : '📅 EVENTO SPECIALE'}
              </span>
              {evento.sottotitolo && (
                <span className="px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono font-bold">
                  {evento.sottotitolo}
                </span>
              )}
              {evento.visibilitaIscrizioni === 'APERTE' && (
                <span className="px-3 py-1 rounded-md bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ISCRIZIONI APERTE</span>
                </span>
              )}
            </div>

            {/* Titolo Principale */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-barlow uppercase tracking-tight text-white leading-[0.95] drop-shadow-md">
              {evento.titolo}
            </h1>

            {/* Quick Info Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm text-zinc-300 font-inter">
              <div className="flex items-center gap-2 bg-zinc-900/90 px-3.5 py-1.5 rounded-xl border border-zinc-800">
                <Calendar className="w-4 h-4 text-[#FFE600]" />
                <span className="font-mono font-bold text-white">{evento.dataPeriodo}</span>
              </div>
              <div className="flex items-center gap-2 bg-zinc-900/90 px-3.5 py-1.5 rounded-xl border border-zinc-800">
                <MapPin className="w-4 h-4 text-[#FFE600]" />
                <span className="font-medium">{evento.location}</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CONTENUTO PRINCIPALE A 2 COLONNE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* COLONNA SINISTRA (CONTENUTO ESTESO - 2/3) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* FOTO LOCANDINA O BANNER BRANDED DI DEFAULT */}
            {evento.locandinaUrl ? (
              <div 
                className="relative w-full rounded-3xl overflow-hidden shadow-md border border-zinc-800 bg-zinc-950 flex items-center justify-center transition-all"
                style={{ 
                  height: `${evento.locandinaAltezza || 480}px`,
                  maxHeight: '650px'
                }}
              >
                {/* Sfondo sfumato d'atmosfera con i colori dell'immagine */}
                <img 
                  src={evento.locandinaUrl} 
                  alt="" 
                  aria-hidden="true" 
                  className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-35 scale-110 pointer-events-none"
                />
                {/* Immagine principale con fit (contain o cover) e posizione X/Y personalizzata */}
                <img 
                  src={evento.locandinaUrl} 
                  alt={evento.titolo} 
                  className={`relative z-10 w-full h-full shadow-2xl transition-all duration-300 ${
                    evento.locandinaFit === 'cover' ? 'object-cover' : 'object-contain'
                  }`}
                  style={{
                    objectPosition: `${evento.locandinaPositionX ?? 50}% ${evento.locandinaPositionY ?? 50}%`
                  }}
                />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black rounded-3xl p-8 sm:p-12 text-center text-white border border-zinc-800 shadow-md relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-[#FFE600]/10 blur-3xl pointer-events-none" />
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-3xl mx-auto mb-3 shadow-inner">
                  {evento.tipo === 'CAMP' ? '☀️' : evento.tipo === 'TORNEO' ? '🏆' : '🏐'}
                </div>
                <h3 className="text-2xl sm:text-3xl font-black font-barlow uppercase tracking-wider text-white">
                  {evento.titolo}
                </h3>
                <p className="text-xs font-mono font-bold tracking-widest text-[#FFE600] uppercase mt-1">
                  NEW VOLLEY ACADEMY FORLÌ
                </p>
              </div>
            )}

            {/* PRESENTAZIONE ESTESA */}
            <div className="bg-white rounded-3xl p-6 sm:p-9 shadow-sm border border-slate-200 space-y-6">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <span className="w-2.5 h-6 bg-[#FFE600] rounded-sm shadow-sm" />
                <h2 className="text-xl sm:text-2xl font-black font-barlow uppercase tracking-tight text-slate-950">
                  Presentazione & Dettagli
                </h2>
              </div>

              <div className="text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line font-inter space-y-4">
                {evento.descrizione}
              </div>
            </div>

            {/* COSA È INCLUSO NELLA QUOTA (Se Camp) */}
            {evento.camp?.cosaCOffriamo && evento.camp.cosaCOffriamo.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-9 shadow-sm border border-slate-200 space-y-6">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                  <span className="w-2.5 h-6 bg-[#FFE600] rounded-sm shadow-sm" />
                  <h3 className="text-xl sm:text-2xl font-black font-barlow uppercase tracking-tight text-slate-950">
                    Cosa è Incluso nella Quota
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {evento.camp.cosaCOffriamo.map((item, idx) => (
                    <div 
                      key={idx}
                      className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/60"
                    >
                      <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-slate-800 font-inter">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STAFF TECNICO & DOCENTI */}
            {(evento.camp?.staffTecnico || evento.camp?.staffDettaglio) && (
              <div className="bg-white rounded-3xl p-6 sm:p-9 shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                  <span className="w-2.5 h-6 bg-[#FFE600] rounded-sm shadow-sm" />
                  <h3 className="text-xl sm:text-2xl font-black font-barlow uppercase tracking-tight text-slate-950">
                    Staff Tecnico & Istruttori
                  </h3>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-500" />
                    <strong className="text-base font-bold text-slate-900 font-barlow uppercase tracking-wide">
                      {evento.camp.staffTecnico}
                    </strong>
                  </div>
                  {evento.camp.staffDettaglio && (
                    <p className="text-xs sm:text-sm text-slate-600 font-inter leading-relaxed pl-7">
                      {evento.camp.staffDettaglio}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* LOCATION & STRUTTURA */}
            <div className="bg-white rounded-3xl p-6 sm:p-9 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <span className="w-2.5 h-6 bg-[#FFE600] rounded-sm shadow-sm" />
                <h3 className="text-xl sm:text-2xl font-black font-barlow uppercase tracking-tight text-slate-950">
                  Sede & Struttura di Gioco
                </h3>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-500" />
                  <strong className="text-base font-bold text-slate-900 font-barlow uppercase tracking-wide">
                    {evento.location}
                  </strong>
                </div>
                {evento.locationDettaglio && (
                  <p className="text-xs sm:text-sm text-slate-600 font-inter leading-relaxed pl-7">
                    {evento.locationDettaglio}
                  </p>
                )}
              </div>
            </div>

            {/* CAROSELLO FOTOGRAFICO DELLE SCORSE EDIZIONI */}
            <div className="bg-white rounded-3xl p-6 sm:p-9 shadow-sm border border-slate-200 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-6 bg-[#FFE600] rounded-sm shadow-sm" />
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black font-barlow uppercase tracking-tight text-slate-950 flex items-center gap-2">
                      <Camera className="w-5 h-5 text-amber-500" />
                      <span>Momenti & Foto delle Scorse Edizioni</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-inter mt-0.5">
                      Gli scatti più belli dal campo, partite, premiazioni e divertimento dei nostri atleti.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md">
                <StoricoCarousel foto={photosList && photosList.length > 0 ? photosList : [
                  "https://images.unsplash.com/photo-1592656094267-764a45068526?w=1200&auto=format&fit=crop&q=80",
                  "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=1200&auto=format&fit=crop&q=80",
                  "https://images.unsplash.com/photo-1526676023333-d15fae1b2756?w=1200&auto=format&fit=crop&q=80"
                ]} />
              </div>
            </div>

          </div>

          {/* COLONNA DESTRA (STICKY SIDEBAR BOX ISCRIZIONI & CALL TO ACTION - 1/3) */}
          <div className="lg:col-span-1 lg:sticky lg:top-24 space-y-6">
            
            {/* BOX ISCRIZIONE PRINCIPALE */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 text-white shadow-xl space-y-6">
              
              <div className="space-y-4 border-b border-zinc-850 pb-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#FFE600] font-bold">
                    MODALITÀ DI ADESIONE
                  </span>
                  <span className="text-[10px] font-mono bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded border border-zinc-800 uppercase">
                    {evento.tipo}
                  </span>
                </div>

                {/* Quota o Prezzo */}
                {evento.camp?.quotaIscrizione && (
                  <div>
                    <span className="text-[10px] uppercase font-mono text-zinc-400 block mb-0.5">Quota Partecipazione:</span>
                    <p className="text-2xl sm:text-3xl font-black font-barlow text-[#FFE600] leading-none">
                      {evento.camp.quotaIscrizione}
                    </p>
                    {evento.camp?.scontiTariffe && (
                      <p className="text-[11px] text-zinc-400 font-inter mt-1.5">
                        {evento.camp.scontiTariffe}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* TASTO ISCRIZIONE DIGITALE (GOLEE) */}
              {evento.visibilitaIscrizioni === 'CHIUSE' ? (
                <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-center space-y-1.5">
                  <p className="text-red-400 font-bold text-xs uppercase font-barlow tracking-wider">Iscrizioni Chiuse</p>
                  <p className="text-[11px] text-zinc-400 font-inter">Per eventuali posti di riserva o chiarimenti contatta la segreteria.</p>
                </div>
              ) : evento.visibilitaIscrizioni === 'NASCOSTO' ? (
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center space-y-1">
                  <p className="text-zinc-300 font-bold text-xs uppercase font-barlow tracking-wider">Iscrizione in Segreteria</p>
                  <p className="text-[11px] text-zinc-400 font-inter">Le iscrizioni per questa attività sono gestite direttamente in palestra.</p>
                </div>
              ) : evento.linkIscrizione ? (
                <div className="space-y-3">
                  <a
                    href={evento.linkIscrizione.startsWith('http') ? evento.linkIscrizione : `https://${evento.linkIscrizione}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#FFE600] hover:bg-[#ebd400] text-zinc-950 font-black py-4 px-5 text-sm uppercase font-barlow tracking-wider rounded-2xl transition-all shadow-lg shadow-[#FFE600]/25 flex justify-center items-center gap-2 group cursor-pointer"
                  >
                    <span>{isGolee ? 'ISCRIVITI SUBITO SU GOLEE' : 'ISCRIVITI ORA ONLINE'}</span>
                    <ExternalLink className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                  <p className="text-[10px] text-zinc-400 text-center font-mono">
                    Procedura sicura e immediata tramite portale ufficiale.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center space-y-1">
                  <p className="text-zinc-300 font-bold text-xs uppercase font-barlow tracking-wider">Iscrizioni da Definire</p>
                  <p className="text-[11px] text-zinc-400 font-inter">Le modalità di adesione saranno rese note a breve.</p>
                </div>
              )}

              {/* DOWNLOAD / VISUALIZZAZIONE VOLANTINO PDF SE PRESENTE */}
              {evento.pdfModuloCartaceoUrl && (
                <div className="pt-2 border-t border-zinc-850 space-y-2">
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] font-medium">
                    <FileText className="w-3.5 h-3.5 text-[#FFE600] shrink-0" />
                    <span className="truncate">{evento.pdfModuloCartaceoNome || 'Volantino / Modulo Informativo PDF'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openPdfDocument(evento.pdfModuloCartaceoUrl!, evento.pdfModuloCartaceoNome || 'Volantino.pdf')}
                      className="bg-zinc-900 hover:bg-zinc-850 text-[#FFE600] font-bold py-3 px-2 text-xs uppercase font-barlow tracking-wider rounded-xl transition-all flex justify-center items-center gap-1.5 border border-zinc-800 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visualizza</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadPdfDocument(evento.pdfModuloCartaceoUrl!, evento.pdfModuloCartaceoNome || 'Volantino.pdf')}
                      className="bg-zinc-900 hover:bg-zinc-850 text-white font-bold py-3 px-2 text-xs uppercase font-barlow tracking-wider rounded-xl transition-all flex justify-center items-center gap-1.5 border border-zinc-800 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#FFE600]" />
                      <span>Scarica PDF</span>
                    </button>
                  </div>
                </div>
              )}

              {/* CONTATTO WHATSAPP DIRETTO CON MESSAGGIO PREIMPOSTATO */}
              <div className="pt-2 border-t border-zinc-850 space-y-2">
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Ciao! Vorrei maggiori informazioni sull'evento "${evento.titolo}" (New Volley Academy).`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/30 font-bold py-3 px-4 text-xs uppercase font-barlow tracking-wider rounded-xl transition-all flex justify-center items-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>CHIEDI INFO SU WHATSAPP</span>
                </a>
              </div>

              {/* GARANZIE DI QUALITÀ */}
              <div className="pt-3 border-t border-zinc-850 flex items-center gap-2 text-zinc-400 text-[11px] font-inter">
                <ShieldCheck className="w-4 h-4 text-[#FFE600] shrink-0" />
                <span>Assicurazione Federale FIPAV inclusa per tutti i partecipanti</span>
              </div>

            </div>

            {/* BOX CONTATTI SEGRETERIA */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3 text-xs">
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 font-bold">Hai dubbi o domande?</p>
              <div className="space-y-2">
                <a href={`tel:${telefono.replace(/\s+/g, '')}`} className="flex items-center gap-2 text-slate-800 hover:text-amber-600 font-medium font-inter">
                  <Phone className="w-3.5 h-3.5 text-amber-500" />
                  <span>{telefono}</span>
                </a>
                <a href={`mailto:${societaInfo?.contatti?.email || 'info@newvolleyacademy.it'}`} className="flex items-center gap-2 text-slate-800 hover:text-amber-600 font-medium font-inter">
                  <Mail className="w-3.5 h-3.5 text-amber-500" />
                  <span>{societaInfo?.contatti?.email || 'info@newvolleyacademy.it'}</span>
                </a>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
