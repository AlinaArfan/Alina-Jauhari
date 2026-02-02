
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
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    throw new Error("API_KEY tidak terdeteksi. Silakan Re-deploy di Vercel setelah memasukkan API_KEY di Settings.");
  }

  const isPro = quality === ImageQuality.HD_2K || quality === ImageQuality.ULTRA_HD_4K;
  const modelName = isPro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  const ai = new GoogleGenAI({ apiKey });
  
  const config: any = { imageConfig: { aspectRatio: aspectRatio as any } };
  if (isPro) config.imageConfig.imageSize = quality;

  const subjectParts = await Promise.all(subjectFiles.map(file => fileToPart(file)));
  const referencePart = referenceFile ? await fileToPart(referenceFile) : null;
  
  const parts = [
    { text: "SOURCE PRODUCT IMAGES:" },
    ...subjectParts,
    ...(referencePart ? [{ text: "STYLE REFERENCE:" }, referencePart] : []),
    { text: `[TASK: HIGHEST QUALITY PRODUCT RENDERING] STYLE: ${systemPrompt}. ENVIRONMENT: ${userPrompt}. SHOT: ${angleDesc}.` }
  ];

  const response = await ai.models.generateContent({ model: modelName, contents: { parts }, config: config });
  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (part?.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
  throw new Error("Model tidak memberikan gambar.");
};

/**
 * Generates a video using Veo 3.1 models.
 */
export const generateVideo = async (
  prompt: string,
  aspectRatio: '16:9' | '9:16',
  resolution: '720p' | '1080p',
  imageFile?: File
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey! });

  let imagePayload = undefined;
  if (imageFile) {
    const part = await fileToPart(imageFile);
    imagePayload = {
      imageBytes: part.inlineData.data,
      mimeType: part.inlineData.mimeType
    };
  }

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: imagePayload,
      config: {
        numberOfVideos: 1,
        resolution: resolution,
        aspectRatio: aspectRatio
      }
    });

    // Polling for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Gagal mendapatkan link download video.");

    // Fetch MP4 bytes with the API Key
    const response = await fetch(`${downloadLink}&key=${apiKey}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (err: any) {
    if (err.message?.includes("Requested entity was not found")) {
      await (window as any).aistudio.openSelectKey();
      throw new Error("Sesi API kadaluarsa. Silakan pilih API Key berbayar Anda kembali.");
    }
    throw err;
  }
};

export const getSEOTrends = async (query: string): Promise<{ text: string; sources: any[] }> => {
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey! });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analisis tren e-commerce 2025: ${query}.`,
    config: { tools: [{ googleSearch: {} }] }
  });
  return { text: response.text || "", sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
};

export const generateCopywriting = async (file: File, type: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey! });
  const imgPart = await fileToPart(file);
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [imgPart, { text: `Tulis ${type} persuasif AIDA.` }] }
  });
  return response.text || "";
};
