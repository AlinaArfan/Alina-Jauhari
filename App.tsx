
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import TutorialModal from './components/TutorialModal';
import { NavItem } from './types';
import { Menu, X, Key, ShieldCheck, ExternalLink, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [activeItem, setActiveItem] = useState<NavItem>(NavItem.HOME);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        // Fallback jika tidak di lingkungan AI Studio
        setHasKey(true);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      // Asumsikan sukses sesuai instruksi (mitigasi race condition)
      setHasKey(true);
    }
  };

  if (hasKey === null) return null;

  if (!hasKey) {
    return (
      <div className="min-h-screen bg-[#0B1723] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-3xl text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-teal-500 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-teal-500/40">
            <Key className="w-12 h-12" />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Akses AI Pro</h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Untuk menggunakan fitur <b>Image Pro (2K/4K)</b>, Anda perlu memilih API Key dari proyek Google Cloud yang memiliki penagihan aktif (Paid Project).
            </p>
          </div>
          
          <div className="space-y-4">
            <button 
              onClick={handleSelectKey}
              className="w-full py-5 bg-teal-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-teal-500/30 hover:bg-teal-600 transition-all flex items-center justify-center gap-3"
            >
              <ShieldCheck className="w-5 h-5" />
              Pilih API Key
            </button>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:text-teal-600 transition-colors"
            >
              Cek Dokumentasi Billing <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          
          <div className="pt-6 border-t border-gray-100 flex items-center justify-center gap-3">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg"><Sparkles className="w-4 h-4" /></div>
            <span className="text-[10px] text-slate-400 font-black uppercase">Powered by Gemini 3 Pro</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <button 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-xl shadow-sm text-gray-700 border border-gray-100"
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <Sidebar 
        activeItem={activeItem} 
        setActiveItem={(item) => {
          setActiveItem(item);
          setIsMobileMenuOpen(false);
        }}
        isOpen={isMobileMenuOpen}
        onOpenTutorial={() => setIsTutorialOpen(true)}
      />

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <MainContent activeItem={activeItem} setActiveItem={setActiveItem} />

      <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
    </div>
  );
};

export default App;
