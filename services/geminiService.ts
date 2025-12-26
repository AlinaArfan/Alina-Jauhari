
import { GoogleGenAI, Modality } from "@google/genai";
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

const urlToPart = async (url: string): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({ inlineData: { data: base64String, mimeType: blob.type } });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const generateImage = async (
  files: File[],
  systemPrompt: string,
  userPrompt: string,
  aspectRatio: AspectRatio,
  quality: ImageQuality,
  angle: string
): Promise<string> => {
  const imageParts = await Promise.all(files.map(file => fileToPart(file)));
  const isHD = quality !== ImageQuality.STANDARD;
  const modelName = isHD ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

  const coreInstruction = `
    GOAL: Generate/Edit a high-end, commercial-grade photo.
    CAMERA ANGLE: ${angle}.
    ${systemPrompt}
    USER DETAILS: ${userPrompt}.
    QUALITY: Photorealistic, 8k resolution, professional commercial lighting.
    RULES: Keep the subject's identity/product details consistent unless specified otherwise.
  `;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: [...imageParts, { text: coreInstruction.trim() }] },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          ...(isHD ? { imageSize: quality as any } : {})
        }
      }
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content?.parts;
      const part = parts?.find(part => part.inlineData);
      if (part?.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("AI tidak mengembalikan gambar.");
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found") || error.message?.includes("API key not valid")) {
       // Reset key selection state jika error terjadi
       if (window.aistudio?.openSelectKey) {
         await window.aistudio.openSelectKey();
         throw new Error("Kunci API tidak valid. Silakan pilih kunci baru yang valid.");
       }
    }
    throw error;
  }
};

export const generateMagicContent = async (imageUrl: string, type: 'voice' | 'video'): Promise<string> => {
  const imgPart = await urlToPart(imageUrl);
  const prompt = type === 'voice' 
    ? `Analisis produk/gambar ini dan buatkan naskah jualan TikTok yang sangat VIRAL.
       ATURAN KETAT:
       1. HANYA TULIS NASKAHNYA SAJA. 
       2. DILARANG KERAS menulis kalimat pengantar.
       3. Gunakan bahasa Indonesia gaul, persuasif, dan emosional.
       4. Maksimal 60 kata.`
    : "Buatkan instruksi gerakan kamera (Video Motion Prompt) yang estetik untuk gambar ini. HANYA TULIS INSTRUKSINYA SAJA.";

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [imgPart, { text: prompt }] }
  });
  
  return response.text?.trim() || "Gagal membuat konten.";
};

export const generateTTS = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say ONLY the following text in Indonesian as a cheerful TikTok influencer: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voiceName as any },
        },
      },
    },
  });

  const candidates = response.candidates;
  if (candidates && candidates.length > 0) {
    const base64Audio = candidates[0].content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) return base64Audio;
  }
  
  throw new Error("Gagal generate suara.");
};

export function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

export function pcmToWav(pcmData: Uint8Array, sampleRate: number = 24000): Blob {
  const buffer = new ArrayBuffer(44 + pcmData.length);
  const view = new DataView(buffer);
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + pcmData.length, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"
  view.setUint32(12, 0x666d7420, false); 
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x64617461, false);
  view.setUint32(40, pcmData.length, true);
  const pcmBytes = new Uint8Array(buffer, 44);
  pcmBytes.set(pcmData);
  return new Blob([buffer], { type: 'audio/wav' });
}
