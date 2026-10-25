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
export function isNvaTeam(name: string, customOfficialName?: string, myTeamName?: string): boolean {
  if (!name) return false;
  const n = name.toLowerCase().trim();

  // If a specific official name was selected / set by the admin, match against it
  if (customOfficialName && customOfficialName.trim()) {
    const cust = customOfficialName.toLowerCase().trim();
    if (n === cust || n.includes(cust) || cust.includes(n)) {
      return true;
    }
  }

  // Prevent cross-matching distinct teams of the club (e.g. Nera vs Bianca)
  if (myTeamName) {
    const m = myTeamName.toLowerCase().trim();
    if (m.includes('nera') && n.includes('bianca')) return false;
    if (m.includes('bianca') && n.includes('nera')) return false;
    if (m.includes('rossa') && (n.includes('nera') || n.includes('bianca'))) return false;
  }

  // Strict NVA identifiers (prevents matching other clubs containing "Academy" or "Volley")
  // Exclude opponent club "SAMMA PROJECT SALFEP FC"
  if (n.includes('samma')) return false;

  return (
    n.includes('new volley') ||
    n.includes('new-volley') ||
    n === 'nva' ||
    n.startsWith('nva ') ||
    n.endsWith(' nva') ||
    n.includes(' nva ') ||
    (n.includes('salfep') && (n.includes('forli') || n.includes('academy') || n.includes('nva')))
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
  detectedUrl?: string;
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const classifica: RigaClassifica[] = [];
  const partite: PartitaCampionato[] = [];

  // Auto-detect page URL from OpenGraph meta tags if present
  const ogUrl = doc.querySelector('meta[property="og:url"], meta[name="og:url"]')?.getAttribute('content') || undefined;

  // ==========================================
  // 1. PARSE STANDINGS (CLASSIFICA)
  // ==========================================
  // Strategy A: Dedicated portalefipav.net (.tbl-classifica) or fipavromagna.it (.gare-classifica, [id^="classifica_"])
  const tblClassifica = doc.querySelector(
    'table.tbl-classifica, table[class*="tbl-classifica"], table.gare-classifica, table[class*="gare-classifica"], table[id^="classifica_"]'
  );
  if (tblClassifica) {
    const rows = Array.from(tblClassifica.querySelectorAll('tbody tr, tr')).filter(
      r => !r.closest('thead') && r.querySelectorAll('td').length >= 3
    );
    for (const r of rows) {
      const cells = Array.from(r.querySelectorAll('td')).map(td => cleanString(td.textContent || ''));
      if (cells.length >= 3) {
        const pos = parseInt(cells[0].replace(/[^\d]/g, ''), 10);
        const teamName = cells[1];
        const punti = parseInt(cells[2].replace(/[^\d]/g, ''), 10) || 0;
        const giocate = cells[3] ? parseInt(cells[3].replace(/[^\d]/g, ''), 10) || 0 : 0;
        const vinte = cells[4] ? parseInt(cells[4].replace(/[^\d]/g, ''), 10) || 0 : 0;
        const perse = cells[5] ? parseInt(cells[5].replace(/[^\d]/g, ''), 10) || 0 : 0;
        const setVinti = cells[6] ? parseInt(cells[6].replace(/[^\d]/g, ''), 10) || 0 : 0;
        const setPersi = cells[7] ? parseInt(cells[7].replace(/[^\d]/g, ''), 10) || 0 : 0;

        if (pos > 0 && teamName && teamName.length >= 2 && !teamName.toLowerCase().includes('squadra')) {
          const isMyTeam = customOfficialName && customOfficialName.trim()
            ? (cleanString(teamName).toLowerCase() === customOfficialName.toLowerCase().trim() || isNvaTeam(teamName, customOfficialName, myTeamName))
            : isNvaTeam(teamName, myTeamName, myTeamName);

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

  // Strategy C: Plain-Text / Tabular Text Fallback (when user copies directly from rendered webpage text)
  if (classifica.length === 0 && html) {
    const lines = html.split(/[\r\n]+/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      // Tab-separated or multi-space separated tokens
      const parts = trimmed.split(/\t+| {2,}/).map(cleanString).filter(Boolean);
      if (parts.length >= 3) {
        const firstNum = parseInt(parts[0].replace(/[^\d]/g, ''), 10);
        if (!isNaN(firstNum) && firstNum > 0 && firstNum <= 30) {
          const teamName = parts[1];
          const points = parseInt(parts[2].replace(/[^\d]/g, ''), 10);
          if (teamName && teamName.length >= 2 && !isNaN(points) && !teamName.toLowerCase().includes('squadra')) {
            const giocate = parts[3] ? parseInt(parts[3].replace(/[^\d]/g, ''), 10) || 0 : 0;
            const vinte = parts[4] ? parseInt(parts[4].replace(/[^\d]/g, ''), 10) || 0 : 0;
            const perse = parts[5] ? parseInt(parts[5].replace(/[^\d]/g, ''), 10) || 0 : 0;
            const setVinti = parts[6] ? parseInt(parts[6].replace(/[^\d]/g, ''), 10) || 0 : 0;
            const setPersi = parts[7] ? parseInt(parts[7].replace(/[^\d]/g, ''), 10) || 0 : 0;

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

  // Strategy B: Dedicated fipavromagna.it & PowerSPORT portal (.tb-opponanet-contant or .gare-tab)
  if (partite.length === 0) {
    const oppBlocks = Array.from(doc.querySelectorAll('.tb-opponanet-contant'));
    if (oppBlocks.length > 0) {
      let matchIdx = 1;
      for (const oppBlock of oppBlocks) {
        const mainRow = oppBlock.closest('tr');
        if (!mainRow) continue;

        const team1El = oppBlock.querySelector('.tb-team-1 .text h6, .tb-team-1 h6, .tb-team-1 a, .tb-team-1');
        const team2El = oppBlock.querySelector('.tb-team-2 .text h6, .tb-team-2 h6, .tb-team-2 a, .tb-team-2');
        const team1 = cleanString(team1El?.textContent || '');
        const team2 = cleanString(team2El?.textContent || '');

        if (!team1 || !team2) continue;

        const dateCell = mainRow.querySelector('.dataOra, .tb-date');
        const dateCellText = cleanString(dateCell?.textContent || '');

        let giornataNum = `${matchIdx}`;
        const gMatch = dateCellText.match(/(?:G\.|giornata\s*)(\d+)/i);
        if (gMatch) giornataNum = gMatch[1];

        let garaNum = '';
        const garaMatch = dateCellText.match(/Gara\s+n\.\s*(\d+)/i);
        if (garaMatch) garaNum = garaMatch[1];

        let data = new Date().toLocaleDateString('it-IT');
        const dMatch = dateCellText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
        if (dMatch) data = dMatch[1];

        let ora = '20:30';
        const oMatch = dateCellText.match(/(\d{1,2}:\d{2})/);
        if (oMatch) ora = oMatch[1];

        const score1El = oppBlock.querySelector('.tb-opponanet.aa h6, .tb-opponanet.aa');
        const score2El = oppBlock.querySelector('.tb-opponanet.bb h6, .tb-opponanet.bb');
        const score1Str = cleanString(score1El?.textContent || '');
        const score2Str = cleanString(score2El?.textContent || '');

        const s1 = parseInt(score1Str, 10);
        const s2 = parseInt(score2Str, 10);
        const hasScores = !isNaN(s1) && !isNaN(s2);

        const parzialiEls = Array.from(mainRow.querySelectorAll('.rgb-parziali-tab h6, .rgb-parziali-tab span'));
        const parzialiTokens = parzialiEls
          .map(el => cleanString(el.textContent || ''))
          .filter(t => /\d+-\d+/.test(t));
        const parziali = parzialiTokens.join(' ');

        let nextRow = mainRow.nextElementSibling;
        while (nextRow && !nextRow.classList.contains('other-info') && !nextRow.querySelector('.imp-des')) {
          if (nextRow.querySelector('.tb-opponanet-contant')) break;
          nextRow = nextRow.nextElementSibling;
        }

        let luogo = '';
        if (nextRow) {
          const impDes = nextRow.querySelector('.imp-des p, .imp-des');
          if (impDes) {
            const b = impDes.querySelector('b');
            const a = impDes.querySelector('a');
            const namePart = cleanString(b?.textContent || '');
            const addrPart = cleanString(a?.textContent || '');
            luogo = [namePart, addrPart].filter(Boolean).join(' - ') || cleanString(impDes.textContent || '');
          }
        }

        const isHome = isNvaTeam(team1, customOfficialName, myTeamName);
        const isAway = isNvaTeam(team2, customOfficialName, myTeamName);

        let matchTeamIsHome = isHome;
        let opponent = '';

        if (isHome) {
          matchTeamIsHome = true;
          opponent = team2;
        } else if (isAway) {
          matchTeamIsHome = false;
          opponent = team1;
        } else {
          const t1Low = team1.toLowerCase();
          const t2Low = team2.toLowerCase();
          if (t1Low.includes('new volley') || t1Low.includes('nva')) {
            matchTeamIsHome = true;
            opponent = team2;
          } else if (t2Low.includes('new volley') || t2Low.includes('nva')) {
            matchTeamIsHome = false;
            opponent = team1;
          } else {
            continue;
          }
        }

        const setNva = hasScores ? (matchTeamIsHome ? s1 : s2) : null;
        const setAvversario = hasScores ? (matchTeamIsHome ? s2 : s1) : null;
        const terminata = hasScores;

        partite.push({
          id: `p_fipav_${garaNum || matchIdx}_${Date.now()}`,
          giornata: `${giornataNum}ª Giornata`,
          data,
          ora,
          avversario: opponent,
          casa: matchTeamIsHome,
          luogo: sanitizeLuogoDisplay(luogo, matchTeamIsHome),
          risultato: terminata ? `${setNva} - ${setAvversario}` : '',
          setNva,
          setAvversario,
          parzialiSet: parziali.trim(),
          terminata
        });

        matchIdx++;
      }
    }
  }

  // Strategy C: General FIPAV match parsing (fallback)
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
      const isNvaInRow = isNvaTeam(rowText, customOfficialName || myTeamName, myTeamName);

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

        // Search strictly for "vs" so that hyphens in "G.1 - Gara" or dates are never mistaken for team separators
        const vsMatch = rowText.match(/([a-zA-Z0-9\s'\.\-]+?)\s+\bvs\b\s+([a-zA-Z0-9\s'\.\-]+)/i);
        if (vsMatch) {
          const t1 = cleanString(vsMatch[1]);
          const t2 = cleanString(vsMatch[2]);
          if (isNvaTeam(t1, customOfficialName || myTeamName, myTeamName)) {
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
    prossimaGara,
    detectedUrl: ogUrl
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

/**
 * Unisce in modo intelligente il calendario esistente con le gare in arrivo da FIPAV.
 * Protegge:
 * 1. Risultati inseriti a mano o gare concluse se FIPAV riporta ancora la gara non omologata o '-'
 * 2. Posizioni personalizzate / link google maps
 * 3. Tutte le gare precedenti se l'utente incolla solo una porzione parziale del campionato o solo la classifica
 */
export function mergePartite(
  currentList: PartitaCampionato[] = [],
  incomingList: PartitaCampionato[] = []
): PartitaCampionato[] {
  if (!incomingList || incomingList.length === 0) {
    return currentList || [];
  }

  if (!currentList || currentList.length === 0) {
    return incomingList;
  }

  const cleanGiornata = (g?: string) => (g || '').replace(/[^0-9]/g, '');

  const findMatch = (incoming: PartitaCampionato, incomingIdx: number) => {
    const inNum = cleanGiornata(incoming.giornata);
    if (inNum) {
      const match = currentList.find(c => cleanGiornata(c.giornata) === inNum);
      if (match) return match;
    }
    if (incoming.avversario) {
      const inAdv = incoming.avversario.toLowerCase().trim();
      const match = currentList.find(c => {
        const cAdv = (c.avversario || '').toLowerCase().trim();
        return cAdv && (cAdv.includes(inAdv) || inAdv.includes(cAdv));
      });
      if (match) return match;
    }
    if (currentList.length === incomingList.length && currentList[incomingIdx]) {
      return currentList[incomingIdx];
    }
    return null;
  };

  const merged: PartitaCampionato[] = incomingList.map((incoming, idx) => {
    const existing = findMatch(incoming, idx);
    if (!existing) return incoming;

    const incomingHasResult =
      incoming.terminata &&
      Boolean(incoming.risultato && incoming.risultato.trim() !== '-' && incoming.risultato.trim() !== '');

    const existingHasResult =
      existing.terminata ||
      (existing.setNva !== null && existing.setNva !== undefined) ||
      Boolean(existing.risultato && existing.risultato.trim() !== '-' && existing.risultato.trim() !== '');

    if (existingHasResult && !incomingHasResult) {
      return {
        ...incoming,
        id: existing.id || incoming.id,
        risultato: existing.risultato,
        setNva: existing.setNva,
        setAvversario: existing.setAvversario,
        parzialiSet: existing.parzialiSet || incoming.parzialiSet,
        terminata: true,
        link_mappa: existing.link_mappa || incoming.link_mappa,
        luogo: existing.luogo || incoming.luogo,
        note: existing.note || incoming.note
      };
    }

    return {
      ...incoming,
      id: existing.id || incoming.id,
      link_mappa: existing.link_mappa || incoming.link_mappa,
      luogo: (incoming.luogo && incoming.luogo !== 'Palasport') ? incoming.luogo : (existing.luogo || incoming.luogo),
      note: existing.note || incoming.note
    };
  });

  if (currentList.length > incomingList.length) {
    for (const existing of currentList) {
      const alreadyInMerged = merged.some(m => {
        const eNum = cleanGiornata(existing.giornata);
        const mNum = cleanGiornata(m.giornata);
        if (eNum && mNum && eNum === mNum) return true;
        if (existing.id && m.id && existing.id === m.id) return true;
        return false;
      });
      if (!alreadyInMerged) {
        merged.push(existing);
      }
    }
  }

  return merged;
}

