import { Color, MathUtils } from "three";

/**
 * The weather outside the window. Each preset is a complete look; the cycle
 * holds one for a few minutes, then crossfades to the next over half a
 * minute. Everything outdoors (sky, clouds, land, birds, rain) and the
 * daylight that falls into the room read from `outdoor`, updated each frame.
 */

export type Preset = {
  name: string;
  /** Sun elevation and azimuth in degrees. Azimuth 0 is straight ahead (-Z). */
  sun: [number, number];
  turbidity: number;
  rayleigh: number;
  mie: number;
  /** 0 clear, 1 fully overcast. */
  cloud: number;
  cloudColor: string;
  /** Direct sunlight on the land, and the sky's fill. */
  sunColor: string;
  ambient: string;
  /** The distance colour of the land: aerial perspective. */
  haze: string;
  /** Light entering the room through the window. */
  light: string;
  lightIntensity: number;
  rain: number;
  birds: number;
  stars: number;
};

export const PRESETS: Preset[] = [
  {
    name: "dawn",
    sun: [3, -35],
    turbidity: 6,
    rayleigh: 2.6,
    mie: 0.006,
    cloud: 0.35,
    cloudColor: "#f2c3b4",
    sunColor: "#ffb48a",
    ambient: "#5a5f7a",
    haze: "#c9a7a4",
    light: "#ffcfb0",
    lightIntensity: 22,
    rain: 0,
    birds: 1,
    stars: 0.15,
  },
  {
    name: "clear",
    sun: [38, 20],
    turbidity: 3,
    rayleigh: 1.2,
    mie: 0.004,
    cloud: 0.3,
    cloudColor: "#ffffff",
    sunColor: "#fff3df",
    ambient: "#6f8aa8",
    haze: "#b9cde0",
    light: "#f6f7f2",
    lightIntensity: 36,
    rain: 0,
    birds: 1,
    stars: 0,
  },
  {
    name: "overcast",
    sun: [30, 10],
    turbidity: 10,
    rayleigh: 0.6,
    mie: 0.02,
    cloud: 0.95,
    cloudColor: "#c4c8cc",
    sunColor: "#b8bcc0",
    ambient: "#8a9097",
    haze: "#aab2b8",
    light: "#e4e8ea",
    lightIntensity: 24,
    rain: 0,
    birds: 0.7,
    stars: 0,
  },
  {
    name: "rain",
    sun: [24, 0],
    turbidity: 14,
    rayleigh: 0.4,
    mie: 0.03,
    cloud: 1,
    cloudColor: "#8f969c",
    sunColor: "#8b9196",
    ambient: "#6c747c",
    haze: "#7f888f",
    light: "#cfd6da",
    lightIntensity: 16,
    rain: 1,
    birds: 0,
    stars: 0,
  },
  {
    name: "golden",
    sun: [7, 40],
    turbidity: 8,
    rayleigh: 2.2,
    mie: 0.008,
    cloud: 0.4,
    cloudColor: "#ffd59a",
    sunColor: "#ffb259",
    ambient: "#6b6070",
    haze: "#d9b07c",
    light: "#ffc37a",
    lightIntensity: 30,
    rain: 0,
    birds: 1,
    stars: 0,
  },
  {
    name: "dusk",
    sun: [-3, 55],
    turbidity: 6,
    rayleigh: 3,
    mie: 0.005,
    cloud: 0.3,
    cloudColor: "#c98b8a",
    sunColor: "#d97a5a",
    ambient: "#3a3f5c",
    haze: "#6e6478",
    light: "#d9a2a0",
    lightIntensity: 12,
    rain: 0,
    birds: 0.8,
    stars: 0.45,
  },
  {
    name: "night",
    sun: [-18, 60],
    turbidity: 2,
    rayleigh: 0.5,
    mie: 0.003,
    cloud: 0.2,
    cloudColor: "#3a4252",
    sunColor: "#33405a",
    ambient: "#1c2436",
    haze: "#1d2433",
    light: "#9fb0d0",
    lightIntensity: 5,
    rain: 0,
    birds: 0,
    stars: 1,
  },
];

const col = () => new Color();

/** The live, blended state. */
export const outdoor = {
  name: PRESETS[1].name,
  sunElev: 38,
  sunAzim: 20,
  turbidity: 3,
  rayleigh: 1.2,
  mie: 0.004,
  cloud: 0.3,
  cloudColor: col(),
  sunColor: col(),
  ambient: col(),
  haze: col(),
  light: col(),
  lightIntensity: 30,
  rain: 0,
  birds: 1,
  stars: 0,
};

const a = { cc: col(), sc: col(), am: col(), hz: col(), li: col() };
const b = { cc: col(), sc: col(), am: col(), hz: col(), li: col() };

function load(p: Preset, into: typeof a) {
  into.cc.set(p.cloudColor);
  into.sc.set(p.sunColor);
  into.am.set(p.ambient);
  into.hz.set(p.haze);
  into.li.set(p.light);
}

const lerp = MathUtils.lerp;

/**
 * Advance the cycle. `t` is seconds since the scene started, `hold` the
 * seconds each preset stays, `start` the preset the visit opened on.
 */
export function stepOutdoor(t: number, hold: number, start: number, fade = 30) {
  const n = PRESETS.length;
  const i = Math.floor(t / hold);
  const into = t - i * hold;
  const from = PRESETS[(start + i - 1 + n) % n];
  const to = PRESETS[(start + i) % n];
  // The first preset shows at once; afterwards each one crossfades in.
  const k = i === 0 ? 1 : MathUtils.smootherstep(into, 0, fade);
  load(from, a);
  load(to, b);
  outdoor.name = k > 0.5 ? to.name : from.name;
  outdoor.sunElev = lerp(from.sun[0], to.sun[0], k);
  outdoor.sunAzim = lerp(from.sun[1], to.sun[1], k);
  outdoor.turbidity = lerp(from.turbidity, to.turbidity, k);
  outdoor.rayleigh = lerp(from.rayleigh, to.rayleigh, k);
  outdoor.mie = lerp(from.mie, to.mie, k);
  outdoor.cloud = lerp(from.cloud, to.cloud, k);
  outdoor.cloudColor.copy(a.cc).lerp(b.cc, k);
  outdoor.sunColor.copy(a.sc).lerp(b.sc, k);
  outdoor.ambient.copy(a.am).lerp(b.am, k);
  outdoor.haze.copy(a.hz).lerp(b.hz, k);
  outdoor.light.copy(a.li).lerp(b.li, k);
  outdoor.lightIntensity = lerp(from.lightIntensity, to.lightIntensity, k);
  outdoor.rain = lerp(from.rain, to.rain, k);
  outdoor.birds = lerp(from.birds, to.birds, k);
  outdoor.stars = lerp(from.stars, to.stars, k);
}

export function presetIndex(name: string | null): number {
  const i = PRESETS.findIndex((p) => p.name === name);
  return i;
}
