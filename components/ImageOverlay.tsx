
import React from 'react';
import { HistoryItem } from '../types';

interface ImageOverlayProps {
  item: HistoryItem | null;
  onClose: () => void;
}

export const ImageOverlay: React.FC<ImageOverlayProps> = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div 
      className="fixed inset-0 z-[400] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div className="absolute top-6 right-6 flex gap-4">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const link = document.createElement('a');
              link.href = item.url;
              link.download = `WildTeacher_${item.type}_${Date.now()}`;
              link.click();
            }}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
          >
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
             </svg>
          </button>
          <button 
            onClick={onClose}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
          >
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
          </button>
      </div>

      <div className="max-w-7xl max-h-[90vh] w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
        {item.type === 'image' ? (
          <img 
            src={item.url} 
            alt="Full Preview" 
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-white/10" 
          />
        ) : (
          <video 
            src={item.url} 
            controls 
            autoPlay 
            className="max-w-full max-h-full rounded-xl shadow-2xl border border-white/10" 
          />
        )}
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 max-w-2xl w-full px-6 text-center">
          <div className="bg-dark-800/80 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">Original Prompt</p>
              <p className="text-white text-sm leading-relaxed">{item.prompt}</p>
          </div>
      </div>
    </div>
  );
};
