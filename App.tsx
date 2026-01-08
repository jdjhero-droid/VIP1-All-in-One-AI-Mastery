import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ResultGrid } from './components/ResultGrid';
import { ApiKeyModal } from './components/ApiKeyModal';
import { HistoryPanel } from './components/HistoryPanel';
import { ImageOverlay } from './components/ImageOverlay';
import { ModelType, GeneratedScene, AspectRatio, TitleData, ImageResolution, HistoryItem } from './types';
import { generateStoryStructure, generateSceneImage, generateTitles } from './services/geminiService';

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

  // History State
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
  
  // Ref to track latest history to avoid stale closures and unnecessary re-renders
  const historyItemsRef = useRef<HistoryItem[]>([]);

  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isKeyActive, setIsKeyActive] = useState(false);

  useEffect(() => {
    checkKeyStatus();
    const savedHistory = localStorage.getItem('wt_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistoryItems(parsed);
        historyItemsRef.current = parsed;
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save history to localStorage more efficiently
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('wt_history', JSON.stringify(historyItems));
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [historyItems]);

  /**
   * AI Studio 지침에 따른 API 키 상태 확인
   */
  const checkKeyStatus = async () => {
    if (window.aistudio) {
      try {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsKeyActive(hasKey);
      } catch (e) {
        console.warn("Native API check failed", e);
      }
    } else if (process.env.API_KEY) {
      setIsKeyActive(true);
    }
  };

  const addToHistory = useCallback((url: string, type: 'image' | 'video', prompt: string) => {
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      url,
      type,
      prompt,
      timestamp: Date.now()
    };
    setHistoryItems(prev => {
      const updated = [newItem, ...prev].slice(0, 100);
      historyItemsRef.current = updated;
      return updated;
    });
  }, []);

  /**
   * API 키 선택 다이얼로그를 엽니다.
   */
  const ensureKey = async (): Promise<boolean> => {
    if (isKeyActive) return true;
    
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // 지침: openSelectKey 호출 후 즉시 성공으로 가정하고 진행합니다.
      setIsKeyActive(true);
      return true;
    }
    
    setIsApiKeyModalOpen(true);
    return false;
  };

  /**
   * 'Requested entity was not found' 에러 발생 시 키 선택 상태를 초기화합니다.
   */
  const handleApiError = async (error: any) => {
    if (error.message?.includes("Requested entity was not found")) {
      setIsKeyActive(false);
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        setIsKeyActive(true);
      } else {
        setIsApiKeyModalOpen(true);
      }
      return true;
    }
    return false;
  };

  const handleGenerateStoryboard = async () => {
    if (!(await ensureKey())) return;
    if (!topic) return;

    setIsGenerating(true);
    setIsGeneratingStory(true);
    setScenes([]);
    setTitles([]);
    setMusicPrompt(null);
    setLyrics(null);
    setLyricsKorean(null);
    setMagicPrompt(null);

    try {
      const result = await generateStoryStructure(topic, referenceImage, sceneCount);
      const initializedScenes: GeneratedScene[] = result.scenes.map(s => ({ ...s, isLoading: true }));
      setScenes(initializedScenes);
      setTitles(result.titles);
      setMusicPrompt(result.musicPrompt);
      setLyrics(result.lyrics);
      setLyricsKorean(result.lyricsKorean);
      setIsGeneratingStory(false);

      // Generate scene images in parallel
      initializedScenes.forEach(async (scene, index) => {
        try {
          const imageUrl = await generateSceneImage(selectedModel, scene.imagePrompt, selectedAspectRatio, selectedResolution, referenceImage);
          
          setScenes(prev => {
            if (prev.length === 0) return prev;
            const newScenes = [...prev];
            if (newScenes[index]) {
              newScenes[index] = { ...newScenes[index], imageUrl, isLoading: false };
            }
            return newScenes;
          });
          
          addToHistory(imageUrl, 'image', scene.imagePrompt);
        } catch (error: any) {
          console.error(`Render error for scene ${index}:`, error);
          await handleApiError(error);
          setScenes(prev => {
            if (prev.length === 0) return prev;
            const newScenes = [...prev];
            if (newScenes[index]) {
              newScenes[index] = { ...newScenes[index], isLoading: false, error: 'Render Error' };
            }
            return newScenes;
          });
        }
      });
    } catch (error: any) {
      console.error("Storyboard generation failed:", error);
      await handleApiError(error);
      setIsGeneratingStory(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateScene = async (index: number, newPrompt: string) => {
     if (!(await ensureKey())) return;
     setScenes(prev => {
         const newScenes = [...prev];
         if (newScenes[index]) {
             newScenes[index] = { ...newScenes[index], imagePrompt: newPrompt, isLoading: true, error: undefined, imageUrl: undefined };
         }
         return newScenes;
     });
     try {
         const imageUrl = await generateSceneImage(selectedModel, newPrompt, selectedAspectRatio, selectedResolution, referenceImage);
         setScenes(prev => {
            const newScenes = [...prev];
            if (newScenes[index]) newScenes[index] = { ...newScenes[index], imageUrl, isLoading: false };
            return newScenes;
         });
         addToHistory(imageUrl, 'image', newPrompt);
     } catch (error: any) {
         await handleApiError(error);
         setScenes(prev => {
            const newScenes = [...prev];
            if (newScenes[index]) newScenes[index] = { ...newScenes[index], isLoading: false, error: 'Retry Failed' };
            return newScenes;
         });
     }
  };

  return (
    <div className="flex h-screen w-screen bg-dark-900 text-white overflow-hidden font-sans">
      <Sidebar 
        selectedModel={selectedModel}
        onModelSelect={setSelectedModel}
        selectedAspectRatio={selectedAspectRatio}
        onAspectRatioSelect={setSelectedAspectRatio}
        selectedResolution={selectedResolution}
        onResolutionSelect={setSelectedResolution}
        sceneCount={sceneCount}
        onSceneCountChange={setSceneCount}
        topic={topic}
        onTopicChange={setTopic}
        referenceImage={referenceImage}
        onImageUpload={setReferenceImage}
        onGenerate={handleGenerateStoryboard}
        isGenerating={isGenerating}
        onOpenApiSettings={() => window.aistudio?.openSelectKey() || setIsApiKeyModalOpen(true)}
        apiKeySet={isKeyActive}
        onMagicPromptUpdate={setMagicPrompt}
      />
      <ResultGrid 
        scenes={scenes}
        titles={titles}
        musicPrompt={musicPrompt}
        lyrics={lyrics}
        lyricsKorean={lyricsKorean}
        magicPrompt={magicPrompt}
        isGeneratingStory={isGeneratingStory}
        onRegenerate={handleRegenerateScene}
        onSetAsReference={setReferenceImage}
        onRegenerateTitles={async () => {
            setIsRegeneratingTitles(true);
            try { 
              const newTitles = await generateTitles(topic);
              setTitles(newTitles); 
            } catch (e) {
              console.error("Failed to regenerate titles", e);
              await handleApiError(e);
            } finally { 
              setIsRegeneratingTitles(false); 
            }
        }}
        isRegeneratingTitles={isRegeneratingTitles}
      />
      <HistoryPanel 
        items={historyItems}
        onSelectItem={setSelectedHistoryItem}
        onClear={() => setHistoryItems([])}
      />
      <ApiKeyModal 
        isOpen={isApiKeyModalOpen} 
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeyUpdated={checkKeyStatus}
      />
      <ImageOverlay 
        item={selectedHistoryItem}
        onClose={() => setSelectedHistoryItem(null)}
      />
    </div>
  );
};

export default App;
