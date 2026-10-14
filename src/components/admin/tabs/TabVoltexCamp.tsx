import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Calendar, 
  MapPin, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MessageCircle, 
  Download, 
  Loader2, 
  RefreshCw,
  Eye,
  Sliders
} from 'lucide-react';
import { 
  getVoltexCampConfig, 
  updateVoltexCampConfig, 
  VoltexCampConfig, 
  VoltexCampDate, 
  VoltexIscrizione,
  DEFAULT_VOLTEX_CAMP_CONFIG 
} from '../../../firebase-societa';

interface TabVoltexCampProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function TabVoltexCamp({ showToast }: TabVoltexCampProps) {
  const [config, setConfig] = useState<VoltexCampConfig>(DEFAULT_VOLTEX_CAMP_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subTab, setSubTab] = useState<'date' | 'iscrizioni' | 'testi'>('date');

  // Stato per nuova/modifica tappa
  const [editingTappa, setEditingTappa] = useState<VoltexCampDate | null>(null);
  const [isNewTappa, setIsNewTappa] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getVoltexCampConfig();
      setConfig(data);
    } catch {
      showToast("Errore nel caricamento configurazione Voltex", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (newConfig: VoltexCampConfig) => {
    setSaving(true);
    try {
      await updateVoltexCampConfig(newConfig);
      setConfig(newConfig);
      showToast("Configurazione Voltex salvata con successo", "success");
    } catch {
      showToast("Errore durante il salvataggio", "error");
    } finally {
      setSaving(false);
    }
  };

  // Gestione Tappe
  const handleSaveTappa = (tappaToSave: VoltexCampDate) => {
    let updatedDate: VoltexCampDate[];
    if (isNewTappa) {
      updatedDate = [...(config.date_camp || []), tappaToSave];
    } else {
      updatedDate = (config.date_camp || []).map(d => d.id === tappaToSave.id ? tappaToSave : d);
    }
    const newConfig = { ...config, date_camp: updatedDate };
    handleSaveConfig(newConfig);
    setEditingTappa(null);
    setIsNewTappa(false);
  };

  const handleDeleteTappa = (tappaId: string) => {
    if (!window.confirm("Sei sicuro di voler eliminare questa tappa?")) return;
    const updatedDate = (config.date_camp || []).filter(d => d.id !== tappaId);
    handleSaveConfig({ ...config, date_camp: updatedDate });
  };

  // Gestione Iscrizioni
  const handleUpdateStatoIscrizione = (iscrizioneId: string, nuovoStato: VoltexIscrizione['stato']) => {
    const updated = (config.iscrizioni_ricevute || []).map(isc => 
      isc.id === iscrizioneId ? { ...isc, stato: nuovoStato } : isc
    );
    handleSaveConfig({ ...config, iscrizioni_ricevute: updated });
  };

  const handleDeleteIscrizione = (iscrizioneId: string) => {
    if (!window.confirm("Eliminare questa richiesta di iscrizione?")) return;
    const updated = (config.iscrizioni_ricevute || []).filter(isc => isc.id !== iscrizioneId);
    handleSaveConfig({ ...config, iscrizioni_ricevute: updated });
  };

  const exportIscrizioniCSV = () => {
    const iscrizioni = config.iscrizioni_ricevute || [];
    if (iscrizioni.length === 0) {
      showToast("Nessuna iscrizione da esportare", "info");
      return;
    }

    const headers = ["Data", "Atleta", "Data Nascita", "Ruolo", "Tappa", "Genitore", "Telefono", "Email", "Taglia Kit", "Stato", "Note"];
    const rows = iscrizioni.map(i => [
      new Date(i.data_richiesta).toLocaleDateString('it-IT'),
      `"${i.nome_atleta} ${i.cognome_atleta}"`,
      i.data_nascita || "",
      `"${i.ruolo} (${i.livello_squadra || ''})"`,
      `"${i.tappa_nome}"`,
      `"${i.nome_genitore || ''}"`,
      `"${i.telefono}"`,
      `"${i.email}"`,
      i.taglia_kit || "",
      i.stato,
      `"${(i.note || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `iscrizioni_voltex_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-xs font-mono text-slate-500">Caricamento modulo Voltex Camp...</p>
      </div>
    );
  }

  const iscrizioni = config.iscrizioni_ricevute || [];
  const tappe = config.date_camp || [];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-900 border border-red-700/40 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-sport uppercase tracking-tight text-white">
                Gestione Voltex Academy Camp
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-bold uppercase tracking-wider border border-red-500/30">
                Partner Ufficiale
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Gestisci date, quote, testi e monitora le iscrizioni ricevute dalla pagina pubblica.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/voltex"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            Vedi Pagina
          </a>
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
            title="Ricarica Dati"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sotto-Menu Tab */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setSubTab('date')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            subTab === 'date'
              ? 'bg-amber-400 text-slate-950 shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Date & Tappe ({tappe.length})
        </button>

        <button
          onClick={() => setSubTab('iscrizioni')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            subTab === 'iscrizioni'
              ? 'bg-amber-400 text-slate-950 shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Iscrizioni Ricevute ({iscrizioni.length})
          {iscrizioni.some(i => i.stato === 'nuova') && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setSubTab('testi')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            subTab === 'testi'
              ? 'bg-amber-400 text-slate-950 shadow'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Testi & Informazioni
        </button>
      </div>

      {/* 1. SOTTO-TAB: DATE & TAPPE */}
      {subTab === 'date' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Elenco Tappe Attive ({tappe.length})
            </h3>
            <button
              onClick={() => {
                setEditingTappa({
                  id: `tappa_${Date.now()}`,
                  titolo: 'Nuova Tappa Voltex',
                  localita: 'Città (PROV)',
                  periodo: 'Data Inizio - Data Fine',
                  struttura: 'Palazzetto dello Sport',
                  destinatari: 'Ragazzi e Ragazze 10-18 anni',
                  posti_totali: 30,
                  posti_occupati: 0,
                  quota: 'Formula Day Camp o Residenziale',
                  stato: 'aperte',
                  note: '',
                  attivo: true
                });
                setIsNewTappa(true);
              }}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Aggiungi Tappa
            </button>
          </div>

          {/* Form Editing Tappa */}
          {editingTappa && (
            <div className="p-6 rounded-2xl bg-white border-2 border-red-500 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="font-bold text-sm text-slate-800 uppercase font-sport">
                  {isNewTappa ? "Nuova Tappa del Camp" : "Modifica Tappa"}
                </h4>
                <button 
                  onClick={() => setEditingTappa(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Annulla
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Titolo Tappa</label>
                  <input
                    type="text"
                    value={editingTappa.titolo}
                    onChange={(e) => setEditingTappa({ ...editingTappa, titolo: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Località</label>
                  <input
                    type="text"
                    value={editingTappa.localita}
                    onChange={(e) => setEditingTappa({ ...editingTappa, localita: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Periodo / Date</label>
                  <input
                    type="text"
                    value={editingTappa.periodo}
                    onChange={(e) => setEditingTappa({ ...editingTappa, periodo: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Struttura / Impianto</label>
                  <input
                    type="text"
                    value={editingTappa.struttura}
                    onChange={(e) => setEditingTappa({ ...editingTappa, struttura: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Destinatari / Fascia Età</label>
                  <input
                    type="text"
                    value={editingTappa.destinatari}
                    onChange={(e) => setEditingTappa({ ...editingTappa, destinatari: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Quota / Indicazione Prezzo</label>
                  <input
                    type="text"
                    value={editingTappa.quota}
                    onChange={(e) => setEditingTappa({ ...editingTappa, quota: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Posti Totali</label>
                  <input
                    type="number"
                    value={editingTappa.posti_totali}
                    onChange={(e) => setEditingTappa({ ...editingTappa, posti_totali: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Posti Occupati</label>
                  <input
                    type="number"
                    value={editingTappa.posti_occupati}
                    onChange={(e) => setEditingTappa({ ...editingTappa, posti_occupati: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Stato Iscrizioni</label>
                  <select
                    value={editingTappa.stato}
                    onChange={(e) => setEditingTappa({ ...editingTappa, stato: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-red-500"
                  >
                    <option value="aperte">Aperte</option>
                    <option value="in_esaurimento">In Esaurimento</option>
                    <option value="chiuse">Chiuse (Sold Out)</option>
                    <option value="prossimamente">Prossimamente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Note Aggiuntive</label>
                <input
                  type="text"
                  value={editingTappa.note || ''}
                  onChange={(e) => setEditingTappa({ ...editingTappa, note: e.target.value })}
                  placeholder="es. Pernottamento pensione completa incluso"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setEditingTappa(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold uppercase cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  onClick={() => handleSaveTappa(editingTappa)}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Salva Tappa
                </button>
              </div>
            </div>
          )}

          {/* Lista Card Tappe */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tappe.map((tappa) => (
              <div 
                key={tappa.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-red-500" />
                        {tappa.localita}
                      </span>
                      <h4 className="font-bold text-base text-slate-900 font-sport uppercase">
                        {tappa.titolo}
                      </h4>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      tappa.stato === 'chiuse'
                        ? 'bg-red-100 text-red-800'
                        : tappa.stato === 'in_esaurimento'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {tappa.stato}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <p><strong>Periodo:</strong> {tappa.periodo}</p>
                    <p><strong>Struttura:</strong> {tappa.struttura}</p>
                    <p><strong>Fascia:</strong> {tappa.destinatari}</p>
                    <p><strong>Quota:</strong> {tappa.quota}</p>
                    <p><strong>Posti:</strong> {tappa.posti_occupati} / {tappa.posti_totali}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t pt-3">
                  <button
                    onClick={() => {
                      setEditingTappa(tappa);
                      setIsNewTappa(false);
                    }}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Modifica
                  </button>
                  <button
                    onClick={() => handleDeleteTappa(tappa.id)}
                    className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-all cursor-pointer"
                    title="Elimina Tappa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. SOTTO-TAB: ISCRIZIONI */}
      {subTab === 'iscrizioni' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Richieste di Iscrizione Ricevute ({iscrizioni.length})
              </h3>
              <p className="text-xs text-slate-500">
                Clicca su WhatsApp per ricontattare l'atleta o il genitore con messaggio già pronto.
              </p>
            </div>

            <button
              onClick={exportIscrizioniCSV}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" />
              Esporta CSV
            </button>
          </div>

          {iscrizioni.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 text-slate-400 space-y-2">
              <Users className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm font-medium">Nessuna iscrizione pervenuta finora.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Data</th>
                      <th className="p-3.5">Atleta</th>
                      <th className="p-3.5">Tappa Scelta</th>
                      <th className="p-3.5">Contatti</th>
                      <th className="p-3.5">Kit / Note</th>
                      <th className="p-3.5">Stato</th>
                      <th className="p-3.5 text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {iscrizioni.map((isc) => {
                      const waPhone = (isc.telefono || '').replace(/[^0-9]/g, '');
                      const waText = encodeURIComponent(
                        `Ciao ${isc.nome_genitore || isc.nome_atleta}, ti contattiamo da Voltex Academy / New Volley Academy riguardo la richiesta di iscrizione per ${isc.nome_atleta} alla tappa di ${isc.tappa_nome}.`
                      );

                      return (
                        <tr key={isc.id} className="hover:bg-slate-50/70">
                          <td className="p-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                            {new Date(isc.data_richiesta).toLocaleDateString('it-IT')}
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-slate-900 block">{isc.nome_atleta} {isc.cognome_atleta}</span>
                            <span className="text-[11px] text-slate-500">{isc.data_nascita} • {isc.ruolo}</span>
                          </td>
                          <td className="p-3.5 font-medium text-slate-800">
                            {isc.tappa_nome}
                          </td>
                          <td className="p-3.5">
                            <span className="block font-mono text-slate-800">{isc.telefono}</span>
                            <span className="text-[11px] text-slate-500 block">{isc.email}</span>
                            {isc.nome_genitore && <span className="text-[10px] text-slate-400">Genitore: {isc.nome_genitore}</span>}
                          </td>
                          <td className="p-3.5">
                            <span className="inline-block px-2 py-0.5 rounded bg-slate-100 font-bold text-[10px] text-slate-700 mb-1">
                              Taglia: {isc.taglia_kit}
                            </span>
                            {isc.note && <p className="text-[11px] text-slate-500 italic max-w-xs">{isc.note}</p>}
                          </td>
                          <td className="p-3.5">
                            <select
                              value={isc.stato}
                              onChange={(e) => handleUpdateStatoIscrizione(isc.id, e.target.value as any)}
                              className={`text-[11px] font-bold uppercase rounded-lg px-2.5 py-1 border ${
                                isc.stato === 'nuova'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : isc.stato === 'confermata'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : isc.stato === 'contattato'
                                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                                  : 'bg-slate-100 text-slate-600 border-slate-300'
                              }`}
                            >
                              <option value="nuova">Nuova</option>
                              <option value="contattato">Contattato</option>
                              <option value="confermata">Confermata</option>
                              <option value="annullata">Annullata</option>
                            </select>
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap space-x-1">
                            {waPhone && (
                              <a
                                href={`https://wa.me/${waPhone}?text=${waText}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 inline-flex rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-all"
                                title="Apri WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteIscrizione(isc.id)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all cursor-pointer"
                              title="Elimina"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. SOTTO-TAB: TESTI & CONFIGURAZIONE */}
      {subTab === 'testi' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Impostazioni e Contenuti Pagina Voltex
              </h3>
              <p className="text-xs text-slate-500">Modifica i testi della landing page pubblica.</p>
            </div>
            <button
              onClick={() => handleSaveConfig(config)}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salva Modifiche
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Titolo Hero</label>
                <input
                  type="text"
                  value={config.titolo_hero}
                  onChange={(e) => setConfig({ ...config, titolo_hero: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Sottotitolo Hero</label>
                <input
                  type="text"
                  value={config.sottotitolo_hero}
                  onChange={(e) => setConfig({ ...config, sottotitolo_hero: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Testo Banner Annuncio</label>
              <input
                type="text"
                value={config.testo_annuncio}
                onChange={(e) => setConfig({ ...config, testo_annuncio: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Descrizione Breve</label>
              <textarea
                rows={2}
                value={config.descrizione_breve}
                onChange={(e) => setConfig({ ...config, descrizione_breve: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Descrizione Completa</label>
              <textarea
                rows={4}
                value={config.descrizione_completa}
                onChange={(e) => setConfig({ ...config, descrizione_completa: e.target.value })}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">WhatsApp Notifiche Iscrizioni</label>
                <input
                  type="text"
                  value={config.contatti_whatsapp}
                  onChange={(e) => setConfig({ ...config, contatti_whatsapp: e.target.value })}
                  placeholder="393401234567"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Username Instagram</label>
                <input
                  type="text"
                  value={config.instagram_username}
                  onChange={(e) => setConfig({ ...config, instagram_username: e.target.value })}
                  placeholder="voltexcamp"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
