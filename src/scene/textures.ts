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

  // Overcast sky, wet and pale.
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#b9c9cb");
  sky.addColorStop(0.55, "#dbe4e1");
  sky.addColorStop(1, "#e9ede6");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Far terrace roofs across the lane, washed out by the rain.
  ctx.strokeStyle = "rgba(92,108,114,0.55)";
  ctx.lineWidth = 1.6;
  let x = -20;
  const base = H * 0.66;
  while (x < W) {
    const w = range(r, 120, 220);
    const roof = range(r, 50, 110);
    const wall = range(r, 70, 130);
    ctx.fillStyle = `rgba(${150 + r() * 20},${166 + r() * 14},${172 + r() * 10},0.55)`;
    ctx.beginPath();
    ctx.moveTo(x, base);
    ctx.lineTo(x, base - wall);
    ctx.lineTo(x + w / 2, base - wall - roof);
    ctx.lineTo(x + w, base - wall);
    ctx.lineTo(x + w, base);
    ctx.closePath();
    ctx.fill();
    pencil(ctx, [[x, base], [x, base - wall], [x + w / 2, base - wall - roof], [x + w, base - wall], [x + w, base]], r);
    if (r() > 0.4) {
      const cx = x + w * range(r, 0.6, 0.8);
      const cy = base - wall - roof * 0.45;
      ctx.fillRect(cx, cy - 46, 22, 46);
      pencil(ctx, [[cx, cy], [cx, cy - 46], [cx + 22, cy - 46], [cx + 22, cy]], r);
    }
    // Two lit windows in some houses: warm, small, far.
    if (r() > 0.55) {
      ctx.fillStyle = "rgba(230,196,130,0.6)";
      ctx.fillRect(x + w * 0.25, base - wall * 0.6, 16, 20);
    }
    x += w + range(r, 4, 30);
  }

  // Garden wall and wet hedge.
  ctx.fillStyle = "rgba(128,146,124,0.85)";
  ctx.beginPath();
  ctx.moveTo(0, H * 0.74);
  for (let i = 0; i <= 40; i++) {
    ctx.lineTo((W * i) / 40, H * 0.72 + Math.sin(i * 1.7) * 10 + r() * 14);
  }
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.fill();
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(${84 + r() * 30},${104 + r() * 30},${86 + r() * 20},${0.25 + r() * 0.3})`;
    ctx.beginPath();
    ctx.ellipse(r() * W, H * 0.73 + r() * H * 0.27, 6 + r() * 10, 4 + r() * 6, r() * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Blue hydrangea heads in the hedge: clusters of tiny four-petal dots.
  for (let k = 0; k < 7; k++) {
    const hx = range(r, 40, W * 0.55);
    const hy = range(r, H * 0.78, H * 0.95);
    const rad = range(r, 26, 46);
    for (let i = 0; i < 140; i++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * rad;
      ctx.fillStyle = `rgba(${110 + r() * 40},${142 + r() * 30},${186 + r() * 30},${0.55 + r() * 0.35})`;
      ctx.beginPath();
      ctx.arc(hx + Math.cos(a) * d, hy + Math.sin(a) * d * 0.8, 2 + r() * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // The tree, grown by the same L-system as the hallway plants.
  const tree = SPECIES.find((s) => s.name === "tree")!;
  const plant = grow(tree, 77, W * 0.8, H * 1.02, H * 1.15);
  ctx.strokeStyle = "rgba(70,62,54,0.9)";
  ctx.fillStyle = "rgba(112,138,104,0.5)";
  drawPlant(ctx, plant);
  // Foliage: soft dabs around every branch tip.
  for (const s of plant.strokes) {
    if (s.w > 2.5) continue;
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = `rgba(${100 + r() * 30},${128 + r() * 30},${96 + r() * 20},${0.18 + r() * 0.2})`;
      ctx.beginPath();
      ctx.ellipse(s.x2 + range(r, -14, 14), s.y2 + range(r, -14, 14), 10 + r() * 14, 7 + r() * 9, r() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Rain haze over everything: the far distance dissolves.
  const haze = ctx.createLinearGradient(0, 0, 0, H);
  haze.addColorStop(0, "rgba(214,224,222,0.35)");
  haze.addColorStop(0.7, "rgba(214,224,222,0.05)");
  haze.addColorStop(1, "rgba(214,224,222,0)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, W, H);

  // Paper tooth.
  for (let i = 0; i < 14000; i++) {
    ctx.fillStyle = r() > 0.5 ? "rgba(255,255,255,0.05)" : "rgba(60,60,60,0.035)";
    ctx.fillRect(r() * W, r() * H, 1.5, 1.5);
  }
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
  ctx.filter = "blur(10px)";
  const pad = 30;
  const gw = (W - pad * 2) / cols;
  const gh = (H - pad * 2) / rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      // Panes nearer the window (top of texture) are brighter.
      ctx.fillStyle = `rgba(255,246,228,${0.95 - j * 0.22})`;
      ctx.fillRect(pad + i * gw + 6, pad + j * gh + 6, gw - 12, gh - 12);
    }
  }
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
      const rad = 300 + (r() - 0.5) * 6;
      const px = S * 0.66 + Math.cos(a) * rad;
      const py = S * 0.08 + Math.sin(a) * rad;
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
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, W, H);

  const count = 4 + Math.floor(r() * 4);
  const plants = Array.from({ length: count }, () => {
    const species = SPECIES[Math.floor(r() * 3)]; // not the tree
    const px = range(r, W * 0.08, W * 0.92);
    return grow(species, Math.floor(r() * 1e9), px, H * 1.01, H * range(r, 0.9, 1.25));
  });
  // Soft shoulder: every plant drawn wide on its own layer, blurred once
  // (a filter on each stroke would blur thousands of times).
  const { c: shoulder, ctx: sctx } = canvas(W, H);
  sctx.strokeStyle = sctx.fillStyle = "#c4c4c4";
  for (const p of plants) drawPlant(sctx, p, 2.2);
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
