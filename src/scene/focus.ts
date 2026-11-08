import { gsap } from "gsap";
import { FOCUS_POSES, rig, uiStore, type Target } from "./rig";

/**
 * Walking to an object and back. The scroll pose keeps running underneath;
 * focusMix blends the camera from it to the object's pose. Tweens are
 * interruptible: stepping back mid-walk reverses from wherever you are.
 */

let tween: gsap.core.Tween | null = null;

function onCut() {
  // Reduced motion: cut instead of travel, with a brief dip to hide the jump.
  const stage = document.querySelector<HTMLElement>(".stage");
  stage?.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
}

export function focusOn(target: Target) {
  Object.assign(rig.focusPose, FOCUS_POSES[target]);
  uiStore.set({ focus: target, hover: null });
  tween?.kill();
  if (rig.reducedMotion) {
    rig.focusMix = 1;
    onCut();
    return;
  }
  tween = gsap.to(rig, { focusMix: 1, duration: 1.35, ease: "power2.inOut" });
}

export function release() {
  if (!uiStore.get().focus) return;
  uiStore.set({ focus: null });
  tween?.kill();
  if (rig.reducedMotion) {
    rig.focusMix = 0;
    onCut();
    return;
  }
  // Stepping back is faster than walking over: the system is responding.
  tween = gsap.to(rig, { focusMix: 0, duration: 0.8, ease: "power2.out" });
}
