
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NavItem, AspectRatio, UploadedImage, ImageQuality, HistoryItem } from '../types';
import ImageUploader from './ImageUploader';
import LearningCenter from './LearningCenter';
import { 
  generateImage, 
  generateVideo,
  getSEOTrends,
  generateCopywriting
} from '../services/geminiService';
import { 
  Download, Sparkles, Loader2, ShoppingBag, Box, Smartphone, Megaphone,
  X, Maximize2, ShieldCheck, CheckCircle, AlertTriangle, LayoutGrid, Camera, Zap, ChevronLeft, ChevronRight,
  Shirt, Layers, Hand, PackageOpen, Wand2, Focus, Compass, ArrowRight, BarChart3, Trash2, Calendar, History as HistoryIcon,
  Monitor, Youtube, Instagram, Sun, Video, Play, FileVideo, PenTool, GraduationCap, Palette, Layers as LayersIcon,
  CheckCircle2, Users, UserCircle
} from 'lucide-react';

const ENVIRONMENTS = [
  "Studio Professional", "Natural Light", "Modern Bedroom", "Outdoor Scenery", 
  "Ruang Tamu Minimalis", "Dapur Estetik", "Interior Mobil", "Meja Kerja"
];

const PHOTO_ANGLES = [
  { id: "D-0", label: "Front View (Depan)" },
  { id: "D-3Q", label: "3/4 View (Perspektif)" },
  { id: "D-90", label: "Side View (Samping)" },
  { id: "Flatlay", label: "Top View (Flatlay)" },
  { id: "D-180", label: "Back View (Belakang)" }
];

const REASSURING_MESSAGES = [
  "Menyiapkan mesin AI Video...",
  "Menganalisis prompt visual Anda...",
  "Merancang frame sinematik pertama...",
  "Menerapkan pencahayaan fotorealistik...",
  "Hampir selesai, memproses final MP4...",
  "Sabar ya, video hebat butuh waktu..."
];

const SUB_MODES: Record<string, { id: string, label: string, icon: any, prompt: string }[]> = {
  [NavItem.COMMERCIAL]: [
    { id: 'product-shot', label: 'Product Shot', icon: Box, prompt: "Professional luxury studio photography, clean minimalist background, soft lighting." },
    { id: 'ai-fashion', label: 'AI Fashion', icon: Shirt, prompt: "Photorealistic editorial fashion photography, high-quality human model wearing garment." },
    { id: 'mockup', label: 'Mockup', icon: Layers, prompt: "3D realistic product mockup, logo integrated seamlessly." }
  ],
  [NavItem.UGC]: [
    { id: 'selfie-review', label: 'Selfie Review', icon: Smartphone, prompt: "Authentic casual smartphone selfie, real person holding product." },
    { id: 'pov-hand', label: 'POV Hand', icon: Hand, prompt: "POV perspective, realistic human hands holding the product." },
    { id: 'unboxing-exp', label: 'Unboxing Exp', icon: PackageOpen, prompt: "Atmospheric unboxing scene, natural indoor morning light." }
  ],
  [NavItem.ADS]: [
    { id: 'web-banner', label: 'Web Banner', icon: Monitor, prompt: "Wide landscape e-commerce web banner, professional layout." },
    { id: 'youtube-thumbnail', label: 'YT Thumbnail', icon: Youtube, prompt: "Vibrant high-contrast YouTube thumbnail style." },
    { id: 'social-feed', label: 'Social Feed', icon: Instagram, prompt: "Aesthetic Instagram feed photography, lifestyle branding." }
  ],
  [NavItem.HUMAN]: [
    { id: 'fashion-model', label: 'Fashion Model', icon: Users, prompt: "Studio fashion shoot with a professional model." },
    { id: 'lifestyle-human', label: 'Lifestyle', icon: Sun, prompt: "Candid lifestyle shot of a person using the product naturally." }
  ]
};

const AngleBadge = ({ label }: { label: string }) => (
  <span className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/20">
    {label}
  </span>
);

const Lightbox: React.FC<{ 
  images: {url: string}[]; 
  index: number | null; 
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}> = ({ images, index, onClose, onNext, onPrev }) => {
  if (index === null || !images[index]) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-2xl" onClick={onClose}>
       <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="absolute left-8 p-6 text-white hover:text-teal-400 transition-colors"><ChevronLeft size={64} /></button>
       <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute right-8 p-6 text-white hover:text-teal-400 transition-colors"><ChevronRight size={64} /></button>
       <img src={images[index].url} className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10" alt="Preview" />
    </div>
  );
};

