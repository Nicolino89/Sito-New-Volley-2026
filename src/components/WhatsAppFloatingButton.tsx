import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

interface WhatsAppFloatingButtonProps {
  phoneNumber?: string;
  defaultMessage?: string;
}

export default function WhatsAppFloatingButton({
  phoneNumber = '+393513210332',
  defaultMessage = 'Ciao! Vorrei avere maggiori informazioni sulla New Volley Academy 🏐'
}: WhatsAppFloatingButtonProps) {
  const [showTooltip, setShowTooltip] = useState(true);

  // Clean phone number to international format without spaces or symbols
  // Ensures old landline (0543) is never used for WhatsApp
  const rawNumber = phoneNumber && !phoneNumber.includes('0543') ? phoneNumber : '3513210332';
  const cleanPhone = rawNumber.replace(/[^0-9]/g, '');
  const finalPhone = cleanPhone.startsWith('39') ? cleanPhone : `39${cleanPhone}`;
  const whatsappUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <div 
      className="fixed right-4 sm:right-6 z-50 flex flex-col items-end gap-2 group select-none"
      style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
    >
      {/* Interactive Tooltip Bubble */}
      {showTooltip && (
        <div className="hidden sm:flex items-center gap-2 bg-slate-950/95 text-white border border-emerald-500/30 px-3.5 py-2 rounded-2xl shadow-xl backdrop-blur-md animate-fade-in text-xs font-medium max-w-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span className="text-slate-200">
            Hai domande? <strong className="text-emerald-400">Scrivici su WhatsApp!</strong>
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
            }}
            className="text-slate-400 hover:text-white ml-1 p-0.5 rounded-full hover:bg-slate-800 transition-colors"
            title="Chiudi avviso"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Main Floating Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contattaci direttamente su WhatsApp"
        className="flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white px-4 py-3.5 sm:py-3 rounded-full shadow-[0_8px_25px_rgba(37,211,102,0.4)] hover:shadow-[0_10px_30px_rgba(37,211,102,0.6)] transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer"
      >
        <MessageCircle className="w-6 h-6 fill-current text-white shrink-0 animate-bounce sm:animate-none" />
        <span className="font-bold text-xs uppercase font-sport tracking-wider hidden sm:inline-block">
          Scrivici su WhatsApp
        </span>
      </a>
    </div>
  );
}
