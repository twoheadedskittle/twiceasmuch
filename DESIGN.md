---
name: twice as much
description: A personal-project portfolio entered as an inked toon reading room, with an archive hallway behind it and real weather outside the window.
colors:
  accent: "#e0565b"
  oxblood: "#7c2a24"
  crimson: "#8b1a22"
  crimson-deep: "#5c0f16"
  crimson-ceiling: "#4a1d22"
  lacquer: "#151011"
  cream: "#d9ccb2"
  frame-cream: "#ece4d3"
  walnut: "#5a3524"
  walnut-dark: "#38211a"
  brass: "#b38a43"
  floor-black: "#141112"
  floor-cream: "#e3d3a6"
  leaf: "#4f6b45"
  leaf-deep: "#3a5236"
  ground: "#140c0d"
  limewash: "#ecdcc0"
  limewash-dim: "#c9b896"
  ink-line: "#1a1714"
  print-ink: "#1f1914"
  plaque-paper: "#e6d6b6"
  plaque-paper-lit: "#f4e7c8"
  hall-plaster: "#6d767a"
  hall-paper: "#8e897d"
  hall-fog: "#1b2024"
  skin: "#d9a48a"
  skin-warmth: "#4a1c12"
  nail: "#e8c3b4"
  wool: "#26201f"
  starling: "#1d1b1c"
typography:
  display:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "clamp(3rem, 9vw, 6rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.035em"
    fontVariation: "\"wdth\" 85"
  headline:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    letterSpacing: "-0.02em"
  lead:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.5
  title:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 650
    letterSpacing: "-0.01em"
    fontVariation: "\"wdth\" 90"
  body:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 560
  label-small:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
  caption:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    fontFeature: "\"tnum\" 1"
spacing:
  gutter: "clamp(16px, 3vw, 32px)"
  icon-gap: "10px"
  nav-gap: "20px"
  group-gap: "24px"
components:
  brand:
    textColor: "{colors.limewash}"
    typography: "{typography.title}"
  nav-link:
    textColor: "{colors.limewash}"
    typography: "{typography.label-small}"
    padding: "10px 0"
  skip-link:
    backgroundColor: "{colors.limewash}"
    textColor: "{colors.ground}"
    padding: "10px 14px"
  set-text-control:
    textColor: "{colors.limewash}"
    typography: "{typography.label}"
    padding: "10px 0"
    height: "44px"
  set-text-control-hot:
    textColor: "{colors.accent}"
  play-control:
    textColor: "{colors.accent}"
    padding: "10px 0"
    height: "44px"
  track-item:
    textColor: "{colors.limewash}"
    padding: "8px 0"
    height: "40px"
  track-item-current:
    textColor: "{colors.accent}"
  now-playing:
    textColor: "{colors.limewash}"
    typography: "{typography.caption}"
  frame-title:
    textColor: "{colors.limewash-dim}"
    typography: "{typography.label-small}"
  buy-link:
    textColor: "{colors.limewash}"
    typography: "{typography.headline}"
    padding: "8px 4px"
    height: "48px"
  buy-link-hover:
    textColor: "{colors.accent}"
  dwell-ring:
    textColor: "{colors.limewash}"
    size: "34px"
    rounded: "50%"
  section-heading:
    textColor: "{colors.limewash}"
    typography: "{typography.display}"
  section-blurb:
    textColor: "{colors.limewash-dim}"
    typography: "{typography.lead}"
    width: "68ch"
  back-link:
    textColor: "{colors.accent}"
    padding: "12px 0"
  shelf-label:
    backgroundColor: "{colors.plaque-paper}"
    textColor: "{colors.print-ink}"
  shelf-label-hot:
    backgroundColor: "{colors.plaque-paper-lit}"
    textColor: "{colors.print-ink}"
  record-sleeve:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.print-ink}"
  record-label:
    backgroundColor: "{colors.crimson}"
    textColor: "{colors.limewash}"
---

# Design System: twice as much

## Overview

**Creative North Star: "The Inked Reading Room"**

The site is a place, rendered as an illustration: a small reading room drawn in toon shading, with crimson limewashed walls under a dark crimson ceiling, deep crimson mouldings, black lacquer and cream trim, walnut furniture, brass hardware and a black-and-cream zigzag floor. The only other hue in the room is the green of living plants. One screen pass inks the whole scene. A soft dark line follows every silhouette and seam, diagonal hatching sits only in the darkest cel band, and a grade runs warm in the room and cold, desaturated blue-grey in the archive hallway behind the reader. Light falls in three flat cel bands (the room) or three bands whose shadow drops nearly to black (the hallway). Paper grain and a vignette lie over everything.

