import React from 'react';
import { MessageCircle, Mail, Phone, Lock } from 'lucide-react';

interface MaintenanceProps {
  onAdminLogin?: () => void;
  logoUrl?: string;
  societaInfo?: any;
}

export const Maintenance: React.FC<MaintenanceProps> = ({
  onAdminLogin,
  logoUrl,
  societaInfo
}) => {
  // Contatti ufficiali reali e verificati NVA
  const rawTelefono = societaInfo?.contatti?.telefono || '';
  const telefono = (!rawTelefono || rawTelefono.includes('0543') || rawTelefono.includes('789') || rawTelefono.includes('1234567'))
    ? '+39 351 321 0332'
    : rawTelefono;

  const rawEmail = societaInfo?.contatti?.email || '';
  const email = (!rawEmail || rawEmail.includes('forli.it') || rawEmail.includes('example') || rawEmail.includes('placeholder'))
    ? 'info@newvolleyacademy.it'
    : rawEmail;

  const whatsappNumber = telefono.replace(/[^0-9]/g, '');

  return (
    <div className="min-h-screen w-full bg-[#07080A] text-white flex flex-col justify-between relative overflow-hidden select-none font-sans">
      
      {/* SFONDO FOTOGRAFICO CON LA PANTERA (Cinematic Fade) */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/images/pantera-hero.png" 
          alt="Pantera NVA" 
          className="w-full h-full object-cover object-center lg:object-[center_25%] filter brightness-95 contrast-110"
        />
        {/* Gradienti protettivi per fondere la pantera nel nero puro #07080A */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080A] via-[#07080A]/75 to-[#07080A]/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07080A] via-transparent to-[#07080A]/60" />
        
        {/* Alone di luce dorata dietro al testo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FFE600]/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* HEADER DELLA PAGINA DI MANUTENZIONE */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        {/* Brand Badge */}
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="New Volley Academy" 
              className="h-12 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
            />
          ) : (
            <div className="w-11 h-11 bg-zinc-950 border-2 border-[#FFE600] rounded-full flex items-center justify-center text-[#FFE600] font-black text-xs font-sport shadow-lg">
              NVA
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-black font-barlow text-lg uppercase tracking-wider text-white leading-none">
              NEW VOLLEY ACADEMY
            </span>
            <span className="font-bold font-sport text-[10px] uppercase tracking-widest text-[#FFE600] mt-0.5">
              FORLÌ • VOLLEY CLUB UFFICIALE
            </span>
          </div>
        </div>

        {/* Pulsante Staff Access */}
        {onAdminLogin && (
          <button
            onClick={onAdminLogin}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-[#FFE600] border border-zinc-800 transition-all text-xs font-bold font-mono tracking-wider cursor-pointer"
            title="Area Riservata Staff / Allenatori"
          >
            <Lock className="w-3.5 h-3.5 text-[#FFE600]" />
            <span className="hidden sm:inline">ACCESSO STAFF</span>
          </button>
        )}
      </header>

      {/* CONTENUTO CENTRALE */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 text-center flex flex-col items-center">
        
        {/* Pillola Status Attesa */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFE600]/15 border border-[#FFE600]/40 text-[#FFE600] text-xs font-black uppercase tracking-widest mb-6 shadow-[0_0_15px_rgba(255,230,0,0.15)]">
          <span className="w-2 h-2 rounded-full bg-[#FFE600] animate-ping" />
          <span>LE PANTERE STANNO ARRIVANDO</span>
        </div>

        {/* Titolo Principale */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black font-barlow uppercase tracking-tight text-white leading-[0.95] mb-4 sports-text-shadow">
          STAGIONE 2026/2027 <br />
          <span className="text-[#FFE600]">SITO IN AGGIORNAMENTO.</span>
        </h1>

        {/* Descrizione */}
        <p className="text-zinc-300 text-sm sm:text-base lg:text-lg max-w-2xl font-normal leading-relaxed mb-8">
          Stiamo affilando gli artigli per il via ufficiale dei campionati e delle attività della scuola di pallavolo. 
          Il portale ufficiale tornerà online a brevissimo con le rose delle squadre, i calendari gare, i camp e tutte le novità in giallo e nero!
        </p>

        {/* Card Contatti Rapidi & WhatsApp */}
        <div className="w-full max-w-xl bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/90 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-5">
          <p className="text-xs uppercase tracking-widest text-[#FFE600] font-sport font-black">
            Hai bisogno di informazioni o vuoi iscriverti?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Tasto WhatsApp */}
            <a 
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Ciao! Vorrei maggiori informazioni sulla New Volley Academy.")}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-zinc-950 font-bold text-xs uppercase px-4 py-3 rounded-xl transition-all shadow-lg shadow-[#25D366]/20 font-barlow tracking-wider"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>SCRIVICI SU WHATSAPP</span>
            </a>

            {/* Telefono Segreteria */}
            <a 
              href={`tel:${telefono.replace(/\s+/g, '')}`}
              className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-850 text-white font-bold text-xs uppercase px-4 py-3 rounded-xl border border-zinc-700/80 transition-all font-barlow tracking-wider"
            >
              <Phone className="w-4 h-4 text-[#FFE600]" />
              <span>{telefono}</span>
            </a>
          </div>

          {/* Dettagli Email */}
          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-center text-xs text-zinc-400">
            <a 
              href={`mailto:${email}`}
              className="flex items-center gap-1.5 hover:text-[#FFE600] transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-[#FFE600] shrink-0" />
              <span>{email}</span>
            </a>
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 border-t border-zinc-900">
        <p>© {new Date().getFullYear()} New Volley Academy S.S.D. a R.L. • Tutti i diritti riservati.</p>
        <div className="flex items-center gap-4 text-zinc-400">
          <span className="text-[11px] font-mono">FORLÌ PALLAVOLO DAL 2018</span>
        </div>
      </footer>

    </div>
  );
};

export default Maintenance;