const MainContent: React.FC<{ activeItem: NavItem; setActiveItem: (i: NavItem) => void }> = ({ activeItem, setActiveItem }) => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [refImages, setRefImages] = useState<UploadedImage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [subMode, setSubMode] = useState("");
  const [activeStyle, setActiveStyle] = useState("Studio Professional");
  const [activeAngle, setActiveAngle] = useState("D-3Q"); 
  const [ratio, setRatio] = useState<any>(AspectRatio.PORTRAIT);
  const [quality, setQuality] = useState<ImageQuality>(ImageQuality.STANDARD);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [batchEnabled, setBatchEnabled] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<{url: string, angle: string}[]>([]);
  const [videoResult, setVideoResult] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  // Set default submode when activeItem changes
  useEffect(() => {
    if (SUB_MODES[activeItem]) {
      setSubMode(SUB_MODES[activeItem][0].id);
    }
  }, [activeItem]);

  // Load History
  useEffect(() => {
    const saved = localStorage.getItem('MAGIC_PICTURE_HISTORY');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) { localStorage.removeItem('MAGIC_PICTURE_HISTORY'); }
    }
  }, []);

  // Save History
  useEffect(() => {
    if (history.length > 0) {
      try { localStorage.setItem('MAGIC_PICTURE_HISTORY', JSON.stringify(history.slice(0, 15))); } catch (e) { console.warn("Quota exceeded"); }
    }
  }, [history]);

  const handleGenerate = async () => {
    if (images.length === 0) {
        setError("Mohon unggah foto produk terlebih dahulu.");
        return;
    }
    
    setIsGenerating(true); 
    setError(null); 
    setResults([]);
    setVideoResult(null);
    
    try {
      if (activeItem === NavItem.VIDEO) {
        if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
          const hasKey = await (window as any).aistudio.hasSelectedApiKey();
          if (!hasKey) await (window as any).aistudio.openSelectKey();
        }
        
        const finalPrompt = `Professional product showcase video. ${activeStyle}. ${prompt}. Cinematic motion.`;
        const videoUrl = await generateVideo(finalPrompt, ratio === AspectRatio.LANDSCAPE ? '16:9' : '9:16', '720p', images[0]?.file);
        setVideoResult(videoUrl);
      } else {
        const currentSubModeObj = SUB_MODES[activeItem]?.find(m => m.id === subMode);
        let baseSysPrompt = currentSubModeObj?.prompt || "";
        
        if (activeItem === NavItem.COMMERCIAL && subMode === 'ai-fashion' && refImages.length > 0) {
            baseSysPrompt += " MANDATORY: Extract the face from the provided reference image and map it onto the AI fashion model. Preserve facial features, skin tone, and identity exactly.";
        }

        const userPrompt = `${activeStyle}. ${prompt}`.trim();
        const referenceFile = refImages.length > 0 ? refImages[0].file : null;

        if (batchEnabled && images.length > 1) {
            setBatchProgress({ current: 0, total: images.length });
            
            for (let i = 0; i < images.length; i++) {
                setBatchProgress(prev => ({ ...prev, current: i + 1 }));
                const url = await generateImage(
                    [images[i].file], 
                    referenceFile, 
                    baseSysPrompt, 
                    userPrompt, 
                    ratio, 
                    quality, 
                    activeAngle
                );
                const resObj = { url, angle: activeAngle };
                setResults(prev => [...prev, resObj]);
                setHistory(prev => [{ ...resObj, id: Math.random().toString(36), timestamp: Date.now(), mode: subMode, category: activeItem }, ...prev]);
            }
        } else {
            const url = await generateImage(
              images.map(i => i.file), 
              referenceFile, 
              baseSysPrompt, 
              userPrompt, 
              ratio, 
              quality, 
              activeAngle
            );
            const resObj = { url, angle: activeAngle };
            setResults([resObj]);
            setHistory(prev => [{ ...resObj, id: Math.random().toString(36), timestamp: Date.now(), mode: subMode, category: activeItem }, ...prev]);
        }
      }
    } catch (e: any) {
      setError(e.message || "Gagal memproses permintaan.");
    } finally {
      setIsGenerating(false);
      setBatchProgress({ current: 0, total: 0 });
    }
  };

  const lightboxImages = useMemo(() => {
    if (activeItem === NavItem.HISTORY) return history.map(h => ({ url: h.url }));
    return results.map(r => ({ url: r.url }));
  }, [activeItem, history, results]);

  if (activeItem === NavItem.HOME) {
    return (
      <main className="flex-1 overflow-y-auto p-6 lg:p-12 bg-gray-50/50 no-scrollbar">
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
           <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="space-y-4">
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Halo, <span className="text-teal-500">Creator!</span></h1>
              <p className="text-slate-500 text-lg max-w-xl">Pusat kendali konten Affiliate Magic Picture. Pilih studio untuk mulai.</p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl flex items-center gap-4">
                <div className="p-3 bg-teal-50 text-teal-600 rounded-xl"><Zap size={24} /></div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Database</p>
                  <p className="text-xl font-black text-slate-900">{history.length} Saved</p>
                </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[
               { id: NavItem.COMMERCIAL, label: 'Commercial Hub', icon: ShoppingBag, color: 'bg-blue-500' },
               { id: NavItem.VIDEO, label: 'Video Studio', icon: Video, color: 'bg-purple-500' },
               { id: NavItem.UGC, label: 'UGC Studio', icon: Smartphone, color: 'bg-teal-500' },
               { id: NavItem.ADS, label: 'Ads Studio', icon: Megaphone, color: 'bg-orange-500' },
               { id: NavItem.HUMAN, label: 'Human Studio', icon: Users, color: 'bg-emerald-500' },
               { id: NavItem.LEARNING, label: 'Edu Center', icon: GraduationCap, color: 'bg-indigo-500' }
             ].map(item => (
               <button key={item.id} onClick={() => setActiveItem(item.id)} className="group bg-white p-10 rounded-[3rem] text-left border border-gray-100 shadow-xl hover:shadow-2xl transition-all">
                  <div className={`w-14 h-14 ${item.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg`}><item.icon size={28} /></div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">{item.label}</h3>
                  <div className="flex items-center gap-2 text-teal-600 font-black text-[10px] uppercase tracking-widest">Buka Studio <ArrowRight size={12} /></div>
               </button>
             ))}
          </div>
        </div>
      </main>
    );
  }

  if (activeItem === NavItem.HISTORY) {
    return (
      <main className="flex-1 overflow-y-auto p-6 lg:p-12 bg-gray-50/50 no-scrollbar">
         <div className="max-w-6xl mx-auto space-y-10">
            <div className="flex justify-between items-center">
              <h1 className="text-4xl font-black text-slate-900">Riwayat Galeri</h1>
              <button onClick={() => {setHistory([]); localStorage.removeItem('MAGIC_PICTURE_HISTORY');}} className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100">
                <Trash2 size={14} /> Clear All
              </button>
            </div>
            {history.length === 0 ? (
                <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-gray-100 text-slate-400 font-bold uppercase tracking-widest text-xs">Belum ada riwayat konten</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {history.map((item, i) => (
                        <div key={item.id} className="group relative rounded-[2rem] overflow-hidden shadow-lg bg-white border border-gray-100">
                            <img src={item.url} className="w-full aspect-square object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                <button onClick={() => setSelectedIdx(i)} className="p-3 bg-white rounded-xl text-slate-900"><Maximize2 size={18} /></button>
                                <a href={item.url} download className="p-3 bg-teal-500 text-white rounded-xl"><Download size={18} /></a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
         </div>
         <Lightbox images={lightboxImages} index={selectedIdx} onClose={() => setSelectedIdx(null)} onNext={() => setSelectedIdx(p => (p! + 1) % lightboxImages.length)} onPrev={() => setSelectedIdx(p => (p! - 1 + lightboxImages.length) % lightboxImages.length)} />
      </main>
    );
  }

  if (activeItem === NavItem.LEARNING) return <main className="flex-1 overflow-y-auto p-12 bg-gray-50/50"><LearningCenter /></main>;

  return (
    <main className="flex-1 overflow-y-auto p-6 lg:p-12 bg-gray-50/50 no-scrollbar">
      <div className="max-w-4xl mx-auto space-y-10 pb-40">
        <div className={`p-8 lg:p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden text-white ${activeItem === NavItem.VIDEO ? 'bg-purple-900' : 'bg-slate-900'}`}>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="p-5 bg-teal-500 rounded-2xl shadow-lg shadow-teal-500/30">
                  {activeItem === NavItem.VIDEO ? <Video size={40} /> : <ShoppingBag size={40} />}
                </div>
                <div>
                    <h1 className="text-4xl font-black tracking-tighter">{activeItem}</h1>
                    <p className="text-sm text-slate-400 font-medium">Ubah foto produk Anda menjadi aset marketing profesional</p>
                </div>
              </div>

              {activeItem !== NavItem.VIDEO && (
                  <button 
                      onClick={() => {
                          setBatchEnabled(!batchEnabled);
                          setImages([]); 
                      }}
                      className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border-2 transition-all shadow-xl hover:scale-105 active:scale-95 ${batchEnabled ? 'bg-teal-500 border-teal-400 text-white animate-pulse' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
                  >
                      <LayersIcon size={16} />
                      Batch Mode: {batchEnabled ? 'AKTIF' : 'NON-AKTIF'}
                  </button>
              )}
            </div>
        </div>

        <div className="bg-white p-10 lg:p-16 rounded-[4rem] shadow-xl border border-gray-100 space-y-12">
            {SUB_MODES[activeItem] && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {SUB_MODES[activeItem].map(b => (
                      <button key={b.id} onClick={() => setSubMode(b.id)} className={`p-5 rounded-[2rem] border-2 text-center transition-all ${subMode === b.id ? 'bg-teal-50 border-teal-500 shadow-md ring-4 ring-teal-500/5' : 'bg-white border-gray-100'}`}>
                          <b.icon className={`mx-auto mb-3 ${subMode === b.id ? 'text-teal-600' : 'text-slate-400'}`} size={24} />
                          <div className="font-black text-[10px] uppercase tracking-widest">{b.label}</div>
                      </button>
                  ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                        <Camera size={14} className="text-teal-500" /> {batchEnabled ? 'Upload Batch (Hingga 10)' : 'Foto Utama Produk'}
                    </label>
                    <div className={batchEnabled ? 'ring-4 ring-teal-500/10 rounded-2xl p-1 animate-pulse' : ''}>
                      <ImageUploader 
                          images={images} 
                          setImages={setImages} 
                          maxFiles={batchEnabled ? 10 : 1} 
                          label="" 
                          compact 
                          description={batchEnabled ? "Upload banyak foto untuk diproses sekaligus" : "Upload foto asli produk Anda"} 
                      />
                    </div>
                </div>
                
                {activeItem === NavItem.COMMERCIAL ? (
                  <div className="space-y-4 animate-in slide-in-from-right-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                          <UserCircle size={14} className="text-purple-500" /> Swap Wajah (Opsional)
                      </label>
                      <ImageUploader 
                        images={refImages} 
                        setImages={setRefImages} 
                        maxFiles={1} 
                        label="" 
                        compact 
                        description={subMode === 'ai-fashion' ? "Upload foto wajah untuk ditukar ke model AI" : "Tiru gaya atau pencahayaan foto ini"} 
                      />
                  </div>
                ) : (
                  <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                          <Palette size={14} className="text-purple-500" /> Referensi Gaya (Opsional)
                      </label>
                      <ImageUploader images={refImages} setImages={setRefImages} maxFiles={1} label="" compact description="Tiru pencahayaan/gaya foto ini" />
                  </div>
                )}
            </div>

            <div className="space-y-6">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                    <Focus size={14} className="text-teal-500" /> Instruksi Khusus (Prompt)
                </label>
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Contoh: 'Hutan pinus berkabut', 'Meja marmer putih'..." className="w-full h-24 bg-gray-50 border-2 border-gray-100 p-6 rounded-[2rem] outline-none focus:border-teal-500 text-sm font-medium transition-all" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Vibe / Lingkungan</label>
                  <select value={activeStyle} onChange={e => setActiveStyle(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 p-5 rounded-[1.5rem] text-[10px] font-black uppercase outline-none focus:border-teal-500 cursor-pointer">
                    {ENVIRONMENTS.map(env => <option key={env} value={env}>{env}</option>)}
                  </select>
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Angle Foto</label>
                  <select value={activeAngle} onChange={e => setActiveAngle(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 p-5 rounded-[1.5rem] text-[10px] font-black uppercase outline-none focus:border-teal-500 cursor-pointer">
                    {PHOTO_ANGLES.map(ang => <option key={ang.id} value={ang.id}>{ang.label}</option>)}
                  </select>
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Format Rasio</label>
                  <select value={ratio} onChange={e => setRatio(e.target.value as any)} className="w-full bg-gray-50 border-2 border-gray-100 p-5 rounded-[1.5rem] text-[10px] font-black uppercase outline-none focus:border-teal-500 cursor-pointer">
                    <option value={AspectRatio.PORTRAIT}>9:16 (Story/TikTok)</option>
                    <option value={AspectRatio.LANDSCAPE}>16:9 (Desktop/Ads)</option>
                    <option value={AspectRatio.SQUARE}>1:1 (Instagram Feed)</option>
                  </select>
               </div>
            </div>

            <div className="space-y-6 pt-6">
                {isGenerating && batchEnabled && (
                    <div className="bg-teal-50 p-8 rounded-[2.5rem] border-2 border-teal-100 animate-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[11px] font-black uppercase text-teal-600 tracking-widest">Memproses Batch Konten...</span>
                            <span className="text-sm font-black text-teal-700 bg-white px-4 py-1 rounded-full shadow-sm">{batchProgress.current} / {batchProgress.total}</span>
                        </div>
                        <div className="w-full h-4 bg-white rounded-full overflow-hidden border border-teal-100 p-1">
                            <div 
                                className="h-full bg-teal-500 rounded-full transition-all duration-700 ease-out shadow-lg" 
                                style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={`w-full py-10 rounded-[3rem] font-black text-white text-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-2xl ${isGenerating ? 'bg-slate-400 cursor-wait' : 'bg-teal-500 hover:bg-teal-600 hover:scale-[1.01]'}`}
                >
                  {isGenerating ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="animate-spin" size={32} />
                      <span className="text-xs uppercase tracking-widest opacity-80">
                        {batchEnabled ? `Sedang Memproses #${batchProgress.current}...` : 'Merancang Visual AI...'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                        <Sparkles size={28} /> 
                        <span>{batchEnabled ? `PROSES BATCH (${images.length})` : 'MULAI GENERATE'}</span>
                    </div>
                  )}
                </button>
            </div>

            {error && <div className="p-8 bg-red-50 border-2 border-red-100 text-red-500 rounded-[2.5rem] flex items-center gap-5 animate-bounce"><AlertTriangle className="shrink-0" size={24} /><div className="text-xs font-black uppercase tracking-tight">{error}</div></div>}
        </div>

        {(results.length > 0 || videoResult) && (
          <div className="bg-white p-12 rounded-[4.5rem] shadow-2xl border border-gray-100 animate-in zoom-in duration-500">
              <div className="flex items-center justify-between mb-10 border-b pb-8">
                  <h3 className="text-3xl font-black text-slate-900 flex items-center gap-4">
                      Gallery Hasil {batchEnabled && <span className="text-xs bg-teal-500 text-white px-5 py-1.5 rounded-full">{results.length} Files</span>}
                  </h3>
                  <button onClick={() => {setResults([]); setVideoResult(null);}} className="text-slate-200 hover:text-red-500 transition-all hover:rotate-90"><X size={40} /></button>
              </div>
              
              {videoResult ? (
                 <div className="space-y-8">
                    <video src={videoResult} controls className="w-full rounded-[3rem] shadow-2xl bg-black aspect-video" />
                    <a href={videoResult} download="magic-video.mp4" className="w-full flex items-center justify-center gap-3 bg-teal-500 text-white py-8 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-teal-600 shadow-xl transition-all">
                        <Download size={20} /> Simpan ke Galeri (MP4)
                    </a>
                 </div>
              ) : (
                <div className={`grid gap-10 ${results.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                    {results.map((res, i) => (
                      <div key={i} className="group relative rounded-[2.5rem] overflow-hidden border-4 border-gray-50 bg-slate-50 transition-all hover:border-teal-500 hover:shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${i * 100}ms` }}>
                         <div className="absolute top-6 right-6 z-10 p-3 bg-teal-500 text-white rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                            <CheckCircle2 size={24} />
                         </div>
                         <AngleBadge label={res.angle} />
                         <img src={res.url} className="w-full object-cover" alt="Generated" />
                         <div className="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-6 backdrop-blur-sm">
                            <button onClick={() => setSelectedIdx(i)} className="p-5 bg-white rounded-2xl text-slate-900 hover:scale-110 transition-transform"><Maximize2 size={24} /></button>
                            <a href={res.url} download={`magic-picture-${i}.png`} className="p-5 bg-teal-500 rounded-2xl text-white hover:scale-110 transition-transform"><Download size={24} /></a>
                         </div>
                      </div>
                    ))}
                 </div>
              )}
          </div>
        )}
      </div>
      <Lightbox images={lightboxImages} index={selectedIdx} onClose={() => setSelectedIdx(null)} onNext={() => setSelectedIdx(p => (p! + 1) % lightboxImages.length)} onPrev={() => setSelectedIdx(p => (p! - 1 + lightboxImages.length) % lightboxImages.length)} />
    </main>
  );
};

export default MainContent;
