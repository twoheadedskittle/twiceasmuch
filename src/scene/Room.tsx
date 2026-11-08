"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  DoubleSide,
  MathUtils,
  Object3D,
  type AmbientLight,
  type Group,
  type HemisphereLight,
  type MeshBasicMaterial,
  type PointLight,
  type SpotLight,
} from "three";
import { Bookshelf, RecordPlayer } from "./Furniture";
import { C } from "./palette";
import { Box } from "./parts";
import { seeded } from "./random";
import { rig, ROOM, uiStore } from "./rig";
import { floorboards, glow, lightSpill, limewash, rain, runner, sagePaint, windowView } from "./textures";
import { toonRamp } from "./toon";

const { width: W, height: H, backZ, frontZ, depth: D } = ROOM;
const T = 0.15; // wall thickness
const DADO = 0.95;

function Toon({ color, side }: { color: string; side?: typeof DoubleSide }) {
  return <meshToonMaterial color={color} gradientMap={toonRamp()} side={side} />;
}

/* ---------- Shell: floor, ceiling, panelled side walls ---------- */

function Shell() {
  const boards = useMemo(() => {
    const t = floorboards();
    t.repeat.set(W, D);
    return t;
  }, []);
  const rug = useMemo(() => runner(), []);
  const plaster = useMemo(() => limewash("#ddb67c"), []);
  const sage = useMemo(() => sagePaint(), []);

  // Panel mouldings below the dado rail, every 1.15 m along each side wall.
  const panels = useMemo(() => {
    const n = Math.floor(D / 1.15);
    const pw = D / n;
    return Array.from({ length: n }, (_, i) => -D / 2 + pw * (i + 0.5)).map((z) => ({ z, w: pw - 0.22 }));
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[W, D]} />
        <meshToonMaterial map={boards} gradientMap={toonRamp()} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, -0.3]}>
        <planeGeometry args={[1.7, 4.6]} />
        <meshToonMaterial map={rug} gradientMap={toonRamp()} />
      </mesh>
      <Box size={[W, 0.02, D]} position={[0, H, 0]} color="#ffffff" map={plaster} tile={2} />
      {/* Cornice */}
      {[-1, 1].map((s) => (
        <Box key={`k${s}`} size={[0.08, 0.1, D]} position={[s * (W / 2 - 0.04), H - 0.05, 0]} color={C.frame} />
      ))}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box size={[T, H, D]} position={[s * (W / 2), H / 2, 0]} color="#ffffff" map={sage} tile={1.6} />
          <Box size={[0.04, 0.06, D]} position={[s * (W / 2 - 0.09), DADO, 0]} color={C.frame} />
          <Box size={[0.03, 0.12, D]} position={[s * (W / 2 - 0.09), 0.06, 0]} color={C.greenBlack} />
          {panels.map((p, i) => (
            <group key={i} position={[s * (W / 2 - 0.085), 0, p.z]}>
              <Box size={[0.025, 0.03, p.w]} position={[0, DADO - 0.14, 0]} color={C.sageDeep} />
              <Box size={[0.025, 0.03, p.w]} position={[0, 0.26, 0]} color={C.sageDeep} />
              <Box size={[0.025, DADO - 0.43, 0.03]} position={[0, (DADO + 0.12) / 2, -p.w / 2]} color={C.sageDeep} />
              <Box size={[0.025, DADO - 0.43, 0.03]} position={[0, (DADO + 0.12) / 2, p.w / 2]} color={C.sageDeep} />
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ---------- Window wall ---------- */

function WindowWall() {
  const { width: ww, height: wh, sill } = ROOM.window;
  const sideW = (W - ww) / 2;
  const top = sill + wh;
  const z = backZ;
  const cols = 4;
  const rows = 3;
  const view = useMemo(() => windowView(), []);
  const plaster = useMemo(() => limewash(), []);
  const drops = useMemo(() => {
    const t = rain();
    t.repeat.set(3, 1.6);
    return t;
  }, []);
  const spill = useMemo(() => lightSpill(cols, rows), []);
  const rainMat = useRef<MeshBasicMaterial>(null);

  useFrame((_, dt) => {
    if (rainMat.current) rainMat.current.visible = rig.beat !== "hallway";
    if (rig.reducedMotion) return;
    drops.offset.y += dt * 0.9;
    drops.offset.x += dt * 0.08;
  });

  return (
    <group>
      <Box size={[sideW, H, T]} position={[-(ww / 2 + sideW / 2), H / 2, z]} color="#ffffff" map={plaster} tile={1.4} />
      <Box size={[sideW, H, T]} position={[ww / 2 + sideW / 2, H / 2, z]} color="#ffffff" map={plaster} tile={1.4} />
      <Box size={[ww, sill, T]} position={[0, sill / 2, z]} color="#ffffff" map={plaster} tile={1.4} />
      <Box size={[ww, H - top, T]} position={[0, top + (H - top) / 2, z]} color="#ffffff" map={plaster} tile={1.4} />

      {/* Deep reveal, a wide sill to sit things on, glazing bars */}
      <Box size={[ww + 0.2, 0.06, 0.4]} position={[0, sill - 0.02, z + 0.12]} color={C.frame} />
      <Box size={[0.09, wh, 0.24]} position={[-ww / 2 - 0.045, sill + wh / 2, z + 0.03]} color={C.frame} />
      <Box size={[0.09, wh, 0.24]} position={[ww / 2 + 0.045, sill + wh / 2, z + 0.03]} color={C.frame} />
      <Box size={[ww + 0.18, 0.09, 0.24]} position={[0, top + 0.045, z + 0.03]} color={C.frame} />
      {Array.from({ length: cols - 1 }, (_, i) => (
        <Box key={`c${i}`} size={[0.045, wh, 0.05]} position={[-ww / 2 + ((i + 1) * ww) / cols, sill + wh / 2, z]} color={C.frame} />
      ))}
      {Array.from({ length: rows - 1 }, (_, i) => (
        <Box key={`r${i}`} size={[ww, 0.045, 0.05]} position={[0, sill + ((i + 1) * wh) / rows, z]} color={C.frame} />
      ))}

      {/* Original rainy-garden view, then rain falling in front of it */}
      <mesh position={[0, sill + wh / 2 + 0.1, z - 1.6]}>
        <planeGeometry args={[ww * 2.3, ww * 2.3 * (1024 / 1536)]} />
        <meshBasicMaterial map={view} toneMapped={false} fog={false} />
      </mesh>
      <mesh position={[0, sill + wh / 2, z - 0.5]}>
        <planeGeometry args={[ww * 1.6, wh * 1.6]} />
        <meshBasicMaterial ref={rainMat} map={drops} transparent opacity={0.35} depthWrite={false} toneMapped={false} fog={false} />
      </mesh>

      {/* Daylight spilling onto the floor, panes and bars */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.013, z + 1.8]}>
        <planeGeometry args={[ww * 1.15, 3.2]} />
        <meshBasicMaterial map={spill} transparent opacity={0.3} blending={AdditiveBlending} depthWrite={false} />
      </mesh>

      <SillObjects y={sill + 0.01} z={z + 0.15} />
    </group>
  );
}

/** Things on the sill: a fig in a pot, a mug, a short stack, a candle. */
function SillObjects({ y, z }: { y: number; z: number }) {
  return (
    <group position={[0, y, z]}>
      <group position={[-1.05, 0, 0]}>
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.09, 0.07, 0.16, 18]} />
          <Toon color="#3d5a6b" />
        </mesh>
        {[[0, 0.3, 0, 0.1], [-0.08, 0.38, 0.02, 0.075], [0.07, 0.42, -0.01, 0.07], [0.01, 0.5, 0.01, 0.06]].map(([x, yy, zz, r], i) => (
          <mesh key={i} position={[x, yy, zz]} scale={[1, 0.7, 1]}>
            <sphereGeometry args={[r, 12, 8]} />
            <Toon color={i % 2 ? C.sageDeep : "#5d7a4e"} />
          </mesh>
        ))}
        <Box size={[0.012, 0.22, 0.012]} position={[0, 0.25, 0]} color={C.oakDark} />
      </group>
      <mesh position={[-0.55, 0.05, 0.02]}>
        <cylinderGeometry args={[0.04, 0.04, 0.1, 16]} />
        <Toon color="#3d5a6b" />
      </mesh>
      <Box size={[0.26, 0.04, 0.18]} position={[0.75, 0.02, 0]} rotation={[0, 0.1, 0]} color={C.mustard} />
      <Box size={[0.24, 0.035, 0.17]} position={[0.76, 0.058, 0]} rotation={[0, -0.05, 0]} color={C.sage} />
      <mesh position={[1.1, 0.06, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.12, 12]} />
        <Toon color={C.frame} />
      </mesh>
    </group>
  );
}

