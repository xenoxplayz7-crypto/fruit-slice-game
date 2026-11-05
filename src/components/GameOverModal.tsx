import React, { useState } from 'react';
import { GameStats } from '../game/types';
import { RotateCcw, Home, Trophy, Swords, Zap, ShieldCheck, Heart, Film, Info } from 'lucide-react';
import { adManager } from '../monetization/adManager';

interface GameOverModalProps {
  stats: GameStats;
  onPlayAgain: () => void;
  onHome: () => void;
  onExtraLifeRevive: () => void;
  canRevive: boolean;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onPlayAgain,
  onHome,
  onExtraLifeRevive,
  canRevive,
}) => {
  const isNewHighScore = stats.score > 0 && stats.score >= stats.highScore;
  const isAdConfigured = adManager.isConfigured();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleWatchAdForExtraLife = () => {
    if (!canRevive) return;

    if (isAdConfigured) {
      adManager.requestRewardedAd('extra_life', {
        onRewardGranted: () => {
          onExtraLifeRevive();
        },
        onAdUnavailable: (reason) => {
          setStatusMessage(reason);
          // Requirement 9: Keep game fully functional even when ad is unavailable
          setTimeout(() => {
            onExtraLifeRevive();
          }, 1200);
        },
      });
    } else {
      // Requirement 8 & 9: Do not create fake ads; provide clean fallback revive
      setStatusMessage('Ad network pending approval · Granting free Dojo Honor Revive!');
      setTimeout(() => {
        onExtraLifeRevive();
      }, 900);
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/80 backdrop-blur-none select-none">
      <div className="bg-[#180e09] border border-amber-900/60 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden">
        {/* Top Header */}
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-red-500 mb-1">
          Dojo Final Trial · खेल समाप्त
        </div>

        <h2 className="text-4xl md:text-5xl font-black text-white font-display">
          GAME OVER
        </h2>

        {/* New High Score Badge */}
        {isNewHighScore && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-400 text-amber-300 rounded-full text-xs font-black uppercase tracking-wider my-2.5 animate-bounce">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>New High Score! नया रिकॉर्ड!</span>
          </div>
        )}

        {/* Primary Score Board */}
        <div className="my-4 p-4 bg-black/50 border border-amber-950/70 rounded-2xl">
          <div className="text-xs uppercase tracking-wider text-amber-300/80 font-bold mb-1">
            Final Score · कुल स्कोर
          </div>
          <div className="text-5xl md:text-6xl font-black text-amber-400 tabular-nums font-mono">
            {stats.score}
          </div>

          <div className="mt-2 text-xs text-neutral-400 flex items-center justify-center gap-2">
            <span>High Score (रिकॉर्ड):</span>
            <strong className="text-amber-200 font-mono text-sm">{stats.highScore}</strong>
          </div>
        </div>

        {/* Trial Performance Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-2.5 bg-black/40 border border-amber-950/40 rounded-xl flex flex-col items-center">
            <Swords className="w-4 h-4 text-emerald-400 mb-1" />
            <span className="text-[10px] text-neutral-400 font-medium">Sliced</span>
            <span className="text-lg font-bold text-white tabular-nums font-mono">{stats.slicedCount}</span>
          </div>

          <div className="p-2.5 bg-black/40 border border-amber-950/40 rounded-xl flex flex-col items-center">
            <Zap className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-[10px] text-neutral-400 font-medium">Best Combo</span>
            <span className="text-lg font-bold text-white tabular-nums font-mono">{stats.bestCombo}x</span>
          </div>

          <div className="p-2.5 bg-black/40 border border-amber-950/40 rounded-xl flex flex-col items-center">
            <ShieldCheck className="w-4 h-4 text-cyan-400 mb-1" />
            <span className="text-[10px] text-neutral-400 font-medium">Specials</span>
            <span className="text-lg font-bold text-white tabular-nums font-mono">{stats.specialFruitsSliced}</span>
          </div>
        </div>

        {/* Status Message notice if ad is loading/unavailable */}
        {statusMessage && (
          <div className="mb-3 p-2 bg-amber-950/60 border border-amber-500/40 rounded-xl text-amber-200 text-xs flex items-center justify-center gap-1.5 animate-pulse">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          {/* Requirement 2: Rewarded ad option - Watch Ad – Get 1 Extra Life */}
          {canRevive && (
            <button
              onClick={handleWatchAdForExtraLife}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 text-sm border border-emerald-400/40"
            >
              <Heart className="w-4 h-4 text-red-300 fill-red-400 animate-pulse" />
              <span>Watch Ad – Get 1 Extra Life</span>
              <Film className="w-3.5 h-3.5 opacity-80" />
            </button>
          )}

          <button
            onClick={onPlayAgain}
            className="w-full py-3 px-6 bg-gradient-to-r from-red-600 via-amber-600 to-yellow-500 hover:from-red-500 hover:via-amber-500 hover:to-yellow-400 text-white font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again (दोबारा खेलें)</span>
          </button>

          <button
            onClick={onHome}
            className="w-full py-2.5 px-4 bg-black/40 hover:bg-black/60 border border-amber-950/60 text-neutral-300 hover:text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            <Home className="w-4 h-4" />
            <span>Back to Dojo (मेनू पर जाएं)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
