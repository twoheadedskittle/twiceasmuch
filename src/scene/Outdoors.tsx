"use client";

import { Sky } from "@react-three/drei";
import type { Sky as SkyImpl } from "three-stdlib";
import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  IcosahedronGeometry,
  Object3D,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
  type InstancedMesh,
  type Sprite,
  type SpriteMaterial,
  type Texture,
} from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { site } from "@/config/site";
import { Birds } from "./Birds";
import { outdoor, presetIndex, PRESETS, stepOutdoor } from "./outdoorState";
import { range, seeded } from "./random";
import { rig } from "./rig";
import { cloudPuff } from "./textures";

/**
 * The world outside the window: an atmospheric sky, clouds, a countryside
 * of fields, hedgerows, copses and hills fading into haze, and a flock of
 * birds. It cycles through dawn, clear day, overcast, rain, golden hour,
 * dusk and night every few minutes (site.scene.outdoorCycleMinutes).
 *
 * The land uses one small shader: sun and sky lighting plus aerial
 * perspective by distance, so it reads as real depth through the glass
 * without lighting the room behind it.
 */

/* ---------- Land material ---------- */

const uniforms = {
  uSunDir: { value: new Vector3(0, 1, 0) },
  uSun: { value: new Color() },
  uAmb: { value: new Color() },
  uHaze: { value: new Color() },
  uHazeDist: { value: 420 },
};