/* ---------- Reading corner: armchair, floor lamp, side table ---------- */

function ReadingCorner() {
  const velvet = C.salmon;
  return (
    <group position={[-2.05, 0, -0.55]} rotation={[0, -0.9, 0]}>
      {/* Armchair: low, rounded, velvet, on brass legs */}
      <group>
        <Box size={[0.78, 0.18, 0.72]} position={[0, 0.36, 0]} color={velvet} />
        <mesh position={[0, 0.48, 0.02]} scale={[1, 0.45, 0.95]}>
          <sphereGeometry args={[0.38, 20, 12]} />
          <Toon color={velvet} />
        </mesh>
        <Box size={[0.8, 0.62, 0.16]} position={[0, 0.74, 0.3]} rotation={[-0.2, 0, 0]} color={velvet} />
        <mesh position={[0, 1.06, 0.36]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.09, 0.62, 4, 12]} />
          <Toon color={velvet} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.4, 0.52, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <capsuleGeometry args={[0.07, 0.5, 4, 10]} />
            <Toon color={velvet} />
          </mesh>
        ))}
        {[[-0.32, -0.28], [0.32, -0.28], [-0.32, 0.28], [0.32, 0.28]].map(([x, z], i) => (
          <Box key={i} size={[0.03, 0.27, 0.03]} position={[x, 0.135, z]} color={C.brass} />
        ))}
        {/* A cushion and a folded throw */}
        <Box size={[0.36, 0.26, 0.1]} position={[0.12, 0.62, 0.12]} rotation={[-0.3, 0.2, 0.1]} color={C.mustard} />
        <Box size={[0.5, 0.05, 0.3]} position={[-0.1, 0.48, -0.12]} rotation={[0, 0.1, 0]} color={C.sageDeep} />
      </group>

      {/* Floor lamp behind the chair's shoulder */}
      <group position={[-0.62, 0, 0.42]}>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.16, 0.18, 0.04, 20]} />
          <Toon color={C.ink} />
        </mesh>
        <Box size={[0.025, 1.45, 0.025]} position={[0, 0.74, 0]} color={C.brass} />
        <mesh position={[0, 1.52, 0]}>
          <cylinderGeometry args={[0.14, 0.22, 0.26, 24, 1, true]} />
          <Toon color={C.frame} side={DoubleSide} />
        </mesh>
        <mesh position={[0, 1.44, 0]}>
          <sphereGeometry args={[0.05, 12, 8]} />
          <meshBasicMaterial color="#fff2d2" toneMapped={false} />
        </mesh>
        <pointLight position={[0, 1.35, 0]} intensity={2.4} distance={3.2} decay={1.8} color="#ffcf8f" />
      </group>

      {/* Round side table with a book, a mug, a pair of glasses' worth of clutter */}
      <group position={[0.68, 0, -0.18]}>
        <mesh position={[0, 0.52, 0]}>
          <cylinderGeometry args={[0.24, 0.24, 0.04, 28]} />
          <Toon color={C.oak} />
        </mesh>
        <Box size={[0.04, 0.5, 0.04]} position={[0, 0.25, 0]} color={C.oakDark} />
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.16, 0.18, 0.03, 20]} />
          <Toon color={C.oakDark} />
        </mesh>
        <Box size={[0.22, 0.04, 0.16]} position={[-0.04, 0.56, 0.02]} rotation={[0, 0.4, 0]} color={C.oxblood} />
        <Box size={[0.2, 0.035, 0.15]} position={[-0.03, 0.595, 0.02]} rotation={[0, 0.2, 0]} color="#3d5a6b" />
        <mesh position={[0.12, 0.585, -0.08]}>
          <cylinderGeometry args={[0.04, 0.04, 0.09, 16]} />
          <Toon color={C.frame} />
        </mesh>
      </group>
    </group>
  );
}

