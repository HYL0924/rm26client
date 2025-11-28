
import React, { useEffect, useRef, useState } from 'react';
import { GlobalInfo, RobotPosition } from '../types';

interface MiniMapProps {
  data: GlobalInfo;
  isDraggable: boolean;
  lang: 'en' | 'zh';
  width: number;
  height: number;
  isExpanded?: boolean;
}

const FIELD_WIDTH = 28; // meters
const FIELD_HEIGHT = 15; // meters
const MAP_IMAGE_SRC = '/map.jpg'; 
// Placeholder to use if local map is missing (e.g. in preview)
const PLACEHOLDER_MAP = 'https://placehold.co/2800x1500/1e293b/ffffff?text=RoboMaster+Field+28x15m';

const MiniMap: React.FC<MiniMapProps> = ({ data, isDraggable, lang, width, height, isExpanded }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Load map image once
  useEffect(() => {
      const img = new Image();
      img.src = MAP_IMAGE_SRC;
      
      img.onload = () => {
          setMapImage(img);
          setImageLoaded(true);
          console.log(`Local map image loaded: ${img.width}x${img.height}`);
      };
      
      img.onerror = () => {
          console.log(`Local map not found at ${MAP_IMAGE_SRC}, loading placeholder...`);
          // Fallback to placeholder if local file missing
          const placeholder = new Image();
          placeholder.src = PLACEHOLDER_MAP;
          placeholder.onload = () => {
              setMapImage(placeholder);
              setImageLoaded(true);
          };
      };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Background
    if (imageLoaded && mapImage) {
        ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);
    } else {
        // Fallback: Draw Default Grid Field if image not ready
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = isExpanded ? 2 : 1;
        
        const scaleX = canvas.width / FIELD_WIDTH;
        const scaleY = canvas.height / FIELD_HEIGHT;

        for (let i = 0; i <= FIELD_WIDTH; i+=4) {
            ctx.beginPath();
            ctx.moveTo(i * scaleX, 0);
            ctx.lineTo(i * scaleX, canvas.height);
            ctx.stroke();
        }
        for (let i = 0; i <= FIELD_HEIGHT; i+=4) {
            ctx.beginPath();
            ctx.moveTo(0, i * scaleY);
            ctx.lineTo(canvas.width, i * scaleY);
            ctx.stroke();
        }
    }

    const scaleX = canvas.width / FIELD_WIDTH;
    const scaleY = canvas.height / FIELD_HEIGHT;

    // 2. Draw Robots
    Object.values(data.positions).forEach((pos: RobotPosition) => {
        if (pos.id === 5 || pos.id === 105) return;

        const isRed = pos.id < 100;
        const isSelf = pos.id === data.selfId;
        
        const x = pos.x * scaleX;
        const y = (FIELD_HEIGHT - pos.y) * scaleY; 

        ctx.save();
        ctx.translate(x, y);
        
        const radius = isExpanded ? (isSelf ? 12 : 8) : (isSelf ? 6 : 4);
        
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = isRed ? '#ef4444' : '#3b82f6';
        if (isSelf) {
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 10;
        }
        ctx.fill();

        ctx.rotate((pos.angle * Math.PI) / 180); 
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, isExpanded ? -16 : -8); 
        
        ctx.strokeStyle = 'white';
        ctx.lineWidth = isExpanded ? 3 : 2;
        ctx.stroke();

        ctx.restore();

        ctx.fillStyle = 'white';
        ctx.font = isExpanded ? 'bold 12px Arial' : '8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(pos.id.toString(), x, y + (isExpanded ? 24 : 12));
    });

  }, [data, width, height, isExpanded, imageLoaded, mapImage]);

  return (
    <div 
        className={`bg-black/80 rounded border border-gray-600 overflow-hidden relative shadow-2xl
        ${isDraggable && !isExpanded ? 'border-2 border-dashed border-yellow-400' : ''}`}
        style={{ width, height }}
    >
        <canvas ref={canvasRef} width={width} height={height} className="w-full h-full" />
        <div className={`absolute top-2 left-3 text-gray-400 font-mono font-bold ${isExpanded ? 'text-xl' : 'text-[10px]'} pointer-events-none drop-shadow-md`}>
            {isExpanded ? (lang === 'en' ? 'TACTICAL MAP' : '战术地图') : (lang === 'en' ? 'MINI-MAP' : '小地图')}
        </div>
        {isExpanded && (
            <div className="absolute bottom-4 right-4 text-gray-500 text-sm font-mono animate-pulse pointer-events-none">
                {lang === 'en' ? 'PRESS [M] TO CLOSE' : '按 [M] 关闭'}
            </div>
        )}
    </div>
  );
};

export default MiniMap;
