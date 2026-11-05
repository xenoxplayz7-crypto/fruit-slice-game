import React from 'react';
import { GameMode } from '../game/types';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';

interface PauseModalProps {
  score: number;
  mode: GameMode;
  isMuted: boolean;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  score,
  mode,
  isMuted,
  onResume,
  onRestart,
  onQuit,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/75 backdrop-blur-none select-none">
      <div className="bg-[#180e09] border border-amber-900/60 rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl text-center">
        <div className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-1">
          Dojo Respite
        </div>
        <h2 className="text-3xl font-black text-white font-display">GAME PAUSED</h2>
        <div className="text-sm text-amber-200/70 mt-1 mb-6">
          खेल रुका हुआ है · Current Score: <strong className="text-amber-400 font-mono">{score}</strong>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onResume}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Resume (जारी रखें)</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 px-4 bg-amber-950/80 hover:bg-amber-900/80 border border-amber-800/50 text-amber-200 font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart (दोबारा खेलें)</span>
          </button>

          <button
            onClick={onToggleMute}
            className="w-full py-2.5 px-4 bg-black/50 hover:bg-black/70 border border-amber-950/50 text-neutral-300 font-medium rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 text-xs"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>{isMuted ? 'Sound Muted (म्यूट)' : 'Sound On (आवाज़ चालू)'}</span>
          </button>

          <button
            onClick={onQuit}
            className="w-full py-2.5 px-4 bg-transparent hover:bg-white/5 text-neutral-400 hover:text-neutral-200 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs mt-2"
          >
            <Home className="w-4 h-4" />
            <span>Quit to Main Menu (मुख्य मेनू)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
