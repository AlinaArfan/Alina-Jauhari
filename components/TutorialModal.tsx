
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
        { subtitle: "Product Shot", text: "Ubah foto produk biasa (di meja/lantai) menjadi foto studio profesional. AI akan mengganti latar belakang sesuai deskripsi Anda." },
        { subtitle: "AI Fashion", text: "Upload foto pakaian (flat lay atau mannequin), AI akan membuat model manusia realistis yang memakainya." },
        { subtitle: "Mockup", text: "Tempelkan desain logo atau stiker ke permukaan benda nyata (mug, dinding, kemasan) agar terlihat menyatu." }
      ]
    },
    {
      title: "UGC Studio (Testimoni Asli)",
      icon: Smartphone,
      color: "text-green-600",
      content: [
        { subtitle: "Selfie Review", text: "Membuat foto orang asli yang sedang selfie memegang produk Anda. Meningkatkan kepercayaan (Social Proof)." },
        { subtitle: "POV Hand", text: "Tampilan dari sudut pandang mata kita sendiri (First Person). HANYA menampilkan tangan yang memegang produk tanpa memperlihatkan wajah." },
        { subtitle: "Unboxing Exp", text: "Foto produk di lingkungan natural atau sedang dibuka dari kemasan agar terlihat seperti kiriman pelanggan asli." }
      ]
    },
    {
      title: "Ads Studio (Pembuat Iklan)",
      icon: Megaphone,
      color: "text-orange-600",
      content: [
        { subtitle: "Web Banner", text: "Membuat banner lebar untuk header website atau toko online (Shopee/Tokopedia)." },
        { subtitle: "YouTube Thumbnail", text: "Membuat cover video yang kontras dan menarik perhatian (Click-bait style)." },
        { subtitle: "Social Feed", text: "Membuat konten Instagram/TikTok feeds yang estetik." }
      ]
    },
    {
      title: "Magic Tools & Face Swap",
      icon: Wand2,
      color: "text-purple-600",
      content: [
        { subtitle: "Face Swap", text: "Ganti wajah pada foto target dengan wajah sumber yang Anda upload. Cocok untuk personal branding tanpa foto studio sendiri." }
      ]
    },
    {
      title: "Human Studio (Model AI)",
      icon: Users,
      color: "text-pink-600",
      content: [
        { subtitle: "AI Model", text: "Membuat karakter model dari nol (pilih ras, umur, gaya rambut)." },
        { subtitle: "Professional", text: "Membuat foto profil formal untuk LinkedIn atau CV." }
      ]
    },
    {
      title: "Voice Over Lab",
      icon: Mic,
      color: "text-teal-600",
      content: [
        { subtitle: "Analysis-Based Script", text: "AI akan memindai foto produk Anda dan membuat naskah jualan yang akurat sesuai barangnya." },
        { subtitle: "TTS & Download", text: "Ubah naskah menjadi suara AI (Pria/Wanita) dan download hasilnya sebagai file .wav untuk konten video Anda." }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-up border border-gray-200">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center space-x-3">
             <div className="p-2 bg-teal-100 text-teal-600 rounded-lg">
                <BookOpen className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-xl font-bold text-gray-800">Panduan Pengguna</h2>
                <p className="text-sm text-gray-500">Tutorial lengkap Magic Picture Affiliate Suite</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-white space-y-8">
            
            {/* Intro */}
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-6 rounded-2xl border border-teal-100">
                <h3 className="font-bold text-teal-800 mb-2">👋 Selamat Datang!</h3>
                <p className="text-sm text-teal-700 leading-relaxed">
                    Aplikasi ini dirancang khusus untuk <b>Affiliate Marketer</b>. Anda bisa membuat foto produk, model baju, hingga naskah jualan otomatis hanya dengan upload foto mentah.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map((section, idx) => (
                    <div key={idx} className="border border-gray-100 rounded-2xl p-5 hover:shadow-lg transition-shadow bg-gray-50/50">
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

            {/* Tips Section */}
            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 flex items-start space-x-4">
                <div className="p-2 bg-white rounded-full shadow-sm text-orange-500">
                    <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-bold text-orange-800 text-sm mb-1">Tips Pro: Batch Mode</h4>
                    <p className="text-xs text-orange-700 leading-relaxed">
                        Aktifkan tombol <b>"Batch Mode"</b> di bagian bawah. AI akan langsung membuat 6 variasi sudut pandang (Depan, Samping, Close-up, dll) sekaligus dalam satu kali klik.
                    </p>
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 text-center text-xs text-gray-400">
            Panduan ini dapat diakses kapan saja melalui menu di sidebar kiri.
        </div>

      </div>
    </div>
  );
};

export default TutorialModal;
