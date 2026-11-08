"use client";

import { useSyncExternalStore } from "react";
import { getState, play, subscribe, toggle } from "@/audio/player";
import { site, type Artwork } from "@/config/site";
import { focusOn, release } from "@/scene/focus";
import { uiStore } from "@/scene/rig";
import { hudRefs } from "@/scene/UiSync";
import { ArrowLeft, ArrowRight, Pause, Play, StepBack } from "./Icons";

/** The artwork hung in hallway segment k (frames cycle through the config list). */
function artworkAt(k: number): Artwork | null {
  const list = site.artwork;
  return list.length ? list[k % list.length] : null;
}

/**
 * Everything the visitor can press outside the 3D scene. These are the
 * keyboard and touch paths to the same choices the room offers by hover.
 */
export function Hud() {
  const ui = useSyncExternalStore(uiStore.subscribe, uiStore.get, uiStore.get);
  const audio = useSyncExternalStore(subscribe, getState, getState);
  const showMini = audio.playing && ui.focus !== "player";

  return (
    <>
      {/* Choosing: one button each side, matching where the object stands. */}
      <div className="choices" data-on={ui.choosing}>
        <button
          type="button"
          className="choice choice-left"
          data-hot={ui.hover === "shelf"}
          tabIndex={ui.choosing ? 0 : -1}
          onClick={() => focusOn("shelf")}
        >
          <ArrowLeft />
          <span>Bookshelf</span>
        </button>
        <button
          type="button"
          className="choice choice-right"
          data-hot={ui.hover === "player"}
          tabIndex={ui.choosing ? 0 : -1}
          onClick={() => focusOn("player")}
        >
          <span>Record player</span>
          <ArrowRight />
        </button>
      </div>

      {/* Shelf: the labels in the room and the index at the top are the links. */}
      {ui.focus === "shelf" && (
        <section className="panel panel-end" aria-label="Bookshelf">
          <button type="button" className="step-back" onClick={release}>
            <StepBack />
            Step back
          </button>
        </section>
      )}

      {ui.focus === "player" && (
        <section className="panel panel-top" aria-label="Record player">
          <button type="button" className="play" onClick={toggle} aria-pressed={audio.playing}>
            {audio.playing ? <Pause /> : <Play />}
            {audio.playing ? "Pause" : "Play"}
          </button>
          <ol className="panel-list tracks">
            {site.tracks.map((t, i) => (
              <li key={t.title}>
                <button type="button" aria-current={audio.index === i ? "true" : undefined} onClick={() => play(i)}>
                  {t.title}
                </button>
              </li>
            ))}
          </ol>
          <button type="button" className="step-back" onClick={release}>
            <StepBack />
            Step back
          </button>
        </section>
      )}

      {/* Looking at a frame in the hallway: buy it, or go back to walking. */}
      {ui.focus === "frame" && ui.frame !== null && (
        <section className="frame-view" aria-label="Artwork">
          <button type="button" className="step-back frame-back" onClick={release}>
            <ArrowLeft />
            Back to the hallway
          </button>
          <div className="frame-buy">
            <p className="frame-title">
              {artworkAt(ui.frame)?.title ?? "Untitled"}
              {artworkAt(ui.frame)?.placeholder ? " (placeholder)" : ""}
            </p>
            <a className="buy" href={artworkAt(ui.frame)?.buyUrl ?? site.shop.fallbackBuyUrl}>
              Buy?
            </a>
          </div>
        </section>
      )}

      {/* Fills while the pointer rests on a frame. */}
      <span
        className="dwell"
        aria-hidden="true"
        data-on="false"
        ref={(el) => {
          hudRefs.dwell = el;
        }}
      />

      {showMini && (
        <div className="mini" role="status">
          <span className="mini-title">
            {audio.title}
            {audio.placeholder ? " (placeholder)" : ""}
          </span>
          <button type="button" onClick={toggle} aria-label="Pause">
            <Pause />
          </button>
        </div>
      )}

      <p
        className="wayfinding"
        aria-hidden="true"
        ref={(el) => {
          hudRefs.wayfinding = el;
        }}
      />
    </>
  );
}
