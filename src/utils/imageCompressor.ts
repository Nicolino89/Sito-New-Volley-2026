/**
 * Utility per la compressione centralizzata delle immagini.
 * Ridimensiona l'immagine proporzionalmente mantenendo una larghezza o altezza massima
 * e la converte nel formato ad alta efficienza WebP (con fallback automatico a JPEG).
 */

// Configurazione centralizzata — tutti i preset in un posto solo
export const IMAGE_PRESETS = {
  LOGO: {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.92,
    format: 'image/webp' as const,
  },
  HERO: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85,
    format: 'image/webp' as const,
  },
  STORIA: {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.85,
    format: 'image/webp' as const,
  },
  ATLETA: {
    maxWidth: 600,
    maxHeight: 800,
    quality: 0.88,
    format: 'image/webp' as const,
  },
  EVENTO_COVER: {
    maxWidth: 1200,
    maxHeight: 800,
    quality: 0.85,
    format: 'image/webp' as const,
  },
  CAROSELLO: {
    maxWidth: 900,
    maxHeight: 700,
    quality: 0.82,
    format: 'image/webp' as const,
  },
  SQUAD_COVER: {
    maxWidth: 1200,
    maxHeight: 800,
    quality: 0.85,
    format: 'image/webp' as const,
  },
} as const;

export type ImagePreset = typeof IMAGE_PRESETS[keyof typeof IMAGE_PRESETS];

export interface CompressionResult {
  blob: Blob;
  objectUrl: string;        // URL temporaneo per preview istantanea
  originalSize: number;     // bytes originali
  compressedSize: number;   // bytes dopo compressione
  reductionPercent: number; // percentuale di riduzione
  width: number;            // dimensioni finali effettive
  height: number;
  format: string;
}

/**
 * Comprime una singola immagine basandosi sul preset selezionato.
 */
export async function compressImage(
  file: File,
  preset: ImagePreset,
  onProgress?: (percent: number) => void
): Promise<CompressionResult> {
  // Step 1: Lettura dell'immagine con supporto rapido createImageBitmap
  let rawWidth = 0;
  let rawHeight = 0;
  let sourceElement: ImageBitmap | HTMLImageElement;
  const tempUrl = URL.createObjectURL(file);

  try {
    if (typeof createImageBitmap === 'function') {
      sourceElement = await createImageBitmap(file);
      rawWidth = sourceElement.width;
      rawHeight = sourceElement.height;
    } else {
      const img = new Image();
      const loadedImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const timeoutId = setTimeout(() => reject(new Error("Timeout caricamento")), 4000);
        img.onload = () => {
          clearTimeout(timeoutId);
          resolve(img);
        };
        img.onerror = () => {
          clearTimeout(timeoutId);
          reject(new Error("Errore lettura immagine"));
        };
        img.src = tempUrl;
      });
      sourceElement = loadedImg;
      rawWidth = loadedImg.width;
      rawHeight = loadedImg.height;
    }
  } catch (error) {
    URL.revokeObjectURL(tempUrl);
    throw error;
  }

  onProgress?.(15);

  // Step 2: Calcolo dimensioni proporzionali
  const originalWidth = rawWidth;
  const originalHeight = rawHeight;
  const { maxWidth, maxHeight } = preset;

  let outputWidth = originalWidth;
  let outputHeight = originalHeight;

  if (originalWidth > maxWidth || originalHeight > maxHeight) {
    const scale = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
    outputWidth = Math.round(originalWidth * scale);
    outputHeight = Math.round(originalHeight * scale);
  }

  onProgress?.(30);

  // Step 3: Disegno su canvas
  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    URL.revokeObjectURL(tempUrl);
    throw new Error("Impossibile creare il contesto canvas 2D");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceElement, 0, 0, outputWidth, outputHeight);

  onProgress?.(60);

  // Step 4: Esportazione come Blob con fallback automatico
  const exportToBlob = (fmt: string, qual: number): Promise<Blob | null> => {
    return new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), fmt, qual);
    });
  };

  let blob = await exportToBlob(preset.format, preset.quality);

  // Se il formato non è supportato o se il blob è nullo, proviamo JPEG
  if (!blob || (preset.format === 'image/webp' && blob.type !== 'image/webp')) {
    blob = await exportToBlob('image/jpeg', preset.quality);
  }

  if (!blob) {
    URL.revokeObjectURL(tempUrl);
    throw new Error("Errore durante la generazione del file compresso");
  }

  onProgress?.(85);

  // Step 5: Generazione objectUrl e calcolo statistiche
  const resultUrl = URL.createObjectURL(blob);
  const reductionPercent = Math.round((1 - blob.size / file.size) * 100);

  if (reductionPercent < 0) {
    console.warn(
      `[imageCompressor] File già ottimizzato: compressione ha aumentato la dimensione di ${Math.abs(reductionPercent)}%. Considera di abbassare il preset di qualità.`
    );
  }

  onProgress?.(100);

  // Step 6: Pulizia
  URL.revokeObjectURL(tempUrl);

  return {
    blob,
    objectUrl: resultUrl,
    originalSize: file.size,
    compressedSize: blob.size,
    reductionPercent,
    width: outputWidth,
    height: outputHeight,
    format: blob.type,
  };
}

/**
 * Processa un gruppo di immagini in sequenza (batch) per evitare picchi di consumo memoria.
 */
export async function compressImageBatch(
  files: File[],
  preset: ImagePreset,
  onFileProgress?: (fileIndex: number, percent: number) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];
  for (let i = 0; i < files.length; i++) {
    const result = await compressImage(files[i], preset, (percent) => {
      onFileProgress?.(i, percent);
    });
    results.push(result);
  }
  return results;
}
