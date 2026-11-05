import {
  ActiveFruit,
  BladeType,
  FloatingText,
  FruitConfig,
  FruitId,
  GameMode,
  GameStats,
  JuiceParticle,
  Point,
  SlicedHalf,
  TrailPoint,
  WallStain,
} from './types';
import { FRUIT_CATALOG, renderSlicedHalf, renderWholeFruit } from './fruits';
import { BLADES, renderBladeTrail } from './blades';
import { audio } from './audio';

const DOJO_BG_SRC = '/src/assets/images/dojo_wood_backdrop_1793905961756.jpg';

export interface GameEngineCallbacks {
  onScoreUpdate: (score: number) => void;
  onLivesUpdate: (lives: number) => void;
  onTimerUpdate: (secondsLeft: number) => void;
  onPowerUpUpdate: (powerUps: { freeze: number; frenzy: number; double: number }) => void;
  onGameOver: (stats: GameStats) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: GameEngineCallbacks;

  private mode: GameMode = 'classic';
  private blade: BladeType = 'katana';
  private isRunning: boolean = false;
  private isPaused: boolean = false;

  private width: number = 800;
  private height: number = 600;

  // Background image
  private bgImage: HTMLImageElement | null = null;
  private bgLoaded: boolean = false;

  // Game state
  private score: number = 0;
  private lives: number = 3;
  private maxLives: number = 3;
  private timeRemaining: number = 60;
  private slicedCount: number = 0;
  private bestCombo: number = 0;
  private bombsAvoided: number = 0;
  private specialFruitsSliced: number = 0;

  // Timers & Waves
  private gameTime: number = 0;
  private spawnTimer: number = 0;
  private nextWaveInterval: number = 2.2;
  private freezeTime: number = 0;
  private frenzyTime: number = 0;
  private doubleTime: number = 0;

  // Entity Lists
  private fruits: ActiveFruit[] = [];
  private slicedHalves: SlicedHalf[] = [];
  private particles: JuiceParticle[] = [];
  private wallStains: WallStain[] = [];
  private floatingTexts: FloatingText[] = [];

  // Swipe & Trail
  private isSwiping: boolean = false;
  private currentTrail: TrailPoint[] = [];
  private swipeSegment: { p1: Point; p2: Point } | null = null;
  private activeSwipeFruits: { fruit: ActiveFruit; time: number }[] = [];
  private lastSwipeTime: number = 0;

  // Screen Feel Effects
  private hitstopTimer: number = 0;
  private screenShake: number = 0;
  private screenFlash: { color: string; alpha: number } | null = null;

  // Unique ID counters
  private nextFruitId: number = 1;
  private nextTextId: number = 1;

  // Loop handle
  private animFrameId: number | null = null;
  private lastFrameTimestamp: number = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: GameEngineCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.callbacks = callbacks;

