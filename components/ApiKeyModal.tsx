import React from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeyUpdated }) => {
  if (!isOpen) return null;

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      onKeyUpdated();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-dark-800 border border-gray-700 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">⚙️</span> Project Settings
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-sm text-gray-400 leading-relaxed">
                Gemini 3 Pro 및 Veo 모델을 사용하려면 유료 Google Cloud 프로젝트의 API 키가 필요합니다. 아래 버튼을 눌러 프로젝트를 선택해 주세요.
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleSelectKey}
                  className="w-full py-4 bg-banana-500 hover:bg-banana-400 text-dark-900 rounded-xl text-sm font-black transition-all shadow-lg shadow-banana-500/10"
                >
                  Select API Key Project
                </button>
                
                <a 
                  href="https://ai.google.dev/gemini-api/docs/billing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-center py-2 text-[11px] font-bold text-gray-400 hover:text-banana-400 transition-colors flex items-center justify-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Billing Documentation
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
