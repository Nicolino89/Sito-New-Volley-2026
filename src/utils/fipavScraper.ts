/**
 * FIPAV Regional & Provincial Portal Scraper
 * Dedicated parser for crer.portalefipav.net, portalefipav.net, fipavromagna.it, and fipav-er.it
 */

import { ProssimaGara, RigaClassifica, PartitaCampionato } from '../firebase-societa';

/**
 * Clean up strings
 */
function cleanString(str: string): string {
  return str
    .replace(/\s+/g, ' ')
    .replace(/[\n\r\t]/g, ' ')
    .trim();
}

/**
 * Helper to check if a team string refers to New Volley Academy / the configured club team
 */
export function isNvaTeam(name: string, customOfficialName?: string): boolean {
  if (!name) return false;
  const n = name.toLowerCase().trim();

  // If a specific official name was selected / set by the admin, match against it
  if (customOfficialName && customOfficialName.trim()) {
    const cust = customOfficialName.toLowerCase().trim();
    if (n === cust || n.includes(cust) || cust.includes(n)) {
      return true;
    }
  }

  // Strict NVA identifiers (prevents matching other clubs containing "Academy" or "Volley")
  return (
    n.includes('new volley') ||
    n.includes('new-volley') ||
    n === 'nva' ||
    n.startsWith('nva ') ||
    n.endsWith(' nva') ||
    n.includes(' nva ') ||
    (n.includes('salfep') && n.includes('forli'))
  );
}

/**
 * Normalizza il luogo della partita per la visualizzazione a video,
 * assicurandosi che testi con arbitri o stato gara non appaiano mai come palestra.
 */
export function sanitizeLuogoDisplay(luogo?: string | null, isCasa: boolean = true): string {
  if (!luogo) return isCasa ? "Pal. Comunale Fabio Lombini, Castrocaro Terme" : "Palasport";
  
  const lower = luogo.toLowerCase().trim();
  if (
    lower.includes('arbitro designato') || 
    lower.includes('designazioni') || 
    lower.startsWith('da disputare') || 
    lower.startsWith('disputata')
  ) {
    return isCasa 
      ? "Pal. Comunale Fabio Lombini, Castrocaro Terme" 
      : "Palasport";
  }

  return luogo;
}

/**
 * Estrae e pulisce il luogo di gara dall'HTML/tooltip della cella FIPAV (es. icona info_16.png).
 * Rimuove le designazioni arbitrali, lo stato gara ed evita che le parole si incollino sui <br>.
 */
function extractVenueFromTooltip(cell?: Element | null, isHome: boolean = true): string {
  const defaultVenue = isHome ? 'Pal. Comunale Fabio Lombini, Castrocaro Terme' : 'Palasport';
  if (!cell) return defaultVenue;

  // 1. Cerca l'icona info specifica per le palestre
  let infoImg = cell.querySelector('img[src*="info_16"], img[src*="info"], img[alt*="info" i]');

  // 2. Se non trovata per src, cerca tra le immagini escludendo lo stato della gara o arbitri
  if (!infoImg) {
    const allImgs = Array.from(cell.querySelectorAll('img[title]'));
    infoImg = allImgs.find(img => {
      const src = (img.getAttribute('src') || '').toLowerCase();
      const title = (img.getAttribute('title') || '').toLowerCase();
      if (src.includes('statogara') || img.closest('[id*="StatoGara"]')) return false;
      if (title.startsWith('da disputare') || title.startsWith('disputata') || title.includes('arbitro designato')) return false;
      return true;
    }) || null;
  }

  if (!infoImg) return defaultVenue;

  const rawTitle = infoImg.getAttribute('title') || '';
  if (!rawTitle.trim()) return defaultVenue;

  const tmp = document.createElement('div');
  tmp.innerHTML = rawTitle;

  // Rimuovi designazioni arbitrali se presenti all'interno del tooltip
  tmp.querySelectorAll('.designazione').forEach(el => el.remove());
  Array.from(tmp.querySelectorAll('p, div')).forEach(p => {
    if (p.textContent?.toLowerCase().includes('designazion')) {
      p.remove();
    }
  });

  // Converti <br> e <p> in virgole/separatori
  tmp.querySelectorAll('br').forEach(br => br.replaceWith(document.createTextNode(', ')));
  tmp.querySelectorAll('p').forEach(p => p.appendChild(document.createTextNode(', ')));

  let cleanLoc = cleanString(tmp.textContent || '');
  cleanLoc = cleanLoc
    .replace(/\s*,\s*/g, ', ')
    .replace(/(,\s*)+/g, ', ')
    .replace(/^,\s*/, '')
    .replace(/,\s*$/, '')
    .trim();

  // Correzione stilistica "pAL." -> "Pal."
  cleanLoc = cleanLoc.replace(/^pal\.\s*/i, 'Pal. ');

  if (
    cleanLoc.length > 3 && 
    !cleanLoc.toLowerCase().includes('arbitro designato') && 
    !cleanLoc.toLowerCase().startsWith('da disputare')
  ) {
    return cleanLoc;
  }

  return defaultVenue;
}

