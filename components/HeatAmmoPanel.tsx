
import React from 'react';
import { GlobalInfo } from '../types';

interface HeatAmmoPanelProps {
  data: GlobalInfo;
  lang: 'en' | 'zh';
}

const HeatAmmoPanel: React.FC<HeatAmmoPanelProps> = ({ data, lang }) => {
  const self = data.robots[data.selfId];
  if (!self) return null;

  const heatPercent = Math.min(100, (self.heat / self.maxHeat) * 100);
  const isOverheated = self.heat > self.maxHeat * 0.9;

  return (
    <div className="absolute top-1/2 right-12 transform -translate-y-1/2 flex flex-col items-end space-y-8 pointer-events-none select-none z-10">
      {/* Heat Section */}
      <div className="flex flex-col items-end">
        <div className="flex items-baseline gap-4 mb-2">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest self-center">{lang === 'en' ? 'BARREL HEAT' : '枪口热量'}</span>
            <span className={`text-6xl font-black font-mono leading-none drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] ${isOverheated ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                {Math.floor(self.heat)}
            </span>
            <span className="text-xl font-bold text-gray-500">/ {self.maxHeat}</span>
        </div>
        {/* Heat Bar */}
        <div className="w-80 h-4 bg-gray-900/80 rounded-full overflow-hidden border border-gray-600 shadow-lg">
            <div 
                className={`h-full transition-all duration-200 ${isOverheated ? 'bg-red-600' : 'bg-orange-500'}`}
                style={{ width: `${heatPercent}%` }}
            />
        </div>
      </div>

      {/* Ammo Section */}
      <div className="flex flex-col items-end">
        <div className="flex items-baseline gap-4">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest self-center">{lang === 'en' ? 'PROJECTILES' : '弹丸数量'}</span>
            <span className={`text-7xl font-black font-mono leading-none drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] ${self.ammo < 20 ? 'text-red-500' : 'text-cyan-400'}`}>
                {self.ammo}
            </span>
        </div>
      </div>
    </div>
  );
};

export default HeatAmmoPanel;