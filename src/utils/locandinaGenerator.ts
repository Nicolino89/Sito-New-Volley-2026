/**
 * Generatore Automatico Locandine Match 16:9 Full HD (1920x1080)
 * per YouTube Studio, Anteprime Social e Match Day New Volley Academy
 */

export interface LocandinaMatchData {
  categoria: string;
  giornata?: string;
  squadraCasa: string;
  squadraOspite: string;
  logoCasa?: string;
  logoOspite?: string;
  dataOra?: string;
  luogo?: string;
}

function loadImageSafe(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Retry without anonymous in case server doesn't support CORS headers
      const fallback = new Image();
      fallback.onload = () => resolve(fallback);
      fallback.onerror = () => resolve(null);
      fallback.src = src;
    };
    img.src = src;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Disegna uno scudetto/badge generico con tema volley e monogramma
 * per squadre create al momento o senza logo ufficiale
 */
function drawGenericVolleyBadge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  teamName: string,
  isNva: boolean
) {
  ctx.save();
  const r = 95;

  // Cerchio badge
  const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  if (isNva) {
    grad.addColorStop(0, '#f5d800');
    grad.addColorStop(1, '#eab308');
  } else {
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(1, '#0f172a');
  }
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Bordo
  ctx.lineWidth = 4;
  ctx.strokeStyle = isNva ? '#ffffff' : '#475569';
  ctx.stroke();

  // Curve stilizzate del pallone da volley
  ctx.strokeStyle = isNva ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 10, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx - 35, cy, 55, -0.7, 0.7);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 35, cy, 55, Math.PI - 0.7, Math.PI + 0.7);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy - 35, 55, 0.8, 2.3);
  ctx.stroke();

  // Calcolo monogramma iniziale
  const clean = (teamName || '').replace(/^[\s\-=\.\d]+/, '').trim();
  const words = clean.split(/\s+/).filter(w => w.length > 1 && !['DI', 'DEL', 'DELLA', 'ASD', 'SSD', 'VOLLEY'].includes(w.toUpperCase()));
  let initials = 'VB';
  if (words.length >= 2) {
    initials = (words[0][0] + words[1][0]).toUpperCase();
  } else if (clean.length >= 2) {
    initials = clean.slice(0, 3).toUpperCase();
  }

  ctx.fillStyle = isNva ? '#0a0a0a' : '#f8fafc';
  ctx.font = '900 48px "Arial Black", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 10;
  ctx.fillText(initials, cx, cy);

  ctx.restore();
}

/**
 * Disegna il nome squadra con supporto multiriga e auto-scaling
 * Evita troncamenti su nomi lunghi (es. New Volley Academy Derma 2.0...)
 * Ritorna la coordinata Y finale dopo l'ultima riga di testo
 */
function drawTeamName(
  ctx: CanvasRenderingContext2D,
  name: string,
  cx: number,
  startY: number,
  isNva: boolean
): number {
  const maxW = 460;
  const upper = (name || '').trim().toUpperCase();

  ctx.save();
  ctx.fillStyle = isNva ? '#f5d800' : '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 12;

  // Tentativo 1: singola riga
  let fontSize = 36;
  ctx.font = `900 ${fontSize}px "Arial Black", Impact, sans-serif`;
  const singleWidth = ctx.measureText(upper).width;

  let lines: string[] = [];
  if (singleWidth <= maxW) {
    lines = [upper];
  } else {
    // Dividi su 2 righe nel punto ottimale (spazio più vicino a metà stringa)
    const words = upper.split(/\s+/);
    if (words.length <= 1) {
      lines = [upper];
    } else {
      const halfLen = upper.length / 2;
      let curLen = 0;
      let splitIdx = 1;
      let bestDiff = 999;
      for (let i = 0; i < words.length - 1; i++) {
        curLen += words[i].length + 1;
        const diff = Math.abs(curLen - halfLen);
        if (diff < bestDiff) {
          bestDiff = diff;
          splitIdx = i + 1;
        }
      }
      lines = [
        words.slice(0, splitIdx).join(' '),
        words.slice(splitIdx).join(' ')
      ];
    }
  }

  // Se ancora troppo largo, scala font fino a maxW (min 20px)
  while (fontSize > 20) {
    ctx.font = `900 ${fontSize}px "Arial Black", Impact, sans-serif`;
    const anyTooWide = lines.some(l => ctx.measureText(l).width > maxW);
    if (!anyTooWide) break;
    fontSize -= 2;
  }

  const lineHeight = Math.round(fontSize * 1.18);
  lines.forEach((line, i) => {
    ctx.fillText(line, cx, startY + i * lineHeight);
  });
  ctx.restore();

  return startY + lines.length * lineHeight;
}

