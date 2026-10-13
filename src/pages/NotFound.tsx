import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Users, Newspaper, ArrowLeft, ShieldAlert } from 'lucide-react';
import { updatePageMeta } from '../utils/seoHelper';

export default function NotFound() {
  const navigate = useNavigate();

  useEffect(() => {
    updatePageMeta({
      title: 'Palla Fuori! (404) | New Volley Academy',
      description: 'La pagina cercata non è stata trovata.'
    });
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-12 md:py-20 px-4 text-center space-y-8 animate-fade-in" id="not-found-page">
      {/* Visual Volleyball Animation / Badge */}
      <div className="relative inline-block">
        <div className="w-32 h-32 md:w-40 md:h-40 bg-zinc-950 border-4 border-brand-yellow rounded-full flex flex-col items-center justify-center mx-auto shadow-2xl relative overflow-hidden group">
          <div className="text-5xl md:text-6xl animate-bounce select-none">
            🏐
          </div>
          <span className="text-[11px] font-black text-brand-yellow font-sport tracking-widest uppercase mt-1">
            OUT!
          </span>
        </div>
        <div className="absolute -bottom-2 -right-2 bg-rose-600 text-white font-black text-xs px-3 py-1 rounded-full uppercase font-mono shadow-md">
          404
        </div>
      </div>

      {/* Text Headlines */}
      <div className="space-y-3">
        <h1 className="text-4xl md:text-6xl font-sport font-black uppercase italic tracking-tight text-zinc-950 skew-x-[-6deg]">
          PALLA FUORI DAL CAMPO!
        </h1>
        <p className="text-zinc-600 font-inter text-sm md:text-base max-w-md mx-auto leading-relaxed">
          La traiettoria di questa pagina è terminata oltre la linea di fondo. Il contenuto cercato potrebbe essere stato spostato o non esistere più.
        </p>
      </div>

      {/* Navigation Quick Links */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          onClick={() => navigate('/')}
          className="bg-brand-yellow hover:bg-yellow-400 text-black font-sport font-black uppercase text-xs tracking-wider px-6 py-3.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer skew-x-[-6deg]"
        >
          <Home className="w-4 h-4 not-italic" /> Torna alla Home
        </button>

        <button
          onClick={() => navigate('/squadre')}
          className="bg-zinc-900 hover:bg-zinc-800 text-white font-sport font-bold uppercase text-xs tracking-wider px-5 py-3.5 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer skew-x-[-6deg]"
        >
          <Users className="w-4 h-4 text-brand-yellow not-italic" /> Guarda le Squadre
        </button>

        <button
          onClick={() => navigate('/news')}
          className="bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-800 font-sport font-bold uppercase text-xs tracking-wider px-5 py-3.5 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer skew-x-[-6deg]"
        >
          <Newspaper className="w-4 h-4 text-amber-600 not-italic" /> Ultime News
        </button>
      </div>
    </div>
  );
}
