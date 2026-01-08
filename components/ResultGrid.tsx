
import React, { useState, useMemo } from 'react';
import { GeneratedScene, TitleData } from '../types';

interface ResultGridProps {
  scenes: GeneratedScene[];
  titles?: TitleData[];
  musicPrompt?: string | null;
  lyrics?: string | null;
  lyricsKorean?: string | null;
  magicPrompt?: { english: string; korean: string } | null;
  isGeneratingStory: boolean;
  onRegenerate: (index: number, newPrompt: string) => void;
  onSetAsReference: (imageUrl: string) => void;
  // Title Regeneration Props
  onRegenerateTitles?: () => void;
  isRegeneratingTitles?: boolean;
}

export const ResultGrid: React.FC<ResultGridProps> = ({ 
  scenes, 
  titles = [], 
  musicPrompt,
  lyrics,
  lyricsKorean,
  magicPrompt,
  isGeneratingStory, 
  onRegenerate,
  onSetAsReference,
  onRegenerateTitles,
  isRegeneratingTitles
}) => {
  const [editingScene, setEditingScene] = useState<{ index: number; prompt: string } | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    scenes.filter(s => s.imageUrl).forEach((s, i) => {
      setTimeout(() => downloadImage(s.imageUrl!, `Scene_${s.sceneNumber}.png`), i * 500);
    });
  };

  const showStorySection = useMemo(() => !!(scenes.length > 0 || isGeneratingStory || magicPrompt), [scenes.length, isGeneratingStory, magicPrompt]);

  if (!showStorySection) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-600 p-10 bg-dark-900">
        <div className="w-20 h-20 mb-6 opacity-20">
            <svg fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" /></svg>
        </div>
        <h2 className="text-xl font-bold mb-2 text-white">No Content Generated Yet</h2>
        <p className="text-center max-w-sm">Upload an image and type a topic in the sidebar to start your creative storyboard journey.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto relative scrollbar-hide bg-dark-900" style={{ contain: 'content' }}>
      <div className="max-w-7xl mx-auto pb-20 space-y-16">
        
        {/* MAGIC PROMPT RESULT (If exists) */}
        {magicPrompt && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="p-6 bg-indigo-900/30 border-b border-indigo-500/20 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-3 italic">
                  <span className="bg-indigo-500 p-2 rounded-xl text-dark-900 shadow-lg">✨</span>
                  Magic Prompt Result
                </h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleCopy(magicPrompt.english, 'magic-prompt-en')}
                    className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/30 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    {copyFeedback === 'magic-prompt-en' ? 'COPIED EN!' : 'Copy EN Prompt'}
                  </button>
                  <button 
                    onClick={() => handleCopy(magicPrompt.korean, 'magic-prompt-ko')}
                    className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/30 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    {copyFeedback === 'magic-prompt-ko' ? 'COPIED KO!' : 'Copy KO Translation'}
                  </button>
                </div>
              </div>
              <div className="p-10 space-y-8">
                {/* English Optimized Prompt */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Veo Optimized (English)</span>
                  </div>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2rem] blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200"></div>
                    <pre className="relative bg-black/60 p-8 rounded-[1.5rem] text-lg text-indigo-100 whitespace-pre-wrap font-mono border border-white/5 leading-relaxed tracking-tight">
                      {magicPrompt.english}
                    </pre>
                  </div>
                </div>

                {/* Korean Translation */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Korean Translation (한국어)</span>
                  </div>
                  <div className="bg-dark-800/40 p-8 rounded-[1.5rem] border border-white/5">
                    <p className="text-gray-300 text-sm leading-loose font-sans italic">
                      {magicPrompt.korean}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3 text-indigo-400/60">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   <p className="text-xs font-medium">This prompt is optimized for Google Veo. Copy and paste it into the Cinema Lab to generate your video.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STORYBOARD CUTS */}
        {(scenes.length > 0 || isGeneratingStory) && (
            <div key="story-section" className="space-y-8 animate-in fade-in duration-700">
                 <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-3">
                        <h2 className="text-3xl font-bold text-white tracking-tight">Storyboard Cuts</h2>
                        <span className="text-banana-500 font-mono text-sm font-bold bg-banana-500/10 px-2 py-0.5 rounded border border-banana-500/20">{scenes.length}</span>
                    </div>
                    {scenes.some(s => s.imageUrl) && (
                        <button 
                            onClick={handleDownloadAll} 
                            className="px-5 py-2.5 bg-dark-800 hover:bg-dark-700 border border-gray-700 rounded-xl text-sm text-gray-300 font-bold flex items-center gap-2 transition-all hover:border-banana-500 hover:text-white"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003 3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Batch Export
                        </button>
                    )}
                </div>

                {isGeneratingStory && scenes.length === 0 ? (
                     <div className="py-24 flex flex-col items-center justify-center bg-dark-800 rounded-3xl border border-dashed border-gray-700 animate-pulse">
                        <div className="w-12 h-12 border-4 border-banana-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                        <p className="text-banana-500 text-lg font-bold">Drafting Visual Narrative...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {scenes.map((scene, index) => (
                            <div 
                              key={`scene-${index}-${scene.sceneNumber}`} 
                              className="bg-dark-800 rounded-3xl overflow-hidden border border-gray-800 flex flex-col group transition-all hover:border-gray-600 hover:shadow-2xl shadow-black h-full"
                            >
                                <div className="aspect-video bg-black relative flex items-center justify-center overflow-hidden">
                                    {scene.imageUrl ? (
                                        <>
                                            <img src={scene.imageUrl} alt={`Scene ${scene.sceneNumber}`} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-6">
                                                <button 
                                                    onClick={() => downloadImage(scene.imageUrl!, `Scene_${scene.sceneNumber}.png`)}
                                                    className="p-4 bg-white/10 backdrop-blur-md rounded-2xl text-white hover:bg-banana-500 hover:text-dark-900 transition-all transform translate-y-4 group-hover:translate-y-0 shadow-xl border border-white/20"
                                                    title="Download Cut"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                </button>
                                                <button 
                                                    onClick={() => setEditingScene({ index, prompt: scene.imagePrompt })}
                                                    className="p-4 bg-white/10 backdrop-blur-md rounded-2xl text-white hover:bg-banana-500 hover:text-dark-900 transition-all transform translate-y-4 group-hover:translate-y-0 shadow-xl border border-white/20 delay-[50ms]"
                                                    title="Regenerate This Scene"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                </button>
                                                <button 
                                                    onClick={() => onSetAsReference(scene.imageUrl!)}
                                                    className="p-4 bg-white/10 backdrop-blur-md rounded-2xl text-white hover:bg-banana-500 hover:text-dark-900 transition-all transform translate-y-4 group-hover:translate-y-0 shadow-xl border border-white/20 delay-[100ms]"
                                                    title="Set as New Reference"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </>
                                    ) : scene.isLoading ? (
                                        <div className="flex flex-col items-center">
                                            <div className="w-8 h-8 border-2 border-banana-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                                            <span className="text-xs text-banana-500 font-mono tracking-widest uppercase">Rendering...</span>
                                        </div>
                                    ) : scene.error ? (
                                        <p className="text-red-500 text-xs text-center px-6 font-medium">{scene.error}</p>
                                    ) : null}
                                    <div className="absolute top-4 left-4 px-3 py-1 bg-black/80 text-xs font-black rounded-lg backdrop-blur-md pointer-events-none text-banana-400 border border-white/10 z-10">
                                        CUT {scene.sceneNumber}
                                    </div>
                                </div>
                                <div className="p-6 flex flex-col gap-4 flex-1 bg-dark-800">
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2">Narrative Arc</p>
                                        <p className="text-sm text-gray-300 line-clamp-3 leading-relaxed font-medium">{scene.description}</p>
                                    </div>
                                    <div className="mt-auto pt-4 border-t border-gray-700/50">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-[10px] text-banana-500 font-black uppercase tracking-[0.2em]">I2V Directives</p>
                                            {copyFeedback === `i2v-${index}` && (
                                                <span className="text-[8px] text-green-400 font-bold animate-pulse">COPIED!</span>
                                            )}
                                        </div>
                                        <div 
                                            onClick={() => handleCopy(scene.i2vPrompt, `i2v-${index}`)} 
                                            className="text-[10px] text-green-400/90 font-mono block bg-black/60 p-3 rounded-xl cursor-pointer hover:bg-black/90 transition-all border border-white/5 hover:border-banana-500/50 group/motion relative"
                                            title="Click to copy technical prompt"
                                        >
                                            <span className="opacity-70 group-hover/motion:opacity-100 break-words">{scene.i2vPrompt}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* TITLES SECTION */}
                {titles.length > 0 && (
                    <div key="titles-section" className="mt-20 border-t border-gray-800 pt-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                                🔍 YouTube SEO Optimized Titles
                            </h2>
                            {onRegenerateTitles && (
                                <button 
                                    onClick={onRegenerateTitles} 
                                    disabled={isRegeneratingTitles}
                                    className="text-xs text-gray-500 hover:text-white transition-colors underline underline-offset-4 disabled:opacity-50"
                                >
                                    {isRegeneratingTitles ? 'Generating New Hooks...' : 'Regenerate All Titles'}
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {titles.map((t, i) => (
                                <div 
                                    key={`title-${i}`} 
                                    className="p-5 bg-gray-800/20 border border-gray-800 rounded-2xl group hover:border-banana-500 hover:bg-gray-800/40 transition-all cursor-pointer shadow-lg active:scale-[0.98]" 
                                    onClick={() => handleCopy(`${t.english}\n${t.korean}`, `title-${i}`)}
                                >
                                    <div className="flex items-start gap-4">
                                        <span className="text-gray-600 font-black text-xs pt-1">{String(i + 1).padStart(2, '0')}</span>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <p className="text-white font-bold text-lg group-hover:text-banana-400 transition-colors leading-tight">{t.english}</p>
                                                {copyFeedback === `title-${i}` && <span className="text-[8px] text-green-400 font-bold ml-2">COPIED</span>}
                                            </div>
                                            <p className="text-gray-500 text-sm mt-2 font-medium">{t.korean}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* MUSIC PRODUCER SECTION */}
                {(musicPrompt || lyrics) && (
                    <div key="music-section" className="mt-20 bg-indigo-950/20 border border-indigo-500/30 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="p-6 bg-indigo-900/30 border-b border-indigo-500/20 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                <span className="bg-indigo-500 p-2 rounded-xl text-dark-900">🎵</span>
                                Producer's Billboard Strategy
                            </h2>
                        </div>
                        <div className="p-8 space-y-12">
                            {/* Directive Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                                        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em]">Production Directive</h3>
                                    </div>
                                    <button 
                                        onClick={() => handleCopy(musicPrompt || '', 'music-prompt')}
                                        className="text-[10px] text-indigo-400/50 hover:text-indigo-400 underline font-bold"
                                    >
                                        {copyFeedback === 'music-prompt' ? 'COPIED!' : 'COPY PROMPT'}
                                    </button>
                                </div>
                                <div className="relative group">
                                    <pre className="bg-black/50 p-6 rounded-[1.5rem] text-sm text-gray-300 whitespace-pre-wrap font-mono border border-white/5 leading-relaxed group-hover:border-indigo-500/30 transition-colors">
                                        {musicPrompt}
                                    </pre>
                                </div>
                            </div>

                            {/* Lyrics Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                                    <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em]">Top-Liner Bilingual Lyrics</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="relative group flex flex-col">
                                        <div className="flex justify-between items-center mb-2 px-4">
                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">English</span>
                                            <button onClick={() => handleCopy(lyrics || '', 'lyrics-en')} className="text-[9px] text-gray-600 hover:text-white transition-colors">COPY</button>
                                        </div>
                                        <pre className="flex-1 bg-black/50 p-6 rounded-[1.5rem] text-sm text-gray-300 whitespace-pre-wrap font-mono border border-white/5 max-h-[500px] overflow-y-auto scrollbar-hide leading-loose group-hover:border-indigo-500/30 transition-colors">
                                            {lyrics}
                                        </pre>
                                    </div>
                                    <div className="relative group flex flex-col">
                                        <div className="flex justify-between items-center mb-2 px-4">
                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Korean (한국어)</span>
                                            <button onClick={() => handleCopy(lyricsKorean || '', 'lyrics-ko')} className="text-[9px] text-gray-600 hover:text-white transition-colors">COPY</button>
                                        </div>
                                        <pre className="flex-1 bg-black/50 p-6 rounded-[1.5rem] text-sm text-gray-300 whitespace-pre-wrap font-sans border border-white/5 max-h-[500px] overflow-y-auto scrollbar-hide leading-loose group-hover:border-indigo-500/30 transition-colors">
                                            {lyricsKorean}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>

      {editingScene && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6 animate-in fade-in duration-300">
              <div className="bg-dark-800 p-8 rounded-[2rem] border border-gray-700 w-full max-w-2xl shadow-3xl" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-3 mb-6">
                      <div className="bg-banana-500 p-2 rounded-lg text-dark-900 font-black text-xs">AI</div>
                      <h3 className="text-2xl font-bold text-white">Adjust Visual Prompt</h3>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 font-medium leading-relaxed">
                      Modify the visual directives for Cut {editingScene.index + 1}. The AI will use this prompt to regenerate the frame while maintaining storyboard consistency.
                  </p>
                  <textarea 
                    autoFocus
                    value={editingScene.prompt} 
                    onChange={(e) => setEditingScene({...editingScene, prompt: e.target.value})} 
                    className="w-full h-48 bg-black/40 border border-gray-700 rounded-2xl p-5 text-sm text-white font-mono mb-8 resize-none focus:outline-none focus:border-banana-500 transition-all placeholder-gray-600"
                    placeholder="Describe specific visual changes..."
                  />
                  <div className="flex justify-end gap-4">
                      <button 
                        onClick={() => setEditingScene(null)} 
                        className="px-6 py-3 text-gray-400 hover:text-white font-bold transition-colors"
                      >
                        Discard
                      </button>
                      <button 
                        onClick={() => { onRegenerate(editingScene.index, editingScene.prompt); setEditingScene(null); }} 
                        className="px-10 py-3 bg-banana-500 text-dark-900 font-black rounded-xl hover:bg-banana-400 transition-all shadow-xl shadow-banana-500/10 active:scale-95"
                      >
                        Regenerate Frame
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
