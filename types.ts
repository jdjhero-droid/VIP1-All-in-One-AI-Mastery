
export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
export type ImageResolution = '1K' | '2K' | '4K';

export enum ModelType {
  NanoBanana = 'NanoBanana', // gemini-2.5-flash-image
  NanoBananaPro = 'NanoBananaPro' // gemini-3-pro-image-preview
}

export interface TitleData {
  english: string;
  korean: string;
}

export interface SceneData {
  sceneNumber: number;
  description: string; // Korean narrative
  imagePrompt: string; // English prompt for generation
  i2vPrompt: string; // English I2V technical prompt
}

export interface GeneratedScene extends SceneData {
  imageUrl?: string;
  isLoading: boolean;
  error?: string;
}

export interface StoryGenerationResult {
  scenes: SceneData[];
  titles: TitleData[];
  musicPrompt: string;
  lyrics: string;
  lyricsKorean: string;
}

export interface HistoryItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  timestamp: number;
  prompt: string;
}

export interface AppState {
  apiKey: string;
  topic: string;
  referenceImage: string | null; // Base64
  selectedModel: ModelType;
  isGeneratingStory: boolean;
  scenes: GeneratedScene[];
  titles: TitleData[];
  isApiKeyModalOpen: boolean;
}

// Add global declaration for AI Studio
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}
