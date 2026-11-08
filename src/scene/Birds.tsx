"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BufferAttribute, BufferGeometry, Color, MeshBasicMaterial, Object3D, Vector3, type InstancedMesh } from "three";
import { outdoor } from "./outdoorState";
import { seeded } from "./random";
import { rig } from "./rig";

/**
 * A murmuration: several hundred birds flocking by the three boids rules
 * (separation, alignment, cohesion), drawn toward attractors that wander
 * the sky on their own paths. Two attractors pull the flock apart and let
 * it rejoin, so its shape never repeats. Neighbour search uses a uniform
 * grid, so the cost stays linear in the number of birds.
 */

const N = 520;
const CENTER = new Vector3(0, 30, -200);
const HALF = new Vector3(190, 22, 110);
const CELL = 9;
const GX = Math.ceil((HALF.x * 2) / CELL) + 2;
const GY = Math.ceil((HALF.y * 2) / CELL) + 2;
const GZ = Math.ceil((HALF.z * 2) / CELL) + 2;
const CELLS = GX * GY * GZ;

const R_NEIGHBOUR = 9;
const R_SEPARATE = 2.6;
const MIN_SPEED = 9;
const MAX_SPEED = 17;

/** A bird seen from below: body and two swept wings. Wing tips flap in the shader. */
function birdGeometry() {
  // x across the wings, z along the body (nose toward -z).
  const v = new Float32Array([
    // left wing
    0, 0, -0.25, -0.75, 0, 0.12, 0, 0, 0.2,
    // right wing
    0, 0, -0.25, 0, 0, 0.2, 0.75, 0, 0.12,
    // body
    0, 0.02, -0.35, -0.06, 0, 0.3, 0.06, 0, 0.3,
  ]);
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
}

