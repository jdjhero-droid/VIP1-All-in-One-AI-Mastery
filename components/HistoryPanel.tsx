
import React from 'react';
import { HistoryItem } from '../types';

interface HistoryPanelProps {
  items: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  onClear: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ items, onSelectItem, onClear }) => {
  const downloadAsset = (url: string, type: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `Generated_${type}_${Date.now()}.${type === 'image' ? 'png' : 'mp4'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-64 h-full bg-dark-800 border-l border-gray-800 flex flex-col z-20 shadow-2xl">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-dark-900">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <span className="text-lg">🕒</span> History
        </h2>
        {items.length > 0 && (
          <button 
            onClick={onClear}
            className="text-[10px] text-gray-500 hover:text-red-400 transition-colors uppercase font-bold"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-hide">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 text-center px-4">
            <svg className="w-8 h-8 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-[10px] font-medium">Your creative journey starts here.</p>
          </div>
        ) : (
          items.map((item) => (
            <div 
              key={item.id} 
              className="group relative bg-dark-900 rounded-xl overflow-hidden border border-gray-700 hover:border-banana-500 transition-all cursor-pointer shadow-lg"
              onClick={() => onSelectItem(item)}
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-black flex items-center justify-center relative">
                {item.type === 'image' ? (
                  <img src={item.url} alt="History Item" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-900/20">
                    <svg className="w-8 h-8 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.5 10l-4.5 3V7l4.5 3z" />
                    </svg>
                    <span className="text-[8px] font-bold text-indigo-400 mt-1">VIDEO</span>
                  </div>
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadAsset(item.url, item.type);
                    }}
                    className="p-2 bg-banana-500 text-dark-900 rounded-lg hover:scale-110 transition-transform"
                    title="Download"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  <button className="p-2 bg-white/20 backdrop-blur-md text-white rounded-lg hover:scale-110 transition-transform">
                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Info */}
              <div className="p-2">
                <p className="text-[9px] text-gray-500 truncate mb-1">{item.prompt}</p>
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-gray-600 font-mono">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
