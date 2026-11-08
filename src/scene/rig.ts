/**
 * Shared, mutable scene state. GSAP writes it from the scroll timeline,
 * the render loop reads it every frame. Kept outside React on purpose:
 * per-frame values must never trigger re-renders.
 */

export type Pose = {
  x: number;
  y: number;
  z: number;
  /** Radians around Y. 0 faces the window (-Z), PI faces the hallway. */
  yaw: number;
  /** Radians around X. Positive looks up. */
  pitch: number;
};

export type Beat = "room" | "window" | "turn" | "hallway";

export const rig = {
  pose: { x: 0, y: 1.6, z: 4.2, yaw: 0, pitch: 0 } as Pose,
  /** 0 closed, 1 fully open: the panel wall behind the visitor. */
  wallOpen: 0,
  /** Raw 0..1 scroll progress through the whole walk. */
  progress: 0,
  beat: "room" as Beat,
  reducedMotion: false,
};

/** Room layout in metres. Scene components and the camera share these. */
export const ROOM = {
  width: 6,
  depth: 10,
  height: 3.2,
  backZ: -5,
  frontZ: 5,
  eye: 1.6,
  startZ: 4.2,
  /** Where the visitor stops in front of the window. */
  windowZ: -3.3,
  window: { width: 2.6, height: 1.8, sill: 0.9 },
  doorway: { width: 2.2, height: 2.6 },
  stride: 0.7,
} as const;
