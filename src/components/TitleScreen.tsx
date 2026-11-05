import React, { useState, useRef, useEffect } from 'react';
import { BladeType, GameMode } from '../game/types';
import { BLADES } from '../game/blades';
import { Volume2, VolumeX, Trophy, Swords, Zap, Heart, Sparkles, Lock, Film, Settings } from 'lucide-react';
import { audio } from '../game/audio';
import { adManager } from '../monetization/adManager';
import { AdSenseBanner } from './AdSenseBanner';
import { MonetizationSettingsModal } from './MonetizationSettingsModal';

interface TitleScreenProps {
  onStartGame: (mode: GameMode, blade: BladeType) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  selectedBlade: BladeType;
  onSelectBlade: (blade: BladeType) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  isMuted,
  onToggleMute,
  selectedBlade,
  onSelectBlade,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');
  const [isWatermelonSliced, setIsWatermelonSliced] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [adNotice, setAdNotice] = useState<string | null>(null);
  const [unlockedBlades, setUnlockedBlades] = useState<string[]>(() => adManager.getState().unlockedBlades);
  const melonRef = useRef<HTMLDivElement>(null);

  // Subscribe to unlocked blades changes
  useEffect(() => {
    return adManager.subscribe(() => {
      setUnlockedBlades(adManager.getState().unlockedBlades);
    });
  }, []);

  // Retrieve high scores from localStorage
  const classicHigh = Number(localStorage.getItem('fruit_slice_high_classic') || 0);
  const arcadeHigh = Number(localStorage.getItem('fruit_slice_high_arcade') || 0);
  const zenHigh = Number(localStorage.getItem('fruit_slice_high_zen') || 0);

  const handleStart = () => {
    setIsWatermelonSliced(true);
    audio.playSlice(true);
    setTimeout(() => {
      onStartGame(selectedMode, selectedBlade);
    }, 350);
  };

  // Requirement 3: Rewarded ad option to unlock special blades
  const handleBladeClick = (bladeKey: BladeType) => {
    const isUnlocked = adManager.isBladeUnlocked(bladeKey);

    if (isUnlocked) {
      onSelectBlade(bladeKey);
      return;
    }

    // Blade is locked - offer rewarded ad unlock
    const isConfigured = adManager.isConfigured();

    if (isConfigured) {
      adManager.requestRewardedAd('unlock_blade', {
        onRewardGranted: () => {
          adManager.unlockBlade(bladeKey);
          onSelectBlade(bladeKey);
          audio.playFreeze();
          setAdNotice(`Unlocked ${BLADES[bladeKey].nameEn}! तलवार अनलॉक हो गई!`);
          setTimeout(() => setAdNotice(null), 3000);
        },
        onAdUnavailable: (reason) => {
          setAdNotice(reason);
          // Requirement 9: Keep game fully functional even when ads unavailable
          setTimeout(() => {
            adManager.unlockBlade(bladeKey);
            onSelectBlade(bladeKey);
            setAdNotice(`Free unlock granted: ${BLADES[bladeKey].nameEn}!`);
            setTimeout(() => setAdNotice(null), 3000);
          }, 1200);
        },
      });
    } else {
      // Requirement 8 & 9: Do not create fake ads; provide clean honorable unlock
      adManager.unlockBlade(bladeKey);
      onSelectBlade(bladeKey);
      audio.playFreeze();
      setAdNotice(`Dojo Trial: Unlocked ${BLADES[bladeKey].nameEn} (Ads pending approval)`);
      setTimeout(() => setAdNotice(null), 3500);
    }
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 md:p-6 bg-black/60 select-none overflow-y-auto">
      {/* Top Header Row */}
      <div className="flex items-center justify-between w-full max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-amber-500 font-black tracking-widest text-xs uppercase px-2 py-1 bg-amber-950/60 border border-amber-800/40 rounded">
            Ninja Dojo · निंजा अखाड़ा
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* AdSense configuration dialog toggle (for developer / owner) */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1 px-2.5 py-2 bg-black/70 hover:bg-black/90 border border-amber-900/40 text-amber-300/80 hover:text-amber-200 rounded-xl transition-all cursor-pointer active:scale-95 text-xs font-semibold"
            title="Monetization & AdSense Settings"
            aria-label="Ad Settings"
          >
            <Settings className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Ad Settings</span>
          </button>

          <button
            onClick={onToggleMute}
            className="flex items-center gap-1.5 px-3 py-2 bg-black/70 hover:bg-black/90 border border-amber-900/40 text-amber-300 rounded-xl transition-all cursor-pointer active:scale-95 text-xs font-semibold"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound On'}</span>
          </button>
        </div>
      </div>

      {/* Main Center Stage */}
      <div className="flex flex-col items-center justify-center my-auto py-4 max-w-4xl mx-auto text-center">
        {/* Bespoke Title Lockup */}
        <div className="relative mb-4">
          <div className="text-xs uppercase tracking-[0.35em] text-amber-400 font-bold mb-1 drop-shadow">
            DOJO SLICE ACADEMY
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] font-display">
            FRUIT <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-yellow-300">SLICE</span>
          </h1>
          <div className="text-2xl md:text-3xl font-extrabold text-amber-300 tracking-wider mt-1 drop-shadow">
            फल काटो
          </div>
          <div className="w-48 md:w-64 h-1 mx-auto mt-2 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
        </div>

