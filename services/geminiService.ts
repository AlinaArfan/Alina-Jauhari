
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
  // Use process.env.API_KEY exclusively as per guidelines
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key tidak ditemukan. Mohon setel API_KEY di Environment Variables Vercel.");

  const isPro = quality === ImageQuality.HD_2K || quality === ImageQuality.ULTRA_HD_4K;
  const modelName = isPro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

  // Create a new GoogleGenAI instance right before making an API call to ensure it uses the up-to-date key
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

    // Find the image part in candidates as it may not be the first part
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part?.inlineData?.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
    
    throw new Error("Model tidak mengembalikan data gambar. Gunakan prompt lain atau cek status model Gemini.");
  } catch (err: any) {
    console.error("Gemini Service Error:", err);
    throw err;
  }
};

/**
 * Fetches SEO trends using Google Search grounding.
 */
export const getSEOTrends = async (query: string): Promise<{ text: string; sources: any[] }> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return { text: "API Key tidak disetel.", sources: [] };
  
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analisis mendalam tren e-commerce 2025: ${query}. Berikan insight produk viral, keyword pencarian tertinggi, dan strategi affiliate marketing.`,
      config: { tools: [{ googleSearch: {} }] }
    });
    // Use .text property to get generated string directly
    return {
      text: response.text || "Tidak ada data tren ditemukan.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (err) {
    console.error("SEO Error:", err);
    return { text: "Gagal memuat tren SEO. Cek API Key di Vercel.", sources: [] };
  }
};

/**
 * Generates copywriting using an image and text prompt.
 */
export const generateCopywriting = async (file: File, type: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "API Key tidak ditemukan.";

  const ai = new GoogleGenAI({ apiKey });
  const imgPart = await fileToPart(file);
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [imgPart, { text: `Tulis ${type} yang sangat persuasif untuk produk ini menggunakan formula AIDA. Gunakan bahasa gaul e-commerce Indonesia.` }] }
    });
    // Use .text property to get generated string directly
    return response.text || "Gagal menghasilkan teks.";
  } catch (err) {
    console.error("Copywriting Error:", err);
    return "Terjadi kesalahan saat membuat copywriting.";
  }
};
