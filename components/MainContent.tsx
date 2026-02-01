
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NavItem, AspectRatio, UploadedImage, ImageQuality, HistoryItem } from '../types';
import ImageUploader from './ImageUploader';
import LearningCenter from './LearningCenter';
import { 
  generateImage, 
  getSEOTrends,
  generateCopywriting
} from '../services/geminiService';
import { 
  Download, Sparkles, Loader2, ShoppingBag, Box, Smartphone, Megaphone,
  X, Maximize2, ShieldCheck, CheckCircle, AlertTriangle, LayoutGrid, Camera, Zap, ChevronLeft, ChevronRight,
  Shirt, Layers, Hand, PackageOpen, Wand2, Focus, Compass, ArrowRight, BarChart3, Trash2, Calendar, History as HistoryIcon,
  Monitor, Youtube, Instagram, Sun
} from 'lucide-react';

const PRO_ANGLES = [
  { code: "ECU", name: "Extreme Close-Up" },
  { code: "BMS", name: "Big Medium Shot" },
  { code: "OTS-R", name: "Over the Shoulder Rear" },
  { code: "FS", name: "Full Shot" },
  { code: "TDA", name: "Top Down Angle" },
  { code: "ULA", name: "Ultra Low Angle" },
  { code: "S-P", name: "Side Profile" },
  { code: "D-3Q", name: "Dynamic 3/4 View" },
  { code: "RBV", name: "Rear Back View" }
];

const ENVIRONMENTS = [
  "Netral Home", "Studio Professional", "Natural Light", "Modern Bedroom", "Outdoor Scenery", 
  "Ruang Tamu Minimalis", "Dapur Estetik", "Interior Mobil", "Meja Kerja", "Kamar Mandi Mewah"
];

const BATCH_SET = ["ECU", "FS", "TDA", "ULA", "S-P", "D-3Q"];

const SUB_MODE_PROMPTS: Record<string, string> = {
  'product-shot': "Professional luxury studio photography, clean minimalist background, soft cinematic lighting, high-end commercial aesthetic.",
  'ai-fashion': "Photorealistic editorial fashion photography, high-quality human model wearing the garment, natural skin texture, professional lighting.",
  'mockup': "3D realistic product mockup, logo/design seamlessly integrated into a real-world object with perfect perspective and material physics.",
  'selfie-review': "Authentic casual smartphone selfie, a real person holding the product with a natural smile, social media testimonial style.",
  'pov-hand': "First-person perspective (POV), realistic human hands interacting with or holding the product, natural everyday environment.",
  'unboxing-exp': "Atmospheric unboxing scene, product partially out of high-quality packaging, natural indoor morning light, organic home feel.",
  'web-banner': "Wide landscape e-commerce web banner, professional marketing layout, clean space for text, high-resolution commercial graphics.",
  'youtube-thumbnail': "Vibrant high-contrast YouTube thumbnail style, bold colors, expressive composition, attention-grabbing visual elements.",
  'social-feed': "Aesthetic Instagram feed photography, lifestyle branding, trendy color grading, consistent social media visual language."
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
       <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="absolute left-8 p-6 text-white hover:text-teal-400 transition-colors">
         <ChevronLeft size={64} />
       </button>
       <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute right-8 p-6 text-white hover:text-teal-400 transition-colors">
         <ChevronRight size={64} />
       </button>
       <img 
        src={images[index].url} 
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10" 
        alt="Full Preview"
       />
    </div>
  );
};

