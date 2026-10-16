import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const DOMAIN = 'https://newvolleyacademy.it';
const TODAY = new Date().toISOString().split('T')[0];

export const slugify = (text) =>
  (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

// Static Core Pages
const staticPages = [
  { url: '/', changefreq: 'daily', priority: '1.0' },
  { url: '/squadre', changefreq: 'daily', priority: '0.9' },
  { url: '/squadre/archivio', changefreq: 'weekly', priority: '0.7' },
  { url: '/albo-d-oro', changefreq: 'weekly', priority: '0.8' },
  { url: '/news', changefreq: 'daily', priority: '0.9' },
  { url: '/camp-tornei', changefreq: 'weekly', priority: '0.8' },
  { url: '/voltex', changefreq: 'weekly', priority: '0.8' },
  { url: '/societa', changefreq: 'weekly', priority: '0.8' },
  { url: '/galleria', changefreq: 'weekly', priority: '0.7' },
  { url: '/sponsor', changefreq: 'monthly', priority: '0.6' },
  { url: '/privacy', changefreq: 'monthly', priority: '0.4' },
];

// Active Squads in Firestore
const squadre = [
  { id: 'NkiSNbEvfy46t0Jlyi7e', name: 'Serie D Femminile' },
  { id: 'dlv4ouBPKXlY3k51DoBK', name: 'Serie D Maschile' },
  { id: 'aRhXBZMo3fggOzmZTLHM', name: 'Prima Divisione Femminile' },
  { id: 'CXHXPQYMERE7DjB1knVN', name: 'Seconda Divisione Femminile' },
  { id: '93O2ODdeeelPiAsQZnuV', name: 'Seconda Divisione Maschile' },
  { id: 'O6O6JfNbkWcAiqtMsm4P', name: 'Terza Divisione Gialla Femminile' },
  { id: 'EbYJLsts7Q50YDZMnlh5', name: 'Terza Divisione Nera Femminile' },
  { id: 'VeRN6beuzXECUDPWuAos', name: 'Under 13/14 Gialla' },
  { id: '3X8rOFZdOo9R5iqzt9FY', name: 'Under 13/14 Nera' },
  { id: 'b8Cy0wgnvA5AsFiNdhJm', name: 'Minivolley S3' },
  { id: 'tQbD500ih8NKmiNVpjtw', name: 'Open CSI' },
];

// Published News in Firestore
const newsArticles = [
  {
    id: 'p8gMT6DFrnoOOeFxWRfo',
    titolo: '🖤 Diventa una Pantera da tribuna',
    date: '2026-10-15',
    slug: 'diventa-una-pantera-da-tribuna'
  },
  {
    id: 'HwQPDbVSqZN9FjuceFKQ',
    titolo: 'Domani si gioca a Cesena! Le ragazze scendono in campo alle 20:30',
    date: '2026-10-15',
    slug: 'domani-si-gioca-a-cesena-le-ragazze-scendono-in-campo-alle-20-30'
  },
  {
    id: '6yebL85fIfa4XGyP42V1',
    titolo: '🔥 Si riparte! Stasera alle 21:15 la Serie D maschile torna in campo',
    date: '2026-10-15',
    slug: 'si-riparte-stasera-alle-21-15-la-serie-d-maschile-torna-in-campo'
  }
];

export function generateSitemapXml() {
  const urls = [];

  // 1. Static Pages
  for (const page of staticPages) {
    urls.push(`  <url>
    <loc>${DOMAIN}${page.url}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
  }

  // 2. Squad Detail Pages
  for (const sq of squadre) {
    urls.push(`  <url>
    <loc>${DOMAIN}/squadre/${sq.id}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  // 3. News Articles (Both slug and ID for indexing resilience)
  for (const art of newsArticles) {
    const slug = art.slug || slugify(art.titolo);
    urls.push(`  <url>
    <loc>${DOMAIN}/news/${slug}</loc>
    <lastmod>${art.date || TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
}

// Write to public/sitemap.xml
const xml = generateSitemapXml();
const publicSitemapPath = path.join(rootDir, 'public', 'sitemap.xml');
fs.writeFileSync(publicSitemapPath, xml, 'utf-8');
console.log(`Generated sitemap at ${publicSitemapPath} (${staticPages.length + squadre.length + newsArticles.length} URLs)`);

// If dist exists, write to dist/sitemap.xml as well
const distDir = path.join(rootDir, 'dist');
if (fs.existsSync(distDir)) {
  const distSitemapPath = path.join(distDir, 'sitemap.xml');
  fs.writeFileSync(distSitemapPath, xml, 'utf-8');
  console.log(`Updated sitemap at ${distSitemapPath}`);
}
