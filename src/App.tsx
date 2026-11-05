import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { BladeType, GameMode, GameState, GameStats } from './game/types';
import { audio } from './game/audio';
import { InGameHUD } from './components/InGameHUD';
import { TitleScreen } from './components/TitleScreen';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { InterstitialAdModal } from './components/InterstitialAdModal';
import { adManager } from './monetization/adManager';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [selectedBlade, setSelectedBlade] = useState<BladeType>('katana');
  const [isMuted, setIsMuted] = useState<boolean>(() => audio.getIsMuted());

  // In-Game Real-time state
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const [powerUps, setPowerUps] = useState<{ freeze: number; frenzy: number; double: number }>({
    freeze: 0,
    frenzy: 0,
    double: 0,
  });

  // Rewarded extra life state (1 revive allowed per run)
  const [hasRevivedThisRun, setHasRevivedThisRun] = useState<boolean>(false);

  // Interstitial ad state (after every 3 completed sessions, gated by frequency limit)
  const [isInterstitialOpen, setIsInterstitialOpen] = useState<boolean>(false);
  const [pendingInterstitial, setPendingInterstitial] = useState<boolean>(false);
  const [postInterstitialAction, setPostInterstitialAction] = useState<'restart' | 'home' | null>(null);

  // End game stats
  const [lastStats, setLastStats] = useState<GameStats>({
    score: 0,
    highScore: 0,
    slicedCount: 0,
    bestCombo: 0,
    bombsAvoided: 0,
    specialFruitsSliced: 0,
    mode: 'classic',
  });

  // Initialize Canvas & Game Engine once
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current, {
      onScoreUpdate: (newScore) => {
        setScore(newScore);
      },
      onLivesUpdate: (newLives) => {
        setLives(newLives);
      },
      onTimerUpdate: (secondsLeft) => {
        setTimeRemaining(secondsLeft);
      },
      onPowerUpUpdate: (pu) => {
        setPowerUps(pu);
      },
      onGameOver: (stats) => {
        setLastStats(stats);
        setGameState('GAME_OVER');

        // Requirement 4: Record completed game session for 3-session interstitial frequency
        const { shouldShowInterstitial } = adManager.recordGameSessionCompleted();
        setPendingInterstitial(shouldShowInterstitial);
      },
    });

    engineRef.current = engine;

    const handleResize = () => {
      engine.handleResize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.destroy();
    };
  }, []);

  // Update blade when changed
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setBlade(selectedBlade);
    }
  }, [selectedBlade]);

  // Keyboard controls (Esc to pause, Enter to start)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (gameState === 'PLAYING') {
          engineRef.current?.pause();
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          engineRef.current?.resume();
          setGameState('PLAYING');
        }
      } else if ((e.key === ' ' || e.key === 'Enter') && gameState === 'TITLE') {
        startGame(gameMode, selectedBlade);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, gameMode, selectedBlade]);

  // Audio mute toggle
  const handleToggleMute = useCallback(() => {
    const newMuted = audio.toggleMute();
    setIsMuted(newMuted);
  }, []);

  // Start Game
  const startGame = useCallback((mode: GameMode, blade: BladeType) => {
    setGameMode(mode);
    setSelectedBlade(blade);
    setScore(0);
    setLives(mode === 'classic' ? 3 : 999);
    setTimeRemaining(mode === 'classic' ? 0 : mode === 'arcade' ? 60 : 90);
    setPowerUps({ freeze: 0, frenzy: 0, double: 0 });
    setHasRevivedThisRun(false);
    setPendingInterstitial(false);

    setGameState('PLAYING');
    engineRef.current?.start(mode, blade);
  }, []);

  // Requirement 2: Rewarded Ad Option - Watch Ad – Get 1 Extra Life
  const handleExtraLifeRevive = useCallback(() => {
    setHasRevivedThisRun(true);
    setGameState('PLAYING');
    engineRef.current?.revive(1);
  }, []);

  // Pause & Resume
  const handlePause = useCallback(() => {
    engineRef.current?.pause();
    setGameState('PAUSED');
  }, []);

  const handleResume = useCallback(() => {
    engineRef.current?.resume();
    setGameState('PLAYING');
  }, []);

  // Trigger Navigation after checking Interstitial (Requirement 4 & 5: Never during active gameplay)
  const handleGameOverRestart = useCallback(() => {
    if (pendingInterstitial && adManager.isConfigured()) {
      setPostInterstitialAction('restart');
      setIsInterstitialOpen(true);
    } else {
      startGame(gameMode, selectedBlade);
    }
  }, [pendingInterstitial, gameMode, selectedBlade, startGame]);

  const handleGameOverHome = useCallback(() => {
    if (pendingInterstitial && adManager.isConfigured()) {
      setPostInterstitialAction('home');
      setIsInterstitialOpen(true);
    } else {
      engineRef.current?.stop();
      setGameState('TITLE');
    }
  }, [pendingInterstitial]);

  const handleCloseInterstitial = useCallback(() => {
    setIsInterstitialOpen(false);
    setPendingInterstitial(false);
    const action = postInterstitialAction;
    setPostInterstitialAction(null);

    if (action === 'restart') {
      startGame(gameMode, selectedBlade);
    } else {
      engineRef.current?.stop();
      setGameState('TITLE');
    }
  }, [postInterstitialAction, gameMode, selectedBlade, startGame]);

  const handleQuitToMenu = useCallback(() => {
    engineRef.current?.stop();
    setGameState('TITLE');
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0604] select-none font-sans">
      {/* 60fps Isolated HTML5 Canvas Viewport */}
      <div className="absolute inset-0 w-full h-full">
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-crosshair touch-none"
        />
      </div>

      {/* Screen Views based on Game State */}
      {gameState === 'TITLE' && (
        <TitleScreen
          onStartGame={startGame}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          selectedBlade={selectedBlade}
          onSelectBlade={setSelectedBlade}
        />
      )}

      {gameState === 'PLAYING' && (
        <InGameHUD
          score={score}
          lives={lives}
          timeRemaining={timeRemaining}
          mode={gameMode}
          blade={selectedBlade}
          isMuted={isMuted}
          powerUps={powerUps}
          onPause={handlePause}
          onToggleMute={handleToggleMute}
        />
      )}

      {gameState === 'PAUSED' && (
        <PauseModal
          score={score}
          mode={gameMode}
          isMuted={isMuted}
          onResume={handleResume}
          onRestart={() => startGame(gameMode, selectedBlade)}
          onQuit={handleQuitToMenu}
          onToggleMute={handleToggleMute}
        />
      )}

      {gameState === 'GAME_OVER' && (
        <GameOverModal
          stats={lastStats}
          onPlayAgain={handleGameOverRestart}
          onHome={handleGameOverHome}
          onExtraLifeRevive={handleExtraLifeRevive}
          canRevive={!hasRevivedThisRun}
        />
      )}

      {/* Requirement 4: Interstitial Ad Placement after every 3 completed game sessions */}
      {/* Requirement 7: Hidden until configured & approved */}
      <InterstitialAdModal
        isOpen={isInterstitialOpen}
        onClose={handleCloseInterstitial}
      />
    </div>
  );
}
