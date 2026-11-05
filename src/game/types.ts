export type GameMode = 'classic' | 'arcade' | 'zen';

export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type BladeType = 'katana' | 'inferno' | 'frost' | 'rainbow' | 'shadow';

export type FruitId =
  | 'watermelon'
  | 'orange'
  | 'apple'
  | 'banana'
  | 'strawberry'
  | 'pineapple'
  | 'coconut'
  | 'dragonfruit'
  | 'kiwi'
  | 'freeze_banana'
  | 'frenzy_dragon'
  | 'double_star'
  | 'bomb';

export interface FruitConfig {
  id: FruitId;
  nameEn: string;
  nameHi: string;
  points: number;
  radius: number;
  isBomb?: boolean;
  isSpecial?: boolean;
  specialType?: 'freeze' | 'frenzy' | 'double';
  splashColor: string;
  juiceDropsColor: string[];
}

export interface Point {
  x: number;
  y: number;
  time: number;
}

export interface TrailPoint {
  x: number;
  y: number;
  time: number;
  width: number;
}

export interface ActiveFruit {
  id: number;
  config: FruitConfig;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  radius: number;
  sliced: boolean;
  missed: boolean;
  sparkTimer?: number;
}

export interface SlicedHalf {
  id: number;
  config: FruitConfig;
  side: 'left' | 'right';
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  radius: number;
  cutAngle: number;
  alpha: number;
}

export interface JuiceParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  isSpark?: boolean;
}

export interface WallStain {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  drips: Array<{ x: number; y: number; length: number; speed: number; currentLen: number }>;
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  scale: number;
  alpha: number;
  vy: number;
  lifetime: number;
  maxLife: number;
}

export interface GameStats {
  score: number;
  highScore: number;
  slicedCount: number;
  bestCombo: number;
  bombsAvoided: number;
  specialFruitsSliced: number;
  mode: GameMode;
}
