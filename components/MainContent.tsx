
import React, { useState, useEffect } from 'react';
import { NavItem, AspectRatio, UploadedImage, ImageQuality } from '../types';
import ImageUploader from './ImageUploader';
import { generateImage, generateDescription } from '../services/geminiService';
import { 
  Wand2, Download, RefreshCw, AlertCircle, Sparkles, 
  CheckCircle2, Loader2, Layers, Crop, 
  ShoppingBag, Shirt, Box, Layout, Megaphone,
  Palette, Zap, Coffee, Leaf, LayoutGrid, Maximize, X, Globe, 
  Smartphone, UserCheck, PackageOpen, User, ShieldCheck, Heart, 
  Sun, Home, Building2, Mountain, Star, Camera, Pencil
} from 'lucide-react';

interface TabButtonProps {
  id: string;
  label: string;
  icon?: React.ElementType;
  activeId: string;
  onClick: (id: string) => void;
}

const TabButton: React.FC<TabButtonProps> = ({ id, label, icon: Icon, activeId, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`flex-1 py-3 px-4 text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 ${
      activeId === id ? 'bg-teal-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
    }`}
  >
    {Icon && <Icon className="w-4 h-4" />}
    <span>{label}</span>
  </button>
);

const MainContent: React.FC<{ activeItem: NavItem; setActiveItem: (i: NavItem) => void }> = ({ activeItem, setActiveItem }) => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [secImages, setSecImages] = useState<UploadedImage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("studio");
  const [ratio, setRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [quality, setQuality] = useState<ImageQuality>(ImageQuality.STANDARD);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mode, setMode] = useState("product");
  const [batchMode, setBatchMode] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const styles = [
    { id: 'studio', label: 'Studio Clean', icon: Box, desc: 'Professional studio background, clean lighting, high-end' },
    { id: 'natural', label: 'Natural/Life', icon: Sun, desc: 'Cozy home interior, natural soft sunlight through window' },
    { id: 'outdoor', label: 'Outdoor/Park', icon: Mountain, desc: 'Beautiful nature park, soft bokeh background, daylight' },
    { id: 'luxury', label: 'Luxury/Gold', icon: Star, desc: 'Premium marble table, gold accents, elegant presentation' },
    { id: 'urban', label: 'Urban/Street', icon: Building2, desc: 'Modern city street, cafe vibes, trendy atmosphere' },
    { id: 'minimalist', label: 'Minimalist', icon: Coffee, desc: 'Plain solid color background, simple aesthetic, shadow play' },
  ];

  useEffect(() => {
    setImages([]); setSecImages([]); setResults([]); setPrompt(""); setProductDesc(""); setError(null);
    setQuality(ImageQuality.STANDARD); setBatchMode(false); setSelectedStyle("studio");
  }, [activeItem]);

  const handleGenerate = async () => {
    setIsGenerating(true); setError(null); setResults([]);
    try {
      const api = process.env.API_KEY || "";
      const files = [...images, ...secImages].map(i => i.file);
      if (files.length === 0) throw new Error("Silakan unggah foto produk terlebih dahulu.");

      const styleInstruction = styles.find(s => s.id === selectedStyle)?.desc || "";
      const systemP = `PRESERVE PRODUCT IDENTITY. Environment: ${styleInstruction}. Target App: ${activeItem} (${mode}).`;
      
      const fullUserPrompt = `${productDesc ? `Product Info: ${productDesc}. ` : ''}User Instructions: ${prompt}`;

      if (batchMode) {
        const poses = ["Front View", "Side View", "Detail Zoom", "In Use Lifestyle", "Flat Lay Aesthetic", "Creative Angle"];
        setProgress({ current: 0, total: poses.length });
        for (let i = 0; i < poses.length; i++) {
          const url = await generateImage(files, `${systemP}, Specific Pose: ${poses[i]}`, fullUserPrompt, ratio, quality, api);
          setResults(prev => [...prev, url]);
          setProgress(p => ({ ...p, current: i + 1 }));
        }
      } else {
        const url = await generateImage(files, systemP, fullUserPrompt, ratio, quality, api);
        setResults([url]);
      }
    } catch (e: any) {
      if (e.message?.includes('Requested entity was not found')) {
        (window as any).aistudio?.openSelectKey();
      } else {
        setError(e.message || "Terjadi kesalahan saat memproses gambar.");
      }
    } finally { setIsGenerating(false); setProgress({ current: 0, total: 0 }); }
  };

  const renderModuleControls = () => (
    <div className="space-y-6">
      {/* Tab Selector */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl overflow-x-auto no-scrollbar">
        {activeItem === NavItem.COMMERCIAL_HUB && (
          <>
            <TabButton id="product" label="Product" icon={ShoppingBag} activeId={mode} onClick={setMode} />
            <TabButton id="fashion" label="Fashion" icon={Shirt} activeId={mode} onClick={setMode} />
            <TabButton id="mockup" label="Mockup" icon={Box} activeId={mode} onClick={setMode} />
          </>
        )}
        {activeItem === NavItem.UGC_STUDIO && (
          <>
            <TabButton id="selfie" label="Selfie" icon={UserCheck} activeId={mode} onClick={setMode} />
            <TabButton id="pov" label="Hand POV" icon={Smartphone} activeId={mode} onClick={setMode} />
            <TabButton id="unboxing" label="Unboxing" icon={PackageOpen} activeId={mode} onClick={setMode} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ImageUploader images={images} setImages={setImages} maxFiles={1} label="Foto Produk Utama" description="Pastikan produk terlihat jelas dan tidak terpotong" />
        <ImageUploader images={secImages} setImages={setSecImages} maxFiles={1} label="Referensi Gaya (Opsional)" description="Unggah contoh latar belakang yang diinginkan" />
      </div>

      {/* Style Chips */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-gray-700 flex items-center">
          <Palette className="w-4 h-4 mr-2 text-purple-500" /> Magic Style & Environment
        </label>
        <div className="flex flex-wrap gap-2">
          {styles.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedStyle(s.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                selectedStyle === s.id 
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
              }`}
            >
              <s.icon className="w-3.5 h-3.5" />
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Instruction Fields */}
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 flex justify-between items-center">
             <span className="flex items-center"><Box className="w-4 h-4 mr-1 text-teal-500" /> Kenali Produk (Penting)</span>
             <button onClick={async () => {
               if (images[0]) {
                  setIsGenerating(true);
                  const d = await generateDescription(images[0].file, "Product Only", "");
                  setProductDesc(d);
                  setIsGenerating(false);
               }
             }} className="text-[10px] bg-teal-50 text-teal-700 px-2 py-1 rounded-lg border border-teal-100 flex items-center">
                <Wand2 className="w-3 h-3 mr-1" /> Auto Detect
             </button>
          </label>
          <input 
            type="text" 
            value={productDesc} 
            onChange={e => setProductDesc(e.target.value)}
            className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 outline-none" 
            placeholder="Contoh: Sepatu sneakers biru navy dengan sol putih..."
          />
          <p className="text-[10px] text-gray-400">Menjelaskan detail produk membantu AI tetap konsisten.</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">Instruksi Tambahan Latar Belakang</label>
          <textarea 
            value={prompt} 
            onChange={e => setPrompt(e.target.value)} 
            className="w-full p-4 bg-white border border-gray-200 rounded-xl h-24 text-sm focus:ring-2 focus:ring-teal-500/20 outline-none transition-all" 
            placeholder="Contoh: Letakkan di atas meja kayu rustic dengan beberapa bunga di sampingnya..." 
          />
        </div>
      </div>
    </div>
  );

  if (activeItem === NavItem.HOME) {
    return (
      <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-8 text-center py-10">
           <div className="w-24 h-24 bg-gradient-to-br from-teal-400 to-blue-600 rounded-[2rem] mx-auto flex items-center justify-center text-white mb-6 shadow-2xl shadow-teal-200">
              <Sparkles className="w-12 h-12" />
           </div>
           <h2 className="text-4xl font-black text-gray-900 tracking-tight">Affiliate Content Suite</h2>
           <p className="text-gray-500 max-w-lg mx-auto text-lg">Ubah foto produk biasa jadi konten promosi kelas dunia menggunakan Gemini AI.</p>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left mt-16">
              {[
                { id: NavItem.COMMERCIAL_HUB, title: "Commercial", desc: "Studio & Product Shot", icon: ShoppingBag, color: "teal" },
                { id: NavItem.UGC_STUDIO, title: "UGC Content", desc: "Natural & Testimonial", icon: Smartphone, color: "blue" },
                { id: NavItem.ADS_STUDIO, title: "Ads Studio", desc: "Banners & Socials", icon: Megaphone, color: "indigo" },
                { id: NavItem.MAGIC_TOOLS, title: "Magic Tools", desc: "Edit & Combine", icon: Wand2, color: "purple" },
                { id: NavItem.HUMAN_STUDIO, title: "Human AI", desc: "Fashion Models", icon: User, color: "pink" },
                { id: NavItem.FACESWAP, title: "Face Swap", desc: "Instant Identity", icon: RefreshCw, color: "orange" },
              ].map(item => (
                <div key={item.id} onClick={() => setActiveItem(item.id)} className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all">
                   <div className={`w-12 h-12 bg-${item.color}-50 text-${item.color}-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <item.icon className="w-6 h-6" />
                   </div>
                   <h3 className="font-bold text-gray-800 text-lg">{item.title}</h3>
                   <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gray-50 no-scrollbar">
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div className="bg-white rounded-[2.5rem] shadow-xl p-6 lg:p-10 border border-white">
          <div className="flex justify-between items-start mb-8">
            <div>
               <h2 className="text-2xl font-black text-gray-900 flex items-center tracking-tight">
                  <Sparkles className="w-7 h-7 mr-3 text-teal-500" /> {activeItem}
               </h2>
               <p className="text-gray-400 text-sm mt-1">Sempurnakan tampilan produk afiliasi Anda.</p>
            </div>
          </div>
          
          {renderModuleControls()}

          <div className="mt-10 pt-10 border-t border-gray-100 space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                   <label className="text-sm font-bold text-gray-700">Rasio Gambar</label>
                   <div className="grid grid-cols-3 gap-2">
                      {[AspectRatio.SQUARE, AspectRatio.LANDSCAPE, AspectRatio.PORTRAIT].map(r => (
                        <button key={r} onClick={() => setRatio(r)} className={`py-3 rounded-xl border text-xs font-bold transition-all ${ratio === r ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{r}</button>
                      ))}
                   </div>
                </div>
                <div className="space-y-3">
                   <label className="text-sm font-bold text-gray-700">Kualitas & Kecepatan</label>
                   <div className="grid grid-cols-3 gap-2">
                      {[ImageQuality.STANDARD, ImageQuality.HD_2K, ImageQuality.ULTRA_HD_4K].map(q => (
                        <button key={q} onClick={async () => {
                          if (q !== ImageQuality.STANDARD) {
                             if (!(await (window as any).aistudio?.hasSelectedApiKey())) {
                                alert("Mode 2K/4K membutuhkan API Key berbayar Anda.");
                                await (window as any).aistudio?.openSelectKey();
                             }
                          }
                          setQuality(q);
                        }} className={`py-3 rounded-xl border text-xs font-bold transition-all ${quality === q ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{q}</button>
                      ))}
                   </div>
                </div>
             </div>

             <div className="pt-6 space-y-4">
                <div onClick={() => setBatchMode(!batchMode)} className={`flex items-center justify-between p-5 rounded-2xl cursor-pointer border transition-all ${batchMode ? 'bg-teal-50 border-teal-200 shadow-sm' : 'bg-gray-50 border-gray-200'}`}>
                   <div className="flex items-center space-x-3"><LayoutGrid className="w-5 h-5 text-teal-600" /><div><h4 className="font-bold text-sm">Batch Mode</h4><p className="text-[10px] text-gray-500">Buat 6 variasi sudut pandang sekaligus</p></div></div>
                   <div className={`w-12 h-6 rounded-full p-1 transition-all flex items-center ${batchMode ? 'bg-teal-600' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${batchMode ? 'translate-x-6' : 'translate-x-0'}`} /></div>
                </div>

                <button onClick={handleGenerate} disabled={isGenerating} className={`w-full py-5 rounded-2xl font-black text-white shadow-2xl shadow-teal-200 flex items-center justify-center space-x-3 transition-all active:scale-[0.98] ${isGenerating ? 'bg-gray-400' : 'bg-gradient-to-r from-teal-600 to-blue-700'}`}>
                   {isGenerating ? <><Loader2 className="w-6 h-6 animate-spin" /><span>{progress.total > 0 ? `Processing ${progress.current}/${progress.total}...` : 'Generating Your Masterpiece...'}</span></> : <><Wand2 className="w-6 h-6" /><span className="text-lg">GENERATE NOW</span></>}
                </button>
                {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs flex items-center border border-red-100 shadow-sm"><AlertCircle className="w-4 h-4 mr-2" /> {error}</div>}
             </div>
          </div>
        </div>

        {results.length > 0 && (
          <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden mt-12 border border-gray-100 animate-fade-in">
             <div className="p-6 border-b bg-gray-50/50 flex justify-between items-center">
                <span className="font-bold text-gray-900 flex items-center text-lg"><CheckCircle2 className="w-6 h-6 text-green-500 mr-2" /> Generated Results</span>
                {quality !== ImageQuality.STANDARD && <span className="text-[10px] bg-yellow-400 text-black font-black px-4 py-1.5 rounded-full shadow-sm ring-2 ring-yellow-200 uppercase tracking-widest">{quality} PRO MODE</span>}
             </div>
             <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50">
                {results.map((url, i) => (
                  <div key={i} className="group relative rounded-3xl overflow-hidden border-4 border-white shadow-lg bg-white transition-all hover:shadow-2xl hover:scale-[1.02]">
                     <img src={url} className="w-full h-auto aspect-square object-cover" alt={`AI Generated ${i}`} />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 flex items-end justify-center p-6 gap-3 transition-all">
                        <a href={url} download={`magic-result-${i}.png`} className="flex-1 py-3 bg-white text-gray-900 rounded-xl font-bold text-center hover:bg-teal-500 hover:text-white transition-colors flex items-center justify-center gap-2">
                           <Download className="w-4 h-4" /> Download
                        </a>
                        <button onClick={() => window.open(url)} className="p-3 bg-white/20 backdrop-blur-md text-white rounded-xl hover:bg-white/40 transition-colors">
                           <Maximize className="w-5 h-5" />
                        </button>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default MainContent;
