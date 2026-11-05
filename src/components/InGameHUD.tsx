import React from 'react';
import { GameMode } from '../game/types';
import { Pause, Volume2, VolumeX, Snowflake, Zap, Sparkles } from 'lucide-react';
import { BLADES } from '../game/blades';
import { BladeType } from '../game/types';

interface InGameHUDProps {
  score: number;
  lives: number;
  timeRemaining: number;
  mode: GameMode;
  blade: BladeType;
  isMuted: boolean;
  powerUps: { freeze: number; frenzy: number; double: number };
  onPause: () => void;
  onToggleMute: () => void;
}

export const InGameHUD: React.FC<InGameHUDProps> = ({
  score,
  lives,
  timeRemaining,
  mode,
  blade,
  isMuted,
  powerUps,
  onPause,
  onToggleMute,
}) => {
  const currentBlade = BLADES[blade];

  return (
    <div className="absolute inset-0 pointer-events-none p-4 md:p-6 flex flex-col justify-between select-none">
      {/* Top Bar Perimeter Cluster */}
      <div className="flex items-start justify-between">
        {/* Left: Score & Blade info */}
        <div className="flex items-center gap-3">
          <div className="bg-black/60 border border-amber-950/60 rounded-xl px-4 py-2 shadow-lg backdrop-blur-none">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-300/80">
              Score · स्कोर
            </div>
            <div className="text-3xl md:text-4xl font-extrabold text-amber-400 tabular-nums font-mono leading-none tracking-tight">
              {score}
            </div>
          </div>

          {/* Active Power-up Status Badges */}
          <div className="flex items-center gap-2">
            {powerUps.freeze > 0 && (
              <div className="flex items-center gap-1.5 bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 px-3 py-1.5 rounded-lg text-xs font-semibold animate-pulse">
                <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
                <span>FREEZE {powerUps.freeze.toFixed(1)}s</span>
              </div>
            )}
            {powerUps.frenzy > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-950/80 border border-amber-500/50 text-amber-300 px-3 py-1.5 rounded-lg text-xs font-semibold animate-pulse">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>FRENZY {powerUps.frenzy.toFixed(1)}s</span>
              </div>
            )}
            {powerUps.double > 0 && (
              <div className="flex items-center gap-1.5 bg-purple-950/80 border border-purple-500/50 text-purple-300 px-3 py-1.5 rounded-lg text-xs font-semibold animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>2X POINTS {powerUps.double.toFixed(1)}s</span>
              </div>
            )}
          </div>
        </div>

        {/* Center: Timer (Arcade & Zen) */}
        {mode !== 'classic' && (
          <div className="bg-black/60 border border-amber-950/60 rounded-xl px-5 py-2 shadow-lg flex flex-col items-center">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-300/80">
              Time Left
            </div>
            <div
              className={`text-3xl md:text-4xl font-black tabular-nums font-mono leading-none ${
                timeRemaining <= 10 ? 'text-red-500 animate-pulse' : 'text-amber-100'
              }`}
            >
              {timeRemaining}s
            </div>
          </div>
        )}

        {/* Right: Lives (Classic) + Control buttons */}
        <div className="flex items-center gap-3">
          {mode === 'classic' && (
            <div className="flex items-center gap-2 bg-black/60 border border-amber-950/60 rounded-xl px-4 py-2.5 shadow-lg">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300/80 mr-1 hidden sm:inline">
                Lives
              </span>
              {[0, 1, 2].map((idx) => {
                const isLost = idx >= lives;
                return (
                  <span
                    key={idx}
                    className={`font-black text-xl transition-all ${
                      isLost
                        ? 'text-red-500/40 line-through scale-90'
                        : 'text-red-500 scale-100 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                    }`}
                  >
                    ✕
                  </span>
                );
              })}
            </div>
          )}

          {/* Interactive perimeter controls */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              onClick={onToggleMute}
              className="p-2.5 bg-black/60 hover:bg-black/80 border border-amber-900/50 text-amber-300/80 hover:text-amber-200 rounded-xl transition-colors cursor-pointer shadow-lg active:scale-95"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            <button
              onClick={onPause}
              className="p-2.5 bg-black/60 hover:bg-black/80 border border-amber-900/50 text-amber-300/80 hover:text-amber-200 rounded-xl transition-colors cursor-pointer shadow-lg active:scale-95"
              title="Pause Game (Esc)"
              aria-label="Pause"
            >
              <Pause className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Perimeter hint */}
      <div className="flex items-end justify-between text-xs text-amber-200/50 font-medium">
        <div className="bg-black/50 border border-amber-950/40 px-3 py-1.5 rounded-lg flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentBlade.coreColor }} />
          <span>{currentBlade.nameEn} · {currentBlade.nameHi}</span>
        </div>
        <div className="hidden sm:block bg-black/50 border border-amber-950/40 px-3 py-1.5 rounded-lg">
          Slice fruits together for combos · Esc to pause
        </div>
      </div>
    </div>
  );
};
