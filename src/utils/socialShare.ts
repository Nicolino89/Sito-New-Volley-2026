/**
 * Utility di Condivisione Social per New Volley Academy
 * WhatsApp, Instagram, Facebook, Telegram & Web Share API
 */

import { slugify } from '../pages/News';

export interface ShareArticleData {
  id?: string;
  titolo: string;
  testo: string;
  foto_copertina_url?: string;
  tag_categoria?: string;
  autore?: string;
}

export function getArticlePublicUrl(article: ShareArticleData): string {
  const slug = slugify(article.titolo || 'articolo');
  return `https://newvolleyacademy.it/news/${slug}`;
}

export function formatWhatsAppMessage(article: ShareArticleData): string {
  const url = getArticlePublicUrl(article);
  const cleanSnippet = article.testo
    ? article.testo.replace(/\n+/g, ' ').slice(0, 140) + '...'
    : '';

  return (
    `🏐 *NEW VOLLEY ACADEMY*\n` +
    `📰 *${article.titolo.toUpperCase()}*\n\n` +
    `${cleanSnippet}\n\n` +
    `👉 *Leggi l'articolo completo sul sito:*\n${url}\n\n` +
    `#NewVolleyAcademy #PantereDellaBassa 💛🖤`
  );
}

export function formatInstagramCaption(article: ShareArticleData): string {
  const url = getArticlePublicUrl(article);
  return (
    `🏐 NEW VOLLEY ACADEMY | NEWS 💛🖤\n\n` +
    `📰 ${article.titolo.toUpperCase()}\n\n` +
    `${article.testo.slice(0, 280)}...\n\n` +
    `🔗 Leggi l'articolo completo e guarda tutte le foto al link in bio oppure su:\n${url}\n\n` +
    `#NewVolleyAcademy #NVA #VolleyForli #Pallavolo #PantereDellaBassa #SerieD #FIPAV #PallavoloFemminile #PallavoloMaschile`
  );
}

export function shareOnWhatsApp(article: ShareArticleData): void {
  const text = formatWhatsAppMessage(article);
  const encoded = encodeURIComponent(text);
  window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank', 'noopener,noreferrer');
}

export function shareOnFacebook(article: ShareArticleData): void {
  const url = encodeURIComponent(getArticlePublicUrl(article));
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noopener,noreferrer');
}

export async function shareOnInstagram(
  article: ShareArticleData,
  onCopied?: () => void
): Promise<{ nativeShared: boolean }> {
  const caption = formatInstagramCaption(article);
  const url = getArticlePublicUrl(article);

  // Copy pre-formatted caption to clipboard
  try {
    await navigator.clipboard.writeText(caption);
    onCopied?.();
  } catch (e) {}

  // Native share sheet if supported (Mobile devices allows direct Instagram Post/Stories sharing)
  if (navigator.share) {
    try {
      await navigator.share({
        title: article.titolo,
        text: caption,
        url: url
      });
      return { nativeShared: true };
    } catch (err) {
      // User dismissed native share sheet
    }
  }

  // Fallback: open Instagram Web
  window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
  return { nativeShared: false };
}
