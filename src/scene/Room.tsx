"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  MathUtils,
  Object3D,
  type InstancedMesh,
  type AmbientLight,
  type DirectionalLight,
  type Group,
  type HemisphereLight,
  type Mesh,
  type MeshBasicMaterial,
  type PointLight,
  type Texture,
} from "three";
import { getState, play, subscribe, toggle } from "@/audio/player";
import { site } from "@/config/site";
import { focusOn } from "./focus";
import { nav, setCursor } from "./nav";
import { C } from "./palette";
import { Box } from "./parts";
import { toonRamp } from "./toon";
import { rig, ROOM, uiStore } from "./rig";
import { grooves, lightSpill, rain, shelfLabel, sleeve, SLEEVE_LIST, windowView } from "./textures";

const { width: W, height: H, backZ, frontZ, depth: D } = ROOM;
const T = 0.15; // wall thickness

/* ---------- Window wall ---------- */

function WindowWall() {
  const { width: ww, height: wh, sill } = ROOM.window;
  const sideW = (W - ww) / 2;
  const top = sill + wh;
  const z = backZ;
  const cols = 4;
  const rows = 3;
  const view = useMemo(() => windowView(), []);
  const drops = useMemo(() => {
    const t = rain();
    t.repeat.set(3, 1.6);
    return t;
  }, []);
  const spill = useMemo(() => lightSpill(cols, rows), []);
  const rainMat = useRef<MeshBasicMaterial>(null);

  useFrame((_, dt) => {
    if (rig.reducedMotion) return;
    drops.offset.y += dt * 0.9;
    drops.offset.x += dt * 0.08;
    // Rain only matters while the window is in view; keep it cheap.
    if (rainMat.current) rainMat.current.opacity = rig.beat === "hallway" ? 0 : 0.55;
  });

  return (
    <group>
      <Box size={[sideW, H, T]} position={[-(ww / 2 + sideW / 2), H / 2, z]} color={C.limewash} />
      <Box size={[sideW, H, T]} position={[ww / 2 + sideW / 2, H / 2, z]} color={C.limewash} />
      <Box size={[ww, sill, T]} position={[0, sill / 2, z]} color={C.limewash} />
      <Box size={[ww, H - top, T]} position={[0, top + (H - top) / 2, z]} color={C.limewash} />

      {/* Deep reveal, sill and glazing bars, all inked */}
      <Box size={[ww + 0.16, 0.06, 0.34]} position={[0, sill - 0.02, z + 0.09]} color={C.frame} inked />
      <Box size={[0.08, wh, 0.22]} position={[-ww / 2 - 0.04, sill + wh / 2, z + 0.03]} color={C.frame} inked />
      <Box size={[0.08, wh, 0.22]} position={[ww / 2 + 0.04, sill + wh / 2, z + 0.03]} color={C.frame} inked />
      <Box size={[ww + 0.16, 0.08, 0.22]} position={[0, top + 0.04, z + 0.03]} color={C.frame} inked />
      {Array.from({ length: cols - 1 }, (_, i) => (
        <Box key={`c${i}`} size={[0.04, wh, 0.05]} position={[-ww / 2 + ((i + 1) * ww) / cols, sill + wh / 2, z]} color={C.frame} inked />
      ))}
      {Array.from({ length: rows - 1 }, (_, i) => (
        <Box key={`r${i}`} size={[ww, 0.04, 0.05]} position={[0, sill + ((i + 1) * wh) / rows, z]} color={C.frame} inked />
      ))}

      {/* Original rainy-garden view, then rain falling in front of it */}
      <mesh position={[0, sill + wh / 2 + 0.1, z - 1.6]}>
        <planeGeometry args={[ww * 2.3, ww * 2.3 * (1024 / 1536)]} />
        <meshBasicMaterial map={view} toneMapped={false} />
      </mesh>
      <mesh position={[0, sill + wh / 2, z - 0.5]}>
        <planeGeometry args={[ww * 1.6, wh * 1.6]} />
        <meshBasicMaterial ref={rainMat} map={drops} transparent opacity={0.55} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* Daylight spilling onto the floor, panes and bars */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.013, z + 1.7]}>
        <planeGeometry args={[ww * 1.15, 3]} />
        <meshBasicMaterial map={spill} transparent opacity={0.32} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ---------- Bookshelf ---------- */

