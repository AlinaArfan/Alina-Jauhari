
import React, { useState } from 'react';
import { X, BookOpen, ShoppingBag, Megaphone, Wand2, Users, Palette, Video, Mic, RefreshCw, Smartphone } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const sections = [
    {
      title: "Commercial Hub (Foto Produk)",
      icon: ShoppingBag,
      color: "text-blue-600",
      content: [
        { subtitle: "Product Shot", text: "Ubah foto produk biasa menjadi foto studio profesional dengan latar belakang mewah." },
        { subtitle: "AI Fashion", text: "Upload foto pakaian, AI akan membuat model manusia realistis yang memakainya." },
        { subtitle: "Mockup", text: "Tempelkan desain logo atau stiker ke permukaan benda nyata dengan perspektif 3D." }
      ]
    },
    {
      title: "UGC Studio (Testimoni Asli)",
      icon: Smartphone,
      color: "text-green-600",
      content: [
        { subtitle: "Selfie Review", text: "Membuat foto orang asli yang sedang selfie memegang produk Anda untuk social proof." },
        { subtitle: "POV Hand", text: "Tampilan sudut pandang mata sendiri (tangan saja) untuk kesan unboxing yang personal." },
        { subtitle: "Unboxing Exp", text: "Foto produk di lingkungan natural seolah-olah kiriman baru sampai di tangan pelanggan." }
      ]
    },
    {
      title: "Ads Studio (Pembuat Iklan)",
      icon: Megaphone,
      color: "text-orange-600",
      content: [
        { subtitle: "Web Banner", text: "Membuat banner lebar untuk header Shopee/Tokopedia." },
        { subtitle: "YouTube Thumbnail", text: "Membuat cover video yang kontras dan menarik perhatian." },
        { subtitle: "Social Feed", text: "Membuat konten Instagram/TikTok feeds yang estetik." }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-up border border-gray-200">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center space-x-3">
             <div className="p-2 bg-teal-100 text-teal-600 rounded-lg">
                <BookOpen className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-xl font-bold text-gray-800">Panduan Magic Picture</h2>
                <p className="text-sm text-gray-500">Tutorial lengkap Magic Picture Studio Suite</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-white space-y-8">
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-6 rounded-2xl border border-teal-100">
                <h3 className="font-bold text-teal-800 mb-2">👋 Selamat Datang di Magic Picture!</h3>
                <p className="text-sm text-teal-700 leading-relaxed">
                    Aplikasi ini dirancang khusus untuk mempermudah <b>Affiliate Marketer</b> membuat konten berkualitas tinggi dalam hitungan detik.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map((section, idx) => (
                    <div key={idx} className="border border-gray-100 rounded-2xl p-5 bg-gray-50/50">
                        <div className={`flex items-center space-x-3 mb-4 pb-3 border-b border-gray-100 ${section.color}`}>
                            <section.icon className="w-6 h-6" />
                            <h3 className="font-bold text-lg">{section.title}</h3>
                        </div>
                        <ul className="space-y-4">
                            {section.content.map((item, i) => (
                                <li key={i} className="text-sm">
                                    <span className="font-bold text-gray-800 block mb-1">• {item.subtitle}</span>
                                    <span className="text-gray-500 leading-relaxed">{item.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 text-center text-xs text-gray-400">
            Magic Picture Studio © 2025
        </div>

      </div>
    </div>
  );
};

export default TutorialModal;
