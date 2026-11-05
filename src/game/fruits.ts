import { FruitConfig, FruitId } from './types';

export const FRUIT_CATALOG: Record<FruitId, FruitConfig> = {
  watermelon: {
    id: 'watermelon',
    nameEn: 'Watermelon',
    nameHi: 'तरबूज',
    points: 1,
    radius: 46,
    splashColor: '#ef4444',
    juiceDropsColor: ['#ef4444', '#dc2626', '#22c55e', '#15803d'],
  },
  orange: {
    id: 'orange',
    nameEn: 'Orange',
    nameHi: 'संतरा',
    points: 1,
    radius: 38,
    splashColor: '#f97316',
    juiceDropsColor: ['#f97316', '#ea580c', '#fb923c', '#ffffff'],
  },
  apple: {
    id: 'apple',
    nameEn: 'Apple',
    nameHi: 'सेब',
    points: 1,
    radius: 36,
    splashColor: '#e11d48',
    juiceDropsColor: ['#e11d48', '#be123c', '#fef08a', '#15803d'],
  },
  banana: {
    id: 'banana',
    nameEn: 'Banana',
    nameHi: 'केला',
    points: 1,
    radius: 36,
    splashColor: '#eab308',
    juiceDropsColor: ['#eab308', '#fde047', '#fef9c3', '#713f12'],
  },
  strawberry: {
    id: 'strawberry',
    nameEn: 'Strawberry',
    nameHi: 'स्ट्रॉबेरी',
    points: 2,
    radius: 30,
    splashColor: '#dc2626',
    juiceDropsColor: ['#dc2626', '#b91c1c', '#f87171', '#16a34a'],
  },
  pineapple: {
    id: 'pineapple',
    nameEn: 'Pineapple',
    nameHi: 'अनानास',
    points: 2,
    radius: 44,
    splashColor: '#ca8a04',
    juiceDropsColor: ['#ca8a04', '#eab308', '#fef08a', '#15803d'],
  },
  coconut: {
    id: 'coconut',
    nameEn: 'Coconut',
    nameHi: 'नारियल',
    points: 2,
    radius: 40,
    splashColor: '#f8fafc',
    juiceDropsColor: ['#f8fafc', '#e2e8f0', '#78350f', '#451a03'],
  },
  dragonfruit: {
    id: 'dragonfruit',
    nameEn: 'Dragon Fruit',
    nameHi: 'ड्रैगन फ्रूट',
    points: 3,
    radius: 42,
    splashColor: '#db2777',
    juiceDropsColor: ['#db2777', '#be185d', '#ffffff', '#18181b', '#84cc16'],
  },
  kiwi: {
    id: 'kiwi',
    nameEn: 'Kiwi',
    nameHi: 'कीवी',
    points: 2,
    radius: 32,
    splashColor: '#65a30d',
    juiceDropsColor: ['#65a30d', '#84cc16', '#bef264', '#1c1917'],
  },
  freeze_banana: {
    id: 'freeze_banana',
    nameEn: 'Freeze Banana',
    nameHi: 'बर्फ केला',
    points: 5,
    radius: 38,
    isSpecial: true,
    specialType: 'freeze',
    splashColor: '#06b6d4',
    juiceDropsColor: ['#06b6d4', '#22d3ee', '#67e8f9', '#ffffff'],
  },
  frenzy_dragon: {
    id: 'frenzy_dragon',
    nameEn: 'Frenzy Dragon',
    nameHi: 'धमाका फल',
    points: 5,
    radius: 44,
    isSpecial: true,
    specialType: 'frenzy',
    splashColor: '#f59e0b',
    juiceDropsColor: ['#f59e0b', '#fbbf24', '#ef4444', '#ffffff'],
  },
  double_star: {
    id: 'double_star',
    nameEn: 'Double Star',
    nameHi: '2x स्टार',
    points: 4,
    radius: 36,
    isSpecial: true,
    specialType: 'double',
    splashColor: '#a855f7',
    juiceDropsColor: ['#a855f7', '#c084fc', '#facc15', '#ffffff'],
  },
  bomb: {
    id: 'bomb',
    nameEn: 'Bomb',
    nameHi: 'बम',
    points: 0,
    radius: 38,
    isBomb: true,
    splashColor: '#27272a',
    juiceDropsColor: ['#f97316', '#ef4444', '#fbbf24', '#27272a'],
  },
};

