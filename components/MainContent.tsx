
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
  Palette, Layout, GraduationCap, AlertTriangle, ExternalLink, Lock
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
  const [selectedGender, setSelectedGender] = useState("Wanita");
  const [selectedRace, setSelectedRace] = useState("Indonesia");
  const [ratio, setRatio] = useState<AspectRatio>(AspectRatio.PORTRAIT);
  const [quality, setQuality] = useState<ImageQuality>(ImageQuality.STANDARD);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedFullImage, setSelectedFullImage] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  
  const [seoProduct, setSeoProduct] = useState("");
  const [seoResult, setSeoResult] = useState<{ text: string; sources: any[] } | null>(null);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    if (window.aistudio) {
      const status = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(status);
    }
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
        setHasApiKey(true);
      }
    } catch (e) {
      console.error("Gagal membuka dialog kunci", e);
    }
  };

  const handleGenerate = async () => {
    const keySelected = await window.aistudio?.hasSelectedApiKey();
    if (!keySelected) {
      setHasApiKey(false);
      setError("Akses terkunci: Silakan hubungkan API Key Anda terlebih dahulu.");
      await handleSetApiKey();
      return;
    }

    if (images.length === 0 && activeItem !== NavItem.HUMAN) {
      setError("Mohon unggah foto produk terlebih dahulu.");
      return;
    }

    setIsGenerating(true); setError(null); setResults([]);
    try {
      const styleDesc = styles.find(s => s.id === selectedStyle)?.desc || "";
      const subjectFiles = images.map(i => i.file);
      const referenceFile = bgReference.length > 0 ? bgReference[0].file : null;

      const angleObj = angles.find(a => a.id === selectedAngle);
      const angleDesc = angleObj ? `${angleObj.label}: ${angleObj.desc}` : "Eye Level";
      const finalSystemP = `ENVIRONMENT: ${styleDesc}. ANGLE: ${angleDesc}. MANDATORY: ZERO TEXT. No watermarks. `;
      
      const url = await generateImage(subjectFiles, referenceFile, finalSystemP, prompt, ratio, quality, angleDesc);
      setResults([url]);
    } catch (e: any) {
      const msg = e.message || "";
      // Penanganan khusus jika model Pro tidak ditemukan (biasanya karena belum ada billing)
      if (msg.includes("Requested entity was not found") || msg.includes("404")) {
        setError("Error: Model HD memerlukan API Key dari project berbayar (Paid Project). Silakan gunakan kualitas '1K Standard' atau aktifkan billing di Google Cloud.");
      } else if (msg.includes("API key")) {
        setHasApiKey(false);
        setError("API Key tidak valid. Silakan set ulang.");
      } else {
        setError("Gagal memproses: " + msg);
      }
    } finally { setIsGenerating(false); }
  };

  const handleSearchTrends = async () => {
    const keySelected = await window.aistudio?.hasSelectedApiKey();
    if (!keySelected) {
      setHasApiKey(false);
      await handleSetApiKey();
      return;
    }

    if (!seoProduct) return;
    setIsGenerating(true);
    try {
      const data = await getSEOTrends(seoProduct);
      setSeoResult(data);
    } catch (e) { setError("Gagal mengambil tren."); }
    finally { setIsGenerating(false); }
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

  if (activeItem === NavItem.LEARNING) {
    return (
      <main className="flex-1 overflow-y-auto p-12 bg-gray-50/50">
        <LearningCenter />
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-6 lg:p-12 bg-gray-50/50 no-scrollbar">
      <div className="max-w-5xl mx-auto space-y-10 pb-40">
        
        {/* API Key Connection Banner */}
        <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] flex flex-wrap items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Key size={100} />
            </div>
            <div className="flex items-center gap-4 relative z-10">
                <div className={`p-3 rounded-2xl ${hasApiKey ? 'bg-teal-500' : 'bg-red-500 animate-pulse'}`}>
                  {hasApiKey ? <ShieldCheck className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                </div>
                <div>
                    <h4 className="font-black text-sm uppercase tracking-widest">
                      API Status: {hasApiKey ? 'Connected' : 'Disconnected'}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      {hasApiKey ? 'Siap digunakan' : 'Hubungkan Key untuk memulai'}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3 relative z-10">
                <a 
                  href="https://ai.google.dev/gemini-api/docs/billing" 
                  target="_blank" 
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  Info Billing <ExternalLink size={12} />
                </a>
                <button 
                    onClick={handleSetApiKey}
                    className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${hasApiKey ? 'bg-teal-500 border-teal-400' : 'bg-white text-slate-900 border-white hover:bg-teal-50'}`}
                >
                    <Key size={14} /> {hasApiKey ? 'Change API Key' : 'Connect API Key'}
                </button>
            </div>
        </div>

        {/* Content Section */}
        <div className={`relative transition-all duration-500 ${!hasApiKey ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
          
          <div className="bg-white rounded-[4rem] shadow-2xl border border-gray-100 p-10 lg:p-16">
            <h2 className="text-4xl font-black text-slate-900 flex items-center gap-6 mb-16">
              <span className="p-5 bg-teal-50 text-teal-600 rounded-[2rem] shadow-inner"><Wand2 className="w-10 h-10" /></span>
              {activeItem}
            </h2>

            {activeItem === NavItem.SEO ? (
               <div className="space-y-10">
                  {/* SEO Content */}
                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
                    <h2 className="text-3xl font-black mb-8 flex items-center gap-4"><Search className="text-orange-500" /> Market Trends</h2>
                    <div className="space-y-6">
                      <input 
                        value={seoProduct} 
                        onChange={(e) => setSeoProduct(e.target.value)}
                        placeholder="Nama produk..."
                        className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl text-sm outline-none focus:border-orange-400"
                      />
                      <button 
                        onClick={handleSearchTrends} 
                        disabled={isGenerating || !seoProduct}
                        className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase"
                      >
                        {isGenerating ? <Loader2 className="animate-spin mx-auto" /> : "CARI TREN TERBARU"}
                      </button>
                    </div>
                  </div>
                  {/* ... results display ... */}
               </div>
            ) : (
              <div className="space-y-12">
                {/* 1. Sub Mode */}
                <div className="space-y-6">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4 block">1. Pilih Sub-Mode Kreator</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-gray-50 rounded-[2.5rem]">
                    {activeItem === NavItem.COMMERCIAL && (
                      <>
                        <TabButton active={selectedSubMode === 'product'} onClick={() => setSelectedSubMode('product')} icon={Box} label="Product Shot" />
                        <TabButton active={selectedSubMode === 'fashion'} onClick={() => setSelectedSubMode('fashion')} icon={Shirt} label="AI Fashion" />
                        <TabButton active={selectedSubMode === 'mockup'} onClick={() => setSelectedSubMode('mockup')} icon={Palette} label="Mockup" />
                      </>
                    )}
                    {activeItem === NavItem.UGC && (
                      <>
                        <TabButton active={selectedSubMode === 'real-pov'} onClick={() => setSelectedSubMode('real-pov')} icon={Hand} label="Real POV Hand" />
                        <TabButton active={selectedSubMode === 'selfie'} onClick={() => setSelectedSubMode('selfie')} icon={UserSquare2} label="Selfie Rev" />
                        <TabButton active={selectedSubMode === 'unboxing'} onClick={() => setSelectedSubMode('unboxing')} icon={PackageOpen} label="Unboxing Exp" />
                        <TabButton active={selectedSubMode === 'lifestyle-flatlay'} onClick={() => setSelectedSubMode('lifestyle-flatlay')} icon={LayoutGrid} label="Flatlay" />
                      </>
                    )}
                    {activeItem === NavItem.HUMAN && (
                      <TabButton active={selectedSubMode === 'character'} onClick={() => setSelectedSubMode('character')} icon={User} label="AI Model" />
                    )}
                  </div>
                </div>

                {/* 2 & 3. Media Upload */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <ImageUploader 
                    images={images} 
                    setImages={setImages} 
                    maxFiles={activeItem === NavItem.COMMERCIAL ? 4 : 1} 
                    label="2. Unggah Media Utama" 
                    compact={true} 
                  />
                  <ImageUploader 
                    images={bgReference} 
                    setImages={setBgReference} 
                    maxFiles={1} 
                    label="3. Gaya (Opsional)" 
                    compact={true} 
                  />
                </div>

                {/* 4. Quality Selector with Billing Badges */}
                <div className="space-y-6">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4 block">4. Resolusi & Kualitas</label>
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
                            {!q.free && (
                                <div className="absolute -top-3 right-4 px-3 py-1 bg-amber-400 text-amber-900 rounded-full text-[8px] flex items-center gap-1 shadow-sm">
                                    <Lock size={10} /> PAID ONLY
                                </div>
                            )}
                            <span className="text-lg mb-1">{q.label.split(' ')[0]}</span>
                            <span className="opacity-60">{q.label.split(' ').slice(1).join(' ')}</span>
                          </button>
                        ))}
                    </div>
                </div>

                {/* 5. Ratio & Prompt */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4 block">5. Format Media</label>
                      <select value={ratio} onChange={e => setRatio(e.target.value as any)} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xs font-black tracking-widest uppercase outline-none focus:border-teal-400">
                        <option value={AspectRatio.SQUARE}>1:1 SQUARE (Feed)</option>
                        <option value={AspectRatio.PORTRAIT}>9:16 TALL (Reels/TikTok)</option>
                        <option value={AspectRatio.LANDSCAPE}>16:9 WIDE (YouTube)</option>
                      </select>
                  </div>
                  <div className="space-y-6">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4 block">6. Custom Deskripsi</label>
                      <input value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Tambahkan instruksi khusus..." className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xs outline-none focus:border-teal-400" />
                  </div>
                </div>
                
                <button 
                  onClick={handleGenerate} 
                  disabled={isGenerating} 
                  className={`w-full py-8 rounded-[3rem] font-black text-white text-2xl shadow-3xl flex items-center justify-center gap-6 transition-all ${isGenerating ? 'bg-slate-400 cursor-not-allowed' : 'bg-teal-500 hover:bg-teal-600'}`}
                >
                  {isGenerating ? <Loader2 className="w-10 h-10 animate-spin" /> : <Sparkles className="w-10 h-10" />}
                  <span>{isGenerating ? 'MENGHASILKAN...' : 'MULAI GENERATE'}</span>
                </button>
              </div>
            )}

            {error && (
                <div className="mt-8 bg-red-50 border border-red-100 p-8 rounded-[2.5rem] flex items-start gap-6 animate-shake">
                    <AlertTriangle className="text-red-500 shrink-0 w-8 h-8" />
                    <div className="space-y-2">
                        <p className="text-sm font-black text-red-600 uppercase tracking-tight">Terjadi Kesalahan</p>
                        <p className="text-xs text-red-500 leading-relaxed">{error}</p>
                        {error.includes("Paid Project") && (
                            <button 
                                onClick={() => setQuality(ImageQuality.STANDARD)}
                                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                            >
                                Turunkan ke Kualitas Standar
                            </button>
                        )}
                    </div>
                </div>
            )}
          </div>
        </div>

        {results.length > 0 && (
          <div className="space-y-10 animate-in slide-in-from-bottom-12 duration-1000">
            <div className="bg-white p-8 lg:p-12 rounded-[3rem] shadow-xl border border-gray-100">
                <div className={`grid gap-10 ${results.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                    {results.map((url, i) => (
                      <div key={i} className="group relative rounded-[2rem] overflow-hidden border-4 border-teal-100 shadow-2xl bg-white h-[500px]">
                         <img src={url} className="w-full h-full object-cover" alt={`Result ${i}`} />
                         <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-6 backdrop-blur-sm">
                            <button onClick={() => setSelectedFullImage(url)} className="p-5 bg-white rounded-2xl text-slate-800 hover:scale-110 transition-transform"><Maximize2 size={24} /></button>
                            <a href={url} download={`affiliate-media-${i}.png`} className="p-5 bg-teal-500 rounded-2xl text-white hover:scale-110 transition-transform"><Download size={24} /></a>
                         </div>
                      </div>
                    ))}
                </div>
            </div>
          </div>
        )}
      </div>

      {selectedFullImage && (
        <div className="fixed inset-0 z-[60] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
            <button onClick={() => setSelectedFullImage(null)} className="absolute top-8 right-8 p-4 bg-white/10 text-white rounded-full transition-all"><X size={32} /></button>
            <img src={selectedFullImage} className="max-w-full max-h-[90vh] rounded-[2rem] shadow-4xl object-contain border-4 border-white/10" alt="Full Preview" />
        </div>
      )}
    </main>
  );
};

export default MainContent;