Through the window is a real outdoors: an atmospheric sky, sprite clouds, farmland with hedgerows, copses and ridges fading into aerial haze, a starling murmuration, and a slow weather cycle (dawn, clear, overcast, rain, golden, dusk, night). The weather's light is the light that falls into the room, so the room's mood moves with the sky.

The DOM is set text laid over that illustration: a few lines of Bricolage Grotesque in limewash cream, held legible by a soft ink shadow behind the letters rather than by boxes. Density is very low. There are no cards, panels, glass or chrome. Every interactive word sits where its object stands in the room: the shelf choice on the left, the record player on the right, the way back under the hand. Section navigation lives on the bookshelf's painted labels; the masthead's link list exists only for keyboard users. The scene is the page, so there is one palette and no light/dark switch (`color-scheme: dark`).

**Key Characteristics:**
- Inked toon interior: ink line, shadow-only hatching and a warm-to-cold grade, applied as one screen pass.
- Flat cel lighting in three bands; no smooth gradients on materials.
- Painted, grainy canvas materials (crimson limewash, lacquer, walnut, a worn zigzag floor, relief paper), never photographic.
- A living window: weather presets drive the daylight entering the room.
- UI is set text in Bricolage Grotesque with an ink text-shadow; no boxes, no glass.
- One accent, a lit coral red, marks hot, current and primary states.
- Diegetic copy and navigation (step counter, shelf labels, sleeve) over generic UI.

## Colors

The palette is room materials, not a UI theme: crimson, black lacquer and cream, walnut and brass, with green kept for plants and one lit coral red as the only interactive accent.

### Primary
- **Lit Coral** (accent): the only DOM state colour. Hot choice, current track, the Play/Pause control, the back link, the "Buy?" underline and its hover, the focus ring, the caret and the scrollbar thumb.

### Secondary
- **Bookcloth Oxblood** (oxblood): book spines and small objects in the scene; in the DOM only as the text-selection fill. Never used for controls.

### Tertiary
- **Crimson Limewash** (crimson): the walls, painted through the cloudy limewash texture; also the record's centre label.
- **Deep Crimson** (crimson-deep): mouldings, cabinet body, spines, the hands' knitted cuff.
- **Crimson Ceiling** (crimson-ceiling): the ceiling, limewash-textured.
- **Black Lacquer** (lacquer) and **Cream** (cream): the floor's two colours carried into the furniture, pots, spines and the record sleeve.
- **Frame Cream** (frame-cream): window frames, glazing bars, cornice and dado rails.
- **Walnut** (walnut) and **Dark Walnut** (walnut-dark): shelving, plinth, stems, hallway frame backs.
- **Brass** (brass): hardware and the playing indicator.
- **Zigzag Black** (floor-black) and **Zigzag Cream** (floor-cream): the chevron floor, worn and scuffed.
- **Leaf** (leaf) and **Deep Leaf** (leaf-deep): plants only. The one green in the room.

### Neutral
- **Crimson Black** (ground): page background, veil, section pages, theme-color. Overlay scrims and text shadows use the same value as `rgb(20 12 13)` at 0.55 to 0.9 alpha.
- **Limewash Cream** (limewash): all DOM text by default; the skip link's fill; the dwell ring.
- **Faded Limewash** (limewash-dim): secondary DOM text (section blurb, loading veil, artwork title).
- **Ink** (ink-line): the colour of the screen-pass outline and hatching.
- **Print Ink** (print-ink), **Plaque Paper** (plaque-paper), **Lit Plaque Paper** (plaque-paper-lit): text painted into the scene on labels and the sleeve.
- **Hallway Plaster** (hall-plaster), **Relief Paper** (hall-paper), **Hallway Fog** (hall-fog): the archive hallway, which the cold grade shifts further to blue-grey.
- **Skin** (skin) with **Skin Warmth** emissive (skin-warmth), **Nail** (nail), **Wool** (wool): the reader's hands, the only lit-standard (non-toon) material in the room.
- **Starling** (starling): the murmuration outside.

Sky, cloud, haze and window-light colours belong to the weather presets (`src/scene/outdoorState.ts`) and change continuously; they are scene behaviour, not tokens.

### Named Rules
**The One Lamp Rule.** The coral accent is the only colour that signals state in the DOM: hot, current, primary or focused. Nothing else changes colour on interaction.

**The Room Is The Palette Rule.** New colours come from the world's materials (`src/scene/palette.ts`, and the weather presets for anything outdoors), never from a UI theme. There is no light mode.

**The Green Grows Rule.** Green appears only in living plants (and the land outside). Walls, trim, furniture and UI never take it.

## Typography

**Display Font:** Bricolage Grotesque (with system-ui, sans-serif), loaded through next/font as `--font-voice`
**Body Font:** Bricolage Grotesque
**Label Font:** Bricolage Grotesque, also used for every word painted into the scene