const SPINES = [C.oxblood, C.mustard, C.sageDeep, C.salmon, C.greenBlack, C.frame];

/** Seeded so the same shelf fills the same way on every load. */
function fillShelves(shelves: number, width: number, shelfH: number) {
  const out: { x: number; y: number; h: number; w: number; tilt: number; color: string }[] = [];
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let s = 0; s < shelves; s++) {
    let x = -width / 2 + 0.08;
    while (x < width / 2 - 0.12) {
      const w = 0.03 + rand() * 0.05;
      const h = 0.24 + rand() * 0.1;
      const lean = rand() > 0.94 ? 0.18 : 0;
      out.push({ x: x + w / 2, y: 0.15 + s * shelfH + h / 2, h, w, tilt: lean, color: SPINES[Math.floor(rand() * SPINES.length)] });
      x += w + 0.004 + (lean ? 0.04 : 0);
      if (rand() > 0.93) x += 0.12; // a gap where a book is out
    }
  }
  return out;
}

function ShelfLabel({ slug, label, y, z }: { slug: string; label: string; y: number; z: number }) {
  const [hot, setHot] = useState(false);
  const texs = useMemo(() => [shelfLabel(label, false), shelfLabel(label, true)] as const, [label]);
  const mesh = useRef<Mesh>(null);

  useFrame((_, dt) => {
    if (!mesh.current) return;
    // Lift toward the visitor a few millimetres when hovered.
    mesh.current.position.z = MathUtils.damp(mesh.current.position.z, z + (hot ? 0.012 : 0), 14, dt);
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (uiStore.get().focus === "shelf") nav.go(`/${slug}`);
    else focusOn("shelf");
  };

  return (
    <mesh
      ref={mesh}
      position={[0, y, z]}
      onClick={onClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHot(true);
        setCursor("pointer");
      }}
      onPointerOut={() => {
        setHot(false);
        setCursor("auto");
      }}
    >
      <planeGeometry args={[0.4, 0.1]} />
      <meshBasicMaterial map={texs[hot ? 1 : 0]} toneMapped={false} />
    </mesh>
  );
}

/** Every spine in one instanced draw call. */
function Books({ books, depth }: { books: ReturnType<typeof fillShelves>; depth: number }) {
  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const o = new Object3D();
    const color = new Color();
    books.forEach((b, i) => {
      o.position.set(b.x, b.y, 0);
      o.rotation.set(0, 0, b.tilt);
      o.scale.set(b.w, b.h, depth);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, color.set(b.color));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [books, depth]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, books.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshToonMaterial gradientMap={toonRamp()} />
    </instancedMesh>
  );
}

function Bookshelf() {
  // One shelf per configured section, minimum three, so config drives height.
  const shelves = Math.max(3, site.sections.length);
  const shelfH = 0.42;
  const height = shelves * shelfH + 0.3;
  const width = 1.7;
  const depth = 0.38;
  const books = useMemo(() => fillShelves(shelves, width, shelfH), [shelves]);

  return (
    // Against the left wall near the window, facing +X (across the room).
    <group
      position={[-W / 2 + depth / 2 + T / 2, 0, ROOM.furnitureZ]}
      rotation={[0, Math.PI / 2, 0]}
      onClick={(e) => {
        e.stopPropagation();
        if (uiStore.get().focus !== "shelf") focusOn("shelf");
      }}
    >
      <Box size={[width, height, 0.04]} position={[0, height / 2, -depth / 2]} color={C.oakDark} />
      <Box size={[0.05, height, depth]} position={[-width / 2, height / 2, 0]} color={C.oak} inked />
      <Box size={[0.05, height, depth]} position={[width / 2, height / 2, 0]} color={C.oak} inked />
      <Box size={[width + 0.1, 0.06, depth + 0.04]} position={[0, height + 0.03, 0]} color={C.oak} inked />
      {Array.from({ length: shelves }, (_, i) => (
        <Box key={i} size={[width, 0.04, depth]} position={[0, 0.13 + i * shelfH, 0]} color={C.oak} inked />
      ))}
      <Books books={books} depth={depth * 0.8} />
      {/* Labels hang from the front edge of each shelf, top shelf first. */}
      {site.sections.map((s, k) => {
        const row = shelves - 1 - k;
        return <ShelfLabel key={s.slug} slug={s.slug} label={s.label} y={0.13 + row * shelfH - 0.055} z={depth / 2 + 0.006} />;
      })}
    </group>
  );
}

