
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ModelType, AspectRatio, StoryGenerationResult, TitleData, ImageResolution } from "../types";
import { getApiKey } from "../utils/keyStorage";

// TypeScript에서 process를 인식하도록 전역 타입 보완
declare const process: {
  env: {
    API_KEY?: string;
  };
};

/**
 * AI Client Factory
 * 안전하게 API 키를 획득합니다.
 */
const getAIClient = () => {
  // 지침에 따라 process.env.API_KEY를 최우선으로 사용합니다.
  const envKey = typeof process !== 'undefined' ? process.env?.API_KEY : null;
  const apiKey = envKey || getApiKey();
  
  if (!apiKey) {
    throw new Error("API_KEY_MISSING: API 키를 설정하거나 프로젝트를 선택해주세요.");
  }
  
  return new GoogleGenAI({ apiKey });
};

/**
 * Veo 전용 프롬프트 변환기 (한국어 + 이미지 분석 -> 최적화된 영어 영상 프롬프트 + 한국어 번역)
 */
export const translateToVeoPrompt = async (koreanInput: string, referenceImageBase64: string | null): Promise<{ english: string; korean: string }> => {
  const ai = getAIClient();
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      english: { type: Type.STRING, description: "Optimized English prompt for Google Veo 3" },
      korean: { type: Type.STRING, description: "Accurate and evocative Korean translation of the English prompt" }
    },
    required: ["english", "korean"]
  };

  const systemInstruction = `
    당신은 세계 최고의 AI 영상 감독이자 프롬프트 엔지니어입니다.
    사용자의 요청과 업로드된 이미지를 분석하여 Google Veo 3 모델용 시네마틱 I2V(Image-to-Video) 프롬프트를 생성하세요.

    핵심 지침:
    1. 업로드된 이미지가 제공되면, 이미지 속 인물의 얼굴, 의상, 배경 및 전체적인 스타일을 완벽하게 분석하고 이를 영상 프롬프트에 반영하세요.
    2. 특별한 지시가 없는 한, 이미지 속의 대상(Subject)의 외모, 옷, 배경은 정확하게 유지되어야 합니다.
    3. 결과물 'english' 프롬프트 마지막에는 반드시 다음 문구를 추가하세요: "There is no slow motion, and the scene unfolds quickly."
    4. 'korean' 필드는 생성된 영어 프롬프트의 의미를 정확하고 감성적으로 전달하는 한국어 번역을 작성하세요.
    5. 'english' 필드는 카메라 무브먼트(줌, 팬, 틸트), 조명, 질감 및 동작을 포함하여 기술적으로 상세하게 작성하세요.
  `;

  const parts: any[] = [];
  if (referenceImageBase64) {
    const cleanData = referenceImageBase64.split(',')[1] || referenceImageBase64;
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: cleanData
      }
    });
  }
  
  parts.push({ text: `Analyze the provided image (if any) and the following request to create an optimized I2V video prompt: "${koreanInput}"` });

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
    
    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("Veo Translation Error:", error);
    throw error;
  }
};

export const validateApiKey = async (key: string): Promise<boolean> => {
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [{ text: "ping" }] },
    });
    return true;
  } catch (error) {
    console.error("API Key Validation Failed:", error);
    return false;
  }
};

