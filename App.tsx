
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ResultGrid } from './components/ResultGrid';
import { ApiKeyModal } from './components/ApiKeyModal';
import { HistoryPanel } from './components/HistoryPanel';
import { ImageOverlay } from './components/ImageOverlay';
import { ModelType, GeneratedScene, AspectRatio, TitleData, ImageResolution, HistoryItem } from './types';
import { generateStoryStructure, generateSceneImage, generateTitles } from './geminiService';

const App: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.NanoBanana);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>('16:9');
  const [selectedResolution, setSelectedResolution] = useState<ImageResolution>('1K');
  const [sceneCount, setSceneCount] = useState<number>(10);
  const [scenes, setScenes] = useState<GeneratedScene[]>([]);
  const [titles, setTitles] = useState<TitleData[]>([]);
  const [musicPrompt, setMusicPrompt] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [lyricsKorean, setLyricsKorean] = useState<string | null>(null);
  const [magicPrompt, setMagicPrompt] = useState<{ english: string; korean: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isRegeneratingTitles, setIsRegeneratingTitles] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isKeyActive, setIsKeyActive] = useState(false);

  useEffect(() => {
    checkKeyStatus();
    const saved = localStorage.getItem('wt_history');
    if (saved) setHistoryItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('wt_history', JSON.stringify(historyItems));
  }, [historyItems]);

  const checkKeyStatus = async () => {
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setIsKeyActive(hasKey);
    } else if (process.env.API_KEY) {
      setIsKeyActive(true);
    }
  };

  const ensureKey = async () => {
    if (isKeyActive) return true;
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setIsKeyActive(true);
      return true;
    }
    setIsApiKeyModalOpen(true);
    return false;
  };

  const handleGenerateStoryboard = async () => {
    if (!(await ensureKey()) || !topic) return;
    setIsGenerating(true);
    setIsGeneratingStory(true);
    setScenes([]);
    try {
      const result = await generateStoryStructure(topic, referenceImage, sceneCount);
      setScenes(result.scenes.map(s => ({ ...s, isLoading: true })));
      setTitles(result.titles);
      setMusicPrompt(result.musicPrompt);
      setLyrics(result.lyrics);
      setLyricsKorean(result.lyricsKorean);
      setIsGeneratingStory(false);

      result.scenes.forEach(async (scene, index) => {
        try {
          const url = await generateSceneImage(selectedModel, scene.imagePrompt, selectedAspectRatio, selectedResolution, referenceImage);
          setScenes(prev => {
            const next = [...prev];
            if (next[index]) next[index] = { ...next[index], imageUrl: url, isLoading: false };
            return next;
          });
          setHistoryItems(h => [{ id: Date.now().toString(), type: 'image', url, prompt: scene.imagePrompt, timestamp: Date.now() }, ...h].slice(0, 50));
        } catch (e) {
          console.error(e);
          setScenes(prev => {
            const next = [...prev];
            if (next[index]) next[index] = { ...next[index], isLoading: false, error: "Fail" };
            return next;
          });
        }
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
      setIsGeneratingStory(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-dark-900 text-white overflow-hidden font-sans">
      <Sidebar 
        selectedModel={selectedModel} onModelSelect={setSelectedModel}
        selectedAspectRatio={selectedAspectRatio} onAspectRatioSelect={setSelectedAspectRatio}
        selectedResolution={selectedResolution} onResolutionSelect={setSelectedResolution}
        sceneCount={sceneCount} onSceneCountChange={setSceneCount}
        topic={topic} onTopicChange={setTopic}
        referenceImage={referenceImage} onImageUpload={setReferenceImage}
        onGenerate={handleGenerateStoryboard} isGenerating={isGenerating}
        onOpenApiSettings={() => window.aistudio?.openSelectKey() || setIsApiKeyModalOpen(true)}
        apiKeySet={isKeyActive} onMagicPromptUpdate={setMagicPrompt}
      />
      <ResultGrid 
        scenes={scenes} titles={titles} musicPrompt={musicPrompt}
        lyrics={lyrics} lyricsKorean={lyricsKorean} magicPrompt={magicPrompt}
        isGeneratingStory={isGeneratingStory}
        onRegenerate={async (idx, prompt) => {
           const url = await generateSceneImage(selectedModel, prompt, selectedAspectRatio, selectedResolution, referenceImage);
           setScenes(prev => {
             const next = [...prev];
             if (next[idx]) next[idx] = { ...next[idx], imageUrl: url, imagePrompt: prompt };
             return next;
           });
        }}
        onSetAsReference={setReferenceImage}
      />
      <HistoryPanel items={historyItems} onSelectItem={setSelectedHistoryItem} onClear={() => setHistoryItems([])} />
      <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={() => setIsApiKeyModalOpen(false)} onKeyUpdated={checkKeyStatus} />
      <ImageOverlay item={selectedHistoryItem} onClose={() => setSelectedHistoryItem(null)} />
    </div>
  );
};

export default App;
