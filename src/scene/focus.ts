import { gsap } from "gsap";
import { site } from "@/config/site";
import { HALL } from "./hallLayout";
import { FOCUS_POSES, rig, uiStore, type Pose } from "./rig";
import { hudRefs, pointer } from "./UiSync";

/**
 * Walking to something and back. The scroll pose keeps running underneath;
 * focusMix blends the camera from it to the object's pose. Tweens are
 * interruptible: stepping back mid-walk reverses from wherever you are.
 */

let tween: gsap.core.Tween | null = null;

function onCut() {
  // Reduced motion: cut instead of travel, with a brief dip to hide the jump.
  const stage = document.querySelector<HTMLElement>(".stage");
  stage?.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
}

function walkTo(pose: Pose) {
  Object.assign(rig.focusPose, pose);
  tween?.kill();
  if (rig.reducedMotion) {
    rig.focusMix = 1;
    onCut();
    return;
  }
  tween = gsap.to(rig, { focusMix: 1, duration: 1.35, ease: "power2.inOut" });
}

export function focusOn(target: "shelf" | "player") {
  uiStore.set({ focus: target, hover: null, frame: null });
  walkTo(FOCUS_POSES[target]);
}

/** Step up to the frame hanging in hallway segment k and face it. */
export function viewFrame(k: number) {
  cancelDwell();
  const side = k % 2 ? 1 : -1;
  const frameX = side * (HALL.width / 2 - 0.035);
  uiStore.set({ focus: "frame", frame: k, hover: null });
  walkTo({
    x: frameX - side * 1.45,
    y: 1.55,
    z: HALL.start + k * HALL.segment + HALL.segment / 2,
    // Turn the short way from facing down the hallway (yaw PI).
    yaw: side < 0 ? Math.PI / 2 : (3 * Math.PI) / 2,
    pitch: 0,
  });
}

export function release() {
  cancelDwell();
  if (!uiStore.get().focus) return;
  uiStore.set({ focus: null, frame: null });
  tween?.kill();
  if (rig.reducedMotion) {
    rig.focusMix = 0;
    onCut();
    return;
  }
  // Stepping back is faster than walking over: the system is responding.
  tween = gsap.to(rig, { focusMix: 0, duration: 0.8, ease: "power2.out" });
}

/* ---------- Dwell: rest the pointer on a frame to step up to it ---------- */

let dwellTimer = 0;
let dwellFrame: number | null = null;

export function startDwell(k: number) {
  if (uiStore.get().focus || dwellFrame === k) return;
  cancelDwell();
  dwellFrame = k;
  const ms = site.scene.frameDwellSeconds * 1000;
  const ring = hudRefs.dwell;
  if (ring && pointer.fine) {
    ring.style.setProperty("--dwell", `${ms}ms`);
    ring.style.translate = `${pointer.cx}px ${pointer.cy}px`;
    ring.dataset.on = "true";
  }
  dwellTimer = window.setTimeout(() => viewFrame(k), ms);
}

export function moveDwell() {
  const ring = hudRefs.dwell;
  if (ring && dwellFrame !== null) ring.style.translate = `${pointer.cx}px ${pointer.cy}px`;
}

export function cancelDwell() {
  window.clearTimeout(dwellTimer);
  dwellFrame = null;
  if (hudRefs.dwell) hudRefs.dwell.dataset.on = "false";
}
