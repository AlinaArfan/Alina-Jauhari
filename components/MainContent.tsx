
import React, { useState, useEffect, useCallback } from 'react';
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
  Shirt, Layers, Hand, PackageOpen, Wand2, Focus, Compass, ArrowRight, BarChart3, Trash2, Calendar, History as HistoryIcon
} from 'lucide-react';

// Konstanta dipindahkan ke luar komponen agar referensi stabil
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
  "Netral Home", "Studio", "Natural", "Bedroom", "Outdoor", 
  "Ruang Tamu", "Dapur", "Mobil", "Meja Kerja", "Kamar Mandi"
];

const BATCH_SET = ["ECU", "FS", "TDA", "ULA", "S-P", "D-3Q"];

const AngleBadge = ({ label }: { label: string }) => (
  <span className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/20">
    {label}
  </span>
);

const MainContent: React.FC<{ activeItem: NavItem; setActiveItem: (i: NavItem) => void }> = ({ activeItem, setActiveItem }) => {
  // States
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [bgRef, setBgRef] = useState<UploadedImage[]>([]);
  const [faceSource, setFaceSource] = useState<UploadedImage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [subMode, setSubMode] = useState("default");
  const [style, setStyle] = useState("Studio");
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
  
  const [selectedFullImageIdx, setSelectedFullImageIdx] = useState<number | null>(null);

  // Load Initial Data
  useEffect(() => {
    const loadHistory = () => {
      const saved = localStorage.getItem('MAGIC_PICTURE_HISTORY');
      if (saved) {
        try { setHistory(JSON.parse(saved)); } catch (e) { console.error(e); }
      }
    };
    loadHistory();
  }, []);

  // Sync History
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('MAGIC_PICTURE_HISTORY', JSON.stringify(history.slice(0, 100)));
    }
  }, [history]);

  // Reset on Menu Change
  useEffect(() => {
    setResults([]);
    setTextContent("");
    setImages([]);
    setBgRef([]);
    setFaceSource([]);
    setPrompt("");
    setError(null);
    setIsBatchMode(false);
    setSources([]);
    
    const modeMap: Partial<Record<NavItem, string>> = {
      [NavItem.COMMERCIAL]: "product-shot",
      [NavItem.UGC]: "selfie-review",
      [NavItem.ADS]: "web-banner",
      [NavItem.HUMAN]: "ai-model",
      [NavItem.MAGIC]: "faceswap",
      [NavItem.COPYWRITER]: "analysis-script"
    };
    if (modeMap[activeItem]) setSubMode(modeMap[activeItem]!);
  }, [activeItem]);

  const addToHistory = (newResults: {url: string, angle: string}[]) => {
    const newHistoryItems: HistoryItem[] = newResults.map(res => ({
      id: Math.random().toString(36).substr(2, 9),
      url: res.url,
      angle: res.angle,
      timestamp: Date.now(),
      mode: subMode,
      category: activeItem
    }));
    setHistory(prev => [...newHistoryItems, ...prev]);
  };

  const handleGenerate = async () => {
    if (activeItem === NavItem.MAGIC && (images.length === 0 || faceSource.length === 0)) {
        setError("Mohon unggah foto target dan foto wajah sumber.");
        return;
    }
    if (images.length === 0 && ![NavItem.SEO, NavItem.HUMAN, NavItem.LIVE].includes(activeItem)) {
        setError("Mohon unggah foto produk terlebih dahulu.");
        return;
    }

    // Check mandatory API key selection for Pro models
    const isPro = quality === ImageQuality.HD_2K || quality === ImageQuality.ULTRA_HD_4K;
    if (isPro) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
    }

    setIsGenerating(true); 
    setError(null); 
    setResults([]);
    
    try {
      if (activeItem === NavItem.SEO) {
        const res = await getSEOTrends(prompt);
        setTextContent(res.text);
        setSources(res.sources);
      } else if (activeItem === NavItem.COPYWRITER) {
        if (subMode === 'analysis-script') {
            const res = await generateCopywriting(images[0].file, "Naskah jualan persuasif untuk video pendek");
            setTextContent(res);
        } else {
            setTextContent("Audio simulasi siap.");
        }
      } else {
        let sysP = `Studio style: ${style}. ${prompt}`;
        let finalResults: {url: string, angle: string}[] = [];

        if (isBatchMode) {
          const batchPromises = BATCH_SET.map(code => {
            const angleName = PRO_ANGLES.find(a => a.code === code)?.name || code;
            return generateImage(images.map(i => i.file), bgRef.length > 0 ? bgRef[0].file : null, sysP, style, ratio, quality, angleName)
              .then(url => ({ url, angle: code }))
          });
          finalResults = await Promise.all(batchPromises);
        } else {
          const angleName = PRO_ANGLES.find(a => a.code === activeAngle)?.name || activeAngle;
          const subjectFiles = activeItem === NavItem.MAGIC ? [images[0].file, faceSource[0].file] : images.map(i => i.file);
          const url = await generateImage(subjectFiles, bgRef.length > 0 ? bgRef[0].file : null, sysP, style, ratio, quality, angleName);
          finalResults = [{ url, angle: activeAngle }];
        }
        
        setResults(finalResults);
        addToHistory(finalResults);
      }
    } catch (e: any) {
      if (e.message?.includes("Requested entity was not found.")) {
          await (window as any).aistudio.openSelectKey();
          setError("Requested entity was not found. Mohon pilih API Key berbayar yang valid.");
      } else {
          setError(e.message || "Gagal memproses permintaan.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const nextImage = useCallback(() => {
    if (selectedFullImageIdx !== null) {
      const currentList = activeItem === NavItem.HISTORY ? history : results;
      if (currentList.length > 0) {
        setSelectedFullImageIdx((prev) => (prev! + 1) % currentList.length);
      }
    }
  }, [selectedFullImageIdx, results, history, activeItem]);

  const prevImage = useCallback(() => {
    if (selectedFullImageIdx !== null) {
      const currentList = activeItem === NavItem.HISTORY ? history : results;
      if (currentList.length > 0) {
        setSelectedFullImageIdx((prev) => (prev! - 1 + currentList.length) % currentList.length);
      }
    }
  }, [selectedFullImageIdx, results, history, activeItem]);

  // Views
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

          {history.length > 0 && (
              <div className="space-y-6">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-4">Terakhir Dibuat</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      {history.slice(0, 5).map((item) => (
                          <div key={item.id} className="aspect-square rounded-[2rem] overflow-hidden border-4 border-white shadow-md cursor-pointer" onClick={() => setActiveItem(NavItem.HISTORY)}>
                              <img src={item.url} className="w-full h-full object-cover" />
                          </div>
                      ))}
                  </div>
              </div>
          )}
        </div>
      </main>
    );
  }

  if (activeItem === NavItem.HISTORY) {
    return (
      <main className="flex-1 overflow-y-auto p-6 lg:p-12 bg-gray-50/50 no-scrollbar">
         <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in">
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-black text-slate-900">Riwayat Galeri</h1>
                {history.length > 0 && (
                    <button onClick={() => { if(confirm("Hapus semua?")) { setHistory([]); localStorage.removeItem('MAGIC_PICTURE_HISTORY'); }}} className="text-[10px] font-black uppercase text-red-500 hover:underline">Hapus Semua</button>
                )}
            </div>

            {history.length === 0 ? (
                <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 font-bold uppercase tracking-widest">Belum ada riwayat</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {history.map((item, i) => (
                        <div key={item.id} className="group relative rounded-[2rem] overflow-hidden shadow-lg bg-white border border-gray-100">
                            <img src={item.url} className="w-full aspect-square object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                <button onClick={() => setSelectedFullImageIdx(i)} className="p-3 bg-white rounded-xl"><Maximize2 size={18} /></button>
                                <a href={item.url} download className="p-3 bg-teal-500 text-white rounded-xl"><Download size={18} /></a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
         </div>
         {selectedFullImageIdx !== null && history[selectedFullImageIdx] && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-xl" onClick={() => setSelectedFullImageIdx(null)}>
                <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-10 p-6 text-white"><ChevronLeft size={48} /></button>
                <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-10 p-6 text-white"><ChevronRight size={48} /></button>
                <img src={history[selectedFullImageIdx].url} className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl" />
            </div>
         )}
      </main>
    );
  }

  if (activeItem === NavItem.LEARNING) {
    return <main className="flex-1 overflow-y-auto p-12 bg-gray-50/50"><LearningCenter /></main>;
  }

  // Default Studio View (Commercial, UGC, etc)
  return (
    <main className="flex-1 overflow-y-auto p-6 lg:p-12 bg-gray-50/50 no-scrollbar">
      <div className="max-w-6xl mx-auto space-y-10 pb-40">
        <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-teal-500">
                  <CheckCircle size={20} />
                </div>
                <div>
                    <h4 className="font-black text-xs uppercase tracking-widest">Engine Ready</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Powered by Gemini GenAI</p>
                </div>
            </div>
            <button onClick={() => (window as any).aistudio.openSelectKey()} className="px-5 py-2.5 bg-white text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-teal-50 transition-colors">Select API Key</button>
        </div>

        <div>
          <div className="bg-white rounded-[3.5rem] shadow-2xl border border-gray-100 p-10 lg:p-16 space-y-12">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <div className="p-4 bg-teal-50 text-teal-600 rounded-2xl"><Wand2 size={28} /></div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">{activeItem}</h2>
               </div>
               {![NavItem.SEO, NavItem.COPYWRITER, NavItem.MAGIC, NavItem.HOME, NavItem.HISTORY, NavItem.LEARNING].includes(activeItem) && (
                 <button onClick={() => setIsBatchMode(!isBatchMode)} className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all border-2 ${isBatchMode ? 'bg-teal-500 border-teal-500 text-white shadow-lg' : 'bg-white border-gray-100 text-slate-400'}`}>
                    <LayoutGrid size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Batch Mode {isBatchMode ? 'ON' : 'OFF'}</span>
                 </button>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {activeItem === NavItem.MAGIC ? (
                    <>
                        <ImageUploader images={images} setImages={setImages} maxFiles={1} label="Foto Target" compact />
                        <ImageUploader images={faceSource} setImages={setFaceSource} maxFiles={1} label="Wajah Sumber" compact />
                    </>
                ) : (
                    <>
                        <ImageUploader images={images} setImages={setImages} maxFiles={4} label="Foto Produk Utama" compact />
                        {activeItem !== NavItem.COPYWRITER && <ImageUploader images={bgRef} setImages={setBgRef} maxFiles={1} label="Background Ref" compact />}
                    </>
                )}
            </div>

            {(activeItem === NavItem.COMMERCIAL || activeItem === NavItem.UGC) && (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeItem === NavItem.COMMERCIAL && [
                        { id: 'product-shot', label: 'Product Shot', icon: Box },
                        { id: 'ai-fashion', label: 'AI Fashion', icon: Shirt },
                        { id: 'mockup', label: 'Mockup', icon: Layers }
                    ].map(b => (
                        <button key={b.id} onClick={() => setSubMode(b.id)} className={`p-6 rounded-[2rem] border-2 text-left transition-all ${subMode === b.id ? 'bg-teal-50 border-teal-500' : 'bg-white border-gray-100'}`}>
                            <b.icon className={`mb-3 ${subMode === b.id ? 'text-teal-600' : 'text-slate-400'}`} size={20} />
                            <div className="font-black text-[10px] uppercase tracking-widest">{b.label}</div>
                        </button>
                    ))}
                    {activeItem === NavItem.UGC && [
                        { id: 'selfie-review', label: 'Selfie Review', icon: Camera },
                        { id: 'pov-hand', label: 'POV Hand', icon: Hand },
                        { id: 'unboxing-exp', label: 'Unboxing', icon: PackageOpen }
                    ].map(b => (
                        <button key={b.id} onClick={() => setSubMode(b.id)} className={`p-6 rounded-[2rem] border-2 text-left transition-all ${subMode === b.id ? 'bg-teal-50 border-teal-500' : 'bg-white border-gray-100'}`}>
                            <b.icon className={`mb-3 ${subMode === b.id ? 'text-teal-600' : 'text-slate-400'}`} size={20} />
                            <div className="font-black text-[10px] uppercase tracking-widest">{b.label}</div>
                        </button>
                    ))}
                </div>
            )}

            <div className="space-y-10">
                {!isBatchMode && ![NavItem.SEO, NavItem.COPYWRITER, NavItem.LIVE].includes(activeItem) && (
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Pro Angle Selection</label>
                        <div className="flex flex-wrap gap-2">
                            {PRO_ANGLES.map(a => (
                                <button key={a.code} onClick={() => setActiveAngle(a.code)} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${activeAngle === a.code ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-gray-100 text-slate-400'}`}>
                                    {a.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {![NavItem.SEO, NavItem.COPYWRITER, NavItem.LIVE].includes(activeItem) && (
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Environment</label>
                        <div className="flex flex-wrap gap-2">
                            {ENVIRONMENTS.map(env => (
                                <button key={env} onClick={() => setStyle(env)} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase border transition-all ${style === env ? 'bg-teal-500 border-teal-500 text-white' : 'bg-white border-gray-100 text-slate-400'}`}>
                                    {env}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Custom Instruction</label>
                    <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Detail tambahan untuk AI..." className="w-full h-24 bg-gray-50 border-2 border-gray-100 p-6 rounded-[2rem] outline-none focus:border-teal-500 text-sm font-medium" />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Quality</label>
                     <select value={quality} onChange={e => setQuality(e.target.value as ImageQuality)} className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl outline-none focus:border-teal-500 text-xs font-black uppercase">
                        <option value={ImageQuality.STANDARD}>Standard (1K)</option>
                        <option value={ImageQuality.HD_2K}>Pro HD (2K)</option>
                        <option value={ImageQuality.ULTRA_HD_4K}>Ultra HD (4K)</option>
                     </select>
                  </div>
                  <div className="flex-1 space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Ratio</label>
                     <select value={ratio} onChange={e => setRatio(e.target.value as AspectRatio)} className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl outline-none focus:border-teal-500 text-xs font-black uppercase">
                        <option value={AspectRatio.SQUARE}>1:1 Square</option>
                        <option value={AspectRatio.PORTRAIT}>9:16 Portrait</option>
                        <option value={AspectRatio.LANDSCAPE}>16:9 Landscape</option>
                     </select>
                  </div>
                </div>

                <button onClick={handleGenerate} disabled={isGenerating} className={`w-full py-8 rounded-[2.5rem] font-black text-white text-xl flex items-center justify-center gap-4 transition-all ${isGenerating ? 'bg-slate-400 scale-[0.98]' : 'bg-teal-500 hover:bg-teal-600 shadow-2xl'}`}>
                    {isGenerating ? <Loader2 className="animate-spin" /> : <Zap size={24} />}
                    <span>{isGenerating ? 'PROCESSING...' : isBatchMode ? 'GENERATE 6 PRO SHOTS' : 'START GENERATION'}</span>
                </button>
            </div>
            {error && <div className="p-5 bg-red-50 text-red-500 rounded-2xl font-bold text-xs text-center border border-red-100">{error}</div>}
          </div>
        </div>

        {(results.length > 0 || textContent) && (
          <div className="bg-white p-10 lg:p-16 rounded-[4rem] shadow-2xl border border-gray-100 animate-in fade-in">
              <div className="flex items-center justify-between mb-12 border-b pb-8">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Hasil Magic Picture</h3>
                  <button onClick={() => {setResults([]); setTextContent(""); setSources([]);}} className="text-slate-300 hover:text-red-500 transition-colors"><X size={32} /></button>
              </div>
              {results.length > 0 ? (
                 <div className={`grid gap-8 ${isBatchMode ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                    {results.map((res, i) => (
                      <div key={i} className="group relative rounded-[2rem] overflow-hidden border-4 border-gray-50 bg-slate-50 transition-all hover:scale-[1.02]">
                         <AngleBadge label={res.angle} />
                         <img src={res.url} className="w-full aspect-[3/4] object-cover" alt="Generated" />
                         <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4">
                            <button onClick={() => setSelectedFullImageIdx(i)} className="p-4 bg-white rounded-xl text-slate-900"><Maximize2 size={20} /></button>
                            <a href={res.url} download className="p-4 bg-teal-500 rounded-xl text-white"><Download size={20} /></a>
                         </div>
                      </div>
                    ))}
                 </div>
              ) : (
                <div className="space-y-8">
                  <div className="prose max-w-none text-slate-600 font-bold whitespace-pre-wrap leading-relaxed">{textContent}</div>
                  {sources.length > 0 && (
                    <div className="pt-8 border-t border-gray-100">
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Sumber Referensi Grounding:</h4>
                      <div className="flex flex-wrap gap-3">
                        {sources.map((chunk, idx) => {
                          const web = chunk.web;
                          if (!web) return null;
                          return (
                            <a key={idx} href={web.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-[10px] font-black text-teal-600 hover:bg-teal-50 transition-all uppercase tracking-tight">
                              <Compass size={14} />
                              {web.title || "Lihat Sumber"}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
          </div>
        )}
      </div>

      {selectedFullImageIdx !== null && results[selectedFullImageIdx] && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-2xl" onClick={() => setSelectedFullImageIdx(null)}>
           <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-8 p-6 text-white hover:text-teal-400 transition-colors"><ChevronLeft size={64} /></button>
           <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-8 p-6 text-white hover:text-teal-400 transition-colors"><ChevronRight size={64} /></button>
           <img 
            src={results[selectedFullImageIdx].url} 
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10" 
            alt="Full Preview"
           />
        </div>
      )}
    </main>
  );
};

export default MainContent;
