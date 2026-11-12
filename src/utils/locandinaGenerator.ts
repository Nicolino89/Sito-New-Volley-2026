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

  // 1. SFONDO SCURO RADIALE
  const bgGrad = ctx.createRadialGradient(960, 540, 100, 960, 540, 1200);
  bgGrad.addColorStop(0, '#1c1b18');
  bgGrad.addColorStop(0.5, '#0f0e0c');
  bgGrad.addColorStop(1, '#050505');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1920, 1080);

  // 2. SFONDO PALAZZETTO (SE DISPONIBILE)
  const palazzettoImg = await loadImageSafe('/images/palazzetto-sfondo.jpg');
  if (palazzettoImg) {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.drawImage(palazzettoImg, 0, 0, 1920, 1080);
    ctx.restore();
  }

  // 3. FASCIA DIAGONALE NVA GIALLO/NERA
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(550, 0);
  ctx.lineTo(350, 1080);
  ctx.lineTo(0, 1080);
  ctx.closePath();
  ctx.fillStyle = 'rgba(245, 216, 0, 0.05)';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(1370, 0);
  ctx.lineTo(1920, 0);
  ctx.lineTo(1920, 1080);
  ctx.lineTo(1570, 1080);
  ctx.closePath();
  ctx.fillStyle = 'rgba(245, 216, 0, 0.05)';
  ctx.fill();
  ctx.restore();

  // 4. PANTERA CENTRALE HERO NVA
  const panteraImg = await loadImageSafe('/images/pantera-hero.png');
  if (panteraImg) {
    ctx.save();
    ctx.globalAlpha = 0.45;
    // Disegna la pantera centrata nella parte alta/centrale
    const pWidth = 800;
    const pHeight = 800 * (panteraImg.height / panteraImg.width);
    const pX = (1920 - pWidth) / 2;
    const pY = 40;
    ctx.drawImage(panteraImg, pX, pY, pWidth, pHeight);
    ctx.restore();
  }

  // Vignetta scura sopra la pantera per massima leggibilità
  const vignette = ctx.createLinearGradient(0, 0, 0, 1080);
  vignette.addColorStop(0, 'rgba(5, 5, 5, 0.7)');
  vignette.addColorStop(0.3, 'rgba(5, 5, 5, 0.2)');
  vignette.addColorStop(0.7, 'rgba(5, 5, 5, 0.4)');
  vignette.addColorStop(1, 'rgba(5, 5, 5, 0.95)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, 1920, 1080);

  // 5. HEADER SUPERIORE: PILL MATCH DAY
  ctx.save();
  const pillW = 680;
  const pillH = 50;
  const pillX = (1920 - pillW) / 2;
  const pillY = 55;
  drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 25);
  ctx.fillStyle = '#f5d800';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  ctx.fillStyle = '#0a0a0a';
  ctx.font = '900 22px "Arial Black", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '2px';
  ctx.fillText('★ FIPAV CAMPIONATO REGIONALE • MATCH DAY ★', 960, pillY + pillH / 2);
  ctx.restore();

  // CATEGORIA & GIORNATA
  ctx.save();
  const categoriaText = (data.categoria || 'SERIE D MASCHILE').toUpperCase();
  const giornataText = (data.giornata || '').toUpperCase();
  const subTitle = [categoriaText, giornataText].filter(Boolean).join(' • ');

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 48px "Arial Black", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 15;
  ctx.fillText(subTitle, 960, 160);
  ctx.restore();

  // 6. BLOCCHI SQUADRE (SINISTRA: CASA, DESTRA: OSPITI)
  const isNvaCasa = (data.squadraCasa || '').toLowerCase().includes('new volley') || (data.squadraCasa || '').toLowerCase().includes('academy');
  
  // LOGO CASA (X: 380, Y: 430)
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

  // LOGO OSPITI (X: 1380, Y: 430)
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

  // Caricamento e disegno loghi
  const defaultNvaLogo = '/images/logo-nva.png';
  const logoCasaUrl = data.logoCasa || (isNvaCasa ? defaultNvaLogo : '');
  const logoOspitiUrl = data.logoOspite || (!isNvaCasa ? defaultNvaLogo : '');

  const [imgCasa, imgOspiti] = await Promise.all([
    loadImageSafe(logoCasaUrl),
    loadImageSafe(logoOspitiUrl)
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
    // Fallback monogram
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 64px "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((data.squadraCasa || 'CASA').slice(0, 3).toUpperCase(), casaBoxX + boxW / 2, boxY + boxH / 2);
    ctx.restore();
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
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 64px "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((data.squadraOspite || 'OSPITI').slice(0, 3).toUpperCase(), ospitiBoxX + boxW / 2, boxY + boxH / 2);
    ctx.restore();
  }

  // 7. CENTRALE: BADGE OVALE DORATO "VS"
  ctx.save();
  const vsW = 150;
  const vsH = 90;
  const vsX = (1920 - vsW) / 2;
  const vsY = boxY + (boxH - vsH) / 2;

  // Glow oro
  ctx.shadowColor = '#f5d800';
  ctx.shadowBlur = 40;
  drawRoundedRect(ctx, vsX, vsY, vsW, vsH, 45);
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

  // 8. NOMI DELLE SQUADRE SOTTO AI LOGHI
  // NOME SQUADRA CASA
  ctx.save();
  ctx.fillStyle = isNvaCasa ? '#f5d800' : '#ffffff';
  ctx.font = '900 40px "Arial Black", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 10;
  ctx.fillText((data.squadraCasa || 'NEW VOLLEY ACADEMY').toUpperCase(), casaBoxX + boxW / 2, boxY + boxH + 25);

  // Badge CASA / OSPITI
  const bW = 130;
  const bH = 34;
  drawRoundedRect(ctx, casaBoxX + (boxW - bW) / 2, boxY + boxH + 80, bW, bH, 17);
  ctx.fillStyle = isNvaCasa ? '#f5d800' : '#334155';
  ctx.fill();
  ctx.fillStyle = isNvaCasa ? '#0a0a0a' : '#ffffff';
  ctx.font = '900 16px "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('IN CASA', casaBoxX + boxW / 2, boxY + boxH + 80 + bH / 2);
  ctx.restore();

  // NOME SQUADRA OSPITE
  ctx.save();
  ctx.fillStyle = !isNvaCasa ? '#f5d800' : '#ffffff';
  ctx.font = '900 40px "Arial Black", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 10;
  ctx.fillText((data.squadraOspite || 'AVVERSARIO').toUpperCase(), ospitiBoxX + boxW / 2, boxY + boxH + 25);

  drawRoundedRect(ctx, ospitiBoxX + (boxW - bW) / 2, boxY + boxH + 80, bW, bH, 17);
  ctx.fillStyle = !isNvaCasa ? '#f5d800' : '#334155';
  ctx.fill();
  ctx.fillStyle = !isNvaCasa ? '#0a0a0a' : '#ffffff';
  ctx.font = '900 16px "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('OSPITI', ospitiBoxX + boxW / 2, boxY + boxH + 80 + bH / 2);
  ctx.restore();

  // 9. RIQUADRO INFORMAZIONI GARA (DATA, ORA & LUOGO)
  ctx.save();
  const infoW = 1040;
  const infoH = 110;
  const infoX = (1920 - infoW) / 2;
  const infoY = 820;

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
  ctx.fillText(`📅  ${(data.dataOra || 'Inizio ore 21:15').toUpperCase()}`, 960, infoY + 38);

  // PALASPORT / LUOGO
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '700 20px "Arial", sans-serif';
  ctx.fillText(`📍  ${(data.luogo || 'Palasport Comunale').toUpperCase()}`, 960, infoY + 76);
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
