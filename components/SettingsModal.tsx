
import React, { useState, useEffect } from 'react';
import { KeyBindings, ClientSettings, ChassisType, ShooterType, ControlMode, GameStage, GlobalInfo, RobotId } from '../types';
import { mockDataService } from '../services/mockDataService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'zh';
  keyBindings: KeyBindings;
  onUpdateKeyBinding: (action: keyof KeyBindings, key: string) => void;
  settings: ClientSettings;
  onUpdateSettings: (newSettings: ClientSettings) => void;
  gameData: GlobalInfo | null;
  onReset: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, onClose, lang, keyBindings, onUpdateKeyBinding, settings, onUpdateSettings, gameData, onReset
}) => {
  const [activeTab, setActiveTab] = useState<'perf' | 'general' | 'video' | 'hardware' | 'ui' | 'controls'>('perf');
  const [listeningFor, setListeningFor] = useState<keyof KeyBindings | null>(null);

  // Auto-set default performance if in fighting stage and not set
  useEffect(() => {
      if (gameData?.gameStatus.stage === GameStage.Fighting) {
          if (settings.chassisType === ChassisType.Balance) {
             onUpdateSettings({ ...settings, chassisType: ChassisType.HpPriority }); // Default assignment
          }
          if (settings.shooterType === ShooterType.Standard) {
             onUpdateSettings({ ...settings, shooterType: ShooterType.CoolingPriority }); // Default assignment
          }
      }
  }, [gameData?.gameStatus.stage]);

  useEffect(() => {
    if (!listeningFor) return;
    const handleKeyDown = (e: KeyboardEvent) => {
        e.preventDefault();
        const key = e.code.replace('Key', '').toUpperCase();
        onUpdateKeyBinding(listeningFor, key);
        setListeningFor(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [listeningFor, onUpdateKeyBinding]);

  if (!isOpen) return null;

  const isPerfLocked = gameData ? gameData.gameStatus.stage > GameStage.SelfCheck : false;
  const canReset = gameData ? (gameData.gameStatus.stage === GameStage.NotStarted || gameData.gameStatus.stage === GameStage.Preparation) : true;

  const tabs = [
      { id: 'perf', label: lang === 'en' ? 'Performance' : '性能设置' },
      { id: 'general', label: lang === 'en' ? 'General' : '常规' },
      { id: 'video', label: lang === 'en' ? 'Video' : '图传' },
      { id: 'hardware', label: lang === 'en' ? 'Hardware' : '硬件设置' },
      { id: 'ui', label: lang === 'en' ? 'UI' : 'UI设置' },
      { id: 'controls', label: lang === 'en' ? 'Controls' : '控制' },
  ];

  const getActionName = (action: keyof KeyBindings) => {
    const map: Record<string, {en: string, zh: string}> = {
        moveForward: { en: 'Forward', zh: '前进' },
        moveBackward: { en: 'Backward', zh: '后退' },
        moveLeft: { en: 'Left', zh: '向左' },
        moveRight: { en: 'Right', zh: '向右' },
        rotateLeft: { en: 'Rotate L', zh: '左旋' },
        rotateRight: { en: 'Rotate R', zh: '右旋' },
        shoot: { en: 'Shoot', zh: '射击' },
        reload: { en: 'Reload', zh: '换弹' },
        interactive: { en: 'Interactive', zh: '交互' },
        buyAmmoHero: { en: 'Buy Ammo (Hero)', zh: '英雄买弹' },
        buyAmmoInfantry: { en: 'Buy Ammo (Inf)', zh: '步兵买弹' },
        remoteExchange: { en: 'Remote Exch', zh: '远程兑换' },
        deployHero: { en: 'Deploy', zh: '部署模式' },
        toggleMap: { en: 'Map', zh: '地图开关' },
        activateEnergy: { en: 'Act. Energy', zh: '激活能量' },
        toggleSettings: { en: 'Settings', zh: '设置面板' },
    };
    return lang === 'en' ? map[action]?.en || action : map[action]?.zh || action;
  };

  const handleLogin = (e: React.ChangeEvent<HTMLSelectElement>) => {
      mockDataService.switchSelfId(parseInt(e.target.value));
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-600 rounded-xl w-[800px] h-[600px] shadow-2xl flex flex-col overflow-hidden transform scale-100">
        
        {/* Header with Tabs */}
        <div className="flex flex-col border-b border-slate-700 bg-slate-800">
             <div className="flex items-center justify-between p-4 pb-2">
                <h2 className="text-2xl font-bold text-white tracking-wide flex items-center gap-2">
                    <span className="w-2 h-8 bg-cyan-500 rounded-sm"></span>
                    {lang === 'en' ? 'Settings' : '系统设置'}
                </h2>
             </div>
             <div className="flex px-4 gap-1 overflow-x-auto">
                {tabs.map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === tab.id ? 'border-cyan-500 text-cyan-400 bg-slate-700/50' : 'border-transparent text-gray-400 hover:text-white hover:bg-slate-700/30'}`}
                    >
                        {tab.label}
                    </button>
                ))}
             </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-900">
            
            {/* PERFORMANCE TAB */}
            {activeTab === 'perf' && (
                <div className="space-y-6">
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                        <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-600 pb-2">{lang === 'en' ? 'Robot Configuration' : '机器人性能配置'}</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-gray-400 mb-2 font-mono text-sm">{lang === 'en' ? 'Chassis Type' : '底盘类型'}</label>
                                <select 
                                    disabled={isPerfLocked}
                                    value={settings.chassisType}
                                    onChange={(e) => onUpdateSettings({...settings, chassisType: parseInt(e.target.value)})}
                                    className="w-full bg-slate-900 border border-slate-600 text-white rounded p-2 focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value={ChassisType.Balance}>{lang === 'en' ? 'Default (Balance)' : '初始设置'}</option>
                                    <option value={ChassisType.HpPriority}>{lang === 'en' ? 'HP Priority' : '血量优先'}</option>
                                    <option value={ChassisType.PowerPriority}>{lang === 'en' ? 'Power Priority' : '功率优先'}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-2 font-mono text-sm">{lang === 'en' ? 'Shooter Type' : '发射机构类型'}</label>
                                <select 
                                    disabled={isPerfLocked}
                                    value={settings.shooterType}
                                    onChange={(e) => onUpdateSettings({...settings, shooterType: parseInt(e.target.value)})}
                                    className="w-full bg-slate-900 border border-slate-600 text-white rounded p-2 focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value={ShooterType.Standard}>{lang === 'en' ? 'Default (Standard)' : '初始设置'}</option>
                                    <option value={ShooterType.CoolingPriority}>{lang === 'en' ? 'Cooling Priority' : '冷却优先'}</option>
                                    <option value={ShooterType.BurstPriority}>{lang === 'en' ? 'Burst Priority' : '爆发优先'}</option>
                                </select>
                            </div>
                        </div>
                        {isPerfLocked && (
                            <p className="mt-4 text-xs text-red-400 italic">
                                {lang === 'en' ? 'Configuration locked during match.' : '比赛进行中，无法修改性能配置。'}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* GENERAL TAB */}
            {activeTab === 'general' && (
                <div className="space-y-6">
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">{lang === 'en' ? 'System' : '系统'}</h3>
                        
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-300">{lang === 'en' ? 'Login Robot ID' : '登录机器人ID'}</span>
                            <select 
                                className="bg-slate-900 border border-slate-600 text-white rounded p-2 w-48"
                                value={gameData?.selfId}
                                onChange={handleLogin}
                            >
                                <optgroup label="Red Team">
                                    <option value={1}>Red Hero (1)</option>
                                    <option value={2}>Red Engineer (2)</option>
                                    <option value={3}>Red Infantry (3)</option>
                                    <option value={4}>Red Infantry (4)</option>
                                    <option value={5}>Red Infantry (5)</option>
                                    <option value={6}>Red Aerial (6)</option>
                                    <option value={7}>Red Sentry (7)</option>
                                </optgroup>
                                <optgroup label="Blue Team">
                                    <option value={101}>Blue Hero (101)</option>
                                    <option value={102}>Blue Engineer (102)</option>
                                    <option value={103}>Blue Infantry (103)</option>
                                    <option value={104}>Blue Infantry (104)</option>
                                    <option value={105}>Blue Infantry (105)</option>
                                    <option value={106}>Blue Aerial (106)</option>
                                    <option value={107}>Blue Sentry (107)</option>
                                </optgroup>
                            </select>
                        </div>

                        {/* Simulation Toggle */}
                        <div className="flex items-center justify-between border-t border-slate-600 pt-4 mb-4">
                            <span className="text-gray-300">{lang === 'en' ? 'Simulate Data' : '模拟数据开关'}</span>
                            <button 
                                onClick={() => onUpdateSettings({...settings, simulateData: !settings.simulateData})}
                                className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.simulateData ? 'bg-green-500' : 'bg-gray-600'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.simulateData ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>

                        <button 
                            disabled={!canReset}
                            onClick={onReset}
                            className="w-full py-3 bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {lang === 'en' ? 'ONE-CLICK RESET (Factory Defaults)' : '一键重置 (恢复出厂设置)'}
                        </button>
                        <p className="mt-2 text-xs text-gray-500">
                            {lang === 'en' ? 'Available only during Free/Preparation stages.' : '仅可在自由阶段和3分钟准备阶段使用。'}
                        </p>
                    </div>
                </div>
            )}

            {/* VIDEO TAB */}
            {activeTab === 'video' && (
                <div className="space-y-4">
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 grid grid-cols-2 gap-4">
                        <div className="col-span-2 text-lg font-bold text-white mb-2 border-b border-slate-600 pb-2">{lang === 'en' ? 'VTM Status' : '图传状态'}</div>
                        
                        <div className="bg-slate-900 p-3 rounded border border-slate-600">
                            <div className="text-xs text-gray-400 mb-1">{lang === 'en' ? 'Serial Port' : '图传串口'}</div>
                            <div className={`font-mono font-bold ${gameData?.robots[gameData.selfId]?.vtm.serialStatus ? 'text-green-400' : 'text-red-500'}`}>
                                {gameData?.robots[gameData.selfId]?.vtm.serialStatus ? 'CONNECTED' : 'DISCONNECTED'}
                            </div>
                        </div>
                        <div className="bg-slate-900 p-3 rounded border border-slate-600">
                            <div className="text-xs text-gray-400 mb-1">{lang === 'en' ? 'Transmitter Link' : '图传链接'}</div>
                            <div className={`font-mono font-bold ${gameData?.robots[gameData.selfId]?.vtm.linkStatus ? 'text-green-400' : 'text-red-500'}`}>
                                {gameData?.robots[gameData.selfId]?.vtm.linkStatus ? 'LINKED' : 'UNLINKED'}
                            </div>
                        </div>
                        <div className="bg-slate-900 p-3 rounded border border-slate-600">
                            <div className="text-xs text-gray-400 mb-1">{lang === 'en' ? 'Mode' : '模式'}</div>
                            <div className="font-mono text-cyan-400">
                                {gameData?.robots[gameData.selfId]?.vtm.mode}
                            </div>
                        </div>
                        <div className="bg-slate-900 p-3 rounded border border-slate-600">
                            <div className="text-xs text-gray-400 mb-1">{lang === 'en' ? 'Channel' : '通道'}</div>
                            <div className="font-mono text-yellow-400">
                                CH {gameData?.robots[gameData.selfId]?.vtm.channel}
                            </div>
                        </div>
                        <div className="col-span-2">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>{lang === 'en' ? 'Signal Strength' : '信号强度'}</span>
                                <span>{Math.floor(gameData?.robots[gameData.selfId]?.vtm.signalStrength || 0)}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-700 rounded overflow-hidden">
                                <div 
                                    className="h-full bg-green-500 transition-all duration-300" 
                                    style={{width: `${gameData?.robots[gameData.selfId]?.vtm.signalStrength}%`}}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* HARDWARE TAB */}
            {activeTab === 'hardware' && (
                <div className="space-y-6">
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-6">
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-300">{lang === 'en' ? 'Mouse Sensitivity' : '控制灵敏度'}</span>
                                <span className="text-cyan-400 font-mono">{settings.sensitivity}</span>
                            </div>
                            <input 
                                type="range" min="1" max="100" 
                                value={settings.sensitivity}
                                onChange={(e) => onUpdateSettings({...settings, sensitivity: parseInt(e.target.value)})}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-300">{lang === 'en' ? 'Main Volume' : '音量设置'}</span>
                                <span className="text-cyan-400 font-mono">{settings.volume}%</span>
                            </div>
                            <input 
                                type="range" min="0" max="100" 
                                value={settings.volume}
                                onChange={(e) => onUpdateSettings({...settings, volume: parseInt(e.target.value)})}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-300">{lang === 'en' ? 'SFX Volume' : '音效设置'}</span>
                                <span className="text-cyan-400 font-mono">{settings.sfxVolume}%</span>
                            </div>
                            <input 
                                type="range" min="0" max="100" 
                                value={settings.sfxVolume}
                                onChange={(e) => onUpdateSettings({...settings, sfxVolume: parseInt(e.target.value)})}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-300">{lang === 'en' ? 'FPS Limit' : '帧率设置'}</span>
                                <span className="text-cyan-400 font-mono">{settings.fpsLimit} FPS</span>
                            </div>
                            <input 
                                type="range" min="30" max="144" step="30"
                                value={settings.fpsLimit}
                                onChange={(e) => onUpdateSettings({...settings, fpsLimit: parseInt(e.target.value)})}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* UI TAB */}
            {activeTab === 'ui' && (
                <div className="space-y-6">
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300">{lang === 'en' ? 'Custom UI' : '自定义UI'}</span>
                            <button 
                                onClick={() => onUpdateSettings({...settings, showCustomUI: !settings.showCustomUI})}
                                className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.showCustomUI ? 'bg-green-500' : 'bg-gray-600'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.showCustomUI ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300">{lang === 'en' ? 'Crosshair' : '准心'}</span>
                            <button 
                                onClick={() => onUpdateSettings({...settings, showCrosshair: !settings.showCrosshair})}
                                className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.showCrosshair ? 'bg-green-500' : 'bg-gray-600'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.showCrosshair ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300">{lang === 'en' ? 'Mini-Map' : '小地图'}</span>
                            <button 
                                onClick={() => onUpdateSettings({...settings, showMap: !settings.showMap})}
                                className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.showMap ? 'bg-green-500' : 'bg-gray-600'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.showMap ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300">{lang === 'en' ? 'Display Mode' : '显示模式'}</span>
                            <div className="flex bg-slate-900 rounded p-1">
                                <button 
                                    onClick={() => onUpdateSettings({...settings, isFullscreen: false})}
                                    className={`px-3 py-1 rounded text-xs ${!settings.isFullscreen ? 'bg-cyan-600 text-white' : 'text-gray-400'}`}
                                >
                                    Windowed
                                </button>
                                <button 
                                    onClick={() => onUpdateSettings({...settings, isFullscreen: true})}
                                    className={`px-3 py-1 rounded text-xs ${settings.isFullscreen ? 'bg-cyan-600 text-white' : 'text-gray-400'}`}
                                >
                                    Fullscreen
                                </button>
                            </div>
                        </div>
                        <div className="border-t border-slate-600 pt-4">
                            <span className="block text-gray-300 mb-2">{lang === 'en' ? 'Control Mode' : '操作方式'}</span>
                            <div className="grid grid-cols-3 gap-2">
                                <button 
                                    onClick={() => onUpdateSettings({...settings, controlMode: ControlMode.Manual})}
                                    className={`py-2 rounded border ${settings.controlMode === ControlMode.Manual ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-slate-900 border-slate-600 text-gray-400 hover:bg-slate-700'}`}
                                >
                                    {lang === 'en' ? 'Manual' : '手动'}
                                </button>
                                <button 
                                    onClick={() => onUpdateSettings({...settings, controlMode: ControlMode.SemiAuto})}
                                    className={`py-2 rounded border ${settings.controlMode === ControlMode.SemiAuto ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-slate-900 border-slate-600 text-gray-400 hover:bg-slate-700'}`}
                                >
                                    {lang === 'en' ? 'Semi-Auto' : '半自动'}
                                </button>
                                <button 
                                    onClick={() => onUpdateSettings({...settings, controlMode: ControlMode.AutoMine})}
                                    disabled={gameData?.selfId !== RobotId.RedEngineer && gameData?.selfId !== RobotId.BlueEngineer}
                                    className={`py-2 rounded border ${settings.controlMode === ControlMode.AutoMine ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-slate-900 border-slate-600 text-gray-400 hover:bg-slate-700'} disabled:opacity-30`}
                                >
                                    {lang === 'en' ? 'Auto Mine' : '自动兑矿'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CONTROLS TAB */}
            {activeTab === 'controls' && (
                <div className="grid grid-cols-2 gap-2">
                    {Object.keys(keyBindings).map((key) => {
                        const action = key as keyof KeyBindings;
                        const isListening = listeningFor === action;
                        return (
                            <div key={action} className="flex items-center justify-between bg-slate-800 p-2 rounded border border-slate-700">
                                <span className="text-gray-300 text-xs font-bold">{getActionName(action)}</span>
                                <button
                                    onClick={() => setListeningFor(action)}
                                    className={`
                                        min-w-[60px] px-2 py-1 rounded text-xs font-mono font-bold transition-all
                                        ${isListening 
                                            ? 'bg-red-500 text-white animate-pulse' 
                                            : 'bg-slate-900 text-cyan-400 border border-slate-600'
                                        }
                                    `}
                                >
                                    {isListening ? '...' : keyBindings[action]}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800 flex justify-end">
            <button 
                onClick={onClose}
                className="px-8 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded transition-colors shadow-lg"
            >
                {lang === 'en' ? 'Close' : '关闭'} (P)
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;