function flapMaterial() {
  const m = new MeshBasicMaterial({ color: new Color("#1d1b1c"), side: 2, fog: false, transparent: true });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    m.userData.shader = shader;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTime;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        float phase = float(gl_InstanceID) * 1.731;
        float beat = sin(uTime * 13.0 + phase);
        // Flap, then glide: birds in a flock beat in bursts.
        float burst = smoothstep(-0.2, 0.6, sin(uTime * 0.9 + phase * 0.37));
        transformed.y += beat * abs(position.x) * 0.55 * burst;`,
      );
  };
  return m;
}

export function Birds() {
  const mesh = useRef<InstancedMesh>(null);
  const geo = useMemo(() => birdGeometry(), []);
  const mat = useMemo(() => flapMaterial(), []);

  const sim = useMemo(() => {
    const r = seeded(2024);
    const pos = new Float32Array(N * 3);
    const vel = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = CENTER.x + (r() - 0.5) * 60;
      pos[i * 3 + 1] = CENTER.y + (r() - 0.5) * 20;
      pos[i * 3 + 2] = CENTER.z + (r() - 0.5) * 40;
      vel[i * 3] = 12 * (r() - 0.5);
      vel[i * 3 + 1] = 2 * (r() - 0.5);
      vel[i * 3 + 2] = 12 * (r() - 0.5);
    }
    return {
      pos,
      vel,
      group: Uint8Array.from({ length: N }, (_, i) => (i % 3 === 0 ? 1 : 0)),
      cellOf: new Int32Array(N),
      start: new Int32Array(CELLS + 1),
      order: new Int32Array(N),
      attractors: [new Vector3().copy(CENTER), new Vector3().copy(CENTER)],
      r: seeded(99),
    };
  }, []);

  const dummy = useMemo(() => new Object3D(), []);
  const tmp = useMemo(() => new Vector3(), []);

  useFrame(({ clock }, delta) => {
    const m = mesh.current;
    if (!m) return;
    const shader = mat.userData.shader as { uniforms: { uTime: { value: number } } } | undefined;
    if (shader) shader.uniforms.uTime.value = clock.elapsedTime;
    mat.opacity = outdoor.birds;
    m.visible = outdoor.birds > 0.02 && rig.cold < 0.9;
    if (!m.visible) return;

    const dt = Math.min(delta, 1 / 30) * (rig.reducedMotion ? 0.35 : 1);
    const t = clock.elapsedTime;
    const { pos, vel, cellOf, start, order, attractors, group } = sim;

    // Attractors wander on incommensurate loops: the flock never retraces a path.
    attractors[0].set(
      CENTER.x + Math.sin(t * 0.071) * HALF.x * 0.7 + Math.sin(t * 0.23) * 25,
      CENTER.y + Math.sin(t * 0.11 + 1) * HALF.y * 0.5,
      CENTER.z + Math.cos(t * 0.053) * HALF.z * 0.6,
    );
    attractors[1].set(
      CENTER.x + Math.cos(t * 0.064 + 2) * HALF.x * 0.65,
      CENTER.y + Math.sin(t * 0.09 + 4) * HALF.y * 0.55,
      CENTER.z + Math.sin(t * 0.041 + 3) * HALF.z * 0.7,
    );
    // Every so often the two halves are pulled together again.
    const merge = 0.5 + 0.5 * Math.sin(t * 0.045);

    // Bin birds into the grid (counting sort).
    start.fill(0);
    for (let i = 0; i < N; i++) {
      const cx = Math.min(GX - 1, Math.max(0, Math.floor((pos[i * 3] - CENTER.x + HALF.x) / CELL) + 1));
      const cy = Math.min(GY - 1, Math.max(0, Math.floor((pos[i * 3 + 1] - CENTER.y + HALF.y) / CELL) + 1));
      const cz = Math.min(GZ - 1, Math.max(0, Math.floor((pos[i * 3 + 2] - CENTER.z + HALF.z) / CELL) + 1));
      const c = cx + GX * (cy + GY * cz);
      cellOf[i] = c;
      start[c + 1]++;
    }
    for (let c = 0; c < CELLS; c++) start[c + 1] += start[c];
    const fill = start.slice(0, CELLS);
    for (let i = 0; i < N; i++) order[fill[cellOf[i]]++] = i;

    for (let i = 0; i < N; i++) {
      const px = pos[i * 3];
      const py = pos[i * 3 + 1];
      const pz = pos[i * 3 + 2];
      let ax = 0, ay = 0, az = 0, cx = 0, cy = 0, cz = 0, sx = 0, sy = 0, sz = 0, n = 0;
      const c = cellOf[i];
      const ix = c % GX;
      const iy = Math.floor(c / GX) % GY;
      const iz = Math.floor(c / (GX * GY));
      for (let dz = -1; dz <= 1; dz++) {
        const z = iz + dz;
        if (z < 0 || z >= GZ) continue;
        for (let dy = -1; dy <= 1; dy++) {
          const y = iy + dy;
          if (y < 0 || y >= GY) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const x = ix + dx;
            if (x < 0 || x >= GX) continue;
            const cc = x + GX * (y + GY * z);
            for (let k = start[cc]; k < start[cc + 1]; k++) {
              const j = order[k];
              if (j === i) continue;
              const ox = pos[j * 3] - px;
              const oy = pos[j * 3 + 1] - py;
              const oz = pos[j * 3 + 2] - pz;
              const d2 = ox * ox + oy * oy + oz * oz;
              if (d2 > R_NEIGHBOUR * R_NEIGHBOUR) continue;
              n++;
              ax += vel[j * 3];
              ay += vel[j * 3 + 1];
              az += vel[j * 3 + 2];
              cx += ox;
              cy += oy;
              cz += oz;
              if (d2 < R_SEPARATE * R_SEPARATE && d2 > 1e-4) {
                const inv = 1 / d2;
                sx -= ox * inv;
                sy -= oy * inv;
                sz -= oz * inv;
              }
            }
          }
        }
      }
      let fx = 0, fy = 0, fz = 0;
      if (n > 0) {
        fx += (ax / n - vel[i * 3]) * 0.9 + (cx / n) * 0.35;
        fy += (ay / n - vel[i * 3 + 1]) * 0.9 + (cy / n) * 0.35;
        fz += (az / n - vel[i * 3 + 2]) * 0.9 + (cz / n) * 0.35;
      }
      fx += sx * 9;
      fy += sy * 9;
      fz += sz * 9;
      // Pull toward this bird's attractor (blending to the other as they merge).
      const A = group[i] ? attractors[1] : attractors[0];
      const B = attractors[group[i] ? 0 : 1];
      tmp.copy(A).lerp(B, merge * 0.5);
      fx += (tmp.x - px) * 0.035;
      fy += (tmp.y - py) * 0.05;
      fz += (tmp.z - pz) * 0.035;
      // Soft walls keep the flock in the sky beyond the window.
      if (py < CENTER.y - HALF.y) fy += 6;
      if (py > CENTER.y + HALF.y) fy -= 6;

      let vx = vel[i * 3] + fx * dt;
      let vy = vel[i * 3 + 1] + fy * dt;
      let vz = vel[i * 3 + 2] + fz * dt;
      const sp = Math.hypot(vx, vy, vz) || 1;
      const clamped = Math.min(MAX_SPEED, Math.max(MIN_SPEED, sp));
      vx = (vx / sp) * clamped;
      vy = (vy / sp) * clamped * 0.6;
      vz = (vz / sp) * clamped;
      vel[i * 3] = vx;
      vel[i * 3 + 1] = vy;
      vel[i * 3 + 2] = vz;
      pos[i * 3] = px + vx * dt;
      pos[i * 3 + 1] = py + vy * dt;
      pos[i * 3 + 2] = pz + vz * dt;

      dummy.position.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
      tmp.set(pos[i * 3] - vx, pos[i * 3 + 1] - vy, pos[i * 3 + 2] - vz);
      dummy.lookAt(tmp);
      dummy.scale.setScalar(1.1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={mesh} args={[geo, mat, N]} frustumCulled={false} />;
}
