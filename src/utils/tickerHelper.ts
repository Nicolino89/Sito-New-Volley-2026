/**
 * tickerHelper.ts - Logica dinamica e automatica per il Ticker Scorrevole NVA
 * 
 * - Gestione automatica gare:
 *   - Mostra il risultato nelle 48 ore successive alla partita (Vittoria/Risultato)
 *   - Mostra l'avviso di prossima gara nelle 48 ore precedenti alla partita
 * - Rotazione Sponsor con grafica pubblicitaria distintiva (badge ADV / PARTNER)
 * - Vetrina e Lookbook ufficiale NVA
 * - Annunci manuali del CMS
 */

import { RosaSquadra, Sponsor, cleanTeamDisplayName } from '../firebase-societa';

export interface TickerBlock {
  id: string;
  type: 'risultato' | 'prossima_gara' | 'sponsor' | 'annuncio' | 'lookbook';
  badge: string;
  badgeVariant: 'vittoria' | 'risultato' | 'gara' | 'sponsor' | 'lookbook' | 'annuncio';
  text: string;
  link?: string;
}

/**
 * Parsing tollerante di date e orari partite (dd/mm/yy, dd/mm/yyyy, ISO, testuale)
 */
export function parseMatchDate(rawStr?: string): Date | null {
  if (!rawStr) return null;
  const str = rawStr.trim();

  // 1. Prova formato standard italiano: dd/mm/yy o dd/mm/yyyy con ora facoltativa
  const ddmmyyMatch = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:[^\d]+(\d{1,2}):(\d{2}))?/);
  if (ddmmyyMatch) {
    const day = parseInt(ddmmyyMatch[1], 10);
    const month = parseInt(ddmmyyMatch[2], 10) - 1;
    let year = parseInt(ddmmyyMatch[3], 10);
    if (year < 100) year += 2000;
    const hour = ddmmyyMatch[4] ? parseInt(ddmmyyMatch[4], 10) : 20;
    const min = ddmmyyMatch[5] ? parseInt(ddmmyyMatch[5], 10) : 0;
    return new Date(year, month, day, hour, min, 0);
  }

  // 2. Prova formato ISO yyyy-mm-dd
  const isoMatch = str.match(/(\d{4})-(\d{1,2})-(\d{1,2})(?:[^\d]+(\d{1,2}):(\d{2}))?/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const hour = isoMatch[4] ? parseInt(isoMatch[4], 10) : 20;
    const min = isoMatch[5] ? parseInt(isoMatch[5], 10) : 0;
    return new Date(year, month, day, hour, min, 0);
  }

  // 3. Prova formato testuale italiano con nome mese (es: "SAB 18 OTT • 20:30")
  const mesiItaliani: { [key: string]: number } = {
    gen: 0, gennaio: 0,
    feb: 1, febbraio: 1,
    mar: 2, marzo: 2,
    apr: 3, aprile: 3,
    mag: 4, maggio: 4,
    giu: 5, giugno: 5,
    lug: 6, luglio: 6,
    ago: 7, agosto: 7,
    set: 8, settembre: 8,
    ott: 9, ottobre: 9,
    nov: 10, novembre: 10,
    dic: 11, dicembre: 11
  };

  const textMatch = str.match(/(\d{1,2})\s+([a-zA-Z]{3,9})(?:\s+(\d{4}))?(?:[^\d]+(\d{1,2}):(\d{2}))?/i);
  if (textMatch) {
    const day = parseInt(textMatch[1], 10);
    const mStr = textMatch[2].toLowerCase();
    const month = mesiItaliani[mStr] !== undefined ? mesiItaliani[mStr] : mesiItaliani[mStr.slice(0, 3)];
    if (month !== undefined) {
      const year = textMatch[3] ? parseInt(textMatch[3], 10) : (new Date().getFullYear());
      const hour = textMatch[4] ? parseInt(textMatch[4], 10) : 20;
      const min = textMatch[5] ? parseInt(textMatch[5], 10) : 0;
      return new Date(year, month, day, hour, min, 0);
    }
  }

  // 4. Fallback nativo Date.parse
  const nativeTimestamp = Date.parse(str);
  if (!isNaN(nativeTimestamp)) {
    return new Date(nativeTimestamp);
  }

  return null;
}

