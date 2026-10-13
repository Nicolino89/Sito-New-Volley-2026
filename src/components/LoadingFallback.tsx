import React from 'react';

export default function LoadingFallback() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-3 border-zinc-800 border-t-brand-yellow animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-brand-yellow rounded-full animate-pulse" />
        </div>
      </div>
      <p className="text-xs font-sport italic uppercase tracking-wider text-zinc-400 font-bold">
        Caricamento in corso...
      </p>
    </div>
  );
}
