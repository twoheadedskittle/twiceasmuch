"use client";

import { Bloom, EffectComposer, EffectComposerContext } from "@react-three/postprocessing";
import { useFrame } from "@react-three/fiber";
import { BlendFunction, Effect, EffectAttribute } from "postprocessing";
import { useContext, useMemo } from "react";
import { Color, Uniform, type Texture } from "three";
import { C } from "./palette";
import { rig } from "./rig";

/**
 * The illustrated look, as one screen pass over the rendered scene:
 *
 * - Ink line: edges found from depth and normal discontinuities, so every
 *   silhouette, wall seam, shelf edge and finger gets a dark line, whatever
 *   the geometry. Thicker for near objects, thinner far away.
 * - Hatching: the darkest cel band gets diagonal ink strokes, the very
 *   darkest crosshatch, like the pen-and-ink hallway references.
 * - Grade: warm in the room, desaturated cold blue-grey in the hallway,
 *   driven by rig.cold. Paper grain and a soft vignette over everything.
 */

const fragment = /* glsl */ `
uniform sampler2D tNormal;
uniform vec3 uInk;
uniform float uCold;
uniform float uTime;

float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

float linearDepthAt(vec2 p) {
  return -getViewZ(readDepth(p));
}

vec3 normalAt(vec2 p) {
  return texture2D(tNormal, p).xyz * 2.0 - 1.0;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
  vec3 col = inputColor.rgb;

  // ---- Ink line ----
  float d0 = linearDepthAt(uv);
  // Line width in pixels: a little heavier close up.
  float w = mix(1.6, 0.9, clamp(d0 / 12.0, 0.0, 1.0));
  vec2 o = texelSize * w;
  float dl = linearDepthAt(uv - vec2(o.x, 0.0));
  float dr = linearDepthAt(uv + vec2(o.x, 0.0));
  float du = linearDepthAt(uv + vec2(0.0, o.y));
  float dd = linearDepthAt(uv - vec2(0.0, o.y));
  // Second derivative of depth, relative to distance: creases and silhouettes.
  float dEdge = (abs(dl + dr - 2.0 * d0) + abs(du + dd - 2.0 * d0)) / max(d0, 0.1);
  vec3 n0 = normalAt(uv);
  float nEdge = 0.0;
  nEdge += 1.0 - dot(n0, normalAt(uv + vec2(o.x, 0.0)));
  nEdge += 1.0 - dot(n0, normalAt(uv - vec2(o.x, 0.0)));
  nEdge += 1.0 - dot(n0, normalAt(uv + vec2(0.0, o.y)));
  nEdge += 1.0 - dot(n0, normalAt(uv - vec2(0.0, o.y)));
  float edge = max(smoothstep(0.035, 0.09, dEdge), smoothstep(0.35, 0.8, nEdge));
  // Lines fade into the fog with distance rather than buzzing.
  edge *= 1.0 - smoothstep(10.0, 22.0, d0);

  // ---- Hatching in the shadow bands ----
  float L = lum(col);
  vec2 px = gl_FragCoord.xy;
  float wobble = sin(px.y * 0.07) * 1.2;
  float h1 = step(0.82, fract((px.x + px.y + wobble) / 6.0));
  float h2 = step(0.82, fract((px.x - px.y + wobble) / 6.0));
  float hatch = h1 * (1.0 - smoothstep(0.08, 0.15, L)) + h2 * (1.0 - smoothstep(0.03, 0.08, L));
  hatch *= 1.0 - step(30.0, d0); // not on the sky / far fog

  col = mix(col, uInk, clamp(hatch * 0.4, 0.0, 0.4));
  col = mix(col, uInk, edge * 0.88);

  // ---- Grade ----
  // Warm room: lift reds, settle blues. Cold hallway: desaturate, cool, darken.
  vec3 warm = col * vec3(1.04, 1.0, 0.92);
  float g = lum(col);
  vec3 cold = mix(vec3(g), col, 0.32) * vec3(0.86, 0.94, 1.04) * 0.92;
  col = mix(warm, cold, uCold);

  // Paper grain and vignette.
  float grain = hash(px + fract(uTime) * 61.0) - 0.5;
  col += grain * 0.035;
  vec2 v = uv - 0.5;
  col *= 1.0 - dot(v, v) * mix(0.45, 0.9, uCold);

  outputColor = vec4(col, inputColor.a);
}
`;

class InkEffect extends Effect {
  constructor(normal: Texture) {
    super("InkEffect", fragment, {
      blendFunction: BlendFunction.NORMAL,
      attributes: EffectAttribute.DEPTH,
      uniforms: new Map<string, Uniform>([
        ["tNormal", new Uniform(normal)],
        ["uInk", new Uniform(new Color(C.ink))],
        ["uCold", new Uniform(0)],
        ["uTime", new Uniform(0)],
      ]),
    });
  }
}

function InkPass() {
  const { normalPass } = useContext(EffectComposerContext);
  const effect = useMemo(() => (normalPass ? new InkEffect(normalPass.texture) : null), [normalPass]);
  useFrame(({ clock }) => {
    if (!effect) return;
    effect.uniforms.get("uCold")!.value = rig.cold;
    effect.uniforms.get("uTime")!.value = rig.reducedMotion ? 0 : clock.elapsedTime;
  });
  return effect ? <primitive object={effect} dispose={null} /> : null;
}

export function Ink() {
  return (
    <EffectComposer enableNormalPass multisampling={0}>
      {/* Only the window, the bulbs and the lamp shades are bright enough to bloom. */}
      <Bloom intensity={0.55} luminanceThreshold={0.86} luminanceSmoothing={0.12} mipmapBlur />
      <InkPass />
    </EffectComposer>
  );
}
