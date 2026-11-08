import { pick, range, seeded, type Rand } from "./random";

/**
 * Lindenmayer systems for the plants: the hallway's relief wallpaper and the
 * tree outside the window. A species is an axiom, stochastic rules and a few
 * drawing parameters; a seed picks the rule variants and jitters every angle,
 * so one seed always grows the same plant and no two seeds grow alike.
 *
 * Alphabet: F grow, X/Y/A placeholders, + - turn, [ ] branch,
 * U umbel (a spray of short rays with dots), L leaf, S seed head (wheat ear), B bud.
 */

type Rule = { weight: number; to: string };

export type Species = {
  name: string;
  axiom: string;
  rules: Record<string, Rule[]>;
  iterations: [number, number];
  angle: [number, number];
  /** Length of one F, as a fraction of the canvas height. */
  step: [number, number];
  /** Each nested branch is this much shorter. */
  taper: number;
  width: number;
};

export const SPECIES: Species[] = [
  {
    name: "umbellifer", // Queen Anne's lace, cow parsley
    axiom: "FFFX",
    rules: {
      X: [
        { weight: 3, to: "F[+FFU]F[-FFU]FU" },
        { weight: 2, to: "F[+FU]F[-FFFU]FFU" },
        { weight: 1, to: "FF[-FU]FFU" },
      ],
    },
    iterations: [2, 3],
    angle: [18, 30],
    step: [0.055, 0.075],
    taper: 0.86,
    width: 2.2,
  },
  {
    name: "grass",
    axiom: "Y",
    rules: {
      Y: [
        { weight: 2, to: "F[+FFFS]F[-FFFFS]FFS" },
        { weight: 2, to: "[+FFFFFL][-FFFFL]FFFFFFS" },
        { weight: 1, to: "F[--FFFFL][++FFFL]FFFFFS" },
      ],
    },
    iterations: [1, 1],
    angle: [6, 14],
    step: [0.07, 0.095],
    taper: 0.95,
    width: 1.8,
  },
  {
    name: "sprig", // forget-me-not, small buds on curling stems
    axiom: "FA",
    rules: {
      A: [
        { weight: 3, to: "F[+FB]F[-FB]A" },
        { weight: 2, to: "F[-FLB]F[+FB]A" },
        { weight: 1, to: "F[+FA]B" },
      ],
    },
    iterations: [4, 6],
    angle: [24, 38],
    step: [0.04, 0.055],
    taper: 0.9,
    width: 1.6,
  },
  {
    name: "tree", // the bare-ish tree outside the window
    axiom: "FFX",
    rules: {
      X: [
        { weight: 3, to: "F[+FX][-FX]FX" },
        { weight: 2, to: "F[+FX]F[-FX]L" },
        { weight: 1, to: "F[--FX][+FX]L" },
      ],
    },
    iterations: [5, 5],
    angle: [18, 28],
    step: [0.045, 0.06],
    taper: 0.8,
    width: 9,
  },
];

function expand(s: Species, r: Rand): string {
  let str = s.axiom;
  const n = Math.round(range(r, s.iterations[0], s.iterations[1]));
  for (let i = 0; i < n; i++) {
    let next = "";
    for (const ch of str) {
      const rules = s.rules[ch];
      if (!rules) {
        next += ch;
        continue;
      }
      const total = rules.reduce((a, b) => a + b.weight, 0);
      let roll = r() * total;
      const rule = rules.find((x) => (roll -= x.weight) <= 0) ?? rules[0];
      next += rule.to;
    }
    str = next;
  }
  return str;
}

export type Stroke = { x1: number; y1: number; x2: number; y2: number; w: number };
export type Mark =
  | { kind: "dot"; x: number; y: number; r: number }
  | { kind: "leaf"; x: number; y: number; a: number; len: number }
  | { kind: "ear"; x: number; y: number; a: number; len: number };

export type Plant = { strokes: Stroke[]; marks: Mark[] };

/**
 * Grow one plant from (x, y) upward. Coordinates in pixels of a canvas of
 * height `h`. Returns segments and decorations; the caller draws them.
 */
