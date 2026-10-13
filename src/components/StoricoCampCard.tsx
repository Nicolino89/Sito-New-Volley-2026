import React, { useState, useEffect, useRef } from 'react';
import { Users, MapPin, Calendar, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { EventiTorneo } from '../firebase-societa';

interface StoricoCampCardProps {
  torneo: EventiTorneo;
}

export const StoricoCampCard: React.FC<StoricoCampCardProps> = ({ torneo }) => {
  const archivio = torneo.archivio || {};
  const fotoList = archivio.foto || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-play logic with 4s interval
  useEffect(() => {
    if (fotoList.length <= 1 || !isAutoPlay) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIdx((prevIdx) => (prevIdx + 1) % fotoList.length);
    }, 4000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [fotoList, isAutoPlay]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAutoPlay(false); // Stop autoplay on interaction
    setCurrentIdx((prevIdx) => (prevIdx - 1 + fotoList.length) % fotoList.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAutoPlay(false); // Stop autoplay on interaction
    setCurrentIdx((prevIdx) => (prevIdx + 1) % fotoList.length);
  };

  const handleDotClick = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAutoPlay(false); // Stop autoplay on interaction
    setCurrentIdx(idx);
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all h-full animate-fade-in">
      {/* Media / Carousel Section */}
      <div className="relative aspect-[4/3] w-full bg-zinc-100 group select-none">
        {/* Badge Top Left */}
        <div className="absolute top-3 left-3 z-20 bg-[#F5D800] text-black font-black text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-md shadow-md">
          {archivio.edizione || torneo.edizione || 'Edizione Passata'}
        </div>

        {fotoList.length > 0 ? (
          <>
            {/* Slide */}
            <div className="w-full h-full relative overflow-hidden">
              <img
                src={fotoList[currentIdx]}
                alt={`${torneo.nome_evento} - foto ${currentIdx + 1}`}
                className="w-full h-full object-cover transition-all duration-700 ease-in-out transform scale-100"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Navigation Arrows */}
            {fotoList.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                  aria-label="Foto precedente"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                  aria-label="Foto successiva"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Dot Indicators */}
            {fotoList.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm">
                {fotoList.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => handleDotClick(idx, e)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      idx === currentIdx ? 'bg-white w-3' : 'bg-white/50'
                    }`}
                    aria-label={`Vai alla foto ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          /* Placeholder if no photos */
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-2">
            <Camera className="w-8 h-8 text-zinc-300" />
            <span className="text-xs font-mono">Nessuna foto disponibile</span>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        {/* Title */}
        <div className="space-y-1">
          <h4 className="text-md font-extrabold text-zinc-900 leading-tight">
            {torneo.nome_evento}
          </h4>
        </div>

        {/* 3 Metrics Row */}
        <div className="grid grid-cols-3 gap-2 border-y border-zinc-100 py-3 text-center">
          {/* Metric 1: Partecipanti */}
          <div className="flex flex-col items-center justify-center space-y-1 min-w-0">
            <Users className="w-4 h-4 text-zinc-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[9px] uppercase tracking-wider text-zinc-400 block font-mono">Iscritti</span>
              <strong className="text-zinc-800 text-xs font-extrabold block truncate">
                {archivio.partecipanti ? `${archivio.partecipanti}` : '--'}
              </strong>
            </div>
          </div>

          {/* Metric 2: Sede */}
          <div className="flex flex-col items-center justify-center space-y-1 min-w-0 border-x border-zinc-100">
            <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
            <div className="min-w-0 w-full px-1">
              <span className="text-[9px] uppercase tracking-wider text-zinc-400 block font-mono">Sede</span>
              <strong className="text-zinc-800 text-xs font-extrabold block truncate" title={archivio.location || 'Impianto NVA'}>
                {archivio.location || 'Impianto NVA'}
              </strong>
            </div>
          </div>

          {/* Metric 3: Edizione */}
          <div className="flex flex-col items-center justify-center space-y-1 min-w-0">
            <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[9px] uppercase tracking-wider text-zinc-400 block font-mono">Periodo</span>
              <strong className="text-zinc-800 text-xs font-extrabold block truncate" title={torneo.edizione || 'N/D'}>
                {torneo.edizione || 'N/D'}
              </strong>
            </div>
          </div>
        </div>

        {/* Highlight Text */}
        {archivio.highlight && (
          <div className="flex-1 flex items-center justify-center pt-1">
            <p className="font-inter italic text-zinc-500 text-xs leading-relaxed text-center px-2">
              „{archivio.highlight}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
