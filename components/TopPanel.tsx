import React from 'react';
import { GlobalInfo, BaseStatus, OutpostStatus } from '../types';

interface TopPanelProps {
  data: GlobalInfo;
  isDraggable: boolean;
  lang: 'en' | 'zh';
}

const getRobotName = (id: number, lang: 'en' | 'zh') => {
  const normId = id > 100 ? id - 100 : id;
  switch (normId) {
    case 1: return lang === 'en' ? 'Hero' : '英雄';
    case 2: return lang === 'en' ? 'Eng' : '工程';
    case 3: 
    case 4: 
    case 5: return lang === 'en' ? 'Inf' : '步兵';
    case 6: return lang === 'en' ? 'Air' : '空中';
    case 7: return lang === 'en' ? 'Sen' : '哨兵';
    case 8: return lang === 'en' ? 'Dart' : '飞镖';
    case 9: return lang === 'en' ? 'Rad' : '雷达';
    case 10: return lang === 'en' ? 'Outpost' : '前哨站';
    case 11: return lang === 'en' ? 'Base' : '基地';
    default: return '';
  }
};

const getBaseStatusText = (status: BaseStatus | undefined, lang: 'en' | 'zh') => {
    switch (status) {
        case BaseStatus.Invincible: return lang === 'en' ? 'INVINCIBLE' : '无敌';
        case BaseStatus.VulnerableClosed: return lang === 'en' ? 'SHIELDED' : '护甲未开';
        case BaseStatus.VulnerableOpen: return lang === 'en' ? 'EXPOSED' : '护甲展开';
        default: return '';
    }
};

const getOutpostStatusText = (status: OutpostStatus | undefined, lang: 'en' | 'zh') => {
    switch (status) {
        case OutpostStatus.Invincible: return lang === 'en' ? 'INVINCIBLE' : '无敌';
        case OutpostStatus.Rotating: return lang === 'en' ? 'ROTATING' : '装甲旋转';
        case OutpostStatus.Stopped: return lang === 'en' ? 'STOPPED' : '装甲停转';
        case OutpostStatus.Destroyed: return lang === 'en' ? 'DESTROYED' : '被击毁';
        case OutpostStatus.Rebuildable: return lang === 'en' ? 'REBUILD' : '可重建';
        default: return '';
    }
};

const filterRobots = (robots: GlobalInfo['robots'], team: 'red' | 'blue') => {
  return Object.values(robots).filter(r => {
    // Filter out ID 5 and 105
    if (r.id === 5 || r.id === 105) return false;
    // Check team based on ID range
    const isRed = r.id < 100;
    return team === 'red' ? isRed : !isRed;
  }).sort((a, b) => {
    // Normalize IDs for sorting
    const idA = a.id > 100 ? a.id - 100 : a.id;
    const idB = b.id > 100 ? b.id - 100 : b.id;
    return idA - idB;
  });
};

const HealthBar: React.FC<{
  hp: number;
  max: number;
  level: number;
  color: string;
  id: number;
  lang: 'en' | 'zh';
  isBuilding?: boolean;
  baseStatus?: BaseStatus;
  outpostStatus?: OutpostStatus;
}> = ({ hp, max, level, color, id, lang, isBuilding, baseStatus, outpostStatus }) => {
  const percent = Math.min(100, Math.max(0, (hp / max) * 100));
  const displayId = id > 100 ? id - 100 : id;
  const displayHp = Math.floor(hp);
  const name = getRobotName(id, lang);

  if (isBuilding) {
    let statusText = '';
    const normId = id > 100 ? id - 100 : id;
    if (normId === 11) statusText = getBaseStatusText(baseStatus, lang);
    if (normId === 10) statusText = getOutpostStatusText(outpostStatus, lang);

    return (
      <div className="flex-1 mx-1 h-16 relative bg-gray-900/80 rounded border border-gray-500 overflow-hidden shadow-lg group">
         {/* Background Bar */}
         <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%)', backgroundSize: '10px 10px' }}></div>
         
         {/* Fill */}
         <div
            className={`absolute left-0 top-0 bottom-0 h-full transition-all duration-300 ease-out ${color} shadow-[0_0_20px_rgba(255,255,255,0.2)]`}
            style={{ width: `${percent}%` }}
         />
         
         {/* Content Overlay */}
         <div className="absolute inset-0 flex items-center justify-between px-6 z-10">
            <div className="flex flex-row items-baseline gap-3">
                <span className="text-3xl font-black text-white drop-shadow-lg tracking-wider uppercase stroke-black leading-none whitespace-nowrap">{name}</span>
                {statusText && <span className="text-sm font-mono font-bold text-yellow-300 bg-black/60 px-2 py-0.5 rounded inline-block whitespace-nowrap">{statusText}</span>}
            </div>
            <span className="text-4xl font-mono font-bold text-white drop-shadow-lg">{displayHp}</span>
         </div>
      </div>
    );
  }

  // Unit Layout - Enhanced Size
  return (
    <div className="flex flex-col items-center mx-0.5 flex-1 min-w-[3.5rem] group relative">
        {/* Top Labels - Resized to match buildings as requested */}
        <div className="flex items-end justify-between w-full px-1 mb-0.5">
            <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-white italic leading-none">{displayId}</span>
                <span className="text-lg font-bold text-yellow-400 leading-none">Lv.{level}</span>
            </div>
            <span className="text-3xl font-black text-gray-100 uppercase tracking-tighter leading-none shadow-black drop-shadow-md whitespace-nowrap">{name}</span>
        </div>

        {/* Progress Bar Container */}
        <div className="h-10 w-full bg-gray-900/80 rounded border border-gray-600/50 overflow-hidden relative shadow-inner">
             {/* Fill */}
            <div
                className={`absolute left-0 top-0 bottom-0 h-full transition-all duration-300 ease-out ${color}`}
                style={{ width: `${percent}%` }}
            />
             {/* HP Text Embedded */}
             <div className="absolute inset-0 flex items-center justify-center z-10">
                 <span className="text-2xl font-mono font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                    {displayHp}
                 </span>
             </div>
        </div>
    </div>
  );
};

