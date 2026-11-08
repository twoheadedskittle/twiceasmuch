import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { rig, ROOM, type Beat } from "./rig";

/**
 * The walk, as one GSAP timeline scrubbed by scroll.
 * Time units are arbitrary; only their proportions matter.
 *
 *   0.0 - 4.5  walk from the doorway end to the window (constant pace)
 *   4.5 - 5.3  stop, lean in, look out
 *   5.3 - 6.6  turn around; the panel wall behind starts to part
 *   6.6 - 10   walk back across the room and into the hallway
 */
const T = { walkEnd: 4.5, windowEnd: 5.3, turnEnd: 6.6, end: 10 } as const;

export const BEAT_AT: Record<Beat, number> = {
  room: 0,
  window: T.walkEnd / T.end,
  turn: T.windowEnd / T.end,
  hallway: T.turnEnd / T.end,
};

function beatFor(progress: number): Beat {
  if (progress < BEAT_AT.window) return "room";
  if (progress < BEAT_AT.turn) return "window";
  if (progress < BEAT_AT.hallway) return "turn";
  return "hallway";
}

export function buildWalk(trigger: HTMLElement, onBeat: (beat: Beat, p: number) => void) {
  gsap.registerPlugin(ScrollTrigger);
  const p = rig.pose;
  const reduce = rig.reducedMotion;

  const tl = gsap.timeline({
    paused: true,
    defaults: { ease: "none" },
  });

  // Walk to the window. Linear: footsteps keep an even pace; scrub smoothing
  // supplies the start and stop.
  tl.to(p, { z: ROOM.windowZ, duration: T.walkEnd }, 0);

  // Arrive: a half step closer and a slight lift of the chin to see the sky.
  tl.to(p, { z: ROOM.windowZ - 0.35, duration: T.windowEnd - T.walkEnd, ease: "power2.out" }, T.walkEnd);
  tl.to(p, { pitch: 0.06, duration: (T.windowEnd - T.walkEnd) * 0.6, ease: "power2.out" }, T.walkEnd);

  // Turn around. Strong in-out: it is a deliberate on-screen move.
  tl.to(p, { yaw: Math.PI, pitch: 0, duration: T.turnEnd - T.windowEnd, ease: "power3.inOut" }, T.windowEnd);
  tl.to(rig, { wallOpen: 1, duration: 1.4, ease: "power2.inOut" }, T.windowEnd + 0.6);

  // Walk back across the room and through the opening.
  tl.to(p, { z: ROOM.frontZ + 6, duration: T.end - T.turnEnd }, T.turnEnd);

  const st = ScrollTrigger.create({
    trigger,
    start: "top top",
    end: "bottom bottom",
    // Reduced motion: no lag behind the scrollbar, nothing drifts on its own.
    scrub: reduce ? true : 1.1,
    animation: tl,
    onUpdate(self) {
      rig.progress = self.progress;
      const beat = beatFor(self.progress);
      if (beat !== rig.beat) rig.beat = beat;
      onBeat(beat, self.progress);
    },
  });

  return () => {
    st.kill();
    tl.kill();
  };
}

/** Steps left to the window from the current pose, for the counter. */
export function stepsToWindow(): number {
  return Math.max(0, Math.ceil((rig.pose.z - ROOM.windowZ) / ROOM.stride));
}