/* ---------- Record player ---------- */

function RecordPlayer() {
  const state = useSyncExternalStore(subscribe, getState, getState);
  const platter = useRef<Group>(null);
  const arm = useRef<Group>(null);
  const spin = useRef(0);
  const record = useMemo(() => grooves(site.name), []);
  const titles = useMemo(() => site.tracks.map((t) => t.title), []);
  const sleeveTex = useMemo(() => sleeve(titles, site.name, state.index, state.playing), [titles, state.index, state.playing]);
  const prevSleeve = useRef<Texture | null>(null);

  useEffect(() => {
    const old = prevSleeve.current;
    prevSleeve.current = sleeveTex;
    old?.dispose();
  }, [sleeveTex]);

  useFrame((_, dt) => {
    // 33 1/3 rpm, with a spin-up and a slow coast to a stop.
    const target = state.playing ? 3.49 : 0;
    spin.current = MathUtils.damp(spin.current, target, state.playing ? 2.2 : 0.9, dt);
    if (platter.current) platter.current.rotation.y -= spin.current * dt;
    // Tonearm swings onto the lead-in groove when playing.
    if (arm.current) arm.current.rotation.y = MathUtils.damp(arm.current.rotation.y, state.playing ? 0.42 : 0, 5, dt);
  });

  const onDeck = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (uiStore.get().focus === "player") toggle();
    else focusOn("player");
  };

  const onSleeve = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (uiStore.get().focus !== "player") return focusOn("player");
    const v = 1 - (e.uv?.y ?? 0); // canvas rows run top to bottom
    const n = titles.length;
    const row = Math.floor(((v - SLEEVE_LIST.top) / (SLEEVE_LIST.bottom - SLEEVE_LIST.top)) * n);
    if (row >= 0 && row < n) play(row);
  };

  const pointer = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setCursor("pointer");
    },
    onPointerOut: () => setCursor("auto"),
  };

  return (
    // Against the right wall near the window, facing -X (toward the shelf).
    <group position={[W / 2 - 0.3 - T / 2, 0, ROOM.furnitureZ]} rotation={[0, -Math.PI / 2, 0]}>
      {/* Low sage cabinet with two doors */}
      <Box size={[1.1, 0.68, 0.5]} position={[0, 0.34, 0]} color={C.sageDeep} inked />
      <Box size={[0.5, 0.5, 0.01]} position={[-0.27, 0.36, 0.255]} color={C.sage} />
      <Box size={[0.5, 0.5, 0.01]} position={[0.27, 0.36, 0.255]} color={C.sage} />
      <Box size={[0.03, 0.03, 0.03]} position={[-0.05, 0.4, 0.27]} color={C.brass} />
      <Box size={[0.03, 0.03, 0.03]} position={[0.05, 0.4, 0.27]} color={C.brass} />

      {/* The deck: click to walk over, click again to play or pause */}
      <group onClick={onDeck} {...pointer}>
        <Box size={[0.56, 0.08, 0.42]} position={[-0.18, 0.72, 0]} color={C.oak} inked />
        <group ref={platter} position={[-0.24, 0.775, 0]}>
          <mesh>
            <cylinderGeometry args={[0.16, 0.16, 0.012, 64]} />
            <meshToonMaterial color={C.ink} />
          </mesh>
          <mesh position={[0, 0.0065, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.158, 64]} />
            <meshBasicMaterial map={record} />
          </mesh>
        </group>
        {/* Tonearm: pivot at the back right of the plinth */}
        <group ref={arm} position={[0.02, 0.79, -0.14]}>
          <Box size={[0.035, 0.035, 0.035]} position={[0, 0, 0]} color={C.brass} inked />
          <Box size={[0.012, 0.012, 0.26]} position={[-0.03, 0.015, 0.12]} rotation={[0, 0.25, 0]} color={C.frame} />
          <Box size={[0.03, 0.012, 0.04]} position={[-0.065, 0.012, 0.25]} color={C.ink} />
        </group>
        <Box size={[0.03, 0.02, 0.03]} position={[0.04, 0.775, 0.15]} color={state.playing ? C.mustard : C.frame} />
      </group>

      {/* Sleeve leaning on the wall: the track list, each row playable */}
      <mesh position={[0.3, 0.9, -0.17]} rotation={[-0.16, 0, 0]} onClick={onSleeve} {...pointer}>
        <planeGeometry args={[0.42, 0.42]} />
        <meshBasicMaterial map={sleeveTex} toneMapped={false} />
      </mesh>
      <Box size={[0.43, 0.43, 0.006]} position={[0.3, 0.9, -0.175]} rotation={[-0.16, 0, 0]} color={C.salmon} inked />
    </group>
  );
}