export function grow(species: Species, seed: number, x: number, y: number, h: number): Plant {
  const r = seeded(seed);
  const str = expand(species, r);
  const baseAngle = range(r, species.angle[0], species.angle[1]) * (Math.PI / 180);
  const baseStep = range(r, species.step[0], species.step[1]) * h;
  const strokes: Stroke[] = [];
  const marks: Mark[] = [];
  type T = { x: number; y: number; a: number; len: number; w: number; depth: number };
  // Start with a gentle lean so stems are never ruler-straight.
  let t: T = { x, y, a: -Math.PI / 2 + range(r, -0.12, 0.12), len: baseStep, w: species.width, depth: 0 };
  const stack: T[] = [];

  for (const ch of str) {
    switch (ch) {
      case "F": {
        // Each step bends a little: stems curve like real ones.
        t.a += range(r, -0.06, 0.06);
        const nx = t.x + Math.cos(t.a) * t.len;
        const ny = t.y + Math.sin(t.a) * t.len;
        strokes.push({ x1: t.x, y1: t.y, x2: nx, y2: ny, w: Math.max(0.6, t.w) });
        t.x = nx;
        t.y = ny;
        break;
      }
      case "+":
        t.a += baseAngle * range(r, 0.7, 1.3);
        break;
      case "-":
        t.a -= baseAngle * range(r, 0.7, 1.3);
        break;
      case "[":
        stack.push({ ...t });
        t = { ...t, len: t.len * species.taper, w: t.w * 0.72, depth: t.depth + 1 };
        break;
      case "]":
        t = stack.pop() ?? t;
        break;
      case "U": {
        // Umbel: a fan of rays, each ending in a cluster of dots.
        const rays = 7 + Math.floor(r() * 6);
        const spread = range(r, 1.6, 2.4);
        for (let i = 0; i < rays; i++) {
          const a = t.a - spread / 2 + (spread * i) / (rays - 1) + range(r, -0.05, 0.05);
          const len = t.len * range(r, 0.9, 1.3);
          const ex = t.x + Math.cos(a) * len;
          const ey = t.y + Math.sin(a) * len;
          strokes.push({ x1: t.x, y1: t.y, x2: ex, y2: ey, w: 0.8 });
          for (let k = 0; k < 4; k++) {
            marks.push({ kind: "dot", x: ex + range(r, -3, 3), y: ey + range(r, -3, 3), r: range(r, 1.2, 2.2) });
          }
        }
        break;
      }
      case "L":
        marks.push({ kind: "leaf", x: t.x, y: t.y, a: t.a + pick(r, [-0.7, 0.7]), len: t.len * range(r, 1.2, 2) });
        break;
      case "S":
        marks.push({ kind: "ear", x: t.x, y: t.y, a: t.a, len: t.len * range(r, 1.6, 2.6) });
        break;
      case "B":
        marks.push({ kind: "dot", x: t.x, y: t.y, r: range(r, 2.2, 3.6) });
        break;
    }
  }
  return { strokes, marks };
}

/** Draw a plant's shapes onto a 2D context with the current stroke/fill style. */
export function drawPlant(ctx: CanvasRenderingContext2D, plant: Plant, scale = 1) {
  ctx.lineCap = "round";
  for (const s of plant.strokes) {
    ctx.lineWidth = s.w * scale;
    ctx.beginPath();
    ctx.moveTo(s.x1, s.y1);
    ctx.lineTo(s.x2, s.y2);
    ctx.stroke();
  }
  for (const m of plant.marks) {
    if (m.kind === "dot") {
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r * scale, 0, Math.PI * 2);
      ctx.fill();
    } else if (m.kind === "leaf") {
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.a);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(m.len * 0.5, -m.len * 0.28, m.len, 0);
      ctx.quadraticCurveTo(m.len * 0.5, m.len * 0.28, 0, 0);
      ctx.fill();
      ctx.restore();
    } else {
      // Wheat ear: paired grains along the tip.
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.a);
      const grains = 6;
      for (let i = 0; i < grains; i++) {
        const d = (m.len * i) / grains;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(d + 3, side * 3, 4.5 * scale, 2 * scale, side * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
  }
}
