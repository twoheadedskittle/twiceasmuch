"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  Color,
  FogExp2,
  MathUtils,
  MeshToonMaterial,
  SRGBColorSpace,
  TextureLoader,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  type PointLight,
  type SpriteMaterial,
  type Texture,
} from "three";
import { site } from "@/config/site";
import { C } from "./palette";
import { Box } from "./parts";
import { seeded } from "./random";
import { HALL } from "./hallLayout";
import { cancelDwell, moveDwell, startDwell, viewFrame } from "./focus";
import { setCursor } from "./nav";
import { rig, ROOM, uiStore } from "./rig";
import { checker, glow, placeholderArt, pool as poolTexture, relief } from "./textures";

let glowCache: Texture | null = null;
const glowTex = () => (glowCache ??= glow());
let poolCache: Texture | null = null;
const poolTex = () => (poolCache ??= poolTexture());
import { toonRamp, toonRampDark } from "./toon";

/**
 * The hallway: one-point perspective, recycled segments, so it never ends.
 * Segment k always has the same plants, frame and lamp behaviour (all
 * seeded by k), so walking back shows the same corridor you walked down.
 */

export { HALL };

const L = HALL.segment;
const HW = HALL.width / 2;
const HH = HALL.height;

/* ---------- Relief wallpaper, generated off the main path ---------- */

const pending = new Set<number>();
let idleHandle = 0;

/** Ask for a segment's relief; returns it now if cached, else schedules it. */
function requestRelief(seed: number, ready: (t: Texture) => void) {
  const cachedOrNull = peekRelief(seed);
  if (cachedOrNull) return ready(cachedOrNull);
  pending.add(seed);
  waiting.set(seed, [...(waiting.get(seed) ?? []), ready]);
  if (!idleHandle) idleHandle = schedule(drain);
}

const waiting = new Map<number, ((t: Texture) => void)[]>();
const generated = new Set<number>();

function peekRelief(seed: number): Texture | null {
  return generated.has(seed) ? relief(seed) : null;
}

function schedule(fn: () => void): number {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  return w.requestIdleCallback ? w.requestIdleCallback(fn, { timeout: 120 }) : window.setTimeout(fn, 16);
}

/** One texture per idle slice, so a fast scroll never stalls a frame. */
function drain() {
  idleHandle = 0;
  const seed = pending.values().next().value;
  if (seed === undefined) return;
  pending.delete(seed);
  const t = relief(seed);
  generated.add(seed);
  waiting.get(seed)?.forEach((cb) => cb(t));
  waiting.delete(seed);
  if (pending.size) idleHandle = schedule(drain);
}

/* ---------- Artwork textures ---------- */

const loader = typeof window !== "undefined" ? new TextureLoader() : null;
const artCache = new Map<string, Texture>();

function artFor(k: number): Texture {
  const list = site.artwork;
  if (!list.length) return placeholderArt("No artwork yet", k);
  const i = k % list.length;
  const a = list[i];
  const key = a.src ?? `placeholder:${i}`;
  const hit = artCache.get(key);
  if (hit) return hit;
  let t: Texture;
  if (a.src && loader) {
    t = loader.load(a.src);
    t.colorSpace = SRGBColorSpace;
  } else {
    t = placeholderArt(a.title, i);
  }
  artCache.set(key, t);
  return t;
}

/* ---------- One recyclable segment ---------- */

type SlotProps = { slot: number; floorMat: MeshToonMaterial };

