
import React, { useState, useEffect } from 'react';
import { saveApiKey, getApiKey, removeApiKey, setVaultActivated } from '../utils/keyStorage';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeyUpdated }) => {
  const [key, setKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (isOpen) {
      const storedKey = getApiKey();
      setKey(storedKey || '');
    }
  }, [isOpen]);

  const handleManualSave = () => {
    if (!key) return;
    saveApiKey(key);
    setVaultActivated(true);
    onKeyUpdated();
    setStatus('success');
    setTimeout(() => {
      setStatus('idle');
      onClose();
    }, 800);
  };

  const handleClear = () => {
    removeApiKey();
    setKey('');
    onKeyUpdated();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-dark-800 border border-gray-700 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">⚙️</span> API Settings
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Manual Entry Only */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Manual API Key Entry</label>
              <input 
                type="text" 
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-dark-900 border border-gray-700 rounded-xl p-4 text-sm text-white font-mono focus:border-banana-500 outline-none transition-colors"
              />
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleManualSave}
                  disabled={!key}
                  className="w-full py-4 bg-banana-500 hover:bg-banana-400 text-dark-900 rounded-xl text-sm font-black transition-all disabled:opacity-20 shadow-lg shadow-banana-500/10"
                >
                  Apply API Key
                </button>
                
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-center py-2 text-[11px] font-bold text-gray-400 hover:text-banana-400 transition-colors flex items-center justify-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  API 키 발급받기
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700 flex justify-between items-center">
            <button 
              onClick={handleClear}
              className="text-[10px] font-bold text-red-500 hover:opacity-70 transition-opacity uppercase tracking-wider"
            >
              Reset All Settings
            </button>
            {status === 'success' && (
              <span className="text-[10px] font-bold text-green-500 animate-pulse">Saved Successfully!</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
