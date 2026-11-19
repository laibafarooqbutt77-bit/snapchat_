import { FilterPreset } from '../types';

export const FILTER_PRESETS: FilterPreset[] = [
  // BASIC FILTERS (13)
  {
    id: 'natural',
    name: 'Natural',
    category: 'basic',
    cssFilter: 'none',
    canvasMode: 'none',
    badgeColor: '#FFFFFF',
    description: 'True-to-life crisp camera sensor output',
  },
  {
    id: 'beauty',
    name: 'Beauty',
    category: 'basic',
    cssFilter: 'brightness(1.07) contrast(0.96) saturate(1.1)',
    canvasMode: 'none',
    badgeColor: '#F9A8D4',
    description: 'Soft studio lift and balanced skin warmth',
  },
  {
    id: 'smooth_skin',
    name: 'Smooth Skin',
    category: 'basic',
    cssFilter: 'brightness(1.06) contrast(0.92) saturate(1.05) blur(0.4px)',
    canvasMode: 'dream',
    badgeColor: '#FDE68A',
    description: 'Subtle diffusion bloom for portrait clarity',
  },
  {
    id: 'warm',
    name: 'Warm',
    category: 'basic',
    cssFilter: 'sepia(0.24) saturate(1.32) brightness(1.04)',
    canvasMode: 'none',
    badgeColor: '#F59E0B',
    description: 'Golden hour amber tint',
  },
  {
    id: 'cool',
    name: 'Cool',
    category: 'basic',
    cssFilter: 'hue-rotate(12deg) saturate(0.92) contrast(1.08) brightness(1.02)',
    canvasMode: 'none',
    badgeColor: '#38BDF8',
    description: 'Crisp arctic blue midtones',
  },
  {
    id: 'bw',
    name: 'B&W',
    category: 'basic',
    cssFilter: 'grayscale(1) contrast(1.22)',
    canvasMode: 'none',
    badgeColor: '#D4D4D8',
    description: 'High-contrast monochrome film stock',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    category: 'basic',
    cssFilter: 'sepia(0.42) contrast(0.92) brightness(0.96) saturate(0.85)',
    canvasMode: 'retro',
    badgeColor: '#D97706',
    description: 'Faded 1970s analog film print',
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    category: 'basic',
    cssFilter: 'contrast(1.25) saturate(1.12) brightness(0.94)',
    canvasMode: 'none',
    badgeColor: '#FFFC00',
    description: 'Anamorphic theatrical grading',
  },
  {
    id: 'sepia',
    name: 'Sepia',
    category: 'basic',
    cssFilter: 'sepia(0.88) contrast(1.06)',
    canvasMode: 'none',
    badgeColor: '#B45309',
    description: 'Classic darkroom silver sepia tone',
  },
  {
    id: 'bright',
    name: 'Bright',
    category: 'basic',
    cssFilter: 'brightness(1.25) contrast(1.04)',
    canvasMode: 'none',
    badgeColor: '#FEF08A',
    description: 'High-key daylight exposure boost',
  },
  {
    id: 'dark',
    name: 'Dark',
    category: 'basic',
    cssFilter: 'brightness(0.72) contrast(1.28)',
    canvasMode: 'none',
    badgeColor: '#52525B',
    description: 'Moody low-key shadow grading',
  },
  {
    id: 'contrast',
    name: 'Contrast',
    category: 'basic',
    cssFilter: 'contrast(1.5) saturate(1.1)',
    canvasMode: 'none',
    badgeColor: '#E4E4E7',
    description: 'Punchy blacks and crisp highlights',
  },
  {
    id: 'saturation',
    name: 'Vivid',
    category: 'basic',
    cssFilter: 'saturate(1.75) contrast(1.08)',
    canvasMode: 'none',
    badgeColor: '#EC4899',
    description: 'Hyper-rich color vibrancy',
  },

  // ADVANCED FILTERS (13)
  {
    id: 'neon',
    name: 'Neon',
    category: 'advanced',
    cssFilter: 'contrast(1.35) saturate(1.65) brightness(1.05)',
    canvasMode: 'neon',
    badgeColor: '#22D3EE',
    description: 'Electric edge highlights & cyan-yellow rim',
  },
  {
    id: 'vhs',
    name: 'VHS',
    category: 'advanced',
    cssFilter: 'contrast(1.1) saturate(1.2) sepia(0.15)',
    canvasMode: 'vhs',
    badgeColor: '#F43F5E',
    description: 'Magnetic tape scanlines & tracking',
  },
  {
    id: 'glitch',
    name: 'Glitch',
    category: 'advanced',
    cssFilter: 'contrast(1.25) saturate(1.3)',
    canvasMode: 'glitch',
    badgeColor: '#A855F7',
    description: 'Digital slice displacement frames',
  },
  {
    id: 'rgb_split',
    name: 'RGB Split',
    category: 'advanced',
    cssFilter: 'contrast(1.15)',
    canvasMode: 'rgb_split',
    badgeColor: '#EF4444',
    description: 'Chromatic channel aberration shift',
  },
  {
    id: 'cartoon',
    name: 'Cartoon',
    category: 'advanced',
    cssFilter: 'contrast(1.55) saturate(1.6)',
    canvasMode: 'cartoon',
    badgeColor: '#FFFC00',
    description: 'Posterized ink-comic cel shading',
  },
  {
    id: 'sketch',
    name: 'Sketch',
    category: 'advanced',
    cssFilter: 'grayscale(1) contrast(1.6)',
    canvasMode: 'sketch',
    badgeColor: '#E5E7EB',
    description: 'Graphite pencil contour drawing',
  },
  {
    id: 'pixel',
    name: 'Pixel',
    category: 'advanced',
    cssFilter: 'contrast(1.15) saturate(1.2)',
    canvasMode: 'pixel',
    badgeColor: '#10B981',
    description: '8-bit retro mosaic quantization',
  },
  {
    id: 'dream',
    name: 'Dream',
    category: 'advanced',
    cssFilter: 'brightness(1.12) saturate(1.25) contrast(0.9)',
    canvasMode: 'dream',
    badgeColor: '#C084FC',
    description: 'Halation haze and soft pastel bloom',
  },
  {
    id: 'blur',
    name: 'Motion Blur',
    category: 'advanced',
    cssFilter: 'blur(3px) brightness(1.05)',
    canvasMode: 'none',
    badgeColor: '#94A3B8',
    description: 'Atmospheric out-of-focus bokeh',
  },
  {
    id: 'glow',
    name: 'Glow',
    category: 'advanced',
    cssFilter: 'brightness(1.18) contrast(1.08) saturate(1.2)',
    canvasMode: 'dream',
    badgeColor: '#FDE047',
    description: 'Radiant highlight flare aura',
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    category: 'advanced',
    cssFilter: 'saturate(1.35)',
    canvasMode: 'rainbow',
    badgeColor: '#FB7185',
    description: 'Prismatic diagonal light spectrum',
  },
  {
    id: 'color_shift',
    name: 'Color Shift',
    category: 'advanced',
    cssFilter: 'hue-rotate(140deg) saturate(1.5)',
    canvasMode: 'color_shift',
    badgeColor: '#2DD4BF',
    description: 'Animated hue rotation spectrum',
  },
  {
    id: 'retro',
    name: 'Retro 98',
    category: 'advanced',
    cssFilter: 'sepia(0.3) contrast(1.15) saturate(1.15)',
    canvasMode: 'retro',
    badgeColor: '#FB923C',
    description: 'Disposable camera flash & vignette',
  },

  // FACE LENSES (11)
  {
    id: 'lens_dog',
    name: 'Puppy Ears',
    category: 'lens',
    cssFilter: 'brightness(1.05) saturate(1.1)',
    lensType: 'dog_ears',
    badgeColor: '#D97706',
    description: 'Floppy ears & interactive puppy nose',
  },
  {
    id: 'lens_cat',
    name: 'Kitty Whiskers',
    category: 'lens',
    cssFilter: 'brightness(1.06) contrast(1.04)',
    lensType: 'cat_ears',
    badgeColor: '#F472B6',
    description: 'Pointed ears, nose & animated whiskers',
  },
  {
    id: 'lens_bunny',
    name: 'Bunny Ears',
    category: 'lens',
    cssFilter: 'brightness(1.08) saturate(1.08)',
    lensType: 'bunny_ears',
    badgeColor: '#FBCFE8',
    description: 'Tall pastel bunny ears & rosy cheeks',
  },
  {
    id: 'lens_shades',
    name: 'Lumo Shades',
    category: 'lens',
    cssFilter: 'contrast(1.15) saturate(1.1)',
    lensType: 'sunglasses',
    badgeColor: '#FFFC00',
    description: 'Signature yellow-rimmed dark shades',
  },
  {
    id: 'lens_crown',
    name: 'Gold Crown',
    category: 'lens',
    cssFilter: 'brightness(1.08) saturate(1.15)',
    lensType: 'crown',
    badgeColor: '#FACC15',
    description: 'Floating golden crown & sparkle orbit',
  },
  {
    id: 'lens_cyber',
    name: 'Cyber Visor',
    category: 'lens',
    cssFilter: 'contrast(1.25) saturate(1.3)',
    lensType: 'cyber_mask',
    badgeColor: '#22D3EE',
    description: 'HUD scanner visor & neon face grid',
  },
  {
    id: 'lens_makeup',
    name: 'Starry Glam',
    category: 'lens',
    cssFilter: 'brightness(1.06) saturate(1.18)',
    lensType: 'makeup',
    badgeColor: '#E879F9',
    description: 'Rosy blush, highlighter & star freckles',
  },
  {
    id: 'lens_decor',
    name: 'Butterfly Aura',
    category: 'lens',
    cssFilter: 'brightness(1.06) saturate(1.15)',
    lensType: 'face_decor',
    badgeColor: '#34D399',
    description: 'Animated butterflies orbiting cheeks',
  },
  {
    id: 'lens_big_eyes',
    name: 'Big Eyes',
    category: 'lens',
    cssFilter: 'saturate(1.12)',
    lensType: 'big_eyes',
    badgeColor: '#60A5FA',
    description: 'Playful wide-eyed cartoon lens',
  },
  {
    id: 'lens_small_face',
    name: 'Tiny Face',
    category: 'lens',
    cssFilter: 'contrast(1.08)',
    lensType: 'small_face',
    badgeColor: '#FB7185',
    description: 'Comedic pinched center-face warp',
  },
  {
    id: 'lens_funny',
    name: 'Wacky Swirl',
    category: 'lens',
    cssFilter: 'saturate(1.25)',
    lensType: 'funny_face',
    badgeColor: '#A3E635',
    description: 'Goofy mustache, monocle & swirl',
  },
];

