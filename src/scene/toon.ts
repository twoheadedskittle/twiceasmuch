import { DataTexture, NearestFilter, RedFormat } from "three";

/**
 * Cel ramp for MeshToonMaterial: three bands (shadow, mid, lit).
 * Built once and shared by every toon material in the scene.
 */
let ramp: DataTexture | null = null;

export function toonRamp(): DataTexture {
  if (ramp) return ramp;
  const steps = new Uint8Array([70, 150, 255]);
  ramp = new DataTexture(steps, steps.length, 1, RedFormat);
  ramp.minFilter = NearestFilter;
  ramp.magFilter = NearestFilter;
  ramp.generateMipmaps = false;
  ramp.needsUpdate = true;
  return ramp;
}

/**
 * The hallway's ramp: the shadow band drops nearly to black, so the space
 * between lamps falls genuinely dark instead of resting at the room's floor.
 */
let darkRamp: DataTexture | null = null;

export function toonRampDark(): DataTexture {
  if (darkRamp) return darkRamp;
  const steps = new Uint8Array([14, 105, 255]);
  darkRamp = new DataTexture(steps, steps.length, 1, RedFormat);
  darkRamp.minFilter = NearestFilter;
  darkRamp.magFilter = NearestFilter;
  darkRamp.generateMipmaps = false;
  darkRamp.needsUpdate = true;
  return darkRamp;
}
