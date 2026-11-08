"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import { Color, MathUtils, MeshStandardMaterial, type Group, type PerspectiveCamera } from "three";
import { site } from "@/config/site";
import { rig, uiStore } from "./rig";

/**
 * First-person hands, modelled from primitives with real anatomy: a domed
 * palm, four fingers of three phalanges each with knuckles and nails, a
 * two-jointed thumb, a wrist and a knit sleeve. Joints curl a little and
 * breathe while you stand, sway and bob while you walk.
 *
 * To use your own model, set `site.scene.handsModel` to a glTF path under
 * /public; it should contain both hands posed together, origin between them,
 * -Z forward (see README).
 */

/** Shared materials: skin with a warm subsurface lift, nails, knit wool. */
function useMaterials() {
  return useMemo(
    () => ({
      skin: new MeshStandardMaterial({ color: new Color("#d9a48a"), roughness: 0.62, metalness: 0, emissive: new Color("#4a1c12"), emissiveIntensity: 0.18 }),
      knuckle: new MeshStandardMaterial({ color: new Color("#cf957c"), roughness: 0.6, emissive: new Color("#4a1c12"), emissiveIntensity: 0.16 }),
      nail: new MeshStandardMaterial({ color: new Color("#e8c3b4"), roughness: 0.3 }),
      wool: new MeshStandardMaterial({ color: new Color("#26201f"), roughness: 0.95 }),
      cuff: new MeshStandardMaterial({ color: new Color("#5c0f16"), roughness: 0.9 }),
    }),
    [],
  );
}

type Mats = ReturnType<typeof useMaterials>;

/** One phalanx: a capsule lying along -Z from its joint. */
function Bone({ len, r, mat }: { len: number; r: number; mat: MeshStandardMaterial }) {
  return (
    <mesh position={[0, 0, -len / 2]} rotation={[Math.PI / 2, 0, 0]} material={mat}>
      <capsuleGeometry args={[r, Math.max(0.001, len - r * 2), 6, 12]} />
    </mesh>
  );
}

type FingerSpec = { x: number; y: number; lens: [number, number, number]; r: number; curl: [number, number, number]; spread: number };

const FINGERS: FingerSpec[] = [
  // index (nearest the thumb) to little finger
  { x: -0.026, y: 0.0, lens: [0.042, 0.026, 0.021], r: 0.0092, curl: [-0.1, -0.2, -0.14], spread: 0.04 },
  { x: -0.008, y: 0.002, lens: [0.046, 0.029, 0.023], r: 0.0095, curl: [-0.12, -0.22, -0.15], spread: 0.0 },
  { x: 0.01, y: 0.0, lens: [0.043, 0.027, 0.022], r: 0.009, curl: [-0.16, -0.26, -0.17], spread: -0.03 },
  { x: 0.027, y: -0.004, lens: [0.034, 0.021, 0.019], r: 0.0078, curl: [-0.22, -0.3, -0.2], spread: -0.07 },
];

