"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { rig, ROOM, uiStore, type Beat } from "./rig";
import { stepsToWindow } from "./timeline";

/** Last pointer position as a 0..1 fraction of the viewport width. */
export const pointer = { x: 0.5, cx: 0, cy: 0, fine: false };

/** The bottom-right line; set by Experience. */
export const hudRefs: { wayfinding: HTMLElement | null; dwell: HTMLElement | null } = { wayfinding: null, dwell: null };

function wayfinding(beat: Beat): string {
  switch (beat) {
    case "room": {
      const n = stepsToWindow();
      return n === 1 ? "1 step to the window" : `${n} steps to the window`;
    }
    case "window":
      return "at the window";
    case "turn":
      return "something behind you";
    case "hallway": {
      const m = Math.round(rig.hallMeters);
      return m < 2 ? "the hallway" : `the hallway, ${m} m in`;
    }
  }
}

/**
 * Once per frame, derive the low-frequency UI state from the rig: whether
 * the shelf and record player can be chosen, which side is hovered, and
 * the wayfinding line. Writes only when something changed.
 */
export function UiSync() {
  const last = useRef("");
  useFrame(() => {
    const { focus } = uiStore.get();
    const z = rig.pose.z;
    const choosing =
      !focus && (rig.beat === "room" || rig.beat === "window") && z < ROOM.approachZ;
    const hover = choosing && pointer.fine ? (pointer.x < 0.36 ? "shelf" : pointer.x > 0.64 ? "player" : null) : null;
    uiStore.set({ beat: rig.beat, choosing, hover });

    const text = focus ? "" : wayfinding(rig.beat);
    if (text !== last.current && hudRefs.wayfinding) {
      hudRefs.wayfinding.textContent = text;
      last.current = text;
    }
  });
  return null;
}