/**
 * Renderizza la locandina 1920x1080 su un elemento canvas
 */
export async function renderLocandinaToCanvas(
  canvas: HTMLCanvasElement,
  data: LocandinaMatchData
): Promise<void> {
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. CARICAMENTO SFONDO STEALTH CON PANTERA INTEGRATA
  const bgImg = await loadImageSafe('/images/locandina-bg-clean.jpg');
  if (bgImg) {
    ctx.drawImage(bgImg, 0, 0, 1920, 1080);
  } else {
    // Fallback sfumatura scura radiale
    const bgGrad = ctx.createRadialGradient(960, 540, 100, 960, 540, 1200);
    bgGrad.addColorStop(0, '#12141a');
    bgGrad.addColorStop(0.5, '#0a0c10');
    bgGrad.addColorStop(1, '#05070a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1920, 1080);
  }

  // 2. HEADER SUPERIORE: PILL MATCH DAY (AMPIA E SPAZIOSA)
  ctx.save();
  const isSerieD = (data.categoria || '').toLowerCase().includes('serie d');
  const catUpper = (data.categoria || '').toUpperCase();
  let pillText = '★  FIPAV CAMPIONATO • MATCH DAY  ★';
  if (isSerieD) {
    pillText = '★  FIPAV CAMPIONATO REGIONALE • MATCH DAY  ★';
  } else if (catUpper.includes('CSI')) {
    pillText = '★  CAMPIONATO CSI • MATCH DAY  ★';
  } else if (catUpper.includes('DIVISIONE') || catUpper.includes('UNDER')) {
    pillText = '★  FIPAV CAMPIONATO TERRITORIALE • MATCH DAY  ★';
  } else {
    pillText = '★  MATCH DAY • DIRETTA STREAMING  ★';
  }

  ctx.font = '900 19px "Arial Black", Impact, sans-serif';
  ctx.letterSpacing = '1px';
  const textMetrics = ctx.measureText(pillText);
  const pillW = Math.max(840, Math.min(1300, textMetrics.width + 120));
  const pillH = 50;
  const pillX = (1920 - pillW) / 2;
  const pillY = 50;

  drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 25);
  ctx.fillStyle = '#f5d800';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  ctx.fillStyle = '#0a0a0a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pillText, 960, pillY + pillH / 2);
  ctx.restore();

  // CATEGORIA & GIORNATA (CON DEDUPLICAZIONE RIGOROSA)
  ctx.save();
  const categoriaText = (data.categoria || 'SERIE D MASCHILE').toUpperCase();
  const giornataText = (data.giornata || '').toUpperCase();

  // Normalizza togliendo punteggiatura, spazi e accenti per confronto pulito
  const norm = (s: string) => s.replace(/[^A-Z0-9]/gi, '').toLowerCase();
  const normCat = norm(categoriaText);
  const normGio = norm(giornataText);

  let subTitle = categoriaText;
  if (giornataText && normGio !== normCat && !normCat.includes(normGio) && !normGio.includes(normCat)) {
    subTitle = `${categoriaText} • ${giornataText}`;
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 48px "Arial Black", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 15;
  ctx.fillText(subTitle, 960, 155);
  ctx.restore();

  // 6. BLOCCHI SQUADRE (SINISTRA: CASA, DESTRA: OSPITI)
  const isNvaCasa = (data.squadraCasa || '').toLowerCase().includes('new volley') || (data.squadraCasa || '').toLowerCase().includes('academy');
  
  // LOGO CASA (X: 260, Y: 270)
  const boxW = 280;
  const boxH = 280;
  const casaBoxX = 260;
  const boxY = 270;

  ctx.save();
  // Container bianco per logo casa
  drawRoundedRect(ctx, casaBoxX, boxY, boxW, boxH, 36);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = isNvaCasa ? 'rgba(245, 216, 0, 0.5)' : 'rgba(255, 255, 255, 0.2)';
  ctx.shadowBlur = 30;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = isNvaCasa ? '#f5d800' : '#475569';
  ctx.stroke();
  ctx.restore();

  // LOGO OSPITI (X: 1380, Y: 270)
  const ospitiBoxX = 1380;
  ctx.save();
  drawRoundedRect(ctx, ospitiBoxX, boxY, boxW, boxH, 36);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = !isNvaCasa ? 'rgba(245, 216, 0, 0.5)' : 'rgba(255, 255, 255, 0.2)';
  ctx.shadowBlur = 30;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = !isNvaCasa ? '#f5d800' : '#475569';
  ctx.stroke();
  ctx.restore();

  // Caricamento e sanitizzazione loghi
  const defaultNvaLogo = '/images/logo-nva.png';
  let sanitizedLogoCasa = data.logoCasa || '';
  let sanitizedLogoOspite = data.logoOspite || '';

  if (isNvaCasa) {
    if (!sanitizedLogoCasa) sanitizedLogoCasa = defaultNvaLogo;
    // Se la casa è NVA, l'ospite è l'avversario: rimuovi logo NVA se presente per errore
    if (sanitizedLogoOspite.includes('logo-nva.png')) {
      sanitizedLogoOspite = '';
    }
  } else {
    // L'ospite è NVA, la casa è l'avversario: rimuovi logo NVA dalla casa se presente per errore
    if (!sanitizedLogoOspite) sanitizedLogoOspite = defaultNvaLogo;
    if (sanitizedLogoCasa.includes('logo-nva.png')) {
      sanitizedLogoCasa = '';
    }
  }

  const [imgCasa, imgOspiti] = await Promise.all([
    loadImageSafe(sanitizedLogoCasa),
    loadImageSafe(sanitizedLogoOspite)
  ]);

  // Disegno Logo Casa
  if (imgCasa) {
    ctx.save();
    const pad = 36;
    const targetW = boxW - pad * 2;
    const targetH = boxH - pad * 2;
    const scale = Math.min(targetW / imgCasa.width, targetH / imgCasa.height);
    const drawW = imgCasa.width * scale;
    const drawH = imgCasa.height * scale;
    const drawX = casaBoxX + (boxW - drawW) / 2;
    const drawY = boxY + (boxH - drawH) / 2;
    ctx.drawImage(imgCasa, drawX, drawY, drawW, drawH);
    ctx.restore();
  } else {
    // Fallback badge generico volley con monogramma
    drawGenericVolleyBadge(ctx, casaBoxX + boxW / 2, boxY + boxH / 2, data.squadraCasa || 'CASA', isNvaCasa);
  }

  // Disegno Logo Ospiti
  if (imgOspiti) {
    ctx.save();
    const pad = 36;
    const targetW = boxW - pad * 2;
    const targetH = boxH - pad * 2;
    const scale = Math.min(targetW / imgOspiti.width, targetH / imgOspiti.height);
    const drawW = imgOspiti.width * scale;
    const drawH = imgOspiti.height * scale;
    const drawX = ospitiBoxX + (boxW - drawW) / 2;
    const drawY = boxY + (boxH - drawH) / 2;
    ctx.drawImage(imgOspiti, drawX, drawY, drawW, drawH);
    ctx.restore();
  } else {
    // Fallback badge generico volley con monogramma
    drawGenericVolleyBadge(ctx, ospitiBoxX + boxW / 2, boxY + boxH / 2, data.squadraOspite || 'OSPITI', !isNvaCasa);
  }

  // 7. CENTRALE: BADGE OVALE DORATO "VS" (POSIZIONATO SOTTO IL MUSO DELLA PANTERA)
  ctx.save();
  const vsW = 150;
  const vsH = 86;
  const vsX = (1920 - vsW) / 2;
  const vsY = 480;

  // Glow oro
  ctx.shadowColor = '#f5d800';
  ctx.shadowBlur = 40;
  drawRoundedRect(ctx, vsX, vsY, vsW, vsH, 43);
  ctx.fillStyle = '#f5d800';
  ctx.fill();

  // Bordo interno scuro
  ctx.shadowBlur = 0;
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  // Testo VS
  ctx.fillStyle = '#0a0a0a';
  ctx.font = '900 46px "Arial Black", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VS', 960, vsY + vsH / 2 + 2);
  ctx.restore();

  // 8. NOMI DELLE SQUADRE SOTTO AI LOGHI CON AUTO-SCALING E MULTIRIGA
  const startY = boxY + boxH + 22;
  const bottomYCasa = drawTeamName(ctx, data.squadraCasa || 'NEW VOLLEY ACADEMY', casaBoxX + boxW / 2, startY, isNvaCasa);
  const bottomYOspiti = drawTeamName(ctx, data.squadraOspite || 'AVVERSARIO', ospitiBoxX + boxW / 2, startY, !isNvaCasa);

  // Badge CASA / OSPITI allineati orizzontalmente
  const bW = 130;
  const bH = 34;
  const badgeY = Math.max(bottomYCasa, bottomYOspiti, boxY + boxH + 75) + 12;

  // Badge CASA
  ctx.save();
  drawRoundedRect(ctx, casaBoxX + (boxW - bW) / 2, badgeY, bW, bH, 17);
  ctx.fillStyle = isNvaCasa ? '#f5d800' : '#334155';
  ctx.fill();
  ctx.fillStyle = isNvaCasa ? '#0a0a0a' : '#ffffff';
  ctx.font = '900 16px "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('IN CASA', casaBoxX + boxW / 2, badgeY + bH / 2);
  ctx.restore();

  // Badge OSPITI
  ctx.save();
  drawRoundedRect(ctx, ospitiBoxX + (boxW - bW) / 2, badgeY, bW, bH, 17);
  ctx.fillStyle = !isNvaCasa ? '#f5d800' : '#334155';
  ctx.fill();
  ctx.fillStyle = !isNvaCasa ? '#0a0a0a' : '#ffffff';
  ctx.font = '900 16px "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('OSPITI', ospitiBoxX + boxW / 2, badgeY + bH / 2);
  ctx.restore();

  // 9. RIQUADRO INFORMAZIONI GARA (DATA, ORA & LUOGO)
  ctx.save();
  const infoW = 1040;
  const hasLuogo = Boolean(data.luogo && data.luogo.trim().length > 0);
  const infoH = hasLuogo ? 110 : 80;
  const infoX = (1920 - infoW) / 2;
  const infoY = hasLuogo ? 820 : 835;

  drawRoundedRect(ctx, infoX, infoY, infoW, infoH, 28);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#f5d800';
  ctx.stroke();

  // DATA E ORA
  ctx.fillStyle = '#f5d800';
  ctx.font = '900 28px "Arial Black", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const dateY = hasLuogo ? infoY + 38 : infoY + infoH / 2;
  ctx.fillText(`📅  ${(data.dataOra || 'Inizio Match Live').toUpperCase()}`, 960, dateY);

  // PALASPORT / LUOGO (se disponibile)
  if (hasLuogo && data.luogo) {
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '700 20px "Arial", sans-serif';
    ctx.fillText(`📍  ${data.luogo.toUpperCase()}`, 960, infoY + 76);
  }
  ctx.restore();

  // 10. FOOTER BANNER NVA IN BASSO
  ctx.save();
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 1020, 1920, 60);

  ctx.fillStyle = '#f5d800';
  ctx.fillRect(0, 1018, 1920, 4);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 18px "Arial Black", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '3px';
  ctx.fillText('🔴 DIRETTA STREAMING IN ALTA DEFINIZIONE • WWW.NEWVOLLEYACADEMY.IT/DIRETTA', 960, 1050);
  ctx.restore();
}

/**
 * Genera il file immagine blob e avvia il download diretto nel browser
 */
export async function downloadLocandinaMatch(
  data: LocandinaMatchData,
  filename?: string
): Promise<void> {
  const canvas = document.createElement('canvas');
  await renderLocandinaToCanvas(canvas, data);

  const cleanName = filename || `locandina_${(data.squadraCasa || 'nva').toLowerCase().replace(/\s+/g, '_')}_vs_${(data.squadraOspite || 'avversario').toLowerCase().replace(/\s+/g, '_')}.jpg`;

  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Errore generazione immagine canvas"));
            return;
          }
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = cleanName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 2000);
          resolve();
        },
        'image/jpeg',
        0.95
      );
    } catch (err) {
      reject(err);
    }
  });
}
