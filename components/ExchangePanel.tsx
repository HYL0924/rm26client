
import React, { useState, useEffect } from 'react';

interface ExchangePanelProps {
  isVisible: boolean;
  type: 'Hero' | 'Infantry' | 'Remote';
  lang: 'en' | 'zh';
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

const ExchangePanel: React.FC<ExchangePanelProps> = ({ isVisible, type, lang, onClose, onConfirm }) => {
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onConfirm(amount);
            setAmount(0);
            onClose();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, amount, onConfirm, onClose]);

  if (!isVisible) return null;

  const title = type === 'Remote' 
    ? (lang === 'en' ? 'Remote Exchange' : '远程兑换')
    : (lang === 'en' ? `Buy Ammo (${type})` : `购买弹丸 (${type === 'Hero' ? '英雄' : '步兵'})`);

  const modifiers = [-100, -50, -20, -10, 10, 20, 50, 100];

  const handleModify = (val: number) => {
    setAmount(prev => Math.max(0, prev + val));
  };

  const handleConfirm = () => {
    onConfirm(amount);
    setAmount(0);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border-2 border-cyan-500 rounded-xl p-6 w-[400px] shadow-2xl shadow-cyan-500/20 transform scale-100">
        <h2 className="text-2xl font-black text-white mb-6 text-center border-b border-gray-700 pb-2">
            {title}
        </h2>

        <div className="flex justify-center mb-6">
            <span className="text-6xl font-mono font-bold text-cyan-400">{amount}</span>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-6">
            {modifiers.map(mod => (
                <button
                    key={mod}
                    onClick={() => handleModify(mod)}
                    className={`
                        py-2 rounded font-bold transition-all
                        ${mod > 0 
                            ? 'bg-green-600/20 text-green-400 border border-green-600 hover:bg-green-600 hover:text-white' 
                            : 'bg-red-600/20 text-red-400 border border-red-600 hover:bg-red-600 hover:text-white'}
                    `}
                >
                    {mod > 0 ? `+${mod}` : mod}
                </button>
            ))}
        </div>

        <div className="flex space-x-4">
            <button 
                onClick={onClose}
                className="flex-1 py-3 rounded border border-gray-500 text-gray-400 hover:bg-gray-800 transition-colors"
            >
                {lang === 'en' ? 'Cancel' : '取消'}
            </button>
            <button 
                onClick={handleConfirm}
                className="flex-1 py-3 rounded bg-cyan-600 text-white font-bold hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-600/30"
            >
                {lang === 'en' ? 'Confirm' : '确认购买'} (Enter)
            </button>
        </div>
      </div>
    </div>
  );
};

export default ExchangePanel;