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
