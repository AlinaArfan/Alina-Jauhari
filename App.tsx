
import React, { useState } from 'react';
import Sidebar from './components/Sidebar.tsx';
import MainContent from './components/MainContent.tsx';
import TutorialModal from './components/TutorialModal.tsx';
import { NavItem } from './types.ts';
import { Menu, X } from 'lucide-react';

const App: React.FC = () => {
  const [activeItem, setActiveItem] = useState<NavItem>(NavItem.HOME);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      
      {/* Mobile Menu Toggle */}
      <button 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-xl shadow-sm text-gray-700 border border-gray-100"
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <Sidebar 
        activeItem={activeItem} 
        setActiveItem={(item) => {
          setActiveItem(item);
          setIsMobileMenuOpen(false);
        }}
        isOpen={isMobileMenuOpen}
        onOpenTutorial={() => setIsTutorialOpen(true)}
      />

      {/* Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <MainContent activeItem={activeItem} setActiveItem={setActiveItem} />

      {/* Global Tutorial */}
      <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
    </div>
  );
};

export default App;
