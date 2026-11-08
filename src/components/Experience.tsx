"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { site } from "@/config/site";
import { CameraRig } from "@/scene/CameraRig";
import { Room } from "@/scene/Room";
import { rig, ROOM, type Beat } from "@/scene/rig";
import { buildWalk, stepsToWindow } from "@/scene/timeline";

/** Diegetic position marker, borrowed in spirit from a depth gauge. */
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
    case "hallway":
      return "the hallway";
  }
}

export default function Experience() {
  const track = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLParagraphElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    rig.reducedMotion = mq.matches;
    if (!track.current) return;

    let last = "";
    const write = (beat: Beat) => {
      const text = wayfinding(beat);
      if (text !== last && counter.current) {
        counter.current.textContent = text;
        last = text;
      }
    };
    write("room");
    const dispose = buildWalk(track.current, (beat) => write(beat));

    // `?at=0.5` opens the walk halfway: handy for review screenshots and links.
    const at = Number(new URLSearchParams(window.location.search).get("at"));
    if (at > 0 && at <= 1) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: max * at, behavior: "instant" });
    }
    return dispose;
  }, []);

  return (
    <>
      <div className="stage" aria-hidden="true" data-ready={ready}>
        <Canvas
          dpr={[1, 1.75]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          camera={{ fov: 55, near: 0.05, far: 60, position: [0, ROOM.eye, ROOM.startZ] }}
          onCreated={() => setReady(true)}
        >
          <color attach="background" args={["#1d2a24"]} />
          <CameraRig />
          <Room />
        </Canvas>
      </div>

      <div className="veil" data-ready={ready} aria-hidden="true">
        <span>{site.name}</span>
      </div>

      <p ref={counter} className="wayfinding" aria-hidden="true" />

      {/* The scroll distance of the walk. Height comes from config. */}
      <div ref={track} className="walk" style={{ height: `${site.scene.scrollScreens * 100}lvh` }} />
    </>
  );
}
