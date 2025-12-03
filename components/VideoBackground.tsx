import React, { useEffect, useState, useRef } from 'react';
import { GlobalInfo } from '../types';
import { videoReceiverService } from '../services/VideoReceiverService';

interface VideoBackgroundProps {
    data: GlobalInfo | null;
    selfId: number;
    simulateData: boolean;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({ data, selfId, simulateData }) => {
  const vtm = data?.robots[selfId]?.vtm;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [connectionStatus, setConnectionStatus] = useState('INIT');
  
  useEffect(() => {
      // If we are simulating data for the HUD, we might not want to connect to real video.
      // However, the user request says "Remove simulated data stream", implying we should always try to connect to real video
      // or at least not show the fake one. 
      // If the app settings say "simulateData: true", typically we wouldn't connect to real backend.
      // But given the instruction, let's assume video is always real or nothing.
      
      if (simulateData) {
          setConnectionStatus('SIMULATION_PAUSED');
          return;
      }

      const handleStream = (stream: MediaStream) => {
          if (videoRef.current) {
              videoRef.current.srcObject = stream;
              // Attempt to play immediately
              videoRef.current.play().catch(e => console.error("Video play error:", e));
          }
      };

      const handleStatus = (status: string) => {
          setConnectionStatus(status);
      };

      videoReceiverService.on('stream', handleStream);
      videoReceiverService.on('status', handleStatus);
      videoReceiverService.connect();

      return () => {
          videoReceiverService.off('stream', handleStream);
          videoReceiverService.off('status', handleStatus);
          videoReceiverService.disconnect();
      };
  }, [simulateData]);

  let statusText = "INITIALIZING...";
  let statusColor = "text-gray-500";

  if (simulateData) {
      statusText = "VIDEO DISABLED IN SIMULATION MODE";
      statusColor = "text-gray-500";
  } else {
      const linkState = vtm ? (vtm.linkStatus ? "LINKED" : "UNLINKED") : "N/A";
      
      // Real WebRTC Status
      statusText = `VTM: ${linkState} | WEBRTC: ${connectionStatus}`;
      
      if (connectionStatus === 'CONNECTED' && vtm?.linkStatus) {
          statusColor = "text-green-500";
      } else if (connectionStatus === 'CONNECTED') {
          statusColor = "text-yellow-500"; 
      } else {
          statusColor = "text-red-500";
      }
  }

  return (
    <div className="absolute inset-0 z-0 bg-black overflow-hidden pointer-events-none">
      
      {/* Real Video Element */}
      <video 
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover ${connectionStatus === 'CONNECTED' && !simulateData ? 'opacity-100' : 'opacity-0'}`}
          autoPlay
          muted
          playsInline
      />
      
      {/* Center Crosshair Decoration */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-[40px] h-[40px] border-2 border-cyan-400 opacity-50 rounded-full flex items-center justify-center">
            <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
        </div>
      </div>
      
      {/* Server Status moved to Top Center */}
      <div className={`absolute top-[100px] left-1/2 transform -translate-x-1/2 text-[10px] font-mono text-center leading-tight bg-black/60 px-3 py-1 rounded border border-gray-700/50 backdrop-blur-sm ${statusColor} z-10`}>
        {statusText}
      </div>
    </div>
  );
};

export default VideoBackground;