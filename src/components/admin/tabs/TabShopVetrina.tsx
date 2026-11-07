import React, { useState, useEffect } from 'react';
import { 
  Shirt, 
  Plus, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Sparkles, 
  Search, 
  Check, 
  X, 
  AlertCircle, 
  Layers, 
  Package, 
  RefreshCw,
  Eye,
  CheckCircle2,
  MapPin,
  ShieldCheck
} from 'lucide-react';
import { 
  ArticoloVetrina, 
  CategoriaVetrina,
  DEFAULT_ARTICOLI_VETRINA, 
  getArticoliVetrina, 
  salvaArticoloVetrina, 
  eliminaArticoloVetrina,
  salvaTuttiArticoliVetrina
} from '../../../firebase-societa';

interface TabShopVetrinaProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const CATEGORIE: CategoriaVetrina[] = [
  'Tutti',
  'Abbigliamento',
  'Accessori',
  'Gara & Divise',
  'Tempo Libero',
  'Merchandising & Gadget'
];

const TAGLIE_PRESET = ['8-10 anni', '12-14 anni', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'Taglia Unica'];

export default function TabShopVetrina({ showToast }: TabShopVetrinaProps) {
  const [articoli, setArticoli] = useState<ArticoloVetrina[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaVetrina>('Tutti');
  const [filtroSoloNovita, setFiltroSoloNovita] = useState(false);
  const [filtroSoloDisponibili, setFiltroSoloDisponibili] = useState(false);

  // Modal stato
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticolo, setEditingArticolo] = useState<Partial<ArticoloVetrina> | null>(null);
  const [customTaglia, setCustomTaglia] = useState('');
  const [customColore, setCustomColore] = useState('');

  // Caricamento iniziale
  const caricaArticoli = async () => {
    setIsLoading(true);
    try {
      const data = await getArticoliVetrina();
      setArticoli(data);
    } catch (err: any) {
      console.error(err);
      showToast("Errore durante il caricamento del catalogo materiale", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    caricaArticoli();
  }, []);

  // Ripristino dati di default
  const handleResetDefaults = async () => {
    if (!window.confirm("Vuoi ripristinare il catalogo con i capi e la dotazione tecnica ufficiale NVA di default?")) {
      return;
    }
    try {
      await salvaTuttiArticoliVetrina(DEFAULT_ARTICOLI_VETRINA);
      setArticoli(DEFAULT_ARTICOLI_VETRINA);
      showToast("Catalogo ripristinato con i capi ufficiali NVA!", "success");
    } catch (err: any) {
      showToast("Errore durante il ripristino: " + err.message, "error");
    }
  };

  // Apertura modale nuovo capo
  const handleOpenNew = () => {
    const nextOrder = articoli.length > 0 ? Math.max(...articoli.map(a => a.ordine || 0)) + 1 : 1;
    setEditingArticolo({
      id: `articolo-${Date.now()}`,
      nome: '',
      descrizione: '',
      categoria: 'Abbigliamento',
      promo_label: 'KIT UFFICIALE',
      novita: true,
      disponibile: true,
      stato_disponibilita: 'immediata',
      foto_url: '',
      taglie_disponibili: ['S', 'M', 'L', 'XL'],
      colori_disponibili: ['Nero / Giallo Academy'],
      materiale: 'Tessuto Tecnico Traspirante',
      mostra_nel_ticker: false,
      ordine: nextOrder
    });
    setIsModalOpen(true);
  };

  // Apertura modale modifica
  const handleOpenEdit = (articolo: ArticoloVetrina) => {
    setEditingArticolo({ ...articolo });
    setIsModalOpen(true);
  };

  // Toggle rapido stato disponibile
  const handleToggleDisponibile = async (articolo: ArticoloVetrina) => {
    const updated: ArticoloVetrina = {
      ...articolo,
      disponibile: !articolo.disponibile,
      stato_disponibilita: !articolo.disponibile ? 'immediata' : 'su_ordinazione'
    };
    try {
      await salvaArticoloVetrina(updated);
      setArticoli(prev => prev.map(a => a.id === articolo.id ? updated : a));
      showToast(
        updated.disponibile 
          ? `Capo "${articolo.nome}" contrassegnato come DISPONIBILE IN SEDE` 
          : `Capo "${articolo.nome}" contrassegnato come SU RICHIESTA`,
        "info"
      );
    } catch (err: any) {
      showToast("Errore aggiornamento disponibilità", "error");
    }
  };

  // Toggle rapido novità
  const handleToggleNovita = async (articolo: ArticoloVetrina) => {
    const updated: ArticoloVetrina = {
      ...articolo,
      novita: !articolo.novita
    };
    try {
      await salvaArticoloVetrina(updated);
      setArticoli(prev => prev.map(a => a.id === articolo.id ? updated : a));
      showToast(
        updated.novita 
          ? `Badge Novità ATTIVATO su "${articolo.nome}"` 
          : `Badge Novità rimosso da "${articolo.nome}"`,
        "info"
      );
    } catch (err: any) {
      showToast("Errore aggiornamento novità", "error");
    }
  };

  // Eliminazione
  const handleDelete = async (articolo: ArticoloVetrina) => {
    if (!window.confirm(`Sei sicuro di voler eliminare "${articolo.nome}" dalla dotazione tecnica?`)) {
      return;
    }
    try {
      await eliminaArticoloVetrina(articolo.id);
      setArticoli(prev => prev.filter(a => a.id !== articolo.id));
      showToast(`Capo "${articolo.nome}" eliminato con successo`, "success");
    } catch (err: any) {
      showToast("Errore eliminazione articolo", "error");
    }
  };

  // Salvataggio da form modale
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticolo || !editingArticolo.nome?.trim()) {
      showToast("Inserisci il nome del capo", "error");
      return;
    }

    const payload: ArticoloVetrina = {
      id: editingArticolo.id || `articolo-${Date.now()}`,
      nome: editingArticolo.nome.trim(),
      descrizione: editingArticolo.descrizione || '',
      categoria: (editingArticolo.categoria as any) || 'Abbigliamento',
      promo_label: editingArticolo.promo_label || '',
      novita: Boolean(editingArticolo.novita),
      disponibile: Boolean(editingArticolo.disponibile),
      stato_disponibilita: editingArticolo.stato_disponibilita || 'immediata',
      foto_url: editingArticolo.foto_url || '',
      foto_gallery: editingArticolo.foto_gallery || [],
      taglie_disponibili: editingArticolo.taglie_disponibili || [],
      colori_disponibili: editingArticolo.colori_disponibili || [],
      materiale: editingArticolo.materiale || '',
      mostra_nel_ticker: Boolean(editingArticolo.mostra_nel_ticker),
      ordine: Number(editingArticolo.ordine) || 1
    };

    try {
      await salvaArticoloVetrina(payload);
      await caricaArticoli();
      setIsModalOpen(false);
      setEditingArticolo(null);
      showToast(`Capo "${payload.nome}" salvato nella dotazione tecnica!`, "success");
    } catch (err: any) {
      console.error(err);
      showToast("Errore durante il salvataggio: " + (err.message || ''), "error");
    }
  };

  // Gestione taglie
  const toggleTaglia = (taglia: string) => {
    if (!editingArticolo) return;
    const current = editingArticolo.taglie_disponibili || [];
    const updated = current.includes(taglia) 
      ? current.filter(t => t !== taglia) 
      : [...current, taglia];
    setEditingArticolo({ ...editingArticolo, taglie_disponibili: updated });
  };

  const addCustomTaglia = () => {
    if (!customTaglia.trim() || !editingArticolo) return;
    const current = editingArticolo.taglie_disponibili || [];
    if (!current.includes(customTaglia.trim())) {
      setEditingArticolo({ ...editingArticolo, taglie_disponibili: [...current, customTaglia.trim()] });
    }
    setCustomTaglia('');
  };

  // Calcolo statistiche
  const stats = {
    totali: articoli.length,
    novita: articoli.filter(a => a.novita).length,
    disponibili: articoli.filter(a => a.disponibile).length
  };

  // Filtro articoli per visualizzazione
  const articoliFiltrati = articoli.filter(art => {
    if (selectedCategoria !== 'Tutti' && art.categoria !== selectedCategoria) return false;
    if (filtroSoloNovita && !art.novita) return false;
    if (filtroSoloDisponibili && !art.disponibile) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchNome = art.nome.toLowerCase().includes(q);
      const matchDesc = art.descrizione.toLowerCase().includes(q);
      const matchCat = art.categoria.toLowerCase().includes(q);
      if (!matchNome && !matchDesc && !matchCat) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 text-xs max-w-6xl mx-auto pb-12 animate-fade-in" id="admin-tab-vetrina">
      
      {/* 1. HEADER HERO */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl text-white shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shadow-lg">
              <Shirt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider font-sport italic">
                  Dotazione Tecnica & Materiale Societario
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 font-mono">
                  {stats.totali} CAPI
                </span>
              </div>
              <p className="font-inter text-xs text-slate-400 mt-0.5">
                Lookbook e catalogo istituzionale delle divise, tute e materiale sportivo New Volley Academy riservato agli atleti e soci.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/vetrina"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              title="Apri l'anteprima della vetrina pubblica"
            >
              <Eye className="w-4 h-4 text-amber-400" />
              <span>Anteprima Lookbook (`/vetrina`)</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            <button
              type="button"
              onClick={handleOpenNew}
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-sport italic skew-x-[-6deg] uppercase tracking-wider px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Aggiungi Capo</span>
            </button>
          </div>
        </div>

        {/* STATS CHIPS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Totale Capi e Dotazioni</div>
            <div className="text-lg font-black font-sport text-white flex items-center gap-1">
              <Shirt className="w-4 h-4 text-amber-400" />
              <span>{stats.totali}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Novità Stagione 2026/27</div>
            <div className="text-lg font-black font-sport text-amber-400 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{stats.novita}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Campionario in Palazzetto</div>
            <div className="text-lg font-black font-sport text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{stats.disponibili} / {stats.totali}</span>
            </div>
          </div>
        </div>

        {/* INFO BOX POLICY ASD (STRADA 3 - LOOKBOOK PURO) */}
        <div className="p-3.5 bg-amber-500/10 border border-amber-400/30 rounded-2xl text-[11px] text-amber-200/90 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <b>Conformità Fiscale ASD (Lookbook Istituzionale):</b> Questa pagina è configurata in modalità Lookbook puro.
            Non mostra prezzi, sconti o transazioni commerciali, ma presenta in modo professionale e trasparente la dotazione tecnica societaria e i contatti della segreteria per gli atleti e le famiglie.
          </div>
        </div>
      </div>

      {/* 2. BARRA FILTRI & RICERCA */}
      <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* SEARCH INPUT */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cerca capo, descrizione o categoria..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none text-xs bg-slate-50"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* TOGGLES VELOCI */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltroSoloNovita(!filtroSoloNovita)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                filtroSoloNovita
                  ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Solo Novità</span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroSoloDisponibili(!filtroSoloDisponibili)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                filtroSoloDisponibili
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>In Palazzetto</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
              title="Ripristina capi di default NVA"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* PILLS CATEGORIA */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIE.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategoria(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-sport uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                selectedCategoria === cat
                  ? 'bg-slate-900 text-amber-400 shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3. GRIGLIA CAPI */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500" />
          <p className="font-mono text-xs">Caricamento dotazione tecnica...</p>
        </div>
      ) : articoliFiltrati.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
          <Shirt className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
          <h4 className="text-base font-bold text-slate-800">Nessun capo trovato</h4>
          <p className="text-slate-500 max-w-md mx-auto text-xs">
            Nessun capo corrisponde ai filtri selezionati. Prova a modificare la ricerca o aggiungi un nuovo capo alla dotazione.
          </p>
          <button
            type="button"
            onClick={handleOpenNew}
            className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold hover:bg-amber-500 transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Aggiungi Capo</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {articoliFiltrati.map(articolo => (
            <div 
              key={articolo.id}
              className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* FOTO E BADGES */}
                <div className="relative aspect-[4/3] bg-slate-950 flex items-center justify-center overflow-hidden">
                  {articolo.foto_url ? (
                    <img 
                      src={articolo.foto_url} 
                      alt={articolo.nome}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="text-center p-4 space-y-1.5 text-slate-500">
                      <Shirt className="w-10 h-10 mx-auto text-slate-600 stroke-1" />
                      <span className="text-[10px] font-mono block">Nessuna foto</span>
                    </div>
                  )}

                  {/* OVERLAY BADGES */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                    {articolo.promo_label && (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-md">
                        {articolo.promo_label}
                      </span>
                    )}

                    {articolo.novita && !articolo.promo_label && (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-md">
                        NOVITÀ
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-black/75 text-white backdrop-blur-sm">
                      {articolo.categoria}
                    </span>
                  </div>

                  {/* DISPONIBILITÀ STATUS CHIP */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider backdrop-blur-sm ${
                      articolo.disponibile 
                        ? 'bg-emerald-500/90 text-white shadow' 
                        : 'bg-slate-900/90 text-amber-300 border border-amber-500/40'
                    }`}>
                      {articolo.disponibile ? 'IN PALAZZETTO' : 'SU RICHIESTA'}
                    </span>
                  </div>
                </div>

                {/* CONTENUTO ARTICOLO */}
                <div className="p-4 space-y-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                      {articolo.nome}
                    </h4>
                    <p className="text-slate-500 text-[11px] line-clamp-2 mt-1">
                      {articolo.descrizione || 'Nessuna descrizione specificata.'}
                    </p>
                  </div>

                  {/* TAGLIE DISPONIBILI */}
                  {articolo.taglie_disponibili && articolo.taglie_disponibili.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 uppercase block">Taglie previste:</span>
                      <div className="flex flex-wrap gap-1">
                        {articolo.taglie_disponibili.map(t => (
                          <span key={t} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono font-bold">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* BOX INFO SEGRETERIA */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 text-[11px] text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Ritiro e campionario presso Segreteria NVA</span>
                  </div>
                </div>
              </div>

              {/* BOTTONI AZIONE CARD */}
              <div className="p-4 pt-0 border-t border-slate-100 mt-2 space-y-2">
                <div className="flex items-center justify-between gap-2 pt-2">
                  
                  {/* QUICK SWITCH DISPONIBILE */}
                  <button
                    type="button"
                    onClick={() => handleToggleDisponibile(articolo)}
                    className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                      articolo.disponibile 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {articolo.disponibile ? '✓ In Sede' : '⏳ Su Richiesta'}
                  </button>

                  {/* QUICK SWITCH NOVITÀ */}
                  <button
                    type="button"
                    onClick={() => handleToggleNovita(articolo)}
                    className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer flex items-center gap-1 ${
                      articolo.novita 
                        ? 'bg-amber-50 text-amber-900 border-amber-300' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>{articolo.novita ? 'Novità 26/27' : 'Standard'}</span>
                  </button>

                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(articolo)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-slate-950 transition-colors cursor-pointer"
                      title="Modifica capo"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(articolo)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                      title="Elimina capo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* 4. MODALE CREA / MODIFICA CAPO */}
      {isModalOpen && editingArticolo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-500 flex items-center justify-center">
                  <Shirt className="w-4 h-4 stroke-1" />
                </div>
                <h4 className="text-base font-black text-slate-900 uppercase font-sport tracking-wider">
                  {editingArticolo.id?.startsWith('articolo-') && !articoli.some(a => a.id === editingArticolo.id) 
                    ? 'Nuovo Capo Dotazione Tecnica' 
                    : 'Modifica Capo Dotazione Tecnica'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              
              {/* NOME & CATEGORIA */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-[11px] font-mono font-bold uppercase text-slate-700">
                    Nome Capo / Materiale *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingArticolo.nome || ''}
                    onChange={e => setEditingArticolo({ ...editingArticolo, nome: e.target.value })}
                    placeholder="es. Felpa Ufficiale Pantere NVA"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-mono font-bold uppercase text-slate-700">
                    Categoria *
                  </label>
                  <select
                    value={editingArticolo.categoria || 'Abbigliamento'}
                    onChange={e => setEditingArticolo({ ...editingArticolo, categoria: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none text-xs bg-white"
                  >
                    {CATEGORIE.filter(c => c !== 'Tutti').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DESCRIZIONE */}
              <div className="space-y-1">
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-700">
                  Descrizione Capo & Destinazione d'Uso
                </label>
                <textarea
                  rows={2}
                  value={editingArticolo.descrizione || ''}
                  onChange={e => setEditingArticolo({ ...editingArticolo, descrizione: e.target.value })}
                  placeholder="Descrivi i dettagli del capo, vestibilità, loghi societari..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none text-xs"
                />
              </div>

              {/* URL FOTO ARTICOLO */}
              <div className="space-y-2">
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-700">
                  URL Foto Capo
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingArticolo.foto_url || ''}
                    onChange={e => setEditingArticolo({ ...editingArticolo, foto_url: e.target.value })}
                    placeholder="https://... oppure /images/merch/felpa.jpg"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 focus:border-amber-400 outline-none text-xs"
                  />
                  {editingArticolo.foto_url && (
                    <div className="w-10 h-10 rounded-xl border border-slate-200 overflow-hidden bg-black shrink-0">
                      <img src={editingArticolo.foto_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* SELEZIONE TAGLIE */}
              <div className="space-y-2">
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-700">
                  Taglie Previste nel Kit
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TAGLIE_PRESET.map(t => {
                    const isSelected = (editingArticolo.taglie_disponibili || []).includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTaglia(t)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-sm'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={customTaglia}
                    onChange={e => setCustomTaglia(e.target.value)}
                    placeholder="Aggiungi altra taglia..."
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTaglia(); } }}
                  />
                  <button
                    type="button"
                    onClick={addCustomTaglia}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-white font-bold text-xs"
                  >
                    Aggiungi
                  </button>
                </div>
              </div>

              {/* ETICHETTA & NOVITÀ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-700">
                    Etichetta Linea (es. "KIT GARA", "LINEA TRAINING", "DOTAZIONE BASE")
                  </label>
                  <input
                    type="text"
                    value={editingArticolo.promo_label || ''}
                    onChange={e => setEditingArticolo({ ...editingArticolo, promo_label: e.target.value })}
                    placeholder="es. KIT UFFICIALE"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div className="flex items-center gap-4 pt-4">
                  {/* NOVITÀ */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingArticolo.novita)}
                      onChange={e => setEditingArticolo({ ...editingArticolo, novita: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span className="text-xs font-bold text-slate-800">Badge Novità 2026/27</span>
                  </label>

                  {/* DISPONIBILE */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingArticolo.disponibile)}
                      onChange={e => setEditingArticolo({ ...editingArticolo, disponibile: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-800">In Palazzetto</span>
                  </label>
                </div>
              </div>

              {/* MATERIALI / NOTE TECNICHE */}
              <div className="space-y-1">
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-700">
                  Materiale / Composizione Tessile
                </label>
                <input
                  type="text"
                  value={editingArticolo.materiale || ''}
                  onChange={e => setEditingArticolo({ ...editingArticolo, materiale: e.target.value })}
                  placeholder="es. 100% Poliestere Interlock Dry-Fit traspirante"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              {/* ORDINE VISUALIZZAZIONE */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-600">
                    Ordine in Catalogo
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingArticolo.ordine || 1}
                    onChange={e => setEditingArticolo({ ...editingArticolo, ordine: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-600">
                    Stato Ritiro
                  </label>
                  <select
                    value={editingArticolo.stato_disponibilita || 'immediata'}
                    onChange={e => setEditingArticolo({ ...editingArticolo, stato_disponibilita: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="immediata">Disponibile per prova in sede</option>
                    <option value="su_ordinazione">Su ordinazione per atleti</option>
                    <option value="esaurito">In fase di riassortimento</option>
                  </select>
                </div>
              </div>

              {/* BOTTONI FORM */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                >
                  Annulla
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-sport italic skew-x-[-6deg] uppercase tracking-wider font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Salva Capo</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