function Segment({ slot, floorMat }: SlotProps) {
  const group = useRef<Group>(null);
  const k = useRef(-1);
  const wallL = useMemo(() => new MeshToonMaterial({ color: C.hallPaper, gradientMap: toonRampDark(), bumpScale: 7 }), []);
  const wallR = useMemo(() => new MeshToonMaterial({ color: C.hallPaper, gradientMap: toonRampDark(), bumpScale: 7 }), []);
  const art = useRef<MeshBasicMaterial>(null);
  const frame = useRef<Group>(null);
  const door = useRef<Group>(null);
  const shadeA = useRef<Mesh>(null);
  const shadeB = useRef<Mesh>(null);
  const halo = useRef<SpriteMaterial>(null);
  const pool = useRef<MeshBasicMaterial>(null);

  useEffect(() => () => {
    wallL.dispose();
    wallR.dispose();
  }, [wallL, wallR]);

  useFrame(({ camera, clock }) => {
    if (!group.current) return;
    // Which segment index should this slot show? Slots cover the run of
    // segments from one behind the camera to (slots - 1) ahead.
    const here = Math.floor((camera.position.z - HALL.start) / L);
    const first = Math.max(0, here - 1);
    const kk = first + ((slot - (first % HALL.slots) + HALL.slots) % HALL.slots);
    if (kk !== k.current) {
      k.current = kk;
      group.current.position.z = HALL.start + kk * L;
      // Two walls, two seeds: no two panels grow alike.
      wallL.bumpMap = null;
      wallR.bumpMap = null;
      wallL.needsUpdate = wallR.needsUpdate = true;
      requestRelief(kk * 2, (t) => {
        if (k.current !== kk) return;
        wallL.bumpMap = t;
        wallL.needsUpdate = true;
      });
      requestRelief(kk * 2 + 1, (t) => {
        if (k.current !== kk) return;
        wallR.bumpMap = t;
        wallR.needsUpdate = true;
      });
      // Frame on alternating walls; a door every third segment, opposite.
      const side = kk % 2 ? 1 : -1;
      if (frame.current) {
        frame.current.position.x = side * (HW - 0.035);
        frame.current.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      }
      if (art.current) art.current.map = artFor(kk);
      if (door.current) {
        door.current.visible = kk % 3 === 1;
        door.current.position.x = -side * (HW - 0.02);
        door.current.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
      }
    }
    // Lamp glow follows the shared flicker value for this segment.
    const level = flicker(kk, clock.elapsedTime);
    for (const s of [shadeA.current, shadeB.current]) {
      if (s) (s.material as MeshBasicMaterial).color.setScalar(0.25 + level * 0.75);
    }
    if (halo.current) halo.current.opacity = 0.4 * level;
    if (pool.current) pool.current.opacity = 0.3 * level;
  });

  return (
    <group ref={group}>
      {/* Floor and ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, L / 2]} material={floorMat}>
        <planeGeometry args={[HALL.width, L]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, HH, L / 2]}>
        <planeGeometry args={[HALL.width, L]} />
        <meshToonMaterial color="#202528" gradientMap={toonRamp()} />
      </mesh>
      {/* Relief walls */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-HW, HH / 2, L / 2]} material={wallL}>
        <planeGeometry args={[L, HH]} />
      </mesh>
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[HW, HH / 2, L / 2]} material={wallR}>
        <planeGeometry args={[L, HH]} />
      </mesh>
      {/* Skirting and picture rail */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box size={[0.03, 0.14, L]} position={[s * (HW - 0.015), 0.07, L / 2]} color={C.hallFloorA} />
          <Box size={[0.025, 0.03, L]} position={[s * (HW - 0.012), 2.2, L / 2]} color={C.hallFloorB} />
        </group>
      ))}

      {/* Two-shade ceiling lamp, as in the linocut corridor: dark shades, bright bulbs */}
      <group position={[0, HH, L / 2]}>
        <Box size={[0.02, 0.22, 0.02]} position={[0, -0.11, 0]} color={C.ink} />
        <Box size={[0.5, 0.02, 0.02]} position={[0, -0.22, 0]} color={C.ink} />
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.25, -0.33, 0]}>
            <mesh>
              <coneGeometry args={[0.11, 0.16, 20, 1, true]} />
              <meshToonMaterial color="#2a3034" gradientMap={toonRamp()} side={2} />
            </mesh>
            <mesh ref={s < 0 ? shadeA : shadeB} position={[0, -0.06, 0]}>
              <sphereGeometry args={[0.035, 10, 8]} />
              <meshBasicMaterial color="#f2f5f2" toneMapped={false} />
            </mesh>
          </group>
        ))}
        <sprite position={[0, -0.42, 0]} scale={[1.3, 1.3, 1]}>
          <spriteMaterial ref={halo} map={glowTex()} color="#cfdbe4" transparent opacity={0.4} blending={AdditiveBlending} depthWrite={false} />
        </sprite>
      </group>
      {/* The pool of light under the lamp; between pools the floor falls dark */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, L / 2]}>
        <planeGeometry args={[2.6, 2.6]} />
        <meshBasicMaterial ref={pool} map={poolTex()} color="#bcc8d0" transparent opacity={0.3} blending={AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Hanging frame with artwork */}
      <group
        ref={frame}
        position={[-HW, 1.55, L / 2]}
        // Rest the pointer on a frame to step up to it; a tap goes straight there.
        onPointerOver={(e) => {
          e.stopPropagation();
          if (uiStore.get().focus) return;
          setCursor("pointer");
          startDwell(k.current);
        }}
        onPointerMove={() => moveDwell()}
        onPointerOut={() => {
          setCursor("auto");
          cancelDwell();
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (uiStore.get().focus !== "frame") viewFrame(k.current);
        }}
      >
        <Box size={[0.72, 0.9, 0.04]} color={C.walnutDark} />
        <mesh position={[0, 0, 0.022]}>
          <planeGeometry args={[0.6, 0.76]} />
          <meshBasicMaterial ref={art} toneMapped={false} />
        </mesh>
        {/* Picture wire to the rail */}
        <Box size={[0.005, 0.26, 0.005]} position={[-0.17, 0.56, -0.01]} rotation={[0, 0, -0.55]} color={C.ink} />
        <Box size={[0.005, 0.26, 0.005]} position={[0.17, 0.56, -0.01]} rotation={[0, 0, 0.55]} color={C.ink} />
      </group>

      {/* A door that never opens: frosted glass, no name on it */}
      <group ref={door} position={[HW, 0, L * 0.3]} visible={false}>
        <Box size={[0.9, 2.15, 0.06]} position={[0, 1.075, 0]} color="#2b3134" />
        <mesh position={[0, 1.55, 0.035]}>
          <planeGeometry args={[0.6, 0.6]} />
          <meshBasicMaterial color="#b8bdb6" transparent opacity={0.7} />
        </mesh>
        <Box size={[0.05, 0.05, 0.05]} position={[0.34, 1.05, 0.05]} color={C.brass} />
      </group>
    </group>
  );
}