/** A tall fig by the right wall, nearer the door. */
function Fig() {
  const leaves = useMemo(() => {
    const r = seeded(3);
    return Array.from({ length: 16 }, () => ({
      p: [(r() - 0.5) * 0.6, 0.9 + r() * 0.9, (r() - 0.5) * 0.6] as [number, number, number],
      s: 0.1 + r() * 0.08,
    }));
  }, []);
  return (
    <group position={[W / 2 - 0.55, 0, 1.6]}>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.24, 0.18, 0.44, 22]} />
        <Toon color={C.oxblood} />
      </mesh>
      <Box size={[0.04, 1.3, 0.04]} position={[0, 1.0, 0]} rotation={[0, 0, 0.05]} color={C.oakDark} />
      {leaves.map((l, i) => (
        <mesh key={i} position={l.p} scale={[1, 0.55, 1]}>
          <sphereGeometry args={[l.s, 10, 8]} />
          <Toon color={i % 3 ? "#5d7a4e" : C.sageDeep} />
        </mesh>
      ))}
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
          <Box size={[dw / 2, dh, T * 0.6]} position={[0, dh / 2, 0]} color={C.greenBlack} />
          <Box size={[dw / 2 - 0.18, dh * 0.42, 0.02]} position={[0, dh * 0.72, -T * 0.32]} color={C.sageDeep} />
          <Box size={[dw / 2 - 0.18, dh * 0.42, 0.02]} position={[0, dh * 0.26, -T * 0.32]} color={C.sageDeep} />
        </group>
      ))}
      {/* Brass frame around the opening */}
      <Box size={[0.06, dh, 0.2]} position={[-dw / 2, dh / 2, z - 0.05]} color={C.brass} />
      <Box size={[0.06, dh, 0.2]} position={[dw / 2, dh / 2, z - 0.05]} color={C.brass} />
      <Box size={[dw + 0.06, 0.06, 0.2]} position={[0, dh, z - 0.05]} color={C.brass} />
    </group>
  );
}

