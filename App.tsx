
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import TutorialModal from './components/TutorialModal';
import { NavItem } from './types';
import { Menu, X } from 'lucide-react';

const App: React.FC = () => {
  const [activeItem, setActiveItem] = useState<NavItem>(NavItem.HOME);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

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