/**
 * Parse HTML content (from either portalefipav.net or fipavromagna.it / general FIPAV)
 */
export function parseFipavHtml(
  html: string, 
  myTeamName: string = "New Volley Academy",
  customOfficialName?: string
): {
  classifica: RigaClassifica[];
  partite: PartitaCampionato[];
  prossimaGara: ProssimaGara | null;
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const classifica: RigaClassifica[] = [];
  const partite: PartitaCampionato[] = [];

  // ==========================================
  // 1. PARSE STANDINGS (CLASSIFICA)
  // ==========================================
  // Strategy A: Dedicated portalefipav.net (.tbl-classifica)
  const tblClassifica = doc.querySelector('table.tbl-classifica, table[class*="tbl-classifica"]');
  if (tblClassifica) {
    const rows = Array.from(tblClassifica.querySelectorAll('tbody tr, tr')).filter(r => !r.closest('thead') && r.querySelectorAll('td').length >= 6);
    for (const r of rows) {
      const cells = Array.from(r.querySelectorAll('td')).map(td => cleanString(td.textContent || ''));
      if (cells.length >= 6) {
        const pos = parseInt(cells[0].replace(/[^\d]/g, ''), 10);
        const teamName = cells[1];
        const punti = parseInt(cells[2].replace(/[^\d]/g, ''), 10) || 0;
        const giocate = parseInt(cells[3].replace(/[^\d]/g, ''), 10) || 0;
        const vinte = parseInt(cells[4].replace(/[^\d]/g, ''), 10) || 0;
        const perse = parseInt(cells[5].replace(/[^\d]/g, ''), 10) || 0;
        const setVinti = cells[6] ? parseInt(cells[6].replace(/[^\d]/g, ''), 10) || 0 : 0;
        const setPersi = cells[7] ? parseInt(cells[7].replace(/[^\d]/g, ''), 10) || 0 : 0;

        if (pos > 0 && teamName && teamName.length >= 2) {
          const isMyTeam = customOfficialName && customOfficialName.trim()
            ? (cleanString(teamName).toLowerCase() === customOfficialName.toLowerCase().trim() || isNvaTeam(teamName, customOfficialName))
            : isNvaTeam(teamName, myTeamName);

          classifica.push({
            pos,
            squadra: teamName,
            punti,
            giocate,
            vinte,
            perse,
            setVinti,
            setPersi,
            isMyTeam
          });
        }
      }
    }
  }

  // Strategy B: General FIPAV table parsing (fallback if Strategy A found nothing)
  if (classifica.length === 0) {
    const allRows = Array.from(doc.querySelectorAll('tr, .row, .standing-row, .classifica-row'));
    for (const row of allRows) {
      const cells = Array.from(row.querySelectorAll('td, th, .col, span, div'))
        .map(c => cleanString(c.textContent || ''))
        .filter(Boolean);

      if (cells.length < 3) continue;

      const firstNum = parseInt(cells[0].replace(/[^\d]/g, ''), 10);
      if (!isNaN(firstNum) && firstNum > 0 && firstNum < 30) {
        const teamName = cells[1];
        const points = parseInt(cells[2].replace(/[^\d]/g, ''), 10);

        if (teamName && teamName.length >= 2 && !isNaN(points)) {
          if (teamName.toLowerCase().includes('squadra') || teamName.toLowerCase().includes('team')) continue;

          const giocate = cells[3] ? parseInt(cells[3].replace(/[^\d]/g, ''), 10) || 0 : 0;
          const vinte = cells[4] ? parseInt(cells[4].replace(/[^\d]/g, ''), 10) || 0 : 0;
          const perse = cells[5] ? parseInt(cells[5].replace(/[^\d]/g, ''), 10) || 0 : 0;
          const setVinti = cells[6] ? parseInt(cells[6].replace(/[^\d]/g, ''), 10) || 0 : 0;
          const setPersi = cells[7] ? parseInt(cells[7].replace(/[^\d]/g, ''), 10) || 0 : 0;

          const isMyTeam = customOfficialName && customOfficialName.trim()
            ? (cleanString(teamName).toLowerCase() === customOfficialName.toLowerCase().trim() || isNvaTeam(teamName, customOfficialName))
            : isNvaTeam(teamName, myTeamName);

          classifica.push({
            pos: firstNum,
            squadra: teamName,
            punti: points,
            giocate,
            vinte,
            perse,
            setVinti,
            setPersi,
            isMyTeam
          });
        }
      }
    }
  }

  // ==========================================
  // 2. PARSE MATCHES (CALENDARIO & RISULTATI)
  // ==========================================
  // Strategy A: Dedicated portalefipav.net (.tbl-risultati)
  const tblRisultati = doc.querySelector('table.tbl-risultati, table[class*="tbl-risultati"]');
  if (tblRisultati) {
    const rows = Array.from(tblRisultati.querySelectorAll('tbody tr, tr')).filter(r => !r.closest('thead') && r.querySelectorAll('td').length >= 6);
    let matchIdx = 1;

    for (const r of rows) {
      const cells = Array.from(r.querySelectorAll('td'));
      if (cells.length >= 6) {
        const garaNum = cleanString(cells[0].textContent || '');
        const giornataNum = cleanString(cells[1].textContent || `${matchIdx}`);
        const dataOra = cleanString(cells[2].textContent || '');
        const homeTeam = cleanString(cells[3].textContent || '');
        const awayTeam = cleanString(cells[4].textContent || '');
        const risul = cleanString(cells[5].textContent || '');
        const parziali = cleanString(cells[6]?.textContent || '').replace(/\u00a0/g, ' ');

        const dateParts = dataOra.split(' ');
        const data = dateParts[0] || new Date().toLocaleDateString('it-IT');
        const ora = dateParts[1] || '20:30';

        const isHome = isNvaTeam(homeTeam, customOfficialName || myTeamName);
        const isAway = isNvaTeam(awayTeam, customOfficialName || myTeamName);

        if (isHome || isAway) {
          const opponent = isHome ? awayTeam : homeTeam;
          let setNva: number | null = null;
          let setAvversario: number | null = null;
          let terminata = false;

          const scoreMatch = risul.match(/([0-3])\s*[-–]\s*([0-3])/);
          if (scoreMatch) {
            terminata = true;
            const s1 = parseInt(scoreMatch[1], 10);
            const s2 = parseInt(scoreMatch[2], 10);
            setNva = isHome ? s1 : s2;
            setAvversario = isHome ? s2 : s1;
          }

          // Extract location info from tooltip / HTML (specifically targeting info_16 icon and stripping referee/statogara)
          const luogo = extractVenueFromTooltip(cells[7], isHome);

          partite.push({
            id: `p_fipav_${garaNum || matchIdx}_${Date.now()}`,
            giornata: `${giornataNum}ª Giornata`,
            data,
            ora,
            avversario: opponent || 'Avversario',
            casa: isHome,
            luogo,
            risultato: terminata ? `${setNva} - ${setAvversario}` : '',
            setNva,
            setAvversario,
            parzialiSet: parziali.trim() || '',
            terminata
          });
          matchIdx++;
        }
      }
    }
  }

  // Strategy B: General FIPAV match parsing (fallback)
  if (partite.length === 0) {
    const allMatchRows = Array.from(doc.querySelectorAll('tr, .match-row, .gara-row, .row'));
    let currentGiornata = "1ª Giornata";
    let matchIdx = 1;

    for (const row of allMatchRows) {
      const textContent = cleanString(row.textContent || '');
      if (textContent.toLowerCase().includes('giornata') || textContent.toLowerCase().startsWith('g.')) {
        const match = textContent.match(/(?:giornata|g\.)\s*(\d+)/i);
        if (match) currentGiornata = `${match[1]}ª Giornata`;
      }

      const cells = Array.from(row.querySelectorAll('td, span, div')).map(td => cleanString(td.textContent || ''));
      if (cells.length < 2) continue;

      const rowText = cells.join(' ');
      const isNvaInRow = isNvaTeam(rowText, customOfficialName || myTeamName);

      if (isNvaInRow) {
        let dateText = new Date().toLocaleDateString('it-IT');
        let timeText = '20:30';
        let opponent = 'Avversario';
        let isHome = true;
        let score = '';
        let setNva: number | null = null;
        let setAvversario: number | null = null;
        let parzialiSet = '';
        let terminata = false;
        let luogo = 'PalaMaroncelli, Forlì';

        const dateMatch = rowText.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/);
        if (dateMatch) dateText = dateMatch[1].replace(/[\-\.]/g, '/');

        const timeMatch = rowText.match(/(\d{1,2}:\d{2})/);
        if (timeMatch) timeText = timeMatch[1];

        const scoreMatch = rowText.match(/([0-3])\s*(?:-|–|vs)\s*([0-3])/i);
        if (scoreMatch) {
          const s1 = parseInt(scoreMatch[1], 10);
          const s2 = parseInt(scoreMatch[2], 10);
          score = `${s1} - ${s2}`;
          terminata = true;
          setNva = isHome ? s1 : s2;
          setAvversario = isHome ? s2 : s1;
        }

        const setMatch = rowText.match(/(\d{2}\s*[-–]\s*\d{2}(?:[\s,]+\d{2}\s*[-–]\d{2})*)/);
        if (setMatch) parzialiSet = setMatch[1];

        const vsMatch = rowText.match(/([a-zA-Z0-9\s'\.\-]+?)\s+(?:vs|-|–)\s+([a-zA-Z0-9\s'\.\-]+)/i);
        if (vsMatch) {
          const t1 = cleanString(vsMatch[1]);
          const t2 = cleanString(vsMatch[2]);
          if (isNvaTeam(t1, customOfficialName || myTeamName)) {
            isHome = true;
            opponent = t2.replace(/[\d\/\:]/g, '').trim() || 'Avversario';
          } else {
            isHome = false;
            opponent = t1.replace(/[\d\/\:]/g, '').trim() || 'Avversario';
          }
        }

        partite.push({
          id: `p_scraped_${matchIdx++}_${Date.now()}`,
          giornata: currentGiornata,
          data: dateText,
          ora: timeText,
          avversario: opponent,
          casa: isHome,
          luogo,
          risultato: score,
          setNva,
          setAvversario,
          parzialiSet: parzialiSet.trim() || '',
          terminata
        });
      }
    }
  }

  // Calculate next match
  let prossimaGara: ProssimaGara | null = null;
  const unplayed = partite.find(p => !p.terminata);
  if (unplayed) {
    prossimaGara = {
      id: myTeamName.toLowerCase().includes('masch') ? 'serie_d_maschile' : 'serie_d_femminile',
      categoria: myTeamName.toLowerCase().includes('masch') ? 'Serie D Maschile' : 'Serie D Femminile',
      avversario: unplayed.avversario,
      data_ora: `${unplayed.data} ${unplayed.ora}`,
      luogo: sanitizeLuogoDisplay(unplayed.luogo, unplayed.casa),
      giornata: unplayed.giornata,
      casa: unplayed.casa,
      punti_nva: null,
      punti_avversario: null
    };
  }

  // Sort standings
  const sortedClassifica = Array.from(new Map(classifica.map(item => [item.pos, item])).values()).sort((a, b) => a.pos - b.pos);

  return {
    classifica: sortedClassifica,
    partite,
    prossimaGara
  };
}

