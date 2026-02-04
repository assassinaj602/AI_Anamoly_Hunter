import React, { useState } from 'react';
import { AnalysisMetadata } from '../types';

interface MetadataPanelProps {
  metadata: AnalysisMetadata;
  onChange: (meta: AnalysisMetadata) => void;
}

export const MetadataPanel: React.FC<MetadataPanelProps> = ({ metadata, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (field: keyof AnalysisMetadata, value: string) => {
    onChange({ ...metadata, [field]: value });
  };

  return (
    <div className="glass-panel rounded-2xl mb-6 overflow-hidden transition-all duration-300 border-slate-700">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-3 flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.447-.894L15 7m0 13V7" />
          </svg>
          <span className="text-sm font-bold text-slate-200 uppercase tracking-widest">
            Mission Context / Metadata
          </span>
          {Object.values(metadata).some(v => v) && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">Active</span>
          )}
        </div>
        <svg className={`w-5 h-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="p-6 grid md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in bg-black/20">
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-slate-500 font-bold">Region / Place Name</label>
            <input 
              type="text" 
              placeholder="e.g. Area 51, Nevada"
              value={metadata.regionName || ''}
              onChange={e => handleChange('regionName', e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none placeholder:text-slate-600"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-slate-500 font-bold">Latitude / Longitude</label>
            <div className="flex gap-2">
                <input 
                type="text" 
                placeholder="Lat"
                value={metadata.latitude || ''}
                onChange={e => handleChange('latitude', e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none placeholder:text-slate-600"
                />
                <input 
                type="text" 
                placeholder="Lng"
                value={metadata.longitude || ''}
                onChange={e => handleChange('longitude', e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none placeholder:text-slate-600"
                />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase text-slate-500 font-bold">Date Taken</label>
            <input 
              type="date" 
              value={metadata.date || ''}
              onChange={e => handleChange('date', e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none text-slate-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase text-slate-500 font-bold">Sensor Type</label>
            <select 
              value={metadata.sensorType || ''}
              onChange={e => handleChange('sensorType', e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
                <option value="">Standard Optical</option>
                <option value="Infrared (IR)">Infrared (Thermal)</option>
                <option value="SAR (Radar)">SAR (Radar)</option>
                <option value="LiDAR">LiDAR (Elevation)</option>
                <option value="Hyperspectral">Hyperspectral</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};