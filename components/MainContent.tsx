
import React, { useState, useEffect, useRef } from 'react';
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
  Palette, Layout, GraduationCap, AlertTriangle, ExternalLink, Lock, CheckCircle, Database
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
  const [keySource, setKeySource] = useState<'vercel' | 'manual' | null>(null);
  
  const [seoProduct, setSeoProduct] = useState("");
  const [seoResult, setSeoResult] = useState<{ text: string; sources: any[] } | null>(null);

  useEffect(() => {
    checkApiKey();
    const interval = setInterval(checkApiKey, 3000);
    return () => clearInterval(interval);
  }, []);

  const checkApiKey = async () => {
    // 1. Cek Vercel Env (Tertinggi priority untuk otomasi)
    if (process.env.API_KEY && process.env.API_KEY.length > 5) {
      setKeySource('vercel');
      return;
    }

    // 2. Cek Manual BYOK (Gunakan tool aistudio)
    if (window.aistudio) {
      const status = await window.aistudio.hasSelectedApiKey();
      if (status) {
        setKeySource('manual');
        return;
      }
    }
    
    setKeySource(null);
  };

  useEffect(() => {
    setImages([]); setBgReference([]); setResults([]); setPrompt(""); setError(null);
    switch(activeItem) {
      case NavItem.COMMERCIAL: setSelectedSubMode("product"); break;
      case NavItem.UGC: setSelectedSubMode("real-pov"); break;
      case NavItem.ADS: setSelectedSubMode("banner"); break;
      case NavItem.HUMAN: setSelectedSubMode("character"); break;
      case NavItem.MAGIC: setSelectedSubMode("faceswap"); break;
      case NavItem.COPYWRITER: setSelectedSubMode("writer"); break;
      default: setSelectedSubMode("");
    }
  }, [activeItem]);

  const handleSetApiKey = async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        setKeySource('manual');
      } else {
        alert("Variabel Vercel API_KEY tidak terdeteksi. Silakan masukkan secara manual jika tersedia.");
      }
    } catch (e) {
      console.error("Gagal membuka dialog kunci", e);
    }
  };

  const handleGenerate = async () => {
    if (!keySource) {
      setError("API Key tidak ditemukan. Pastikan Anda sudah memasukkan API_KEY di Environment Variables Vercel dan melakukan Redeploy.");
      return;
    }

    if (images.length === 0 && activeItem !== NavItem.HUMAN) {
      setError("Mohon unggah foto produk terlebih dahulu.");
      return;
    }

    setIsGenerating(true); setError(null); setResults([]);
    try {
      const subjectFiles = images.map(i => i.file);
      const referenceFile = bgReference.length > 0 ? bgReference[0].file : null;
      const angleDesc = angles.find(a => a.id === selectedAngle)?.desc || "Eye Level";
      const finalSystemP = `ENVIRONMENT: ${styles.find(s => s.id === selectedStyle)?.desc || ""}. ANGLE: ${angleDesc}. MANDATORY: ZERO TEXT. `;
      
      const url = await generateImage(subjectFiles, referenceFile, finalSystemP, prompt, ratio, quality, angleDesc);
      setResults([url]);
    } catch (e: any) {
      const msg = e.message || "";
      if (msg === "MODEL_NOT_FOUND_PAID_REQUIRED") {
        setError("Error: Model HD (2K/4K) memerlukan API Key berbayar. Turunkan kualitas ke 1K Standard.");
      } else if (msg.includes("403") || msg.includes("permission denied")) {
        setError("Error 403: API Key Anda tidak memiliki izin. Cek apakah project di Google Cloud sudah aktif.");
      } else {
        setError("Gagal: " + msg);
      }
    } finally { setIsGenerating(false); }
  };

  const angles = [
    { id: 'ecu', label: 'ECU', icon: ZoomIn, desc: 'Extreme Close-Up' },
    { id: 'bms', label: 'BMS', icon: ArrowUpCircle, desc: 'Below-Eye-Level' },
    { id: 'ots-r', label: 'OTS-R', icon: ArrowDownRight, desc: 'Over-The-Shoulder' },
    { id: 'fs', label: 'FS', icon: Maximize, desc: 'Full Shot' },
    { id: 'tda', label: 'TDA', icon: CornerDownRight, desc: 'Top-Down Angled' },
    { id: 'ula', label: 'ULA', icon: ArrowUpLeft, desc: 'Ultra Low Angle' },
    { id: 'sp', label: 'S-P', icon: View, desc: 'Side Profile' },
    { id: 'd3q', label: 'D-3Q', icon: RotateCw, desc: 'Dynamic 3/4 View' },
    { id: 'rbv', label: 'RBV', icon: UserRound, desc: 'Reverse Back View' },
  ];

  const styles = [
    { id: 'neutral-home', label: 'Netral Home', icon: Thermometer, desc: 'Soft diffused daylight, real home' },
    { id: 'studio', label: 'Studio', icon: Box, desc: 'Clean white high-end lighting' },
    { id: 'natural', label: 'Natural', icon: Sun, desc: 'Direct window daylight' },
    { id: 'bedroom', label: 'Bedroom', icon: Coffee, desc: 'Cozy bedroom background' },
    { id: 'outdoor', label: 'Outdoor', icon: Mountain, desc: 'Sunny outdoor park' },
    { id: 'livingroom', label: 'Ruang Tamu', icon: Sofa, desc: 'Authentic living room' },
    { id: 'kitchen', label: 'Dapur', icon: Utensils, desc: 'Modern kitchen counter' },
    { id: 'car', label: 'Mobil', icon: Car, desc: 'Car interior' },
    { id: 'office', label: 'Meja Kerja', icon: Monitor, desc: 'Productivity desk' },
    { id: 'bathroom', label: 'Kamar Mandi', icon: Bath, desc: 'Bright bathroom' },
  ];

  if (activeItem === NavItem.HOME) {
    return (
      <main className="flex-1 overflow-y-auto p-12 bg-white flex flex-col items-center justify-center">
         <div className="w-28 h-28 bg-teal-500 rounded-[3rem] flex items-center justify-center text-white mb-10 shadow-3xl shadow-teal-500/40 animate-bounce">
            <Sparkles className="w-14 h-14" />
         </div>
         <h1 className="text-5xl font-black text-slate-900 mb-16 tracking-tighter text-center">Flash Affiliate Suite 2025</h1>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
            {[
              { id: NavItem.COMMERCIAL, label: 'Images Hub', icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
              { id: NavItem.UGC, label: 'UGC Studio', icon: Smartphone, color: 'bg-purple-50 text-purple-600' },
              { id: NavItem.COPYWRITER, label: 'Marketing Lab', icon: PenTool, color: 'bg-green-50 text-green-600' },
              { id: NavItem.SEO, label: 'SEO Trends', icon: Search, color: 'bg-orange-50 text-orange-600' },
            ].map(mod => (
              <div key={mod.id} onClick={() => setActiveItem(mod.id)} className="p-8 bg-white rounded-[2.5rem] border border-gray-100 hover:border-teal-400 hover:shadow-2xl transition-all cursor-pointer flex flex-col items-center text-center group">
                 <div className={`p-6 rounded-2xl mb-4 group-hover:scale-110 transition-transform ${mod.color}`}><mod.icon size={32} /></div>
                 <h3 className="font-black text-slate-800 text-lg">{mod.label}</h3>
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
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Key size={100} />
            </div>
            <div className="flex items-center gap-4 relative z-10">
                <div className={`p-3 rounded-2xl ${keySource ? 'bg-teal-500' : 'bg-red-500 animate-pulse'}`}>
                  {keySource === 'vercel' ? <Database className="w-6 h-6" /> : keySource === 'manual' ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                </div>
                <div>
                    <h4 className="font-black text-sm uppercase tracking-widest">
                      Koneksi: {keySource ? 'AKTIF' : 'TERPUTUS'}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      Sumber: {keySource === 'vercel' ? 'Vercel Env Vars' : keySource === 'manual' ? 'Manual Selection' : 'API Key Tidak Terdeteksi'}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3 relative z-10">
                {!keySource && (
                    <button 
                        onClick={handleSetApiKey}
                        className="flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white text-slate-900 border-white hover:bg-teal-50 transition-all"
                    >
                        <Key size={14} /> Hubungkan Manual
                    </button>
                )}
                {keySource === 'vercel' && (
                    <div className="px-4 py-2 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-xl text-[9px] font-black uppercase">
                        Sistem Otomatis Aktif
                    </div>
                )}
            </div>
        </div>

        {/* Content Section */}
        <div className={`relative transition-all duration-500 ${!keySource ? 'opacity-40 blur-[2px] pointer-events-none' : ''}`}>
          <div className="bg-white rounded-[4rem] shadow-2xl border border-gray-100 p-10 lg:p-16">
            <h2 className="text-4xl font-black text-slate-900 flex items-center gap-6 mb-16">
              <span className="p-5 bg-teal-50 text-teal-600 rounded-[2rem] shadow-inner"><Wand2 className="w-10 h-10" /></span>
              {activeItem}
            </h2>

            <div className="space-y-12">
                <div className="space-y-6">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4 block">1. Mode Kreator</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-gray-50 rounded-[2.5rem]">
                    {activeItem === NavItem.COMMERCIAL && (
                      <>
                        <TabButton active={selectedSubMode === 'product'} onClick={() => setSelectedSubMode('product')} icon={Box} label="Product Shot" />
                        <TabButton active={selectedSubMode === 'fashion'} onClick={() => setSelectedSubMode('fashion')} icon={Shirt} label="AI Fashion" />
                      </>
                    )}
                    {activeItem === NavItem.UGC && (
                      <TabButton active={selectedSubMode === 'real-pov'} onClick={() => setSelectedSubMode('real-pov')} icon={Hand} label="Real POV" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <ImageUploader images={images} setImages={setImages} maxFiles={4} label="2. Foto Produk" compact={true} />
                  <ImageUploader images={bgReference} setImages={setBgReference} maxFiles={1} label="3. Gaya (Opsional)" compact={true} />
                </div>

                <div className="space-y-6">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4 block">4. Kualitas (Pilih 1K jika Akun Gratis)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { id: ImageQuality.STANDARD, label: '1K Standard', free: true },
                          { id: ImageQuality.HD_2K, label: '2K High Def', free: false },
                          { id: ImageQuality.ULTRA_HD_4K, label: '4K Ultra', free: false },
                        ].map(q => (
                          <button 
                            key={q.id} 
                            onClick={() => setQuality(q.id)} 
                            className={`relative flex flex-col items-center justify-center p-6 rounded-3xl text-[10px] font-black uppercase transition-all border-2 ${quality === q.id ? 'bg-teal-500 border-teal-500 text-white shadow-xl' : 'bg-white border-gray-100 text-gray-400 hover:border-teal-200'}`}
                          >
                            {!q.free && <div className="absolute -top-3 right-4 px-3 py-1 bg-amber-400 text-amber-900 rounded-full text-[8px] flex items-center gap-1 shadow-sm"><Lock size={10} /> PAID ONLY</div>}
                            <span className="text-lg mb-1">{q.label.split(' ')[0]}</span>
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
                <div className="mt-8 bg-red-50 border border-red-100 p-8 rounded-[2.5rem] flex items-start gap-6 animate-shake">
                    <AlertTriangle className="text-red-500 shrink-0 w-8 h-8" />
                    <div className="space-y-2">
                        <p className="text-sm font-black text-red-600 uppercase tracking-tight">Terjadi Masalah</p>
                        <p className="text-xs text-red-500 leading-relaxed">{error}</p>
                    </div>
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
