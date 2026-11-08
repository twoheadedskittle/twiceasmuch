"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { MathUtils, type PerspectiveCamera } from "three";
import { rig } from "./rig";

const lerp = MathUtils.lerp;

function dip() {
  document.querySelector<HTMLElement>(".stage")?.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 240, easing: "ease-out" });
}

/**
 * Applies the pose to the camera every frame: the scroll pose, the hallway
 * distance on top, blended toward a focused object, plus a faint breath.
 * Also keeps the horizontal field of view wide enough on tall screens that
 * the shelf and record player stay in frame on a phone.
 */
export function CameraRig() {
  const size = useThree((s) => s.size);
  const cam = useThree((s) => s.camera) as PerspectiveCamera;

  useEffect(() => {
    const aspect = size.width / size.height;
    // Hold ~74 degrees horizontal on narrow screens, 55 vertical on wide ones.
    const hFov = 74 * (Math.PI / 180);
    const vFromH = 2 * Math.atan(Math.tan(hFov / 2) / aspect) * (180 / Math.PI);
    const fov = Math.min(95, Math.max(55, vFromH));
    // R3F owns the camera; updating its projection on resize is the intended use.
    cam.fov = fov;
    cam.updateProjectionMatrix();
  }, [size, cam]);

  useFrame(({ camera, clock }, delta) => {
    // Hallway distance: eases after the scrollbar like the room scrub does.
    // Reduced motion: whole segments at a time, as cuts.
    rig.hallMeters = rig.reducedMotion
      ? Math.floor(rig.hallTarget / 3) * 3
      : MathUtils.damp(rig.hallMeters, rig.hallTarget, 3.5, delta);

    const p = rig.pose;
    const f = rig.focusPose;
    const m = rig.focusMix;
    const z0 = p.z + rig.hallMeters;
    const x = lerp(p.x, f.x, m);
    const z = lerp(z0, f.z, m);

    // Walking speed for the hands, smoothed so it never twitches.
    const dz = Math.hypot(x - camera.position.x, z - camera.position.z);
    const speed = delta > 0 ? dz / delta : 0;
    rig.speed = MathUtils.damp(rig.speed, Math.min(speed, 4), 6, delta);

    // Reduced motion: any jump is a cut; dip the stage so it never strobes.
    if (rig.reducedMotion && Math.hypot(x - camera.position.x, z - camera.position.z) > 0.4) dip();

    camera.rotation.order = "YXZ";
    const breath = rig.reducedMotion ? 0 : Math.sin(clock.elapsedTime * 0.9) * 0.006;
    camera.position.set(x, lerp(p.y, f.y, m) + breath, z);
    camera.rotation.set(lerp(p.pitch, f.pitch, m), lerp(p.yaw, f.yaw, m), 0);
  });

  return null;
}
