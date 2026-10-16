/**
 * Dynamic SEO and Open Graph helper for single-page applications.
 * Sets page title, description, and social sharing tags dynamically.
 * Also logs page_view events to Firebase Analytics / Google Analytics 4.
 */

import { analytics } from '../firebase-societa';
import { logEvent } from 'firebase/analytics';

export interface MetaTagOptions {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}

export function updatePageMeta({
  title,
  description,
  image,
  url,
  type = 'website'
}: MetaTagOptions): void {
  // 1. Update Document Title
  const formattedTitle = title.includes('New Volley Academy') ? title : `${title} | New Volley Academy Forlì`;
  document.title = formattedTitle;

  // Helper to set or create meta tag
  const setMeta = (attribute: string, attrValue: string, content: string) => {
    let element = document.querySelector(`meta[${attribute}="${attrValue}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attribute, attrValue);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  // 2. Standard Description
  if (description) {
    setMeta('name', 'description', description);
  }

  // 3. Canonical Link Tag & Normalized Public URL
  const rawUrl = url || window.location.href;
  const canonicalUrl = rawUrl.replace(/https:\/\/[^/]*\.web\.app/gi, 'https://newvolleyacademy.it').split('?')[0].split('#')[0];
  let canonicalEl = document.querySelector('link[rel="canonical"]');
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', canonicalUrl);

  // 4. Open Graph Tags
  setMeta('property', 'og:title', formattedTitle);
  setMeta('property', 'og:type', type);
  if (description) setMeta('property', 'og:description', description);
  if (image) setMeta('property', 'og:image', image);
  setMeta('property', 'og:url', canonicalUrl);

  // 4. Twitter Card Tags
  setMeta('name', 'twitter:title', formattedTitle);
  if (description) setMeta('name', 'twitter:description', description);
  if (image) setMeta('name', 'twitter:image', image);

  // 5. Firebase / Google Analytics 4 Event Tracking
  if (analytics) {
    try {
      logEvent(analytics, 'page_view', {
        page_title: formattedTitle,
        page_location: window.location.href,
        page_path: window.location.pathname
      });
    } catch (e) {
      // Non-blocking analytics error
    }
  }
}
