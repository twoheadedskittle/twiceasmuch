"use client";

import { useFrame } from "@react-three/fiber";
import { rig } from "./rig";

/** Applies the scroll pose to the camera every frame, plus a faint breath. */
export function CameraRig() {
  useFrame(({ camera, clock }) => {
    const p = rig.pose;
    // Yaw first, then pitch: a head turning, not a plane banking.
    camera.rotation.order = "YXZ";
    // Idle breath: under a centimetre, slow. Off under reduced motion.
    const breath = rig.reducedMotion ? 0 : Math.sin(clock.elapsedTime * 0.9) * 0.006;
    camera.position.set(p.x, p.y + breath, p.z);
    camera.rotation.set(p.pitch, p.yaw, 0);
  });

  return null;
}
