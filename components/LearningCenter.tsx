
import React from 'react';
import { 
  Lightbulb, ShieldCheck, Target, Zap, Search, MessageSquare, 
  Image as ImageIcon, BookOpen, AlertCircle, Sparkles, CheckCircle2,
  FileDown, Printer
} from 'lucide-react';

const LearningCenter: React.FC = () => {
  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-100">
            <Sparkles size={14} /> Master the Platform
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Magic Picture Edu Center</h1>
        </div>
        
        <button 
          onClick={handleDownloadPDF}
          className="no-print flex items-center gap-4 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 transition-all shadow-xl hover:scale-105 active:scale-95"
        >
          <FileDown size={18} />
          Simpan Panduan PDF
        </button>
      </div>

      <p className="text-slate-500 max-w-2xl text-lg text-center md:text-left">Pelajari teknologi di balik Magic Picture Studio untuk memaksimalkan hasil konten afiliasi Anda.</p>

      <div className="bg-slate-900 rounded-[3rem] p-12 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
            <Lightbulb size={180} />
        </div>
        <div className="relative z-10 space-y-8">
           <h2 className="text-3xl font-black flex items-center gap-4">
              <AlertCircle className="text-teal-400" />
              Teknologi Fidelity Engine
            </h2>
            <p className="text-slate-400 leading-relaxed max-w-3xl">
              Magic Picture menggunakan algoritma rekonstruksi visual yang menjaga bentuk asli produk Anda. Pastikan Anda mengunggah minimal 3 sudut foto produk untuk hasil yang sempurna tanpa distorsi.
            </p>
            <div className="bg-teal-500/10 p-8 rounded-[2rem] border border-teal-500/20 backdrop-blur-md">
            <h4 className="font-black text-teal-400 mb-4 uppercase tracking-widest text-xs">Magic Picture Logic</h4>
            <code className="text-[11px] text-teal-200 block bg-black/40 p-6 rounded-xl leading-relaxed">
              {"// High-Accuracy Prompting:"}<br/>
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
