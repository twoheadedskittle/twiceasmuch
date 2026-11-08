/** Mulberry32: tiny, fast, seeded. Same seed, same sequence, every load. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rand = ReturnType<typeof seeded>;

export const range = (r: Rand, min: number, max: number) => min + r() * (max - min);
export const pick = <T,>(r: Rand, list: readonly T[]) => list[Math.floor(r() * list.length)];
