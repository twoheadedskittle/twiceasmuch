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


/* ---------- Window: an original rainy garden view ---------- */

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
  ctx.fillStyle = "#d9ccb2";
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
  ctx.fillStyle = "#8b1a22";
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ecdcc0";
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

/**
 * Zigzag floor: black and cream chevron bands, worn and slightly uneven.
 * Tiles seamlessly; one repeat covers 1.6 m.
 */
export function zigzagFloor(): Texture {
  const S = 1024;
  const { c, ctx } = canvas(S, S);
  const r = seeded(1990);
  const bands = 8;
  const h = S / bands;
  const period = S / 4;
  const amp = h * 0.62;
  const zig = (x: number) => {
    const t = (((x % period) + period) % period) / period;
    return (t < 0.5 ? t * 2 : 2 - t * 2) * amp;
  };
  for (let k = -1; k <= bands; k++) {
    ctx.fillStyle = k % 2 === 0 ? "#e3d3a6" : "#141112";
    ctx.beginPath();
    for (let x = 0; x <= S; x += 4) ctx.lineTo(x, k * h + zig(x));
    for (let x = S; x >= 0; x -= 4) ctx.lineTo(x, (k + 1) * h + zig(x));
    ctx.closePath();
    ctx.fill();
  }
  // Wear: polish, scuffs and the grain of old paint on boards.
  for (let i = 0; i < 26000; i++) {
    ctx.fillStyle = r() > 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)";
    ctx.fillRect(r() * S, r() * S, 1.5 + r() * 2, 1.5);
  }
  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  for (let i = 0; i < 120; i++) {
    const x = r() * S;
    const y = r() * S;
    ctx.lineWidth = 0.6 + r();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + range(r, -30, 30), y + range(r, -6, 6), x + range(r, -60, 60), y + range(r, -10, 10));
    ctx.stroke();
  }
  return repeatTex(c);
}

/** A soft cumulus puff on transparent ground, for cloud sprites. */
export function cloudPuff(seed: number): Texture {
  const S = 256;
  const { c, ctx } = canvas(S, S);
  const r = seeded(seed + 7);
  for (let i = 0; i < 46; i++) {
    const x = S * 0.5 + range(r, -0.3, 0.3) * S;
    const y = S * 0.55 + range(r, -0.14, 0.12) * S - (1 - Math.abs(x / S - 0.5) * 2) * S * 0.08;
    const rad = range(r, 0.08, 0.2) * S;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  return tex(c);
}
