import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from "three";
import { drawPlant, grow, SPECIES } from "./lsystem";
import { range, seeded } from "./random";

/**
 * Every texture in the scene is drawn here, on canvas, at load. Nothing is
 * downloaded: the window view, the rain, the labels and sleeve, the record
 * grooves, the hallway floor and the relief wallpaper are all authored in code.
 */

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  return { c, ctx };
}

function tex(c: HTMLCanvasElement, srgb = true): CanvasTexture {
  const t = new CanvasTexture(c);
  if (srgb) t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** The face loaded by next/font, for text painted into the scene. */
export function voice(): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-voice").trim();
  return v || "system-ui, sans-serif";
}

/** A pencil line: drawn twice with a hair of offset, like a light hand. */
function pencil(ctx: CanvasRenderingContext2D, pts: [number, number][], r: () => number) {
  for (let pass = 0; pass < 2; pass++) {
    ctx.beginPath();
    pts.forEach(([x, y], i) => {
      const jx = x + (r() - 0.5) * 1.6;
      const jy = y + (r() - 0.5) * 1.6;
      if (i === 0) ctx.moveTo(jx, jy);
      else ctx.lineTo(jx, jy);
    });
    ctx.stroke();
  }
}

/* ---------- Window: an original rainy garden view ---------- */