function Finger({ spec, mats, phase }: { spec: FingerSpec; mats: Mats; phase: number }) {
  const j0 = useRef<Group>(null);
  const j1 = useRef<Group>(null);
  const j2 = useRef<Group>(null);
  useFrame(({ clock }) => {
    // Fingers settle and shift a hair, each on its own rhythm.
    const t = clock.elapsedTime;
    const b = rig.reducedMotion ? 0 : Math.sin(t * 0.7 + phase) * 0.04;
    if (j0.current) j0.current.rotation.x = spec.curl[0] + b;
    if (j1.current) j1.current.rotation.x = spec.curl[1] + b * 1.3;
    if (j2.current) j2.current.rotation.x = spec.curl[2] + b;
  });
  const [l0, l1, l2] = spec.lens;
  const r = spec.r;
  return (
    <group position={[spec.x, spec.y, -0.045]} rotation={[0, spec.spread, 0]}>
      {/* Knuckle */}
      <mesh material={mats.knuckle} scale={[1, 0.8, 1]}>
        <sphereGeometry args={[r * 1.04, 12, 10]} />
      </mesh>
      <group ref={j0}>
        <Bone len={l0} r={r} mat={mats.skin} />
        <group ref={j1} position={[0, 0, -l0]}>
          <mesh material={mats.knuckle}>
            <sphereGeometry args={[r * 0.97, 10, 8]} />
          </mesh>
          <Bone len={l1} r={r * 0.93} mat={mats.skin} />
          <group ref={j2} position={[0, 0, -l1]}>
            <Bone len={l2} r={r * 0.86} mat={mats.skin} />
            {/* Nail on the back of the fingertip */}
            <mesh position={[0, r * 0.7, -l2 * 0.5]} rotation={[0.08, 0, 0]} scale={[r * 0.95, r * 0.18, l2 * 0.36]} material={mats.nail}>
              <sphereGeometry args={[1, 12, 8]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

/** One hand, palm down, fingers forward. side: -1 left, 1 right (thumb toward the centre). */
function Hand({ side, mats }: { side: -1 | 1; mats: Mats }) {
  return (
    <group scale={[side, 1, 1]}>
      {/* Knit sleeve running back and down out of frame, and a crimson cuff */}
      <mesh position={[0.006, -0.06, 0.16]} rotation={[-1.1 + Math.PI / 2, 0, 0.05]} material={mats.wool}>
        <cylinderGeometry args={[0.04, 0.05, 0.26, 20, 1]} />
      </mesh>
      <mesh position={[0.004, -0.024, 0.045]} rotation={[-1.1 + Math.PI / 2, 0, 0.05]} material={mats.cuff}>
        <torusGeometry args={[0.035, 0.008, 8, 20]} />
      </mesh>
      {/* Wrist */}
      <mesh position={[0.002, -0.012, 0.03]} rotation={[Math.PI / 2 - 0.25, 0, 0]} scale={[1, 0.78, 1]} material={mats.skin}>
        <capsuleGeometry args={[0.024, 0.03, 6, 14]} />
      </mesh>
      {/* Palm: domed back of the hand */}
      <mesh position={[0, 0, -0.012]} scale={[0.044, 0.017, 0.05]} material={mats.skin}>
        <sphereGeometry args={[1, 24, 16]} />
      </mesh>
      {FINGERS.map((f, i) => (
        <Finger key={i} spec={f} mats={mats} phase={i * 1.3 + (side > 0 ? 0 : 0.7)} />
      ))}
      {/* Thumb: metacarpal pad, then two phalanges, angled in toward the other hand */}
      <group position={[-0.038, -0.012, -0.01]} rotation={[-0.1, 0.42, 0.35]}>
        <mesh position={[0, 0, -0.012]} scale={[0.014, 0.012, 0.022]} material={mats.skin}>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
        <group position={[0, 0, -0.026]} rotation={[-0.15, 0, 0]}>
          <Bone len={0.03} r={0.0105} mat={mats.skin} />
          <group position={[0, 0, -0.03]} rotation={[-0.3, 0, 0]}>
            <Bone len={0.024} r={0.0098} mat={mats.skin} />
            <mesh position={[0, 0.0062, -0.016]} scale={[0.013, 0.003, 0.011]} material={mats.nail}>
              <sphereGeometry args={[1, 12, 8]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

function CustomHands({ src }: { src: string }) {
  const { scene } = useGLTF(src);
  return <primitive object={scene} />;
}

export function Hands() {
  const root = useRef<Group>(null);
  const left = useRef<Group>(null);
  const right = useRef<Group>(null);
  const phase = useRef(0);
  const lower = useRef(0);
  const mats = useMaterials();
  const model = site.scene.handsModel;

  useFrame(({ camera }, dt) => {
    const g = root.current;
    if (!g) return;
    // Ride with the camera.
    g.position.copy(camera.position);
    g.quaternion.copy(camera.quaternion);

    const cam = camera as PerspectiveCamera;
    const d = 0.5;
    const halfH = d * Math.tan((cam.fov * Math.PI) / 360);
    const halfW = halfH * cam.aspect;
    // Keep the hands in the lower corners whatever the screen shape.
    const hx = Math.min(halfW * 0.6, 0.29);
    const hy = -halfH * 0.92;

    const s = rig.reducedMotion ? 0 : MathUtils.clamp(rig.speed / 1.1, 0, 1);
    phase.current += dt * (2.2 + s * 5.2);
    const focused = uiStore.get().focus !== null;
    // Lower the hands out of the way while looking at something closely.
    lower.current = MathUtils.damp(lower.current, focused ? 1 : 0, 5, dt);

    const p = phase.current;
    const idle = rig.reducedMotion ? 0 : Math.sin(p * 0.35) * 0.003;
    const bob = (o: number) => -Math.abs(Math.sin(p + o)) * 0.016 * s;
    const sway = (o: number) => Math.sin(p + o) * 0.01 * s;

    if (left.current) {
      left.current.position.set(-hx + sway(Math.PI), hy + bob(Math.PI) + idle - lower.current * 0.3, -d);
      left.current.rotation.set(0.08 + s * 0.04 * Math.sin(p + Math.PI), 0.22, 0.12);
    }
    if (right.current) {
      right.current.position.set(hx + sway(0), hy + bob(0) + idle * 0.8 - lower.current * 0.3, -d);
      right.current.rotation.set(0.08 + s * 0.04 * Math.sin(p), -0.22, -0.12);
    }
  });

  return (
    <group ref={root}>
      {model ? (
        <Suspense fallback={null}>
          <group position={[0, -0.25, -0.45]}>
            <CustomHands src={model} />
          </group>
        </Suspense>
      ) : (
        <>
          <group ref={left} scale={1.15}>
            <Hand side={-1} mats={mats} />
          </group>
          <group ref={right} scale={1.15}>
            <Hand side={1} mats={mats} />
          </group>
        </>
      )}
    </group>
  );
}
