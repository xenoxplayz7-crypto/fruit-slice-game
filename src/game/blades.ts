import { BladeType, TrailPoint } from './types';

export interface BladeConfig {
  id: BladeType;
  nameEn: string;
  nameHi: string;
  description: string;
  trailColor: string;
  glowColor: string;
  coreColor: string;
  particleColor: string[];
  slashWidth: number;
}

export const BLADES: Record<BladeType, BladeConfig> = {
  katana: {
    id: 'katana',
    nameEn: 'Ninja Katana',
    nameHi: 'निंजा तलवार',
    description: 'Classic razor-sharp folded steel blade with white-hot gleam.',
    trailColor: 'rgba(224, 242, 254, 0.95)',
    glowColor: 'rgba(56, 189, 248, 0.65)',
    coreColor: '#ffffff',
    particleColor: ['#ffffff', '#bae6fd', '#38bdf8'],
    slashWidth: 8,
  },
  inferno: {
    id: 'inferno',
    nameEn: 'Inferno Flame',
    nameHi: 'ज्वाला ब्लेड',
    description: 'Blazing volcanic edge leaving burning fiery sparks in its wake.',
    trailColor: 'rgba(251, 146, 60, 0.95)',
    glowColor: 'rgba(239, 68, 68, 0.75)',
    coreColor: '#fef08a',
    particleColor: ['#fef08a', '#f97316', '#ef4444', '#b91c1c'],
    slashWidth: 10,
  },
  frost: {
    id: 'frost',
    nameEn: 'Frost Edge',
    nameHi: 'बर्फ का खंजर',
    description: 'Sub-zero glacial blade trailing crystalline frost sparks.',
    trailColor: 'rgba(165, 243, 252, 0.95)',
    glowColor: 'rgba(6, 182, 212, 0.75)',
    coreColor: '#ffffff',
    particleColor: ['#ffffff', '#a5f3fc', '#22d3ee', '#0891b2'],
    slashWidth: 9,
  },
  rainbow: {
    id: 'rainbow',
    nameEn: 'Rainbow Prism',
    nameHi: 'इंद्रधनुषी ब्लेड',
    description: 'Mystic chromatic blade shifting hues through every spectrum.',
    trailColor: 'rgba(244, 114, 182, 0.95)',
    glowColor: 'rgba(168, 85, 247, 0.75)',
    coreColor: '#ffffff',
    particleColor: ['#f43f5e', '#facc15', '#10b981', '#06b6d4', '#8b5cf6'],
    slashWidth: 9,
  },
  shadow: {
    id: 'shadow',
    nameEn: 'Shadow Kunai',
    nameHi: 'छाया कुनाई',
    description: 'Dark void assassin blade leaving shadowy amethyst smoke.',
    trailColor: 'rgba(192, 132, 252, 0.95)',
    glowColor: 'rgba(126, 34, 206, 0.8)',
    coreColor: '#faf5ff',
    particleColor: ['#d8b4fe', '#a855f7', '#6b21a8', '#1e1b4b'],
    slashWidth: 8,
  },
};

// Render the blade trail ribbon using quadratic curve interpolation
export function renderBladeTrail(
  ctx: CanvasRenderingContext2D,
  trail: TrailPoint[],
  blade: BladeConfig,
  currentTime: number
) {
  if (trail.length < 2) return;

  const maxAge = 0.22; // trail point lifespan in seconds
  const validPoints = trail.filter((p) => currentTime - p.time <= maxAge);
  if (validPoints.length < 2) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // 1. Outer Glow Pass
  ctx.shadowBlur = 16;
  ctx.shadowColor = blade.glowColor;

  for (let i = 1; i < validPoints.length; i++) {
    const p0 = validPoints[i - 1];
    const p1 = validPoints[i];
    const age = currentTime - p1.time;
    const alpha = Math.max(0, 1 - age / maxAge);

    ctx.strokeStyle = blade.glowColor.replace(/[\d.]+\)$/g, `${alpha * 0.8})`);
    ctx.lineWidth = blade.slashWidth * alpha * 1.8;

    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
  }

  // 2. Main Blade Ribbon Pass (tapered from tip to tail)
  ctx.shadowBlur = 4;
  ctx.shadowColor = blade.coreColor;

  for (let i = 1; i < validPoints.length; i++) {
    const p0 = validPoints[i - 1];
    const p1 = validPoints[i];
    const age = currentTime - p1.time;
    const progress = 1 - age / maxAge; // 1 at tip, 0 at tail
    const alpha = Math.max(0, progress);

    if (blade.id === 'rainbow') {
      const hue = (currentTime * 400 + i * 25) % 360;
      ctx.strokeStyle = `hsla(${hue}, 95%, 65%, ${alpha})`;
    } else {
      ctx.strokeStyle = blade.trailColor.replace(/[\d.]+\)$/g, `${alpha})`);
    }

    ctx.lineWidth = Math.max(1.5, blade.slashWidth * progress);

    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
  }

  // 3. Ultra-sharp Core Wire
  ctx.strokeStyle = blade.coreColor;
  for (let i = 1; i < validPoints.length; i++) {
    const p0 = validPoints[i - 1];
    const p1 = validPoints[i];
    const age = currentTime - p1.time;
    const alpha = Math.max(0, 1 - age / maxAge);

    ctx.lineWidth = Math.max(1, 2.5 * alpha);
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
  }

  ctx.restore();
}
