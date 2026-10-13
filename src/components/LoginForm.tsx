import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUtente, auth } from '../firebase-societa';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Shield, Lock, Mail, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isResetMode, setIsResetMode] = useState(false);
  const [emailReset, setEmailReset] = useState('');
  const [resetSentMessage, setResetSentMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect target after successful login
  const from = (location.state as any)?.from?.pathname || '/admin/news';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Inserisci sia l\'email che la password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await loginUtente(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto durante l\'accesso.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailReset) {
      setResetError('Inserisci l\'indirizzo e-mail.');
      return;
    }
    setResetLoading(true);
    setResetError(null);
    setResetSentMessage(null);
    try {
      if (!auth) {
        // Se auth è nullo (es. in Demo Mode), simuliamo l'invio con successo per evitare il crash
        setResetSentMessage(`✓ [DEMO MODE] Link di ripristino password inviato a ${emailReset}`);
        return;
      }
      await sendPasswordResetEmail(auth, emailReset);
      setResetSentMessage(`✓ Link di ripristino inviato con successo a ${emailReset}`);
    } catch (err: any) {
      setResetError(err instanceof Error ? err.message : 'Errore durante l\'invio del link di ripristino.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8" id="login-container">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-850 transition-colors mb-6 font-mono uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Torna al portale pubblico
        </button>
        
        <div className="inline-flex items-center justify-center p-3.5 bg-amber-500 rounded-2xl text-slate-950 shadow-lg shadow-amber-500/10 mb-4">
          <Shield className="w-8 h-8" />
        </div>
        
        <h2 className="text-3xl font-extrabold uppercase tracking-wide text-slate-900 font-barlow">
          LOGIN AMMINISTRAZIONE
        </h2>
        <p className="mt-2 text-sm text-slate-600 font-medium">
          CMS New Volley Academy — Accesso Riservato
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900 border border-zinc-800 py-8 px-4 shadow-xl rounded-2xl sm:px-10">
          {isResetMode ? (
            <form className="space-y-5" onSubmit={handleResetSubmit} id="reset-form">
              <div className="border-b border-zinc-800 pb-3 mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Ripristina Password</h3>
                <p className="text-[11px] text-zinc-400 mt-1">Riceverai un link via email per impostare una nuova password.</p>
              </div>

              {resetSentMessage && (
                <div className="mb-5 bg-emerald-950/40 border border-emerald-800 p-3.5 rounded-xl text-xs text-emerald-400" id="reset-success">
                  <span>{resetSentMessage}</span>
                </div>
              )}
              {resetError && (
                <div className="mb-5 bg-red-950/40 border border-red-800 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-red-400" id="reset-error">
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <span>{resetError}</span>
                </div>
              )}

              <div>
                <label htmlFor="reset-email" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono mb-2">
                  Indirizzo E-mail
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={emailReset}
                    onChange={(e) => setEmailReset(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                    placeholder="nome@societa.it"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-slate-950 font-black py-3 text-xs uppercase tracking-wider font-sport italic skew-x-[-8deg] rounded-xl transition-all shadow-md mt-6 flex items-center justify-center gap-2"
              >
                {resetLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="transform skew-x-[8deg]">Invia link di ripristino</span>
                )}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetMode(false);
                    setResetSentMessage(null);
                    setResetError(null);
                  }}
                  className="text-xs text-zinc-400 hover:text-white transition-colors uppercase font-mono tracking-wider cursor-pointer"
                >
                  Torna al Login
                </button>
              </div>
            </form>
          ) : (
            <>
              {error && (
                <div className="mb-5 bg-red-950/40 border border-red-800 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-red-400" id="login-error">
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit} id="login-form">
                <div>
                  <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono mb-2">
                    Indirizzo E-mail
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                      placeholder="nome@societa.it"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono mb-2">
                    Password
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetMode(true);
                        setEmailReset(email); // Prefill email
                      }}
                      className="text-[11px] text-zinc-400 hover:text-amber-500 transition-colors uppercase font-mono tracking-wider cursor-pointer"
                    >
                      Password dimenticata?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-slate-950 font-black py-3 text-xs uppercase tracking-wider font-sport italic skew-x-[-8deg] rounded-xl transition-all shadow-md mt-6 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="transform skew-x-[8deg]">Accedi al CMS</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
