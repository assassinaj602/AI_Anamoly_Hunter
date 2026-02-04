import React, { useState, useEffect, useRef } from 'react';
import { AppMode, AnomalyResponse, ChangeResponse, LoadingState, ChatMessage, SystemLog, AnalysisMetadata } from './types';
import { analyzeAnomaly, analyzeChange, askQuestionAboutImage, askQuestionAboutChange, generateAudioBriefing, verifyLocationWithMaps } from './services/geminiService';
import { Button } from './components/Button';
import { ImageUploader } from './components/ImageUploader';
import { AnomalyOverlay } from './components/AnomalyOverlay';
import { ComparisonSlider } from './components/ComparisonSlider';
import { ChatInterface } from './components/ChatInterface';
import { SystemLogPanel } from './components/SystemLog.tsx';
import { ReportModal } from './components/ReportModal';
import { MetadataPanel } from './components/MetadataPanel';
import { DEMO_DATA, urlToBase64 } from './utils';

// Generate UUID for logs
const uuid = () => Math.random().toString(36).substring(2, 9);

function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.ANOMALY_HUNTER);
  const [loading, setLoading] = useState<LoadingState>({ isLoading: false, message: '' });
  
  // Metadata State
  const [metadata, setMetadata] = useState<AnalysisMetadata>({});

  // Anomaly State
  const [anomalyImage, setAnomalyImage] = useState<string | null>(null);
  const [anomalyResult, setAnomalyResult] = useState<AnomalyResponse | null>(null);

  // Change Tracker State
  const [imageBefore, setImageBefore] = useState<string | null>(null);
  const [imageAfter, setImageAfter] = useState<string | null>(null);
  const [changeResult, setChangeResult] = useState<ChangeResponse | null>(null);

  // Advanced Features State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [verifyingMap, setVerifyingMap] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  const addLog = (message: string, type: SystemLog['type'] = 'info') => {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
    setSystemLogs(prev => [...prev, { id: uuid(), timestamp: timeString, message, type }]);
  };

  const resetAnalysis = () => {
    setAnomalyResult(null);
    setChangeResult(null);
    setChatMessages([]);
    stopAudio();
    addLog(`System mode switched to: ${mode === AppMode.ANOMALY_HUNTER ? 'CHANGE_TRACKER' : 'ANOMALY_HUNTER'}`, 'warning');
  };

  const handleModeSwitch = (newMode: AppMode) => {
    if (mode !== newMode) {
      setMode(newMode);
      resetAnalysis();
    }
  };

  // Audio Playback
  const stopAudio = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsPlayingAudio(false);
  };

  const playAudioBriefing = async (text: string) => {
    if (isPlayingAudio) {
      stopAudio();
      return;
    }

    try {
      addLog("Initializing audio synthesis (Gemini TTS)...", 'info');
      setIsPlayingAudio(true);
      const audioBuffer = await generateAudioBriefing(text);
      
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      
      const buffer = await ctx.decodeAudioData(audioBuffer);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlayingAudio(false);
      source.start(0);
      addLog("Audio output stream active.", 'success');
    } catch (e) {
      console.error(e);
      addLog("Audio synthesis failed.", 'error');
      setIsPlayingAudio(false);
    }
  };

  // Verify Location Logic
  const handleVerifyLocation = async () => {
    if (!anomalyImage || !metadata.latitude) {
        addLog("Verification requires Image and Coordinates.", 'warning');
        return;
    }
    setVerifyingMap(true);
    addLog("Contacting Google Maps Grounding API...", 'info');
    try {
        const result = await verifyLocationWithMaps(anomalyImage, metadata);
        setAnomalyResult(prev => prev ? { ...prev, verification: result } : null);
        addLog("Grounding Verification Complete.", 'success');
    } catch (e) {
        addLog("Verification failed.", 'error');
    } finally {
        setVerifyingMap(false);
    }
  };

  // Export Logic
  const handleExport = () => {
    const data = mode === AppMode.ANOMALY_HUNTER ? anomalyResult : changeResult;
    if (!data) return;
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis_report_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog("Data exported to JSON.", 'success');
  };

  // --- Logic Handlers ---
  const loadDemoAnomaly = async () => {
    setLoading({ isLoading: true, message: 'ESTABLISHING UPLINK TO MARS RECONNAISSANCE ORBITER...' });
    addLog("Sequence initiated: DEMO_MARS_SURFACE", 'info');
    try {
      const base64 = await urlToBase64(DEMO_DATA.MARS_URL);
      setAnomalyImage(base64);
      setMetadata({ regionName: 'Gusev Crater, Mars', sensorType: 'Optical' });
      setAnomalyResult(null);
      setChatMessages([]);
      addLog("Telemetry data buffered.", 'success');
    } catch (e) {
      alert("Demo load failed. Network restrictions may apply.");
      addLog("Uplink failed: Connection refused.", 'error');
    } finally {
      setLoading({ isLoading: false, message: '' });
    }
  };

  const loadDemoChange = async () => {
    setLoading({ isLoading: true, message: 'RETRIEVING ARCHIVAL SATELLITE DATASETS...' });
    addLog("Sequence initiated: DEMO_GLACIAL_MELT", 'info');
    try {
      const base64Old = await urlToBase64(DEMO_DATA.GLACIER_OLD_URL);
      const base64New = await urlToBase64(DEMO_DATA.GLACIER_NEW_URL);
      setImageBefore(base64Old);
      setImageAfter(base64New);
      setMetadata({ regionName: 'Muir Glacier, Alaska', date: '2004-08-01', sensorType: 'Optical' });
      setChangeResult(null);
      setChatMessages([]);
      addLog("Historical timeline data successfully retrieved.", 'success');
    } catch (e) {
      alert("Demo load failed.");
      addLog("Data retrieval error.", 'error');
    } finally {
      setLoading({ isLoading: false, message: '' });
    }
  };

  const runAnomalyAnalysis = async () => {
    if (!anomalyImage) return;
    setLoading({ isLoading: true, message: 'GEMINI VISION: SCANNING TOPOLOGY FOR ANOMALIES...' });
    addLog("Sending image data to AI core...", 'info');
    try {
      const result = await analyzeAnomaly(anomalyImage, metadata);
      setAnomalyResult(result);
      addLog(`Scan complete. Detected ${result.anomalies.length} anomalous signatures.`, 'success');
    } catch (e) {
      alert("Analysis interrupted. Please try again.");
      addLog("Processing aborted by user or timeout.", 'error');
    } finally {
      setLoading({ isLoading: false, message: '' });
    }
  };

  const runChangeAnalysis = async () => {
    if (!imageBefore || !imageAfter) return;
    setLoading({ isLoading: true, message: 'GEMINI VISION: CALCULATING TEMPORAL DELTAS...' });
    addLog("Processing temporal differential vectors...", 'info');
    try {
      const result = await analyzeChange(imageBefore, imageAfter, metadata);
      setChangeResult(result);
      addLog(`Comparison complete. ${result.changes.length} change vectors identified.`, 'success');
    } catch (e) {
      alert("Analysis interrupted.");
      addLog("Processing aborted.", 'error');
    } finally {
      setLoading({ isLoading: false, message: '' });
    }
  };

  const handleChat = async (text: string) => {
    setChatMessages(prev => [...prev, { id: uuid(), role: 'user', text, timestamp: new Date() }]);
    setIsChatLoading(true);
    addLog("Transmitting user query...", 'info');

    try {
      let answer = "";
      if (mode === AppMode.ANOMALY_HUNTER && anomalyImage && anomalyResult) {
        answer = await askQuestionAboutImage(anomalyImage, text, anomalyResult.summary);
      } else if (mode === AppMode.CHANGE_TRACKER && imageBefore && imageAfter && changeResult) {
        answer = await askQuestionAboutChange(imageBefore, imageAfter, text, changeResult.summary);
      } else {
        answer = "Please run an analysis first.";
      }
      
      setChatMessages(prev => [...prev, { id: uuid(), role: 'model', text: answer, timestamp: new Date() }]);
      addLog("AI Response received.", 'success');
    } catch (e) {
      addLog("Communication failure.", 'error');
      setChatMessages(prev => [...prev, { id: uuid(), role: 'model', text: "Error connecting to mainframe.", timestamp: new Date() }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    addLog("System initialized. Version 2.0. Ready.", 'success');
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-100 print:hidden relative overflow-x-hidden">
      <SystemLogPanel logs={systemLogs} />
      
      {/* Report Modal */}
      <ReportModal 
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        mode={mode}
        data={mode === AppMode.ANOMALY_HUNTER ? anomalyResult : changeResult}
        image={mode === AppMode.ANOMALY_HUNTER ? anomalyImage : imageBefore}
        image2={mode === AppMode.CHANGE_TRACKER ? imageAfter : undefined}
      />

      {/* --- Navbar --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#02040a]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#02040a]/50">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer">
              <div className="absolute inset-0 bg-indigo-500 rounded-xl blur-lg opacity-40 group-hover:opacity-75 transition-opacity duration-500"></div>
              <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-slate-900 to-black border border-indigo-500/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                ANOMALY<span className="text-indigo-400">HUNTER</span>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300 font-mono tracking-widest border border-white/5">PRO</span>
              </h1>
              <div className="flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
                 <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-medium">Gemini 3 Uplink Secure</p>
              </div>
            </div>
          </div>

          <div className="flex bg-slate-900/50 p-1.5 rounded-xl border border-white/10 backdrop-blur-md">
            {[AppMode.ANOMALY_HUNTER, AppMode.CHANGE_TRACKER].map((m) => (
              <button
                key={m}
                onClick={() => handleModeSwitch(m)}
                className={`relative px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  mode === m 
                    ? 'text-white' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {mode === m && (
                  <div className="absolute inset-0 bg-indigo-600 rounded-lg shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                     <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {m === AppMode.ANOMALY_HUNTER ? (
                    <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> Anomaly Hunter</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Change Tracker</>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* --- Main Content --- */}
      <main className="flex-1 max-w-[1600px] mx-auto px-6 py-8 w-full mt-20">
        
        {/* Loading Overlay */}
        {loading.isLoading && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex flex-col items-center justify-center animate-fade-in">
             <div className="relative mb-12">
               <div className="w-32 h-32 rounded-full border border-indigo-500/20 animate-[spin_4s_linear_infinite]"></div>
               <div className="w-24 h-24 rounded-full border-t border-b border-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_2s_linear_infinite]"></div>
               <div className="w-16 h-16 rounded-full border border-indigo-500/50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[pulse_2s_infinite]"></div>
             </div>
             <h2 className="text-3xl font-light text-white tracking-[0.2em] animate-pulse">{loading.message}</h2>
             <div className="mt-4 flex items-center gap-3">
               <span className="h-px w-12 bg-indigo-500/50"></span>
               <p className="text-indigo-400 font-mono text-xs uppercase">Processing Neural Data</p>
               <span className="h-px w-12 bg-indigo-500/50"></span>
             </div>
          </div>
        )}

        {/* --- Hero Intro --- */}
        {mode === AppMode.ANOMALY_HUNTER && !anomalyImage && (
          <div className="animate-fade-in relative min-h-[calc(100vh-140px)] flex items-center justify-center">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
             
             <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center relative z-10 w-full max-w-6xl mx-auto">
                {/* Left Column: Text */}
                <div className="text-center lg:text-left order-2 lg:order-1">
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase tracking-[0.2em] mb-6 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                      Gemini 3 Vision Protocol
                   </div>
                   <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-indigo-300 mb-6 tracking-tighter leading-none">
                     REVEAL THE<br/>UNSEEN
                   </h1>
                   <p className="text-base md:text-lg text-slate-400 mb-8 leading-relaxed font-light max-w-lg mx-auto lg:mx-0">
                     Advanced AI detection for satellite imagery. Identify geological anomalies and decode planetary data with scientific precision.
                   </p>
                   
                   <div className="flex justify-center lg:justify-start">
                      <button onClick={loadDemoAnomaly} className="group flex items-center gap-3 text-slate-500 hover:text-indigo-400 transition-colors">
                        <span className="text-xs uppercase tracking-widest font-bold group-hover:underline decoration-dashed underline-offset-4">Load Simulation Data</span>
                        <span className="bg-slate-800 p-1.5 rounded group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </span>
                      </button>
                    </div>
                </div>

                {/* Right Column: Uploader */}
                <div className="order-1 lg:order-2">
                   <div className="glass-panel p-1 rounded-[2rem] shadow-2xl shadow-indigo-900/20 backdrop-blur-2xl">
                      <div className="bg-[#050508]/80 rounded-[1.8rem] p-6 border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                          <svg className="w-32 h-32 text-indigo-500" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="animate-[spin_10s_linear_infinite]" /></svg>
                        </div>
                        <ImageUploader 
                           onImageSelected={(img) => { setAnomalyImage(img); setAnomalyResult(null); }} 
                           label="Initialize Sector Scan"
                           className="h-72 w-full"
                        />
                      </div>
                   </div>
               </div>
             </div>
          </div>
        )}

        {/* --- Anomaly Hunter Workspace --- */}
        {mode === AppMode.ANOMALY_HUNTER && anomalyImage && (
          <div className="animate-fade-in flex flex-col h-full">
            
            <MetadataPanel metadata={metadata} onChange={setMetadata} />

            <div className={`
               gap-8 transition-all duration-500
               ${anomalyResult 
                  ? 'grid lg:grid-cols-2 min-h-[600px] flex-1' 
                  : 'flex flex-col items-center justify-center min-h-[500px]'
               }
            `}>
            
            {/* Visualization (Image) */}
            <div className={`
              transition-all duration-700 ease-out flex flex-col relative overflow-hidden group
              ${anomalyResult ? 'h-full' : 'w-full max-w-4xl h-[600px] mx-auto shadow-2xl rounded-3xl'}
            `}>
              <div className="glass-panel rounded-3xl p-1 h-full flex flex-col relative overflow-hidden border border-slate-700/50 shadow-2xl">
                 {/* Top Bar */}
                 <div className="absolute top-6 left-6 z-20 flex gap-4">
                    <div className="bg-black/80 backdrop-blur border border-white/10 px-4 py-1.5 rounded-full text-xs font-bold text-slate-300 flex items-center gap-2.5 shadow-lg">
                       <span className="w-2 h-2 bg-red-500 rounded-full animate-[pulse_1s_infinite]"></span>
                       LIVE FEED // SECTOR 7
                    </div>
                    <button onClick={() => { setAnomalyImage(null); setAnomalyResult(null); }} className="bg-black/50 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 backdrop-blur border border-white/10 px-4 py-1.5 rounded-full text-xs font-bold text-slate-300 transition-all">
                       ABORT MISSION
                    </button>
                 </div>
                 
                 {/* Main Viewport */}
                 <div className="flex-1 bg-[#020203] rounded-[20px] overflow-hidden relative">
                    {/* Grid Overlay */}
                    <div className="absolute inset-0 pointer-events-none opacity-10 bg-[size:40px_40px] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)]"></div>
                    
                    {anomalyResult 
                       ? <AnomalyOverlay imageSrc={anomalyImage} anomalies={anomalyResult.anomalies} />
                       : <img src={anomalyImage} className="w-full h-full object-contain opacity-90" alt="Source" />
                    }
                    
                    {!anomalyResult && (
                       <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                          <Button 
                             onClick={runAnomalyAnalysis} 
                             className="rounded-full px-10 py-5 text-lg shadow-[0_0_60px_rgba(99,102,241,0.5)] border-indigo-400/50 bg-indigo-600 hover:scale-105 hover:bg-indigo-500"
                          >
                             <svg className="w-6 h-6 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                             INITIATE SCAN
                          </Button>
                       </div>
                    )}
                 </div>
              </div>
            </div>

            {/* Right: Insights Panel */}
            {anomalyResult && (
               <div className="animate-fade-in delay-100 flex flex-col h-full overflow-hidden gap-4">
                 
                 {/* Stats / Header - Constrained Height */}
                 <div className="glass-panel rounded-3xl p-6 flex flex-col gap-4 shrink-0 max-h-[30vh]">
                    <div className="flex justify-between items-start shrink-0">
                       <div>
                          <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
                            ANALYSIS REPORT
                          </h2>
                          <div className="text-[10px] font-mono text-slate-500 mt-1 uppercase">ID: {uuid().toUpperCase()}</div>
                       </div>
                       <div className="flex gap-2">
                           <button onClick={handleExport} className="p-2 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-400 hover:text-white hover:border-slate-500 transition-all" title="Export JSON">
                               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                           </button>
                            <button 
                              onClick={() => playAudioBriefing(anomalyResult.summary)}
                              className={`p-2 rounded-lg border transition-all ${isPlayingAudio ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 animate-pulse' : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:text-white hover:border-slate-500'}`}
                            >
                               {isPlayingAudio ? (
                                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                               ) : (
                                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                               )}
                            </button>
                            <button onClick={() => setIsReportOpen(true)} className="p-2 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-400 hover:text-white hover:border-slate-500 transition-all">
                               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </button>
                       </div>
                    </div>
                    
                    <div className="bg-white/5 border border-white/5 rounded-xl p-4 overflow-y-auto custom-scrollbar">
                      <p className="text-lg text-slate-200 leading-relaxed font-medium">{anomalyResult.summary}</p>
                    </div>

                    {/* Google Maps Verification Block */}
                    {metadata.latitude && (
                        <div className={`rounded-xl p-3 border text-sm transition-all ${anomalyResult.verification ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800 border-slate-700'}`}>
                            {!anomalyResult.verification ? (
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Coordinates detected. Verify with Maps Data?</span>
                                    <button 
                                        onClick={handleVerifyLocation}
                                        disabled={verifyingMap}
                                        className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-white text-xs font-bold"
                                    >
                                        {verifyingMap ? "Verifying..." : "Verify Location"}
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center gap-2 mb-1 text-emerald-400 font-bold uppercase text-[10px] tracking-widest">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Ground Truth Verified
                                    </div>
                                    <p className="text-slate-300 whitespace-pre-line">{anomalyResult.verification}</p>
                                </div>
                            )}
                        </div>
                    )}
                 </div>

                 {/* Findings List - Flex Grow */}
                 <div className="glass-panel rounded-3xl flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] shrink-0">
                       <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Detected Signatures</h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                       {anomalyResult.anomalies.map((item, idx) => (
                          <div key={idx} className="group bg-slate-900/40 border border-slate-800 hover:border-indigo-500/50 p-4 rounded-xl transition-all hover:bg-slate-800/60">
                             <div className="flex justify-between items-center mb-2">
                                <span className="text-indigo-300 font-bold tracking-wide text-xl">{item.label}</span>
                                <span className="text-sm font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{item.confidence}% CONF.</span>
                             </div>
                             <p className="text-base text-slate-300 mb-3 leading-relaxed">{item.description}</p>
                             <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                                <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Hypothesis:</span>
                                <span className="text-sm text-slate-200 truncate">{item.scientificCause}</span>
                             </div>
                          </div>
                       ))}
                    </div>
                    
                    <div className="border-t border-white/10 shrink-0">
                      <ChatInterface 
                        messages={chatMessages} 
                        onSendMessage={handleChat} 
                        isLoading={isChatLoading} 
                      />
                    </div>
                 </div>
               </div>
            )}
            </div>
          </div>
        )}

        {/* --- Earth Change Tracker Mode --- */}
        {mode === AppMode.CHANGE_TRACKER && (
           <div className="max-w-[1400px] mx-auto animate-fade-in">
              <MetadataPanel metadata={metadata} onChange={setMetadata} />

              {!changeResult && (
                 <div className="text-center py-10 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>
                    
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight relative z-10">TEMPORAL ANALYSIS</h2>
                    <p className="text-slate-400 mb-16 max-w-lg mx-auto relative z-10">Select two timepoints. The AI will compute differential environmental vectors and generate an impact report.</p>
                    
                    <div className="grid md:grid-cols-2 gap-8 mb-12 relative z-10">
                       <div className="glass-panel p-6 rounded-[2rem] border-slate-700/50 hover:border-cyan-500/30 transition-colors">
                          <div className="flex justify-between items-center mb-6 px-2">
                             <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                               T-Minus (Old)
                             </span>
                          </div>
                          <ImageUploader 
                             onImageSelected={setImageBefore} 
                             selectedImage={imageBefore}
                             label="Baseline Image"
                             className="h-64"
                          />
                       </div>
                       <div className="glass-panel p-6 rounded-[2rem] border-slate-700/50 hover:border-cyan-500/30 transition-colors">
                          <div className="flex justify-between items-center mb-6 px-2">
                             <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                               T-Zero (New)
                             </span>
                          </div>
                          <ImageUploader 
                             onImageSelected={setImageAfter} 
                             selectedImage={imageAfter}
                             label="Current Image"
                             className="h-64"
                          />
                       </div>
                    </div>

                    <div className="flex flex-col items-center gap-6 relative z-10">
                       <Button 
                          onClick={runChangeAnalysis} 
                          disabled={!imageBefore || !imageAfter}
                          className="px-16 py-6 rounded-full text-xl shadow-[0_0_40px_rgba(6,182,212,0.3)] bg-cyan-600 hover:bg-cyan-500 border-cyan-400/50"
                       >
                          COMPUTE DELTA
                       </Button>
                       <button onClick={loadDemoChange} className="text-xs font-bold text-slate-500 hover:text-cyan-400 transition-colors uppercase tracking-widest border-b border-dashed border-slate-700 hover:border-cyan-400 pb-1">
                          Load Glacial Melt Dataset
                       </button>
                    </div>
                 </div>
              )}

              {changeResult && imageBefore && imageAfter && (
                 <div className="grid lg:grid-cols-2 gap-8 h-[calc(100vh-140px)] min-h-[600px] max-h-[900px]">
                    {/* Main Comparison (Image) */}
                    <div className="flex flex-col gap-6">
                       <div className="glass-panel p-2 rounded-3xl flex-1 relative min-h-[400px] shadow-2xl">
                          <div className="bg-black/80 rounded-2xl overflow-hidden h-full absolute inset-0 m-2 border border-slate-800">
                             <ComparisonSlider image1={imageBefore} image2={imageAfter} />
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4 shrink-0">
                          <div className="glass-card p-6 rounded-2xl text-center border-l-4 border-slate-600">
                             <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Reference Point</p>
                             <p className="text-white text-lg font-bold">Historical Data</p>
                          </div>
                          <div className="glass-card p-6 rounded-2xl text-center border-l-4 border-cyan-500">
                             <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Analysis Point</p>
                             <p className="text-white text-lg font-bold">Current Observation</p>
                          </div>
                       </div>
                    </div>

                    {/* Report Sidebar (Text) */}
                    <div className="h-full flex flex-col overflow-hidden gap-4">
                       {/* Summary Box Constrained */}
                       <div className="glass-panel rounded-3xl p-6 flex flex-col gap-4 shrink-0 max-h-[30vh]">
                            <div className="flex justify-between items-center mb-4 shrink-0">
                               <h3 className="font-bold text-white text-lg tracking-tight">CHANGE VECTORS</h3>
                               <div className="flex gap-2">
                                  <button onClick={handleExport} className="text-slate-400 hover:text-white transition-colors" title="Export JSON"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
                                  <button onClick={() => playAudioBriefing(changeResult.summary)} className="text-slate-400 hover:text-white transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg></button>
                                  <button onClick={() => setIsReportOpen(true)} className="text-slate-400 hover:text-white transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></button>
                                  <button onClick={() => setChangeResult(null)} className="text-slate-400 hover:text-red-400 transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                               </div>
                            </div>
                            <div className="bg-black/20 p-4 rounded-lg border border-white/5 overflow-y-auto custom-scrollbar">
                                <p className="text-lg text-slate-300 leading-relaxed font-medium">{changeResult.summary}</p>
                            </div>
                       </div>

                       <div className="glass-panel rounded-3xl flex-1 flex flex-col overflow-hidden">
                          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
                             {changeResult.changes.map((change, idx) => (
                                <div key={idx} className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl hover:border-cyan-500/40 transition-all hover:shadow-lg hover:shadow-cyan-900/10">
                                   <div className="flex justify-between items-start mb-3">
                                      <h4 className="font-bold text-white text-xl">{change.area}</h4>
                                      <span className={`text-xs font-bold px-2 py-1 rounded border uppercase tracking-wide ${
                                         change.estimated_scale === 'Large' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                                         'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                      }`}>
                                         {change.estimated_scale} Scale
                                      </span>
                                   </div>
                                   
                                   <div className="mb-3">
                                      <span className="inline-block px-2 py-0.5 rounded text-xs bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold uppercase tracking-wider">
                                         {change.change_type}
                                      </span>
                                   </div>

                                   <p className="text-base text-slate-300 mb-4 leading-relaxed">{change.description}</p>
                                   
                                   <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
                                      <div className="text-xs">
                                         <span className="text-slate-500 block mb-1">Driver</span>
                                         <span className="text-slate-200 font-medium text-sm">{change.possibleReason}</span>
                                      </div>
                                      <div className="text-xs text-right">
                                         <span className="text-slate-500 block mb-1">Probability</span>
                                         <span className="text-cyan-400 font-mono font-bold text-sm">{change.confidence}%</span>
                                      </div>
                                   </div>
                                </div>
                             ))}
                          </div>
                          
                          <div className="border-t border-white/10 bg-black/20 shrink-0">
                             <ChatInterface 
                               messages={chatMessages} 
                               onSendMessage={handleChat} 
                               isLoading={isChatLoading} 
                             />
                          </div>
                       </div>
                    </div>
                 </div>
              )}
           </div>
        )}
      </main>
    </div>
  );
}

export default App;