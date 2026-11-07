import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Sparkles, 
  Percent, 
  Flame, 
  X, 
  Check, 
  AlertCircle, 
  Shirt, 
  Tag, 
  MessageCircle, 
  MapPin, 
  ChevronRight, 
  Layers, 
  Info,
  Clock,
  ArrowRight,
  ShieldCheck,
  PackageCheck,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArticoloVetrina, 
  CategoriaVetrina, 
  getArticoliVetrina, 
  DEFAULT_ARTICOLI_VETRINA,
  SocietaInfo 
} from '../firebase-societa';

interface ShopVetrinaProps {
  societaInfo?: SocietaInfo | null;
}

const CATEGORIE_FILTRO: CategoriaVetrina[] = [
  'Tutti',
  'Abbigliamento',
  'Accessori',
  'Gara & Divise',
  'Tempo Libero',
  'Merchandising & Gadget'
];

export default function ShopVetrina({ societaInfo }: ShopVetrinaProps) {
  const [articoli, setArticoli] = useState<ArticoloVetrina[]>(DEFAULT_ARTICOLI_VETRINA);
  const [loading, setLoading] = useState(true);
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaVetrina>('Tutti');
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyPromo, setOnlyPromo] = useState(false);
  const [onlyScontoTesserati, setOnlyScontoTesserati] = useState(false);
  const [onlyNovita, setOnlyNovita] = useState(false);

  // Modale dettaglio articolo
  const [selectedArticolo, setSelectedArticolo] = useState<ArticoloVetrina | null>(null);
  const [selectedTaglia, setSelectedTaglia] = useState<string>('');

  // Numero WhatsApp per ordini / info
  const rawWaNumber = societaInfo?.contatti?.whatsapp || societaInfo?.contatti?.telefono || '393400000000';
  const cleanWaNumber = rawWaNumber.replace(/[^0-9]/g, '');
  const formattedWa = cleanWaNumber.startsWith('39') ? cleanWaNumber : `39${cleanWaNumber}`;

  useEffect(() => {
    getArticoliVetrina()
      .then(data => {
        if (data && data.length > 0) {
          setArticoli(data);
        }
      })
      .catch(err => {
        console.warn("Errore caricamento articoli vetrina:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Aggiorna la taglia di default all'apertura del modale
  useEffect(() => {
    if (selectedArticolo && selectedArticolo.taglie_disponibili && selectedArticolo.taglie_disponibili.length > 0) {
      setSelectedTaglia(selectedArticolo.taglie_disponibili[0]);
    } else {
      setSelectedTaglia('');
    }
  }, [selectedArticolo]);

  // Filtro articoli
  const filteredArticoli = useMemo(() => {
    return articoli.filter(art => {
      if (selectedCategoria !== 'Tutti' && art.categoria !== selectedCategoria) return false;
      if (onlyPromo && !art.in_promozione) return false;
      if (onlyScontoTesserati && (!art.prezzo_tesserato || art.prezzo_tesserato >= art.prezzo_pieno)) return false;
      if (onlyNovita && !art.novita) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchNome = art.nome.toLowerCase().includes(q);
        const matchDesc = (art.descrizione || '').toLowerCase().includes(q);
        const matchCat = art.categoria.toLowerCase().includes(q);
        const matchTaglie = (art.taglie_disponibili || []).some(t => t.toLowerCase().includes(q));
        if (!matchNome && !matchDesc && !matchCat && !matchTaglie) return false;
      }
      return true;
    });
  }, [articoli, selectedCategoria, onlyPromo, onlyScontoTesserati, onlyNovita, searchTerm]);

  // Genera link WhatsApp con testo precompilato
  const getWhatsAppUrl = (art: ArticoloVetrina, taglia?: string) => {
    const prezzoText = art.prezzo_tesserato && art.prezzo_tesserato < art.prezzo_pieno
      ? `€${art.prezzo_tesserato.toFixed(2)} (Prezzo Tesserato) / €${art.prezzo_pieno.toFixed(2)} (Listino)`
      : `€${art.prezzo_pieno.toFixed(2)}`;

    const tagliaText = taglia ? ` - Taglia richiesta: ${taglia}` : '';
    const text = `Ciao New Volley Academy! 👋 Vorrei informazioni e disponibilità per l'articolo della vetrina ufficiale:\n\n🏐 *${art.nome}*\nPrezzo: ${prezzoText}${tagliaText}\n\nPotete farmi sapere quando posso provarlo/ritirarlo in segreteria al palazzetto? Grazie!`;
    return `https://wa.me/${formattedWa}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-white font-sans selection:bg-[#FFE600] selection:text-slate-950 pb-20">
      
      {/* 1. HERO HEADER BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-b from-black via-zinc-950 to-slate-950 border-b border-zinc-800/80 pt-10 pb-12 sm:pb-16">
        
        {/* Glow sportivo di sfondo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[320px] bg-[#FFE600]/10 blur-[120px] pointer-events-none rounded-full" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          
          {/* Badge & Titolo */}
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFE600]/10 border border-[#FFE600]/30 text-[#FFE600] text-xs font-bold tracking-widest uppercase font-mono">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>COLLEZIONE UFFICIALE PANTERE 2026/2027</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white font-sport italic leading-[0.95] drop-shadow-md">
              Vetrina Materiale & Merchandising
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 font-inter leading-relaxed">
              Abbigliamento tecnico, divise da gara, accessori e gadget ufficiali New Volley Academy.
              Prezzi speciali e scontistiche riservate a tutti gli atleti tesserati, famiglie e staff.
            </p>
          </div>

          {/* AVVISO POLICY VETRINA (SHOWCASE CONSULTATIVA - NO E-COMMERCE) */}
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-zinc-900/90 border border-amber-400/30 backdrop-blur-md shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FFE600]/20 text-[#FFE600] flex items-center justify-center shrink-0 border border-[#FFE600]/30">
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-white uppercase font-sport tracking-wider text-sm block">
                  Come Funziona la Vetrina NVA
                </span>
                <p className="text-zinc-300 font-inter">
                  I prodotti possono essere provati e ordinati direttamente presso la <b>Segreteria del Palazzetto</b> o prenotati via <b>WhatsApp</b> con ritiro in sede. Non è attivo il pagamento online diretto sul sito.
                </p>
              </div>
            </div>

            <a
              href={`https://wa.me/${formattedWa}?text=${encodeURIComponent("Ciao New Volley Academy! Vorrei informazioni sul materiale societario e sul merchandising ufficiale.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all shrink-0 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Scrivici su WhatsApp</span>
            </a>
          </div>

        </div>
      </section>

      {/* 2. BARRA FILTRI & RICERCA */}
      <div className="sticky top-16 z-20 bg-slate-950/95 backdrop-blur-md border-b border-zinc-800/80 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* SEARCH INPUT */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Cerca felpe, divise, zaini, taglie o accessori..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white placeholder-zinc-400 text-xs focus:border-[#FFE600] focus:ring-1 focus:ring-[#FFE600] outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* TOGGLES CARATTERISTICHE */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setOnlyPromo(!onlyPromo)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                  onlyPromo
                    ? 'bg-red-600 text-white border-red-500 shadow-md ring-1 ring-red-400/40'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-red-400" />
                <span>Solo Promo</span>
              </button>

              <button
                type="button"
                onClick={() => setOnlyScontoTesserati(!onlyScontoTesserati)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                  onlyScontoTesserati
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-1 ring-emerald-400/40'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                }`}
              >
                <Percent className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sconto Tesserati NVA</span>
              </button>

              <button
                type="button"
                onClick={() => setOnlyNovita(!onlyNovita)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                  onlyNovita
                    ? 'bg-[#FFE600] text-slate-950 border-[#FFE600] font-black shadow-md'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FFE600]" />
                <span>Novità</span>
              </button>
            </div>

          </div>

          {/* PILLS CATEGORIE */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIE_FILTRO.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategoria(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-sport uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                  selectedCategoria === cat
                    ? 'bg-[#FFE600] text-slate-950 font-black shadow-md'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* 3. GRIGLIA ARTICOLI */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-[#FFE600] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest">Caricamento vetrina materiale...</p>
          </div>
        ) : filteredArticoli.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-4 max-w-lg mx-auto">
            <ShoppingBag className="w-12 h-12 text-zinc-600 mx-auto" />
            <h3 className="text-lg font-bold text-white font-sport uppercase">Nessun articolo trovato</h3>
            <p className="text-xs text-zinc-400">
              Nessun articolo corrisponde ai filtri selezionati. Prova ad azzerare la ricerca o a selezionare una categoria diversa.
            </p>
            <button
              onClick={() => {
                setSelectedCategoria('Tutti');
                setSearchTerm('');
                setOnlyPromo(false);
                setOnlyScontoTesserati(false);
                setOnlyNovita(false);
              }}
              className="px-4 py-2 rounded-xl bg-[#FFE600] text-slate-950 font-bold text-xs uppercase cursor-pointer hover:bg-amber-400 transition-colors"
            >
              Azzera Filtri
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredArticoli.map(articolo => {
              const hasSconto = Boolean(articolo.prezzo_tesserato && articolo.prezzo_tesserato < articolo.prezzo_pieno);
              const scontoPerc = hasSconto 
                ? Math.round(((articolo.prezzo_pieno - (articolo.prezzo_tesserato || 0)) / articolo.prezzo_pieno) * 100) 
                : 0;

              return (
                <motion.div
                  key={articolo.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="group rounded-3xl bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800/90 hover:border-[#FFE600]/60 hover:shadow-2xl hover:shadow-[#FFE600]/10 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    {/* FOTO E BADGES */}
                    <div 
                      onClick={() => setSelectedArticolo(articolo)}
                      className="relative aspect-square bg-zinc-950 flex items-center justify-center overflow-hidden cursor-pointer"
                    >
                      {articolo.foto_url ? (
                        <img 
                          src={articolo.foto_url} 
                          alt={articolo.nome}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="text-center p-6 space-y-2 text-zinc-600">
                          <Shirt className="w-16 h-16 mx-auto stroke-1" />
                          <span className="text-[10px] font-mono tracking-wider uppercase block">Visualizza Dettagli</span>
                        </div>
                      )}

                      {/* BADGES SOVRAPPOSTI IN ALTO A SINISTRA */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-10">
                        {articolo.in_promozione && (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-wider bg-red-600 text-white shadow-lg flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            <span>{articolo.promo_label || 'PROMO'}</span>
                          </span>
                        )}

                        {articolo.novita && (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-wider bg-[#FFE600] text-slate-950 shadow-lg">
                            NOVITÀ
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-black/80 text-zinc-300 backdrop-blur-md border border-white/10">
                          {articolo.categoria}
                        </span>
                      </div>

                      {/* DISPONIBILITÀ STATUS IN ALTO A DESTRA */}
                      <div className="absolute top-3 right-3 z-10">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider backdrop-blur-md shadow-md ${
                          articolo.disponibile 
                            ? 'bg-emerald-500/90 text-white border border-emerald-400/40' 
                            : 'bg-zinc-900/90 text-red-400 border border-red-500/30'
                        }`}>
                          {articolo.disponibile ? 'DISPONIBILE' : 'ESAURITO'}
                        </span>
                      </div>

                      {/* BADGE SCONTO TESSERATI IN BASSO A DESTRA */}
                      {hasSconto && (
                        <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-mono font-black text-[10px] shadow-lg flex items-center gap-1 border border-emerald-400/30">
                          <Percent className="w-3 h-3" />
                          <span>-{scontoPerc}% TESSERATI</span>
                        </div>
                      )}
                    </div>

                    {/* INFORMAZIONI ARTICOLO */}
                    <div className="p-4 sm:p-5 space-y-3">
                      <div>
                        <h3 
                          onClick={() => setSelectedArticolo(articolo)}
                          className="font-bold text-white text-sm sm:text-base leading-snug line-clamp-2 hover:text-[#FFE600] transition-colors cursor-pointer"
                        >
                          {articolo.nome}
                        </h3>
                        <p className="text-zinc-400 text-xs line-clamp-2 mt-1 leading-relaxed">
                          {articolo.descrizione}
                        </p>
                      </div>

                      {/* TAGLIE DISPONIBILI PREVIEW */}
                      {articolo.taglie_disponibili && articolo.taglie_disponibili.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">Taglie:</span>
                          {articolo.taglie_disponibili.slice(0, 5).map(t => (
                            <span key={t} className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono font-bold">
                              {t}
                            </span>
                          ))}
                          {articolo.taglie_disponibili.length > 5 && (
                            <span className="text-[10px] text-zinc-500 font-mono">+{articolo.taglie_disponibili.length - 5}</span>
                          )}
                        </div>
                      )}

                      {/* PREZZI COMPARATI */}
                      <div className="p-3 rounded-2xl bg-black/50 border border-zinc-800 flex items-center justify-between">
                        <div>
                          <div className="text-[9px] font-mono uppercase text-zinc-400">Prezzo Pieno</div>
                          <div className={`font-sport font-black text-sm ${hasSconto ? 'line-through text-zinc-500' : 'text-white'}`}>
                            € {articolo.prezzo_pieno.toFixed(2)}
                          </div>
                        </div>

                        {hasSconto ? (
                          <div className="text-right">
                            <div className="text-[9px] font-mono uppercase font-bold text-emerald-400 flex items-center justify-end gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Sconto Tesserati NVA</span>
                            </div>
                            <div className="font-sport font-black text-lg text-[#FFE600]">
                              € {articolo.prezzo_tesserato?.toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-right">
                            <div className="text-[9px] font-mono uppercase text-zinc-400">Listino Ufficiale</div>
                            <div className="font-sport font-black text-base text-white">
                              € {articolo.prezzo_pieno.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* PULSANTI AZIONE */}
                  <div className="p-4 sm:p-5 pt-0 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedArticolo(articolo)}
                        className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-sport uppercase italic tracking-wider text-xs font-bold transition-all text-center cursor-pointer"
                      >
                        Dettagli
                      </button>

                      <a
                        href={getWhatsAppUrl(articolo)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-sport uppercase italic tracking-wider text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-white shrink-0" />
                        <span>Ordina</span>
                      </a>
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </div>
        )}

      </main>

      {/* 4. MODALE DETTAGLIO ARTICOLO */}
      <AnimatePresence>
        {selectedArticolo && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl relative my-8 max-h-[90vh] flex flex-col"
            >
              {/* CHIUDI BUTTON */}
              <button
                type="button"
                onClick={() => setSelectedArticolo(null)}
                className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/70 text-zinc-400 hover:text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
                
                {/* GRID SUPERIORE: FOTO & INFORMAZIONI PRINCIPALI */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  
                  {/* FOTO GRANDE */}
                  <div className="relative aspect-square rounded-2xl bg-black border border-zinc-800 overflow-hidden flex items-center justify-center">
                    {selectedArticolo.foto_url ? (
                      <img 
                        src={selectedArticolo.foto_url} 
                        alt={selectedArticolo.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-6 space-y-2 text-zinc-600">
                        <Shirt className="w-20 h-20 mx-auto stroke-1" />
                        <span className="text-xs font-mono">Foto Prodotto Ufficiale NVA</span>
                      </div>
                    )}

                    {selectedArticolo.in_promozione && (
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-red-600 text-white font-mono font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5" />
                        <span>{selectedArticolo.promo_label || 'PROMO ATTIVA'}</span>
                      </div>
                    )}
                  </div>

                  {/* INFORMAZIONI & PREZZI */}
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FFE600] block mb-1">
                        {selectedArticolo.categoria} • COD: {selectedArticolo.id}
                      </span>
                      <h2 className="text-2xl font-black uppercase text-white font-sport tracking-tight leading-tight">
                        {selectedArticolo.nome}
                      </h2>
                    </div>

                    {/* BOX PREZZO */}
                    <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] font-mono text-zinc-400 uppercase block">Prezzo Ufficiale</span>
                          <span className={`text-xl font-sport font-black ${
                            selectedArticolo.prezzo_tesserato ? 'line-through text-zinc-500' : 'text-white'
                          }`}>
                            € {selectedArticolo.prezzo_pieno.toFixed(2)}
                          </span>
                        </div>

                        {selectedArticolo.prezzo_tesserato && selectedArticolo.prezzo_tesserato < selectedArticolo.prezzo_pieno && (
                          <div className="text-right">
                            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1 justify-end">
                              <ShieldCheck className="w-3 h-3" />
                              Riservato Tesserati NVA
                            </span>
                            <span className="text-3xl font-sport font-black text-[#FFE600]">
                              € {selectedArticolo.prezzo_tesserato.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>

                      {selectedArticolo.prezzo_tesserato && selectedArticolo.prezzo_tesserato < selectedArticolo.prezzo_pieno && (
                        <div className="pt-2 border-t border-zinc-800 text-[11px] text-zinc-300 font-inter flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>
                            Risparmi <b>€ {(selectedArticolo.prezzo_pieno - selectedArticolo.prezzo_tesserato).toFixed(2)}</b> con il tesseramento atleta New Volley Academy!
                          </span>
                        </div>
                      )}
                    </div>

                    {/* SELEZIONE TAGLIA SE DISPONIBILI */}
                    {selectedArticolo.taglie_disponibili && selectedArticolo.taglie_disponibili.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-mono font-bold uppercase text-zinc-300 block">
                          Seleziona Taglia: {selectedTaglia && <span className="text-[#FFE600]">({selectedTaglia})</span>}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {selectedArticolo.taglie_disponibili.map(t => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setSelectedTaglia(t)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                                selectedTaglia === t
                                  ? 'bg-[#FFE600] text-slate-950 border-[#FFE600] shadow-md font-black'
                                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* COLORI DISPONIBILI */}
                    {selectedArticolo.colori_disponibili && selectedArticolo.colori_disponibili.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-xs font-mono font-bold uppercase text-zinc-300 block">Colorazioni:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedArticolo.colori_disponibili.map(c => (
                            <span key={c} className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-inter">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* STATO DISPONIBILITÀ */}
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-zinc-500 uppercase">Disponibilità:</span>
                      <span className={`font-bold uppercase ${selectedArticolo.disponibile ? 'text-emerald-400' : 'text-red-400'}`}>
                        {selectedArticolo.stato_disponibilita === 'immediata' && '✓ Disponibile in sede'}
                        {selectedArticolo.stato_disponibilita === 'su_ordinazione' && '⏳ Su ordinazione'}
                        {selectedArticolo.stato_disponibilita === 'esaurito' && '✗ Momentaneamente esaurito'}
                        {!selectedArticolo.stato_disponibilita && (selectedArticolo.disponibile ? 'Disponibile' : 'Esaurito')}
                      </span>
                    </div>

                  </div>

                </div>

                {/* DESCRIZIONE DETTAGLIATA & COMPOSIZIONE */}
                <div className="space-y-3 pt-4 border-t border-zinc-800/80">
                  <h4 className="text-sm font-bold font-sport uppercase tracking-wider text-white">
                    Caratteristiche Tecniche e Dettagli
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-300 font-inter leading-relaxed">
                    {selectedArticolo.descrizione}
                  </p>

                  {selectedArticolo.materiale && (
                    <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 font-inter">
                      <b>Materiale / Composizione:</b> {selectedArticolo.materiale}
                    </div>
                  )}
                </div>

                {/* COME ORDINARE BOX & CTA WHATSAPP */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-sport font-black uppercase text-sm">
                    <PackageCheck className="w-4 h-4" />
                    <span>Come Ordinare Questo Articolo</span>
                  </div>

                  <p className="text-xs text-zinc-300 font-inter">
                    Puoi inviare un messaggio alla segreteria specificando l'articolo e la taglia desiderata. Ti confermeremo la disponibilità immediata per il ritiro al palazzetto o i tempi di consegna.
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <a
                      href={getWhatsAppUrl(selectedArticolo, selectedTaglia)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-sport uppercase italic tracking-wider font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/50 transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-5 h-5 fill-white" />
                      <span>Ordina o Richiedi su WhatsApp {selectedTaglia ? `(${selectedTaglia})` : ''}</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setSelectedArticolo(null)}
                      className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Chiudi Scheda
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
