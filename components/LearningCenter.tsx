
import React from 'react';
import { 
  Lightbulb, ShieldCheck, Target, Zap, Search, MessageSquare, 
  Image as ImageIcon, BookOpen, AlertCircle, Sparkles, CheckCircle2,
  FileDown, Printer
} from 'lucide-react';

const LearningCenter: React.FC = () => {
  const coreLogics = [
    {
      title: "High Fidelity Image Engine",
      icon: ShieldCheck,
      color: "text-blue-500",
      desc: "Bagaimana cara menjaga produk (seperti topi tradisional) tidak distorsi?",
      points: [
        "Geometric Integrity: AI dipaksa mengenali sudut kaku pada aksesoris kepala.",
        "Pattern Preservation: Algoritma menjaga motif Batik/Songket agar tidak 'leleh'.",
        "Multi-View Analysis: Menggunakan 4 foto sekaligus untuk membangun model 3D di memori AI."
      ]
    },
    {
      title: "Real-time Search Grounding",
      icon: Search,
      color: "text-orange-500",
      desc: "Menghubungkan AI dengan internet secara langsung.",
      points: [
        "Google Search Integration: Mengambil tren harga dan viralitas saat ini.",
        "Citing Sources: Memberikan link referensi asli untuk validasi data pemasaran.",
        "Trend Mapping: Mengidentifikasi kata kunci yang sedang naik di TikTok/Instagram."
      ]
    },
    {
      title: "Marketing Copy Logic",
      icon: MessageSquare,
      color: "text-teal-500",
      desc: "Kenapa teks yang dihasilkan sangat persuasif?",
      points: [
        "Visual Recognition: AI memindai foto produk untuk mencari keunggulan fisik.",
        "Audience Persona: Menyesuaikan gaya bahasa (Slang, Formal, atau Emosional).",
        "CTA Optimization: Menempatkan 'Call to Action' di waktu yang tepat."
      ]
    }
  ];

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-100">
            <Sparkles size={14} /> Master the Platform
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Edu Center: Cara Kerja AI</h1>
        </div>
        
        <button 
          onClick={handleDownloadPDF}
          className="no-print flex items-center gap-4 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 transition-all shadow-xl hover:scale-105 active:scale-95"
        >
          <FileDown size={18} />
          Simpan Sebagai PDF
        </button>
      </div>

      <p className="text-slate-500 max-w-2xl text-lg text-center md:text-left">Pelajari teknologi di balik Magic Picture untuk memaksimalkan hasil konten afiliasi Anda.</p>

      {/* Main Logics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {coreLogics.map((logic, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 hover:border-teal-400 transition-all group">
            <div className={`p-5 rounded-2xl mb-6 bg-gray-50 group-hover:scale-110 transition-transform inline-block ${logic.color}`}>
              <logic.icon size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-4">{logic.title}</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed italic">"{logic.desc}"</p>
            <ul className="space-y-4">
              {logic.points.map((p, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                  <CheckCircle2 size={16} className="text-teal-500 mt-0.5 shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Pro Tips Section */}
      <div className="bg-slate-900 rounded-[3rem] p-12 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
            <Lightbulb size={180} />
        </div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-black flex items-center gap-4">
              <AlertCircle className="text-teal-400" />
              Tips Khusus Produk Rumit
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Jika Anda menggenerate produk dengan geometri spesifik (seperti Topi Tradisional Minang atau Perhiasan Detil):
            </p>
            <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="p-3 bg-teal-500 rounded-xl h-fit font-black">1</div>
                <p className="text-sm"><span className="font-bold text-teal-400">Gunakan Mode 4K:</span> Detail mikro hanya bisa diproses sempurna pada resolusi tinggi agar tidak terjadi 'halusinasi visual'.</p>
              </div>
              <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="p-3 bg-teal-500 rounded-xl h-fit font-black">2</div>
                <p className="text-sm"><span className="font-bold text-teal-400">Upload Minimal 3 Sudut:</span> Berikan AI pandangan dari Depan, Samping, dan Atas agar ia paham struktur 3D produk Anda.</p>
              </div>
            </div>
          </div>
          <div className="bg-teal-500/10 p-8 rounded-[2rem] border border-teal-500/20 backdrop-blur-md">
            <h4 className="font-black text-teal-400 mb-4 uppercase tracking-widest text-xs">Behind The Prompt</h4>
            <code className="text-[11px] text-teal-200 block bg-black/40 p-6 rounded-xl leading-relaxed">
              {"// Logic yang dikirim ke Gemini:"}<br/>
              {"TASK: ABSOLUTE FIDELITY RECONSTRUCTION"}<br/>
              {"- Preserve Geometric Angles: High"}<br/>
              {"- Texture Consistency: 100%"}<br/>
              {"- Zero Hallucination on Product Shape"}
            </code>
          </div>
        </div>
      </div>

      <div className="no-print text-center pt-10">
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Magic Picture Affiliate Suite © 2025</p>
      </div>
    </div>
  );
};

export default LearningCenter;
