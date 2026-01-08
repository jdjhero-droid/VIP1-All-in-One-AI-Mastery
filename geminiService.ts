
import { GoogleGenAI, Type } from "@google/genai";
import { ModelType, AspectRatio, StoryGenerationResult, TitleData, ImageResolution } from "./types";

declare const process: {
  env: {
    API_KEY?: string;
  };
};

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Requested entity was not found.");
  }
  return new GoogleGenAI({ apiKey });
};

export const translateToVeoPrompt = async (koreanInput: string, referenceImageBase64: string | null): Promise<{ english: string; korean: string }> => {
  const ai = getAIClient();
  const schema = {
    type: Type.OBJECT,
    properties: {
      english: { type: Type.STRING, description: "Optimized English prompt for Google Veo 3" },
      korean: { type: Type.STRING, description: "Accurate and evocative Korean translation of the English prompt" }
    },
    required: ["english", "korean"]
  };

  const systemInstruction = `당신은 세계 최고의 AI 영상 감독이자 프롬프트 엔지니어입니다.
사용자의 요청과 업로드된 이미지를 분석하여 Google Veo 3 모델용 시네마틱 I2V 프롬프트를 생성하세요.
결과물 'english' 프롬프트 마지막에는 반드시 "There is no slow motion, and the scene unfolds quickly."를 추가하세요.`;

  const parts: any[] = [];
  if (referenceImageBase64) {
    const cleanData = referenceImageBase64.split(',')[1] || referenceImageBase64;
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanData } });
  }
  parts.push({ text: `Analyze and create a video prompt: "${koreanInput}"` });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: { 
        systemInstruction, 
        temperature: 0.8,
        responseMimeType: "application/json",
        responseSchema: schema
      },
    });
    return response.text ? JSON.parse(response.text) : { english: "", korean: "" };
  } catch (error) {
    console.error("Veo Translation Error:", error);
    throw error;
  }
};

export const generateStoryStructure = async (topic: string, referenceImageBase64: string | null, sceneCount: number = 10): Promise<StoryGenerationResult> => {
  const ai = getAIClient();
  const sceneSchema = {
    type: Type.OBJECT,
    properties: {
      scenes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sceneNumber: { type: Type.INTEGER },
            description: { type: Type.STRING },
            imagePrompt: { type: Type.STRING },
            i2vPrompt: { type: Type.STRING },
          },
          required: ["sceneNumber", "description", "imagePrompt", "i2vPrompt"],
        },
      },
      titles: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: { english: { type: Type.STRING }, korean: { type: Type.STRING } },
          required: ["english", "korean"]
        }
      },
      musicPrompt: { type: Type.STRING },
      lyrics: { type: Type.STRING },
      lyricsKorean: { type: Type.STRING }
    },
    required: ["scenes", "titles", "musicPrompt", "lyrics", "lyricsKorean"],
  };

  const systemInstruction = `당신은 전설적인 음악 프로듀서이자 스토리보드 작가입니다.
주제에 맞춰 빌보드 스타일의 음악과 시각적 서사를 만드세요.
모든 i2vPrompt 마지막에는 "There is no slow motion, and the scene unfolds quickly."를 추가하세요.`;

  const parts: any[] = [];
  if (referenceImageBase64) {
    const cleanBase64 = referenceImageBase64.split(',')[1] || referenceImageBase64;
    parts.push({ inlineData: { mimeType: "image/jpeg", data: cleanBase64 } });
  }
  parts.push({ text: `Create a story and music production for: ${topic}` });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts },
      config: { systemInstruction, responseMimeType: "application/json", responseSchema: sceneSchema, temperature: 0.7 },
    });
    const parsed = JSON.parse(response.text || "{}");
    return {
      ...parsed,
      scenes: (parsed.scenes || []).map((s: any) => ({
        ...s,
        i2vPrompt: s.i2vPrompt.endsWith("quickly.") ? s.i2vPrompt : `${s.i2vPrompt} There is no slow motion, and the scene unfolds quickly.`
      }))
    };
  } catch (error) {
    console.error("Story Generation Error:", error);
    throw error;
  }
};

export const generateTitles = async (topic: string): Promise<TitleData[]> => {
  const ai = getAIClient();
  const schema = {
    type: Type.OBJECT,
    properties: {
      titles: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: { english: { type: Type.STRING }, korean: { type: Type.STRING } },
          required: ["english", "korean"]
        }
      }
    },
    required: ["titles"]
  };
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate 10 SEO titles for: ${topic}`,
    config: { responseMimeType: "application/json", responseSchema: schema },
  });
  return JSON.parse(response.text || '{"titles":[]}').titles;
};

export const generateSceneImage = async (modelType: ModelType, prompt: string, aspectRatio: AspectRatio, resolution: ImageResolution = '1K', referenceImageBase64: string | null = null): Promise<string> => {
  const ai = getAIClient();
  const model = modelType === ModelType.NanoBananaPro ? "gemini-3-pro-image-preview" : "gemini-2.5-flash-image";
  const parts: any[] = [];
  if (referenceImageBase64) {
    const cleanData = referenceImageBase64.split(',')[1] || referenceImageBase64;
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanData } });
  }
  parts.push({ text: prompt });
  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: { imageConfig: { aspectRatio, imageSize: modelType === ModelType.NanoBananaPro ? resolution : undefined } }
  });
  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (part?.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  throw new Error("Failed to produce image.");
};
