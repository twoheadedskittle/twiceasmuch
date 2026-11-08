"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { site } from "@/config/site";
import { CameraRig } from "@/scene/CameraRig";
import { focusOn, release } from "@/scene/focus";
import { Hallway } from "@/scene/Hallway";
import { Hands } from "@/scene/Hands";
import { nav } from "@/scene/nav";
import { Room } from "@/scene/Room";
import { rig, ROOM, uiStore } from "@/scene/rig";
import { buildWalk } from "@/scene/timeline";
import { pointer, UiSync } from "@/scene/UiSync";
import { Hud } from "./Hud";

export default function Experience() {
  const router = useRouter();
  const walk = useRef<HTMLDivElement>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [ready, setReady] = useState(false);
  const [hallScreens, setHallScreens] = useState(8);
  // Sharp on capable machines; drops resolution if frames start to slip.
  const [dpr, setDpr] = useState(1.75);

  // Scene text (labels, sleeve) is painted with the page's face: wait for it.
  useEffect(() => {
    let live = true;
    void document.fonts.ready.then(() => live && setFontsReady(true));
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    nav.go = (href) => router.push(href);
  }, [router]);

  // The room walk: one scrubbed timeline over the first track.
  useEffect(() => {
    rig.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    pointer.fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!walk.current) return;
    const dispose = buildWalk(walk.current, () => {});

    // `?at=0.5` opens the walk partway: handy for review and for links.
    const at = Number(new URLSearchParams(window.location.search).get("at"));
    if (at > 0 && at <= 1) {
      const max = walk.current.offsetHeight - window.innerHeight;
      window.scrollTo({ top: max * at, behavior: "instant" });
    }
    return dispose;
  }, []);

  // The hallway: every screen of scroll past the room is metres walked.
  // The track grows as you near its end, so it never runs out.
  useEffect(() => {
    const onScroll = () => {
      const el = walk.current;
      if (!el) return;
      const start = el.offsetTop + el.offsetHeight - window.innerHeight;
      const past = Math.max(0, window.scrollY - start);
      rig.hallTarget = (past / window.innerHeight) * site.scene.hallMetersPerScreen;
      const room = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
      if (room < window.innerHeight * 3) setHallScreens((n) => n + 6);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Pointer and keys: hover a side to light it, click to walk over,
  // Escape or any scroll to step back.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") pointer.x = e.clientX / window.innerWidth;
    };
    const onClick = (e: MouseEvent) => {
      if (!(e.target instanceof HTMLCanvasElement)) return;
      const { hover, choosing } = uiStore.get();
      if (choosing && hover) focusOn(hover);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") release();
    };
    const onWheel = () => {
      if (uiStore.get().focus) release();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchmove", onWheel, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onWheel);
    };
  }, []);

  return (
    <>
      <div className="stage" aria-hidden="true" data-ready={ready}>
        {fontsReady && (
          <Canvas
            dpr={[1, dpr]}
            gl={{ antialias: true, powerPreference: "high-performance" }}
            camera={{ fov: 55, near: 0.05, far: 40, position: [0, ROOM.eye, ROOM.startZ] }}
            onCreated={() => requestAnimationFrame(() => setReady(true))}
            onPointerMissed={() => uiStore.get().focus && release()}
          >
            <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.75)} flipflops={3} onFallback={() => setDpr(1)} />
            <CameraRig />
            <Hands />
            <UiSync />
            <Room />
            <Hallway />
          </Canvas>
        )}
      </div>

      <div className="veil" data-ready={ready} aria-hidden="true">
        <span>{site.name}</span>
      </div>

      <Hud />

      {/* Scroll distance: the room walk, then the hallway, which keeps growing. */}
      <div ref={walk} className="walk" style={{ height: `${site.scene.scrollScreens * 100}lvh` }} />
      <div className="walk" style={{ height: `${hallScreens * 100}lvh` }} />
    </>
  );
}