        {/* Interactive "Slice To Start" Watermelon Target */}
        <div className="relative my-3 group cursor-pointer" onClick={handleStart}>
          <div
            ref={melonRef}
            className={`relative transition-transform duration-300 transform group-hover:scale-105 active:scale-95 ${
              isWatermelonSliced ? 'scale-125 opacity-0' : 'animate-bounce'
            }`}
            style={{ animationDuration: '2.5s' }}
          >
            {/* Watermelon Graphic */}
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-emerald-500 via-green-600 to-emerald-900 border-4 border-emerald-400/80 shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-40 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#064e3b_10px,#064e3b_20deg)]" />
              <div className="relative z-10 flex flex-col items-center">
                <Swords className="w-7 h-7 text-amber-200 mb-1 drop-shadow" />
                <span className="text-xs md:text-sm font-black text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  Slice To Play
                </span>
                <span className="text-[10px] text-amber-200 font-bold">शुरू करें</span>
              </div>
            </div>
            <div className="absolute -inset-2 rounded-full border border-amber-400/40 animate-ping opacity-30 pointer-events-none" />
          </div>
        </div>

        {/* Mode Selector Segmented Tabs */}
        <div className="w-full max-w-xl mx-auto mt-4 bg-black/60 border border-amber-950/60 p-1.5 rounded-2xl shadow-xl flex items-center gap-1.5">
          <button
            onClick={() => setSelectedMode('classic')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all cursor-pointer flex flex-col items-center ${
              selectedMode === 'classic'
                ? 'bg-gradient-to-b from-red-600 to-red-800 text-white shadow-lg border border-red-400/50 scale-[1.02]'
                : 'text-amber-200/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-sm">
              <Heart className="w-4 h-4 text-red-300" />
              <span>Classic</span>
            </div>
            <span className="text-[11px] opacity-80 mt-0.5">3 Lives · Bombs</span>
          </button>

          <button
            onClick={() => setSelectedMode('arcade')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all cursor-pointer flex flex-col items-center ${
              selectedMode === 'arcade'
                ? 'bg-gradient-to-b from-amber-600 to-amber-800 text-white shadow-lg border border-amber-400/50 scale-[1.02]'
                : 'text-amber-200/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-sm">
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Arcade</span>
            </div>
            <span className="text-[11px] opacity-80 mt-0.5">60s · Power-Ups</span>
          </button>

          <button
            onClick={() => setSelectedMode('zen')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all cursor-pointer flex flex-col items-center ${
              selectedMode === 'zen'
                ? 'bg-gradient-to-b from-emerald-600 to-emerald-800 text-white shadow-lg border border-emerald-400/50 scale-[1.02]'
                : 'text-amber-200/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Zen</span>
            </div>
            <span className="text-[11px] opacity-80 mt-0.5">90s · No Bombs</span>
          </button>
        </div>

        {/* Blade Armory with Rewarded Ad Unlock Option (Requirement 3) */}
        <div className="mt-5 flex flex-col items-center">
          <div className="text-xs uppercase tracking-widest text-amber-300/80 font-bold mb-2">
            Blade Armory · तलवार चुनें
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {(Object.keys(BLADES) as BladeType[]).map((bKey) => {
              const b = BLADES[bKey];
              const isSelected = selectedBlade === bKey;
              const isUnlocked = unlockedBlades.includes(bKey);

              return (
                <button
                  key={bKey}
                  onClick={() => handleBladeClick(bKey)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-amber-950/80 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.4)] scale-105'
                      : isUnlocked
                      ? 'bg-black/50 border-amber-950/40 text-neutral-400 hover:text-neutral-200 hover:border-amber-900/60'
                      : 'bg-black/70 border-dashed border-amber-800/50 text-neutral-400 hover:border-amber-500'
                  }`}
                  title={
                    isUnlocked
                      ? b.description
                      : 'Special Blade: Watch Rewarded Ad to Unlock'
                  }
                >
                  <span
                    className="w-3 h-3 rounded-full border border-white/40"
                    style={{ backgroundColor: b.trailColor }}
                  />
                  <span>{b.nameEn}</span>
                  {!isUnlocked && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-700/50">
                      <Lock className="w-2.5 h-2.5" />
                      <Film className="w-2.5 h-2.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Ad/Unlock status feedback */}
          {adNotice && (
            <div className="mt-2 text-xs text-amber-300 font-medium bg-black/60 px-3 py-1 rounded-lg border border-amber-900/50 animate-pulse">
              {adNotice}
            </div>
          )}
        </div>
      </div>

      {/* Requirement 1: Responsive Banner Ad Placeholder at bottom of home screen */}
      {/* Requirement 7: Stays hidden until real ad network approval and configuration */}
      <div className="w-full my-2">
        <AdSenseBanner />
      </div>

      {/* Footer Info Row */}
      <div className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-200/70 border-t border-amber-950/40 pt-3">
        {/* High Scores Row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Trophy className="w-4 h-4" />
            <span>High Scores:</span>
          </div>
          <div className="flex items-center gap-3 tabular-nums font-mono">
            <span>Classic: <strong className="text-white">{classicHigh}</strong></span>
            <span>·</span>
            <span>Arcade: <strong className="text-white">{arcadeHigh}</strong></span>
            <span>·</span>
            <span>Zen: <strong className="text-white">{zenHigh}</strong></span>
          </div>
        </div>

        {/* Controls hint */}
        <div className="text-neutral-400 font-medium">
          Drag Mouse or Swipe to Slice · Esc to Pause
        </div>
      </div>

      {/* Monetization Settings Modal */}
      <MonetizationSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
