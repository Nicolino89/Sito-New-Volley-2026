import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';

interface FooterProps {
  societaInfo: any;
  societaSettings: {
    footerDescription?: string;
    footerDescriptionDraft?: string;
    footerCopyright?: string;
    footerCopyrightDraft?: string;
    footerCredits?: string;
    footerCreditsDraft?: string;
  };
  isAdminMode: boolean;
  onSettingsTextChange: (field: string, val: string) => void;
  onToggleAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  societaInfo,
  societaSettings,
  isAdminMode,
  onSettingsTextChange,
  onToggleAdmin
}) => {
  const defaultDesc = "Società sportiva dilettantistica di pallavolo a Forlì. Promuoviamo i valori dello sport e la crescita dei giovani atleti, dal minivolley e settore giovanile fino ai campionati regionali di Serie D.";

  const activeDesc = isAdminMode
    ? (societaSettings?.footerDescriptionDraft || societaSettings?.footerDescription || defaultDesc)
    : (societaSettings?.footerDescription || defaultDesc);

  const pIvaText = societaInfo?.partita_iva && societaInfo.partita_iva !== '01234567890' ? ` P.IVA ${societaInfo.partita_iva}.` : '';
  const defaultCopyright = `© ${new Date().getFullYear()} New Volley Academy S.S.D. a R.L. Tutti i diritti riservati.${pIvaText}`;
  const activeCopyright = isAdminMode
    ? (societaSettings.footerCopyrightDraft || societaSettings.footerCopyright || defaultCopyright)
    : (societaSettings.footerCopyright || defaultCopyright);

  const activeCredits = isAdminMode
    ? (societaSettings.footerCreditsDraft || societaSettings.footerCredits || "Sviluppato con React, Vite & Tailwind CSS.")
    : (societaSettings.footerCredits || "Sviluppato con React, Vite & Tailwind CSS.");

  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 py-12 mt-16" id="site-footer">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Col 1 */}
        <div className="space-y-4">
          <h4 className="text-white font-barlow font-semibold uppercase tracking-wider flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#fcfe00' }} /> NEW VOLLEY ACADEMY
          </h4>
          <p 
            contentEditable={isAdminMode}
            suppressContentEditableWarning={true}
            onBlur={(e) => {
              onSettingsTextChange('footerDescriptionDraft', e.currentTarget.innerText.trim());
            }}
            className={`text-xs font-inter text-slate-400 leading-relaxed max-w-sm focus:outline-none focus:bg-slate-900 ${
              isAdminMode ? 'border border-dashed border-amber-400/60 p-1 rounded cursor-text' : ''
            }`}
          >
            {activeDesc}
          </p>
        </div>

        {/* Col 2 */}
        <div className="space-y-4 text-xs">
          <h4 className="text-white font-semibold uppercase tracking-wider text-[11px] font-barlow">Copyright & Privacy</h4>
          <div className="space-y-2 font-inter leading-relaxed">
            <div 
              contentEditable={isAdminMode}
              suppressContentEditableWarning={true}
              onBlur={(e) => {
                onSettingsTextChange('footerCopyrightDraft', e.currentTarget.innerText.trim());
              }}
              className={`focus:outline-none focus:bg-slate-900 ${
                isAdminMode ? 'border border-dashed border-amber-400/60 p-1 rounded cursor-text block' : ''
              }`}
            >
              {activeCopyright}
            </div>
            <div 
              contentEditable={isAdminMode}
              suppressContentEditableWarning={true}
              onBlur={(e) => {
                onSettingsTextChange('footerCreditsDraft', e.currentTarget.innerText.trim());
              }}
              className={`focus:outline-none focus:bg-slate-900 ${
                isAdminMode ? 'border border-dashed border-amber-400/60 p-1 rounded cursor-text block mt-1' : ''
              }`}
            >
              {activeCredits}
            </div>
            <div className="pt-2 border-t border-slate-900/60 mt-1 flex flex-wrap gap-4 items-center">
              <Link
                to="/privacy"
                className="hover:text-[#F5D800] text-zinc-500 hover:underline transition-colors duration-150 underline-offset-4 text-xs font-semibold uppercase tracking-wider"
              >
                Privacy & Cookie Policy
              </Link>
              <span className="text-zinc-700 select-none text-[10px]">•</span>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event('nva_open_cookie_preferences'))}
                className="hover:text-[#F5D800] text-zinc-500 hover:underline transition-colors duration-150 underline-offset-4 text-xs font-semibold uppercase tracking-wider cursor-pointer bg-transparent p-0 border-none inline-flex items-center gap-1"
                title="Personalizza o revoca il consenso ai cookie"
              >
                Preferenze Cookie
              </button>
              <span className="text-zinc-700 select-none text-[10px]">•</span>
              <Link
                to="/sponsor"
                className="hover:text-[#F5D800] text-zinc-500 hover:underline transition-colors duration-150 underline-offset-4 text-xs font-semibold uppercase tracking-wider"
              >
                Partner & Sponsor
              </Link>
              <span className="text-zinc-700 select-none text-[10px]">•</span>
              <Link
                to="/albo-d-oro"
                className="hover:text-[#F5D800] text-zinc-500 hover:underline transition-colors duration-150 underline-offset-4 text-xs font-semibold uppercase tracking-wider"
              >
                Albo d'Oro
              </Link>
              {onToggleAdmin && (
                <>
                  <span className="text-zinc-700 select-none text-[10px]">•</span>
                  <button
                    onClick={onToggleAdmin}
                    className="flex items-center gap-1 text-zinc-600 hover:text-[#FFE600] transition-colors duration-150 text-[11px] font-mono uppercase tracking-wider cursor-pointer"
                    title={isAdminMode ? "Esci dall'Area Riservata Staff" : "Accesso Riservato Staff & Allenatori"}
                  >
                    <Lock className="w-2.5 h-2.5 opacity-70" />
                    <span>{isAdminMode ? 'Esci CMS' : 'Staff Admin'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};