**Character:** One variable grotesque does everything, a slightly bookish, slightly odd voice. Hierarchy comes from weight and the width axis, condensed at large sizes, not from a second family.

### Hierarchy
- **Display** (700, clamp(3rem, 9vw, 6rem), 0.95, width 85, balanced wrap): section-page headings only. The landing has no headline.
- **Headline** (700, 1.75rem, -0.02em): the single "Buy?" call in the hallway frame view.
- **Lead** (400, 1.125rem, 1.5): the section blurb in faded limewash, inside a 68ch measure.
- **Title** (650, 1.0625rem, width 90): the brand name in the masthead; the choices also sit at 1.0625rem.
- **Body** (400, 1rem, 1.5): base text.
- **Label** (560, 1rem; Play 650; tracks 500): set-text controls over the scene.
- **Label Small** (400, 0.9375rem): masthead links, the loading veil (0.02em tracking), the artwork title.
- **Caption** (400, 0.875rem, tabular figures): the diegetic step counter and the now-playing line.

In-scene type (canvas-painted): plaque 600, sleeve title 700, sleeve sub-line and tracks 500, current track 700, record label 600.

### Named Rules
**The One Voice Rule.** Bricolage Grotesque is the only face, in the DOM and painted into the world. Do not add a display or mono face.

**The Set Text Rule.** Interface words are typeset, not contained. Legibility comes from the ink text-shadow, never a box behind the word.

## Layout

The viewport is the room. DOM elements are fixed overlays anchored at the edges with the fluid gutter (clamp(16px, 3vw, 32px)): brand top-left, the step counter bottom-right, the now-playing line bottom-left, and the two choices vertically centred at the left and right edges where the shelf and record player stand. The masthead's section list sits top-right but is clipped out of sight until something inside it takes keyboard focus. The focus panel goes to where the object leaves empty wall: bottom-right for the shelf (only "Step back"), a top-left column (max 360px) above the record player. The hallway frame view runs along the bottom edge: the way back at the left, the artwork title and "Buy?" centred under the frame.

Rhythm is small and fixed: 10px between an icon and its word, 20px between nav links, 24px between set-text groups. Touch targets are at least 44px tall (tracks 40px; "Buy?" 48px).

At 560px and below the masthead stacks, the step counter moves up under it, choice labels wrap to about 8ch, the record-player column drops to 104px from the top, and the frame view stacks with "Buy?" above the way back. Section pages are a single left-aligned column with a 68ch maximum and generous top space (clamp(120px, 22vh, 220px)).

## Elevation & Depth

Depth belongs to the 3D scene, inked and cel-lit. The DOM is flat and has no surface elevation. The only DOM shadows are ink halos behind text and icons, plus two functional scrims (the masthead's top fade and the record-player column's radial falloff) that dim the scene so set text reads on bright wall.

### Shadow Vocabulary
- **Ink halo** (`text-shadow: 0 1px 2px rgb(20 12 13 / 0.9), 0 0 18px rgb(20 12 13 / 0.85), 0 0 4px rgb(20 12 13 / 0.9)`): every set-text control. The artwork title uses its first two layers; "Buy?" widens the glow to 22px.
- **Soft ink halo** (`text-shadow: 0 1px 12px rgb(20 12 13 / 0.9), 0 0 2px rgb(20 12 13 / 0.8)`): step counter; the now-playing line uses its first layer.
- **Icon halo** (`filter: drop-shadow(0 0 6px rgb(20 12 13 / 0.9))`): control icons.
- **Masthead scrim** (`linear-gradient(to bottom, rgb(20 12 13 / 0.62), rgb(20 12 13 / 0))`): behind the brand.
- **Wall falloff** (`radial-gradient(ellipse at 20% 45%, rgb(20 12 13 / 0.55), rgb(20 12 13 / 0) 70%)`): behind the record-player controls.

### Named Rules
**The Ink Not Glass Rule.** Overlays are darkened with soft ink only. No blur, no frosted panel, no bordered card.

**The Shadow-Band Hatch Rule.** Hatching marks only the darkest cel band (crosshatch in the very darkest). It never sits on lit surfaces, sky or far fog.

## Shapes

DOM shapes are square and borderless: controls have no fill, no border and no radius. The rounding is the 2px corner on the coral focus ring (2px outline, 4px offset) and the dwell ring, a 34px circle masked to a 4px band. Underlines are 1px and drawn in, offset 7px on controls and 6px on the back link; "Buy?" alone carries a 2px coral underline at rest, offset 8px. In the scene, edges are ink lines whose weight falls off with distance (about 1.6px near to 0.9px far), the floor zigzags in eight chevron bands per 1.6m repeat, and the shelf plaque carries a printed ink border. Icons are an authored set on a 20px box with a 1.75px round-capped stroke (Pause at 2.4px).

## Components