// Render whole fruit on canvas at (0, 0)
export function renderWholeFruit(
  ctx: CanvasRenderingContext2D,
  config: FruitConfig,
  sparkTimer: number = 0
) {
  const { id, radius } = config;

  if (id === 'bomb') {
    renderBomb(ctx, radius, sparkTimer);
    return;
  }

  // Draw shadow first
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(4, radius * 0.7, radius * 0.75, radius * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Special Fruit Aura Glow
  if (config.isSpecial) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
    const auraGrad = ctx.createRadialGradient(0, 0, radius * 0.6, 0, 0, radius * 1.35);
    auraGrad.addColorStop(0, `${config.splashColor}99`);
    auraGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = auraGrad;
    ctx.fill();
    ctx.restore();
  }

  switch (id) {
    case 'watermelon':
      renderWatermelonWhole(ctx, radius);
      break;
    case 'orange':
      renderOrangeWhole(ctx, radius);
      break;
    case 'apple':
      renderAppleWhole(ctx, radius);
      break;
    case 'banana':
    case 'freeze_banana':
      renderBananaWhole(ctx, radius, id === 'freeze_banana');
      break;
    case 'strawberry':
      renderStrawberryWhole(ctx, radius);
      break;
    case 'pineapple':
      renderPineappleWhole(ctx, radius);
      break;
    case 'coconut':
      renderCoconutWhole(ctx, radius);
      break;
    case 'dragonfruit':
    case 'frenzy_dragon':
      renderDragonfruitWhole(ctx, radius, id === 'frenzy_dragon');
      break;
    case 'kiwi':
      renderKiwiWhole(ctx, radius);
      break;
    case 'double_star':
      renderStarfruitWhole(ctx, radius);
      break;
  }
}

// Render sliced half with authentic cross section
export function renderSlicedHalf(
  ctx: CanvasRenderingContext2D,
  config: FruitConfig,
  side: 'left' | 'right'
) {
  const { id, radius } = config;

  if (id === 'bomb') return;

  // Clip to half circle / half shape along the cut face (x=0 vertical separator)
  ctx.save();
  ctx.beginPath();
  if (side === 'left') {
    ctx.rect(-radius * 1.5, -radius * 1.5, radius * 1.5, radius * 3);
  } else {
    ctx.rect(0, -radius * 1.5, radius * 1.5, radius * 3);
  }
  ctx.clip();

  // Draw base fruit exterior
  renderWholeFruit(ctx, config, 0);

  // Overlay the juicy inside cross-section face along cut line
  renderFruitInterior(ctx, config, side);

  ctx.restore();
}

