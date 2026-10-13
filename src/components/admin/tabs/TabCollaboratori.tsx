import React, { useState, useEffect } from 'react';
import { Plus, Users, Trash2, Key, Shield, ShieldCheck, Mail, AlertCircle } from 'lucide-react';
import { 
  AdminUser, 
  RosaSquadra, 
  creaNuovoUtenteAmministrativo, 
  eliminaCollaboratore,
  getAdminUsersAll,
  auth
} from '../../../firebase-societa';
import { sendPasswordResetEmail } from 'firebase/auth';

interface TabCollaboratoriProps {
  currentUser: AdminUser | null;
  squadreAll: RosaSquadra[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function TabCollaboratori({
  currentUser,
  squadreAll,
  showToast
}: TabCollaboratoriProps) {
  const [collaboratoriAll, setCollaboratoriAll] = useState<AdminUser[]>([]);
  const [loadingCollaboratori, setLoadingCollaboratori] = useState(false);
  const [deletingCollaboratorId, setDeletingCollaboratorId] = useState<string | null>(null);
  const [resetSentEmails, setResetSentEmails] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [collaboratoreForm, setCollaboratoreForm] = useState({
    email: '',
    password: '',
    ruolo: 'Super Admin' as 'Super Admin' | 'Collaboratore/Allenatore',
    squadreAssegnate: [] as string[],
    profiloId: ''
  });

  const loadCollaboratori = async () => {
    try {
      setLoadingCollaboratori(true);
      const users = await getAdminUsersAll();
      setCollaboratoriAll(users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCollaboratori(false);
    }
  };

  useEffect(() => {
    loadCollaboratori();
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collaboratoreForm.email || !collaboratoreForm.password) {
      showToast("Compila Email e Password temporanea!", "error");
      return;
    }
    if (currentUser && collaboratoreForm.email.toLowerCase() === currentUser.email.toLowerCase()) {
      showToast("Non puoi registrare nuovamente te stesso!", "error");
      return;
    }
    try {
      setIsSubmitting(true);
      await creaNuovoUtenteAmministrativo(
        collaboratoreForm.email,
        collaboratoreForm.password,
        'Super Admin',
        [],
        undefined
      );
      showToast("Super Admin creato e registrato con successo!", "success");
      setCollaboratoreForm({ email: '', password: '', ruolo: 'Super Admin', squadreAssegnate: [], profiloId: '' });
      await loadCollaboratori();
    } catch (err: any) {
      showToast(err?.message || "Errore durante la creazione del Super Admin.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendResetPassword = async (email: string) => {
    try {
      if (!auth) {
        setResetSentEmails(prev => ({ ...prev, [email]: true }));
        showToast(`[DEMO] Email di reset inviata a ${email}`, "success");
        setTimeout(() => setResetSentEmails(prev => ({ ...prev, [email]: false })), 4000);
        return;
      }
      await sendPasswordResetEmail(auth, email);
      setResetSentEmails(prev => ({ ...prev, [email]: true }));
      showToast(`Email di reset inviata a ${email}`, "success");
      setTimeout(() => setResetSentEmails(prev => ({ ...prev, [email]: false })), 4000);
    } catch (err: any) {
      showToast(`Errore: ${err.message}`, "error");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-xs" id="admin-tab-collaboratori">
      {/* Form to create a new Super Admin */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
        <h3 className="text-md font-extrabold text-slate-900 uppercase tracking-wider font-sport italic flex items-center gap-2 border-b border-slate-200/65 pb-2">
          <Plus className="w-5 h-5 text-amber-500" /> + CREA NUOVO SUPER ADMIN
        </h3>
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Email del Super Admin *</label>
              <input
                type="email"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                placeholder="es. nome@pantere.it"
                value={collaboratoreForm.email}
                onChange={e => setCollaboratoreForm({ ...collaboratoreForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-500 font-mono text-[10px] uppercase font-bold">Password temporanea *</label>
              <input
                type="text"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                placeholder="minimo 6 caratteri"
                value={collaboratoreForm.password}
                onChange={e => setCollaboratoreForm({ ...collaboratoreForm, password: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2.5 rounded-xl text-xs uppercase font-sport tracking-wider italic skew-x-[-6deg] shadow transition-all flex items-center justify-center gap-2 ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {isSubmitting ? 'Registrazione in corso...' : '👤 Registra e Abilita Super Admin'}
          </button>
        </form>
      </div>

      {/* List of collaborators */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
        <div className="border-b border-slate-200 pb-2">
          <h3 className="text-md font-extrabold text-slate-900 uppercase tracking-wider font-sport italic">
            👥 Amministratori e Collaboratori Registrati ({collaboratoriAll.length})
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Gestione dei permessi e degli account per l'accesso al CMS.</p>
        </div>

        {loadingCollaboratori ? (
          <div className="text-center py-6 text-slate-500 font-mono text-xs">Caricamento collaboratori...</div>
        ) : (
          <div className="space-y-3">
            {collaboratoriAll.map(user => {
              const self = currentUser && user.email.toLowerCase() === currentUser.email.toLowerCase();
              return (
                <div key={user.uid} className="bg-slate-50/50 border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-slate-100 text-slate-600 text-[9px] font-mono tracking-wider px-2 py-0.5 rounded border border-slate-200">
                        UID: {user.uid}
                      </span>
                      <span className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-mono border ${
                        user.ruolo === 'Super Admin'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}>
                        {user.ruolo}
                      </span>
                      {self && (
                        <span className="bg-emerald-100 text-emerald-800 text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-mono border border-emerald-300">
                          TU
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 truncate">{user.email}</h4>
                    {user.ruolo === 'Collaboratore/Allenatore' && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-500">Squadre assegnate:</span>
                        {user.squadre_assegnate && user.squadre_assegnate.length > 0 ? (
                          user.squadre_assegnate.map(sid => {
                            const squad = squadreAll.find(s => s.id === sid);
                            return (
                              <span key={sid} className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded border border-slate-300 font-bold">
                                {squad ? squad.nome_squadra : `ID: ${sid}`}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-[10px] text-rose-600 italic font-mono">Nessuna squadra associata</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {resetSentEmails[user.email] ? (
                      <span className="text-emerald-700 font-bold text-xs py-1.5 px-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        ✓ Reset inviato
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSendResetPassword(user.email)}
                        className="border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs cursor-pointer shadow-sm"
                      >
                        <Key className="w-3.5 h-3.5 text-amber-500" /> Reset Password
                      </button>
                    )}

                    {!self && (
                      deletingCollaboratorId === user.uid ? (
                        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl text-xs animate-pulse">
                          <span className="text-rose-700 font-semibold select-none text-[11px]">Eliminare?</span>
                          <button
                            onClick={async () => {
                              try {
                                await eliminaCollaboratore(user.uid);
                                showToast("Collaboratore eliminato con successo!", "success");
                                setDeletingCollaboratorId(null);
                                loadCollaboratori();
                              } catch (err) {
                                showToast("Errore durante l'eliminazione.", "error");
                              }
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-2 py-0.5 rounded font-bold transition-all text-xs cursor-pointer"
                          >
                            SÌ
                          </button>
                          <button
                            onClick={() => setDeletingCollaboratorId(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-0.5 rounded font-bold transition-all text-xs cursor-pointer"
                          >
                            NO
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingCollaboratorId(user.uid)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Elimina
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