/** Lamp brightness 0..1 for segment k at time t. Some lamps are failing. */
function flicker(k: number, t: number): number {
  const r = seeded(k * 31 + 7);
  const bad = r() < 0.3; // three in ten lamps flicker
  if (!bad || rig.reducedMotion) return 0.92;
  const phase = r() * 100;
  const n = Math.sin((t + phase) * 23) * Math.sin((t + phase) * 7.3) * Math.sin((t + phase) * 1.7);
  return n > 0.35 ? 0.15 : 0.95;
}

/** Three real lights follow the nearest lamps; the rest are glow only. */
function LampLights() {
  const refs = [useRef<PointLight>(null), useRef<PointLight>(null), useRef<PointLight>(null)];
  useFrame(({ camera, clock }) => {
    const here = Math.floor((camera.position.z - HALL.start) / L);
    refs.forEach((ref, i) => {
      const light = ref.current;
      if (!light) return;
      const k = Math.max(0, here + i);
      light.position.set(0, HH - 0.6, HALL.start + k * L + L / 2);
      light.intensity = 5.5 * flicker(k, clock.elapsedTime);
    });
  });
  return (
    <>
      {refs.map((r, i) => (
        <pointLight key={i} ref={r} color="#cdd9e3" distance={3.6} decay={2} intensity={0} />
      ))}
    </>
  );
}

/**
 * Atmosphere: grades the scene from the warm room to the cold hallway as
 * the visitor crosses the threshold, and thickens the fog so the far end
 * of the corridor dissolves instead of stopping.
 */
function Atmosphere() {
  const scene = useThree((s) => s.scene);
  const fog = useMemo(() => new FogExp2(new Color(C.hallFog), 0), []);
  const warm = useMemo(() => new Color("#24120f"), []);
  const cold = useMemo(() => new Color(C.hallFog), []);
  const bg = useMemo(() => new Color("#24120f"), []);

  useEffect(() => {
    scene.fog = fog;
    scene.background = bg;
    return () => {
      scene.fog = null;
      scene.background = null;
    };
  }, [scene, fog, bg]);

  useFrame(({ camera }) => {
    // 0 in the room, 1 three metres past the threshold.
    const t = MathUtils.smoothstep(camera.position.z, ROOM.frontZ - 4, ROOM.frontZ + 3);
    fog.density = MathUtils.lerp(0.035, 0.12, t);
    bg.copy(warm).lerp(cold, t);
    fog.color.copy(bg);
    rig.cold = t;
  });
  return null;
}

export function Hallway() {
  const floorMat = useMemo(() => {
    const t = checker();
    t.repeat.set(HALL.width / 1, L / 1);
    return new MeshToonMaterial({ map: t, gradientMap: toonRampDark() });
  }, []);

  useEffect(() => () => floorMat.dispose(), [floorMat]);

  // Warm the relief cache for the first stretch while the visitor is still in the room.
  useEffect(() => {
    for (let k = 0; k < HALL.slots * 2; k++) requestRelief(k, () => {});
  }, []);

  return (
    <group>
      {Array.from({ length: HALL.slots }, (_, i) => (
        <Segment key={i} slot={i} floorMat={floorMat} />
      ))}
      <LampLights />
      <Atmosphere />
    </group>
  );
}
