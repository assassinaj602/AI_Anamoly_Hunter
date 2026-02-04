import React, { useState, useRef } from 'react';
import { Anomaly } from '../types';

interface AnomalyOverlayProps {
  imageSrc: string;
  anomalies: Anomaly[];
}

export const AnomalyOverlay: React.FC<AnomalyOverlayProps> = ({ imageSrc, anomalies }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'box' | 'heatmap'>('box');
  const containerRef = useRef<HTMLDivElement>(null);

  const getBoxStyle = (box: number[]) => {
    // [ymin, xmin, ymax, xmax]
    const [ymin, xmin, ymax, xmax] = box;
    return {
      top: `${(ymin / 1000) * 100}%`,
      left: `${(xmin / 1000) * 100}%`,
      height: `${((ymax - ymin) / 1000) * 100}%`,
      width: `${((xmax - xmin) / 1000) * 100}%`,
    };
  };

  const getHeatmapStyle = (box: number[], confidence: number) => {
    const [ymin, xmin, ymax, xmax] = box;
    const width = (xmax - xmin) / 1000 * 100;
    const height = (ymax - ymin) / 1000 * 100;
    const centerX = (xmin / 1000 * 100) + (width / 2);
    const centerY = (ymin / 1000 * 100) + (height / 2);
    
    // Scale the heatmap glow based on box size but ensure it's visible
    const size = Math.max(width, height) * 1.5;

    return {
      top: `${centerY}%`,
      left: `${centerX}%`,
      width: `${size}%`,
      height: `${size * (containerRef.current?.offsetWidth || 1) / (containerRef.current?.offsetHeight || 1)}%`, // Aspect ratio correction
      transform: 'translate(-50%, -50%)',
      opacity: confidence / 100,
      background: `radial-gradient(circle closest-side, rgba(255, 50, 50, 0.8) 0%, rgba(255, 100, 50, 0.4) 40%, transparent 100%)`,
    };
  };

  return (
    <div className="relative w-full h-full bg-slate-950 rounded-lg overflow-hidden group select-none" ref={containerRef}>
      <img src={imageSrc} alt="Analyzed" className={`w-full h-full object-contain transition-opacity duration-300 ${viewMode === 'heatmap' ? 'opacity-60 grayscale-[50%]' : 'opacity-90'}`} />
      
      {/* View Toggle */}
      <div className="absolute bottom-4 right-4 z-30 flex bg-black/60 backdrop-blur-md rounded-lg border border-white/10 p-1">
        <button 
          onClick={() => setViewMode('box')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${viewMode === 'box' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            HUD
          </span>
        </button>
        <button 
          onClick={() => setViewMode('heatmap')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${viewMode === 'heatmap' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" /></svg>
            Heatmap
          </span>
        </button>
      </div>

      {anomalies.map((anomaly, idx) => {
        if (!anomaly.box_2d) return null;
        
        const isHovered = hoveredIndex === idx;
        
        return (
          <React.Fragment key={idx}>
            {/* Heatmap Layer */}
            {viewMode === 'heatmap' && (
              <div 
                 className="absolute pointer-events-none mix-blend-screen filter blur-md transition-all duration-500"
                 style={getHeatmapStyle(anomaly.box_2d, anomaly.confidence)}
              />
            )}

            {/* Box Layer */}
            {viewMode === 'box' && (
              <div
                className={`absolute transition-all duration-200 cursor-crosshair group/box`}
                style={getBoxStyle(anomaly.box_2d)}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* HUD Bracket Corners */}
                <div className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 transition-colors ${isHovered ? 'border-red-400 shadow-[0_0_10px_rgba(248,113,113,0.8)]' : 'border-indigo-400/60'}`}></div>
                <div className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 transition-colors ${isHovered ? 'border-red-400 shadow-[0_0_10px_rgba(248,113,113,0.8)]' : 'border-indigo-400/60'}`}></div>
                <div className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 transition-colors ${isHovered ? 'border-red-400 shadow-[0_0_10px_rgba(248,113,113,0.8)]' : 'border-indigo-400/60'}`}></div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 transition-colors ${isHovered ? 'border-red-400 shadow-[0_0_10px_rgba(248,113,113,0.8)]' : 'border-indigo-400/60'}`}></div>
                
                {/* Center Fill on Hover */}
                <div className={`absolute inset-0 bg-red-500/10 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}></div>

                {/* Floating Label */}
                <div className={`
                  absolute left-0 -top-8 
                  flex items-center gap-2
                  transition-all duration-200 
                  ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
                  pointer-events-none z-20
                `}>
                  <div className="bg-slate-900/90 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border border-red-500/30 shadow-lg whitespace-nowrap">
                    {anomaly.label}
                    <span className="ml-2 text-red-400">{anomaly.confidence}%</span>
                  </div>
                  <div className="w-px h-4 bg-red-500/50 absolute left-4 top-full"></div>
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