export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function drawLensOverlay(
  ctx: CanvasRenderingContext2D,
  lensType: FilterPreset['lensType'],
  face: FaceBox,
  timeMs: number,
  intensity: number
) {
  if (!lensType) return;
  const cx = face.x + face.width / 2;
  const cy = face.y + face.height / 2;
  const fw = face.width;
  const fh = face.height;
  const t = timeMs * 0.003;

  ctx.save();
  ctx.globalAlpha = Math.max(0.2, Math.min(1, intensity));

  if (lensType === 'dog_ears') {
    const earW = fw * 0.34;
    const earH = fh * 0.45;
    // Left floppy ear
    ctx.fillStyle = '#8B5A2B';
    ctx.beginPath();
    ctx.ellipse(cx - fw * 0.45, cy - fh * 0.35 + Math.sin(t) * 3, earW * 0.5, earH * 0.5, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#D2955A';
    ctx.beginPath();
    ctx.ellipse(cx - fw * 0.43, cy - fh * 0.33 + Math.sin(t) * 3, earW * 0.28, earH * 0.32, -0.35, 0, Math.PI * 2);
    ctx.fill();
    // Right floppy ear
    ctx.fillStyle = '#8B5A2B';
    ctx.beginPath();
    ctx.ellipse(cx + fw * 0.45, cy - fh * 0.35 + Math.cos(t) * 3, earW * 0.5, earH * 0.5, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#D2955A';
    ctx.beginPath();
    ctx.ellipse(cx + fw * 0.43, cy - fh * 0.33 + Math.cos(t) * 3, earW * 0.28, earH * 0.32, 0.35, 0, Math.PI * 2);
    ctx.fill();
    // Dog nose
    ctx.fillStyle = '#1E1B18';
    ctx.beginPath();
    ctx.ellipse(cx, cy + fh * 0.08, fw * 0.12, fh * 0.075, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.ellipse(cx - fw * 0.03, cy + fh * 0.06, fw * 0.03, fh * 0.018, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Playful tongue
    ctx.fillStyle = '#FB7185';
    ctx.beginPath();
    ctx.ellipse(cx, cy + fh * 0.28 + Math.abs(Math.sin(t * 2)) * 4, fw * 0.08, fh * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (lensType === 'cat_ears') {
    const drawCatEar = (side: -1 | 1) => {
      ctx.fillStyle = '#18181B';
      ctx.beginPath();
      ctx.moveTo(cx + side * fw * 0.16, cy - fh * 0.44);
      ctx.lineTo(cx + side * fw * 0.44, cy - fh * 0.72);
      ctx.lineTo(cx + side * fw * 0.46, cy - fh * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#F472B6';
      ctx.beginPath();
      ctx.moveTo(cx + side * fw * 0.21, cy - fh * 0.44);
      ctx.lineTo(cx + side * fw * 0.39, cy - fh * 0.63);
      ctx.lineTo(cx + side * fw * 0.41, cy - fh * 0.35);
      ctx.closePath();
      ctx.fill();
    };
    drawCatEar(-1);
    drawCatEar(1);
    // Pink triangle nose
    ctx.fillStyle = '#F472B6';
    ctx.beginPath();
    ctx.moveTo(cx - fw * 0.07, cy + fh * 0.04);
    ctx.lineTo(cx + fw * 0.07, cy + fh * 0.04);
    ctx.lineTo(cx, cy + fh * 0.11);
    ctx.closePath();
    ctx.fill();
    // Whiskers
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = Math.max(2, fw * 0.012);
    [-1, 1].forEach((side) => {
      [-0.06, 0.03, 0.12].forEach((dy) => {
        ctx.beginPath();
        ctx.moveTo(cx + side * fw * 0.15, cy + fh * (0.06 + dy * 0.4));
        ctx.lineTo(cx + side * fw * 0.46, cy + fh * (0.02 + dy));
        ctx.stroke();
      });
    });
  } else if (lensType === 'bunny_ears') {
    [-1, 1].forEach((side) => {
      const tilt = side * 0.12 + Math.sin(t + side) * 0.04;
      ctx.save();
      ctx.translate(cx + side * fw * 0.22, cy - fh * 0.46);
      ctx.rotate(tilt);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(0, -fh * 0.22, fw * 0.11, fh * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FBCFE8';
      ctx.beginPath();
      ctx.ellipse(0, -fh * 0.21, fw * 0.06, fh * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Blush
    ctx.fillStyle = 'rgba(244, 114, 182, 0.35)';
    ctx.beginPath();
    ctx.ellipse(cx - fw * 0.24, cy + fh * 0.08, fw * 0.11, fh * 0.055, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + fw * 0.24, cy + fh * 0.08, fw * 0.11, fh * 0.055, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (lensType === 'sunglasses') {
    const eyeY = cy - fh * 0.08;
    const lensW = fw * 0.28;
    const lensH = fh * 0.16;
    ctx.fillStyle = '#09090B';
    ctx.strokeStyle = '#FFFC00';
    ctx.lineWidth = Math.max(3, fw * 0.022);
    // Left lens
    ctx.beginPath();
    ctx.roundRect(cx - fw * 0.36, eyeY - lensH / 2, lensW, lensH, 10);
    ctx.fill();
    ctx.stroke();
    // Right lens
    ctx.beginPath();
    ctx.roundRect(cx + fw * 0.08, eyeY - lensH / 2, lensW, lensH, 10);
    ctx.fill();
    ctx.stroke();
    // Bridge
    ctx.beginPath();
    ctx.moveTo(cx - fw * 0.08, eyeY - lensH * 0.2);
    ctx.lineTo(cx + fw * 0.08, eyeY - lensH * 0.2);
    ctx.stroke();
    // Shine
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - fw * 0.31, eyeY - lensH * 0.25);
    ctx.lineTo(cx - fw * 0.2, eyeY + lensH * 0.25);
    ctx.moveTo(cx + fw * 0.13, eyeY - lensH * 0.25);
    ctx.lineTo(cx + fw * 0.24, eyeY + lensH * 0.25);
    ctx.stroke();
  } else if (lensType === 'crown') {
    const crownY = cy - fh * 0.56 + Math.sin(t * 1.5) * 4;
    const cw = fw * 0.52;
    const ch = fh * 0.22;
    ctx.fillStyle = '#FACC15';
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - cw / 2, crownY);
    ctx.lineTo(cx - cw * 0.45, crownY - ch);
    ctx.lineTo(cx - cw * 0.2, crownY - ch * 0.45);
    ctx.lineTo(cx, crownY - ch * 1.15);
    ctx.lineTo(cx + cw * 0.2, crownY - ch * 0.45);
    ctx.lineTo(cx + cw * 0.45, crownY - ch);
    ctx.lineTo(cx + cw / 2, crownY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Sparkles
    ctx.fillStyle = '#FFFC00';
    for (let i = 0; i < 4; i++) {
      const angle = t + (i * Math.PI) / 2;
      const sx = cx + Math.cos(angle) * fw * 0.48;
      const sy = cy - fh * 0.38 + Math.sin(angle) * fh * 0.12;
      ctx.beginPath();
      ctx.arc(sx, sy, 3 + Math.sin(t * 3 + i) * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (lensType === 'cyber_mask') {
    const eyeY = cy - fh * 0.08;
    ctx.strokeStyle = '#22D3EE';
    ctx.fillStyle = 'rgba(34, 211, 238, 0.22)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - fw * 0.4, eyeY - fh * 0.09);
    ctx.lineTo(cx + fw * 0.4, eyeY - fh * 0.09);
    ctx.lineTo(cx + fw * 0.34, eyeY + fh * 0.08);
    ctx.lineTo(cx + fw * 0.08, eyeY + fh * 0.04);
    ctx.lineTo(cx - fw * 0.08, eyeY + fh * 0.04);
    ctx.lineTo(cx - fw * 0.34, eyeY + fh * 0.08);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Scan line
    const scanX = cx - fw * 0.35 + ((Math.sin(t * 2) + 1) / 2) * fw * 0.7;
    ctx.strokeStyle = '#FFFC00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(scanX, eyeY - fh * 0.08);
    ctx.lineTo(scanX, eyeY + fh * 0.06);
    ctx.stroke();
  } else if (lensType === 'makeup') {
    ctx.fillStyle = 'rgba(232, 121, 249, 0.32)';
    ctx.beginPath();
    ctx.ellipse(cx - fw * 0.24, cy + fh * 0.06, fw * 0.11, fh * 0.055, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + fw * 0.24, cy + fh * 0.06, fw * 0.11, fh * 0.055, 0, 0, Math.PI * 2);
    ctx.fill();
    // Stars on cheeks
    ctx.fillStyle = '#FFFC00';
    [-1, 1].forEach((side) => {
      const sx = cx + side * fw * 0.26;
      const sy = cy + fh * 0.05;
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.arc(sx + side * 10, sy - 7, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (lensType === 'face_decor') {
    for (let i = 0; i < 3; i++) {
      const a = t * 1.1 + i * 2.1;
      const bx = cx + Math.cos(a) * fw * 0.42;
      const by = cy - fh * 0.25 + Math.sin(a * 1.4) * fh * 0.15;
      ctx.fillStyle = i % 2 === 0 ? '#FFFC00' : '#34D399';
      ctx.beginPath();
      ctx.ellipse(bx - 5, by, 6, 4, -0.4, 0, Math.PI * 2);
      ctx.ellipse(bx + 5, by, 6, 4, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (lensType === 'funny_face') {
    // Goofy mustache + monocle
    ctx.strokeStyle = '#FFFC00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx + fw * 0.18, cy - fh * 0.08, fw * 0.13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#27272A';
    ctx.beginPath();
    ctx.ellipse(cx - fw * 0.09, cy + fh * 0.13, fw * 0.12, fh * 0.045, -0.2, 0, Math.PI * 2);
    ctx.ellipse(cx + fw * 0.09, cy + fh * 0.13, fw * 0.12, fh * 0.045, 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (lensType === 'big_eyes') {
    const eyeY = cy - fh * 0.08;
    [-1, 1].forEach((side) => {
      const ex = cx + side * fw * 0.18;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ex, eyeY, fw * 0.11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#09090B';
      ctx.beginPath();
      ctx.arc(ex + Math.sin(t) * 3, eyeY, fw * 0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ex - 4, eyeY - 4, fw * 0.025, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (lensType === 'small_face') {
    ctx.strokeStyle = 'rgba(255, 252, 0, 0.45)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, fw * 0.24, fh * 0.28, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

export function applyCanvasPostEffect(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  mode: FilterPreset['canvasMode'],
  timeMs: number,
  intensity: number
) {
  if (!mode || mode === 'none') return;
  const alpha = Math.max(0.15, Math.min(1, intensity));

  ctx.save();
  if (mode === 'vhs') {
    ctx.fillStyle = `rgba(0, 0, 0, ${0.18 * alpha})`;
    for (let y = 0; y < height; y += 6) {
      ctx.fillRect(0, y, width, 2);
    }
    const barY = ((timeMs * 0.08) % (height + 40)) - 20;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.14 * alpha})`;
    ctx.fillRect(0, barY, width, 12);
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillStyle = `rgba(255, 252, 0, ${0.85 * alpha})`;
    ctx.fillText('PLAY ▶ 1998-11-19', 18, 34);
  } else if (mode === 'glitch') {
    const slices = 4;
    for (let i = 0; i < slices; i++) {
      const sy = ((Math.sin(timeMs * 0.01 + i * 3) + 1) / 2) * (height - 40);
      const sh = 14 + (i % 3) * 10;
      const offset = Math.sin(timeMs * 0.03 + i * 7) * 18 * alpha;
      ctx.drawImage(ctx.canvas, 0, sy, width, sh, offset, sy, width, sh);
    }
  } else if (mode === 'rgb_split') {
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.25 * alpha;
    ctx.fillStyle = '#FF0040';
    ctx.fillRect(-6 * alpha, 0, width, height);
    ctx.fillStyle = '#00F0FF';
    ctx.fillRect(6 * alpha, 0, width, height);
  } else if (mode === 'rainbow') {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, `rgba(255, 0, 128, ${0.28 * alpha})`);
    grad.addColorStop(0.33, `rgba(255, 252, 0, ${0.24 * alpha})`);
    grad.addColorStop(0.66, `rgba(0, 229, 255, ${0.26 * alpha})`);
    grad.addColorStop(1, `rgba(168, 85, 247, ${0.28 * alpha})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (mode === 'neon') {
    const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.2, width / 2, height / 2, width * 0.75);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(34, 211, 238, ${0.32 * alpha})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (mode === 'retro') {
    const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.25, width / 2, height / 2, width * 0.75);
    grad.addColorStop(0, 'rgba(255, 230, 180, 0.08)');
    grad.addColorStop(1, `rgba(0, 0, 0, ${0.55 * alpha})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (mode === 'dream') {
    ctx.fillStyle = `rgba(255, 235, 250, ${0.14 * alpha})`;
    ctx.fillRect(0, 0, width, height);
  } else if (mode === 'pixel') {
    const factor = Math.max(12, Math.round(28 - 16 * alpha));
    const sw = Math.max(16, Math.floor(width / factor));
    const sh = Math.max(16, Math.floor(height / factor));
    const temp = document.createElement('canvas');
    temp.width = sw;
    temp.height = sh;
    const tctx = temp.getContext('2d');
    if (tctx) {
      tctx.drawImage(ctx.canvas, 0, 0, sw, sh);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(temp, 0, 0, sw, sh, 0, 0, width, height);
      ctx.imageSmoothingEnabled = true;
    }
  } else if (mode === 'sketch') {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.12 * alpha})`;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.restore();
}
