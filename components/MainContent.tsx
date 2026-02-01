
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
  Download, Sparkles, Loader2, ShoppingBag, Box, Smartphone, 
  Star, Megaphone, Video, User, Shirt, Layers, 
  X, Maximize2, ShieldCheck, Key, Hand, Globe, CheckCircle, AlertTriangle, LayoutGrid, Camera, Zap, ChevronLeft, ChevronRight,
  UserCircle2, Mic, Volume2, History as HistoryIcon, Play, FileText, Layout, PackageOpen, Wand2, PenTool, Focus, Compass, ArrowRight, BarChart3, Trash2, Calendar
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
  const [style, setStyle] = useState("Studio");
  const [activeAngle, setActiveAngle] = useState("D-3Q"); 
  const [ratio, setRatio] = useState<AspectRatio>(AspectRatio.PORTRAIT);
  const [quality, setQuality] = useState<ImageQuality>(ImageQuality.STANDARD);
  
  // Feature States
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<{url: string, angle: string}[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [textContent, setTextContent] = useState("");
  const [sources, setSources] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // UI States
  const [selectedFullImageIdx, setSelectedFullImageIdx] = useState<number | null>(null);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [manualKey, setManualKey] = useState("");
  const [keySource, setKeySource] = useState<'local' | 'env' | null>(null);

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

  // Load History & Key on Mount
  useEffect(() => {
    const checkKey = () => {
      if (localStorage.getItem('GEMINI_API_KEY')) setKeySource('local');
      // @ts-ignore
      else if (process.env.API_KEY || import.meta.env.VITE_API_KEY) setKeySource('env');
      else setKeySource(null);
    };
    
    const loadHistory = () => {
      const saved = localStorage.getItem('MAGIC_PICTURE_HISTORY');
      if (saved) {
        try {
          setHistory(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse history");
        }
      }
    };

    checkKey();
    loadHistory();
    const inv = setInterval(checkKey, 2000);
    return () => clearInterval(inv);
  }, []);

  // Save History whenever it changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('MAGIC_PICTURE_HISTORY', JSON.stringify(history.slice(0, 100))); // Limit to 100 items
    }
  }, [history]);

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
            const res = await generateCopywriting(images[0].file, "Naskah jualan persuasif untuk video pendek");
            setTextContent(res);
        } else {
            setTextContent("Simulasi Rendering Audio... [Done]");
            setTimeout(() => alert("Audio .wav siap diunduh."), 1000);
        }
      } else {
        let sysP = "";
        
        if (activeItem === NavItem.COMMERCIAL) {
          if (subMode === 'product-shot') sysP = `Professional product photography in a ${style} setting. Clean lighting, high detail.`;
          if (subMode === 'ai-fashion') sysP = "Model fashion photography. Realistic human wearing the garment from the image.";
          if (subMode === 'mockup') sysP = "Realistic product mockup integration.";
        } 
        else if (activeItem === NavItem.UGC) {
          if (subMode === 'selfie-review') sysP = "Handheld smartphone selfie of a real person holding the product.";
          if (subMode === 'pov-hand') sysP = "First person POV shot. Only hands are visible holding the product. NO FACE.";
          if (subMode === 'unboxing-exp') sysP = "Natural unboxing scene with packaging materials.";
        }
        else if (activeItem === NavItem.ADS) {
          sysP = `Marketing advertisement design in ${style} vibe.`;
        }
        else if (activeItem === NavItem.HUMAN) {
          sysP = "Hyper-realistic virtual human portrait.";
        }
        else if (activeItem === NavItem.MAGIC) {
          sysP = "Advanced face-swap reconstruction.";
        }

        let finalResults: {url: string, angle: string}[] = [];

        if (isBatchMode) {
          const batchPromises = BATCH_SET.map(code => {
            const angleName = PRO_ANGLES.find(a => a.code === code)?.name || code;
            return generateImage(images.map(i => i.file), bgRef.length > 0 ? bgRef[0].file : null, sysP, `Vibe: ${style}. ${prompt}`, ratio, quality, angleName)
              .then(url => ({ url, angle: code }))
          });
          finalResults = await Promise.all(batchPromises);
        } else {
          const angleName = PRO_ANGLES.find(a => a.code === activeAngle)?.name || activeAngle;
          const subjectFiles = activeItem === NavItem.MAGIC ? [images[0].file, faceSource[0].file] : images.map(i => i.file);
          const url = await generateImage(subjectFiles, bgRef.length > 0 ? bgRef[0].file : null, sysP, `Vibe: ${style}. ${prompt}`, ratio, quality, angleName);
          finalResults = [{ url, angle: activeAngle }];
        }
        
        setResults(finalResults);
        addToHistory(finalResults);
      }
    } catch (e: any) {
      setError(e.message || "Permintaan gagal diproses.");
    } finally {
      setIsGenerating(false);
    }
  };

  const nextImage = useCallback(() => {
    if (selectedFullImageIdx !== null) {
      const currentList = activeItem === NavItem.HISTORY ? history : results;
      setSelectedFullImageIdx((prev) => (prev! + 1) % currentList.length);
    }
  }, [selectedFullImageIdx, results.length, history.length, activeItem]);

  const prevImage = useCallback(() => {
    if (selectedFullImageIdx !== null) {
      const currentList = activeItem === NavItem.HISTORY ? history : results;
      setSelectedFullImageIdx((prev) => (prev! - 1 + currentList.length) % currentList.length);
    }
  }, [selectedFullImageIdx, results.length, history.length, activeItem]);

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => {
        const updated = prev.filter(item => item.id !== id);
        localStorage.setItem('MAGIC_PICTURE_HISTORY', JSON.stringify(updated));
        return updated;
    });
  };

  // --- RENDERING LOGIC ---

  // History Gallery View
  if (activeItem === NavItem.HISTORY) {
    return (
      <main className="flex-1 overflow-y-auto p-6 lg:p-12 bg-gray-50/50 no-scrollbar">
         <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900">Riwayat Galeri</h1>
                    <p className="text-slate-500">Koleksi hasil karya Anda yang tersimpan secara lokal.</p>
                </div>
                {history.length > 0 && (
                    <button 
                        onClick={() => { if(confirm("Hapus semua riwayat?")) { setHistory([]); localStorage.removeItem('MAGIC_PICTURE_HISTORY'); } }}
                        className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                    >
                        <Trash2 size={14} /> Hapus Semua
                    </button>
                )}
            </div>

            {history.length === 0 ? (
                <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                        <HistoryIcon size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-400 mb-2">Belum ada riwayat</h3>
                    <p className="text-gray-400 max-w-xs mx-auto mb-8">Mulai generate gambar di studio untuk melihat riwayat koleksi Anda di sini.</p>
                    <button onClick={() => setActiveItem(NavItem.COMMERCIAL)} className="bg-teal-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Buka Studio</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {history.map((item, i) => (
                        <div key={item.id} className="group relative bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
                            <img src={item.url} className="w-full aspect-[3/4] object-cover" alt="History" />
                            <AngleBadge label={item.angle} />
                            
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-4 p-6">
                                <div className="flex gap-4">
                                    <button onClick={() => setSelectedFullImageIdx(i)} className="p-4 bg-white rounded-xl text-slate-900 hover:scale-110 transition-transform"><Maximize2 size={20} /></button>
                                    <a href={item.url} download={`magic-history-${item.id}.png`} className="p-4 bg-teal-500 rounded-xl text-white hover:scale-110 transition-transform"><Download size={20} /></a>
                                </div>
                                <button onClick={(e) => deleteHistoryItem(item.id, e)} className="p-3 bg-red-500/20 text-red-100 hover:bg-red-500 rounded-xl text-[10px] font-black uppercase transition-all">Hapus Permanen</button>
                            </div>

                            <div className="p-4 border-t border-gray-50 flex justify-between items-center">
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black uppercase text-teal-600 tracking-widest">{item.category}</div>
                                    <div className="text-[9px] text-gray-400 font-medium flex items-center gap-1">
                                        <Calendar size={10} /> {new Date(item.timestamp).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
         </div>

         {/* Lightbox for History */}
         {selectedFullImageIdx !== null && history[selectedFullImageIdx] && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-in fade-in" onClick={() => setSelectedFullImageIdx(null)}>
                <div className="absolute top-8 inset-x-0 px-8 flex justify-between items-center pointer-events-none">
                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                        <span className="text-white font-black text-xs uppercase tracking-widest">
                            {history[selectedFullImageIdx].category} - {history[selectedFullImageIdx].angle}
                        </span>
                    </div>
                    <button onClick={() => setSelectedFullImageIdx(null)} className="pointer-events-auto bg-white/10 text-white p-4 rounded-2xl hover:bg-white/20"><X size={24} /></button>
                </div>
                <div className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
                    <button onClick={prevImage} className="absolute -left-20 lg:-left-32 p-6 bg-white/5 hover:bg-white/10 rounded-full text-white"><ChevronLeft size={32} /></button>
                    <button onClick={nextImage} className="absolute -right-20 lg:-right-32 p-6 bg-white/5 hover:bg-white/10 rounded-full text-white"><ChevronRight size={32} /></button>
                    <img src={history[selectedFullImageIdx].url} className="w-full h-full max-h-[80vh] object-contain rounded-3xl shadow-2xl" />
                </div>
            </div>
          )}
      </main>
    );
  }

  // Dashboard View for HOME
  if (activeItem === NavItem.HOME) {
    return (
      <main className="flex-1 overflow-y-auto p-6 lg:p-12 bg-gray-50/50 no-scrollbar">
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="space-y-4">
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Selamat Datang di <span className="text-teal-500">Magic Picture</span></h1>
              <p className="text-slate-500 text-lg max-w-xl">AI Engine tercanggih untuk kebutuhan konten Affiliate Marketer. Pilih studio di bawah untuk mulai berkreasi.</p>
            </div>
            <div className="flex gap-4">
               <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl flex items-center gap-4">
                  <div className="p-3 bg-teal-50 text-teal-600 rounded-xl"><Zap size={24} /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Total Generasi</p>
                    <p className="text-xl font-black text-slate-900">{history.length} Gambar</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[
               { id: NavItem.COMMERCIAL, label: 'Commercial Hub', desc: 'Ubah foto produk biasa jadi studio premium.', icon: ShoppingBag, color: 'bg-blue-500' },
               { id: NavItem.UGC, label: 'UGC Studio', desc: 'Buat testimoni selfie & POV realistis.', icon: Smartphone, color: 'bg-teal-500' },
               { id: NavItem.ADS, label: 'Ads Studio', desc: 'Banner promo & thumbnail YouTube otomatis.', icon: Megaphone, color: 'bg-orange-500' }
             ].map(item => (
               <button 
                key={item.id} 
                onClick={() => setActiveItem(item.id)}
                className="group relative bg-white p-10 rounded-[3rem] text-left border border-gray-100 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all overflow-hidden"
               >
                  <div className={`w-16 h-16 ${item.color} text-white rounded-[1.5rem] flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform`}>
                    <item.icon size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-3">{item.label}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-8">{item.desc}</p>
                  <div className="flex items-center gap-2 text-teal-600 font-black text-[10px] uppercase tracking-widest">
                    Buka Studio <ArrowRight size={14} />
                  </div>
               </button>
             ))}
          </div>

          {/* Recent Activity Section in Dashboard */}
          {history.length > 0 && (
              <div className="space-y-6">
                  <div className="flex justify-between items-center px-4">
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                          <HistoryIcon className="text-teal-500" size={20} /> Aktivitas Terakhir
                      </h3>
                      <button onClick={() => setActiveItem(NavItem.HISTORY)} className="text-[10px] font-black text-teal-600 uppercase tracking-widest hover:underline flex items-center gap-2">Lihat Semua <ArrowRight size={12} /></button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                      {history.slice(0, 5).map((item) => (
                          <div key={item.id} className="aspect-square rounded-3xl overflow-hidden border-4 border-white shadow-md hover:scale-105 transition-transform cursor-pointer relative group" onClick={() => setActiveItem(NavItem.HISTORY)}>
                              <img src={item.url} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Maximize2 className="text-white" size={20} />
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          <div className="bg-slate-900 rounded-[3rem] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-10 overflow-hidden relative">
              <div className="absolute top-0 left-0 p-12 opacity-5 pointer-events-none"><BarChart3 size={200} /></div>
              <div className="space-y-6 relative z-10 max-w-xl">
                 <h2 className="text-3xl font-black">Market Trends 2025</h2>
                 <p className="text-slate-400 leading-relaxed">Gunakan alat analisis tren kami untuk mengetahui produk apa yang sedang viral di TikTok & Shopee sebelum Anda membuat konten.</p>
                 <button onClick={() => setActiveItem(NavItem.SEO)} className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-500 hover:text-white transition-all">Lihat Tren Sekarang</button>
              </div>
              <div className="grid grid-cols-2 gap-4 relative z-10">
                 <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 text-center">
                    <p className="text-teal-400 font-black text-2xl mb-1">98%</p>
                    <p className="text-[9px] font-black uppercase opacity-60">Akurasi Fidelity</p>
                 </div>
                 <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 text-center">
                    <p className="text-blue-400 font-black text-2xl mb-1">0.8s</p>
                    <p className="text-[9px] font-black uppercase opacity-60">Waktu Proses</p>
                 </div>
              </div>
          </div>
        </div>
      </main>
    );
  }

  // Learning Center View
  if (activeItem === NavItem.LEARNING) {
    return (
      <main className="flex-1 overflow-y-auto p-6 lg:p-12 bg-gray-50/50 no-scrollbar">
        <LearningCenter />
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-6 lg:p-12 bg-gray-50/50 no-scrollbar">
      <div className="max-w-6xl mx-auto space-y-10 pb-40">
        
        {/* Header Key Monitor */}
        <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] flex items-center justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldCheck size={100} /></div>
            <div className="flex items-center gap-4 relative z-10">
                <div className={`p-3 rounded-2xl ${keySource ? 'bg-teal-500' : 'bg-red-500 animate-pulse'}`}>
                  {keySource ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                </div>
                <div>
                    <h4 className="font-black text-sm uppercase tracking-widest">Magic Picture Engine {keySource ? 'Active' : 'Offline'}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{keySource ? 'High-accuracy reconstruction ready' : 'Please connect your Gemini Key'}</p>
                </div>
            </div>
            <button onClick={() => setShowKeyInput(!showKeyInput)} className="relative z-10 px-6 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase hover:bg-teal-50 transition-all">
              {keySource ? 'API Settings' : 'Connect Key'}
            </button>
        </div>

        {showKeyInput && (
          <div className="bg-white p-8 rounded-[2.5rem] border-2 border-teal-500 shadow-2xl animate-in slide-in-from-top">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-sm uppercase tracking-widest">Gemini API Key</h3>
                <button onClick={() => setShowKeyInput(false)}><X size={20} /></button>
            </div>
            <div className="flex gap-4">
              <input 
                type="password" 
                value={manualKey} 
                onChange={e => setManualKey(e.target.value)}
                placeholder="Paste key..."
                className="flex-1 bg-gray-50 border-2 border-gray-100 p-5 rounded-2xl outline-none focus:border-teal-500 text-sm font-bold"
              />
              <button onClick={() => {
                localStorage.setItem('GEMINI_API_KEY', manualKey);
                setKeySource('local');
                setShowKeyInput(false);
              }} className="bg-slate-900 text-white px-10 rounded-2xl font-black text-xs uppercase hover:bg-teal-500 transition-all">Save</button>
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
                    <span className="text-[10px] font-black uppercase tracking-widest">Batch Mode {isBatchMode ? 'ON' : 'OFF'}</span>
                 </button>
               )}
            </div>

            <div className="space-y-12">
                
                {/* Image Uploaders Section */}
                {(activeItem !== NavItem.SEO && activeItem !== NavItem.LIVE) && (
                   activeItem === NavItem.MAGIC ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                         <ImageUploader images={images} setImages={setImages} maxFiles={1} label="Foto Target" description="Orang yang akan diganti wajahnya." compact />
                         <ImageUploader images={faceSource} setImages={setFaceSource} maxFiles={1} label="Wajah Sumber" description="Wajah yang akan ditempel." compact />
                    </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <ImageUploader images={images} setImages={setImages} maxFiles={4} label="Foto Produk Utama" compact />
                          {activeItem !== NavItem.COPYWRITER && <ImageUploader images={bgRef} setImages={setBgRef} maxFiles={1} label="Referensi Background (Opsional)" compact />}
                      </div>
                  )
                )}

                {/* Sub-Mode Selection - Only show if current item has submodes */}
                {(activeItem === NavItem.COMMERCIAL || activeItem === NavItem.UGC) && (
                  <div className="space-y-6">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Tipe Konten</label>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                          {activeItem === NavItem.COMMERCIAL && [
                              { id: 'product-shot', label: 'Product Shot', icon: Box },
                              { id: 'ai-fashion', label: 'AI Fashion', icon: Shirt },
                              { id: 'mockup', label: 'Mockup', icon: Layers }
                          ].map(b => (
                              <button key={b.id} onClick={() => setSubMode(b.id)} className={`p-6 rounded-[2rem] border-2 text-left transition-all ${subMode === b.id ? 'bg-teal-50 border-teal-500' : 'bg-white border-gray-100'}`}>
                                  <b.icon className={`mb-3 ${subMode === b.id ? 'text-teal-600' : 'text-slate-400'}`} />
                                  <div className="font-black text-[11px] uppercase tracking-widest">{b.label}</div>
                              </button>
                          ))}
                          {activeItem === NavItem.UGC && [
                              { id: 'selfie-review', label: 'Selfie Review', icon: Camera },
                              { id: 'pov-hand', label: 'POV Hand', icon: Hand },
                              { id: 'unboxing-exp', label: 'Unboxing Exp', icon: PackageOpen }
                          ].map(b => (
                              <button key={b.id} onClick={() => setSubMode(b.id)} className={`p-6 rounded-[2rem] border-2 text-left transition-all ${subMode === b.id ? 'bg-teal-50 border-teal-500' : 'bg-white border-gray-100'}`}>
                                  <b.icon className={`mb-3 ${subMode === b.id ? 'text-teal-600' : 'text-slate-400'}`} />
                                  <div className="font-black text-[11px] uppercase tracking-widest">{b.label}</div>
                              </button>
                          ))}
                      </div>
                  </div>
                )}

                {/* Pro Shot Angles */}
                {!isBatchMode && activeItem !== NavItem.SEO && activeItem !== NavItem.COPYWRITER && activeItem !== NavItem.LIVE && (
                   <div className="space-y-6 animate-in slide-in-from-bottom">
                      <div className="flex items-center gap-3 ml-2">
                        <Focus size={14} className="text-teal-500" />
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Pro Shot Angles</label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                         {PRO_ANGLES.map(a => (
                            <button 
                                key={a.code} 
                                onClick={() => setActiveAngle(a.code)}
                                className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${activeAngle === a.code ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-105' : 'bg-white border-gray-100 text-slate-400 hover:border-teal-200'}`}
                            >
                                <span className="mr-2 opacity-50">{a.code}</span>
                                {a.name}
                            </button>
                         ))}
                      </div>
                   </div>
                )}

                {/* Environment Selection */}
                {activeItem !== NavItem.SEO && activeItem !== NavItem.COPYWRITER && activeItem !== NavItem.LIVE && (
                    <div className="space-y-6 animate-in slide-in-from-bottom">
                        <div className="flex items-center gap-3 ml-2">
                            <Compass size={14} className="text-teal-500" />
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Environment & Lighting</label>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            {ENVIRONMENTS.map(env => (
                                <button 
                                    key={env} 
                                    onClick={() => setStyle(env)}
                                    className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase transition-all border ${style === env ? 'bg-teal-500 border-teal-500 text-white' : 'bg-white border-gray-100 text-slate-400'}`}
                                >
                                    {env}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Area */}
                {activeItem !== NavItem.LIVE && (
                   <div className="space-y-10">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Deskripsi Kustom / Produk</label>
                        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={activeItem === NavItem.SEO ? "Masukkan nama produk untuk analisis tren..." : "Misal: Tambahkan bunga di samping, pencahayaan dramatis..."} className="w-full h-24 bg-gray-50 border-2 border-gray-100 p-6 rounded-[2rem] outline-none focus:border-teal-500 text-sm font-medium" />
                      </div>

                      {activeItem !== NavItem.SEO && activeItem !== NavItem.COPYWRITER && (
                        <div className="flex flex-wrap gap-8 items-center border-t border-gray-50 pt-10">
                          <div className="space-y-3">
                              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Ratio</span>
                              <div className="flex gap-2">
                                {[AspectRatio.PORTRAIT, AspectRatio.SQUARE, AspectRatio.LANDSCAPE].map(r => (
                                  <button key={r} onClick={() => setRatio(r)} className={`px-4 py-2 rounded-lg text-[10px] font-black border ${ratio === r ? 'bg-slate-900 text-white' : 'bg-white border-gray-100 text-slate-400'}`}>{r}</button>
                                ))}
                              </div>
                          </div>
                          <div className="space-y-3">
                              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Quality</span>
                              <div className="flex gap-2">
                                {[ImageQuality.STANDARD, ImageQuality.HD_2K, ImageQuality.ULTRA_HD_4K].map(q => (
                                  <button key={q} onClick={() => setQuality(q)} className={`px-4 py-2 rounded-lg text-[10px] font-black border ${quality === q ? 'bg-teal-500 text-white' : 'bg-white border-gray-100 text-slate-400'}`}>{q}</button>
                                ))}
                              </div>
                          </div>
                        </div>
                      )}

                      <button 
                        onClick={handleGenerate} 
                        disabled={isGenerating} 
                        className={`w-full py-10 rounded-[3rem] font-black text-white text-2xl flex items-center justify-center gap-6 transition-all ${isGenerating ? 'bg-slate-400 scale-[0.98]' : 'bg-teal-500 hover:bg-teal-600 shadow-3xl'}`}
                      >
                        {isGenerating ? <Loader2 className="w-10 h-10 animate-spin" /> : <Zap className="w-10 h-10 fill-current" />}
                        <span>{isGenerating ? 'GENERATING...' : isBatchMode ? 'GENERATE 6 PRO SHOTS' : 'MULAI PROSES'}</span>
                      </button>
                   </div>
                )}
                
                {error && <div className="p-6 bg-red-50 text-red-500 rounded-3xl font-bold text-sm text-center border border-red-100">{error}</div>}
            </div>
          </div>
        </div>

        {/* Results Area (Current Generation) */}
        {(results.length > 0 || textContent) && (
          <div className="bg-white p-10 lg:p-16 rounded-[4rem] shadow-2xl border border-gray-100 animate-in fade-in">
              <div className="flex items-center justify-between mb-12 border-b pb-8">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">Final Output Magic Picture</h3>
                  <button onClick={() => {setResults([]); setTextContent("");}} className="text-slate-300 hover:text-red-500"><X size={32} /></button>
              </div>

              {results.length > 0 ? (
                 <div className={`grid gap-8 ${isBatchMode ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                    {results.map((res, i) => (
                      <div key={i} className="group relative rounded-[2.5rem] overflow-hidden border-4 border-gray-50 shadow-inner bg-slate-50 transition-transform hover:scale-[1.01]">
                         <AngleBadge label={res.angle} />
                         <img src={res.url} className="w-full h-full object-cover" alt="Generated" />
                         <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-6">
                            <button onClick={() => setSelectedFullImageIdx(i)} className="p-5 bg-white rounded-2xl text-slate-800 hover:scale-110"><Maximize2 size={24} /></button>
                            <a href={res.url} download={`magic-picture-${res.angle}.png`} className="p-5 bg-teal-500 rounded-2xl text-white hover:scale-110"><Download size={24} /></a>
                         </div>
                      </div>
                    ))}
                 </div>
              ) : <div className="prose max-w-none text-slate-600 font-bold whitespace-pre-wrap">{textContent}</div>}
          </div>
        )}
      </div>

      {/* Lightbox for viewing results */}
      {selectedFullImageIdx !== null && results[selectedFullImageIdx] && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-in fade-in" onClick={() => setSelectedFullImageIdx(null)}>
           <div className="absolute top-8 inset-x-0 px-8 flex justify-between items-center pointer-events-none">
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20"><span className="text-white font-black text-xs uppercase tracking-widest">{results[selectedFullImageIdx].angle}</span></div>
                <button onClick={() => setSelectedFullImageIdx(null)} className="pointer-events-auto bg-white/10 text-white p-4 rounded-2xl hover:bg-white/20"><X size={24} /></button>
           </div>
           <div className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
              {results.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute -left-20 lg:-left-32 p-6 bg-white/5 hover:bg-white/10 rounded-full text-white"><ChevronLeft size={32} /></button>
                    <button onClick={nextImage} className="absolute -right-20 lg:-right-32 p-6 bg-white/5 hover:bg-white/10 rounded-full text-white"><ChevronRight size={32} /></button>
                  </>
              )}
              <img src={results[selectedFullImageIdx].url} className="w-full h-full max-h-[80vh] object-contain rounded-3xl" />
           </div>
        </div>
      )}
    </main>
  );
};

export default MainContent;