/* ---------- Lights ---------- */

/** Pools of light that answer the visitor when they choose a side. */
function ChoiceLights() {
  const shelf = useRef<PointLight>(null);
  const player = useRef<PointLight>(null);
  useFrame((_, dt) => {
    const { hover, focus } = uiStore.get();
    const k = rig.reducedMotion ? 30 : 6;
    // Until the visitor comes near, both sides sit back in shadow.
    const near = MathUtils.smoothstep(rig.pose.z, ROOM.approachZ + 1.5, ROOM.approachZ - 1);
    if (shelf.current) {
      const on = hover === "shelf" || focus === "shelf";
      shelf.current.intensity = MathUtils.damp(shelf.current.intensity, on ? 3.4 : near * 1.1, k, dt);
    }
    if (player.current) {
      const on = hover === "player" || focus === "player";
      player.current.intensity = MathUtils.damp(player.current.intensity, on ? 3.4 : near * 1.1, k, dt);
    }
  });
  return (
    <>
      <pointLight ref={shelf} position={[-W / 2 + 1.2, 2.3, ROOM.furnitureZ]} intensity={0} distance={3.4} decay={1.6} color="#ffd59a" />
      <pointLight ref={player} position={[W / 2 - 1.0, 1.9, ROOM.furnitureZ]} intensity={0} distance={2.8} decay={1.6} color="#ffd59a" />
    </>
  );
}

/**
 * Daylight through the window is the key light; the pendant and the
 * reading lamp are warm fills. All of it fades as the visitor crosses into
 * the hallway (rig.cold), which is lit only by its own failing lamps.
 */
function RoomLights() {
  const hemi = useRef<HemisphereLight>(null);
  const amb = useRef<AmbientLight>(null);
  const sun = useRef<SpotLight>(null);
  const lamp = useRef<PointLight>(null);
  const halo = useMemo(() => glow(), []);
  // The spot aims at a target that must live in the scene to be tracked.
  const target = useMemo(() => {
    const o = new Object3D();
    o.position.set(0, 0.2, 0.5);
    return o;
  }, []);
  useFrame(() => {
    const w = 1 - rig.cold;
    if (hemi.current) hemi.current.intensity = 0.65 * w + 0.05;
    if (amb.current) amb.current.intensity = 0.18 * w + 0.02;
    if (sun.current) sun.current.intensity = 34 * w;
    if (lamp.current) lamp.current.intensity = 4.6 * w;
  });
  return (
    <>
      <primitive object={target} />
      <hemisphereLight ref={hemi} args={["#f3e6cf", "#3a2a1c", 0.55]} />
      <ambientLight ref={amb} intensity={0.18} color="#f1dcc0" />
      <spotLight
        ref={sun}
        position={[0, 2.4, backZ - 1.2]}
        target={target}
        angle={0.95}
        penumbra={0.7}
        distance={9.5}
        decay={1.4}
        intensity={34}
        color="#f4f7f3"
      />
      <pointLight ref={lamp} position={[0, H - 0.85, 1.4]} intensity={3.2} distance={7} decay={2} color="#ffc98a" />
      {/* Pendant: cord, small mustard cloth shade, bulb, soft halo */}
      <group position={[0, H, 1.4]}>
        <Box size={[0.012, 0.55, 0.012]} position={[0, -0.27, 0]} color={C.ink} />
        <mesh position={[0, -0.64, 0]}>
          <cylinderGeometry args={[0.07, 0.17, 0.18, 24, 1, true]} />
          <Toon color={C.mustard} side={DoubleSide} />
        </mesh>
        <mesh position={[0, -0.7, 0]}>
          <sphereGeometry args={[0.045, 12, 8]} />
          <meshBasicMaterial color="#fff1d0" toneMapped={false} />
        </mesh>
        <sprite position={[0, -0.74, 0]} scale={[0.7, 0.7, 1]}>
          <spriteMaterial map={halo} color="#ffcf8f" transparent opacity={0.35} blending={AdditiveBlending} depthWrite={false} />
        </sprite>
      </group>
    </>
  );
}

export function Room() {
  return (
    <group>
      <Shell />
      <WindowWall />
      <Bookshelf />
      <RecordPlayer />
      <ReadingCorner />
      <Fig />
      <PanelWall />
      <ChoiceLights />
      <RoomLights />
    </group>
  );
}