/**
 * Genera l'elenco dei blocchi del ticker integrando gare 48h, sponsor a rotazione e annunci.
 */
export function buildDynamicTickerBlocks(
  squadre: RosaSquadra[],
  sponsors: Sponsor[],
  cmsAnnouncements: string[] = [],
  now: number = Date.now()
): TickerBlock[] {
  const matchBlocks: TickerBlock[] = [];
  const WINDOW_MS = 56 * 60 * 60 * 1000; // Finestra di 56 ore (~2.3 giorni) per coprire comodamente tutto il weekend

  // 1. Scansione gare ESCLUSIVAMENTE delle 2 Serie D (Maschile e Femminile)
  if (squadre && squadre.length > 0) {
    const squadreSerieD = squadre.filter(s => {
      const nome = (s.nome_squadra || '').toUpperCase();
      const camp = (s.campionato || '').toUpperCase();
      return s.category === 'SERIE_D' || nome.includes('SERIE D') || camp.includes('SERIE D');
    });

    squadreSerieD.forEach(squadra => {
      const partite = squadra.partite || [];
      const nomeUpper = (squadra.nome_squadra || '').toUpperCase();
      const isMaschile = nomeUpper.includes('MASCHILE') || squadra.genere === 'M' || squadra.gender === 'M';
      const nomeSquadra = isMaschile ? 'SERIE D MASCHILE' : 'SERIE D FEMMINILE';

      partite.forEach(partita => {
        const fullDateStr = `${partita.data || ''} ${partita.ora || '20:30'}`.trim();
        const date = parseMatchDate(fullDateStr) || parseMatchDate(partita.data);
        if (!date) return;

        const time = date.getTime();
        const diffMs = time - now;

        const cleanOpponent = cleanTeamDisplayName(partita.avversario) || 'AVVERSARIO';

        // A) GARA RECENTE APPENA CONCLUSA (entro le 56h successive alla partita)
        if (diffMs <= 0 && Math.abs(diffMs) <= WINDOW_MS) {
          const hasScore = (partita.setNva != null && partita.setAvversario != null) || 
                           (partita.risultato && partita.risultato.trim() !== '' && partita.risultato !== '-');
          
          if (hasScore || partita.terminata) {
            let setNva = partita.setNva ?? 0;
            let setAvv = partita.setAvversario ?? 0;

            if (partita.risultato && (setNva === 0 && setAvv === 0)) {
              const parts = partita.risultato.split(/[-:]/).map(p => parseInt(p.trim(), 10));
              if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                if (partita.casa) {
                  setNva = parts[0];
                  setAvv = parts[1];
                } else {
                  setAvv = parts[0];
                  setNva = parts[1];
                }
              }
            }

            const isWin = setNva > setAvv;
            const homeName = partita.casa ? 'NEW VOLLEY ACADEMY' : cleanOpponent;
            const awayName = partita.casa ? cleanOpponent : 'NEW VOLLEY ACADEMY';
            const scoreDisplay = partita.casa ? `${setNva} - ${setAvv}` : `${setAvv} - ${setNva}`;
            const giornataText = partita.giornata ? ` (${partita.giornata.toUpperCase()})` : '';

            matchBlocks.push({
              id: `match-res-${partita.id || time}`,
              type: 'risultato',
              badge: isWin ? '🏆 VITTORIA' : '🏐 RISULTATO',
              badgeVariant: isWin ? 'vittoria' : 'risultato',
              text: `${nomeSquadra}: ${homeName} ${scoreDisplay} ${awayName}${giornataText}`,
              link: `/squadre/${squadra.id}`
            });
          }
        }

        // B) GARA IMMINENTE IN ARRIVO (entro le 56h precedenti alla partita)
        else if (diffMs > 0 && diffMs <= WINDOW_MS && !partita.terminata) {
          const homeName = partita.casa ? 'NEW VOLLEY ACADEMY' : cleanOpponent;
          const awayName = partita.casa ? cleanOpponent : 'NEW VOLLEY ACADEMY';
          const locazione = partita.casa ? 'IN CASA' : 'IN TRASFERTA';
          const oraText = partita.ora ? `• ORE ${partita.ora}` : '';
          const giornataText = partita.giornata ? ` [${partita.giornata.toUpperCase()}]` : '';

          matchBlocks.push({
            id: `match-up-${partita.id || time}`,
            type: 'prossima_gara',
            badge: '⚡ PROSSIMA GARA',
            badgeVariant: 'gara',
            text: `${nomeSquadra}: ${homeName} VS ${awayName} • ${locazione} ${oraText}${giornataText}`,
            link: `/squadre/${squadra.id}`
          });
        }
      });
    });
  }

  // 2. Blocchi Sponsor a rotazione (distinzione grafica come richiesto dall'utente)
  const sponsorBlocks: TickerBlock[] = [];
  if (sponsors && sponsors.length > 0) {
    const activeSponsors = sponsors.filter(s => s.attivo !== false && s.nomeSponsor && s.nomeSponsor.trim() !== '');
    // Ordina prima per tipologia (Main Sponsor, Gold Partner, ecc.)
    activeSponsors.forEach((sp, idx) => {
      const tipo = sp.tipologia || 'Partner Ufficiale';
      sponsorBlocks.push({
        id: `sponsor-${sp.id || idx}`,
        type: 'sponsor',
        badge: 'ADV PARTNER',
        badgeVariant: 'sponsor',
        text: `${sp.nomeSponsor.toUpperCase()} • ${tipo.toUpperCase()} • SOSTIENE LE PANTERE`,
        link: sp.linkSito || '/sponsor'
      });
    });
  }

  // 3. Blocchi Annunci CMS
  const annuncioBlocks: TickerBlock[] = [];
  const defaultAnnunci = [
    "SERIE D: AL VIA IL CAMPIONATO REGIONALE FIPAV 2026/2027",
    "CAMP & CORSI MINIVOLLEY: PROVE GRATUITE SEMPRE APERTE",
    "SEGUICI SUI SOCIAL @NEWVOLLEYACADEMY"
  ];
  const listCms = (cmsAnnouncements && cmsAnnouncements.length > 0) ? cmsAnnouncements : defaultAnnunci;
  listCms.forEach((ann, idx) => {
    annuncioBlocks.push({
      id: `cms-${idx}`,
      type: 'annuncio',
      badge: '★ NVA',
      badgeVariant: 'annuncio',
      text: ann.toUpperCase()
    });
  });

  // 4. Blocco Lookbook / Vetrina Materiale
  const lookbookBlock: TickerBlock = {
    id: 'lookbook-official',
    type: 'lookbook',
    badge: '👕 LOOKBOOK',
    badgeVariant: 'lookbook',
    text: 'MATERIALE UFFICIALE: SCOPRI LE MAGLIE GARA, LE FELPE E LE SCIARPE DELLE PANTERE',
    link: '/vetrina'
  };

  // 5. Composizione e Interleaving dinamico
  // Sequenza armonica: [Gara Evento] -> [Annuncio CMS] -> [Sponsor ADV] -> [Lookbook] -> [Annuncio CMS] ...
  const combined: TickerBlock[] = [];

  // Se ci sono eventi gara (imminenti o appena conclusi), aprono la sequenza con priorità
  if (matchBlocks.length > 0) {
    combined.push(...matchBlocks);
  }

  // Inserimento a catena alternata
  let cmsIdx = 0;
  let spIdx = 0;

  while (cmsIdx < annuncioBlocks.length || (sponsorBlocks.length > 0 && spIdx < Math.min(sponsorBlocks.length, 3))) {
    if (cmsIdx < annuncioBlocks.length) {
      combined.push(annuncioBlocks[cmsIdx]);
      cmsIdx++;
    }

    if (sponsorBlocks.length > 0 && spIdx < sponsorBlocks.length) {
      combined.push(sponsorBlocks[spIdx]);
      spIdx++;
    }

    // Inseriamo il richiamo alla vetrina a metà sequenza se opportuno
    if (combined.length === 3) {
      combined.push(lookbookBlock);
    }
  }

  // Se la combinazione è ancora corta (es. solo 1-2 annunci), garantiamo varietà
  if (combined.length < 3) {
    combined.push(lookbookBlock);
    if (sponsorBlocks.length > 0 && spIdx < sponsorBlocks.length) {
      combined.push(sponsorBlocks[spIdx]);
    }
  }

  return combined;
}
