
import React, { useState, useEffect, useRef } from 'react';
import { NavItem, AspectRatio, UploadedImage, ImageQuality } from '../types';
import ImageUploader from './ImageUploader';
import { 
  generateImage, 
  generateMagicContent, 
  generateTTS, 
  decodeBase64, 
  decodeAudioData,
  pcmToWav 
} from '../services/geminiService';
import { 
  Download, Sparkles, 
  Loader2, ShoppingBag, Box, 
  Coffee, LayoutGrid, Maximize, 
  Smartphone, UserSquare2, Sun, Star, Megaphone, 
  Video, Mic, Users, Home, Bed, Utensils, Sofa, TreePine, Car, Dumbbell, Store,
  Play, Pause, User, ArrowRight, Shirt, Layers,
  Eye, Target, ArrowDownCircle, ArrowUpCircle, ZoomIn, View, UserCircle, Image as ImageIcon, Wand2,
  MapPin, Globe, Languages
} from 'lucide-react';

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
  const [secondaryImages, setSecondaryImages] = useState<UploadedImage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [selectedSubMode, setSelectedSubMode] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("studio");
  const [selectedAngle, setSelectedAngle] = useState("eye-level");
  const [selectedGender, setSelectedGender] = useState("Wanita");
  const [selectedRace, setSelectedRace] = useState("Indonesia");
  const [ratio, setRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [isGenerating, setIsGenerating] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [magicContent, setMagicContent] = useState<{ type: 'voice' | 'video', text: string } | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [lastBase64Audio, setLastBase64Audio] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const voiceOptions = [
    { id: 'Kore', label: 'Energik (TikTok)', desc: 'Influencer ceria' },
    { id: 'Charon', label: 'Deep (Pro)', desc: 'Profesional & berat' },
    { id: 'Puck', label: 'Friendly', desc: 'Ramah & akrab' },
    { id: 'Fenrir', label: 'Storyteller', desc: 'Tenang bercerita' },
  ];

  const raceOptions = [
    { id: 'Indonesia', label: 'Indonesia', icon: MapPin, prompt: 'Indonesian person with Southeast Asian features, warm skin tone, natural local look' },
    { id: 'America', label: 'USA / Europe', icon: Globe, prompt: 'Caucasian American/European person, fair skin, Western features' },
    { id: 'Korea', label: 'Korea / Japan', icon: Languages, prompt: 'East Asian features, K-style aesthetic, smooth pale skin' },
    { id: 'Arab', label: 'Middle East', icon: Sun, prompt: 'Middle Eastern features, Mediterranean skin tone, elegant features' },
    { id: 'India', label: 'South Asia', icon: Star, prompt: 'South Asian/Indian features, tan skin, vibrant appearance' },
    { id: 'African', label: 'African', icon: User, prompt: 'African features, deep dark skin tone, natural hair textures' },
  ];

  const angles = [
    { id: 'eye-level', label: 'Eye Level', icon: Eye, desc: 'Straight on eye-level view, professional look' },
    { id: 'birds-eye', label: 'Bird\'s Eye', icon: ArrowDownCircle, desc: 'High angle shot from above' },
    { id: 'worms-eye', label: 'Worm\'s Eye', icon: ArrowUpCircle, desc: 'Low angle shot looking up' },
    { id: 'side-profile', label: 'Side Shot', icon: View, desc: 'Profile view from the side' },
    { id: 'macro-detail', label: 'Macro/Close', icon: ZoomIn, desc: 'Extreme close-up on details' },
    { id: 'wide-cinematic', label: 'Wide Shot', icon: Maximize, desc: 'Full body or wide environmental shot' },
  ];

  const styles = activeItem === NavItem.UGC ? [
    { id: 'bedroom', label: 'Bedroom', icon: Bed, desc: 'Cozy bedroom with natural morning light' },
    { id: 'kitchen', label: 'Kitchen', icon: Utensils, desc: 'Real home kitchen background' },
    { id: 'livingroom', label: 'Living Room', icon: Sofa, desc: 'Modern living room with plants' },
    { id: 'cafe', label: 'Cafe', icon: Coffee, desc: 'Outdoor cafe table setting' },
    { id: 'outdoor', label: 'Park', icon: TreePine, desc: 'Sunny park background' },
    { id: 'car', label: 'Car', icon: Car, desc: 'In-car steering wheel and dash' },
    { id: 'gym', label: 'Gym', icon: Dumbbell, desc: 'Fitness center vibe' },
    { id: 'mall', label: 'Mall', icon: Store, desc: 'Bright shopping mall background' },
  ] : [
    { id: 'studio', label: 'Studio', icon: Box, desc: 'High-end studio white lighting' },
    { id: 'natural', label: 'Soft Light', icon: Sun, desc: 'Natural window daylight' },
    { id: 'luxury', label: 'Luxury', icon: Star, desc: 'Elegant marble and gold' },
    { id: 'minimal', label: 'Minimal', icon: Coffee, desc: 'Clean white aesthetic' },
  ];

  useEffect(() => {
    setImages([]); setSecondaryImages([]); setResults([]); setPrompt(""); setError(null); setMagicContent(null);
    setSelectedStyle(activeItem === NavItem.UGC ? 'bedroom' : 'studio');
    
    switch(activeItem) {
      case NavItem.COMMERCIAL: setSelectedSubMode("product"); break;
      case NavItem.UGC: setSelectedSubMode("selfie"); break;
      case NavItem.ADS: setSelectedSubMode("banner"); break;
      case NavItem.HUMAN: setSelectedSubMode("character"); break;
      case NavItem.MAGIC: setSelectedSubMode("faceswap"); break;
      default: setSelectedSubMode("");
    }

    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [activeItem]);

  const handleGenerate = async () => {
    if (images.length === 0 && activeItem !== NavItem.HUMAN) {
      setError("Mohon unggah foto terlebih dahulu.");
      return;
    }
    setIsGenerating(true); setError(null); setMagicContent(null);
    try {
      const styleObj = styles.find(s => s.id === selectedStyle);
      const styleDesc = styleObj?.desc || "";
      const styleName = styleObj?.label || "";
      const angleDesc = angles.find(a => a.id === selectedAngle)?.desc || "";
      const racePrompt = raceOptions.find(r => r.id === selectedRace)?.prompt || "";
      const genderTerm = selectedGender === "Pria" ? "man/male" : "woman/female";
      const handsTerm = selectedGender === "Pria" ? "masculine male hands" : "feminine female hands";
      
      let systemP = `SUBJECT IDENTITY: A ${selectedGender} (${genderTerm}) with ${racePrompt}. MUST use ${handsTerm}. `;
      systemP += `ENVIRONMENT: ${styleDesc}. `;

      if (activeItem === NavItem.UGC) {
        if (selectedSubMode === 'selfie') {
          systemP += `GOAL: Handheld selfie shot. A ${selectedGender} is holding a smartphone in their outstretched hand inside a ${styleName}. NO MIRRORS. The shot should look like it was taken with a front-facing camera. Visible arm reaching towards the lens. The product should be held naturally by the ${selectedGender} near their face. Background MUST clearly show a ${styleDesc}. `;
        } else if (selectedSubMode === 'pov') {
          systemP += `GOAL: Handheld POV (Point of View). Capture the image from the user's eye level within a ${styleName}. VISIBLE ${handsTerm.toUpperCase()} and arms are reaching into the frame holding the product. Highly natural, authentic amateur photography style. `;
        } else if (selectedSubMode === 'unboxing') {
          const surfaceType = selectedStyle === 'bedroom' ? 'bed / mattress' : 
                             selectedStyle === 'kitchen' ? 'kitchen counter / island' :
                             selectedStyle === 'livingroom' ? 'coffee table / sofa' : 'table surface';
                             
          systemP += `GOAL: Natural unboxing scene. Only ${handsTerm.toUpperCase()} are visible opening a package or interacting with a product. The interaction MUST take place on a ${surfaceType} inside a ${styleName.toUpperCase()}. The background behind the hands MUST clearly reflect a ${styleDesc}. The lighting should match a ${styleName} vibe. `;
        }
      } else if (activeItem === NavItem.MAGIC) {
        if (selectedSubMode === 'faceswap') {
          if (secondaryImages.length === 0) throw new Error("Mohon unggah foto wajah sumber.");
          systemP += "TASK: FACE SWAP. Replace the face in the first image with the face from the second image accurately. ";
        } else if (selectedSubMode === 'bgswap') {
          systemP += `TASK: REPLACE BACKGROUND. Change background to ${styleDesc}. `;
        } else if (selectedSubMode === 'expand') {
          systemP += "TASK: OUTPAINTING. Expand the image naturally beyond its current borders. ";
        }
      } else if (activeItem === NavItem.COMMERCIAL) {
        if (selectedSubMode === 'fashion') systemP += `GOAL: AI FASHION. Put the uploaded clothing item onto a realistic ${selectedGender} model with ${racePrompt}. `;
        else if (selectedSubMode === 'mockup') systemP += "GOAL: MOCKUP. Place the design/logo onto the product surface naturally. ";
        else systemP += `GOAL: High-end professional product shot set in a ${styleDesc}. `;
      }

      let inputFiles = [...images.map(i => i.file)];
      if (activeItem === NavItem.MAGIC && selectedSubMode === 'faceswap') {
        inputFiles = [images[0].file, secondaryImages[0].file];
      }

      if (batchMode) {
        setResults([]);
        setProgress({ current: 0, total: 6 });
        const batchAngles = ["Front View", "Left Angle", "Right Angle", "From Above", "From Below", "Macro Close-up"];
        for (let i = 0; i < 6; i++) {
          const url = await generateImage(inputFiles, systemP, prompt, ratio, ImageQuality.STANDARD, batchAngles[i]);
          setResults(prev => [...prev, url]);
          setProgress(p => ({ ...p, current: i + 1 }));
        }
      } else {
        const url = await generateImage(inputFiles, systemP, prompt, ratio, ImageQuality.STANDARD, angleDesc);
        setResults([url]);
      }
    } catch (e: any) {
      setError(e.message || "Gagal memproses gambar.");
    } finally { setIsGenerating(false); setProgress({ current: 0, total: 0 }); }
  };

  const handleMagicTool = async (imageUrl: string, type: 'voice' | 'video') => {
    setIsMagicLoading(true); setMagicContent(null); setLastBase64Audio(null);
    try {
      const text = await generateMagicContent(imageUrl, type);
      setMagicContent({ type, text });
      setTimeout(() => document.getElementById('magic-display')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e) { setError("Magic tools gagal."); } finally { setIsMagicLoading(false); }
  };

  const handlePlayVoice = async () => {
    if (!magicContent || isVoiceLoading) return;
    if (isPlaying) { sourceNodeRef.current?.stop(); setIsPlaying(false); return; }
    setIsVoiceLoading(true);
    try {
      const base64 = await generateTTS(magicContent.text, selectedVoice);
      setLastBase64Audio(base64);
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioContextRef.current;
      const audioBuffer = await decodeAudioData(decodeBase64(base64), ctx);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlaying(false);
      sourceNodeRef.current = source;
      source.start();
      setIsPlaying(true);
    } catch (e) { setError("Suara gagal diputar."); } finally { setIsVoiceLoading(false); }
  };

  const handleDownloadVoice = () => {
    if (!lastBase64Audio) return;
    const wavBlob = pcmToWav(decodeBase64(lastBase64Audio));
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a'); a.href = url;
    a.download = `vo-${Date.now()}.wav`; a.click();
    URL.revokeObjectURL(url);
  };

  if (activeItem === NavItem.HOME) {
    return (
      <main className="flex-1 overflow-y-auto p-12 bg-white flex flex-col items-center justify-center">
         <div className="w-28 h-28 bg-teal-500 rounded-[3rem] flex items-center justify-center text-white mb-10 shadow-3xl shadow-teal-500/40 transform hover:rotate-12 hover:scale-110 transition-all cursor-pointer">
            <Sparkles className="w-14 h-14" />
         </div>
         <h1 className="text-5xl font-black text-slate-900 mb-16 tracking-tighter text-center">Magic Picture Suite</h1>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 w-full max-w-6xl">
            {[
              { id: NavItem.COMMERCIAL, label: 'Commercial Hub', icon: ShoppingBag, color: 'bg-blue-50 text-blue-600', desc: 'Fashion & Mockup' },
              { id: NavItem.UGC, label: 'UGC Studio', icon: Smartphone, color: 'bg-green-50 text-green-600', desc: 'Selfie & POV' },
              { id: NavItem.ADS, label: 'Ads Studio', icon: Megaphone, color: 'bg-orange-50 text-orange-600', desc: 'Marketplace Ads' },
              { id: NavItem.HUMAN, label: 'Human Studio', icon: Users, color: 'bg-pink-50 text-pink-600', desc: 'AI Professional Model' },
              { id: NavItem.MAGIC, label: 'Magic Tools', icon: Wand2, color: 'bg-teal-50 text-teal-600', desc: 'Face Swap & Edit' },
            ].map(mod => (
              <div key={mod.id} onClick={() => setActiveItem(mod.id)} className="p-12 bg-white rounded-[3rem] border border-gray-100 hover:border-teal-400 hover:shadow-3xl transition-all cursor-pointer flex flex-col items-center text-center group relative overflow-hidden">
                 <div className={`p-8 rounded-[2rem] mb-8 group-hover:scale-110 transition-transform ${mod.color}`}><mod.icon className="w-12 h-12" /></div>
                 <h3 className="font-black text-slate-800 text-2xl mb-2">{mod.label}</h3>
                 <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.3em]">{mod.desc}</p>
              </div>
            ))}
         </div>
      </main>
    );
  }

  const isHumanActive = activeItem === NavItem.HUMAN || activeItem === NavItem.UGC || (activeItem === NavItem.COMMERCIAL && selectedSubMode === 'fashion') || (activeItem === NavItem.MAGIC && selectedSubMode === 'faceswap');

  return (
    <main className="flex-1 overflow-y-auto p-6 lg:p-12 bg-gray-50/50 no-scrollbar">
      <div className="max-w-5xl mx-auto space-y-10 pb-40">
        <div className="bg-white rounded-[4rem] shadow-2xl border border-gray-100 p-10 lg:p-16 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
            <h2 className="text-4xl font-black text-slate-900 flex items-center gap-6">
              <span className="p-5 bg-teal-50 text-teal-600 rounded-[2rem] shadow-inner"><Wand2 className="w-10 h-10" /></span>
              {activeItem}
            </h2>
            <button onClick={() => setActiveItem(NavItem.HOME)} className="text-[11px] font-black text-teal-600 hover:text-teal-800 uppercase tracking-[0.4em] flex items-center gap-3 group bg-teal-50/50 px-8 py-4 rounded-full transition-all">
              DASHBOARD <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>

          <div className="space-y-12">
            <div className="space-y-6">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4 block">1. Pilih Sub-Mode / Tool</label>
              <div className="flex flex-wrap gap-4 p-3 bg-gray-50 rounded-[2.5rem]">
                {activeItem === NavItem.COMMERCIAL && (
                  <>
                    <TabButton active={selectedSubMode === 'product'} onClick={() => setSelectedSubMode('product')} icon={Box} label="Product Shot" />
                    <TabButton active={selectedSubMode === 'fashion'} onClick={() => setSelectedSubMode('fashion')} icon={Shirt} label="AI Fashion" />
                    <TabButton active={selectedSubMode === 'mockup'} onClick={() => setSelectedSubMode('mockup')} icon={Layers} label="Mockup Pro" />
                  </>
                )}
                {activeItem === NavItem.UGC && (
                  <>
                    <TabButton active={selectedSubMode === 'selfie'} onClick={() => setSelectedSubMode('selfie')} icon={UserSquare2} label="Selfie" />
                    <TabButton active={selectedSubMode === 'pov'} onClick={() => setSelectedSubMode('pov')} icon={Smartphone} label="Handheld POV" />
                    <TabButton active={selectedSubMode === 'unboxing'} onClick={() => setSelectedSubMode('unboxing')} icon={Box} label="Natural Unboxing" />
                  </>
                )}
                {activeItem === NavItem.MAGIC && (
                  <>
                    <TabButton active={selectedSubMode === 'faceswap'} onClick={() => setSelectedSubMode('faceswap')} icon={UserCircle} label="AI Face Swap" />
                    <TabButton active={selectedSubMode === 'bgswap'} onClick={() => setSelectedSubMode('bgswap')} icon={ImageIcon} label="Background Edit" />
                    <TabButton active={selectedSubMode === 'expand'} onClick={() => setSelectedSubMode('expand')} icon={Maximize} label="Expand Frame" />
                  </>
                )}
                {activeItem === NavItem.HUMAN && (
                  <>
                    <TabButton active={selectedSubMode === 'character'} onClick={() => setSelectedSubMode('character')} icon={User} label="AI Model" />
                    <TabButton active={selectedSubMode === 'professional'} onClick={() => setSelectedSubMode('professional')} icon={Users} label="Corporate" />
                    <TabButton active={selectedSubMode === 'lifestyle'} onClick={() => setSelectedSubMode('lifestyle')} icon={Star} label="Lifestyle" />
                  </>
                )}
              </div>
            </div>

            {isHumanActive && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-top-4 duration-500">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em] ml-2 block">Pilih Gender</label>
                  <div className="flex gap-4 p-2 bg-teal-50/30 border-2 border-teal-100 rounded-[2rem]">
                    <button onClick={() => setSelectedGender("Pria")} className={`flex-1 py-4 text-[10px] font-black rounded-2xl transition-all uppercase tracking-[0.2em] ${selectedGender === 'Pria' ? 'bg-teal-500 text-white shadow-xl' : 'text-teal-800 hover:bg-teal-100'}`}>Pria</button>
                    <button onClick={() => setSelectedGender("Wanita")} className={`flex-1 py-4 text-[10px] font-black rounded-2xl transition-all uppercase tracking-[0.2em] ${selectedGender === 'Wanita' ? 'bg-teal-500 text-white shadow-xl' : 'text-teal-800 hover:bg-teal-100'}`}>Wanita</button>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em] ml-2 block">Identitas Global / Ras</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 p-2 bg-teal-50/30 border-2 border-teal-100 rounded-[2rem]">
                    {raceOptions.map(race => (
                      <button 
                        key={race.id} 
                        onClick={() => setSelectedRace(race.id)} 
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all gap-1 ${selectedRace === race.id ? 'bg-teal-500 text-white shadow-lg' : 'text-teal-800 hover:bg-teal-100'}`}
                        title={race.label}
                      >
                        <race.icon className="w-4 h-4" />
                        <span className="text-[8px] font-black uppercase tracking-tighter truncate w-full text-center">{race.id === 'EastAsian' ? 'Asian' : race.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className={`grid grid-cols-1 ${selectedSubMode === 'faceswap' ? 'md:grid-cols-2' : ''} gap-10`}>
              {activeItem !== NavItem.HUMAN && (
                <ImageUploader images={images} setImages={setImages} maxFiles={1} label={selectedSubMode === 'faceswap' ? "2. Foto Target (Tubuh/Pose)" : "2. Unggah Media Utama"} compact={true} />
              )}
              {selectedSubMode === 'faceswap' && (
                <ImageUploader images={secondaryImages} setImages={setSecondaryImages} maxFiles={1} label="3. Foto Sumber (Wajah)" compact={true} />
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="space-y-6">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4 block">3. Pilih Lingkungan</label>
                  <div className="grid grid-cols-4 gap-4">
                    {styles.map(s => (
                      <button key={s.id} onClick={() => setSelectedStyle(s.id)} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${selectedStyle === s.id ? 'bg-teal-500 text-white border-teal-500 shadow-3xl scale-110 z-10' : 'bg-white text-slate-400 border-gray-100 hover:border-teal-200'}`}>
                        <s.icon className="w-8 h-8" /><span className="text-[9px] font-black uppercase tracking-tighter">{s.label.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
               </div>
               <div className="space-y-6">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4 block">4. Resolusi & Format</label>
                  <div className="space-y-4">
                    <select value={ratio} onChange={e => setRatio(e.target.value as any)} className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl text-xs font-black tracking-widest uppercase outline-none focus:border-teal-400 focus:bg-white transition-all">
                       <option value={AspectRatio.SQUARE}>1:1 SQUARE</option>
                       <option value={AspectRatio.PORTRAIT}>9:16 TALL</option>
                       <option value={AspectRatio.LANDSCAPE}>16:9 WIDE</option>
                    </select>
                    <div className="p-6 bg-gray-100 border-2 border-gray-100 rounded-3xl text-[10px] font-black tracking-widest uppercase text-gray-400">
                        1K Standard Performance (Fixed)
                    </div>
                  </div>
               </div>
            </div>

            <div className="space-y-6">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4 block">5. Atur Sudut Kamera (Ubah Angle)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {angles.map(a => (
                    <button key={a.id} onClick={() => setSelectedAngle(a.id)} className={`p-5 rounded-[1.5rem] border-2 transition-all flex flex-col items-center gap-2 group ${selectedAngle === a.id ? 'bg-teal-500 text-white border-teal-500 shadow-xl scale-105' : 'bg-white text-slate-400 border-gray-100 hover:border-teal-100'}`}>
                      <a.icon className={`w-6 h-6 transition-transform ${selectedAngle === a.id ? 'scale-110' : 'group-hover:rotate-12'}`} />
                      <span className="text-[8px] font-black uppercase text-center">{a.label}</span>
                    </button>
                  ))}
                </div>
            </div>

            <div className="space-y-5">
               <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4 block">6. Instruksi Tambahan (Prompt)</label>
               <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Contoh: Tambah properti bunga, cahaya neon ungu, atau detail tekstur yang tajam..." className="w-full p-10 bg-gray-50 border-2 border-gray-100 rounded-[3rem] h-40 text-lg outline-none focus:bg-white focus:ring-[16px] focus:ring-teal-500/5 transition-all font-medium placeholder:opacity-50" />
            </div>

            <div className="flex items-center justify-between p-8 bg-teal-50/50 rounded-[2.5rem] border-2 border-teal-100/30">
               <div className="flex items-center gap-5">
                  <div className="p-4 bg-teal-500/10 text-teal-600 rounded-2xl"><LayoutGrid className="w-8 h-8" /></div>
                  <div>
                    <span className="text-sm font-black text-teal-900 uppercase tracking-[0.3em] block">Smart Batch Mode</span>
                    <span className="text-[10px] text-teal-500 font-black uppercase mt-1 block">Generate 6 Variasi Sudut Berbeda</span>
                  </div>
               </div>
               <button onClick={() => setBatchMode(!batchMode)} className={`w-20 h-10 rounded-full flex items-center p-2 transition-colors duration-500 ${batchMode ? 'bg-teal-500 shadow-xl shadow-teal-500/40' : 'bg-gray-300'}`}>
                 <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-500 ${batchMode ? 'translate-x-10' : 'translate-x-0'}`} />
               </button>
            </div>

            <button onClick={handleGenerate} disabled={isGenerating} className={`w-full py-8 rounded-[3rem] font-black text-white text-2xl shadow-3xl flex items-center justify-center gap-6 transition-all ${isGenerating ? 'bg-slate-400 cursor-not-allowed' : 'bg-teal-500 hover:bg-teal-600 hover:shadow-teal-500/50 hover:-translate-y-1 active:scale-95'}`}>
              {isGenerating ? <><Loader2 className="w-10 h-10 animate-spin" /><span>PROCESSING ARTWORK...</span></> : <><Sparkles className="w-10 h-10" /><span>MULAI MAGIC GENERATE</span></>}
            </button>
            {error && <p className="text-center text-sm font-black text-red-500 uppercase tracking-[0.3em] animate-bounce">{error}</p>}
          </div>
        </div>

        {results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 animate-in slide-in-from-bottom-12 duration-1000">
            {results.map((url, i) => (
              <div key={i} className="group relative rounded-[4rem] overflow-hidden border-[16px] border-white shadow-3xl bg-white flex flex-col">
                 <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <img src={url} className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-125" alt="Result" />
                    <div className="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center gap-8 backdrop-blur-md">
                        <button onClick={() => window.open(url)} className="p-6 bg-white rounded-3xl shadow-2xl hover:scale-125 transition-transform text-slate-800"><Maximize className="w-8 h-8" /></button>
                        <a href={url} download={`result-${Date.now()}.png`} className="p-6 bg-teal-500 rounded-3xl shadow-2xl hover:scale-125 transition-transform text-white"><Download className="w-8 h-8" /></a>
                    </div>
                 </div>
                 <div className="p-8 bg-white flex gap-6 border-t border-gray-100">
                    <button onClick={() => handleMagicTool(url, 'voice')} className="flex-1 py-5 bg-teal-50 text-teal-600 rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-teal-100 transition-all"><Mic className="w-6 h-6" /> TikTok Script</button>
                    <button onClick={() => handleMagicTool(url, 'video')} className="flex-1 py-5 bg-purple-50 text-purple-600 rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-purple-100 transition-all"><Video className="w-6 h-6" /> Video Motion</button>
                 </div>
              </div>
            ))}
          </div>
        )}

        {(isMagicLoading || magicContent) && (
          <div id="magic-display" className="p-12 bg-[#0B1723] rounded-[4rem] shadow-3xl border border-teal-500/30 animate-in fade-in zoom-in-95 duration-700">
             <div className="flex flex-col sm:flex-row items-center justify-between mb-12 pb-10 border-b border-gray-800 gap-10">
                <div className="flex items-center gap-8">
                   <div className="p-6 bg-teal-500/20 text-teal-400 rounded-3xl shadow-2xl">{magicContent?.type === 'video' ? <Video className="w-10 h-10" /> : <Mic className="w-10 h-10" />}</div>
                   <div>
                      <h3 className="font-black text-white uppercase text-2xl tracking-[0.3em]">{isMagicLoading ? 'CREATING MAGIC...' : magicContent?.type === 'video' ? 'Video Movement' : 'Viral Sales Naskah'}</h3>
                      <p className="text-[11px] text-teal-500/50 font-black uppercase mt-3 tracking-[0.5em]">2025 High-Conversion AI Engine</p>
                   </div>
                </div>
                {magicContent?.type === 'voice' && !isMagicLoading && (
                  <div className="flex items-center gap-5 bg-slate-900/95 p-4 rounded-[2rem] border-2 border-gray-800 shadow-3xl">
                    <select value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)} className="bg-transparent text-white text-xs font-black px-6 outline-none border-r-2 border-gray-800 mr-4 uppercase tracking-widest">
                      {voiceOptions.map(v => <option key={v.id} value={v.id} className="bg-slate-900">{v.label}</option>)}
                    </select>
                    <button onClick={handlePlayVoice} className={`p-5 rounded-2xl transition-all ${isPlaying ? 'bg-red-500 animate-pulse shadow-red-500/40' : 'bg-teal-500 shadow-teal-500/40'} shadow-2xl`}>{isPlaying ? <Pause className="w-7 h-7 text-white" /> : <Play className="w-7 h-7 text-white" />}</button>
                    {lastBase64Audio && (
                      <button onClick={handleDownloadVoice} className="p-5 bg-gray-800 hover:bg-gray-700 rounded-2xl text-white transition-all shadow-2xl" title="Unduh WAV">
                        <Download className="w-7 h-7" />
                      </button>
                    )}
                  </div>
                )}
             </div>
             <div className="bg-black/50 p-12 rounded-[3rem] border border-gray-800 min-h-[200px] flex items-center relative overflow-hidden backdrop-blur-xl">
                {isMagicLoading ? (
                    <div className="mx-auto flex flex-col items-center gap-8">
                        <Loader2 className="w-20 h-20 text-teal-500 animate-spin" />
                        <span className="text-[12px] text-gray-600 font-black uppercase tracking-[0.6em] animate-pulse text-center">Analisa Visual Produk...</span>
                    </div>
                ) : (
                    <div className="w-full">
                        {isPlaying && (
                             <div className="flex gap-2 items-end h-16 mb-12 mx-auto w-fit">
                                {[...Array(25)].map((_, i) => (
                                    <div key={i} className="w-2 bg-teal-500 rounded-full animate-bounce shadow-xl shadow-teal-500/20" style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 0.05}s` }} />
                                ))}
                            </div>
                        )}
                        <p className="text-gray-100 text-xl leading-[2] whitespace-pre-wrap font-mono tracking-tight text-center sm:text-left">{magicContent?.text}</p>
                    </div>
                )}
             </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default MainContent;
