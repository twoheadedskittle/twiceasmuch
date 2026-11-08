"use client";

import { useMemo, type ReactNode } from "react";
import type { Texture } from "three";
import { toonRamp } from "./toon";

type BoxProps = {
  size: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  /** A painted texture; tiled at `tile` metres per repeat across the box's two largest sides. */
  map?: Texture;
  tile?: number;
  children?: ReactNode;
};

/**
 * The scene's basic block: cel-shaded with an optional painted texture.
 * Ink lines and hatching come from the screen pass (Ink.tsx), not per mesh.
 */
export function Box({ size, position, rotation, color, map, tile = 1, children }: BoxProps) {
  const tiled = useMemo(() => {
    if (!map) return undefined;
    const t = map.clone();
    const dims = [...size].sort((a, b) => b - a);
    t.repeat.set(dims[0] / tile, dims[1] / tile);
    t.needsUpdate = true;
    return t;
  }, [map, size, tile]);

  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshToonMaterial color={color} map={tiled} gradientMap={toonRamp()} />
      {children}
    </mesh>
  );
}
