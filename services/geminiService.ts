
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
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

export const generateImage = async (
  subjectFiles: File[],
  referenceFile: File | null,
  systemPrompt: string,
  userPrompt: string,
  aspectRatio: AspectRatio,
  quality: ImageQuality,
  angle: string
): Promise<string> => {
  const subjectParts = await Promise.all(subjectFiles.map(file => fileToPart(file)));
  const referencePart = referenceFile ? await fileToPart(referenceFile) : null;
  
  const isPro = quality === ImageQuality.HD_2K || quality === ImageQuality.ULTRA_HD_4K;
  const modelName = isPro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

  // Selalu buat instance baru sebelum pemanggilan untuk memastikan API KEY terbaru digunakan
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key tidak ditemukan. Silakan hubungkan kembali.");

  const ai = new GoogleGenAI({ apiKey });
  
  const config: any = { 
    imageConfig: { 
      aspectRatio: aspectRatio as any
    } 
  };

  if (isPro) {
    config.imageConfig.imageSize = quality;
  }

  const coreInstruction = `TASK: ABSOLUTE FIDELITY PRODUCT RECONSTRUCTION. ${systemPrompt} ${userPrompt} ANGLE: ${angle}. NO TEXT. NO MANNEQUINS.`;

  const parts = [
    { text: "CORE SUBJECT:" },
    ...subjectParts,
    ...(referencePart ? [{ text: "STYLE REFERENCE:" }, referencePart] : []),
    { text: coreInstruction.trim() }
  ];

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: config
    });

    const part = response.candidates?.[0].content?.parts?.find(p => p.inlineData);
    if (part?.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    throw new Error("Gagal menghasilkan gambar.");
  } catch (error: any) {
    if (error.message?.includes("entity was not found")) {
      throw new Error("MODEL_NOT_FOUND_PAID_REQUIRED");
    }
    throw error;
  }
};

export const getSEOTrends = async (productName: string): Promise<{ text: string; sources: any[] }> => {
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey! });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Cari tren pemasaran dan kata kunci viral terbaru untuk produk: ${productName} di Indonesia.`,
    config: { tools: [{ googleSearch: {} }] }
  });
  return {
    text: response.text || "",
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const generateCopywriting = async (file: File, type: 'caption' | 'benefits' | 'hashtags'): Promise<string> => {
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey! });
  const imgPart = await fileToPart(file);
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [imgPart, { text: `Tulis ${type} untuk produk ini.` }] }
  });
  return response.text || "Gagal.";
};
