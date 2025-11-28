import React from 'react';
import { GlobalInfo } from '../types';

interface SelfStatusPanelProps {
  data: GlobalInfo;
  isDraggable: boolean;
  lang: 'en' | 'zh';
}

const ModuleIndicator: React.FC<{ label: string; status: boolean }> = ({ label, status }) => (
    <div className={`flex items-center justify-between px-2 h-[28px] rounded border transition-all duration-300 ${status ? 'bg-green-950/30 border-green-500/30 text-green-400' : 'bg-red-950/50 border-red-500/60 text-red-400 animate-pulse shadow-[inset_0_0_10px_rgba(239,68,68,0.2)]'}`}>
        <span className="text-xs font-bold font-mono tracking-tight">{label}</span>
        <div className={`w-2 h-2 rounded-full ${status ? 'bg-green-400 shadow-[0_0_6px_#4ade80]' : 'bg-red-500 shadow-[0_0_6px_#ef4444]'}`}></div>
    </div>
);

const SelfStatusPanel: React.FC<SelfStatusPanelProps> = ({ data, isDraggable, lang }) => {
  const self = data.robots[data.selfId];

  if (!self) return null;

  const hpPercent = Math.min(100, (self.hp / self.maxHp) * 100);
  const bufferPercent = Math.min(100, (self.bufferEnergy / 60) * 100);
  const chassisEnergyPercent = Math.min(100, (self.chassisEnergy / self.maxChassisEnergy) * 100);
  
  const currentHp = Math.floor(self.hp);
  const currentPower = self.power.toFixed(1);
  const displayId = self.id > 100 ? self.id - 100 : self.id;
  const isRed = self.id < 100;
  const idColor = isRed ? 'text-red-500' : 'text-blue-500';

  const getModuleLabel = (key: string, lang: 'en' | 'zh') => {
      const labels: Record<string, { en: string, zh: string }> = {
          power_manager: { en: 'PM', zh: '电源' },
          rfid: { en: 'RF', zh: 'RFID' },
          light_strip: { en: 'LIT', zh: '灯条' },
          small_shooter: { en: 'S17', zh: '17mm' },
          big_shooter: { en: 'S42', zh: '42mm' },
          uwb: { en: 'UWB', zh: '定位' },
          armor: { en: 'ARM', zh: '装甲' },
          video_transmission: { en: 'VTM', zh: '图传' },
          capacitor: { en: 'CAP', zh: '电容' },
          main_controller: { en: 'MC', zh: '主控' }
      };
      return lang === 'en' ? labels[key]?.en : labels[key]?.zh;
  };

  return (
    <div 
        className={`flex flex-row h-[160px] items-end pointer-events-auto gap-2 ${isDraggable ? 'border-2 border-dashed border-yellow-400' : ''}`}
    >
        {/* Main Status Box (Left) - Increased width for larger fonts */}
        <div className="w-[360px] h-full bg-black/20 backdrop-blur-md rounded border border-gray-600 p-3 text-white shadow-2xl flex flex-col justify-between overflow-hidden">
            
            {/* Header: ID, Level, Status, HP */}
            <div className="flex justify-between items-end mb-1 h-10">
                <div className="flex items-baseline gap-2">
                    <span className={`text-5xl font-black italic ${idColor} leading-none`}>
                        {displayId}
                    </span>
                    <span className="text-5xl font-bold text-yellow-400 font-mono leading-none">
                        Lv.{self.level}
                    </span>
                    <div className={`ml-1 px-2 py-0.5 rounded text-xs font-black uppercase tracking-wider self-center ${self.combatState ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 'bg-green-500/20 text-green-400 border border-green-500/50'}`}>
                        {self.combatState ? (lang === 'en' ? 'COMBAT' : '战斗中') : (lang === 'en' ? 'SAFE' : '脱战')}
                    </div>
                </div>
                <div className="flex items-baseline">
                    <span className="text-3xl font-bold font-mono leading-none tracking-tighter text-white">{currentHp}</span>
                    <span className="text-sm text-gray-500 font-mono ml-1 font-bold">/ {self.maxHp}</span>
                </div>
            </div>

            {/* HP Bar - Slightly Taller */}
            <div className="w-full h-2.5 bg-gray-900/50 rounded-sm overflow-hidden border border-gray-600 relative group mb-2">
                <div className="absolute inset-0 z-10" style={{ backgroundImage: 'linear-gradient(90deg, transparent 90%, rgba(0,0,0,0.8) 90%)', backgroundSize: '10% 100%' }}></div>
                <div 
                    className={`h-full transition-all duration-300 ${hpPercent < 30 ? 'bg-red-600 animate-pulse' : 'bg-gradient-to-r from-green-600 to-green-400'}`}
                    style={{ width: `${hpPercent}%` }}
                />
            </div>

            {/* Power & Energy Section */}
            <div className="flex-1 bg-black/20 rounded p-2 flex flex-col justify-end space-y-1.5">
                
                {/* Real-time Power */}
                <div className="flex justify-between items-end">
                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-0.5">{lang === 'en' ? 'CHASSIS PWR' : '底盘功率'}</span>
                    <span className="font-mono text-2xl font-black text-yellow-400 leading-none">{currentPower} <span className="text-sm text-gray-500">W</span></span>
                </div>
                
                {/* Buffer Energy */}
                <div>
                    <div className="flex justify-between text-[10px] text-gray-500 mb-px font-bold uppercase leading-none">
                        <span>{lang === 'en' ? 'Buffer' : '缓冲能量'}</span>
                        <span className={`${self.bufferEnergy < 10 ? 'text-red-500' : 'text-gray-400'}`}>{Math.floor(self.bufferEnergy)} J</span>
                    </div>
                    <div className="w-full h-2 bg-gray-900/50 rounded overflow-hidden">
                            <div 
                            className={`h-full transition-all duration-100 ${bufferPercent < 20 ? 'bg-red-500' : 'bg-yellow-500'}`}
                            style={{ width: `${bufferPercent}%` }}
                        />
                    </div>
                </div>

                {/* Chassis Output Energy */}
                <div>
                    <div className="flex justify-between text-[10px] text-gray-500 mb-px font-bold uppercase leading-none">
                        <span>{lang === 'en' ? 'Energy' : '底盘能量'}</span>
                        <span>{Math.floor(self.chassisEnergy)}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-900/50 rounded overflow-hidden border border-gray-600/30">
                            <div 
                            className="h-full bg-gradient-to-r from-blue-600 to-purple-500 transition-all duration-500"
                            style={{ width: `${chassisEnergyPercent}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Modules Box (Right) - 5 Columns, Adjusted Width for larger text */}
        <div className="w-[440px] bg-black/20 backdrop-blur-md rounded border border-gray-600 p-2 grid grid-cols-5 gap-2 shadow-2xl">
            <ModuleIndicator label={getModuleLabel('power_manager', lang)} status={self.modules.power_manager} />
            <ModuleIndicator label={getModuleLabel('rfid', lang)} status={self.modules.rfid} />
            <ModuleIndicator label={getModuleLabel('light_strip', lang)} status={self.modules.light_strip} />
            <ModuleIndicator label={getModuleLabel('small_shooter', lang)} status={self.modules.small_shooter} />
            <ModuleIndicator label={getModuleLabel('big_shooter', lang)} status={self.modules.big_shooter} />
            <ModuleIndicator label={getModuleLabel('uwb', lang)} status={self.modules.uwb} />
            <ModuleIndicator label={getModuleLabel('armor', lang)} status={self.modules.armor} />
            <ModuleIndicator label={getModuleLabel('video_transmission', lang)} status={self.modules.video_transmission} />
            <ModuleIndicator label={getModuleLabel('capacitor', lang)} status={self.modules.capacitor} />
            <ModuleIndicator label={getModuleLabel('main_controller', lang)} status={self.modules.main_controller} />
        </div>
    </div>
  );
};

export default SelfStatusPanel;