function renderFruitInterior(
  ctx: CanvasRenderingContext2D,
  config: FruitConfig,
  side: 'left' | 'right'
) {
  const { id, radius } = config;
  const dir = side === 'left' ? -1 : 1;

  ctx.save();

  if (id === 'watermelon') {
    // Watermelon inside: White rind layer + juicy red pulp + black seeds
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, 0, radius - 4, side === 'left' ? Math.PI * 0.5 : -Math.PI * 0.5, side === 'left' ? Math.PI * 1.5 : Math.PI * 0.5);
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, radius - 8, side === 'left' ? Math.PI * 0.5 : -Math.PI * 0.5, side === 'left' ? Math.PI * 1.5 : Math.PI * 0.5);
    ctx.fill();

    // Seeds
    ctx.fillStyle = '#18181b';
    const seedOffsets = [
      { r: 0.45, a: 0.3 },
      { r: 0.55, a: -0.4 },
      { r: 0.65, a: 0.1 },
      { r: 0.5, a: 0.75 },
      { r: 0.6, a: -0.85 },
    ];
    seedOffsets.forEach(({ r, a }) => {
      const sx = dir * Math.cos(a) * (radius * r);
      const sy = Math.sin(a) * (radius * r);
      ctx.beginPath();
      ctx.ellipse(sx, sy, 2.5, 4, a, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (id === 'orange') {
    // Orange segments inside
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(0, 0, radius - 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f97316';
    for (let i = 0; i < 4; i++) {
      const angle = (side === 'left' ? Math.PI * 0.55 : -Math.PI * 0.45) + (i * Math.PI) / 4.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius - 6, angle, angle + Math.PI / 6);
      ctx.closePath();
      ctx.fill();
    }
    // White center pip
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'apple') {
    // Apple pale inside + star core + 2 seeds
    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.arc(0, 0, radius - 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.ellipse(dir * 5, -2, 2, 4, 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'banana' || id === 'freeze_banana') {
    // Banana creamy inside
    ctx.fillStyle = id === 'freeze_banana' ? '#cffafe' : '#fef9c3';
    ctx.beginPath();
    ctx.arc(0, 0, radius - 4, 0, Math.PI * 2);
    ctx.fill();

    // 3 center seed dots
    ctx.fillStyle = id === 'freeze_banana' ? '#0891b2' : '#713f12';
    for (let i = 0; i < 3; i++) {
      const a = (i * 2 * Math.PI) / 3;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 4, Math.sin(a) * 4, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'strawberry') {
    // Strawberry juicy red interior with radiating fibers
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(0, 0, radius - 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffe4e6';
    ctx.beginPath();
    ctx.ellipse(dir * 4, 0, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'coconut') {
    // Coconut pure snow-white flesh
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, radius - 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.arc(0, 0, radius - 14, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'dragonfruit' || id === 'frenzy_dragon') {
    // Dragonfruit white flesh + many black seeds
    ctx.fillStyle = id === 'frenzy_dragon' ? '#fef08a' : '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, radius - 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#18181b';
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * (radius - 10);
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'kiwi') {
    // Kiwi green inside + radiating lines + seed ring
    ctx.fillStyle = '#84cc16';
    ctx.beginPath();
    ctx.arc(0, 0, radius - 3, 0, Math.PI * 2);
    ctx.fill();

    // Pale center
    ctx.fillStyle = '#ecfccb';
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Black seed ring
    ctx.fillStyle = '#1c1917';
    for (let i = 0; i < 14; i++) {
      const a = (i * 2 * Math.PI) / 14;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 11, Math.sin(a) * 11, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Generic juicy fruit interior
    ctx.fillStyle = config.splashColor;
    ctx.beginPath();
    ctx.arc(0, 0, radius - 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Gleam line on the cut edge
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -radius);
  ctx.lineTo(0, radius);
  ctx.stroke();

  ctx.restore();
}

/* Individual Whole Fruit Renderers */

function renderWatermelonWhole(ctx: CanvasRenderingContext2D, r: number) {
  // Base dark green
  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.2, 0, 0, r);
  grad.addColorStop(0, '#22c55e');
  grad.addColorStop(0.7, '#15803d');
  grad.addColorStop(1, '#14532d');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Dark wavy vertical stripes
  ctx.strokeStyle = '#052e16';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  [-0.6, -0.3, 0, 0.3, 0.6].forEach((offset) => {
    ctx.beginPath();
    const x = offset * r;
    ctx.moveTo(x * 0.4, -r * 0.9);
    ctx.bezierCurveTo(x * 1.2, -r * 0.4, x * 0.7, r * 0.4, x * 0.4, r * 0.9);
    ctx.stroke();
  });

  // Highlight
  renderGleam(ctx, -r * 0.4, -r * 0.4, r * 0.35);
}

function renderOrangeWhole(ctx: CanvasRenderingContext2D, r: number) {
  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  grad.addColorStop(0, '#fb923c');
  grad.addColorStop(0.7, '#ea580c');
  grad.addColorStop(1, '#c2410c');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Dimple texture
  ctx.fillStyle = 'rgba(194, 65, 12, 0.4)';
  for (let i = 0; i < 16; i++) {
    const a = (i * 137.5 * Math.PI) / 180;
    const dist = ((i % 5) + 1) * (r / 6);
    ctx.beginPath();
    ctx.arc(Math.cos(a) * dist, Math.sin(a) * dist, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stem & tiny green leaf
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.ellipse(r * 0.1, -r * 0.9, 5, 2.5, -0.4, 0, Math.PI * 2);
  ctx.fill();

  renderGleam(ctx, -r * 0.35, -r * 0.35, r * 0.3);
}

function renderAppleWhole(ctx: CanvasRenderingContext2D, r: number) {
  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  grad.addColorStop(0, '#f87171');
  grad.addColorStop(0.6, '#dc2626');
  grad.addColorStop(1, '#991b1b');

  // Apple heart/round shape
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.7);
  ctx.bezierCurveTo(-r * 0.6, -r * 1.1, -r * 1.1, -r * 0.2, -r * 0.9, r * 0.6);
  ctx.bezierCurveTo(-r * 0.7, r * 1.05, -r * 0.2, r * 0.9, 0, r * 0.8);
  ctx.bezierCurveTo(r * 0.2, r * 0.9, r * 0.7, r * 1.05, r * 0.9, r * 0.6);
  ctx.bezierCurveTo(r * 1.1, -r * 0.2, r * 0.6, -r * 1.1, 0, -r * 0.7);
  ctx.fill();

  // Stem
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.6);
  ctx.quadraticCurveTo(-4, -r * 1.1, 4, -r * 1.2);
  ctx.stroke();

  renderGleam(ctx, -r * 0.4, -r * 0.4, r * 0.3);
}

function renderBananaWhole(ctx: CanvasRenderingContext2D, r: number, isFrozen: boolean) {
  ctx.save();
  ctx.rotate(-0.25);

  const grad = ctx.createLinearGradient(-r, -r, r, r);
  if (isFrozen) {
    grad.addColorStop(0, '#e0f2fe');
    grad.addColorStop(0.5, '#38bdf8');
    grad.addColorStop(1, '#0284c7');
  } else {
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.6, '#facc15');
    grad.addColorStop(1, '#eab308');
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  // Curved banana crescent
  ctx.moveTo(-r * 1.1, -r * 0.5);
  ctx.bezierCurveTo(-r * 0.4, -r * 1.1, r * 0.7, -r * 0.6, r * 1.2, r * 0.6);
  ctx.bezierCurveTo(r * 0.6, r * 0.2, -r * 0.2, -r * 0.2, -r * 1.1, -r * 0.5);
  ctx.fill();

  // Banana tip & stem
  ctx.fillStyle = isFrozen ? '#0369a1' : '#713f12';
  ctx.beginPath();
  ctx.arc(-r * 1.1, -r * 0.5, 3, 0, Math.PI * 2);
  ctx.arc(r * 1.2, r * 0.6, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function renderStrawberryWhole(ctx: CanvasRenderingContext2D, r: number) {
  const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
  grad.addColorStop(0, '#f87171');
  grad.addColorStop(0.7, '#dc2626');
  grad.addColorStop(1, '#991b1b');

  ctx.fillStyle = grad;
  ctx.beginPath();
  // Strawberry cone shape
  ctx.moveTo(0, r * 0.95);
  ctx.bezierCurveTo(-r * 0.9, r * 0.4, -r * 1.0, -r * 0.6, 0, -r * 0.75);
  ctx.bezierCurveTo(r * 1.0, -r * 0.6, r * 0.9, r * 0.4, 0, r * 0.95);
  ctx.fill();

  // Seed dots
  ctx.fillStyle = '#fef08a';
  for (let i = 0; i < 14; i++) {
    const a = (i * 0.8) % (Math.PI * 2);
    const dist = (i / 14) * (r * 0.7);
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * dist, Math.sin(a) * dist + 2, 1, 1.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Green leaves on top
  ctx.fillStyle = '#15803d';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.ellipse(i * 6, -r * 0.75, 5, 2.5, i * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderPineappleWhole(ctx: CanvasRenderingContext2D, r: number) {
  // Body
  const grad = ctx.createLinearGradient(0, -r, 0, r);
  grad.addColorStop(0, '#facc15');
  grad.addColorStop(0.5, '#ca8a04');
  grad.addColorStop(1, '#854d0e');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.2, r * 0.75, r * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();

  // Diamond texture
  ctx.strokeStyle = '#713f12';
  ctx.lineWidth = 1.5;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, r * 0.2, r * 0.75, r * 0.85, 0, 0, Math.PI * 2);
  ctx.clip();

  for (let i = -r; i <= r; i += 12) {
    ctx.beginPath();
    ctx.moveTo(i - r, -r);
    ctx.lineTo(i + r, r * 1.5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(i + r, -r);
    ctx.lineTo(i - r, r * 1.5);
    ctx.stroke();
  }
  ctx.restore();

  // Spiky crown
  ctx.fillStyle = '#16a34a';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 6, -r * 0.4);
    ctx.lineTo(i * 12, -r * 1.25);
    ctx.lineTo(i * 6 + 6, -r * 0.4);
    ctx.fill();
  }
}

function renderCoconutWhole(ctx: CanvasRenderingContext2D, r: number) {
  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  grad.addColorStop(0, '#78350f');
  grad.addColorStop(0.8, '#451a03');
  grad.addColorStop(1, '#290e02');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Fibrous hairs
  ctx.strokeStyle = '#a16207';
  ctx.lineWidth = 1;
  for (let i = 0; i < 18; i++) {
    const a = (i * 2 * Math.PI) / 18;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (r - 2), Math.sin(a) * (r - 2));
    ctx.lineTo(Math.cos(a) * (r + 4), Math.sin(a) * (r + 4));
    ctx.stroke();
  }

  // 3 dark pores
  ctx.fillStyle = '#1c1917';
  [-6, 6].forEach((x) => {
    ctx.beginPath();
    ctx.arc(x, -r * 0.4, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.beginPath();
  ctx.arc(0, -r * 0.15, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function renderDragonfruitWhole(
  ctx: CanvasRenderingContext2D,
  r: number,
  isFrenzy: boolean
) {
  const grad = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
  if (isFrenzy) {
    grad.addColorStop(0, '#fbbf24');
    grad.addColorStop(0.6, '#f59e0b');
    grad.addColorStop(1, '#dc2626');
  } else {
    grad.addColorStop(0, '#f472b6');
    grad.addColorStop(0.7, '#db2777');
    grad.addColorStop(1, '#9d174d');
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.8, r, 0, 0, Math.PI * 2);
  ctx.fill();

  // Green curly scales
  ctx.fillStyle = isFrenzy ? '#fef08a' : '#84cc16';
  for (let i = 0; i < 7; i++) {
    const a = (i * 2 * Math.PI) / 7;
    const sx = Math.cos(a) * (r * 0.7);
    const sy = Math.sin(a) * (r * 0.85);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx * 1.35, sy * 1.35, sx * 1.15, sy * 0.9);
    ctx.closePath();
    ctx.fill();
  }
}

function renderKiwiWhole(ctx: CanvasRenderingContext2D, r: number) {
  const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
  grad.addColorStop(0, '#a16207');
  grad.addColorStop(0.8, '#713f12');
  grad.addColorStop(1, '#451a03');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.9, r, 0, 0, Math.PI * 2);
  ctx.fill();

  // Fuzzy hairs
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 24; i++) {
    const a = (i * 2 * Math.PI) / 24;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (r * 0.9), Math.sin(a) * r);
    ctx.lineTo(Math.cos(a) * (r * 0.9 + 2), Math.sin(a) * (r + 2));
    ctx.stroke();
  }
}

function renderStarfruitWhole(ctx: CanvasRenderingContext2D, r: number) {
  ctx.save();
  const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, r);
  grad.addColorStop(0, '#fef08a');
  grad.addColorStop(0.5, '#eab308');
  grad.addColorStop(1, '#a855f7');

  ctx.fillStyle = grad;
  ctx.beginPath();
  // 5-point star
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5;
    const dist = i % 2 === 0 ? r : r * 0.45;
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Heavy iron bomb with skull and animated sparking fuse
function renderBomb(ctx: CanvasRenderingContext2D, r: number, sparkTimer: number) {
  // Bomb body gradient
  const grad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
  grad.addColorStop(0, '#52525b');
  grad.addColorStop(0.5, '#27272a');
  grad.addColorStop(1, '#09090b');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Rim shine
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Bomb neck cap
  ctx.fillStyle = '#3f3f46';
  ctx.fillRect(-6, -r - 4, 12, 6);

  // Fuse string
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -r - 3);
  ctx.quadraticCurveTo(-12, -r - 18, 6, -r - 26);
  ctx.stroke();

  // Sparkling fuse tip!
  const sparkX = 6;
  const sparkY = -r - 26;

  // Flash glow
  const sparkGrad = ctx.createRadialGradient(sparkX, sparkY, 2, sparkX, sparkY, 14);
  sparkGrad.addColorStop(0, '#ffffff');
  sparkGrad.addColorStop(0.4, '#fbbf24');
  sparkGrad.addColorStop(0.8, '#ef4444');
  sparkGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

  ctx.fillStyle = sparkGrad;
  ctx.beginPath();
  ctx.arc(sparkX, sparkY, 14, 0, Math.PI * 2);
  ctx.fill();

  // Spark rays
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 2;
  const numSparks = 6;
  for (let i = 0; i < numSparks; i++) {
    const angle = sparkTimer * 10 + (i * Math.PI * 2) / numSparks;
    const len = 6 + (Math.sin(sparkTimer * 20 + i) + 1) * 4;
    ctx.beginPath();
    ctx.moveTo(sparkX, sparkY);
    ctx.lineTo(sparkX + Math.cos(angle) * len, sparkY + Math.sin(angle) * len);
    ctx.stroke();
  }

  // Skull emblem
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(0, -2, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-5, 4, 10, 4);

  // Skull eye sockets
  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.arc(-3, -2, 2.2, 0, Math.PI * 2);
  ctx.arc(3, -2, 2.2, 0, Math.PI * 2);
  ctx.fill();
}

function renderGleam(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save();
  const gleam = ctx.createRadialGradient(x, y, 1, x, y, r);
  gleam.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
  gleam.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
  gleam.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gleam;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
