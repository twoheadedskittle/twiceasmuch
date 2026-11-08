"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import { site } from "@/config/site";
import { C } from "./palette";
import { rig, ROOM } from "./rig";

/**
 * Phase 1 placeholder geometry: blocked-out room, window opening, shelf,
 * record player, the panel wall that opens, and a stub hallway.
 * Proportions are final; materials and detail come in later phases.
 */

const { width: W, height: H, backZ, frontZ, depth: D } = ROOM;
const T = 0.15; // wall thickness

function Box({
  size,
  position,
  color,
  rotation,
}: {
  size: [number, number, number];
  position: [number, number, number];
  color: string;
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

function BackWallWithWindow() {
  const { width: ww, height: wh, sill } = ROOM.window;
  const sideW = (W - ww) / 2;
  const top = sill + wh;
  const z = backZ;
  const cols = 4;
  const rows = 3;
  return (
    <group>
      {/* Wall around the opening */}
      <Box size={[sideW, H, T]} position={[-(ww / 2 + sideW / 2), H / 2, z]} color={C.limewash} />
      <Box size={[sideW, H, T]} position={[ww / 2 + sideW / 2, H / 2, z]} color={C.limewash} />
      <Box size={[ww, sill, T]} position={[0, sill / 2, z]} color={C.limewash} />
      <Box size={[ww, H - top, T]} position={[0, top + (H - top) / 2, z]} color={C.limewash} />

      {/* Frame, sill and glazing bars */}
      <Box size={[ww + 0.16, 0.08, 0.32]} position={[0, sill - 0.02, z + 0.08]} color={C.frame} />
      {Array.from({ length: cols + 1 }, (_, i) => (
        <Box key={`c${i}`} size={[0.05, wh, 0.06]} position={[-ww / 2 + (i * ww) / cols, sill + wh / 2, z]} color={C.frame} />
      ))}
      {Array.from({ length: rows + 1 }, (_, i) => (
        <Box key={`r${i}`} size={[ww, 0.05, 0.06]} position={[0, sill + (i * wh) / rows, z]} color={C.frame} />
      ))}

      {/* Placeholder outdoor backdrop: replaced by original window art in phase 2 */}
      <mesh position={[0, sill + wh / 2, z - 1.4]}>
        <planeGeometry args={[ww * 2.6, wh * 2.4]} />
        <meshBasicMaterial color={C.sky} toneMapped={false} />
      </mesh>
    </group>
  );
}

const SPINES = [C.oxblood, C.mustard, C.sageDeep, C.salmon, C.greenBlack, C.frame];

/** Seeded so the same shelf fills the same way on every load. */
function fillShelves(shelves: number, width: number, shelfH: number) {
  const out: { x: number; y: number; h: number; w: number; color: string }[] = [];
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let s = 0; s < shelves; s++) {
    let x = -width / 2 + 0.08;
    while (x < width / 2 - 0.12) {
      const w = 0.03 + rand() * 0.05;
      const h = 0.24 + rand() * 0.1;
      out.push({ x: x + w / 2, y: 0.15 + s * shelfH + h / 2, h, w, color: SPINES[Math.floor(rand() * SPINES.length)] });
      x += w + 0.004;
      if (rand() > 0.93) x += 0.12; // a gap where a book is out
    }
  }
  return out;
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
    <group position={[-W / 2 + depth / 2 + T / 2, 0, ROOM.windowZ - 0.4]} rotation={[0, Math.PI / 2, 0]}>
      <Box size={[width, height, 0.04]} position={[0, height / 2, -depth / 2]} color={C.oakDark} />
      <Box size={[0.05, height, depth]} position={[-width / 2, height / 2, 0]} color={C.oak} />
      <Box size={[0.05, height, depth]} position={[width / 2, height / 2, 0]} color={C.oak} />
      {Array.from({ length: shelves + 1 }, (_, i) => (
        <Box key={i} size={[width, 0.04, depth]} position={[0, 0.13 + i * shelfH, 0]} color={C.oak} />
      ))}
      {books.map((b, i) => (
        <Box key={i} size={[b.w, b.h, depth * 0.8]} position={[b.x, b.y, 0]} color={b.color} />
      ))}
    </group>
  );
}

