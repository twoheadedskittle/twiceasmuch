"use client";

import { Outlines } from "@react-three/drei";
import type { ReactNode } from "react";
import { C } from "./palette";
import { toonRamp } from "./toon";

/** Ink line weight in metres for outlined objects. */
export const INK = 0.012;

type BoxProps = {
  size: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  /** Draw a soft ink outline around it (inverted hull). */
  inked?: boolean;
  children?: ReactNode;
};

/** The scene's basic block: cel-shaded, optionally inked. */
export function Box({ size, position, rotation, color, inked, children }: BoxProps) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshToonMaterial color={color} gradientMap={toonRamp()} />
      {inked && <Outlines thickness={INK} color={C.ink} />}
      {children}
    </mesh>
  );
}
