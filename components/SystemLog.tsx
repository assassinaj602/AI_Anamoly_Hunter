import React, { useEffect, useRef } from 'react';
import { SystemLog } from '../types';

interface SystemLogProps {
  logs: SystemLog[];
}

export const SystemLogPanel: React.FC<SystemLogProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="fixed bottom-6 right-6 w-80 max-h-56 z-40 font-mono text-[10px] pointer-events-none hidden xl:block">
      <div className="bg-black/80 border border-slate-800 rounded-lg backdrop-blur-md overflow-hidden flex flex-col h-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/50 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-slate-500 font-bold tracking-wider uppercase text-[9px]">Sys.Log.Daemon</span>
          </div>
          <div className="flex gap-1.5 items-center">
             <span className="text-[9px] text-emerald-500 font-bold animate-pulse">ONLINE</span>
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
          </div>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto p-3 space-y-1.5 custom-scrollbar flex-1">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-2 animate-fade-in leading-tight opacity-90">
              <span className="text-slate-600 shrink-0 select-none">[{log.timestamp}]</span>
              <span className={`${
                log.type === 'error' ? 'text-red-400 font-bold' :
                log.type === 'success' ? 'text-emerald-400' :
                log.type === 'warning' ? 'text-amber-400' :
                'text-indigo-300'
              }`}>
                {log.type === 'info' && <span className="text-slate-500 mr-1">{'>'}</span>}
                {log.message}
              </span>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        
        {/* Scanline decoration */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] bg-repeat z-10 opacity-20"></div>
      </div>
    </div>
  );
};