const MainContent: React.FC<{ activeItem: NavItem; setActiveItem: (i: NavItem) => void }> = ({ activeItem, setActiveItem }) => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [bgRef, setBgRef] = useState<UploadedImage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [subMode, setSubMode] = useState("product-shot");
  const [activeStyle, setActiveStyle] = useState("Studio Professional");
  const [activeAngle, setActiveAngle] = useState("D-3Q"); 
  const [ratio, setRatio] = useState<AspectRatio>(AspectRatio.PORTRAIT);
  const [quality, setQuality] = useState<ImageQuality>(ImageQuality.STANDARD);
  
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<{url: string, angle: string}[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [textContent, setTextContent] = useState("");
  const [sources, setSources] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('MAGIC_PICTURE_HISTORY');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) { console.error("History load error:", e); }
    }
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('MAGIC_PICTURE_HISTORY', JSON.stringify(history.slice(0, 50)));
    }
  }, [history]);

  useEffect(() => {
    setResults([]);
    setTextContent("");
    setPrompt("");
    setError(null);
    setIsBatchMode(false);
    
    if (activeItem === NavItem.COMMERCIAL) setSubMode("product-shot");
    else if (activeItem === NavItem.UGC) setSubMode("selfie-review");
    else if (activeItem === NavItem.ADS) setSubMode("web-banner");
  }, [activeItem]);

  const handleGenerate = async () => {
    if (images.length === 0 && ![NavItem.SEO, NavItem.COPYWRITER].includes(activeItem)) {
        setError("Mohon unggah foto produk terlebih dahulu.");
        return;
    }

    setIsGenerating(true); 
    setError(null); 
    
    try {
      // 1. Silent Check for AI Studio (Don't crash if missing)
      const aiStudio = (window as any).aistudio;
      if (aiStudio && typeof aiStudio.hasSelectedApiKey === 'function') {
        const hasKey = await aiStudio.hasSelectedApiKey();
        if (!hasKey) {
            await aiStudio.openSelectKey();
        }
      }

      // 2. Proccess Generation
      if (activeItem === NavItem.SEO) {
        const res = await getSEOTrends(prompt || "Tren affiliate marketing terbaru");
        setTextContent(res.text);
        setSources(res.sources);
      } else if (activeItem === NavItem.COPYWRITER) {
        const res = await generateCopywriting(images[0].file, "Naskah jualan persuasif");
        setTextContent(res);
      } else {
        const baseSysPrompt = SUB_MODE_PROMPTS[subMode] || "";
        const userPrompt = `${activeStyle}. ${prompt}`.trim();

        let finalResults: {url: string, angle: string}[] = [];
        if (isBatchMode) {
          const promises = BATCH_SET.map(code => 
            generateImage(images.map(i => i.file), bgRef[0]?.file || null, baseSysPrompt, userPrompt, ratio, quality, code)
              .then(url => ({ url, angle: code }))
              .catch(err => { throw new Error(`Gagal memproses angle ${code}: ${err.message}`); })
          );
          finalResults = await Promise.all(promises);
        } else {
          const url = await generateImage(images.map(i => i.file), bgRef[0]?.file || null, baseSysPrompt, userPrompt, ratio, quality, activeAngle);
          finalResults = [{ url, angle: activeAngle }];
        }
        
        setResults(finalResults);
        const newHistory = finalResults.map(r => ({ 
          ...r, 
          id: Math.random().toString(36).substr(2, 9), 
          timestamp: Date.now(), 
          mode: subMode, 
          category: activeItem 
        }));
        setHistory(prev => [...newHistory, ...prev]);
      }
    } catch (e: any) {
      console.error("Critical Generation Error:", e);
      let errorMsg = e.message || "Gagal memproses permintaan.";
      
      if (errorMsg.includes("API_KEY") || errorMsg.includes("not found")) {
        const aiStudio = (window as any).aistudio;
        if (aiStudio) await aiStudio.openSelectKey();
        errorMsg = "API Key bermasalah. Pastikan API_KEY sudah diset di Environment Variables Vercel.";
      }
      
      setError(errorMsg);
    } finally {
      setIsGenerating(false);
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
               { id: NavItem.UGC, label: 'UGC Studio', icon: Smartphone, color: 'bg-teal-500' },
               { id: NavItem.ADS, label: 'Ads Studio', icon: Megaphone, color: 'bg-orange-500' }
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
            <h1 className="text-4xl font-black text-slate-900">Riwayat Galeri</h1>
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
         <Lightbox images={lightboxImages} index={selectedIdx} onClose={() => setSelectedIdx(null)} onNext={() => setSelectedIdx(prev => (prev! + 1) % lightboxImages.length)} onPrev={() => setSelectedIdx(prev => (prev! - 1 + lightboxImages.length) % lightboxImages.length)} />
      </main>
    );
  }

  if (activeItem === NavItem.LEARNING) {
    return <main className="flex-1 overflow-y-auto p-12 bg-gray-50/50"><LearningCenter /></main>;
  }

  return (
    <main className="flex-1 overflow-y-auto p-6 lg:p-12 bg-gray-50/50 no-scrollbar">
      <div className="max-w-6xl mx-auto space-y-10 pb-40">
        <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-teal-500"><CheckCircle size={20} /></div>
                <div>
                    <h4 className="font-black text-xs uppercase tracking-widest">GenAI Session</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Ready to generate</p>
                </div>
            </div>
            <button onClick={() => (window as any).aistudio?.openSelectKey?.()} className="px-5 py-2.5 bg-white text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-teal-50">Select API Key</button>
        </div>

        <div className="bg-white rounded-[3.5rem] shadow-2xl border border-gray-100 p-10 lg:p-16 space-y-12">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <div className="p-4 bg-teal-50 text-teal-600 rounded-2xl"><Wand2 size={28} /></div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">{activeItem}</h2>
               </div>
               {![NavItem.SEO, NavItem.COPYWRITER, NavItem.HOME, NavItem.HISTORY, NavItem.LEARNING].includes(activeItem) && (
                 <button onClick={() => setIsBatchMode(!isBatchMode)} className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all border-2 ${isBatchMode ? 'bg-teal-500 border-teal-500 text-white shadow-lg' : 'bg-white border-gray-100 text-slate-400'}`}>
                    <LayoutGrid size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Batch Pro Mode {isBatchMode ? 'ON' : 'OFF'}</span>
                 </button>
               )}
            </div>

            {/* STUDIO OPTIONS */}
            {(activeItem === NavItem.COMMERCIAL || activeItem === NavItem.UGC || activeItem === NavItem.ADS) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {activeItem === NavItem.COMMERCIAL && [
                        { id: 'product-shot', label: 'Product Shot', icon: Box, desc: 'Studio photography mewah' },
                        { id: 'ai-fashion', label: 'AI Fashion', icon: Shirt, desc: 'Model manusia memakai produk' },
                        { id: 'mockup', label: 'Mockup', icon: Layers, desc: 'Integrasi desain logo/stiker' }
                    ].map(b => (
                        <button key={b.id} onClick={() => setSubMode(b.id)} className={`p-6 rounded-[2rem] border-2 text-left transition-all ${subMode === b.id ? 'bg-teal-50 border-teal-500 shadow-md scale-[1.02]' : 'bg-white border-gray-100 hover:border-teal-200'}`}>
                            <b.icon className={`mb-3 ${subMode === b.id ? 'text-teal-600' : 'text-slate-400'}`} size={20} />
                            <div className="font-black text-[10px] uppercase tracking-widest mb-1">{b.label}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{b.desc}</div>
                        </button>
                    ))}
                    {activeItem === NavItem.UGC && [
                        { id: 'selfie-review', label: 'Selfie Review', icon: Camera, desc: 'Social proof orang asli' },
                        { id: 'pov-hand', label: 'POV Hand', icon: Hand, desc: 'Tangan memegang produk' },
                        { id: 'unboxing-exp', label: 'Unboxing', icon: PackageOpen, desc: 'Kesan kiriman baru sampai' }
                    ].map(b => (
                        <button key={b.id} onClick={() => setSubMode(b.id)} className={`p-6 rounded-[2rem] border-2 text-left transition-all ${subMode === b.id ? 'bg-teal-50 border-teal-500 shadow-md scale-[1.02]' : 'bg-white border-gray-100 hover:border-teal-200'}`}>
                            <b.icon className={`mb-3 ${subMode === b.id ? 'text-teal-600' : 'text-slate-400'}`} size={20} />
                            <div className="font-black text-[10px] uppercase tracking-widest mb-1">{b.label}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{b.desc}</div>
                        </button>
                    ))}
                    {activeItem === NavItem.ADS && [
                        { id: 'web-banner', label: 'Web Banner', icon: Monitor, desc: 'Header e-commerce lebar' },
                        { id: 'youtube-thumbnail', label: 'YouTube Thumbnail', icon: Youtube, desc: 'Cover video kontras tinggi' },
                        { id: 'social-feed', label: 'Social Feed', icon: Instagram, desc: 'Konten feed IG/TikTok estetik' }
                    ].map(b => (
                        <button key={b.id} onClick={() => setSubMode(b.id)} className={`p-6 rounded-[2rem] border-2 text-left transition-all ${subMode === b.id ? 'bg-teal-50 border-teal-500 shadow-md scale-[1.02]' : 'bg-white border-gray-100 hover:border-teal-200'}`}>
                            <b.icon className={`mb-3 ${subMode === b.id ? 'text-teal-600' : 'text-slate-400'}`} size={20} />
                            <div className="font-black text-[10px] uppercase tracking-widest mb-1">{b.label}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{b.desc}</div>
                        </button>
                    ))}
                </div>
            )}

            {/* ENVIRONMENT & LIGHTING - 10 TYPES */}
            {![NavItem.SEO, NavItem.COPYWRITER].includes(activeItem) && (
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 flex items-center gap-2">
                   <Sun size={12} /> Lingkungan & Lighting
                </label>
                <div className="flex flex-wrap gap-2">
                    {ENVIRONMENTS.map(env => (
                        <button key={env} onClick={() => setActiveStyle(env)} className={`px-5 py-3 rounded-2xl text-[9px] font-black uppercase border-2 transition-all ${activeStyle === env ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-gray-50 border-gray-100 text-slate-400 hover:border-teal-300'}`}>
                            {env}
                        </button>
                    ))}
                </div>
              </div>
            )}

            {/* PRO SHOT ANGLES - 9 TYPES */}
            {!isBatchMode && ![NavItem.SEO, NavItem.COPYWRITER].includes(activeItem) && (
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 flex items-center gap-2">
                       <Camera size={12} /> Pro Shot Angles
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {PRO_ANGLES.map(a => (
                            <button key={a.code} onClick={() => setActiveAngle(a.code)} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${activeAngle === a.code ? 'bg-teal-500 border-teal-500 text-white shadow-md' : 'bg-white border-gray-100 text-slate-400 hover:border-teal-400'}`}>
                                <span className="font-black block text-[11px]">{a.code}</span>
                                <span className="text-[8px] opacity-70">{a.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <ImageUploader images={images} setImages={setImages} maxFiles={4} label="Foto Produk Utama" compact />
              {activeItem !== NavItem.COPYWRITER && <ImageUploader images={bgRef} setImages={setBgRef} maxFiles={1} label="Background Ref" compact />}
            </div>

            <div className="space-y-10">
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Custom Instruction</label>
                    <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Misal: 'Tambahkan efek embun' atau 'Buat suasana lebih dramatis'..." className="w-full h-24 bg-gray-50 border-2 border-gray-100 p-6 rounded-[2rem] outline-none focus:border-teal-500 text-sm font-medium" />
                </div>
                <div className="flex gap-4">
                  <select value={quality} onChange={e => setQuality(e.target.value as ImageQuality)} className="flex-1 bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl text-xs font-black uppercase outline-none focus:border-teal-500">
                    <option value={ImageQuality.STANDARD}>1K Standard</option>
                    <option value={ImageQuality.HD_2K}>2K Pro</option>
                    <option value={ImageQuality.ULTRA_HD_4K}>4K Ultra</option>
                  </select>
                  <select value={ratio} onChange={e => setRatio(e.target.value as AspectRatio)} className="flex-1 bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl text-xs font-black uppercase outline-none focus:border-teal-500">
                    <option value={AspectRatio.SQUARE}>1:1 Square</option>
                    <option value={AspectRatio.PORTRAIT}>9:16 Portrait</option>
                    <option value={AspectRatio.LANDSCAPE}>16:9 Landscape</option>
                  </select>
                </div>
                
                <button 
                  onClick={handleGenerate} 
                  disabled={isGenerating} 
                  className={`w-full py-8 rounded-[2.5rem] font-black text-white text-xl flex items-center justify-center gap-4 transition-all active:scale-95 ${isGenerating ? 'bg-slate-400 cursor-not-allowed' : 'bg-teal-500 hover:bg-teal-600 shadow-2xl hover:scale-[1.01]'}`}
                >
                    {isGenerating ? <Loader2 className="animate-spin" /> : <Zap size={24} />}
                    <span>{isGenerating ? 'PROCESSING...' : isBatchMode ? 'GENERATE 6 PRO SHOTS' : 'START GENERATION'}</span>
                </button>
            </div>
            
            {error && (
                <div className="p-6 bg-red-50 border-2 border-red-100 text-red-500 rounded-[2rem] flex items-center gap-4 animate-in slide-in-from-bottom-2">
                    <AlertTriangle className="shrink-0 text-red-600" />
                    <div className="text-xs font-bold leading-relaxed">{error}</div>
                </div>
            )}
        </div>

        {(results.length > 0 || textContent) && (
          <div className="bg-white p-10 lg:p-16 rounded-[4rem] shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-center justify-between mb-8 border-b pb-8">
                  <h3 className="text-2xl font-black text-slate-900">Hasil Magic Picture</h3>
                  <button onClick={() => {setResults([]); setTextContent("");}} className="text-slate-300 hover:text-red-500 transition-colors"><X size={32} /></button>
              </div>
              {results.length > 0 ? (
                 <div className={`grid gap-8 ${isBatchMode ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                    {results.map((res, i) => (
                      <div key={i} className="group relative rounded-[2rem] overflow-hidden border-4 border-gray-50 bg-slate-50 transition-all hover:border-teal-500 shadow-sm hover:shadow-xl">
                         <AngleBadge label={res.angle} />
                         <img src={res.url} className="w-full aspect-[3/4] object-cover" alt="Generated" />
                         <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4">
                            <button onClick={() => setSelectedIdx(i)} className="p-4 bg-white rounded-xl text-slate-900 hover:bg-teal-50"><Maximize2 size={20} /></button>
                            <a href={res.url} download className="p-4 bg-teal-500 rounded-xl text-white hover:bg-teal-600"><Download size={20} /></a>
                         </div>
                      </div>
                    ))}
                 </div>
              ) : (
                <div className="prose max-w-none">
                    <div className="text-slate-600 font-bold whitespace-pre-wrap leading-relaxed text-sm bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
                        {textContent}
                    </div>
                </div>
              )}
          </div>
        )}
      </div>
      <Lightbox images={lightboxImages} index={selectedIdx} onClose={() => setSelectedIdx(null)} onNext={() => setSelectedIdx(prev => (prev! + 1) % lightboxImages.length)} onPrev={() => setSelectedIdx(prev => (prev! - 1 + lightboxImages.length) % lightboxImages.length)} />
    </main>
  );
};

export default MainContent;
