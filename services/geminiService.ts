
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

  // MAX ACCURACY PROMPT TEMPLATE
  const coreInstruction = `
    TASK: HIGH-FIDELITY PRODUCT RECONSTRUCTION.
    SCENE CONTEXT: ${systemPrompt}.
    USER REQUEST: ${userPrompt}.
    CAMERA ANGLE: ${angleDesc}.
    
    CRITICAL RULES FOR ACCURACY:
    1. SUBJECT INTEGRITY: Use the provided source images as the absolute reference for the product's shape, logo, color, and texture. DO NOT alter the product's branding or physical dimensions.
    2. LIGHTING: Apply professional commercial lighting that matches the "SCENE CONTEXT". Ensure realistic shadows and reflections that ground the product in the environment.
    3. COMPOSITION: Center the product. If "POV" is mentioned, ensure the hands look natural and the perspective is first-person.
    4. QUALITY: Photorealistic, 8k resolution, sharp focus on the product, cinematic depth of field.
    5. NEGATIVE: Avoid distorted text, extra limbs, floating objects, or cartoonish aesthetics.
  `.trim();

  const parts = [
    { text: "SOURCE PRODUCT IMAGES (FOR RECONSTRUCTION):" },
    ...subjectParts,
    ...(referencePart ? [{ text: "STYLE/ENVIRONMENT REFERENCE:" }, referencePart] : []),
    { text: coreInstruction }
  ];

  const response = await ai.models.generateContent({
    model: modelName,
    contents: { parts },
    config: config
  });

  const part = response.candidates?.[0].content?.parts?.find(p => p.inlineData);
  if (part?.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  throw new Error("Gagal menghasilkan gambar. Coba kurangi jumlah gambar atau ganti model.");
};

export const getSEOTrends = async (productName: string): Promise<{ text: string; sources: any[] }> => {
  const apiKey = getEffectiveApiKey();
  const ai = new GoogleGenAI({ apiKey: apiKey! });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analisis tren pasar terkini (2025) untuk produk: ${productName}. 
    Sertakan:
    - Top 5 TikTok Hashtags yang sedang viral.
    - Analisis harga jual terlaris di Marketplace.
    - Sudut pandang konten video yang paling banyak ditonton (Hook & Storyline).
    - Berikan data konkret berdasarkan pencarian web.`,
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
    contents: { parts: [imgPart, { text: `Analisis produk ini secara visual, lalu tulis ${type} yang memiliki 'High Conversion Rate' dan emosional.` }] }
  });
  return response.text || "Gagal menghasilkan naskah.";
};