/**
 * Multi-proxy robust HTML fetcher
 */
async function fetchHtmlFromUrl(url: string): Promise<string> {
  if (!url || !url.startsWith('http')) {
    throw new Error("L'URL inserito non è valido. Assicurati che inizi con http:// o https://");
  }

  const cleanUrl = url.trim();
  const errors: string[] = [];

  // Proxy 1: AllOrigins raw
  try {
    const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(cleanUrl)}`, { signal: AbortSignal.timeout(9000) });
    if (res.ok) {
      const text = await res.text();
      if (text && text.length > 500 && (text.includes('<table') || text.includes('tbl-') || text.includes('classifica'))) return text;
    }
  } catch (e: any) {
    errors.push(`AllOrigins: ${e.message}`);
  }

  // Proxy 2: AllOrigins JSON
  try {
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(cleanUrl)}`, { signal: AbortSignal.timeout(9000) });
    if (res.ok) {
      const data = await res.json();
      if (data?.contents && data.contents.length > 500) return data.contents;
    }
  } catch (e: any) {
    errors.push(`AllOrigins-JSON: ${e.message}`);
  }

  // Proxy 3: CodeTabs Proxy
  try {
    const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(cleanUrl)}`, { signal: AbortSignal.timeout(9000) });
    if (res.ok) {
      const text = await res.text();
      if (text && text.length > 500) return text;
    }
  } catch (e: any) {
    errors.push(`CodeTabs: ${e.message}`);
  }

  // Proxy 4: Corsproxy.io
  try {
    const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(cleanUrl)}`, { signal: AbortSignal.timeout(9000) });
    if (res.ok) {
      const text = await res.text();
      if (text && text.length > 500) return text;
    }
  } catch (e: any) {
    errors.push(`CorsProxy: ${e.message}`);
  }

  throw new Error(
    `Impossibile scaricare direttamente l'URL dal browser per restrizioni CORS del server FIPAV.\n` +
    `Puoi usare la comoda opzione "Incolla HTML / Sorgente Pagina" oppure impostare la modalità "Link Esterno" per collegare la classifica ufficiale in 1 secondo.`
  );
}

/**
 * Unified Scraper entry point
 */
export async function scrapeFipavFullData(
  url: string,
  myTeamName: string = "New Volley Academy",
  customOfficialName?: string
): Promise<{
  classifica: RigaClassifica[];
  partite: PartitaCampionato[];
  prossimaGara: ProssimaGara | null;
}> {
  const html = await fetchHtmlFromUrl(url);
  const result = parseFipavHtml(html, myTeamName, customOfficialName);

  if (result.classifica.length === 0 && result.partite.length === 0) {
    throw new Error("Nessun dato valido estratto. Verifica che il link FIPAV punti direttamente alla pagina con la tabella del campionato.");
  }

  return result;
}
