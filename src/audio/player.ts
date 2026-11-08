import { site, type Track } from "@/config/site";

/**
 * The record player's audio. Nothing makes a sound until a visitor's click
 * calls play(); browsers block audio before a gesture anyway.
 *
 * A track with `src: null` is a placeholder: it plays a quiet synthesized
 * loop (vinyl crackle under a soft chord) so the interaction can be tested
 * before real songs exist.
 */

export type PlayerState = { index: number; playing: boolean; title: string; placeholder: boolean };

const tracks: readonly Track[] = site.tracks;
let index = 0;
let playing = false;
let audio: HTMLAudioElement | null = null;
let ctx: AudioContext | null = null;
let synth: { stop: () => void } | null = null;
const listeners = new Set<() => void>();

let snapshot: PlayerState = makeSnapshot();

function makeSnapshot(): PlayerState {
  const t = tracks[index];
  return { index, playing, title: t?.title ?? "", placeholder: !t?.src };
}

function emit() {
  snapshot = makeSnapshot();
  listeners.forEach((l) => l());
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export const getState = () => snapshot;

function stopAll() {
  audio?.pause();
  synth?.stop();
  synth = null;
}

function startSynth(i: number) {
  ctx ??= new AudioContext();
  const ac = ctx;
  void ac.resume();
  const out = ac.createGain();
  out.gain.value = 0;
  out.gain.linearRampToValueAtTime(0.18, ac.currentTime + 0.6);
  out.connect(ac.destination);

  // Crackle: sparse clicks in filtered noise.
  const len = ac.sampleRate * 2;
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let k = 0; k < len; k++) {
    const hiss = (Math.random() * 2 - 1) * 0.04;
    data[k] = Math.random() < 0.0009 ? (Math.random() * 2 - 1) * 0.9 : hiss;
  }
  const noise = ac.createBufferSource();
  noise.buffer = buf;
  noise.loop = true;
  const hp = ac.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 900;
  noise.connect(hp).connect(out);
  noise.start();

  // A slow chord; each placeholder track gets its own root.
  const roots = [196, 174.6, 220, 164.8, 246.9];
  const root = roots[i % roots.length];
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 1200;
  lp.connect(out);
  const oscs = [1, 1.25, 1.5, 2].map((ratio, n) => {
    const o = ac.createOscillator();
    o.type = n === 3 ? "sine" : "triangle";
    o.frequency.value = root * ratio;
    const g = ac.createGain();
    g.gain.value = 0.12 / (n + 1);
    o.connect(g).connect(lp);
    o.start();
    return o;
  });

  return {
    stop() {
      const t = ac.currentTime;
      out.gain.cancelScheduledValues(t);
      out.gain.setValueAtTime(out.gain.value, t);
      out.gain.linearRampToValueAtTime(0, t + 0.25);
      setTimeout(() => {
        noise.stop();
        oscs.forEach((o) => o.stop());
        out.disconnect();
      }, 300);
    },
  };
}

function startCurrent() {
  const t = tracks[index];
  if (!t) return;
  if (t.src) {
    audio ??= new Audio();
    if (!audio.src.endsWith(t.src)) {
      audio.src = t.src;
      audio.onended = () => next();
    }
    void audio.play().catch(() => {
      playing = false;
      emit();
    });
  } else {
    synth = startSynth(index);
  }
}

export function play(i = index) {
  if (!tracks.length) return;
  stopAll();
  index = (i + tracks.length) % tracks.length;
  playing = true;
  startCurrent();
  emit();
}

export function pause() {
  stopAll();
  playing = false;
  emit();
}

export function toggle() {
  if (playing) pause();
  else play();
}

export function next() {
  play(index + 1);
}

export function trackList(): readonly Track[] {
  return tracks;
}