### Masthead
Quiet set text over the scene's top edge.
- **Brand:** title type in limewash, links home.
- **Index:** the section names, visually hidden (clipped and transparent) and revealed only while a link inside has keyboard focus. Pointer visitors navigate by the bookshelf labels. A 1px underline grows from the left over 220ms with the ease-out curve on focus, hover (fine pointers) and `aria-current="page"`.
- **Skip link ("Skip the room"):** the one filled element, limewash with crimson-black text at 600, hidden above the viewport until focused, sliding in over 160ms.

### Set-Text Choices (left / right)
- **Style:** label type at 1.0625rem, limewash, ink halo, arrow icon on the side the object stands.
- **Appearance:** fade and slide in from 8px toward the outer edge (220ms ease-out) only while the visitor is choosing. Otherwise they are hidden and out of the tab order.
- **Hot / Focus:** coral with an underline in currentColor. Hot state follows the 3D hover.
- **Active:** scale 0.97.

### Focus Panel
Set text that appears where the object leaves room (260ms rise from 8px).
- **Play / Pause:** coral at 650 with a play or pause icon, `aria-pressed`.
- **Track list:** an ordered list of 500-weight buttons (40px). The current track is coral and underlined.
- **Step back:** limewash label with the up-stroke icon. Underlines on hover.

### Frame View (hallway)
Shown while the visitor looks at a framed artwork; rises in like the focus panel.
- **Back to the hallway:** a set-text control with a left arrow, at the left edge.
- **Title:** the artwork title (with "(placeholder)" when relevant) in label-small, faded limewash, centred.
- **Buy?:** headline type in limewash with a 2px coral underline at rest; turns coral on hover, scales 0.97 when pressed. The one large word in the room.

### Dwell Ring
A 34px ring that follows the pointer while it rests on a frame and fills clockwise in limewash over the dwell time (default 1200ms) against an 18% limewash track; when full, the frame is chosen. Fades in over 120ms. Pointer feedback only, `aria-hidden`.

### Now-Playing Line
Caption type bottom-left with the title (and "(placeholder)" when relevant) and a 44px icon-only Pause button. A status region, shown only while audio plays and the player is not in focus.

### Section Page
Crimson-black page, the masthead with the current section marked, a display heading, a faded-limewash lead blurb, and a coral "Back to the room" link with a 1px underline. The link scales to 0.97 when pressed.

### Shelf Label Plaque (in scene)
A paper plaque hanging from the shelf's front edge and the primary section navigation. Plaque paper with an inked 5px border and the section name in print ink at 600, centred. When hot, the paper lightens to lit plaque paper and an ink underline is drawn beneath the name.

### Record Sleeve and Record (in scene)
A cream sleeve with a hand-drawn double ink ring (the record seen from above), the brand name at 700, "Side A" at 500, and a numbered, hairline-ruled track list. The current track is 700 on a 14% ink band, with three ink bars while it plays. The record itself is near-black vinyl with a crimson centre label carrying the brand name in limewash at 600.

### Window and Weather (in scene)
A physical sky (exposure 0.42), sprite clouds, and a custom land shader of farmland, hedgerows, copses and ridges with aerial-perspective haze. A 520-bird boids murmuration in starling black. Seven presets (dawn, clear, overcast, rain, golden, dusk, night) each hold for a few minutes and crossfade over about half a minute; each preset's light colour and intensity drive the spotlight through the window.

### Hands (in scene)
The reader's hands in a lit standard material, not toon: skin with a low warm emissive so it never reads grey, paler nails, dark wool sleeves and a deep crimson cuff.

## Do's and Don'ts

### Do:
- **Do** set every interface word as text over the scene, with the ink halo for legibility.
- **Do** reserve the coral accent for hot, current, primary and focus states.
- **Do** keep Bricolage Grotesque as the only face, including text painted into the scene.
- **Do** take new colours from the room's materials and let the screen pass ink, hatch and grade them.
- **Do** keep green for living things only.
- **Do** place a control where its object stands in the room, with an arrow pointing toward it.
- **Do** keep targets at least 44px tall and keep motion on the ease-out curve (cubic-bezier(0.23, 1, 0.32, 1)), cut to 0ms under reduced motion.
- **Do** paint world text (labels, sleeves, frames) onto canvas materials in print ink, as objects in the room.
- **Do** let the window's weather light the room rather than adding fixed mood lighting.

### Don't:
- **Don't** put boxes, cards, glass or blur behind DOM text. The skip link is the only filled text element.
- **Don't** add a light theme or a second palette. The scene is the page.
- **Don't** hatch lit surfaces or smooth the cel bands into gradients.
- **Don't** use oxblood or any colour other than the coral accent to signal interaction.
- **Don't** bring back ochre, sage or mustard; the room is crimson, black, cream, walnut and brass.