const TopPanel: React.FC<TopPanelProps> = ({ data, isDraggable, lang }) => {
  const redRobots = filterRobots(data.robots, 'red');
  const blueRobots = filterRobots(data.robots, 'blue');

  const splitUnits = (robots: typeof redRobots) => {
    const buildings = robots.filter(r => {
        const normId = r.id > 100 ? r.id - 100 : r.id;
        return normId === 10 || normId === 11;
    }).sort((a,b) => {
        // Sort Outpost (10) then Base (11)
        const idA = a.id > 100 ? a.id - 100 : a.id;
        const idB = b.id > 100 ? b.id - 100 : b.id;
        return idA - idB; 
    });
    
    const units = robots.filter(r => {
        const normId = r.id > 100 ? r.id - 100 : r.id;
        return normId < 10;
    });

    return { buildings, units };
  };

  const redSplit = splitUnits(redRobots);
  const blueSplit = splitUnits(blueRobots);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div 
        className={`w-full h-full flex justify-between items-start pt-2 px-4 pointer-events-auto ${isDraggable ? 'border-2 border-dashed border-yellow-400 bg-black/40' : ''}`}
    >
      {/* Red Team Status */}
      <div className="flex-1 flex flex-col items-start mr-8">
        {/* Buildings Row (10, 11) - Above */}
        <div className="flex w-full mb-2">
            {redSplit.buildings.map(r => (
                <HealthBar 
                    key={r.id} id={r.id} hp={r.hp} max={r.maxHp} level={r.level} color="bg-red-600" lang={lang} isBuilding 
                    baseStatus={r.baseStatus} outpostStatus={r.outpostStatus}
                />
            ))}
        </div>
        {/* Units Row (1-7) - Below */}
        <div className="flex w-full bg-black/60 p-2 rounded-r-xl rounded-bl-xl backdrop-blur-sm border-l-4 border-red-600 shadow-lg shadow-red-900/20">
            {redSplit.units.map(r => (
                <HealthBar key={r.id} id={r.id} hp={r.hp} max={r.maxHp} level={r.level} color="bg-red-500" lang={lang} />
            ))}
        </div>
      </div>

      {/* Score & Time (Center) */}
      <div className="flex-none flex flex-col items-center mx-4 z-10 -mt-2">
        <div className="flex items-center space-x-8 bg-slate-900/90 px-10 py-2 rounded-b-2xl border-b-2 border-x border-slate-700 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
            <span className="text-5xl font-black text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">{data.gameStatus.redScore}</span>
            <div className="flex flex-col items-center min-w-[100px]">
                <span className="text-4xl font-mono text-white font-bold tracking-widest drop-shadow-md">
                    {formatTime(data.gameStatus.stageTimeLeft)}
                </span>
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent mt-1"></div>
            </div>
            <span className="text-5xl font-black text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">{data.gameStatus.blueScore}</span>
        </div>
      </div>

      {/* Blue Team Status */}
      <div className="flex-1 flex flex-col items-end ml-8">
        {/* Buildings Row (110, 111) - Above */}
        <div className="flex w-full mb-2">
            {blueSplit.buildings.map(r => (
                 <HealthBar 
                    key={r.id} id={r.id} hp={r.hp} max={r.maxHp} level={r.level} color="bg-blue-600" lang={lang} isBuilding 
                    baseStatus={r.baseStatus} outpostStatus={r.outpostStatus}
                />
            ))}
        </div>
        {/* Units Row (101-107) - Below */}
        <div className="flex w-full bg-black/60 p-2 rounded-l-xl rounded-br-xl backdrop-blur-sm border-r-4 border-blue-600 shadow-lg shadow-blue-900/20">
            {blueSplit.units.map(r => (
                <HealthBar key={r.id} id={r.id} hp={r.hp} max={r.maxHp} level={r.level} color="bg-blue-500" lang={lang} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default TopPanel;