/* ---------- Panel wall that opens onto the hallway ---------- */

function PanelWall() {
  const left = useRef<Group>(null);
  const right = useRef<Group>(null);
  const { width: dw, height: dh } = ROOM.doorway;
  const sideW = (W - dw) / 2;
  const z = frontZ;

  useFrame(() => {
    const o = rig.wallOpen;
    // Panels slide into the walls on either side, like a pocket door.
    if (left.current) left.current.position.x = -dw / 4 - o * (dw / 2 + 0.02);
    if (right.current) right.current.position.x = dw / 4 + o * (dw / 2 + 0.02);
  });

  return (
    <group>
      <Box size={[sideW, H, T]} position={[-(dw / 2 + sideW / 2), H / 2, z]} color={C.greenBlack} />
      <Box size={[sideW, H, T]} position={[dw / 2 + sideW / 2, H / 2, z]} color={C.greenBlack} />
      <Box size={[dw, H - dh, T]} position={[0, dh + (H - dh) / 2, z]} color={C.greenBlack} />
      {[left, right].map((ref, i) => (
        <group key={i} ref={ref} position={[(i ? 1 : -1) * (dw / 4), 0, z - 0.02]}>
          <Box size={[dw / 2, dh, T * 0.6]} position={[0, dh / 2, 0]} color={C.greenBlack} inked />
          <Box size={[dw / 2 - 0.18, dh * 0.42, 0.02]} position={[0, dh * 0.72, -T * 0.32]} color={C.sageDeep} />
          <Box size={[dw / 2 - 0.18, dh * 0.42, 0.02]} position={[0, dh * 0.26, -T * 0.32]} color={C.sageDeep} />
        </group>
      ))}
      {/* Brass frame around the opening */}
      <Box size={[0.06, dh, 0.2]} position={[-dw / 2, dh / 2, z - 0.05]} color={C.brass} inked />
      <Box size={[0.06, dh, 0.2]} position={[dw / 2, dh / 2, z - 0.05]} color={C.brass} inked />
      <Box size={[dw + 0.06, 0.06, 0.2]} position={[0, dh, z - 0.05]} color={C.brass} inked />
    </group>
  );
}

/* ---------- Lights that answer the visitor ---------- */

