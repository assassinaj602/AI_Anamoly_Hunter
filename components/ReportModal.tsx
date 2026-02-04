import React from 'react';
import { AnomalyResponse, ChangeResponse, AppMode } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: AppMode;
  data: AnomalyResponse | ChangeResponse | null;
  image: string | null;
  image2?: string | null; // For change tracker
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, mode, data, image, image2 }) => {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const timestamp = new Date().toLocaleString();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm overflow-y-auto p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white text-slate-900 w-full max-w-4xl min-h-[80vh] rounded-lg shadow-2xl relative flex flex-col print:shadow-none print:w-full">
        
        {/* Screen-only Controls */}
        <div className="absolute top-4 right-4 flex gap-2 print:hidden">
          <button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Print Dossier
          </button>
          <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            Close
          </button>
        </div>

        {/* Paper Content */}
        <div className="p-8 md:p-12 font-mono flex-1">
          
          {/* Header */}
          <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">
                Scientific Discovery Report
              </h1>
              <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">
                Classification: UNCLASSIFIED // Gemini-3 Analysis
              </div>
            </div>
            <div className="text-right">
              <div className="border-2 border-red-600 text-red-600 font-bold px-3 py-1 text-sm inline-block transform -rotate-3 rounded opacity-80 uppercase">
                Confidential
              </div>
              <p className="text-xs text-slate-500 mt-2">{timestamp}</p>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm mb-8 border-b border-slate-200 pb-8">
            <div>
              <span className="block text-slate-400 uppercase text-[10px] tracking-widest font-bold">Operation Mode</span>
              <span className="font-bold">{mode === AppMode.ANOMALY_HUNTER ? 'Anomaly Detection Protocol' : 'Temporal Change Tracking'}</span>
            </div>
            <div>
              <span className="block text-slate-400 uppercase text-[10px] tracking-widest font-bold">Analyst ID</span>
              <span>AI-GEMINI-V3-FLASH</span>
            </div>
            <div className="col-span-2">
              <span className="block text-slate-400 uppercase text-[10px] tracking-widest font-bold">Executive Summary</span>
              <p className="leading-relaxed mt-1 text-slate-800">{data.summary}</p>
            </div>
          </div>

          {/* Images */}
          <div className="mb-8 bg-slate-100 p-4 border border-slate-300 rounded-lg flex gap-4 justify-center">
             {image && (
               <div className="flex flex-col items-center">
                 <img src={image} alt="Evidence 1" className="max-h-64 object-contain border border-slate-400" />
                 <span className="text-[10px] uppercase font-bold text-slate-500 mt-2">Exhibit A: Source Imagery</span>
               </div>
             )}
             {image2 && (
               <div className="flex flex-col items-center">
                 <img src={image2} alt="Evidence 2" className="max-h-64 object-contain border border-slate-400" />
                 <span className="text-[10px] uppercase font-bold text-slate-500 mt-2">Exhibit B: Temporal Comparison</span>
               </div>
             )}
          </div>

          {/* Table Data */}
          <div className="mb-8">
            <h3 className="text-sm font-bold uppercase tracking-widest border-b border-slate-900 pb-2 mb-4">Detailed Findings</h3>
            
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-300">
                <tr>
                  <th className="p-2 font-bold uppercase">ID</th>
                  <th className="p-2 font-bold uppercase">Classification</th>
                  <th className="p-2 font-bold uppercase">Description</th>
                  <th className="p-2 font-bold uppercase text-right">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {mode === AppMode.ANOMALY_HUNTER && (data as AnomalyResponse).anomalies.map((item, idx) => (
                  <tr key={idx} className="break-inside-avoid">
                    <td className="p-2 font-mono text-slate-500">#{String(idx + 1).padStart(3, '0')}</td>
                    <td className="p-2 font-bold text-indigo-700">{item.label}</td>
                    <td className="p-2">
                      <div className="mb-1">{item.description}</div>
                      <div className="text-slate-500 italic">Potential Cause: {item.scientificCause}</div>
                    </td>
                    <td className="p-2 text-right font-mono font-bold">{item.confidence}%</td>
                  </tr>
                ))}

                {mode === AppMode.CHANGE_TRACKER && (data as ChangeResponse).changes.map((item, idx) => (
                  <tr key={idx} className="break-inside-avoid">
                     <td className="p-2 font-mono text-slate-500">#{String(idx + 1).padStart(3, '0')}</td>
                     <td className="p-2">
                       <span className="font-bold text-indigo-700 block">{item.area}</span>
                       <span className="text-[10px] uppercase tracking-wide bg-slate-100 px-1 rounded">{item.change_type}</span>
                     </td>
                     <td className="p-2">
                       <div className="mb-1">{item.description}</div>
                       <div className="text-slate-500">Impact: {item.impact}</div>
                     </td>
                     <td className="p-2 text-right">
                       <div className="font-mono font-bold">{item.confidence}%</div>
                       <div className="text-[10px] uppercase text-slate-500">{item.estimated_scale}</div>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-8 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between uppercase tracking-widest">
             <span>Generated by AI Anomaly Hunter</span>
             <span>Page 1 of 1</span>
          </div>

        </div>
      </div>
    </div>
  );
};
