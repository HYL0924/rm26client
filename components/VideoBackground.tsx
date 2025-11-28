import React from 'react';
import { GlobalInfo } from '../types';

interface VideoBackgroundProps {
    data: GlobalInfo | null;
    selfId: number;
    simulateData: boolean;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({ data, selfId, simulateData }) => {
  const vtm = data?.robots[selfId]?.vtm;

  let statusText = "INITIALIZING...";
  let statusColor = "text-gray-500";

  if (simulateData) {
      statusText = "VIDEO: UDP:3334 [SIMULATION] | CODEC: HEVC/H.265 | LATENCY: ~12ms";
      statusColor = "text-cyan-500";
  } else if (vtm) {
      const linkState = vtm.linkStatus ? "LINKED" : "UNLINKED";
      const connState = vtm.connectionStatus ? "CONNECTED" : "DISCONNECTED";
      statusText = `VTM: ${linkState} | SERVER: ${connState} | SIG: ${vtm.signalStrength}% | MODE: ${vtm.mode}`;
      statusColor = vtm.linkStatus ? "text-green-500" : "text-red-500";
  } else {
      statusText = "VIDEO: NO SIGNAL";
      statusColor = "text-red-500";
  }

  return (
    <div className="absolute inset-0 z-0 bg-black overflow-hidden pointer-events-none">
      {/* Simulation of a video feed - Only visible if connected or simulating */}
      {(simulateData || (vtm && vtm.linkStatus)) && (
          <>
            <div 
                className="w-full h-full opacity-60 animate-pulse bg-cover bg-center"
                style={{ 
                    backgroundImage: `url('https://picsum.photos/1920/1080')`,
                    filter: 'blur(2px)'
                }}
            ></div>
            
            {/* Grid overlay for sci-fi effect */}
            <div 
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)',
                    backgroundSize: '100px 100px'
                }}
            ></div>
          </>
      )}
      
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-[40px] h-[40px] border-2 border-cyan-400 opacity-50 rounded-full flex items-center justify-center">
            <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
        </div>
      </div>
      
      {/* Server Status moved to Top Center (below settings button which is at ~60px top) */}
      <div className={`absolute top-[100px] left-1/2 transform -translate-x-1/2 text-[10px] font-mono text-center leading-tight bg-black/60 px-3 py-1 rounded border border-gray-700/50 backdrop-blur-sm ${statusColor}`}>
        {statusText}
      </div>
    </div>
  );
};

export default VideoBackground;