
import { GoogleGenAI } from "@google/genai";
import { AspectRatio, ImageQuality } from "../types";

const fileToPart = (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({ inlineData: { data: base64String, mimeType: file.type } });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const getEffectiveApiKey = (): string | null => {
  const savedKey = localStorage.getItem('GEMINI_API_KEY');
  if (savedKey) return savedKey;
  // @ts-ignore
  return process.env.API_KEY || import.meta.env.VITE_API_KEY || null;
};

export const generateImage = async (
  subjectFiles: File[],
  referenceFile: File | null,
  systemPrompt: string,
  userPrompt: string,
  aspectRatio: AspectRatio,
  quality: ImageQuality,
  angleDesc: string
): Promise<string> => {
  const apiKey = getEffectiveApiKey();
  if (!apiKey) throw new Error("API Key tidak ditemukan.");

  const subjectParts = await Promise.all(subjectFiles.map(file => fileToPart(file)));
  const referencePart = referenceFile ? await fileToPart(referenceFile) : null;
  
  const isPro = quality === ImageQuality.HD_2K || quality === ImageQuality.ULTRA_HD_4K;
  const modelName = isPro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

  const ai = new GoogleGenAI({ apiKey });
  
  const config: any = { 
    imageConfig: { 
      aspectRatio: aspectRatio as any
    } 
  };

  if (isPro) {
    config.imageConfig.imageSize = quality;
  }

  // Enhanced Instruction for High Fidelity
  const coreInstruction = `
    TASK: Professional Product Reconstruction.
    ROLE: Commercial Photographer.
    SUBJECT: Maintain 100% geometric fidelity of the product in the provided photos.
    ENVIRONMENT: ${systemPrompt}.
    USER_DESC: ${userPrompt}.
    CAMERA_ANGLE: ${angleDesc}.
    STYLE: Photorealistic, 8k, highly detailed textures, soft commercial lighting.
    RESTRICTIONS: No text, no distorted shapes, no artifacts, no mannequins unless specified.
  `.trim();

  const parts = [
    { text: "CORE PRODUCT REFERENCE (CRITICAL):" },
    ...subjectParts,
    ...(referencePart ? [{ text: "ENVIRONMENT/STYLE REFERENCE (USE THIS BACKGROUND):" }, referencePart] : []),
    { text: coreInstruction }
  ];

  const response = await ai.models.generateContent({
    model: modelName,
    contents: { parts },
    config: config
  });

  const part = response.candidates?.[0].content?.parts?.find(p => p.inlineData);
  if (part?.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  throw new Error("Gagal menghasilkan gambar.");
};

export const getSEOTrends = async (productName: string): Promise<{ text: string; sources: any[] }> => {
  const apiKey = getEffectiveApiKey();
  const ai = new GoogleGenAI({ apiKey: apiKey! });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analisis tren pasar untuk produk: ${productName}. Berikan data: 1. Kata kunci viral TikTok. 2. Estimasi harga kompetitor. 3. Target audiens. 4. Strategi konten video.`,
    config: { tools: [{ googleSearch: {} }] }
  });
  return {
    text: response.text || "",
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const generateCopywriting = async (file: File, type: string): Promise<string> => {
  const apiKey = getEffectiveApiKey();
  const ai = new GoogleGenAI({ apiKey: apiKey! });
  const imgPart = await fileToPart(file);
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [imgPart, { text: `Tulis ${type} yang sangat menjual untuk produk ini.` }] }
  });
  return response.text || "Gagal.";
};
