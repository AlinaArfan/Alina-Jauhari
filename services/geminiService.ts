
import { GoogleGenAI } from "@google/genai";
import { AspectRatio, ImageQuality } from "../types";

// Helper function to convert File to Gemini part format
const fileToPart = (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (!result) return reject(new Error("Gagal membaca file."));
      const base64String = result.split(',')[1];
      resolve({ inlineData: { data: base64String, mimeType: file.type } });
    };
    reader.onerror = () => reject(new Error("Gagal membaca file."));
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
  // Use strictly process.env.API_KEY
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    throw new Error("API_KEY tidak terdeteksi. Silakan Re-deploy di Vercel setelah memasukkan API_KEY di Settings.");
  }

  const isPro = quality === ImageQuality.HD_2K || quality === ImageQuality.ULTRA_HD_4K;
  const modelName = isPro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

  // New instance for every call to ensure fresh context
  const ai = new GoogleGenAI({ apiKey });
  
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
    - Keep product shape authentic.
    - Cinematic commercial lighting.
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
    
    throw new Error("Model tidak memberikan gambar. Gunakan deskripsi yang lebih spesifik.");
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    throw err;
  }
};

/**
 * Fetches SEO trends using Google Search grounding.
 */
export const getSEOTrends = async (query: string): Promise<{ text: string; sources: any[] }> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") return { text: "API Key tidak disetel.", sources: [] };
  
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analisis tren e-commerce 2025: ${query}. Berikan insight produk viral dan keyword pencarian tertinggi.`,
      config: { tools: [{ googleSearch: {} }] }
    });
    return {
      text: response.text || "Tidak ada data ditemukan.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (err) {
    console.error("SEO Error:", err);
    return { text: "Gagal memuat tren SEO.", sources: [] };
  }
};

/**
 * Generates copywriting using an image and text prompt.
 */
export const generateCopywriting = async (file: File, type: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") return "API Key tidak ditemukan.";

  const ai = new GoogleGenAI({ apiKey });
  const imgPart = await fileToPart(file);
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [imgPart, { text: `Tulis ${type} persuasif AIDA untuk produk ini.` }] }
    });
    return response.text || "Gagal menghasilkan teks.";
  } catch (err) {
    console.error("Copywriting Error:", err);
    return "Terjadi kesalahan pada Marketing Lab.";
  }
};