export const generateStoryStructure = async (
  topic: string,
  referenceImageBase64: string | null,
  sceneCount: number = 10
): Promise<StoryGenerationResult> => {
  const ai = getAIClient();
  const modelId = "gemini-3-pro-preview";

  const sceneSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      scenes: {
        type: Type.ARRAY,
        description: `Exactly ${sceneCount} narrative scenes.`,
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
        description: "10 SEO optimized YouTube titles.",
        items: {
          type: Type.OBJECT,
          properties: {
              english: { type: Type.STRING },
              korean: { type: Type.STRING }
          },
          required: ["english", "korean"]
        }
      },
      musicPrompt: { type: Type.STRING },
      lyrics: { type: Type.STRING },
      lyricsKorean: { type: Type.STRING }
    },
    required: ["scenes", "titles", "musicPrompt", "lyrics", "lyricsKorean"],
  };

  const systemInstruction = `
    당신은 모든 음악을 분석하고 빌보드에 진입할만한 노래의 프롬을 만듭니다.
    당신은 세계적으로 명성이 자자한 음악 프로듀서 이며 현재 유행하며 가능성이 있는 음악과 가사 프롬포트를 생성하는데 최적화 되어 있습니다.

    You are an expert Storyboard AI, a Digital Marketing Specialist, and a legendary Music Producer.
    Create a compelling story in exactly ${sceneCount} scenes.

    Persona Guidelines:
    1. 'description': Scene summary in Korean.
    2. 'imagePrompt': Visual details in English. Preserve subjects from reference images exactly.
    3. 'i2vPrompt': Technical motion in English. ALWAYS end with: "There is no slow motion, and the scene unfolds quickly."
    4. 'titles': Generate 10 YouTube SEO optimized titles.
    5. 'musicPrompt': Generate a detailed billboard-style music prompt in English using EXACTLY this structure:
       Genre: 
       Mood: 
       Tempo: 
       Instrumentation:
       Vocal Style: 
       Lyrics Theme: 
       Song Structure: Intro – Verse – Pre-Chorus – Chorus – Chorus (repeat) – Verse – Pre-Chorus – Chorus – Chorus (repeat) – Bridge – Final Chorus – Final Chorus (repeat)
       Mix: 
    6. 'lyrics': Full song lyrics in English with structure [Verse 1], [Chorus], etc.
    7. 'lyricsKorean': A poetic and accurate Korean translation of the lyrics. Ensure it follows the same structure as the English lyrics.
  `;

  const parts: any[] = [];
  if (referenceImageBase64) {
    const cleanBase64 = referenceImageBase64.split(',')[1] || referenceImageBase64;
    parts.push({ inlineData: { mimeType: "image/jpeg", data: cleanBase64 } });
  }
  parts.push({ text: `Analyze this topic and create a comprehensive story, 10 SEO titles, and a professional music production: ${topic}` });

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: sceneSchema,
        temperature: 0.7,
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      const processedScenes = parsed.scenes.map((scene: any) => ({
          ...scene,
          imagePrompt: `Cinematic photo, high detail. ${scene.imagePrompt}`,
          i2vPrompt: scene.i2vPrompt.includes("scene unfolds quickly") 
            ? scene.i2vPrompt 
            : `${scene.i2vPrompt} There is no slow motion, and the scene unfolds quickly.`
      }));

      return {
          scenes: processedScenes,
          titles: parsed.titles || [],
          musicPrompt: parsed.musicPrompt || "",
          lyrics: parsed.lyrics || "",
          lyricsKorean: parsed.lyricsKorean || ""
      };
    }
    throw new Error("Response was empty.");
  } catch (error) {
    console.error("Story Generation Error:", error);
    throw error;
  }
};

export const generateTitles = async (topic: string): Promise<TitleData[]> => {
  const ai = getAIClient();
  const titlesSchema: Schema = {
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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [{ text: `Generate 10 highly SEO optimized YouTube titles for the topic: "${topic}". Focus on high search relevance, keywords, and click-through rate. Output as JSON.` }] },
      config: { responseMimeType: "application/json", responseSchema: titlesSchema },
    });
    return response.text ? JSON.parse(response.text).titles : [];
  } catch (error) {
    throw error;
  }
};

export const generateSceneImage = async (
  modelType: ModelType,
  prompt: string,
  aspectRatio: AspectRatio,
  resolution: ImageResolution = '1K',
  referenceImageBase64: string | null = null
): Promise<string> => {
  const ai = getAIClient();
  const modelId = modelType === ModelType.NanoBananaPro ? "gemini-3-pro-image-preview" : "gemini-2.5-flash-image";

  const imageConfig: any = { aspectRatio };
  if (modelType === ModelType.NanoBananaPro) imageConfig.imageSize = resolution;

  const parts: any[] = [];
  if (referenceImageBase64) {
      const cleanData = referenceImageBase64.split(',')[1] || referenceImageBase64;
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanData } });
  }
  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: { imageConfig }
    });

    const partsResponse = response.candidates?.[0]?.content?.parts;
    if (partsResponse) {
      for (const part of partsResponse) {
        if (part.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Failed to produce image.");
  } catch (error) {
    throw error;
  }
};
