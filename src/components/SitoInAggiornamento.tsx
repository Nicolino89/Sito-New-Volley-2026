import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Construction, ArrowLeft, Users, Sparkles, Shield } from 'lucide-react';

interface SitoInAggiornamentoProps {
  sezione?: string;
  descrizione?: string;
}

export const SitoInAggiornamento: React.FC<SitoInAggiornamentoProps> = ({
  sezione,
  descrizione
}) => {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-[65vh] flex items-center justify-center px-4 py-12 md:py-20 select-none">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-2xl w-full bg-gradient-to-b from-zinc-900 via-[#121316] to-black border border-zinc-800 rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden"
      >
        {/* Glow & Sfondo decorativo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />

        {/* Badge in alto */}
        <div className="inline-flex items-center gap-2 bg-[#FFE600]/15 border border-[#FFE600]/30 text-[#FFE600] text-xs font-mono font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Stagione 2026/2027</span>
        </div>

        {/* Icona Pantera & Lavori in corso */}
        <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#FFE600]/20 rounded-2xl animate-ping opacity-25" />
          <div className="relative bg-zinc-900 border-2 border-[#FFE600] rounded-2xl w-full h-full flex items-center justify-center shadow-lg">
            <Construction className="w-9 h-9 text-[#FFE600]" />
          </div>
        </div>

        {/* Titolo Principale */}
        <h1 className="text-3xl sm:text-5xl font-barlow font-black text-white uppercase tracking-tight mb-3">
          Sito in Aggiornamento
        </h1>

        {sezione && (
          <p className="text-sm sm:text-base font-barlow font-bold text-[#FFE600] uppercase tracking-wider mb-4">
            Area: {sezione}
          </p>
        )}

        {/* Testo descrittivo */}
        <p className="text-zinc-300 text-sm sm:text-base max-w-lg mx-auto leading-relaxed mb-8">
          {descrizione || "Stiamo perfezionando i contenuti di questa sezione per la nuova stagione sportiva. Torna a trovarci a breve per tutte le novità!"}
        </p>

        {/* Azioni rapide */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FFE600] hover:bg-yellow-400 text-black font-barlow font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna alla Home
          </button>

          <button
            onClick={() => navigate('/squadre')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-barlow font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl border border-zinc-700 transition-all hover:border-zinc-500 active:scale-[0.98] cursor-pointer"
          >
            <Users className="w-4 h-4 text-[#FFE600]" />
            Scopri le Squadre
          </button>
        </div>

        {/* Footer rassicurante */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80 flex items-center justify-center gap-2 text-zinc-500 text-xs font-mono">
          <Shield className="w-3.5 h-3.5 text-zinc-400" />
          <span>New Volley Academy Forlì • Le Pantere</span>
        </div>
      </motion.div>
    </div>
  );
};

export default SitoInAggiornamento;
