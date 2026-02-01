
import React, { useState, useEffect } from 'react';
import { NavItem, AspectRatio, UploadedImage, ImageQuality } from '../types';
import ImageUploader from './ImageUploader';
import LearningCenter from './LearningCenter';
import { 
  generateImage, 
  getSEOTrends
} from '../services/geminiService';
import { 
  Download, Sparkles, Loader2, ShoppingBag, Box, Coffee, LayoutGrid, Maximize, 
  Smartphone, UserSquare2, Sun, Star, Megaphone, Video, User, Shirt, Layers, 
  ZoomIn, View, UserCircle, Wand2, Search, Info, PenTool, PackageOpen, 
  X, UserRound, ArrowUpCircle, Maximize2, ShieldCheck, Key, Settings2, RotateCw, CornerDownRight, ArrowDownRight, ArrowUpLeft, Hand, Sofa, Utensils, Monitor, Bath, Car, Thermometer, Mountain,
  Palette, Layout, GraduationCap, AlertTriangle, ExternalLink, Lock, CheckCircle, Database, Eye, EyeOff
} from 'lucide-react';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center space-x-3 py-4 px-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
      active ? 'bg-teal-500 border-teal-500 text-white shadow-2xl scale-105 z-10' : 'bg-white border-gray-100 text-gray-400 hover:border-teal-200'
    }`}
  >
    <Icon className="w-4 h-4" />
    <span className="hidden md:inline">{label}</span>
  </button>
);

const MainContent: React.FC<{ activeItem: NavItem; setActiveItem: (i: NavItem) => void }> = ({ activeItem, setActiveItem }) => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [bgReference, setBgReference] = useState<UploadedImage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [selectedSubMode, setSelectedSubMode] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("neutral-home");
  const [selectedAngle, setSelectedAngle] = useState("d3q");
  const [ratio, setRatio] = useState<AspectRatio>(AspectRatio.PORTRAIT);
  const [quality, setQuality] = useState<ImageQuality>(ImageQuality.STANDARD);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedFullImage, setSelectedFullImage] = useState<string | null>(null);
  
  // API Key States
  const [keySource, setKeySource] = useState<'vercel' | 'manual' | 'local' | null>(null);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [manualKey, setManualKey] = useState("");
  const [showKeyText, setShowKeyText] = useState(false);

  useEffect(() => {
    checkApiKey();
    const interval = setInterval(checkApiKey, 2000);
    return () => clearInterval(interval);
  }, []);

  const checkApiKey = async () => {
    // 1. Cek Local Storage (Manual Input)
    if (localStorage.getItem('GEMINI_API_KEY')) {
      setKeySource('local');
      return;
    }

    // 2. Cek Vercel Env
    // @ts-ignore
    const vKey = process.env.API_KEY || import.meta.env.VITE_API_KEY;
    if (vKey && vKey.length > 5) {
      setKeySource('vercel');
      return;
    }

    // 3. Cek AI Studio Tool
    if (window.aistudio) {
      const status = await window.aistudio.hasSelectedApiKey();
      if (status) {
        setKeySource('manual');
        return;
      }
    }
    
    setKeySource(null);
  };

  const saveManualKey = () => {
    if (manualKey.trim().length < 10) {
      alert("API Key tidak valid.");
      return;
    }
    localStorage.setItem('GEMINI_API_KEY', manualKey.trim());
    setKeySource('local');
    setShowKeyInput(false);
    setError(null);
  };

  const clearKey = () => {
    localStorage.removeItem('GEMINI_API_KEY');
    setKeySource(null);
    setManualKey("");
  };

  const handleGenerate = async () => {
    if (!keySource) {
      setShowKeyInput(true);
      setError("Pilih metode koneksi API Key terlebih dahulu.");
      return;
    }

    if (images.length === 0 && activeItem !== NavItem.HUMAN) {
      setError("Mohon unggah foto produk.");
      return;
    }

    setIsGenerating(true); setError(null); setResults([]);
    try {
      const subjectFiles = images.map(i => i.file);
      const referenceFile = bgReference.length > 0 ? bgReference[0].file : null;
      const angleDesc = angles.find(a => a.id === selectedAngle)?.desc || "Eye Level";
      const styleDesc = styles.find(s => s.id === selectedStyle)?.desc || "";
      const finalSystemP = `ENVIRONMENT: ${styleDesc}. ANGLE: ${angleDesc}. `;
      
      const url = await generateImage(subjectFiles, referenceFile, finalSystemP, prompt, ratio, quality, angleDesc);
      setResults([url]);
    } catch (e: any) {
      setError("Gagal: " + (e.message || "Unknown error"));
    } finally { setIsGenerating(false); }
  };

  const angles = [
    { id: 'ecu', label: 'ECU', icon: ZoomIn, desc: 'Extreme Close-Up' },
    { id: 'fs', label: 'FS', icon: Maximize, desc: 'Full Shot' },
    { id: 'd3q', label: 'D-3Q', icon: RotateCw, desc: 'Dynamic 3/4 View' },
  ];

  const styles = [
    { id: 'neutral-home', label: 'Netral Home', icon: Thermometer, desc: 'Soft diffused daylight, real home' },
    { id: 'studio', label: 'Studio', icon: Box, desc: 'Clean white high-end lighting' },
  ];

  if (activeItem === NavItem.HOME) {
    return (
      <main className="flex-1 overflow-y-auto p-12 bg-white flex flex-col items-center justify-center">
         <div className="w-28 h-28 bg-teal-500 rounded-[3rem] flex items-center justify-center text-white mb-10 shadow-3xl shadow-teal-500/40 animate-bounce">
            <Sparkles className="w-14 h-14" />
         </div>
         <h1 className="text-5xl font-black text-slate-900 mb-16 tracking-tighter text-center">Flash Affiliate Suite 2025</h1>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
            {[NavItem.COMMERCIAL, NavItem.UGC, NavItem.COPYWRITER, NavItem.SEO].map(id => (
              <div key={id} onClick={() => setActiveItem(id)} className="p-8 bg-white rounded-[2.5rem] border border-gray-100 hover:border-teal-400 hover:shadow-2xl transition-all cursor-pointer flex flex-col items-center text-center group">
                 <div className="p-6 rounded-2xl mb-4 group-hover:scale-110 transition-transform bg-teal-50 text-teal-600"><ShoppingBag size={32} /></div>
                 <h3 className="font-black text-slate-800 text-lg">{id}</h3>
              </div>
            ))}
         </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-6 lg:p-12 bg-gray-50/50 no-scrollbar">
      <div className="max-w-5xl mx-auto space-y-10 pb-40">
        
        {/* Connection Status Banner */}
        <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] flex flex-wrap items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5"><Key size={100} /></div>
            <div className="flex items-center gap-4 relative z-10">
                <div className={`p-3 rounded-2xl ${keySource ? 'bg-teal-500' : 'bg-red-500 animate-pulse'}`}>
                  {keySource ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                </div>
                <div>
                    <h4 className="font-black text-sm uppercase tracking-widest">
                      API: {keySource ? 'AKTIF (' + keySource.toUpperCase() + ')' : 'TERPUTUS'}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      {keySource ? 'Aplikasi siap digunakan' : 'Klik tombol di kanan untuk hubungkan'}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3 relative z-10">
                {keySource === 'local' ? (
                  <button onClick={clearKey} className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-[9px] font-black uppercase">Hapus Kunci Manual</button>
                ) : (
                  <button onClick={() => setShowKeyInput(!showKeyInput)} className="flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white text-slate-900 hover:bg-teal-50 transition-all">
                    <Key size={14} /> {showKeyInput ? 'Tutup' : 'Input Kunci Manual'}
                  </button>
                )}
            </div>
        </div>

        {/* Emergency Key Input Box */}
        {showKeyInput && (
          <div className="bg-white p-8 rounded-[2.5rem] border-2 border-teal-500 shadow-2xl animate-in slide-in-from-top duration-300">
              <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-teal-50 text-teal-600 rounded-xl"><Lock size={20} /></div>
                  <div>
                      <h3 className="font-black text-slate-900 text-lg">Input Kunci Gemini (Bypass Vercel)</h3>
                      <p className="text-xs text-slate-500">Jika Vercel tidak membaca variabel Anda, tempelkan kunci di sini.</p>
                  </div>
              </div>
              <div className="flex gap-4">
                  <div className="flex-1 relative">
                      <input 
                        type={showKeyText ? "text" : "password"} 
                        value={manualKey}
                        onChange={(e) => setManualKey(e.target.value)}
                        placeholder="Masukkan API Key Anda..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-teal-500 outline-none pr-12"
                      />
                      <button 
                        onClick={() => setShowKeyText(!showKeyText)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-500"
                      >
                        {showKeyText ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                  </div>
                  <button onClick={saveManualKey} className="bg-teal-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-teal-600 shadow-lg transition-all">Simpan Kunci</button>
              </div>
              <p className="mt-4 text-[10px] text-gray-400 flex items-center gap-2 italic">
                  <Info size={12} /> Kunci ini hanya disimpan di browser Anda sendiri, tidak dikirim ke server kami.
              </p>
          </div>
        )}

        {/* Generator UI */}
        <div className={`transition-all duration-500 ${!keySource ? 'opacity-40 blur-[1px] pointer-events-none' : ''}`}>
          <div className="bg-white rounded-[4rem] shadow-2xl border border-gray-100 p-10 lg:p-16">
            <h2 className="text-4xl font-black text-slate-900 flex items-center gap-6 mb-16">
              <span className="p-5 bg-teal-50 text-teal-600 rounded-[2rem] shadow-inner"><Wand2 className="w-10 h-10" /></span>
              {activeItem}
            </h2>

            <div className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <ImageUploader images={images} setImages={setImages} maxFiles={4} label="1. Foto Produk" compact={true} />
                  <ImageUploader images={bgReference} setImages={setBgReference} maxFiles={1} label="2. Referensi (Opsional)" compact={true} />
                </div>

                <div className="space-y-6">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4 block">3. Kualitas</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { id: ImageQuality.STANDARD, label: '1K Standard' },
                          { id: ImageQuality.HD_2K, label: '2K High' },
                          { id: ImageQuality.ULTRA_HD_4K, label: '4K Ultra' },
                        ].map(q => (
                          <button 
                            key={q.id} 
                            onClick={() => setQuality(q.id)} 
                            className={`p-6 rounded-3xl text-[10px] font-black uppercase transition-all border-2 ${quality === q.id ? 'bg-teal-500 border-teal-500 text-white shadow-xl' : 'bg-white border-gray-100 text-gray-400 hover:border-teal-200'}`}
                          >
                            {q.label}
                          </button>
                        ))}
                    </div>
                </div>

                <button 
                  onClick={handleGenerate} 
                  disabled={isGenerating} 
                  className={`w-full py-8 rounded-[3rem] font-black text-white text-2xl shadow-3xl flex items-center justify-center gap-6 transition-all ${isGenerating ? 'bg-slate-400' : 'bg-teal-500 hover:bg-teal-600'}`}
                >
                  {isGenerating ? <Loader2 className="w-10 h-10 animate-spin" /> : <Sparkles className="w-10 h-10" />}
                  <span>{isGenerating ? 'MENGHASILKAN...' : 'MULAILAH MEMBUAT'}</span>
                </button>
            </div>

            {error && (
                <div className="mt-8 bg-red-50 border border-red-100 p-8 rounded-[2.5rem] flex items-start gap-6">
                    <AlertTriangle className="text-red-500 shrink-0 w-8 h-8" />
                    <p className="text-xs text-red-500 leading-relaxed font-bold">{error}</p>
                </div>
            )}
          </div>
        </div>

        {results.length > 0 && (
          <div className="bg-white p-8 lg:p-12 rounded-[3rem] shadow-xl border border-gray-100">
              <div className="grid grid-cols-1 gap-10">
                  {results.map((url, i) => (
                    <div key={i} className="group relative rounded-[2rem] overflow-hidden border-4 border-teal-100 shadow-2xl bg-white h-[500px]">
                       <img src={url} className="w-full h-full object-cover" alt="Result" />
                       <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-6 backdrop-blur-sm">
                          <button onClick={() => setSelectedFullImage(url)} className="p-5 bg-white rounded-2xl text-slate-800 hover:scale-110 transition-transform"><Maximize2 size={24} /></button>
                          <a href={url} download="hasil-ai.png" className="p-5 bg-teal-500 rounded-2xl text-white hover:scale-110 transition-transform"><Download size={24} /></a>
                       </div>
                    </div>
                  ))}
              </div>
          </div>
        )}
      </div>

      {selectedFullImage && (
        <div className="fixed inset-0 z-[60] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setSelectedFullImage(null)}>
            <img src={selectedFullImage} className="max-w-full max-h-[90vh] rounded-[2rem] shadow-4xl object-contain" alt="Full Preview" />
        </div>
      )}
    </main>
  );
};

export default MainContent;
