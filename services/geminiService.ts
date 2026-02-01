
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

  // ENHANCED FIDELITY PROMPT
  const coreInstruction = `
    [OBJECTIVE: ABSOLUTE FIDELITY RECONSTRUCTION]
    SCENE: ${systemPrompt}.
    ENVIRONMENT: ${userPrompt}.
    TECHNICAL ANGLE: ${angleDesc}.
    
    [STRICT ACCURACY RULES]:
    1. GEOMETRY: Maintain 100% accurate physical dimensions and geometric structure of the product from source images.
    2. TEXTURE & COLOR: Preserve original colors, fabric patterns, logos, and materials. No hallucination on branding.
    3. PERSPECTIVE: The chosen technical angle (${angleDesc}) must be applied with realistic foreshortening while keeping the product centered.
    4. INTEGRATION: Place the product naturally into the environment with correct contact shadows (ambient occlusion) and reflections.
    5. QUALITY: Cinematic photography, 8k resolution, high dynamic range, sharp product focus.
  `.trim();

  const parts = [
    { text: "REFERENCE PRODUCT VISUALS:" },
    ...subjectParts,
    ...(referencePart ? [{ text: "STYLE/LIGHTING REFERENCE:" }, referencePart] : []),
    { text: coreInstruction }
  ];

  const response = await ai.models.generateContent({
    model: modelName,
    contents: { parts },
    config: config
  });

  const part = response.candidates?.[0].content?.parts?.find(p => p.inlineData);
  if (part?.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  throw new Error("Gagal menghasilkan gambar. Pastikan API Key valid dan coba kurangi jumlah file.");
};

export const getSEOTrends = async (productName: string): Promise<{ text: string; sources: any[] }> => {
  const apiKey = getEffectiveApiKey();
  const ai = new GoogleGenAI({ apiKey: apiKey! });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analisis mendalam tren pasar 2025 untuk: ${productName}. Berikan strategi marketing spesifik, hashtag viral, dan analisis kompetitor di Marketplace.`,
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
    contents: { parts: [imgPart, { text: `Tulis ${type} profesional dengan teknik psikologi copywriting (AIDA) berdasarkan produk ini.` }] }
  });
  return response.text || "Gagal menghasilkan naskah.";
};
