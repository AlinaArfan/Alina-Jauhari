
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

/**
 * Generates an image using Gemini's image models.
 */
export const generateImage = async (
  subjectFiles: File[],
  referenceFile: File | null,
  systemPrompt: string,
  userPrompt: string,
  aspectRatio: AspectRatio,
  quality: ImageQuality,
  angleDesc: string
): Promise<string> => {
  const isPro = quality === ImageQuality.HD_2K || quality === ImageQuality.ULTRA_HD_4K;
  const modelName = isPro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

  // Initialize right before call to get current key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const config: any = { 
    imageConfig: { 
      aspectRatio: aspectRatio as any
    } 
  };

  if (isPro) {
    config.imageConfig.imageSize = quality;
  }

  const subjectParts = await Promise.all(subjectFiles.map(file => fileToPart(file)));
  const referencePart = referenceFile ? await fileToPart(referenceFile) : null;
  
  const coreInstruction = `
    [TASK: HIGHEST QUALITY PRODUCT RENDERING]
    STYLE: ${systemPrompt}.
    ENVIRONMENT: ${userPrompt}.
    SHOT: ${angleDesc}.
    
    [GUIDELINES]:
    - Keep product shape and branding 100% authentic.
    - Professional lighting and commercial focus.
    - Cinematic background integration.
  `.trim();

  const parts = [
    { text: "SOURCE PRODUCT IMAGES:" },
    ...subjectParts,
    ...(referencePart ? [{ text: "STYLE REFERENCE:" }, referencePart] : []),
    { text: coreInstruction }
  ];

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: config
    });

    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part?.inlineData?.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
    
    throw new Error("Model tidak mengembalikan data gambar. Silakan ganti prompt atau API Key.");
  } catch (err: any) {
    console.error("API Error:", err);
    throw err;
  }
};

export const getSEOTrends = async (query: string): Promise<{ text: string; sources: any[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analisis mendalam tren 2025: ${query}. Berikan insight produk viral, keyword pencarian tertinggi, dan strategi affiliate marketing.`,
      config: { tools: [{ googleSearch: {} }] }
    });
    return {
      text: response.text || "Tidak ada data tren ditemukan.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (err) {
    return { text: "Gagal memuat tren SEO. Cek API Key Anda.", sources: [] };
  }
};

export const generateCopywriting = async (file: File, type: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const imgPart = await fileToPart(file);
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [imgPart, { text: `Tulis ${type} yang sangat persuasif untuk produk ini menggunakan formula AIDA.` }] }
    });
    return response.text || "Gagal menghasilkan teks.";
  } catch (err) {
    return "Error menghasilkan copywriting.";
  }
};
