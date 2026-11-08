"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Color, MathUtils, Object3D, type Group, type InstancedMesh, type Mesh, type Texture } from "three";
import { getState, play, subscribe, toggle } from "@/audio/player";
import { site } from "@/config/site";
import { focusOn } from "./focus";
import { nav, setCursor } from "./nav";
import { C } from "./palette";
import { Box } from "./parts";
import { ROOM, uiStore } from "./rig";
import { grooves, shelfLabel, sleeve, SLEEVE_LIST, spine } from "./textures";
import { toonRamp } from "./toon";

/** The two things a visitor can walk to: the bookshelf and the record player. */

const { width: W } = ROOM;
const T = 0.15; // wall thickness

/* ---------- Bookshelf ---------- */

const SPINES = [C.oxblood, C.brass, C.crimsonDeep, C.cream, C.lacquer, C.frame, C.lacquer];

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

/** Every spine in one instanced draw call, bookcloth texture tinted per book. */
function Books({ books, depth }: { books: ReturnType<typeof fillShelves>; depth: number }) {
  const mesh = useRef<InstancedMesh>(null);
  const cloth = useMemo(() => spine(), []);
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
      <meshToonMaterial map={cloth} gradientMap={toonRamp()} />
    </instancedMesh>
  );
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

export function Bookshelf() {
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
      <Box size={[width, height, 0.04]} position={[0, height / 2, -depth / 2]} color={C.walnutDark} />
      <Box size={[0.05, height, depth]} position={[-width / 2, height / 2, 0]} color={C.walnut} />
      <Box size={[0.05, height, depth]} position={[width / 2, height / 2, 0]} color={C.walnut} />
      <Box size={[width + 0.1, 0.06, depth + 0.04]} position={[0, height + 0.03, 0]} color={C.walnut} />
      {Array.from({ length: shelves }, (_, i) => (
        <Box key={i} size={[width, 0.04, depth]} position={[0, 0.13 + i * shelfH, 0]} color={C.walnut} />
      ))}
      <Books books={books} depth={depth * 0.8} />
      {/* A few things on top: a plant, a small stack, a bookend. */}
      <group position={[0, height + 0.06, 0]}>
        <mesh position={[-0.55, 0.07, 0]}>
          <cylinderGeometry args={[0.07, 0.055, 0.14, 16]} />
          <meshToonMaterial color={C.cream} gradientMap={toonRamp()} />
        </mesh>
        {[[-0.58, 0.2, 0.02], [-0.5, 0.24, -0.03], [-0.55, 0.3, 0.01]].map((p, i) => (
          <mesh key={i} position={p as [number, number, number]}>
            <sphereGeometry args={[0.07 - i * 0.012, 10, 8]} />
            <meshToonMaterial color={C.crimsonDeep} gradientMap={toonRamp()} />
          </mesh>
        ))}
        <Box size={[0.24, 0.04, 0.17]} position={[0.4, 0.02, 0]} color={C.oxblood} />
        <Box size={[0.22, 0.035, 0.16]} position={[0.41, 0.058, 0]} color={C.frame} />
      </group>
      {/* Labels hang from the front edge of each shelf, top shelf first. */}
      {site.sections.map((s, k) => {
        const row = shelves - 1 - k;
        return <ShelfLabel key={s.slug} slug={s.slug} label={s.label} y={0.13 + row * shelfH - 0.055} z={depth / 2 + 0.006} />;
      })}
    </group>
  );
}

/* ---------- Record player ---------- */

export function RecordPlayer() {
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
    if (arm.current) arm.current.rotation.y = MathUtils.damp(arm.current.rotation.y, state.playing ? -0.42 : 0, 5, dt);
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
      {/* Low sage cabinet with two doors on brass legs */}
      <Box size={[1.1, 0.6, 0.5]} position={[0, 0.38, 0]} color={C.crimsonDeep} />
      <Box size={[0.5, 0.46, 0.01]} position={[-0.27, 0.38, 0.255]} color={C.crimson} />
      <Box size={[0.5, 0.46, 0.01]} position={[0.27, 0.38, 0.255]} color={C.crimson} />
      <Box size={[0.03, 0.03, 0.03]} position={[-0.05, 0.42, 0.27]} color={C.brass} />
      <Box size={[0.03, 0.03, 0.03]} position={[0.05, 0.42, 0.27]} color={C.brass} />
      {[[-0.5, -0.2], [0.5, -0.2], [-0.5, 0.2], [0.5, 0.2]].map(([x, z], i) => (
        <Box key={i} size={[0.03, 0.08, 0.03]} position={[x, 0.04, z]} color={C.brass} />
      ))}

      {/* The deck: click to walk over, click again to play or pause */}
      <group onClick={onDeck} {...pointer}>
        <Box size={[0.56, 0.08, 0.42]} position={[-0.18, 0.72, 0]} color={C.walnut} />
        <group ref={platter} position={[-0.24, 0.775, 0]}>
          <mesh>
            <cylinderGeometry args={[0.16, 0.16, 0.012, 64]} />
            <meshToonMaterial color={C.ink} gradientMap={toonRamp()} />
          </mesh>
          <mesh position={[0, 0.0065, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.158, 64]} />
            <meshBasicMaterial map={record} />
          </mesh>
        </group>
        {/* Tonearm: pivot at the back right of the plinth */}
        <group ref={arm} position={[0.02, 0.79, -0.14]}>
          <Box size={[0.035, 0.035, 0.035]} color={C.brass} />
          <Box size={[0.012, 0.012, 0.26]} position={[-0.03, 0.015, 0.12]} rotation={[0, 0.25, 0]} color={C.frame} />
          <Box size={[0.03, 0.012, 0.04]} position={[-0.065, 0.012, 0.25]} color={C.ink} />
        </group>
        <Box size={[0.03, 0.02, 0.03]} position={[0.04, 0.775, 0.15]} color={state.playing ? C.brass : C.frame} />
      </group>

      {/* Sleeve leaning on the wall: the track list, each row playable */}
      <mesh position={[0.3, 0.9, -0.17]} rotation={[-0.16, 0, 0]} onClick={onSleeve} {...pointer}>
        <planeGeometry args={[0.42, 0.42]} />
        <meshBasicMaterial map={sleeveTex} toneMapped={false} />
      </mesh>
      <Box size={[0.43, 0.43, 0.006]} position={[0.3, 0.9, -0.175]} rotation={[-0.16, 0, 0]} color={C.cream} />
      {/* A second record leaning against the cabinet side */}
      <Box size={[0.32, 0.32, 0.008]} position={[0.62, 0.17, 0.05]} rotation={[0, 1.4, 0.12]} color={C.brass} />
    </group>
  );
}
