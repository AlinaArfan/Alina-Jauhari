
import React from 'react';
import { 
  Home, Wand2, ShoppingBag, Megaphone, Users, Smartphone, Sparkles, Search, Mic2, BookOpen, PenTool, GraduationCap
} from 'lucide-react';
import { NavItem } from '../types';

interface SidebarProps {
  activeItem: NavItem;
  setActiveItem: (item: NavItem) => void;
  isOpen: boolean;
  onOpenTutorial: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, setActiveItem, isOpen, onOpenTutorial }) => {
  const menuItems = [
    { id: NavItem.HOME, label: 'Dashboard', icon: Home },
    { id: NavItem.COMMERCIAL, label: 'Commercial Hub', icon: ShoppingBag },
    { id: NavItem.UGC, label: 'UGC Studio', icon: Smartphone },
    { id: NavItem.ADS, label: 'Ads Studio', icon: Megaphone },
    { id: NavItem.HUMAN, label: 'Human Studio', icon: Users },
    { id: NavItem.MAGIC, label: 'Magic Tools', icon: Sparkles },
    { id: NavItem.COPYWRITER, label: 'Marketing Lab', icon: PenTool },
    { id: NavItem.SEO, label: 'Market Trends', icon: Search },
    { id: NavItem.LIVE, label: 'Live Assistant', icon: Mic2 },
    { id: NavItem.LEARNING, label: 'Edu Center', icon: GraduationCap },
  ];

  return (
    <div className={`
      fixed inset-y-0 left-0 z-30 w-72 bg-[#0B1723] text-gray-300 transition-transform duration-300 transform 
      ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
      lg:translate-x-0 lg:static lg:inset-auto flex flex-col h-full border-r border-gray-800
    `}>
      <div className="p-8 flex items-center space-x-4">
        <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-teal-500/40 rotate-3">
            <Wand2 className="text-white w-7 h-7" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white leading-tight tracking-tight">Magic Picture</h1>
          <p className="text-[10px] text-teal-500 font-black uppercase tracking-[0.2em]">Affiliate Engine</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar py-6 px-4 space-y-1">
        <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-4 mb-2 block">Studio Suite</label>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              className={`
                w-full flex items-center space-x-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group
                ${isActive 
                  ? 'bg-teal-500/10 text-teal-400 border-l-4 border-teal-500 shadow-xl' 
                  : 'hover:bg-gray-800/50 text-gray-500 hover:text-white border-l-4 border-transparent'}
              `}
            >
              <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-teal-400' : 'text-gray-600'}`} />
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
            </button>
          );
        })}
        
        <div className="pt-6 px-2">
             <button
                onClick={onOpenTutorial}
                className="w-full flex items-center justify-between px-5 py-4 rounded-3xl bg-teal-500/10 text-teal-500 border border-teal-500/20 font-black text-[10px] uppercase tracking-widest hover:bg-teal-500 hover:text-white transition-all"
             >
                <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4" />
                    <span>Quick Guide</span>
                </div>
                <Sparkles className="w-3 h-3 animate-pulse" />
             </button>
        </div>
      </div>
      
      <div className="p-6 border-t border-gray-800 bg-[#08111a]">
        <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white font-black shadow-lg">A</div>
            <div>
                <p className="text-xs font-black text-white uppercase tracking-tight">Affiliate v2.5</p>
                <p className="text-[10px] text-teal-500 uppercase font-black tracking-widest">Flash Engine</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
