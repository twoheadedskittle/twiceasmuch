import { ROOM } from "./rig";

/** Hallway dimensions, shared by the hallway scene and the frame focus. */
export const HALL = {
  start: ROOM.frontZ + 0.08,
  segment: 3,
  slots: 9,
  width: ROOM.doorway.width,
  height: 2.8,
} as const;
