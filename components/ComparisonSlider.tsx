import React, { useState, useRef, useEffect } from 'react';

interface ComparisonSliderProps {
  image1: string; // Before
  image2: string; // After
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({ image1, image2 }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isFlickerMode, setIsFlickerMode] = useState(false);
  const [flickerState, setFlickerState] = useState(true); // true = image2, false = image1
  
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Flicker Logic
  useEffect(() => {
    let interval: number;
    if (isFlickerMode) {
      interval = window.setInterval(() => {
        setFlickerState(prev => !prev);
      }, 500); // 500ms toggle
    }
    return () => clearInterval(interval);
  }, [isFlickerMode]);

  const handleMove = (clientX: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percentage = (x / rect.width) * 100;
      setSliderPosition(percentage);
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || isFlickerMode) return;
    handleMove(e.clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || isFlickerMode) return;
    handleMove(e.touches[0].clientX);
  };

  return (
    <div className="relative w-full h-full flex flex-col">
       <div 
        ref={containerRef}
        className="relative w-full flex-1 bg-black select-none overflow-hidden rounded-t-xl border border-slate-700 cursor-crosshair group"
        onMouseDown={() => isDragging.current = true}
        onMouseUp={() => isDragging.current = false}
        onMouseLeave={() => isDragging.current = false}
        onMouseMove={onMouseMove}
        onTouchStart={() => isDragging.current = true}
        onTouchEnd={() => isDragging.current = false}
        onTouchMove={onTouchMove}
      >
        {isFlickerMode ? (
          // FLICKER MODE VIEW
          <>
            <img 
              src={image1} 
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-0 ${!flickerState ? 'opacity-100' : 'opacity-0'}`}
              alt="Older"
            />
             <img 
              src={image2} 
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-0 ${flickerState ? 'opacity-100' : 'opacity-0'}`}
              alt="Newer"
            />
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600/90 text-white px-3 py-1 rounded text-xs font-bold tracking-widest animate-pulse border border-red-400">
               {flickerState ? 'CURRENT' : 'HISTORICAL'}
            </div>
          </>
        ) : (
          // SLIDER MODE VIEW
          <>
            {/* Background Image (After - Right side) */}
            <img 
              src={image2} 
              alt="Newer" 
              className="absolute top-0 left-0 w-full h-full object-cover" 
              draggable={false}
            />
            <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm pointer-events-none">Newer</div>

            {/* Foreground Image (Before - Left side, clipped) */}
            <div 
              className="absolute top-0 left-0 h-full overflow-hidden border-r-2 border-white shadow-[0_0_20px_rgba(0,0,0,0.5)]"
              style={{ width: `${sliderPosition}%` }}
            >
              <img 
                src={image1} 
                alt="Older" 
                className="absolute top-0 left-0 max-w-none h-full object-cover"
                style={{ width: containerRef.current?.offsetWidth || '100%' }}
                draggable={false}
              />
              <div className="absolute top-4 left-4 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm pointer-events-none">Older</div>
            </div>

            {/* Slider Handle */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-transparent cursor-ew-resize flex items-center justify-center hover:bg-white/10 transition-colors"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center transform -translate-x-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
              </div>
            </div>
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs bg-black/40 px-3 py-1 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              Drag to compare
            </div>
          </>
        )}
      </div>

      {/* Control Bar */}
      <div className="h-12 bg-slate-900 border-x border-b border-slate-700 rounded-b-xl flex items-center justify-between px-4">
         <span className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">
           Comparison Mode
         </span>
         <div className="flex bg-slate-800 rounded-lg p-1">
            <button 
              onClick={() => setIsFlickerMode(false)}
              className={`px-3 py-1 text-xs font-bold rounded transition-all ${!isFlickerMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Slider
            </button>
            <button 
              onClick={() => setIsFlickerMode(true)}
              className={`px-3 py-1 text-xs font-bold rounded transition-all ${isFlickerMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Blink (Flicker)
            </button>
         </div>
      </div>
    </div>
  );
};