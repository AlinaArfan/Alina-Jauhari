
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
  ZoomIn, Wand2, Search, Info, PenTool, PackageOpen, 
  X, Maximize2, ShieldCheck, Key, RotateCw, Hand, Globe, CheckCircle, AlertTriangle, Eye, EyeOff, LayoutGrid, Camera, Zap, ChevronLeft, ChevronRight,
  UserCircle2, Mic, MicOff, Volume2, History, Play, FileText, Layout
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
    "Extreme Close-Up (ECU)",
    "Eye Level Frontal",
    "Dynamic 3/4 View",
    "High Angle Lookdown",
    "Low Angle Hero Shot",
    "Flat Lay Top View"
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
    
    // Set default sub-modes for each section
    if (activeItem === NavItem.COMMERCIAL) setSubMode("product-shot");
    if (activeItem === NavItem.UGC) setSubMode("selfie-review");
    if (activeItem === NavItem.ADS) setSubMode("web-banner");
    if (activeItem === NavItem.HUMAN) setSubMode("ai-model");
    if (activeItem === NavItem.MAGIC) setSubMode("faceswap");
    if (activeItem === NavItem.COPYWRITER) setSubMode("analysis-script");
  }, [activeItem]);

  const handleGenerate = async () => {
    if (!keySource) { setShowKeyInput(true); return; }
    
    // Validasi Dasar
    if (activeItem === NavItem.MAGIC && (images.length === 0 || faceSource.length === 0)) {
        setError("Mohon unggah foto target dan foto wajah sumber.");
        return;
    }
    if (images.length === 0 && 
        activeItem !== NavItem.SEO && 
        activeItem !== NavItem.HUMAN && 
        activeItem !== NavItem.LIVE) {
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
        // Marketing Lab Logic
        if (subMode === 'analysis-script') {
            const res = await generateCopywriting(images[0].file, "Sales Script based on product image analysis");
            setTextContent(res);
        } else {
            // Simulated TTS Logic for now as per constraints
            setTextContent("Audio processing logic initiated... [TTS Simulation active]");
            setTimeout(() => {
                alert("Simulasi Download: File .wav siap diunduh.");
            }, 1000);
        }
      } else {
        // Build System Prompt based on user guide
        let sysP = "";
        
        if (activeItem === NavItem.COMMERCIAL) {
          if (subMode === 'product-shot') sysP = `High-end commercial ${style} setting. Transform raw product into professional studio photography.`;
          if (subMode === 'ai-fashion') sysP = "Professional fashion photography. Place the garment from the source image onto a realistic human model with a natural pose.";
          if (subMode === 'mockup') sysP = "Realistic product mockup. Digitally apply the design or product onto a 3D surface of a real-world object (mug, wall, packaging).";
        } 
        else if (activeItem === NavItem.UGC) {
          if (subMode === 'selfie-review') sysP = "Authentic customer testimonial. A real person taking a smartphone selfie while holding or using the product. Natural home lighting.";
          if (subMode === 'pov-hand') sysP = "First-person point of view (POV). Only show human hands interacting with or holding the product. NO FACE should be visible. Eye-level perspective.";
          if (subMode === 'unboxing-exp') sysP = "Authentic unboxing scene. Product in a natural indoor environment, partially removed from shipping boxes or bubble wrap.";
        }
        else if (activeItem === NavItem.ADS) {
          if (subMode === 'web-banner') sysP = "Clean and professional website header banner. Wide aspect ratio, ample negative space for marketing text.";
          if (subMode === 'youtube-thumbnail') sysP = "High-contrast, attention-grabbing YouTube cover style. Vibrant colors, slightly exaggerated but professional composition.";
          if (subMode === 'social-feed') sysP = "Aesthetic Instagram or TikTok feed content. Trendy, lifestyle-focused composition with high engagement vibes.";
        }
        else if (activeItem === NavItem.HUMAN) {
          if (subMode === 'ai-model') sysP = "Hyper-realistic virtual human character. Specify age, ethnicity, and hair style if provided. High fashion lighting.";
          if (subMode === 'professional') sysP = "Professional corporate headshot for LinkedIn or CV. Neutral blurred background, formal business attire, confident expression.";
        }
        else if (activeItem === NavItem.MAGIC) {
          sysP = "FACE SWAP: Flawlessly replace the face in image 1 with the features and identity from image 2. Maintain skin tone and lighting.";
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
          const url = await generateImage(subjectFiles, bgRef.length > 0 ? bgRef[0].file : null, sysP, prompt, ratio, quality, "Standard View");
          setResults([{ url, angle: "Generated Content" }]);
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
                <h4 className="font-black text-sm uppercase tracking-widest">Engine {keySource ? 'Ready' : 'Offline'}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{keySource ? 'System initialized successfully' : 'Please connect your Gemini Key'}</p>
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
            <p className="text-slate-400 font-bold text-sm uppercase tracking-[0.3em]">Hyper-Realistic Affiliate Generator</p>
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

  if (activeItem === NavItem.LIVE) {
    return (
        <main className="flex-1 overflow-y-auto p-6 lg:p-12 bg-slate-950 flex flex-col items-center justify-center text-white">
            <div className="max-w-4xl w-full space-y-12 text-center">
                <div className="relative inline-block">
                    <div className="w-48 h-48 bg-teal-500/20 rounded-full flex items-center justify-center animate-pulse">
                        <div className="w-32 h-32 bg-teal-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(20,184,166,0.5)]">
                             <Mic size={48} className="text-white" />
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <h2 className="text-4xl font-black tracking-tighter">Live Voice Assistant</h2>
                    <p className="text-slate-400 font-medium max-w-md mx-auto italic uppercase text-[10px] tracking-widest">Powered by Gemini Real-time Multimodal</p>
                </div>
                <div className="flex justify-center gap-6">
                    <button className="px-10 py-5 bg-teal-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-teal-600 transition-all flex items-center gap-3">
                        <Play size={18} /> Mulai Percakapan
                    </button>
                </div>
            </div>
        </main>
    );
  }

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
                
                {/* --- Logic: MAGIC TOOLS / FACE SWAP --- */}
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
                            <ImageUploader images={images} setImages={setImages} maxFiles={4} label="1. Foto Produk Utama" description="Upload minimal 3 sudut untuk hasil terbaik." compact />
                        </div>
                        {activeItem !== NavItem.COPYWRITER && (
                            <div className="space-y-4">
                                <ImageUploader images={bgRef} setImages={setBgRef} maxFiles={1} label="2. Referensi Background (Opsional)" description="Gunakan latar belakang impian Anda." compact />
                            </div>
                        )}
                    </div>
                )}

                {/* --- Dynamic Sub-Menu Buttons --- */}
                <div className="space-y-8">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Pilih Tipe Konten</label>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Commercial Buttons */}
                      {activeItem === NavItem.COMMERCIAL && [
                        { id: 'product-shot', label: 'Product Shot', desc: 'Ubah latar jadi studio', icon: Box },
                        { id: 'ai-fashion', label: 'AI Fashion', desc: 'Pasang baju pada model', icon: Shirt },
                        { id: 'mockup', label: 'Mockup', desc: 'Tempel logo pada benda', icon: Layers }
                      ].map(btn => (
                        <button key={btn.id} onClick={() => setSubMode(btn.id)} className={`p-6 rounded-[2rem] border-2 text-left transition-all ${subMode === btn.id ? 'bg-teal-50 border-teal-500 ring-4 ring-teal-500/10' : 'bg-white border-gray-100'}`}>
                            <btn.icon className={`mb-3 ${subMode === btn.id ? 'text-teal-600' : 'text-slate-400'}`} />
                            <div className="font-black text-[11px] uppercase tracking-widest">{btn.label}</div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase">{btn.desc}</div>
                        </button>
                      ))}

                      {/* UGC Buttons */}
                      {activeItem === NavItem.UGC && [
                        { id: 'selfie-review', label: 'Selfie Review', desc: 'Foto selfie memegang produk', icon: Camera },
                        { id: 'pov-hand', label: 'POV Hand', desc: 'Hanya tangan, tanpa wajah', icon: Hand },
                        { id: 'unboxing-exp', label: 'Unboxing Exp', desc: 'Gaya buka paket kiriman', icon: PackageOpen }
                      ].map(btn => (
                        <button key={btn.id} onClick={() => setSubMode(btn.id)} className={`p-6 rounded-[2rem] border-2 text-left transition-all ${subMode === btn.id ? 'bg-teal-50 border-teal-500 ring-4 ring-teal-500/10' : 'bg-white border-gray-100'}`}>
                            <btn.icon className={`mb-3 ${subMode === btn.id ? 'text-teal-600' : 'text-slate-400'}`} />
                            <div className="font-black text-[11px] uppercase tracking-widest">{btn.label}</div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase">{btn.desc}</div>
                        </button>
                      ))}

                      {/* Ads Buttons */}
                      {activeItem === NavItem.ADS && [
                        { id: 'web-banner', label: 'Web Banner', desc: 'Header Shopee/Tokopedia', icon: Layout },
                        { id: 'youtube-thumbnail', label: 'YouTube Thumbnail', desc: 'Cover video kontras', icon: Video },
                        { id: 'social-feed', label: 'Social Feed', desc: 'Post Instagram/TikTok', icon: Smartphone }
                      ].map(btn => (
                        <button key={btn.id} onClick={() => setSubMode(btn.id)} className={`p-6 rounded-[2rem] border-2 text-left transition-all ${subMode === btn.id ? 'bg-teal-50 border-teal-500 ring-4 ring-teal-500/10' : 'bg-white border-gray-100'}`}>
                            <btn.icon className={`mb-3 ${subMode === btn.id ? 'text-teal-600' : 'text-slate-400'}`} />
                            <div className="font-black text-[11px] uppercase tracking-widest">{btn.label}</div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase">{btn.desc}</div>
                        </button>
                      ))}

                      {/* Human Buttons */}
                      {activeItem === NavItem.HUMAN && [
                        { id: 'ai-model', label: 'AI Model', desc: 'Karakter model dari nol', icon: UserCircle2 },
                        { id: 'professional', label: 'Professional', desc: 'Foto profil LinkedIn/CV', icon: ShieldCheck }
                      ].map(btn => (
                        <button key={btn.id} onClick={() => setSubMode(btn.id)} className={`p-6 rounded-[2rem] border-2 text-left transition-all ${subMode === btn.id ? 'bg-teal-50 border-teal-500 ring-4 ring-teal-500/10' : 'bg-white border-gray-100'}`}>
                            <btn.icon className={`mb-3 ${subMode === btn.id ? 'text-teal-600' : 'text-slate-400'}`} />
                            <div className="font-black text-[11px] uppercase tracking-widest">{btn.label}</div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase">{btn.desc}</div>
                        </button>
                      ))}

                      {/* Marketing Lab Buttons */}
                      {activeItem === NavItem.COPYWRITER && [
                        { id: 'analysis-script', label: 'Analysis Script', desc: 'Naskah jualan dari foto', icon: FileText },
                        { id: 'tts-download', label: 'TTS & Download', desc: 'Ubah teks jadi suara .wav', icon: Volume2 }
                      ].map(btn => (
                        <button key={btn.id} onClick={() => setSubMode(btn.id)} className={`p-6 rounded-[2rem] border-2 text-left transition-all ${subMode === btn.id ? 'bg-teal-50 border-teal-500 ring-4 ring-teal-500/10' : 'bg-white border-gray-100'}`}>
                            <btn.icon className={`mb-3 ${subMode === btn.id ? 'text-teal-600' : 'text-slate-400'}`} />
                            <div className="font-black text-[11px] uppercase tracking-widest">{btn.label}</div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase">{btn.desc}</div>
                        </button>
                      ))}
                   </div>
                </div>

                {/* --- Step 3: Global Controls --- */}
                {activeItem !== NavItem.SEO && (
                   <div className="space-y-10">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Detail Tambahan (Opsional)</label>
                        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Contoh: Mood ceria, matahari sore, bokeh tipis, nuansa elegan..." className="w-full h-32 bg-gray-50 border-2 border-gray-100 p-6 rounded-[2.5rem] outline-none focus:border-teal-500 text-sm font-medium" />
                      </div>

                      <div className="flex flex-wrap gap-8 items-center border-t border-gray-50 pt-10">
                         <div className="space-y-3">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Output Ratio</span>
                            <div className="flex gap-2">
                               {[AspectRatio.PORTRAIT, AspectRatio.SQUARE, AspectRatio.LANDSCAPE].map(r => (
                                 <button key={r} onClick={() => setRatio(r)} className={`px-4 py-2 rounded-lg text-[10px] font-black border ${ratio === r ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-gray-100 text-slate-400'}`}>{r === AspectRatio.PORTRAIT ? 'TikTok' : r === AspectRatio.SQUARE ? 'Insta' : 'Banner'}</button>
                               ))}
                            </div>
                         </div>
                         <div className="space-y-3">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Quality Mode</span>
                            <div className="flex gap-2">
                               {[ImageQuality.STANDARD, ImageQuality.HD_2K, ImageQuality.ULTRA_HD_4K].map(q => (
                                 <button key={q} onClick={() => setQuality(q)} className={`px-4 py-2 rounded-lg text-[10px] font-black border ${quality === q ? 'bg-teal-500 text-white border-teal-500 shadow-lg shadow-teal-500/20' : 'bg-white border-gray-100 text-slate-400'}`}>{q}</button>
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
                        <span>{isGenerating ? 'SEDANG MEMPROSES...' : isBatchMode ? 'GENERATE 6 SUDUT' : 'MULAI GENERATE'}</span>
                      </button>
                   </div>
                )}

                {error && (
                    <div className="bg-red-50 border-2 border-red-100 p-8 rounded-[2.5rem] flex items-start gap-6 animate-shake">
                        <AlertTriangle className="text-red-500 shrink-0 w-8 h-8" />
                        <div>
                           <h5 className="font-black text-red-600 text-sm uppercase mb-1 tracking-widest">Gagal</h5>
                           <p className="text-xs text-red-500 leading-relaxed font-bold">{error}</p>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>

        {/* --- RESULTS SECTION --- */}
        {(results.length > 0 || textContent) && (
          <div className="bg-white p-10 lg:p-16 rounded-[4rem] shadow-2xl border border-gray-100 animate-in fade-in slide-in-from-bottom duration-700">
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
                            <button 
                              onClick={() => setSelectedFullImageIdx(i)} 
                              className="p-5 bg-white rounded-2xl text-slate-800 hover:scale-110 transition-transform shadow-xl"
                            >
                              <Maximize2 size={24} />
                            </button>
                            <a 
                                href={res.url} 
                                download={`magic-${res.angle}.png`} 
                                className="p-5 bg-teal-500 rounded-2xl text-white hover:scale-110 transition-transform shadow-xl"
                            >
                              <Download size={24} />
                            </a>
                         </div>
                      </div>
                    ))}
                 </div>
              ) : (
                <div className="space-y-8">
                   <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed font-bold text-lg whitespace-pre-wrap">
                      {textContent}
                   </div>
                   {sources.length > 0 && (
                      <div className="pt-8 border-t">
                         <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Market Sources:</h4>
                         <div className="flex flex-wrap gap-3">
                            {sources.map((s, idx) => (
                               <a key={idx} href={s.web?.uri || '#'} target="_blank" className="px-5 py-3 bg-gray-50 rounded-xl text-[10px] font-black text-teal-600 border-2 border-transparent hover:border-teal-500 transition-all flex items-center gap-3">
                                  <Globe size={14} /> {s.web?.title || 'Source'}
                               </a>
                            ))}
                         </div>
                      </div>
                   )}
                </div>
              )}
          </div>
        )}
      </div>

      {/* --- LIGHTBOX MODAL --- */}
      {selectedFullImageIdx !== null && results[selectedFullImageIdx] && (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300"
            onClick={() => setSelectedFullImageIdx(null)}
        >
           <div className="absolute top-8 inset-x-0 px-8 flex justify-between items-center pointer-events-none">
                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                    <span className="text-white font-black text-xs uppercase tracking-widest">{results[selectedFullImageIdx].angle}</span>
                </div>
                <div className="flex items-center gap-3 pointer-events-auto">
                    <button onClick={() => setSelectedFullImageIdx(null)} className="bg-white/10 text-white p-4 rounded-2xl hover:bg-white/20 transition-all border border-white/20">
                        <X size={24} />
                    </button>
                </div>
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