const landVertex = /* glsl */ `
varying vec3 vColor;
varying vec3 vNormalW;
varying vec3 vWorld;
void main() {
  vec4 p = vec4(position, 1.0);
  vec3 n = normal;
  #ifdef USE_INSTANCING
    p = instanceMatrix * p;
    n = mat3(instanceMatrix) * n;
  #endif
  vec4 w = modelMatrix * p;
  vWorld = w.xyz;
  vNormalW = normalize(mat3(modelMatrix) * n);
  vColor = vec3(1.0);
  #ifdef USE_COLOR
    vColor *= color;
  #endif
  #ifdef USE_INSTANCING_COLOR
    vColor *= instanceColor;
  #endif
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const landFragment = /* glsl */ `
uniform vec3 uSunDir;
uniform vec3 uSun;
uniform vec3 uAmb;
uniform vec3 uHaze;
uniform float uHazeDist;
varying vec3 vColor;
varying vec3 vNormalW;
varying vec3 vWorld;
void main() {
  vec3 n = normalize(vNormalW);
  float diffuse = max(dot(n, uSunDir), 0.0);
  // Wrap a little light round the dark side, as skylight does.
  float wrap = 0.5 + 0.5 * n.y;
  vec3 c = vColor * (uAmb * wrap + uSun * diffuse);
  float dist = length(vWorld - cameraPosition);
  float h = 1.0 - exp(-dist / uHazeDist);
  c = mix(c, uHaze, clamp(h, 0.0, 1.0));
  gl_FragColor = vec4(c, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

function landMaterial() {
  return new ShaderMaterial({
    uniforms,
    vertexShader: landVertex,
    fragmentShader: landFragment,
    vertexColors: true,
    fog: false,
  });
}

/* ---------- Land: fields, hills ---------- */

function fbm(x: number, z: number, seed: number) {
  let v = 0;
  let amp = 1;
  let f = 1;
  for (let o = 0; o < 4; o++) {
    v += amp * (Math.sin(x * 0.011 * f + seed) * Math.cos(z * 0.013 * f - seed * 0.7) + Math.sin((x + z) * 0.007 * f + seed * 1.3) * 0.5);
    amp *= 0.5;
    f *= 2.1;
  }
  return v;
}

/** Patchwork farmland rolling away to the horizon. */
function useGround() {
  return useMemo(() => {
    const g = new PlaneGeometry(1800, 1400, 150, 120);
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, -700);
    const pos = g.attributes.position as BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const r = seeded(404);
    const fieldTints = [
      [0.36, 0.5, 0.22],
      [0.44, 0.55, 0.24],
      [0.58, 0.56, 0.3],
      [0.3, 0.44, 0.2],
      [0.5, 0.46, 0.26],
    ];
    const fieldAt = (x: number, z: number) => {
      // Fields are irregular quads: a coarse grid with jittered edges.
      const fx = Math.floor((x + Math.sin(z * 0.02) * 18) / 70);
      const fz = Math.floor((z + Math.cos(x * 0.017) * 14) / 55);
      const h = Math.abs(Math.sin(fx * 12.9898 + fz * 78.233) * 43758.5453) % 1;
      return fieldTints[Math.floor(h * fieldTints.length)];
    };
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const d = Math.max(0, -z - 20);
      // Flat garden near the house, rising into rolling country further out.
      const y = -0.6 + fbm(x, z, 3) * Math.min(1, d / 160) * 16 + Math.max(0, d - 500) * 0.06;
      pos.setY(i, y);
      const t = fieldAt(x, z);
      const n = 0.9 + r() * 0.2;
      // Near the window: a mown lawn.
      const lawn = d < 18;
      colors[i * 3] = (lawn ? 0.3 : t[0]) * n;
      colors[i * 3 + 1] = (lawn ? 0.46 : t[1]) * n;
      colors[i * 3 + 2] = (lawn ? 0.2 : t[2]) * n;
    }
    g.setAttribute("color", new BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);
}

/** Distant ridges, each a ribbon of hills; the far one reads as mountains. */
function useRidge(z: number, height: number, seed: number) {
  return useMemo(() => {
    const segs = 160;
    const width = 3200;
    const verts: number[] = [];
    const colors: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= segs; i++) {
      const x = -width / 2 + (width * i) / segs;
      const h = height * (0.55 + 0.45 * (0.5 + 0.5 * fbm(x * 0.6, seed * 100, seed)));
      verts.push(x, -20, z, x, h, z - 40);
      const shade = 0.75 + 0.25 * Math.sin(x * 0.01 + seed);
      colors.push(0.22 * shade, 0.32 * shade, 0.2 * shade, 0.3 * shade, 0.4 * shade, 0.28 * shade);
      if (i < segs) {
        const a = i * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(new Float32Array(verts), 3));
    g.setAttribute("color", new BufferAttribute(new Float32Array(colors), 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, [z, height, seed]);
}

/* ---------- Trees: hedgerows and copses ---------- */

function treeGeometry() {
  const trunk = new CylinderGeometry(0.12, 0.2, 2.2, 8);
  trunk.translate(0, 1.1, 0);
  trunk.deleteAttribute("uv");
  const crowns = [
    [0, 3.0, 0, 1.6],
    [0.7, 2.6, 0.3, 1.1],
    [-0.6, 2.7, -0.2, 1.2],
    [0.1, 3.8, 0.1, 1.1],
  ].map(([x, y, z, s]) => {
    // Welded and smooth-shaded, so the ink pass draws the crown's outline, not its facets.
    let g: BufferGeometry = new IcosahedronGeometry(s, 3);
    g.deleteAttribute("normal");
    g.deleteAttribute("uv");
    g = mergeVertices(g);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const n = 1 + 0.18 * Math.sin(p.getX(k) * 5.1 + p.getY(k) * 3.7) * Math.cos(p.getZ(k) * 4.3);
      p.setXYZ(k, p.getX(k) * n, p.getY(k) * n * 0.9, p.getZ(k) * n);
    }
    g.translate(x, y, z);
    g.computeVertexNormals();
    return g;
  });
  const parts = [trunk, ...crowns].map((g, i) => {
    const n = g.attributes.position.count;
    const c = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) {
      if (i === 0) c.set([0.32, 0.24, 0.17], k * 3);
      else c.set([0.27 + (k % 3) * 0.02, 0.4 + (k % 5) * 0.015, 0.2], k * 3);
    }
    g.setAttribute("color", new BufferAttribute(c, 3));
    return g;
  });
  return mergeGeometries(parts)!;
}

function Trees() {
  const mesh = useRef<InstancedMesh>(null);
  const geo = useMemo(() => treeGeometry(), []);
  const mat = useMemo(() => landMaterial(), []);
  const placements = useMemo(() => {
    const r = seeded(77);
    const out: { x: number; z: number; s: number; tint: number }[] = [];
    // Hedgerows across the fields, then copses, then a scatter.
    for (const z of [-26, -70, -130, -210, -320]) {
      for (let x = -400; x < 400; x += range(r, 5, 11)) {
        if (r() < 0.25) continue;
        out.push({ x, z: z + range(r, -3, 3), s: range(r, 0.8, 1.5), tint: range(r, 0.8, 1.15) });
      }
    }
    for (let c = 0; c < 14; c++) {
      const cx = range(r, -350, 350);
      const cz = range(r, -420, -45);
      for (let k = 0; k < 14; k++) {
        out.push({ x: cx + range(r, -16, 16), z: cz + range(r, -12, 12), s: range(r, 1, 2), tint: range(r, 0.75, 1.1) });
      }
    }
    // Two trees in the garden itself, for scale through the glass.
    out.push({ x: -16, z: -30, s: 1.7, tint: 1 }, { x: 19, z: -36, s: 2, tint: 0.9 });
    return out;
  }, []);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const o = new Object3D();
    const c = new Color();
    placements.forEach((p, i) => {
      const d = Math.max(0, -p.z - 20);
      const y = -0.6 + fbm(p.x, p.z, 3) * Math.min(1, d / 160) * 16;
      o.position.set(p.x, y - 0.2, p.z);
      o.rotation.set(0, (i * 2.399) % (Math.PI * 2), 0);
      o.scale.setScalar(p.s);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, c.setScalar(p.tint));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [placements]);

  return <instancedMesh ref={mesh} args={[geo, mat, placements.length]} frustumCulled={false} />;
}

/* ---------- Clouds ---------- */

function Clouds() {
  const count = 34;
  const texs = useMemo<Texture[]>(() => [0, 1, 2, 3].map((i) => cloudPuff(i)), []);
  const items = useMemo(() => {
    const r = seeded(12);
    return Array.from({ length: count }, (_, i) => ({
      x: range(r, -700, 700),
      y: range(r, 70, 220),
      z: range(r, -260, -760),
      s: range(r, 90, 220),
      tex: i % texs.length,
      speed: range(r, 1.5, 4),
      // Clouds appear in order as cover rises: low i first.
      threshold: i / count,
    }));
  }, [texs.length]);
  const refs = useRef<(Sprite | null)[]>([]);
  const mats = useRef<(SpriteMaterial | null)[]>([]);

  useFrame((_, dt) => {
    items.forEach((it, i) => {
      const s = refs.current[i];
      const m = mats.current[i];
      if (!s || !m) return;
      if (!rig.reducedMotion) {
        it.x += it.speed * dt;
        if (it.x > 760) it.x = -760;
      }
      s.position.x = it.x;
      const on = Math.min(1, Math.max(0, (outdoor.cloud - it.threshold) * 6 + 0.25));
      m.opacity = on * (0.55 + outdoor.cloud * 0.4);
      m.color.copy(outdoor.cloudColor);
      s.visible = m.opacity > 0.01;
    });
  });

  return (
    <group>
      {items.map((it, i) => (
        <sprite
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          position={[it.x, it.y, it.z]}
          scale={[it.s, it.s * 0.55, 1]}
        >
          <spriteMaterial
            ref={(el) => {
              mats.current[i] = el;
            }}
            map={texs[it.tex]}
            transparent
            depthWrite={false}
            fog={false}
          />
        </sprite>
      ))}
    </group>
  );
}

/* ---------- Stars ---------- */

function Stars() {
  const geo = useMemo(() => {
    const r = seeded(5);
    const n = 1400;
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const az = r() * Math.PI * 2;
      const el = Math.asin(0.05 + r() * 0.95);
      const R = 900;
      p[i * 3] = Math.cos(el) * Math.sin(az) * R;
      p[i * 3 + 1] = Math.sin(el) * R;
      p[i * 3 + 2] = -Math.cos(el) * Math.cos(az) * R;
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(p, 3));
    return g;
  }, []);
  const mat = useRef<import("three").PointsMaterial>(null);
  useFrame(() => {
    if (mat.current) mat.current.opacity = outdoor.stars;
  });
  return (
    <points geometry={geo}>
      <pointsMaterial ref={mat} size={1.6} sizeAttenuation={false} color="#e8eef8" transparent opacity={0} depthWrite={false} fog={false} />
    </points>
  );
}

/* ---------- The whole outdoors ---------- */

export function Outdoors() {
  const sky = useRef<SkyImpl>(null);
  const ground = useGround();
  const near = useRidge(-520, 70, 1);
  const far = useRidge(-1100, 190, 2);
  const groundMat = useMemo(() => landMaterial(), []);
  const ridgeMat = useMemo(() => landMaterial(), []);
  const start = useRef(0);
  const pinned = useRef(false);
  const sunVec = useMemo(() => new Vector3(), []);

  useEffect(() => {
    // `?sky=night` pins a preset for review; otherwise each visit starts somewhere new.
    const pin = presetIndex(new URLSearchParams(window.location.search).get("sky"));
    pinned.current = pin >= 0;
    start.current = pin >= 0 ? pin : Math.floor(Math.random() * PRESETS.length);
  }, []);

  useFrame(({ clock }) => {
    const hold = pinned.current ? 1e9 : site.scene.outdoorCycleMinutes * 60;
    stepOutdoor(clock.elapsedTime, hold, start.current);

    const el = (outdoor.sunElev * Math.PI) / 180;
    const az = (outdoor.sunAzim * Math.PI) / 180;
    sunVec.set(Math.cos(el) * Math.sin(az), Math.sin(el), -Math.cos(el) * Math.cos(az));
    uniforms.uSunDir.value.copy(sunVec).normalize();
    // Below the horizon the land gets no direct sun at all.
    const day = Math.max(0, Math.min(1, (outdoor.sunElev + 4) / 12));
    uniforms.uSun.value.copy(outdoor.sunColor).multiplyScalar(1.15 * day * (1 - outdoor.cloud * 0.55));
    uniforms.uAmb.value.copy(outdoor.ambient).multiplyScalar(0.9);
    uniforms.uHaze.value.copy(outdoor.haze);
    uniforms.uHazeDist.value = 520 - outdoor.cloud * 220 - outdoor.rain * 120;

    const m = sky.current?.material;
    if (m) {
      m.uniforms.sunPosition.value.copy(sunVec).multiplyScalar(1000);
      m.uniforms.turbidity.value = outdoor.turbidity;
      m.uniforms.rayleigh.value = outdoor.rayleigh;
      m.uniforms.mieCoefficient.value = outdoor.mie;
      if (m.uniforms.uExposure) m.uniforms.uExposure.value = 0.42;
    }
  });

  // Patch the sky shader once with an exposure control.
  useEffect(() => {
    const m = sky.current?.material;
    if (!m || m.uniforms.uExposure) return;
    m.uniforms.uExposure = { value: 0.42 };
    m.fragmentShader = m.fragmentShader
      .replace("uniform vec3 up;", "uniform vec3 up;\nuniform float uExposure;")
      .replace("gl_FragColor = vec4( retColor, 1.0 );", "gl_FragColor = vec4( retColor * uExposure, 1.0 );");
    m.needsUpdate = true;
  }, []);

  // Only worth drawing while the window can be seen.
  const group = useRef<import("three").Group>(null);
  useFrame(() => {
    if (group.current) group.current.visible = rig.cold < 0.97;
  });

  return (
    <group ref={group}>
      <Sky ref={sky} distance={1000} mieDirectionalG={0.8} />
      <Stars />
      <Clouds />
      <mesh geometry={far} material={ridgeMat} frustumCulled={false} />
      <mesh geometry={near} material={ridgeMat} frustumCulled={false} />
      <mesh geometry={ground} material={groundMat} frustumCulled={false} />
      <Trees />
      <Birds />
    </group>
  );
}
