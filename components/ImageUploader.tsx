import React, { useRef, useState, useEffect } from 'react';

interface ImageUploaderProps {
  onImageSelected: (base64: string) => void;
  label?: string;
  subLabel?: string;
  className?: string;
  selectedImage?: string | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImageSelected, 
  label = "Upload Image", 
  subLabel = "Drag & drop, paste from clipboard, or click to browse",
  className = "", 
  selectedImage 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      onImageSelected(result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      
      const isHovered = containerRef.current?.matches(':hover');
      const isFocused = document.activeElement === containerRef.current || containerRef.current?.contains(document.activeElement);

      if (!isHovered && !isFocused) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            processFile(file);
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [onImageSelected]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  return (
    <div className={`relative group ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <div 
        ref={containerRef}
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative w-full h-72 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden outline-none
          border border-dashed
          ${selectedImage 
            ? 'border-indigo-500/50 bg-black/40' 
            : isDragOver 
              ? 'border-cyan-400 bg-cyan-900/10 shadow-[0_0_30px_rgba(34,211,238,0.15)]' 
              : 'border-slate-700 hover:border-indigo-400 hover:bg-slate-800/30 bg-slate-900/20'
          }
        `}
      >
        {selectedImage ? (
          <>
            <img src={selectedImage} alt="Selected" className="w-full h-full object-contain p-2 z-10" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center backdrop-blur-sm">
               <span className="text-white font-bold tracking-wider px-6 py-2 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition-colors">
                 REPLACE SOURCE
               </span>
            </div>
          </>
        ) : (
          <div className="text-center p-8 z-10 relative">
             {/* Decorative corners */}
            <div className={`absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 transition-all duration-300 ${isDragOver ? 'border-cyan-400' : 'border-slate-600 group-hover:border-indigo-400'}`}></div>
            <div className={`absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 transition-all duration-300 ${isDragOver ? 'border-cyan-400' : 'border-slate-600 group-hover:border-indigo-400'}`}></div>
            <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 transition-all duration-300 ${isDragOver ? 'border-cyan-400' : 'border-slate-600 group-hover:border-indigo-400'}`}></div>
            <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 transition-all duration-300 ${isDragOver ? 'border-cyan-400' : 'border-slate-600 group-hover:border-indigo-400'}`}></div>

            <div className={`
              w-16 h-16 mx-auto mb-6 rounded-lg flex items-center justify-center transition-all duration-500
              ${isDragOver ? 'bg-cyan-500/20 text-cyan-300 scale-110 shadow-[0_0_20px_rgba(34,211,238,0.4)]' : 'bg-slate-800 text-slate-400 group-hover:text-indigo-300 group-hover:bg-indigo-500/10'}
            `}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className={`text-xl font-bold tracking-tight transition-colors ${isDragOver ? 'text-cyan-300' : 'text-slate-200 group-hover:text-white'}`}>
              {label}
            </p>
            <p className="text-slate-500 text-sm mt-3 font-medium">{subLabel}</p>
          </div>
        )}

        {/* Animated Grid Background */}
        {!selectedImage && (
          <div className="absolute inset-0 pointer-events-none opacity-[0.05] group-hover:opacity-[0.08] transition-opacity"
               style={{ 
                 backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(99, 102, 241, .3) 25%, rgba(99, 102, 241, .3) 26%, transparent 27%, transparent 74%, rgba(99, 102, 241, .3) 75%, rgba(99, 102, 241, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(99, 102, 241, .3) 25%, rgba(99, 102, 241, .3) 26%, transparent 27%, transparent 74%, rgba(99, 102, 241, .3) 75%, rgba(99, 102, 241, .3) 76%, transparent 77%, transparent)',
                 backgroundSize: '50px 50px'
               }}
          />
        )}
      </div>
    </div>
  );
};