export function windowView(): Texture {
  const W = 1536;
  const H = 1024;
  const { c, ctx } = canvas(W, H);
  const r = seeded(4021);
  const ink = "rgba(38,40,42,0.85)";

  // Bright wet daylight: the brightest thing in the room.
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#ffffff");
  sky.addColorStop(0.5, "#fffef8");
  sky.addColorStop(1, "#fbf6e8");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  // Wash: loose watercolour bands of grey-blue cloud.
  dabs(ctx, W, H * 0.45, r, 120, [206, 222, 228], 18, [80, 220], [0.06, 0.14], 0);

  // Far terrace across the lane: pale wash, inked outline, hatched roofs.
  let x = -30;
  const base = H * 0.64;
  ctx.lineCap = "round";
  while (x < W) {
    const w = range(r, 130, 230);
    const roof = range(r, 60, 120);
    const wall = range(r, 90, 150);
    const tone = range(r, -10, 10);
    ctx.fillStyle = `rgb(${226 + tone},${222 + tone},${212 + tone})`;
    ctx.beginPath();
    ctx.moveTo(x, base);
    ctx.lineTo(x, base - wall);
    ctx.lineTo(x + w / 2, base - wall - roof);
    ctx.lineTo(x + w, base - wall);
    ctx.lineTo(x + w, base);
    ctx.closePath();
    ctx.fill();
    // The lit side of the gable takes the low daylight: a warm wash.
    ctx.fillStyle = "rgba(246,214,160,0.75)";
    ctx.fillRect(x + w / 2, base - wall, w / 2, wall);
    // Roof hatching, slanted with the pitch.
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, base - wall);
    ctx.lineTo(x + w / 2, base - wall - roof);
    ctx.lineTo(x + w, base - wall);
    ctx.closePath();
    ctx.clip();
    ctx.strokeStyle = "rgba(90,96,104,0.45)";
    ctx.lineWidth = 1.2;
    for (let k = -roof; k < w + roof; k += 7) {
      ctx.beginPath();
      ctx.moveTo(x + k, base - wall);
      ctx.lineTo(x + k + roof * 0.6, base - wall - roof);
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.2;
    pencil(ctx, [[x, base], [x, base - wall], [x + w / 2, base - wall - roof], [x + w, base - wall], [x + w, base]], r);
    // Windows: some lit warm, all inked.
    for (let k = 0; k < 2; k++) {
      const wx = x + w * (0.22 + k * 0.4);
      const wy = base - wall * 0.62;
      ctx.fillStyle = r() > 0.6 ? "rgba(240,196,120,0.9)" : "rgba(170,186,192,0.7)";
      ctx.fillRect(wx, wy, 26, 34);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(wx, wy, 26, 34);
    }
    if (r() > 0.35) {
      const cx = x + w * range(r, 0.62, 0.78);
      const cy = base - wall - roof * 0.42;
      ctx.fillStyle = "#d9c8b4";
      ctx.fillRect(cx, cy - 50, 24, 50);
      ctx.strokeStyle = ink;
      pencil(ctx, [[cx, cy], [cx, cy - 50], [cx + 24, cy - 50], [cx + 24, cy]], r);
    }
    x += w + range(r, 6, 26);
  }

  // Garden wall: brick courses in ink over a terracotta wash.
  const wallTop = H * 0.68;
  ctx.fillStyle = "#c9876a";
  ctx.fillRect(0, wallTop, W, H * 0.08);
  ctx.strokeStyle = "rgba(70,40,30,0.55)";
  ctx.lineWidth = 1.4;
  for (let y = wallTop; y < wallTop + H * 0.08; y += 14) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    for (let bx = ((y / 14) % 2) * 22; bx < W; bx += 44) {
      ctx.beginPath();
      ctx.moveTo(bx, y);
      ctx.lineTo(bx, y + 14);
      ctx.stroke();
    }
  }

  // Wet hedge in fresh greens.
  ctx.fillStyle = "#6f9a62";
  ctx.beginPath();
  ctx.moveTo(0, H * 0.78);
  for (let i = 0; i <= 48; i++) ctx.lineTo((W * i) / 48, H * 0.75 + Math.sin(i * 1.3) * 12 + r() * 16);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.fill();
  for (let i = 0; i < 1300; i++) {
    const g = range(r, -24, 24);
    ctx.fillStyle = `rgba(${86 + g},${136 + g},${80 + g * 0.5},${range(r, 0.35, 0.7)})`;
    ctx.beginPath();
    ctx.ellipse(r() * W, H * 0.76 + r() * H * 0.24, 7 + r() * 11, 4 + r() * 6, r() * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Hydrangea heads: saturated blue clusters with inked florets.
  for (let k = 0; k < 11; k++) {
    const hx = range(r, 40, W * 0.66);
    const hy = range(r, H * 0.66, H * 0.86);
    const rad = range(r, 44, 72);
    for (let i = 0; i < 260; i++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * rad;
      ctx.fillStyle = `rgba(${52 + r() * 40},${104 + r() * 40},${214 + r() * 41},${0.8 + r() * 0.2})`;
      ctx.beginPath();
      ctx.arc(hx + Math.cos(a) * d, hy + Math.sin(a) * d * 0.8, 2.5 + r() * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(40,50,80,0.5)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(hx, hy, rad, rad * 0.8, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // The tree, grown by the same L-system as the hallway plants, in ink.
  const tree = SPECIES.find((s) => s.name === "tree")!;
  const plant = grow(tree, 77, W * 0.8, H * 1.02, H * 1.15);
  for (const s of plant.strokes) {
    if (s.w > 2.5) continue;
    for (let i = 0; i < 3; i++) {
      const g = range(r, -20, 20);
      ctx.fillStyle = `rgba(${96 + g},${146 + g},${88 + g * 0.5},${0.32 + r() * 0.3})`;
      ctx.beginPath();
      ctx.ellipse(s.x2 + range(r, -16, 16), s.y2 + range(r, -16, 16), 11 + r() * 15, 7 + r() * 9, r() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.strokeStyle = "rgba(46,38,32,0.95)";
  ctx.fillStyle = "rgba(80,120,70,0.7)";
  drawPlant(ctx, plant);

  grain(ctx, W, H, r, 14000);
  return tex(c);
}

export function rain(): Texture {
  const W = 256;
  const H = 512;
  const { c, ctx } = canvas(W, H);
  const r = seeded(9);
  ctx.lineCap = "round";
  for (let i = 0; i < 90; i++) {
    const x = r() * W;
    const y = r() * H;
    const len = range(r, 18, 56);
    ctx.strokeStyle = `rgba(245,250,252,${range(r, 0.25, 0.6)})`;
    ctx.lineWidth = range(r, 0.8, 1.6);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - len * 0.12, y + len);
    ctx.stroke();
  }
  const t = tex(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}

/** The window's light on the floor: panes as soft bright patches. */
export function lightSpill(cols: number, rows: number): Texture {
  const W = 512;
  const H = 512;
  const { c, ctx } = canvas(W, H);
  const pad = 30;
  const gw = (W - pad * 2) / cols;
  const gh = (H - pad * 2) / rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = pad + i * gw + 7;
      const y = pad + j * gh + 7;
      // Outer band, then a brighter core: flat cel steps like the painted references.
      ctx.fillStyle = `rgba(255,246,228,${0.55 - j * 0.12})`;
      ctx.fillRect(x, y, gw - 14, gh - 14);
      ctx.fillStyle = `rgba(255,246,228,${0.95 - j * 0.2})`;
      ctx.fillRect(x + 12, y + 12, gw - 38, gh - 38);
    }
  }
  return tex(c);
}

/** A hard-edged pool of lamp light: two flat steps, the cel version of a falloff. */
export function pool(): Texture {
  const S = 256;
  const { c, ctx } = canvas(S, S);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.beginPath();
  ctx.ellipse(S / 2, S / 2, S * 0.48, S * 0.48, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,1)";
  ctx.beginPath();
  ctx.ellipse(S / 2, S / 2, S * 0.3, S * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  return tex(c);
}

/* ---------- Labels, sleeve, record ---------- */

export function shelfLabel(text: string, hot: boolean): Texture {
  const W = 512;
  const H = 128;
  const { c, ctx } = canvas(W, H);
  ctx.fillStyle = hot ? "#f4e7c8" : "#e6d6b6";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#2a2219";
  ctx.lineWidth = 5;
  ctx.strokeRect(10, 10, W - 20, H - 20);
  ctx.fillStyle = "#1f1914";
  ctx.font = `600 62px ${voice()}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, W / 2, H / 2 + 3, W - 60);
  if (hot) {
    ctx.fillRect(W / 2 - ctx.measureText(text).width / 2, H - 30, ctx.measureText(text).width, 4);
  }
  return tex(c);
}

export const SLEEVE_LIST = { top: 0.4, bottom: 0.92 };

export function sleeve(titles: readonly string[], name: string, active: number, playing: boolean): Texture {
  const S = 1024;
  const { c, ctx } = canvas(S, S);
  const r = seeded(31);
  ctx.fillStyle = "#c97b62";
  ctx.fillRect(0, 0, S, S);
  // A big inked ring, drawn by hand: the record seen from above.
  ctx.strokeStyle = "#1f1914";
  ctx.lineWidth = 7;
  for (let pass = 0; pass < 2; pass++) {
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.05) {
      const rad = 190 + (r() - 0.5) * 6;
      const px = S * 0.98 + Math.cos(a) * rad;
      const py = S * 0.02 + Math.sin(a) * rad;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.fillStyle = "#1f1914";
  ctx.textBaseline = "alphabetic";
  ctx.font = `700 92px ${voice()}`;
  ctx.fillText(name, 64, 190, S - 128);
  ctx.font = `500 40px ${voice()}`;
  ctx.fillText("Side A", 64, 260);

  const top = S * SLEEVE_LIST.top;
  const rowH = (S * (SLEEVE_LIST.bottom - SLEEVE_LIST.top)) / Math.max(1, titles.length);
  titles.forEach((t, i) => {
    const y = top + rowH * i;
    const on = i === active;
    if (on) {
      ctx.fillStyle = "rgba(31,25,20,0.14)";
      ctx.fillRect(40, y + 6, S - 80, rowH - 12);
    }
    ctx.fillStyle = "#1f1914";
    ctx.font = `${on ? 700 : 500} ${Math.min(52, rowH * 0.42)}px ${voice()}`;
    ctx.fillText(`${i + 1}.`, 64, y + rowH * 0.62);
    ctx.fillText(t, 150, y + rowH * 0.62, S - 260);
    if (on && playing) {
      // Three bars: now playing.
      for (let b = 0; b < 3; b++) ctx.fillRect(S - 120 + b * 18, y + rowH * 0.3 + (b % 2) * 10, 10, rowH * 0.4 - (b % 2) * 10);
    }
    ctx.strokeStyle = "rgba(31,25,20,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(64, y + rowH);
    ctx.lineTo(S - 64, y + rowH);
    ctx.stroke();
  });
  return tex(c);
}

export function grooves(name: string): Texture {
  const S = 512;
  const { c, ctx } = canvas(S, S);
  ctx.fillStyle = "#141210";
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2);
  ctx.fill();
  for (let rad = S * 0.18; rad < S * 0.49; rad += 2.4) {
    ctx.strokeStyle = `rgba(255,255,255,${0.025 + Math.random() * 0.035})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, rad, 0, Math.PI * 2);
    ctx.stroke();
  }
  // A highlight band so the spin reads.
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 40;
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S * 0.34, -0.5, 0.1);
  ctx.stroke();
  ctx.fillStyle = "#c9a33f";
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1f1914";
  ctx.font = `600 20px ${voice()}`;
  ctx.textAlign = "center";
  ctx.fillText(name, S / 2, S / 2 - 22);
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, 6, 0, Math.PI * 2);
  ctx.fill();
  return tex(c);
}

/* ---------- Hallway ---------- */

export function checker(): Texture {
  const S = 256;
  const { c, ctx } = canvas(S, S);
  const r = seeded(5);
  const n = 2;
  const cell = S / n;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      ctx.fillStyle = (i + j) % 2 ? "#1d2124" : "#a9a395";
      ctx.fillRect(i * cell, j * cell, cell, cell);
    }
  }
  // Scratchboard grain, like the linocut reference.
  for (let i = 0; i < 700; i++) {
    const x = r() * S;
    const y = r() * S;
    ctx.strokeStyle = r() > 0.5 ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + range(r, -10, 10), y + range(r, 2, 6));
    ctx.stroke();
  }
  const t = tex(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}

/**
 * Relief wallpaper for one hallway wall panel. Returns a bump map: plants
 * drawn as raised strokes (white on grey, softened) so they show only
 * through the light raking across them, like the plaster references.
 * Cached by seed; the same panel always grows the same plants.
 */
const reliefCache = new Map<number, Texture>();
const RELIEF_CACHE_MAX = 32;

export function relief(seed: number): Texture {
  const hit = reliefCache.get(seed);
  if (hit) return hit;
  const W = 512;
  const H = 640;
  const { c, ctx } = canvas(W, H);
  const r = seeded(seed * 7919 + 13);
  ctx.fillStyle = "#5a5a5a";
  ctx.fillRect(0, 0, W, H);

  const count = 8 + Math.floor(r() * 5);
  const plants = Array.from({ length: count }, () => {
    const species = SPECIES[Math.floor(r() * 3)]; // not the tree
    const px = range(r, W * 0.08, W * 0.92);
    return grow(species, Math.floor(r() * 1e9), px, H * 1.01, H * range(r, 0.9, 1.25));
  });
  // Soft shoulder: every plant drawn wide on its own layer, blurred once
  // (a filter on each stroke would blur thousands of times).
  const { c: shoulder, ctx: sctx } = canvas(W, H);
  sctx.strokeStyle = sctx.fillStyle = "#b0b0b0";
  for (const p of plants) drawPlant(sctx, p, 2.6);
  ctx.filter = "blur(3px)";
  ctx.drawImage(shoulder, 0, 0);
  ctx.filter = "none";
  // Then a crisp crest on top: reads as moulded plaster.
  ctx.strokeStyle = ctx.fillStyle = "#ffffff";
  for (const p of plants) drawPlant(ctx, p, 1);
  const t = tex(c, false);
  if (reliefCache.size >= RELIEF_CACHE_MAX) {
    const oldest = reliefCache.keys().next().value as number;
    reliefCache.get(oldest)?.dispose();
    reliefCache.delete(oldest);
  }
  reliefCache.set(seed, t);
  return t;
}

/** A labelled stand-in for artwork that has not been supplied yet. */
export function placeholderArt(title: string, seed: number): Texture {
  const W = 512;
  const H = 640;
  const { c, ctx } = canvas(W, H);
  const r = seeded(seed + 101);
  ctx.fillStyle = "#d9d2c3";
  ctx.fillRect(0, 0, W, H);
  // Cross-hatched field, so it reads as a drawing rather than an empty mat.
  ctx.strokeStyle = "rgba(40,38,34,0.22)";
  ctx.lineWidth = 1;
  for (let i = -H; i < W; i += 9) {
    ctx.beginPath();
    ctx.moveTo(i + r() * 3, 0);
    ctx.lineTo(i + H + r() * 3, H);
    ctx.stroke();
  }
  ctx.fillStyle = "#d9d2c3";
  ctx.fillRect(40, H - 170, W - 80, 120);
  ctx.fillStyle = "#1f1d1a";
  ctx.font = `600 34px ${voice()}`;
  ctx.fillText(title, 64, H - 112, W - 128);
  ctx.font = `400 24px ${voice()}`;
  ctx.fillText("Placeholder: add the image in site.ts", 64, H - 74, W - 128);
  return tex(c);
}

/* ---------- Painted room materials ---------- */

/** Brush dabs: many soft, elongated, slightly off-hue strokes over a base. */
function dabs(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  r: () => number,
  n: number,
  rgb: [number, number, number],
  spread: number,
  size: [number, number],
  alpha: [number, number],
  angle?: number,
) {
  for (let i = 0; i < n; i++) {
    const k = (r() - 0.5) * spread;
    ctx.fillStyle = `rgba(${rgb[0] + k},${rgb[1] + k * 0.9},${rgb[2] + k * 0.7},${range(r, alpha[0], alpha[1])})`;
    ctx.beginPath();
    const len = range(r, size[0], size[1]);
    ctx.ellipse(r() * W, r() * H, len, len * range(r, 0.18, 0.4), angle ?? r() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
}

function grain(ctx: CanvasRenderingContext2D, W: number, H: number, r: () => number, n: number) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = r() > 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
    ctx.fillRect(r() * W, r() * H, 1.5, 1.5);
  }
}

function repeatTex(c: HTMLCanvasElement) {
  const t = tex(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}

/** Ochre limewash: cloudy, uneven, brushed in every direction. */
export function limewash(base = "#c99a5b"): Texture {
  const S = 512;
  const { c, ctx } = canvas(S, S);
  const r = seeded(base.length * 97 + 3);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  const n = parseInt(base.slice(1), 16);
  const rgb: [number, number, number] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  dabs(ctx, S, S, r, 700, rgb, 46, [30, 90], [0.06, 0.16]);
  dabs(ctx, S, S, r, 500, [rgb[0] + 18, rgb[1] + 16, rgb[2] + 10], 20, [12, 40], [0.05, 0.12]);
  grain(ctx, S, S, r, 9000);
  return repeatTex(c);
}

/** Sage paint over wood: vertical brush strokes. */
export function sagePaint(): Texture {
  const S = 512;
  const { c, ctx } = canvas(S, S);
  const r = seeded(212);
  ctx.fillStyle = "#8a9e86";
  ctx.fillRect(0, 0, S, S);
  dabs(ctx, S, S, r, 900, [138, 158, 134], 30, [20, 70], [0.07, 0.16], Math.PI / 2);
  grain(ctx, S, S, r, 7000);
  return repeatTex(c);
}

/** Oak boards: planks of varied tone, grain lines, inked seams. Tiles every 1 m. */
export function floorboards(): Texture {
  const S = 1024;
  const { c, ctx } = canvas(S, S);
  const r = seeded(88);
  const planks = 6;
  const pw = S / planks;
  for (let i = 0; i < planks; i++) {
    let y = -r() * 400;
    while (y < S) {
      const len = range(r, 380, 900);
      const tone = range(r, -14, 14);
      ctx.fillStyle = `rgb(${122 + tone},${79 + tone * 0.8},${46 + tone * 0.6})`;
      ctx.fillRect(i * pw, y, pw, len);
      ctx.strokeStyle = "rgba(60,36,20,0.28)";
      ctx.lineWidth = 1.2;
      for (let g = 0; g < 7; g++) {
        const gx = i * pw + range(r, 6, pw - 6);
        ctx.beginPath();
        ctx.moveTo(gx, y);
        ctx.bezierCurveTo(gx + range(r, -6, 6), y + len * 0.3, gx + range(r, -6, 6), y + len * 0.7, gx + range(r, -4, 4), y + len);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(26,23,20,0.85)";
      ctx.fillRect(i * pw, y, pw, 3);
      y += len;
    }
    ctx.fillStyle = "rgba(26,23,20,0.85)";
    ctx.fillRect(i * pw, 0, 3, S);
  }
  grain(ctx, S, S, r, 12000);
  return repeatTex(c);
}

/** Oxblood runner: woven pile and a mustard border. */
export function runner(): Texture {
  const W = 512;
  const H = 768;
  const { c, ctx } = canvas(W, H);
  const r = seeded(19);
  ctx.fillStyle = "#7c2a24";
  ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 3) {
    ctx.fillStyle = `rgba(${r() > 0.5 ? "255,220,200" : "30,8,6"},${range(r, 0.03, 0.08)})`;
    ctx.fillRect(0, y, W, 1.5);
  }
  const b = 34;
  ctx.strokeStyle = "#c9a33f";
  ctx.lineWidth = 10;
  ctx.strokeRect(b, b, W - b * 2, H - b * 2);
  ctx.strokeStyle = "#c97b62";
  ctx.lineWidth = 3;
  ctx.strokeRect(b + 18, b + 18, W - b * 2 - 36, H - b * 2 - 36);
  // A row of lozenges inside the border.
  ctx.fillStyle = "#c9a33f";
  for (let y = b + 60; y < H - b - 40; y += 54) {
    for (const x of [b + 34, W - b - 34]) {
      ctx.beginPath();
      ctx.moveTo(x, y - 12);
      ctx.lineTo(x + 9, y);
      ctx.lineTo(x, y + 12);
      ctx.lineTo(x - 9, y);
      ctx.closePath();
      ctx.fill();
    }
  }
  grain(ctx, W, H, r, 8000);
  return tex(c);
}

/**
 * Bookcloth spine, drawn white so each instance's colour tints it:
 * cloth weave, gilt bands near head and foot, a blind-stamped title block.
 */
export function spine(): Texture {
  const W = 64;
  const H = 256;
  const { c, ctx } = canvas(W, H);
  const r = seeded(5150);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 2) {
    ctx.fillStyle = `rgba(0,0,0,${range(r, 0.02, 0.06)})`;
    ctx.fillRect(0, y, W, 1);
  }
  ctx.fillStyle = "rgba(255,226,150,0.9)";
  for (const y of [18, 26, H - 30, H - 22]) ctx.fillRect(4, y, W - 8, 3);
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  for (let y = 70; y < 170; y += 12) ctx.fillRect(18, y, W - 36 - r() * 10, 4);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0, 0, 3, H);
  ctx.fillRect(W - 3, 0, 3, H);
  return tex(c);
}

/** A soft round glow for lamp halos and light pools. */
export function glow(): Texture {
  const S = 128;
  const { c, ctx } = canvas(S, S);
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.45)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return tex(c);
}
