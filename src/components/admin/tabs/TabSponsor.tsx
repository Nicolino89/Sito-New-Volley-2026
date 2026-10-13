import React from 'react';
import GestioneSponsor from '../../GestioneSponsor';

export default function TabSponsor() {
  return (
    <div className="space-y-6 animate-fade-in" id="admin-tab-sponsor">
      <div className="bg-white border border-slate-200 p-5 rounded-2xl flex justify-between items-center">
        <div className="space-y-0.5">
          <h2 className="text-xl font-black italic tracking-tight text-slate-950 uppercase font-sport skew-x-[-6deg]">
            GESTIONE SPONSOR & PARTNER
          </h2>
          <p className="text-[11px] text-slate-500">
            Amministra i partner commerciali del club, i livelli di visibilità (Main, Gold, Silver) e l'abbinamento con le squadre.
          </p>
        </div>
      </div>
      <GestioneSponsor />
    </div>
  );
}