    this.loadBackground();
    this.handleResize();
    this.attachInputs();
  }

  private loadBackground() {
    this.bgImage = new Image();
    this.bgImage.crossOrigin = 'anonymous';
    this.bgImage.src = DOJO_BG_SRC;
    this.bgImage.onload = () => {
      this.bgLoaded = true;
    };
    this.bgImage.onerror = () => {
      this.bgLoaded = false;
    };
  }

  public handleResize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.parentElement?.getBoundingClientRect() || {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);
  }

  public setBlade(blade: BladeType) {
    this.blade = blade;
  }

  public start(mode: GameMode, blade: BladeType = this.blade) {
    this.mode = mode;
    this.blade = blade;
    this.isRunning = true;
    this.isPaused = false;

    this.score = 0;
    this.slicedCount = 0;
    this.bestCombo = 0;
    this.bombsAvoided = 0;
    this.specialFruitsSliced = 0;
    this.gameTime = 0;
    this.spawnTimer = 0.8; // first wave arrives quickly
    this.freezeTime = 0;
    this.frenzyTime = 0;
    this.doubleTime = 0;
    this.hitstopTimer = 0;
    this.screenShake = 0;
    this.screenFlash = null;

    if (mode === 'classic') {
      this.lives = 3;
      this.timeRemaining = 0;
    } else if (mode === 'arcade') {
      this.lives = 999;
      this.timeRemaining = 60;
    } else {
      // Zen
      this.lives = 999;
      this.timeRemaining = 90;
    }

    this.fruits = [];
    this.slicedHalves = [];
    this.particles = [];
    this.wallStains = [];
    this.floatingTexts = [];
    this.currentTrail = [];
    this.activeSwipeFruits = [];

    this.callbacks.onScoreUpdate(this.score);
    this.callbacks.onLivesUpdate(this.lives);
    this.callbacks.onTimerUpdate(this.timeRemaining);
    this.callbacks.onPowerUpUpdate({ freeze: 0, frenzy: 0, double: 0 });

    this.lastFrameTimestamp = performance.now();
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.animFrameId = requestAnimationFrame(this.gameLoop);
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    if (this.isPaused && this.isRunning) {
      this.isPaused = false;
      this.lastFrameTimestamp = performance.now();
    }
  }

  public stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public destroy() {
    this.stop();
    this.detachInputs();
  }

  // --- Input Handling ---
  private onPointerDown = (e: MouseEvent | TouchEvent) => {
    const pt = this.getCanvasPoint(e);
    this.isSwiping = true;
    this.currentTrail = [{ x: pt.x, y: pt.y, time: performance.now() / 1000, width: 8 }];
    this.lastSwipeTime = performance.now() / 1000;
  };

  private onPointerMove = (e: MouseEvent | TouchEvent) => {
    if (!this.isSwiping) return;
    const pt = this.getCanvasPoint(e);
    const now = performance.now() / 1000;

    const lastPoint = this.currentTrail[this.currentTrail.length - 1];
    if (lastPoint) {
      const dx = pt.x - lastPoint.x;
      const dy = pt.y - lastPoint.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 4) {
        // Fast swipe whoosh sound
        const dt = Math.max(0.001, now - lastPoint.time);
        const speed = dist / dt;
        if (speed > 800) {
          audio.playSwoosh(speed / 1200);
        }

        // Spawn blade sparks
        const bladeConfig = BLADES[this.blade];
        if (Math.random() < 0.6) {
          const sparkColor =
            bladeConfig.particleColor[
              Math.floor(Math.random() * bladeConfig.particleColor.length)
            ];
          this.particles.push({
            x: pt.x + (Math.random() * 8 - 4),
            y: pt.y + (Math.random() * 8 - 4),
            vx: (Math.random() * 80 - 40) - dx * 0.1,
            vy: (Math.random() * 80 - 40) - dy * 0.1,
            radius: Math.random() * 2.5 + 1.2,
            color: sparkColor,
            alpha: 1,
            decay: 2.5,
            isSpark: true,
          });
        }

        this.currentTrail.push({ x: pt.x, y: pt.y, time: now, width: 8 });
        this.checkSliceSegment(lastPoint, pt);
      }
    } else {
      this.currentTrail.push({ x: pt.x, y: pt.y, time: now, width: 8 });
    }
  };

  private onPointerUp = () => {
    this.isSwiping = false;
    this.finalizeSwipeCombo();
  };

  private getCanvasPoint(e: MouseEvent | TouchEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
      time: performance.now() / 1000,
    };
  }

  private attachInputs() {
    this.canvas.addEventListener('mousedown', this.onPointerDown);
    window.addEventListener('mousemove', this.onPointerMove);
    window.addEventListener('mouseup', this.onPointerUp);

    this.canvas.addEventListener('touchstart', this.onPointerDown, { passive: true });
    window.addEventListener('touchmove', this.onPointerMove, { passive: true });
    window.addEventListener('touchend', this.onPointerUp);
    window.addEventListener('touchcancel', this.onPointerUp);
  }

  private detachInputs() {
    this.canvas.removeEventListener('mousedown', this.onPointerDown);
    window.removeEventListener('mousemove', this.onPointerMove);
    window.removeEventListener('mouseup', this.onPointerUp);

    this.canvas.removeEventListener('touchstart', this.onPointerDown);
    window.removeEventListener('touchmove', this.onPointerMove);
    window.removeEventListener('touchend', this.onPointerUp);
    window.removeEventListener('touchcancel', this.onPointerUp);
  }

  // --- Slicing Collision Detection ---
  private checkSliceSegment(p1: Point, p2: Point) {
    if (!this.isRunning || this.isPaused) return;

    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const fruit = this.fruits[i];
      if (fruit.sliced) continue;

      if (this.lineIntersectsCircle(p1, p2, { x: fruit.x, y: fruit.y }, fruit.radius)) {
        this.sliceFruit(fruit, p1, p2);
      }
    }
  }

  private lineIntersectsCircle(p1: Point, p2: Point, c: { x: number; y: number }, r: number): boolean {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lenSq = dx * dx + dy * dy;

    if (lenSq === 0) {
      return Math.hypot(p1.x - c.x, p1.y - c.y) <= r;
    }

    // Projection scalar t clamped to [0, 1]
    const t = Math.max(0, Math.min(1, ((c.x - p1.x) * dx + (c.y - p1.y) * dy) / lenSq));
    const closestX = p1.x + t * dx;
    const closestY = p1.y + t * dy;

    const distSq = (c.x - closestX) * (c.x - closestX) + (c.y - closestY) * (c.y - closestY);
    return distSq <= r * r;
  }

  private sliceFruit(fruit: ActiveFruit, p1: Point, p2: Point) {
    fruit.sliced = true;
    const now = performance.now() / 1000;

    // Check if bomb
    if (fruit.config.isBomb) {
      this.handleBombSlice(fruit);
      return;
    }

    // Audio & tactile hitstop
    audio.playSlice(fruit.config.radius > 40);
    this.hitstopTimer = 0.035; // 35ms micro freeze
    this.screenShake = 3;

    // Cut angle & normal
    const cutAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const normalAngle = cutAngle + Math.PI / 2;
    const separationSpeed = 160 + Math.random() * 40;

    // 1. Spawn Sliced Halves
    const leftVx = fruit.vx + Math.cos(normalAngle) * separationSpeed;
    const leftVy = fruit.vy + Math.sin(normalAngle) * separationSpeed - 60;
    const rightVx = fruit.vx - Math.cos(normalAngle) * separationSpeed;
    const rightVy = fruit.vy - Math.sin(normalAngle) * separationSpeed - 60;

    this.slicedHalves.push({
      id: Math.random(),
      config: fruit.config,
      side: 'left',
      x: fruit.x - Math.cos(normalAngle) * 8,
      y: fruit.y - Math.sin(normalAngle) * 8,
      vx: leftVx,
      vy: leftVy,
      rotation: fruit.rotation,
      vRot: -2.5 - Math.random() * 3,
      radius: fruit.radius,
      cutAngle,
      alpha: 1,
    });

    this.slicedHalves.push({
      id: Math.random(),
      config: fruit.config,
      side: 'right',
      x: fruit.x + Math.cos(normalAngle) * 8,
      y: fruit.y + Math.sin(normalAngle) * 8,
      vx: rightVx,
      vy: rightVy,
      rotation: fruit.rotation,
      vRot: 2.5 + Math.random() * 3,
      radius: fruit.radius,
      cutAngle,
      alpha: 1,
    });

    // 2. Spawn Splash Droplets
    const numDroplets = 16 + Math.floor(Math.random() * 10);
    const colors = fruit.config.juiceDropsColor;
    for (let i = 0; i < numDroplets; i++) {
      const spread = (Math.random() - 0.5) * Math.PI * 0.9;
      const angle = (Math.random() < 0.5 ? normalAngle : normalAngle + Math.PI) + spread;
      const speed = 100 + Math.random() * 240;
      const dropColor = colors[Math.floor(Math.random() * colors.length)];

      this.particles.push({
        x: fruit.x + (Math.random() * 16 - 8),
        y: fruit.y + (Math.random() * 16 - 8),
        vx: Math.cos(angle) * speed + fruit.vx * 0.4,
        vy: Math.sin(angle) * speed + fruit.vy * 0.4,
        radius: Math.random() * 4 + 2,
        color: dropColor,
        alpha: 1,
        decay: 1.2 + Math.random() * 0.8,
      });
    }

    // 3. Wall Juice Stain on wooden backdrop
    if (Math.random() < 0.85) {
      const numDrips = 2 + Math.floor(Math.random() * 3);
      const drips = [];
      for (let d = 0; d < numDrips; d++) {
        drips.push({
          x: (Math.random() - 0.5) * (fruit.radius * 0.8),
          y: 0,
          length: 15 + Math.random() * 40,
          speed: 12 + Math.random() * 20,
          currentLen: 0,
        });
      }

      this.wallStains.push({
        x: fruit.x,
        y: fruit.y,
        radius: fruit.radius * (0.6 + Math.random() * 0.4),
        color: fruit.config.splashColor,
        alpha: 0.65,
        drips,
      });
      // Cap wall stains to keep performance crisp
      if (this.wallStains.length > 25) {
        this.wallStains.shift();
      }
    }

    // 4. Points calculation
    let earnedPoints = fruit.config.points;
    if (this.doubleTime > 0) {
      earnedPoints *= 2;
    }
    this.score += earnedPoints;
    this.slicedCount++;

    // 5. Special Fruit Powers
    if (fruit.config.isSpecial) {
      this.specialFruitsSliced++;
      if (fruit.config.specialType === 'freeze') {
        this.freezeTime = 5.0;
        audio.playFreeze();
        this.addFloatingText('FREEZE TIME!', fruit.x, fruit.y - 30, '#06b6d4', 1.4);
      } else if (fruit.config.specialType === 'frenzy') {
        this.frenzyTime = 5.0;
        audio.playFrenzy();
        this.addFloatingText('FRUIT FRENZY!', fruit.x, fruit.y - 30, '#f59e0b', 1.4);
        this.triggerFrenzyBurst();
      } else if (fruit.config.specialType === 'double') {
        this.doubleTime = 6.0;
        audio.playFreeze();
        this.addFloatingText('2X POINTS!', fruit.x, fruit.y - 30, '#a855f7', 1.4);
      }
    }

    // Floating score popup
    const scoreColor = this.doubleTime > 0 ? '#facc15' : '#ffffff';
    this.addFloatingText(`+${earnedPoints}`, fruit.x, fruit.y, scoreColor, 1.1);

    // Track for combo
    this.activeSwipeFruits.push({ fruit, time: now });
    this.callbacks.onScoreUpdate(this.score);
  }

  private handleBombSlice(bomb: ActiveFruit) {
    audio.playExplosion();
    this.screenFlash = { color: '#ffffff', alpha: 1 };
    this.screenShake = 18;
    this.hitstopTimer = 0.08;

    // Bomb particle burst
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 380;
      const isFire = Math.random() < 0.6;
      this.particles.push({
        x: bomb.x,
        y: bomb.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 5 + 3,
        color: isFire ? '#f97316' : '#27272a',
        alpha: 1,
        decay: 1.5 + Math.random(),
        isSpark: true,
      });
    }

    if (this.mode === 'classic') {
      this.addFloatingText('BOMB!', bomb.x, bomb.y, '#ef4444', 1.8);
      // Classic mode: instant death
      setTimeout(() => {
        this.triggerGameOver();
      }, 300);
    } else {
      // Arcade mode: -10 points and clears screen
      this.score = Math.max(0, this.score - 10);
      this.addFloatingText('-10 BOMB HIT!', bomb.x, bomb.y, '#ef4444', 1.5);
      this.callbacks.onScoreUpdate(this.score);
      // Explode and clear nearby fruits
      this.fruits.forEach((f) => {
        if (!f.sliced) f.missed = true;
      });
    }
  }

  private finalizeSwipeCombo() {
    const count = this.activeSwipeFruits.length;
    if (count >= 3) {
      let bonus = count;
      let label = `${count}x COMBO!`;
      let color = '#38bdf8';

      if (count === 3) {
        bonus = 3;
        label = '3x COMBO!';
        color = '#38bdf8';
      } else if (count === 4) {
        bonus = 5;
        label = '4x GREAT COMBO!';
        color = '#4ade80';
      } else if (count === 5) {
        bonus = 8;
        label = '5x SUPER COMBO!';
        color = '#fbbf24';
      } else {
        bonus = 12;
        label = `${count}x BLITZ COMBO!`;
        color = '#f43f5e';
      }

      if (this.doubleTime > 0) bonus *= 2;
      this.score += bonus;
      this.callbacks.onScoreUpdate(this.score);

      if (count > this.bestCombo) {
        this.bestCombo = count;
      }

      audio.playCombo(count);

      // Average position for combo text
      const avgX =
        this.activeSwipeFruits.reduce((sum, item) => sum + item.fruit.x, 0) / count;
      const avgY =
        this.activeSwipeFruits.reduce((sum, item) => sum + item.fruit.y, 0) / count;

      this.addFloatingText(`${label} +${bonus}`, avgX, avgY - 20, color, 1.5);

      // Reward life in classic mode for high combo
      if (this.mode === 'classic' && count >= 5 && this.lives < this.maxLives) {
        this.lives++;
        this.callbacks.onLivesUpdate(this.lives);
        this.addFloatingText('+1 LIFE RECOVERED!', avgX, avgY - 50, '#22c55e', 1.3);
      }
    }

    this.activeSwipeFruits = [];
  }

  private addFloatingText(
    text: string,
    x: number,
    y: number,
    color: string,
    scale: number = 1
  ) {
    this.floatingTexts.push({
      id: this.nextTextId++,
      text,
      x,
      y,
      color,
      scale,
      alpha: 1,
      vy: -55,
      lifetime: 0,
      maxLife: 1.1,
    });
  }

  // --- Fruit Wave Spawning ---
  private updateSpawner(dt: number) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnWave();
      // Wave interval gets slightly tighter with score
      const baseInterval = this.frenzyTime > 0 ? 0.6 : 2.0;
      const scoreRamp = Math.min(0.6, (this.score / 150) * 0.5);
      this.spawnTimer = Math.max(0.7, baseInterval - scoreRamp + Math.random() * 0.5);
    }
  }

  private spawnWave() {
    const numFruits =
      this.frenzyTime > 0
        ? 3 + Math.floor(Math.random() * 3)
        : Math.min(5, 1 + Math.floor(Math.random() * 3) + Math.floor(this.score / 50));

    // Choose fruit keys
    const fruitKeys: FruitId[] = [
      'watermelon',
      'orange',
      'apple',
      'banana',
      'strawberry',
      'pineapple',
      'coconut',
      'dragonfruit',
      'kiwi',
    ];

    // Bomb chance (0 in Zen, rare early, higher in Arcade/Classic)
    const canSpawnBomb = this.mode !== 'zen' && this.score >= 5;
    const bombChance = this.mode === 'arcade' ? 0.28 : 0.2;
    const spawnBombInWave = canSpawnBomb && Math.random() < bombChance;

    // Special fruit chance in Arcade mode
    const canSpawnSpecial = this.mode === 'arcade' && Math.random() < 0.22;
    const specialKeys: FruitId[] = ['freeze_banana', 'frenzy_dragon', 'double_star'];

    for (let i = 0; i < numFruits; i++) {
      let chosenId: FruitId;

      if (i === 0 && spawnBombInWave) {
        chosenId = 'bomb';
      } else if (i === 1 && canSpawnSpecial) {
        chosenId = specialKeys[Math.floor(Math.random() * specialKeys.length)];
      } else {
        chosenId = fruitKeys[Math.floor(Math.random() * fruitKeys.length)];
      }

      this.launchFruit(FRUIT_CATALOG[chosenId]);
    }
  }

  private triggerFrenzyBurst() {
    // Launch a flurry of juicy fruits from left and right!
    const frenzyFruits: FruitId[] = [
      'watermelon',
      'strawberry',
      'orange',
      'kiwi',
      'banana',
      'pineapple',
    ];
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        if (!this.isRunning || this.isPaused) return;
        const id = frenzyFruits[Math.floor(Math.random() * frenzyFruits.length)];
        this.launchFruit(FRUIT_CATALOG[id], Math.random() < 0.5 ? 'left' : 'right');
      }, i * 140);
    }
  }

  private launchFruit(config: FruitConfig, side?: 'left' | 'right') {
    const r = config.radius;
    let spawnX: number;
    let spawnY = this.height + r + 10;
    let vx: number;
    let vy: number;

    const gravity = 880; // px/s^2

    if (side === 'left') {
      spawnX = -r;
      spawnY = this.height * 0.4 + Math.random() * (this.height * 0.35);
      vx = 320 + Math.random() * 200;
      vy = -280 - Math.random() * 220;
    } else if (side === 'right') {
      spawnX = this.width + r;
      spawnY = this.height * 0.4 + Math.random() * (this.height * 0.35);
      vx = -320 - Math.random() * 200;
      vy = -280 - Math.random() * 220;
    } else {
      // Standard launch from bottom
      const margin = Math.min(this.width * 0.15, 120);
      spawnX = margin + Math.random() * (this.width - margin * 2);

      // Target apex height in upper 25% - 40% of screen
      const apexY = this.height * (0.2 + Math.random() * 0.25);
      const deltaY = spawnY - apexY;
      // vy = -sqrt(2 * g * h)
      vy = -Math.sqrt(2 * gravity * deltaY);

      // vx aims toward center
      const targetX = this.width * 0.25 + Math.random() * (this.width * 0.5);
      const flightTimeToApex = Math.abs(vy) / gravity;
      vx = (targetX - spawnX) / flightTimeToApex;
    }

    this.fruits.push({
      id: this.nextFruitId++,
      config,
      x: spawnX,
      y: spawnY,
      vx,
      vy,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 5,
      radius: r,
      sliced: false,
      missed: false,
      sparkTimer: 0,
    });
  }

  // --- Main 60fps Loop ---
  private gameLoop = (timestamp: number) => {
    if (!this.isRunning) return;

    const rawDt = (timestamp - this.lastFrameTimestamp) / 1000;
    this.lastFrameTimestamp = timestamp;

    // Clamp dt to 50ms to prevent simulation explosion on lag spikes
    let dt = Math.min(rawDt, 0.05);

    if (!this.isPaused) {
      // Hitstop delay check
      if (this.hitstopTimer > 0) {
        this.hitstopTimer -= dt;
      } else {
        // Slow time if Freeze Power-Up is active
        const timeScale = this.freezeTime > 0 ? 0.35 : 1.0;
        const scaledDt = dt * timeScale;

        this.updateGame(scaledDt, dt);
      }
    }

    this.render();

    this.animFrameId = requestAnimationFrame(this.gameLoop);
  };

  private updateGame(scaledDt: number, rawDt: number) {
    this.gameTime += rawDt;

    // Power-up countdowns
    if (this.freezeTime > 0) {
      this.freezeTime = Math.max(0, this.freezeTime - rawDt);
    }
    if (this.frenzyTime > 0) {
      this.frenzyTime = Math.max(0, this.frenzyTime - rawDt);
    }
    if (this.doubleTime > 0) {
      this.doubleTime = Math.max(0, this.doubleTime - rawDt);
    }

    this.callbacks.onPowerUpUpdate({
      freeze: this.freezeTime,
      frenzy: this.frenzyTime,
      double: this.doubleTime,
    });

    // Arcade & Zen Timer
    if (this.mode !== 'classic') {
      this.timeRemaining -= rawDt;
      this.callbacks.onTimerUpdate(Math.max(0, Math.ceil(this.timeRemaining)));
      if (this.timeRemaining <= 0) {
        this.triggerGameOver();
        return;
      }
    }

    // Screen Shake & Flash decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - rawDt * 18);
    }
    if (this.screenFlash) {
      this.screenFlash.alpha -= rawDt * 2.5;
      if (this.screenFlash.alpha <= 0) this.screenFlash = null;
    }

    // Spawner
    this.updateSpawner(rawDt);

    // Update Fruits
    const gravity = 880; // px/s^2
    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const f = this.fruits[i];
      f.x += f.vx * scaledDt;
      f.y += f.vy * scaledDt;
      f.vy += gravity * scaledDt;
      f.rotation += f.vRot * scaledDt;
      if (f.sparkTimer !== undefined) f.sparkTimer += scaledDt;

      // Check if dropped below screen
      if (f.y > this.height + f.radius * 2 && f.vy > 0) {
        if (!f.sliced && !f.missed) {
          f.missed = true;
          // In classic mode, dropped normal fruits cost a life
          if (this.mode === 'classic' && !f.config.isBomb) {
            this.lives--;
            audio.playMiss();
            this.callbacks.onLivesUpdate(this.lives);
            this.addFloatingText('X', f.x, this.height - 40, '#ef4444', 1.6);

            if (this.lives <= 0) {
              this.triggerGameOver();
              return;
            }
          } else if (f.config.isBomb) {
            this.bombsAvoided++;
          }
        }
        this.fruits.splice(i, 1);
      }
    }

    // Update Sliced Halves
    for (let i = this.slicedHalves.length - 1; i >= 0; i--) {
      const h = this.slicedHalves[i];
      h.x += h.vx * scaledDt;
      h.y += h.vy * scaledDt;
      h.vy += gravity * 1.1 * scaledDt;
      h.rotation += h.vRot * scaledDt;

      if (h.y > this.height + h.radius * 2) {
        this.slicedHalves.splice(i, 1);
      }
    }

    // Update Juice Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * scaledDt;
      p.y += p.vy * scaledDt;
      p.vy += (p.isSpark ? 200 : 700) * scaledDt;
      p.alpha -= p.decay * scaledDt;

      if (p.alpha <= 0 || p.y > this.height) {
        this.particles.splice(i, 1);
      }
    }

    // Update Wall Stains
    for (let i = this.wallStains.length - 1; i >= 0; i--) {
      const s = this.wallStains[i];
      // Slow fade over 25 seconds
      s.alpha -= rawDt * 0.04;

      // Update drips
      s.drips.forEach((d) => {
        if (d.currentLen < d.length) {
          d.currentLen += d.speed * rawDt;
        }
      });

      if (s.alpha <= 0) {
        this.wallStains.splice(i, 1);
      }
    }

    // Update Floating Text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.lifetime += rawDt;
      t.y += t.vy * rawDt;
      t.alpha = Math.max(0, 1 - t.lifetime / t.maxLife);

      if (t.lifetime >= t.maxLife) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Clean old trail points
    const now = performance.now() / 1000;
    this.currentTrail = this.currentTrail.filter((p) => now - p.time < 0.22);
  }

  private triggerGameOver() {
    this.isRunning = false;
    audio.playGameOver();

    const savedHigh = Number(localStorage.getItem(`fruit_slice_high_${this.mode}`) || 0);
    const newHigh = Math.max(savedHigh, this.score);
    localStorage.setItem(`fruit_slice_high_${this.mode}`, String(newHigh));

    const stats: GameStats = {
      score: this.score,
      highScore: newHigh,
      slicedCount: this.slicedCount,
      bestCombo: this.bestCombo,
      bombsAvoided: this.bombsAvoided,
      specialFruitsSliced: this.specialFruitsSliced,
      mode: this.mode,
    };

    this.callbacks.onGameOver(stats);
  }

  // Revive player from rewarded ad or free Dojo honor
  public revive(extraLives: number = 1) {
    this.isRunning = true;
    this.isPaused = false;
    this.hitstopTimer = 0;
    this.screenShake = 0;
    this.screenFlash = null;

    if (this.mode === 'classic') {
      this.lives = Math.min(this.maxLives, extraLives);
      this.callbacks.onLivesUpdate(this.lives);
    } else {
      this.timeRemaining = Math.max(15, this.timeRemaining + 15);
      this.callbacks.onTimerUpdate(Math.ceil(this.timeRemaining));
    }

    // Clear active bombs and falling fruits to give a clean moment
    this.fruits = [];
    this.activeSwipeFruits = [];

    // Brief slow-mo so player can prepare
    this.freezeTime = 2.0;

    this.addFloatingText(
      this.mode === 'classic' ? '+1 EXTRA LIFE! पुनर्जीवन!' : '+15s TIME BONUS!',
      this.width / 2,
      this.height / 2,
      '#22c55e',
      1.6
    );

    audio.playFreeze();

    this.lastFrameTimestamp = performance.now();
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.animFrameId = requestAnimationFrame(this.gameLoop);
  }

  // --- Rendering Pipeline ---
  private render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.save();

    // Camera Screen Shake
    if (this.screenShake > 0) {
      const ox = (Math.random() - 0.5) * this.screenShake;
      const oy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(ox, oy);
    }

    // 1. Dojo Wooden Background
    if (this.bgLoaded && this.bgImage) {
      ctx.drawImage(this.bgImage, 0, 0, w, h);
    } else {
      // Procedural rich timber plank fallback
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#2e180d');
      grad.addColorStop(0.5, '#1e0f08');
      grad.addColorStop(1, '#110804');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 3;
      for (let y = 0; y < h; y += 75) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }

    // Subtle dark vignette for high contrast playfield
    const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.85);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    // 2. Wall Juice Stains
    this.renderWallStains(ctx);

    // 3. Sliced Fruit Halves
    this.slicedHalves.forEach((half) => {
      ctx.save();
      ctx.translate(half.x, half.y);
      ctx.rotate(half.rotation);
      ctx.globalAlpha = half.alpha;
      renderSlicedHalf(ctx, half.config, half.side);
      ctx.restore();
    });

    // 4. Whole Flying Fruits
    this.fruits.forEach((fruit) => {
      if (fruit.sliced) return;
      ctx.save();
      ctx.translate(fruit.x, fruit.y);
      ctx.rotate(fruit.rotation);
      renderWholeFruit(ctx, fruit.config, fruit.sparkTimer || 0);
      ctx.restore();
    });

    // 5. Juice Droplets & Sparks
    this.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 6. Blade Slash Trail
    const bladeConfig = BLADES[this.blade];
    renderBladeTrail(ctx, this.currentTrail, bladeConfig, performance.now() / 1000);

    // 7. Floating Text / Combo Popups
    this.renderFloatingText(ctx);

    // 8. Freeze Frost Screen Border Vignette
    if (this.freezeTime > 0) {
      const frostAlpha = Math.min(0.55, this.freezeTime * 0.25);
      const frostGrad = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.75);
      frostGrad.addColorStop(0, 'rgba(6, 182, 212, 0)');
      frostGrad.addColorStop(1, `rgba(6, 182, 212, ${frostAlpha})`);
      ctx.fillStyle = frostGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // 9. Screen Flash (Bomb impact)
    if (this.screenFlash) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.screenFlash.alpha})`;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();
  }

  private renderWallStains(ctx: CanvasRenderingContext2D) {
    this.wallStains.forEach((stain) => {
      ctx.save();
      ctx.globalAlpha = stain.alpha;
      ctx.fillStyle = stain.color;

      // Central juice puddle stamp
      ctx.beginPath();
      ctx.arc(stain.x, stain.y, stain.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Splatter lobes
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI * 2) / 6;
        const dist = stain.radius * 0.7;
        ctx.beginPath();
        ctx.arc(
          stain.x + Math.cos(a) * dist,
          stain.y + Math.sin(a) * dist,
          stain.radius * 0.25,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Trickling juice drip trails
      ctx.strokeStyle = stain.color;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      stain.drips.forEach((drip) => {
        if (drip.currentLen > 0) {
          ctx.beginPath();
          ctx.moveTo(stain.x + drip.x, stain.y);
          ctx.lineTo(stain.x + drip.x, stain.y + drip.currentLen);
          ctx.stroke();

          // Drip bead droplet
          ctx.beginPath();
          ctx.arc(stain.x + drip.x, stain.y + drip.currentLen, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      ctx.restore();
    });
  }

  private renderFloatingText(ctx: CanvasRenderingContext2D) {
    this.floatingTexts.forEach((t) => {
      ctx.save();
      ctx.globalAlpha = t.alpha;
      ctx.translate(t.x, t.y);
      ctx.scale(t.scale, t.scale);

      ctx.font = '900 24px "Bricolage Grotesque", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Deep shadow / outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(t.text, 0, 0);

      ctx.fillStyle = t.color;
      ctx.fillText(t.text, 0, 0);

      ctx.restore();
    });
  }
}
