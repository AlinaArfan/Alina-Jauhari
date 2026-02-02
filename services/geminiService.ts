
import { GoogleGenAI, Modality } from "@google/genai";
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
  imageFile?: File | string // Accepts file or base64 data url
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey! });

  let imagePayload = undefined;
  if (imageFile) {
    if (typeof imageFile === 'string') {
        const base64Data = imageFile.split(',')[1];
        imagePayload = {
            imageBytes: base64Data,
            mimeType: 'image/png'
        };
    } else {
        const part = await fileToPart(imageFile);
        imagePayload = {
          imageBytes: part.inlineData.data,
          mimeType: part.inlineData.mimeType
        };
    }
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

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Gagal mendapatkan link download video.");

    const response = await fetch(`${downloadLink}&key=${apiKey}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (err: any) {
    if (err.message?.includes("Requested entity was not found")) {
      if ((window as any).aistudio && (window as any).aistudio.openSelectKey) {
        await (window as any).aistudio.openSelectKey();
      }
      throw new Error("Sesi API kadaluarsa. Silakan pilih API Key berbayar Anda kembali.");
    }
    throw err;
  }
};

/**
 * Generates voice over for product marketing.
 */
export const generateVoiceOver = async (text: string): Promise<string> => {
    const apiKey = process.env.API_KEY;
    const ai = new GoogleGenAI({ apiKey: apiKey! });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say persuasively for marketing: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Gagal membuat voice over.");

    // The audio bytes returned by the API is raw PCM data. 
    // We'll wrap it in a Wav header for easy playback in browser.
    const pcmData = decodeBase64ToUint8(base64Audio);
    const wavBlob = createWavBlob(pcmData, 24000);
    return URL.createObjectURL(wavBlob);
};

// Utilities for Audio
function decodeBase64ToUint8(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function createWavBlob(pcmData: Uint8Array, sampleRate: number) {
    const buffer = new ArrayBuffer(44 + pcmData.length);
    const view = new DataView(buffer);

    // RIFF identifier
    view.setUint32(0, 0x52494646, false);
    // file length
    view.setUint32(4, 36 + pcmData.length, true);
    // RIFF type
    view.setUint32(8, 0x57415645, false);
    // format chunk identifier
    view.setUint32(12, 0x666d7420, false);
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (1 is PCM)
    view.setUint16(20, 1, true);
    // channel count
    view.setUint16(22, 1, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sampleRate * channelCount * bytesPerSample)
    view.setUint32(28, sampleRate * 2, true);
    // block align
    view.setUint16(32, 2, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    view.setUint32(36, 0x64617461, false);
    // data chunk length
    view.setUint32(40, pcmData.length, true);

    const wavData = new Uint8Array(buffer);
    wavData.set(pcmData, 44);
    return new Blob([wavData], { type: 'audio/wav' });
}

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

export const generateCopywriting = async (file: File | string, type: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey! });
  
  let imgPart;
  if (typeof file === 'string') {
      imgPart = { inlineData: { data: file.split(',')[1], mimeType: 'image/png' } };
  } else {
      imgPart = await fileToPart(file);
  }
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [imgPart, { text: `Tulis ${type} persuasif AIDA untuk produk ini dalam 1-2 kalimat saja.` }] }
  });
  return response.text || "";
};
