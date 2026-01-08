
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ResultGrid } from './components/ResultGrid';
import { ApiKeyModal } from './components/ApiKeyModal';
import { HistoryPanel } from './components/HistoryPanel';
import { ImageOverlay } from './components/ImageOverlay';
import { ModelType, GeneratedScene, AspectRatio, TitleData, ImageResolution, HistoryItem } from './types';
import { generateStoryStructure, generateSceneImage, generateTitles } from './services/geminiService';
import { hasStoredApiKey, isVaultActivated, setVaultActivated } from './utils/keyStorage';

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

  const checkKeyStatus = async () => {
    // 환경 변수에 키가 있으면 항상 활성화된 것으로 간주
    if (process.env.API_KEY) {
      setIsKeyActive(true);
      return;
    }

    const activated = isVaultActivated();
    const hasManual = hasStoredApiKey();
    let hasProject = false;
    
    if (window.aistudio) {
      try {
        hasProject = await window.aistudio.hasSelectedApiKey();
      } catch (e) {
        console.warn("Native API check failed", e);
      }
    }

    // Vault가 활성화되어 있거나 이미 키가 수동으로 설정된 경우
    setIsKeyActive(activated && (hasManual || hasProject));
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

  const ensureKey = (): boolean => {
    if (isKeyActive) return true;
    setIsApiKeyModalOpen(true);
    return false;
  };

  const handleGenerateStoryboard = async () => {
    if (!ensureKey()) return;
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

      // Generate scene images in parallel but update state carefully
      initializedScenes.forEach(async (scene, index) => {
        try {
          const imageUrl = await generateSceneImage(selectedModel, scene.imagePrompt, selectedAspectRatio, selectedResolution, referenceImage);
          
          setScenes(prev => {
            if (prev.length === 0) return prev; // Avoid updating if cleared
            const newScenes = [...prev];
            if (newScenes[index]) {
              newScenes[index] = { ...newScenes[index], imageUrl, isLoading: false };
            }
            return newScenes;
          });
          
          addToHistory(imageUrl, 'image', scene.imagePrompt);
        } catch (error: any) {
          console.error(`Render error for scene ${index}:`, error);
          if (error.message?.includes("Requested entity was not found")) {
            setVaultActivated(false);
            setIsKeyActive(false);
            setIsApiKeyModalOpen(true);
          }
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
      if (error.message?.includes("Requested entity was not found")) {
        setVaultActivated(false);
        setIsKeyActive(false);
        setIsApiKeyModalOpen(true);
      }
      setIsGeneratingStory(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateScene = async (index: number, newPrompt: string) => {
     if (!ensureKey()) return;
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
         if (error.message?.includes("Requested entity was not found")) {
            setVaultActivated(false);
            setIsKeyActive(false);
            setIsApiKeyModalOpen(true);
         }
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
        onOpenApiSettings={() => setIsApiKeyModalOpen(true)}
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