function ChoiceLights() {
  const shelf = useRef<PointLight>(null);
  const player = useRef<PointLight>(null);
  useFrame((_, dt) => {
    const { hover, focus } = uiStore.get();
    const k = rig.reducedMotion ? 30 : 6;
    if (shelf.current) {
      const on = hover === "shelf" || focus === "shelf";
      shelf.current.intensity = MathUtils.damp(shelf.current.intensity, on ? 3.2 : 0, k, dt);
    }
    if (player.current) {
      const on = hover === "player" || focus === "player";
      player.current.intensity = MathUtils.damp(player.current.intensity, on ? 3.2 : 0, k, dt);
    }
  });
  return (
    <>
      <pointLight ref={shelf} position={[-W / 2 + 1.1, 2.3, ROOM.furnitureZ]} intensity={0} distance={3.4} decay={1.6} color="#ffd59a" />
      <pointLight ref={player} position={[W / 2 - 0.9, 1.9, ROOM.furnitureZ]} intensity={0} distance={2.8} decay={1.6} color="#ffd59a" />
    </>
  );
}

export function Room() {
  return (
    <group>
      {/* Floor (oak), rug, ceiling, side walls */}
      <Box size={[W, 0.02, D]} position={[0, -0.01, 0]} color={C.oak} />
      <Box size={[2.6, 0.012, 3.6]} position={[0, 0.006, -1.2]} color={C.oxblood} inked />
      <Box size={[W, 0.02, D]} position={[0, H, 0]} color={C.limewashLight} />
      <Box size={[T, H, D]} position={[-W / 2, H / 2, 0]} color={C.sage} />
      <Box size={[T, H, D]} position={[W / 2, H / 2, 0]} color={C.sage} />
      {/* Dado rail and skirting on the side walls */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box size={[0.04, 0.06, D]} position={[s * (W / 2 - 0.09), 0.95, 0]} color={C.frame} inked />
          <Box size={[0.03, 0.12, D]} position={[s * (W / 2 - 0.09), 0.06, 0]} color={C.greenBlack} />
        </group>
      ))}

      <WindowWall />
      <Bookshelf />
      <RecordPlayer />
      <PanelWall />
      <ChoiceLights />

      <RoomLights />
    </group>
  );
}

/**
 * Daylight from the window, a warm ceiling lamp, soft fill. All of it fades
 * as the visitor crosses into the hallway (rig.cold), which is the warm to
 * cold grade: the hallway is lit only by its own failing lamps.
 */
function RoomLights() {
  const hemi = useRef<HemisphereLight>(null);
  const amb = useRef<AmbientLight>(null);
  const sun = useRef<DirectionalLight>(null);
  const lamp = useRef<PointLight>(null);
  useFrame(() => {
    const w = 1 - rig.cold;
    if (hemi.current) hemi.current.intensity = 1.1 * w + 0.07;
    if (amb.current) amb.current.intensity = 0.4 * w + 0.02;
    if (sun.current) sun.current.intensity = 1.8 * w;
    if (lamp.current) lamp.current.intensity = 7 * w;
  });
  return (
    <>
      <hemisphereLight ref={hemi} args={["#f3e6cf", "#3a2a1c", 1.1]} />
      <ambientLight ref={amb} intensity={0.4} color="#f1dcc0" />
      <directionalLight ref={sun} position={[0.4, 2.6, backZ - 2]} intensity={1.8} color="#eef3f2" />
      <pointLight ref={lamp} position={[0, H - 0.95, 1.2]} intensity={7} distance={9} decay={2} color="#ffc98a" />
      {/* Pendant: cord, mustard cloth shade, bulb glowing under it */}
      <group position={[0, H, 1.2]}>
        <Box size={[0.012, 0.6, 0.012]} position={[0, -0.3, 0]} color={C.ink} />
        <mesh position={[0, -0.72, 0]}>
          <cylinderGeometry args={[0.1, 0.24, 0.24, 28, 1, true]} />
          <meshToonMaterial color={C.mustard} gradientMap={toonRamp()} side={DoubleSide} />
        </mesh>
        <mesh position={[0, -0.8, 0]}>
          <sphereGeometry args={[0.06, 16, 10]} />
          <meshBasicMaterial color="#fff1d0" toneMapped={false} />
        </mesh>
      </group>
    </>
  );
}