function RecordPlayer() {
  const platter = useRef<Group>(null);
  return (
    // Against the right wall near the window, facing -X (toward the shelf).
    <group position={[W / 2 - 0.3 - T / 2, 0, ROOM.windowZ - 0.4]} rotation={[0, -Math.PI / 2, 0]}>
      {/* Low cabinet */}
      <Box size={[1.1, 0.68, 0.5]} position={[0, 0.34, 0]} color={C.sageDeep} />
      {/* Plinth */}
      <Box size={[0.52, 0.09, 0.4]} position={[-0.18, 0.725, 0]} color={C.oak} />
      <group ref={platter} position={[-0.22, 0.78, 0]}>
        <mesh>
          <cylinderGeometry args={[0.15, 0.15, 0.015, 48]} />
          <meshStandardMaterial color={C.ink} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.009, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.002, 32]} />
          <meshStandardMaterial color={C.mustard} />
        </mesh>
      </group>
      {/* Tonearm placeholder */}
      <Box size={[0.02, 0.02, 0.24]} position={[0.0, 0.8, 0.04]} rotation={[0, 0.35, 0]} color={C.brass} />
      {/* Sleeve leaning beside it */}
      <Box size={[0.32, 0.32, 0.01]} position={[0.32, 0.86, -0.12]} rotation={[-0.18, 0, 0]} color={C.salmon} />
    </group>
  );
}

/** The wall behind the visitor: two panels that part to reveal the hallway. */
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
      <group ref={left} position={[-dw / 4, 0, z - 0.02]}>
        <Box size={[dw / 2, dh, T * 0.6]} position={[0, dh / 2, 0]} color={C.greenBlack} />
        <Box size={[dw / 2 - 0.18, dh - 0.3, 0.02]} position={[0, dh / 2, -T * 0.32]} color={C.sageDeep} />
      </group>
      <group ref={right} position={[dw / 4, 0, z - 0.02]}>
        <Box size={[dw / 2, dh, T * 0.6]} position={[0, dh / 2, 0]} color={C.greenBlack} />
        <Box size={[dw / 2 - 0.18, dh - 0.3, 0.02]} position={[0, dh / 2, -T * 0.32]} color={C.sageDeep} />
      </group>
      {/* Brass frame around the opening */}
      <Box size={[0.06, dh, 0.2]} position={[-dw / 2, dh / 2, z - 0.05]} color={C.brass} />
      <Box size={[0.06, dh, 0.2]} position={[dw / 2, dh / 2, z - 0.05]} color={C.brass} />
      <Box size={[dw + 0.06, 0.06, 0.2]} position={[0, dh, z - 0.05]} color={C.brass} />
    </group>
  );
}

/** Stub hallway beyond the panel wall. Phase 3 makes it endless. */
function HallwayStub() {
  const { width: dw, height: dh } = ROOM.doorway;
  const len = 20;
  const z0 = frontZ + len / 2;
  return (
    <group>
      <Box size={[dw, 0.02, len]} position={[0, -0.01, z0]} color={C.hallFloorA} />
      <Box size={[dw, 0.02, len]} position={[0, dh + 0.2, z0]} color={C.hallFog} />
      <Box size={[0.1, dh + 0.2, len]} position={[-dw / 2 - 0.05, (dh + 0.2) / 2, z0]} color={C.hallPlaster} />
      <Box size={[0.1, dh + 0.2, len]} position={[dw / 2 + 0.05, (dh + 0.2) / 2, z0]} color={C.hallPlaster} />
      {[3, 8, 13].map((d) => (
        <pointLight key={d} position={[0, dh - 0.1, frontZ + d]} color="#c9d6e0" intensity={1.6} distance={5} decay={2} />
      ))}
    </group>
  );
}

export function Room() {
  return (
    <group>
      {/* Floor, rug, ceiling, side walls */}
      <Box size={[W, 0.02, D]} position={[0, -0.01, 0]} color={C.oak} />
      <Box size={[2.6, 0.012, 3.6]} position={[0, 0.006, -1.2]} color={C.oxblood} />
      <Box size={[W, 0.02, D]} position={[0, H, 0]} color={C.limewashLight} />
      <Box size={[T, H, D]} position={[-W / 2, H / 2, 0]} color={C.sage} />
      <Box size={[T, H, D]} position={[W / 2, H / 2, 0]} color={C.sage} />
      {/* Dado rail on the side walls */}
      <Box size={[0.04, 0.06, D]} position={[-W / 2 + 0.09, 0.95, 0]} color={C.frame} />
      <Box size={[0.04, 0.06, D]} position={[W / 2 - 0.09, 0.95, 0]} color={C.frame} />

      <BackWallWithWindow />
      <Bookshelf />
      <RecordPlayer />
      <PanelWall />
      <HallwayStub />

      {/* Lighting placeholder: daylight from the window, one warm lamp. Baked in phase 4. */}
      <hemisphereLight args={["#f3e6cf", "#3a2a1c", 0.9]} />
      <ambientLight intensity={0.35} color="#f1dcc0" />
      <directionalLight position={[0, 2.6, backZ - 3]} intensity={1.6} color="#eef3f2" />
      <pointLight position={[0, H - 0.3, 1.5]} intensity={6} distance={9} decay={2} color="#ffc98a" />
    </group>
  );
}
