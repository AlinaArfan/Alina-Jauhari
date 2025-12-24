
import React from 'react';
import { 
  Home, Wand2, ShoppingBag, Megaphone, Users, Palette, UserSquare2, BookOpen, Smartphone
} from 'lucide-react';
import { NavItem } from '../types';

interface SidebarProps {
  activeItem: NavItem;
  setActiveItem: (item: NavItem) => void;
  isOpen: boolean;
  onOpenTutorial: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, setActiveItem, isOpen, onOpenTutorial }) => {
  const menuGroups = [
    {
      title: "",
      items: [
        { id: NavItem.HOME, label: 'Dashboard', icon: Home },
      ]
    },
    {
      title: "AFFILIATE PRO",
      items: [
        { id: NavItem.COMMERCIAL_HUB, label: 'Commercial Hub', icon: ShoppingBag, badge: "Hot" },
        { id: NavItem.ADS_STUDIO, label: 'Ads Studio', icon: Megaphone },
        { id: NavItem.UGC_STUDIO, label: 'UGC Studio', icon: Smartphone, badge: "New" },
      ]
    },
    {
      title: "MAGIC TOOLS",
      items: [
        { id: NavItem.MAGIC_TOOLS, label: 'Magic Editor', icon: Wand2 },
        { id: NavItem.FACESWAP, label: 'Face Swap', icon: UserSquare2 },
      ]
    },
    {
      title: "CREATIVE AI",
      items: [
        { id: NavItem.HUMAN_STUDIO, label: 'Human Studio', icon: Users },
        { id: NavItem.CREATIVE_LAB, label: 'Creative Lab', icon: Palette },
      ]
    }
  ];

  return (
    <div className={`
      fixed inset-y-0 left-0 z-30 w-64 bg-[#0B1723] text-gray-300 transition-transform duration-300 transform 
      ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
      lg:translate-x-0 lg:static lg:inset-auto flex flex-col h-full border-r border-gray-800
    `}>
      {/* Header */}
      <div className="p-6 flex items-center space-x-3">
        <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-teal-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Wand2 className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Magic Picture</h1>
          <p className="text-xs text-teal-400 font-medium">Affiliate Suite</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-6">
        {menuGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            {group.title && (
              <h3 className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                {group.title}
              </h3>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeItem === item.id;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveItem(item.id)}
                      className={`
                        w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group
                        ${isActive 
                          ? 'bg-gradient-to-r from-teal-900/50 to-transparent text-teal-400 border-l-4 border-teal-500 shadow-inner' 
                          : 'hover:bg-gray-800 text-gray-400 hover:text-white border-l-4 border-transparent'}
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-5 h-5 ${isActive ? 'text-teal-400' : 'text-gray-500 group-hover:text-white'}`} />
                        <span className="font-medium text-sm">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        
        {/* Tutorial Button */}
        <div className="px-3 mt-4">
             <button
                onClick={onOpenTutorial}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-900/50 to-blue-900/50 border border-indigo-500/30 text-indigo-300 hover:text-white hover:border-indigo-400 transition-all group"
             >
                <BookOpen className="w-5 h-5 text-indigo-400 group-hover:text-white" />
                <span className="font-medium text-sm">Panduan / Tutorial</span>
             </button>
        </div>

      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-800 bg-[#08111a]">
        <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white font-bold shadow-md">
                A
            </div>
            <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">Affiliate Pro</p>
                <p className="text-xs text-gray-500 truncate">Plan: Unlimited</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
