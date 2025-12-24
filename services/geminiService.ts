
import { GoogleGenAI, Modality } from "@google/genai";
import { AspectRatio, ImageQuality } from "../types";

const retryWithBackoff = async <T>(
  operation: () => Promise<T>, 
  retries: number = 3, 
  delay: number = 2000
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    const isQuotaError = error.message?.includes('429') || error.message?.includes('quota');
    if (isQuotaError && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(operation, retries - 1, delay * 2);
    }
    throw error;
  }
};

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
  files: File[],
  systemPrompt: string,
  userPrompt: string,
  aspectRatio: AspectRatio,
  quality: ImageQuality,
  apiKey: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || apiKey });
  const imageParts = await Promise.all(files.map(file => fileToPart(file)));

  const isHD = quality === ImageQuality.HD_2K || quality === ImageQuality.ULTRA_HD_4K;
  const modelName = isHD ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

  // Enhanced Prompt for Identity Preservation
  const finalSystemPrompt = `
    ROLE: Professional Commercial Photographer and AI Image Editor.
    STRICT RULE: YOU MUST PRESERVE THE EXACT IDENTITY, COLOR, TEXTURE, AND SHAPE OF THE PRODUCT SHOWN IN THE UPLOADED IMAGE. 
    DO NOT GENERATE A NEW PRODUCT. PLACE THE EXISTING PRODUCT INTO THE NEW ENVIRONMENT.
    
    TASK CONTEXT: ${systemPrompt}
    USER REQUEST: ${userPrompt}
    
    OUTPUT REQUIREMENTS:
    - High-end commercial photography style.
    - Realistic lighting that matches the new environment.
    - Seamless integration between the product and the background.
    - No text, no watermarks, no distorted objects.
  `;

  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: [...imageParts, { text: finalSystemPrompt }] },
      config: {
        imageConfig: { 
          aspectRatio: aspectRatio as any,
          ...(isHD ? { imageSize: quality as any } : {})
        }
      }
    });

    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (part?.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    throw new Error("Gagal generate gambar. Pastikan gambar produk jelas.");
  });
};

export const generateDescription = async (imageFile: File, context: string, apiKey: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || apiKey });
    const imgPart = await fileToPart(imageFile);
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [imgPart, { text: `Analisis produk ini. Berikan deskripsi singkat TENTANG PRODUKNYA SAJA (warna, jenis, bahan). Jangan bahas latar belakang.` }] }
    });
    return response.text?.trim() || "";
};

// ... (functions generateSpeech, generateVideoPrompt, generateVoiceScript remain same but use process.env.API_KEY)
