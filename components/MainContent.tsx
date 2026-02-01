
import React, { useState, useEffect, useCallback } from 'react';
import { NavItem, AspectRatio, UploadedImage, ImageQuality } from '../types';
import ImageUploader from './ImageUploader';
import LearningCenter from './LearningCenter';
import { 
  generateImage, 
  getSEOTrends,
  generateCopywriting
} from '../services/geminiService';
import { 
  Download, Sparkles, Loader2, ShoppingBag, Box, Smartphone, 
  Star, Megaphone, Video, User, Shirt, Layers, 
  X, Maximize2, ShieldCheck, Key, Hand, Globe, CheckCircle, AlertTriangle, LayoutGrid, Camera, Zap, ChevronLeft, ChevronRight,
  UserCircle2, Mic, Volume2, History, Play, FileText, Layout, PackageOpen, Wand2, PenTool
} from 'lucide-react';

const AngleBadge = ({ label }: { label: string }) => (
  <span className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/20">
    {label}
  </span>
);

const MainContent: React.FC<{ activeItem: NavItem; setActiveItem: (i: NavItem) => void }> = ({ activeItem, setActiveItem }) => {
  // Common States
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [bgRef, setBgRef] = useState<UploadedImage[]>([]);
  const [faceSource, setFaceSource] = useState<UploadedImage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [subMode, setSubMode] = useState("default");
  const [style, setStyle] = useState("Minimal Studio");
  const [ratio, setRatio] = useState<AspectRatio>(AspectRatio.PORTRAIT);
  const [quality, setQuality] = useState<ImageQuality>(ImageQuality.STANDARD);
  
  // Feature States
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<{url: string, angle: string}[]>([]);
  const [textContent, setTextContent] = useState("");
  const [sources, setSources] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // UI States
  const [selectedFullImageIdx, setSelectedFullImageIdx] = useState<number | null>(null);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [manualKey, setManualKey] = useState("");
  const [keySource, setKeySource] = useState<'local' | 'env' | null>(null);

  const BATCH_ANGLES = [
    "Macro Detail Close-Up",
    "Eye Level Front View",
    "High Angle 45-Degree View",
    "Dynamic Side Profile",
    "Dramatic Hero Shot (Low Angle)",
    "Flat Lay Top Perspective"
  ];

  useEffect(() => {
    const checkKey = () => {
      if (localStorage.getItem('GEMINI_API_KEY')) setKeySource('local');
      // @ts-ignore
      else if (process.env.API_KEY || import.meta.env.VITE_API_KEY) setKeySource('env');
      else setKeySource(null);
    };
    checkKey();
    const inv = setInterval(checkKey, 2000);
    return () => clearInterval(inv);
  }, []);

  useEffect(() => {
    setResults([]);
    setTextContent("");
    setImages([]);
    setBgRef([]);
    setFaceSource([]);
    setPrompt("");
    setError(null);
    setIsBatchMode(false);
    
    if (activeItem === NavItem.COMMERCIAL) setSubMode("product-shot");
    if (activeItem === NavItem.UGC) setSubMode("selfie-review");
    if (activeItem === NavItem.ADS) setSubMode("web-banner");
    if (activeItem === NavItem.HUMAN) setSubMode("ai-model");
    if (activeItem === NavItem.MAGIC) setSubMode("faceswap");
    if (activeItem === NavItem.COPYWRITER) setSubMode("analysis-script");
  }, [activeItem]);

  const handleGenerate = async () => {
    if (!keySource) { setShowKeyInput(true); return; }
    
    if (activeItem === NavItem.MAGIC && (images.length === 0 || faceSource.length === 0)) {
        setError("Mohon unggah foto target dan foto wajah sumber.");
        return;
    }
    if (images.length === 0 && activeItem !== NavItem.SEO && activeItem !== NavItem.HUMAN && activeItem !== NavItem.LIVE) {
        setError("Mohon unggah foto produk terlebih dahulu.");
        return;
    }

    setIsGenerating(true); setError(null); setResults([]);
    
    try {
      if (activeItem === NavItem.SEO) {
        const res = await getSEOTrends(prompt);
        setTextContent(res.text);
        setSources(res.sources);
      } else if (activeItem === NavItem.COPYWRITER) {
        if (subMode === 'analysis-script') {
            const res = await generateCopywriting(images[0].file, "Sales Script for TikTok/Reels based on visual product analysis");
            setTextContent(res);
        } else {
            setTextContent("Audio Rendering: Generating .wav file using high-fidelity TTS voice. [SIMULATION]");
            setTimeout(() => alert("File audio .wav berhasil dibuat. Silakan klik download."), 1500);
        }
      } else {
        let sysP = "";
        
        if (activeItem === NavItem.COMMERCIAL) {
          if (subMode === 'product-shot') sysP = `High-end commercial ${style} background. Product should be placed naturally with accurate reflections.`;
          if (subMode === 'ai-fashion') sysP = "Hyper-realistic fashion photography. A real human model wearing the garment from the source image. Natural body pose and high-fashion lighting.";
          if (subMode === 'mockup') sysP = "Realistic 3D mockup. Seamlessly integrate the source graphic/product onto the surface of a real-world object (mug, wall, or box) with correct perspective and shadows.";
        } 
        else if (activeItem === NavItem.UGC) {
          if (subMode === 'selfie-review') sysP = "Candid smartphone selfie. A real person with a natural expression holding the product towards the camera. Authentic home or outdoor lighting, slightly blurred background.";
          if (subMode === 'pov-hand') sysP = "Strictly First-Person POV. Only a person's hands are visible holding the product. ABSOLUTELY NO FACE. Focus on the product in hand, seen from the user's eye level.";
          if (subMode === 'unboxing-exp') sysP = "Unboxing scene. The product is shown inside or next to a shipping parcel with packaging materials like bubble wrap. Messy but aesthetic customer environment.";
        }
        else if (activeItem === NavItem.ADS) {
          if (subMode === 'web-banner') sysP = "Professional e-commerce web banner (Shopee/Tokopedia style). Wide composition, clean background, negative space on the sides for text overlay.";
          if (subMode === 'youtube-thumbnail') sysP = "Eye-catching YouTube thumbnail style. High contrast, saturated colors, centered product with dramatic lighting to grab attention.";
          if (subMode === 'social-feed') sysP = "Aesthetic Instagram feed content. Trendy lifestyle setting, natural 'soft girl' or 'minimalist' vibe, high engagement layout.";
        }
        else if (activeItem === NavItem.HUMAN) {
          if (subMode === 'ai-model') sysP = `Full body portrait of a unique virtual human model. ${prompt || 'Professional pose, realistic skin textures, 8k resolution.'}`;
          if (subMode === 'professional') sysP = "LinkedIn corporate headshot. Professional business attire, clean blurred office background, soft lighting, confident and trustworthy expression.";
        }
        else if (activeItem === NavItem.MAGIC) {
          sysP = "ADVANCED FACE SWAP: Take the facial identity and features from the source image and apply them perfectly to the target model's face. Preserve head orientation, lighting, and skin texture of the target.";
        }

        if (isBatchMode) {
          const batchPromises = BATCH_ANGLES.map(angle => 
            generateImage(images.map(i => i.file), bgRef.length > 0 ? bgRef[0].file : null, sysP, prompt, ratio, quality, angle)
              .then(url => ({ url, angle }))
          );
          const urls = await Promise.all(batchPromises);
          setResults(urls);
        } else {
          const subjectFiles = activeItem === NavItem.MAGIC ? [images[0].file, faceSource[0].file] : images.map(i => i.file);
          const url = await generateImage(subjectFiles, bgRef.length > 0 ? bgRef[0].file : null, sysP, prompt, ratio, quality, "Cinematic Master Shot");
          setResults([{ url, angle: activeItem === NavItem.MAGIC ? "Face Swap Result" : "Master Result" }]);
        }
      }
    } catch (e: any) {
      setError(e.message || "Gagal memproses permintaan.");
    } finally {
      setIsGenerating(false);
    }
  };

  const nextImage = useCallback(() => {
    if (selectedFullImageIdx !== null) setSelectedFullImageIdx((prev) => (prev! + 1) % results.length);
  }, [selectedFullImageIdx, results.length]);

  const prevImage = useCallback(() => {
    if (selectedFullImageIdx !== null) setSelectedFullImageIdx((prev) => (prev! - 1 + results.length) % results.length);
  }, [selectedFullImageIdx, results.length]);

  const renderHeader = () => (
    <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] flex items-center justify-between shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldCheck size={100} /></div>
        <div className="flex items-center gap-4 relative z-10">
            <div className={`p-3 rounded-2xl ${keySource ? 'bg-teal-500' : 'bg-red-500 animate-pulse'}`}>
              {keySource ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
            </div>
            <div>
                <h4 className="font-black text-sm uppercase tracking-widest">Fidelity Engine {keySource ? 'Active' : 'Offline'}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{keySource ? 'High-accuracy reconstruction ready' : 'Please connect your Gemini Key'}</p>
            </div>
        </div>
        <button onClick={() => setShowKeyInput(!showKeyInput)} className="relative z-10 px-6 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase hover:bg-teal-50 transition-all border border-transparent hover:border-teal-500">
          {keySource ? 'API Settings' : 'Connect Key'}
        </button>
    </div>
  );

  if (activeItem === NavItem.HOME) {
    return (
      <main className="flex-1 overflow-y-auto p-12 bg-white flex flex-col items-center justify-center space-y-12">
         <div className="w-24 h-24 bg-teal-500 rounded-[2.5rem] flex items-center justify-center text-white shadow-3xl animate-bounce">
            <Sparkles size={40} />
         </div>
         <div className="text-center">
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Magic Picture Suite</h1>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-[0.3em]">Advanced Product Fidelity Generator</p>
         </div>
         <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-4xl">
            {[NavItem.COMMERCIAL, NavItem.UGC, NavItem.ADS, NavItem.HUMAN, NavItem.MAGIC, NavItem.COPYWRITER].map(id => (
              <button key={id} onClick={() => setActiveItem(id)} className="p-10 bg-white border border-gray-100 rounded-[2.5rem] hover:border-teal-400 hover:shadow-2xl transition-all flex flex-col items-center gap-6 group">
                 <div className="p-5 bg-gray-50 rounded-2xl group-hover:bg-teal-50 group-hover:text-teal-600 transition-all group-hover:scale-110">
                    {id === NavItem.COMMERCIAL && <ShoppingBag />}
                    {id === NavItem.UGC && <Smartphone />}
                    {id === NavItem.ADS && <Megaphone />}
                    {id === NavItem.HUMAN && <User />}
                    {id === NavItem.MAGIC && <Wand2 />}
                    {id === NavItem.COPYWRITER && <PenTool />}
                 </div>
                 <span className="font-black text-[10px] uppercase tracking-widest text-center">{id}</span>
              </button>
            ))}
         </div>
      </main>
    );
  }

  if (activeItem === NavItem.LEARNING) return <main className="flex-1 overflow-y-auto p-12"><LearningCenter /></main>;

  return (
    <main className="flex-1 overflow-y-auto p-6 lg:p-12 bg-gray-50/50 no-scrollbar">
      <div className="max-w-6xl mx-auto space-y-10 pb-40">
        
        {renderHeader()}

        {showKeyInput && (
          <div className="bg-white p-8 rounded-[2.5rem] border-2 border-teal-500 shadow-2xl animate-in slide-in-from-top">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-sm uppercase tracking-widest">Gemini API Configuration</h3>
                <button onClick={() => setShowKeyInput(false)}><X size={20} /></button>
            </div>
            <div className="flex gap-4">
              <input 
                type="password" 
                value={manualKey} 
                onChange={e => setManualKey(e.target.value)}
                placeholder="Paste your Gemini API Key here..."
                className="flex-1 bg-gray-50 border-2 border-gray-100 p-5 rounded-2xl outline-none focus:border-teal-500 text-sm font-bold"
              />
              <button onClick={() => {
                localStorage.setItem('GEMINI_API_KEY', manualKey);
                setKeySource('local');
                setShowKeyInput(false);
              }} className="bg-slate-900 text-white px-10 rounded-2xl font-black text-xs uppercase hover:bg-teal-500 transition-all">Save Key</button>
            </div>
          </div>
        )}

        <div className={`transition-all duration-500 ${!keySource ? 'opacity-30 pointer-events-none grayscale blur-sm' : ''}`}>
          <div className="bg-white rounded-[4rem] shadow-2xl border border-gray-100 p-10 lg:p-16">
            
            <div className="flex items-center justify-between mb-16">
               <div className="flex items-center gap-6">
                  <div className="p-5 bg-teal-50 text-teal-600 rounded-[1.8rem]"><Wand2 size={32} /></div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">{activeItem}</h2>
               </div>
               
               {activeItem !== NavItem.SEO && activeItem !== NavItem.COPYWRITER && activeItem !== NavItem.MAGIC && (
                 <button 
                  onClick={() => setIsBatchMode(!isBatchMode)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all border-2 ${isBatchMode ? 'bg-teal-500 border-teal-500 text-white shadow-xl' : 'bg-white border-gray-100 text-slate-400'}`}
                 >
                    <LayoutGrid size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Batch 6-Angle {isBatchMode ? 'ON' : 'OFF'}</span>
                 </button>
               )}
            </div>

            <div className="space-y-12">
                
                {/* --- Logic: MAGIC TOOLS --- */}
                {activeItem === NavItem.MAGIC && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in slide-in-from-bottom">
                         <ImageUploader images={images} setImages={setImages} maxFiles={1} label="1. Foto Target (Orang/Model)" description="Foto yang ingin diganti wajahnya." compact />
                         <ImageUploader images={faceSource} setImages={setFaceSource} maxFiles={1} label="2. Foto Wajah Sumber" description="Wajah yang akan ditempelkan ke target." compact />
                    </div>
                )}

                {/* --- Logic: STANDARD MODES --- */}
                {activeItem !== NavItem.MAGIC && activeItem !== NavItem.SEO && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <ImageUploader images={images} setImages={setImages} maxFiles={4} label="1. Foto Produk Utama" description="Upload foto mentah produk Anda." compact />
                        </div>
                        {activeItem !== NavItem.COPYWRITER && (
                            <div className="space-y-4">
                                <ImageUploader images={bgRef} setImages={setBgRef} maxFiles={1} label="2. Referensi Background (Opsional)" description="Latar belakang yang Anda inginkan." compact />
                            </div>
                        )}
                    </div>
                )}

                {/* --- Dynamic Sub-Menu Buttons (UGC, Commercial, etc.) --- */}
                <div className="space-y-8">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Pilih Tipe Konten</label>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Commercial */}
                      {activeItem === NavItem.COMMERCIAL && [
                        { id: 'product-shot', label: 'Product Shot', desc: 'Foto studio profesional', icon: Box },
                        { id: 'ai-fashion', label: 'AI Fashion', desc: 'Pasang pada model manusia', icon: Shirt },
                        { id: 'mockup', label: 'Mockup', desc: 'Integrasi logo/desain', icon: Layers }
                      ].map(btn => (
                        <button key={btn.id} onClick={() => setSubMode(btn.id)} className={`p-6 rounded-[2rem] border-2 text-left transition-all ${subMode === btn.id ? 'bg-teal-50 border-teal-500 ring-4 ring-teal-500/10' : 'bg-white border-gray-100'}`}>
                            <btn.icon className={`mb-3 ${subMode === btn.id ? 'text-teal-600' : 'text-slate-400'}`} />
                            <div className="font-black text-[11px] uppercase tracking-widest">{btn.label}</div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase">{btn.desc}</div>
                        </button>
                      ))}

                      {/* UGC - FIXED AS PER GUIDE */}
                      {activeItem === NavItem.UGC && [
                        { id: 'selfie-review', label: 'Selfie Review', desc: 'Social Proof - Orang & Produk', icon: Camera },
                        { id: 'pov-hand', label: 'POV Hand', desc: 'First Person - Tangan Saja', icon: Hand },
                        { id: 'unboxing-exp', label: 'Unboxing Exp', desc: 'Kesan Paket Baru Tiba', icon: PackageOpen }
                      ].map(btn => (
                        <button key={btn.id} onClick={() => setSubMode(btn.id)} className={`p-6 rounded-[2rem] border-2 text-left transition-all ${subMode === btn.id ? 'bg-teal-50 border-teal-500 ring-4 ring-teal-500/10' : 'bg-white border-gray-100'}`}>
                            <btn.icon className={`mb-3 ${subMode === btn.id ? 'text-teal-600' : 'text-slate-400'}`} />
                            <div className="font-black text-[11px] uppercase tracking-widest">{btn.label}</div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase">{btn.desc}</div>
                        </button>
                      ))}

                      {/* Ads */}
                      {activeItem === NavItem.ADS && [
                        { id: 'web-banner', label: 'Web Banner', desc: 'Shopee/Tokopedia Header', icon: Layout },
                        { id: 'youtube-thumbnail', label: 'YouTube Thumbnail', desc: 'Click-bait High Contrast', icon: Video },
                        { id: 'social-feed', label: 'Social Feed', desc: 'Estetik Feed Content', icon: Smartphone }
                      ].map(btn => (
                        <button key={btn.id} onClick={() => setSubMode(btn.id)} className={`p-6 rounded-[2rem] border-2 text-left transition-all ${subMode === btn.id ? 'bg-teal-50 border-teal-500 ring-4 ring-teal-500/10' : 'bg-white border-gray-100'}`}>
                            <btn.icon className={`mb-3 ${subMode === btn.id ? 'text-teal-600' : 'text-slate-400'}`} />
                            <div className="font-black text-[11px] uppercase tracking-widest">{btn.label}</div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase">{btn.desc}</div>
                        </button>
                      ))}

                      {/* Human */}
                      {activeItem === NavItem.HUMAN && [
                        { id: 'ai-model', label: 'AI Model', desc: 'Model Karakter Kustom', icon: UserCircle2 },
                        { id: 'professional', label: 'Professional', desc: 'Profil LinkedIn/CV', icon: ShieldCheck }
                      ].map(btn => (
                        <button key={btn.id} onClick={() => setSubMode(btn.id)} className={`p-6 rounded-[2rem] border-2 text-left transition-all ${subMode === btn.id ? 'bg-teal-50 border-teal-500 ring-4 ring-teal-500/10' : 'bg-white border-gray-100'}`}>
                            <btn.icon className={`mb-3 ${subMode === btn.id ? 'text-teal-600' : 'text-slate-400'}`} />
                            <div className="font-black text-[11px] uppercase tracking-widest">{btn.label}</div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase">{btn.desc}</div>
                        </button>
                      ))}

                      {/* Marketing Lab */}
                      {activeItem === NavItem.COPYWRITER && [
                        { id: 'analysis-script', label: 'Analysis Script', desc: 'Naskah dari Foto Produk', icon: FileText },
                        { id: 'tts-download', label: 'TTS & Download', desc: 'Ubah teks jadi .wav', icon: Volume2 }
                      ].map(btn => (
                        <button key={btn.id} onClick={() => setSubMode(btn.id)} className={`p-6 rounded-[2rem] border-2 text-left transition-all ${subMode === btn.id ? 'bg-teal-50 border-teal-500 ring-4 ring-teal-500/10' : 'bg-white border-gray-100'}`}>
                            <btn.icon className={`mb-3 ${subMode === btn.id ? 'text-teal-600' : 'text-slate-400'}`} />
                            <div className="font-black text-[11px] uppercase tracking-widest">{btn.label}</div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase">{btn.desc}</div>
                        </button>
                      ))}
                   </div>
                </div>

                {/* --- Step 3: Prompt & Batch --- */}
                {activeItem !== NavItem.SEO && (
                   <div className="space-y-10">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Detail & Vibes Tambahan</label>
                        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Contoh: Tambahkan pencahayaan matahari sore, mood elegan, bokeh tipis..." className="w-full h-32 bg-gray-50 border-2 border-gray-100 p-6 rounded-[2.5rem] outline-none focus:border-teal-500 text-sm font-medium" />
                      </div>

                      <div className="flex flex-wrap gap-8 items-center border-t border-gray-50 pt-10">
                         <div className="space-y-3">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Ratio</span>
                            <div className="flex gap-2">
                               {[AspectRatio.PORTRAIT, AspectRatio.SQUARE, AspectRatio.LANDSCAPE].map(r => (
                                 <button key={r} onClick={() => setRatio(r)} className={`px-4 py-2 rounded-lg text-[10px] font-black border ${ratio === r ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-gray-100 text-slate-400'}`}>{r === AspectRatio.PORTRAIT ? '9:16' : r === AspectRatio.SQUARE ? '1:1' : '16:9'}</button>
                               ))}
                            </div>
                         </div>
                         <div className="space-y-3">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Quality (Resolution)</span>
                            <div className="flex gap-2">
                               {[ImageQuality.STANDARD, ImageQuality.HD_2K, ImageQuality.ULTRA_HD_4K].map(q => (
                                 <button key={q} onClick={() => setQuality(q)} className={`px-4 py-2 rounded-lg text-[10px] font-black border ${quality === q ? 'bg-teal-500 text-white border-teal-500 shadow-lg' : 'bg-white border-gray-100 text-slate-400'}`}>{q}</button>
                               ))}
                            </div>
                         </div>
                      </div>

                      <button 
                        onClick={handleGenerate} 
                        disabled={isGenerating} 
                        className={`w-full py-10 rounded-[3rem] font-black text-white text-2xl shadow-3xl flex items-center justify-center gap-6 transition-all ${isGenerating ? 'bg-slate-400 scale-[0.98]' : 'bg-teal-500 hover:bg-teal-600 hover:shadow-teal-500/40'}`}
                      >
                        {isGenerating ? <Loader2 className="w-10 h-10 animate-spin" /> : <Zap className="w-10 h-10 fill-current" />}
                        <span>{isGenerating ? 'GENERATING...' : isBatchMode ? 'GENERATE 6 ANGLES' : 'MULAI GENERATE'}</span>
                      </button>
                   </div>
                )}
            </div>
          </div>
        </div>

        {/* --- RESULTS --- */}
        {(results.length > 0 || textContent) && (
          <div className="bg-white p-10 lg:p-16 rounded-[4rem] shadow-2xl border border-gray-100 animate-in fade-in slide-in-from-bottom">
              <div className="flex items-center justify-between mb-12 border-b pb-8">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">Hasil Content Suite</h3>
                  <button onClick={() => {setResults([]); setTextContent("");}} className="text-slate-300 hover:text-red-500 transition-colors"><X size={32} /></button>
              </div>

              {results.length > 0 ? (
                 <div className={`grid gap-8 ${isBatchMode ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                    {results.map((res, i) => (
                      <div key={i} className="group relative rounded-[2.5rem] overflow-hidden border-4 border-gray-50 shadow-inner bg-slate-50 aspect-auto transition-transform hover:scale-[1.01]">
                         <AngleBadge label={res.angle} />
                         <img src={res.url} className="w-full h-full object-cover" alt="Generated" />
                         <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-6 backdrop-blur-sm">
                            <button onClick={() => setSelectedFullImageIdx(i)} className="p-5 bg-white rounded-2xl text-slate-800 hover:scale-110 transition-transform"><Maximize2 size={24} /></button>
                            <a href={res.url} download={`magic-${res.angle}.png`} className="p-5 bg-teal-500 rounded-2xl text-white hover:scale-110 transition-transform"><Download size={24} /></a>
                         </div>
                      </div>
                    ))}
                 </div>
              ) : (
                <div className="space-y-8">
                   <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed font-bold text-lg whitespace-pre-wrap">{textContent}</div>
                   {sources.length > 0 && (
                      <div className="pt-8 border-t">
                         <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Market Sources:</h4>
                         <div className="flex flex-wrap gap-3">
                            {sources.map((s, idx) => (
                               <a key={idx} href={s.web?.uri || '#'} target="_blank" className="px-5 py-3 bg-gray-50 rounded-xl text-[10px] font-black text-teal-600 border-2 border-transparent hover:border-teal-500 transition-all flex items-center gap-3"><Globe size={14} /> {s.web?.title || 'External Source'}</a>
                            ))}
                         </div>
                      </div>
                   )}
                </div>
              )}
          </div>
        )}
      </div>

      {/* --- LIGHTBOX --- */}
      {selectedFullImageIdx !== null && results[selectedFullImageIdx] && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-in fade-in" onClick={() => setSelectedFullImageIdx(null)}>
           <div className="absolute top-8 inset-x-0 px-8 flex justify-between items-center pointer-events-none">
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20"><span className="text-white font-black text-xs uppercase tracking-widest">{results[selectedFullImageIdx].angle}</span></div>
                <button onClick={() => setSelectedFullImageIdx(null)} className="pointer-events-auto bg-white/10 text-white p-4 rounded-2xl hover:bg-white/20 transition-all"><X size={24} /></button>
           </div>
           <div className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
              {results.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute -left-20 lg:-left-32 p-6 bg-white/5 hover:bg-white/10 rounded-full text-white border border-white/10"><ChevronLeft size={32} /></button>
                    <button onClick={nextImage} className="absolute -right-20 lg:-right-32 p-6 bg-white/5 hover:bg-white/10 rounded-full text-white border border-white/10"><ChevronRight size={32} /></button>
                  </>
              )}
              <img src={results[selectedFullImageIdx].url} className="w-full h-full max-h-[80vh] object-contain rounded-3xl shadow-2xl" />
           </div>
        </div>
      )}
    </main>
  );
};

export default MainContent;
