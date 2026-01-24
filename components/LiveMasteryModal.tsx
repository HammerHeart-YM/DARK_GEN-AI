import React, { useEffect, useState, useRef } from 'react';
import { X, Mic, MicOff, Power, Activity } from 'lucide-react';
import { GeminiLiveClient } from '../services/liveGemini';

interface LiveMasteryModalProps {
  apiKey: string;
  isOpen: boolean;
  onClose: () => void;
}

export const LiveMasteryModal: React.FC<LiveMasteryModalProps> = ({ apiKey, isOpen, onClose }) => {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'speaking'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const clientRef = useRef<GeminiLiveClient | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (!apiKey || apiKey.includes("PLACE_YOUR_KEY")) {
        setError("Gemini API Key Missing. Please set VITE_GEMINI_API_KEY in .env");
        return;
      }

      setError(null);

      if (!clientRef.current) {
        clientRef.current = new GeminiLiveClient();

        clientRef.current.on('connected', () => setStatus('connected'));
        clientRef.current.on('disconnected', () => setStatus('disconnected'));
        clientRef.current.on('speaking', (speaking) => setStatus(speaking ? 'speaking' : 'connected'));
        clientRef.current.on('error', (err) => {
          console.error("Live Client Error:", err);
          setError("Connection Failed. Check console for details.");
          setStatus('disconnected');
        });
      }
      setStatus('connecting');
      clientRef.current.connect(apiKey);
    } else {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
      setError(null);
      setStatus('disconnected');
    }

    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [isOpen, apiKey]);

  const handleDisconnect = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl animate-in fade-in duration-500">
      {/* Ambient Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] mix-blend-screen transition-all duration-1000 ${status === 'speaking' ? 'scale-125 opacity-40' : 'scale-100 opacity-20'}`} />
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] mix-blend-screen transition-all duration-1000 ${status === 'speaking' ? 'scale-125 opacity-40' : 'scale-100 opacity-20'}`} />
      </div>

      <div className="relative w-full h-full max-w-5xl max-h-[90vh] flex flex-col items-center justify-between py-12 md:py-20">

        {/* Header */}
        <div className="flex flex-col items-center gap-2 z-10">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <Activity size={14} className={status === 'speaking' ? 'text-indigo-400 animate-pulse' : 'text-zinc-500'} />
            <span className="text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">
              NEURAL BRIDGE {status === 'connected' ? 'ONLINE' : status === 'speaking' ? 'ACTIVE' : 'CONNECTING'}
            </span>
          </div>
        </div>

        {/* Central Visualizer */}
        <div className="relative flex items-center justify-center flex-1 w-full">
          {/* Outer Rings */}
          <div className={`absolute w-[500px] h-[500px] border border-indigo-500/10 rounded-full animate-[spin_20s_linear_infinite] transition-all duration-1000 ${status === 'speaking' ? 'scale-110 border-indigo-500/30' : 'scale-100'}`} />
          <div className={`absolute w-[400px] h-[400px] border border-purple-500/10 rounded-full animate-[spin_15s_linear_infinite_reverse] transition-all duration-1000 ${status === 'speaking' ? 'scale-105 border-purple-500/30' : 'scale-100'}`} />

          {/* Core Energy Field */}
          <div className="relative flex items-center justify-center">
            {/* Pulsating Layers */}
            <div className={`absolute w-64 h-64 rounded-full bg-indigo-500/10 blurred-xl animate-pulse transition-all duration-300 ${status === 'speaking' ? 'scale-150 opacity-100' : 'scale-100 opacity-30'}`} />
            <div className={`absolute w-48 h-48 rounded-full bg-indigo-600/20 blur-md animate-ping transition-all duration-300 ${status === 'speaking' ? 'opacity-40' : 'opacity-0'}`} style={{ animationDuration: '3s' }} />

            {/* Main Orb */}
            <div className={`relative w-32 h-32 rounded-full backdrop-blur-sm border-2 flex items-center justify-center transition-all duration-500 shadow-[0_0_50px_rgba(79,70,229,0.3)]
              ${status === 'speaking'
                ? 'border-indigo-400 bg-indigo-500/10 shadow-[0_0_80px_rgba(79,70,229,0.6)] scale-110'
                : 'border-white/10 bg-white/5 scale-100'
              }
            `}>
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 opacity-80 blur-sm transition-all duration-200 ${status === 'speaking' ? 'scale-100' : 'scale-90 opacity-40'}`} />
            </div>
          </div>
        </div>

        {/* Status Text */}
        <div className="z-10 flex flex-col items-center gap-2 mb-12">
          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-2 text-center drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">DARK AI</span>
          </h2>
          <p className={`font-outfit text-sm md:text-base tracking-[0.2em] uppercase transition-all duration-500 ${status === 'speaking'
            ? 'text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.8)]'
            : status === 'connected'
              ? 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] animate-pulse'
              : 'text-zinc-500'
            }`}>
            {status === 'speaking' ? 'Processing Voice Stream' : status === 'connected' ? 'Listening...' : 'Initializing'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 z-10">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`group p-4 rounded-full backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 border
              ${isMuted
                ? 'bg-red-500/20 border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]'
              }
            `}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          <button
            onClick={handleDisconnect}
            className="group p-4 rounded-full bg-red-600/90 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:shadow-[0_0_35px_rgba(220,38,38,0.7)] transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-red-400/50"
          >
            <Power size={24} className="fill-current" />
          </button>
        </div>

      </div>
    </div>
  );
};

