import React, { useState } from 'react';
import { 
  Share2, 
  CheckCircle, 
  Copy, 
  ExternalLink,
  MessageCircle,
  Instagram,
  Facebook
} from 'lucide-react';
import { 
  ShareArticleData, 
  shareOnWhatsApp, 
  shareOnInstagram, 
  shareOnFacebook, 
  getArticlePublicUrl,
  formatInstagramCaption
} from '../utils/socialShare';

interface SocialShareBarProps {
  article: ShareArticleData;
  layout?: 'compact' | 'full' | 'buttons-only';
  showLabel?: boolean;
}

export default function SocialShareBar({
  article,
  layout = 'full',
  showLabel = true
}: SocialShareBarProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [showIgModal, setShowIgModal] = useState(false);

  const handleCopyLink = async () => {
    const url = getArticlePublicUrl(article);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (e) {}
  };

  const handleInstagramClick = async () => {
    await shareOnInstagram(article, () => {
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 4000);
    });
    setShowIgModal(true);
  };

  if (layout === 'compact') {
    return (
      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
        {/* WhatsApp Button */}
        <button
          onClick={() => shareOnWhatsApp(article)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-xl transition-all shadow-sm cursor-pointer hover:scale-105"
          title="Condividi su WhatsApp con testo formattato"
        >
          <MessageCircle className="w-3.5 h-3.5 fill-current" />
        </button>

        {/* Instagram Button */}
        <button
          onClick={handleInstagramClick}
          className="bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 hover:opacity-90 text-white p-2 rounded-xl transition-all shadow-sm cursor-pointer hover:scale-105"
          title="Condividi su Instagram (Didascalia pronta)"
        >
          <Instagram className="w-3.5 h-3.5" />
        </button>

        {/* Copy Link Button */}
        <button
          onClick={handleCopyLink}
          className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 p-2 rounded-xl transition-all cursor-pointer"
          title="Copia link articolo"
        >
          {copiedLink ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3" onClick={e => e.stopPropagation()}>
      {showLabel && (
        <div className="flex items-center gap-1.5 text-xs font-sport uppercase tracking-wider font-bold text-slate-600">
          <Share2 className="w-3.5 h-3.5 text-amber-500" />
          <span>Condividi questa notizia:</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {/* WHATSAPP BUTTON */}
        <button
          onClick={() => shareOnWhatsApp(article)}
          className="bg-[#25D366] hover:bg-[#20ba59] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer hover:scale-102"
        >
          <MessageCircle className="w-4 h-4 fill-current" />
          <span>Condividi su WhatsApp</span>
        </button>

        {/* INSTAGRAM BUTTON */}
        <button
          onClick={handleInstagramClick}
          className="bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-95 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer hover:scale-102"
        >
          <Instagram className="w-4 h-4" />
          <span>Condividi su Instagram</span>
        </button>

        {/* FACEBOOK BUTTON */}
        <button
          onClick={() => shareOnFacebook(article)}
          className="bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer hover:scale-102"
        >
          <Facebook className="w-4 h-4 fill-current" />
          <span>Facebook</span>
        </button>

        {/* COPY LINK BUTTON */}
        <button
          onClick={handleCopyLink}
          className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200"
        >
          {copiedLink ? (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">Link Copiato!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-600" />
              <span>Copia Link</span>
            </>
          )}
        </button>
      </div>

      {/* INSTAGRAM MODAL / TIPS POPUP */}
      {showIgModal && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-amber-500/40 space-y-2.5 animate-fade-in text-xs">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold font-sport uppercase tracking-wider text-amber-400">
              <Instagram className="w-4 h-4" />
              <span>Didascalia Instagram Copiata negli Appunti!</span>
            </div>
            <button 
              onClick={() => setShowIgModal(false)}
              className="text-slate-400 hover:text-white text-xs px-2 py-0.5"
            >
              ✕
            </button>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            La didascalia completa con testo, link e hashtag societari (<b>#NewVolleyAcademy #LePantere</b>) è stata copiata!
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <span>Apri Instagram & Incolla</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            {article.foto_copertina_url && (
              <a
                href={article.foto_copertina_url}
                target="_blank"
                rel="noopener noreferrer"
                download="news_copertina.jpg"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1 cursor-pointer border border-slate-700"
              >
                <span>Scarica Foto Copertina</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
