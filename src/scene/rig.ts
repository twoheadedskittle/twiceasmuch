/**
 * Shared, mutable scene state. GSAP writes it from the scroll timeline,
 * the render loop reads it every frame. Kept outside React on purpose:
 * per-frame values must never trigger re-renders. The few values the DOM
 * needs (zone, hover, focus) go through the small `ui` store below.
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
export type Target = "shelf" | "player";

export const rig = {
  pose: { x: 0, y: 1.6, z: 4.2, yaw: 0, pitch: 0 } as Pose,
  /** Pose of the object the visitor walked to, blended in by focusMix. */
  focusPose: { x: 0, y: 1.6, z: 0, yaw: 0, pitch: 0 } as Pose,
  focusMix: 0,
  /** 0 closed, 1 fully open: the panel wall behind the visitor. */
  wallOpen: 0,
  /** Metres walked down the hallway past the end of the room timeline. */
  hallMeters: 0,
  /** Raw 0..1 scroll progress through the room timeline. */
  progress: 0,
  beat: "room" as Beat,
  reducedMotion: false,
  /** 0 in the warm room, 1 in the cold hallway: drives the grade. */
  cold: 0,
  /** Hallway distance the scroll asks for; hallMeters eases toward it. */
  hallTarget: 0,
  /** Smoothed walking speed in m/s, for the hands' bob. */
  speed: 0,
};

/** Room layout in metres. Scene components and the camera share these. */
export const ROOM = {
  width: 6.4,
  depth: 8,
  height: 3.2,
  backZ: -4,
  frontZ: 4,
  eye: 1.6,
  startZ: 3.3,
  /** Where the visitor stops in front of the window. */
  windowZ: -2.4,
  /** Shelf and record player sit this far from the back wall. */
  furnitureZ: -2.7,
  /** Hover-to-choose works once the visitor is past this Z. */
  approachZ: 1.4,
  window: { width: 3, height: 2, sill: 0.8 },
  doorway: { width: 2.2, height: 2.6 },
  stride: 0.7,
} as const;

export const FOCUS_POSES: Record<Target, Pose> = {
  // Two metres back from the shelf, turned to face it: every label in view.
  shelf: { x: -0.45, y: 1.2, z: ROOM.furnitureZ, yaw: Math.PI / 2, pitch: -0.16 },
  // Standing over the record player, looking down at the platter and sleeve.
  player: { x: 1.8, y: 1.45, z: ROOM.furnitureZ, yaw: -Math.PI / 2, pitch: -0.45 },
};

/* ---------- ui store: low-frequency state the DOM renders ---------- */

export type UiState = {
  beat: Beat;
  /** True while the shelf and record player can be chosen. */
  choosing: boolean;
  hover: Target | null;
  focus: Target | null;
};

let ui: UiState = { beat: "room", choosing: false, hover: null, focus: null };
const uiListeners = new Set<() => void>();

export const uiStore = {
  get: () => ui,
  set(patch: Partial<UiState>) {
    const next = { ...ui, ...patch };
    if (
      next.beat === ui.beat &&
      next.choosing === ui.choosing &&
      next.hover === ui.hover &&
      next.focus === ui.focus
    )
      return;
    ui = next;
    uiListeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    uiListeners.add(l);
    return () => uiListeners.delete(l);
  },
};
