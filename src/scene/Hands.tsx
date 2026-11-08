"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import { MathUtils, type Group, type PerspectiveCamera } from "three";
import { site } from "@/config/site";
import { C } from "./palette";
import { rig, uiStore } from "./rig";
import { toonRamp } from "./toon";

/**
 * First-person hands. The placeholder is built from primitives (sleeve,
 * palm, four fingers, thumb) in the scene's toon-and-ink style. To use
 * your own model, set `site.scene.handsModel` to a glTF path under /public;
 * it is expected to contain both hands, posed, with the origin between them
 * at chest height and -Z forward (see README).
 */

const SKIN = "#d6a283";
const SLEEVE = C.greenBlack;

function Capsule({ r, len, position, rotation, color }: { r: number; len: number; position: [number, number, number]; rotation?: [number, number, number]; color: string }) {
  return (
    <mesh position={position} rotation={rotation}>
      <capsuleGeometry args={[r, len, 4, 10]} />
      <meshToonMaterial color={color} gradientMap={toonRamp()} />
    </mesh>
  );
}

/** One stylised hand, fingers forward, relaxed curl. side: -1 left, 1 right. */
function Hand({ side }: { side: -1 | 1 }) {
  const fingers = [-0.033, -0.011, 0.011, 0.033];
  return (
    <group scale={[side * 0.85, 0.85, 0.85]}>
      {/* Coat sleeve running back and down out of frame, with a cuff at the wrist */}
      <Capsule r={0.046} len={0.3} position={[0.01, -0.086, 0.18]} rotation={[-1.1, 0, 0.06]} color={SLEEVE} />
      <Capsule r={0.044} len={0.008} position={[0.004, -0.024, 0.05]} rotation={[-1.1, 0, 0.06]} color={C.oxblood} />
      {/* Palm, back of the hand up */}
      <mesh position={[0, 0, -0.03]} rotation={[0.08, 0, -0.12]} scale={[0.95, 0.4, 1.05]}>
        <sphereGeometry args={[0.055, 18, 12]} />
        <meshToonMaterial color={SKIN} gradientMap={toonRamp()} />
      </mesh>
      {/* Fingers forward and drooping, curling more toward the little finger */}
      {fingers.map((x, i) => (
        <Capsule key={i} r={0.0105} len={0.05 - Math.abs(x) * 0.25} position={[x, -0.012 - i * 0.003, -0.088]} rotation={[-1.78 - i * 0.07, 0, -0.12]} color={SKIN} />
      ))}
      {/* Thumb, tucked along the inside edge */}
      <Capsule r={0.0115} len={0.036} position={[-0.054, -0.012, -0.045]} rotation={[-1.55, 0, 0.45]} color={SKIN} />
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
    const hx = Math.min(halfW * 0.62, 0.3);
    const hy = -halfH * 0.84;

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
      left.current.position.set(-hx + sway(Math.PI), hy + bob(Math.PI) + idle - lower.current * 0.09, -d);
      left.current.rotation.set(0.12 + s * 0.04 * Math.sin(p + Math.PI), 0.25, 0.1);
    }
    if (right.current) {
      right.current.position.set(hx + sway(0), hy + bob(0) + idle * 0.8 - lower.current * 0.09, -d);
      right.current.rotation.set(0.12 + s * 0.04 * Math.sin(p), -0.25, -0.1);
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
          <group ref={left}>
            <Hand side={-1} />
          </group>
          <group ref={right}>
            <Hand side={1} />
          </group>
        </>
      )}
    </group>
  );
}
