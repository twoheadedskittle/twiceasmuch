---
name: twice as much
description: A personal-project portfolio entered as an inked toon reading room, with an archive hallway behind it.
colors:
  ochre: "#d9a85c"
  oxblood: "#7c2a24"
  sage: "#8a9e86"
  sage-deep: "#5f7461"
  limewash-plaster: "#c99a5b"
  oak: "#7a4f2e"
  bookcloth-salmon: "#c97b62"
  mustard: "#c9a33f"
  brass: "#b38a43"
  green-black: "#1d2a24"
  limewash: "#ecdcc0"
  limewash-dim: "#c9b896"
  ink-line: "#1a1714"
  print-ink: "#1f1914"
  plaque-paper: "#e6d6b6"
  plaque-paper-lit: "#f4e7c8"
  hall-plaster: "#6d767a"
  hall-paper: "#8e897d"
  hall-fog: "#1b2024"
typography:
  display:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "clamp(3rem, 9vw, 6rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.035em"
    fontVariation: "\"wdth\" 85"
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
    padding: "10px 0"
  skip-link:
    backgroundColor: "{colors.limewash}"
    textColor: "{colors.green-black}"
    padding: "10px 14px"
  set-text-control:
    textColor: "{colors.limewash}"
    typography: "{typography.label}"
    padding: "10px 0"
    height: "44px"
  set-text-control-hot:
    textColor: "{colors.ochre}"
  play-control:
    textColor: "{colors.ochre}"
    padding: "10px 0"
    height: "44px"
  track-item:
    textColor: "{colors.limewash}"
    padding: "8px 0"
    height: "40px"
  track-item-current:
    textColor: "{colors.ochre}"
  now-playing:
    textColor: "{colors.limewash}"
    typography: "{typography.caption}"
  section-heading:
    textColor: "{colors.limewash}"
    typography: "{typography.display}"
  section-blurb:
    textColor: "{colors.limewash-dim}"
    width: "68ch"
  back-link:
    textColor: "{colors.ochre}"
    padding: "12px 0"
  shelf-label:
    backgroundColor: "{colors.plaque-paper}"
    textColor: "{colors.print-ink}"
  shelf-label-hot:
    backgroundColor: "{colors.plaque-paper-lit}"
    textColor: "{colors.print-ink}"
  record-sleeve:
    backgroundColor: "{colors.bookcloth-salmon}"
    textColor: "{colors.print-ink}"
---

# Design System: twice as much

## Overview

**Creative North Star: "The Inked Reading Room"**

The site is a place, rendered as an illustration: a small reading room drawn in toon shading, with sage panelling, ochre limewash plaster, oak boards, oxblood bookcloth, brass hardware and a green-black door frame. One screen pass inks the whole scene. A soft dark line follows every silhouette and seam, diagonal hatching sits only in the darkest cel band, and a grade runs warm in the room and cold, desaturated blue-grey in the archive hallway behind the reader. Light falls in three flat cel bands (the room) or three bands whose shadow drops nearly to black (the hallway). Paper grain and a vignette lie over everything.

The DOM is set text laid over that illustration: a few lines of Bricolage Grotesque in limewash cream, held legible by a soft ink shadow behind the letters rather than by boxes. Density is very low. There are no cards, panels, glass or chrome. Every interactive word sits where its object stands in the room: the shelf choice on the left, the record player on the right, the way back under the hand. Text that belongs to the world, such as the shelf plaques and the record sleeve, is painted into the scene in the same face and inked like the furniture.

The scene is the page, so there is one palette and no light/dark switch (`color-scheme: dark`).

**Key Characteristics:**
- Inked toon interior: ink line, shadow-only hatching and a warm-to-cold grade, applied as one screen pass.
- Flat cel lighting in three bands; no smooth gradients on materials.
- Painted, grainy canvas materials (limewash, sage paint, oak, bookcloth, relief paper), never photographic.
- UI is set text in Bricolage Grotesque with an ink text-shadow; no boxes, no glass.
- One accent, ochre, marks hot, current and primary states.
- Diegetic copy (step counter, shelf plaques, sleeve) over generic UI copy.

## Colors

The palette is room materials, not a UI theme: dark green-black, cream limewash, sage, oak and oxblood, with ochre as the only interactive accent.

### Primary
- **Lamplight Ochre** (ochre): the only DOM accent. Hot choice, current track, the Play/Pause control, the back link, the focus ring, the caret and the scrollbar thumb.

### Secondary
- **Bookcloth Oxblood** (oxblood): book spines and the runner in the scene; in the DOM only as the text-selection fill. Never used for controls.

### Tertiary
- **Panelling Sage** (sage) and **Deep Sage** (sage-deep): painted wall panelling and its shadowed mouldings.
- **Ochre Limewash Plaster** (limewash-plaster): the room's plaster walls and ceiling, as painted into the scene.
- **Oiled Oak** (oak): floorboards, shelf and record-player plinth.
- **Salmon Bookcloth** (bookcloth-salmon), **Mustard Bookcloth** (mustard), **Brass** (brass): spines, the record sleeve and hardware.

### Neutral
- **Green-Black Trim** (green-black): page background, door frame, veil, section pages, theme-color.
- **Limewash Cream** (limewash): all DOM text by default; the skip link's fill.
- **Faded Limewash** (limewash-dim): secondary DOM text (section blurb, loading veil).
- **Ink** (ink-line): the colour of the screen-pass outline and hatching. Overlay scrims and text shadows use a near-equivalent `rgb(18 24 21)` at 0.55 to 0.9 alpha.
- **Print Ink** (print-ink), **Plaque Paper** (plaque-paper), **Lit Plaque Paper** (plaque-paper-lit): text painted into the scene on labels and the sleeve.
- **Hallway Plaster** (hall-plaster), **Relief Paper** (hall-paper), **Hallway Fog** (hall-fog): the archive hallway, which the cold grade shifts further to blue-grey.

Naming note: the DOM token `--limewash` is the cream of the lit wall, while the scene's `limewash` (here `limewash-plaster`) is the ochre plaster itself. Both values are as built.

### Named Rules
**The One Lamp Rule.** Ochre is the only colour that signals state in the DOM: hot, current, primary or focused. Nothing else changes colour on interaction.

**The Room Is The Palette Rule.** New colours come from the room's materials (`src/scene/palette.ts`), never from a UI theme. There is no light mode.

## Typography

**Display Font:** Bricolage Grotesque (with system-ui, sans-serif), loaded through next/font as `--font-voice`
**Body Font:** Bricolage Grotesque
**Label Font:** Bricolage Grotesque, also used for every word painted into the scene

**Character:** One variable grotesque does everything, a slightly bookish, slightly odd voice. Hierarchy comes from weight and the width axis, condensed at large sizes, not from a second family.

### Hierarchy
- **Display** (700, clamp(3rem, 9vw, 6rem), 0.95, width 85, balanced wrap): section-page headings only. The landing has no headline.
- **Title** (650, 1.0625rem, width 90): the brand name in the masthead.
- **Body** (400, 1rem, 1.5): base text. The section blurb is 1.125rem in faded limewash, inside a 68ch measure.
- **Label** (560, 1rem; choices 1.0625rem; Play 650; tracks 500): set-text controls over the scene. Nav links 0.9375rem.
- **Caption** (400, 0.875rem, tabular figures): the diegetic step counter and the now-playing line.

In-scene type (canvas-painted): plaque 600, sleeve title 700, sleeve sub-line and tracks 500, current track 700.

### Named Rules
**The One Voice Rule.** Bricolage Grotesque is the only face, in the DOM and painted into the world. Do not add a display or mono face.

**The Set Text Rule.** Interface words are typeset, not contained. Legibility comes from the ink text-shadow, never a box behind the word.

## Layout

The viewport is the room. DOM elements are fixed overlays anchored at the edges with the fluid gutter (clamp(16px, 3vw, 32px)): brand top-left, the plain-links index top-right, the step counter bottom-right, the now-playing line bottom-left, and the two choices vertically centred at the left and right edges where the shelf and record player stand. The focus panel goes to where the object leaves empty wall: bottom-right for the shelf (only "Step back"), a top-left column (max 360px) above the record player.

Rhythm is small and fixed: 10px between an icon and its word, 20px between nav links, 24px between set-text groups. Touch targets are at least 44px tall (tracks 40px).

At 560px and below the masthead stacks (brand above a left-aligned index), the step counter moves up under it, choice labels wrap to about 8ch, and the record-player column drops to 104px from the top. Section pages are a single left-aligned column with a 68ch maximum and generous top space (clamp(120px, 22vh, 220px)).

## Elevation & Depth

Depth belongs to the 3D scene, inked and cel-lit. The DOM is flat and has no surface elevation. The only DOM shadows are ink halos behind text and icons, plus two functional scrims (the masthead's top fade and the record-player column's radial falloff) that dim the scene so set text reads on bright wall.

### Shadow Vocabulary
- **Ink halo** (`text-shadow: 0 1px 2px rgb(18 24 21 / 0.9), 0 0 18px rgb(18 24 21 / 0.85), 0 0 4px rgb(18 24 21 / 0.9)`): every set-text control.
- **Soft ink halo** (`text-shadow: 0 1px 12px rgb(18 24 21 / 0.9), 0 0 2px rgb(18 24 21 / 0.8)`): step counter; the now-playing line uses its first layer.
- **Icon halo** (`filter: drop-shadow(0 0 6px rgb(18 24 21 / 0.9))`): control icons.
- **Masthead scrim** (`linear-gradient(to bottom, rgb(18 24 21 / 0.62), rgb(18 24 21 / 0))`): behind brand and index.
- **Wall falloff** (`radial-gradient(ellipse at 20% 45%, rgb(18 24 21 / 0.55), rgb(18 24 21 / 0) 70%)`): behind the record-player controls.

### Named Rules
**The Ink Not Glass Rule.** Overlays are darkened with soft ink only. No blur, no frosted panel, no bordered card.

**The Shadow-Band Hatch Rule.** Hatching marks only the darkest cel band (crosshatch in the very darkest). It never sits on lit surfaces, sky or far fog.

## Shapes

DOM shapes are square and borderless: controls have no fill, no border and no radius. The only rounding is the 2px corner on the ochre focus ring (2px outline, 4px offset). Underlines are 1px and drawn in, offset 7px on controls and 6px on the back link. In the scene, edges are ink lines whose weight falls off with distance (about 1.6px near to 0.9px far), and the shelf plaque carries a printed ink border. Icons are an authored set on a 20px box with a 1.75px round-capped stroke (Pause at 2.4px).

## Components

### Masthead
Quiet set text over the scene's top edge.
- **Brand:** title type in limewash, links home.
- **Index:** the section names written out (no "Index" toggle). A 1px underline grows from the left over 220ms with the ease-out curve, on hover (fine pointers only), focus, and `aria-current="page"`.
- **Skip link ("Skip the room"):** the one filled element, limewash with green-black text at 600, hidden above the viewport until focused, sliding in over 160ms.

### Set-Text Choices (left / right)
- **Style:** label type at 1.0625rem, limewash, ink halo, arrow icon on the side the object stands.
- **Appearance:** fade and slide in from 8px toward the outer edge (220ms ease-out) only while the visitor is choosing. Otherwise they are hidden and out of the tab order.
- **Hot / Focus:** ochre with an underline in currentColor. Hot state follows the 3D hover.
- **Active:** scale 0.97.

### Focus Panel
Set text that appears where the object leaves room (260ms rise from 8px).
- **Play / Pause:** ochre at 650 with a play or pause icon, `aria-pressed`.
- **Track list:** an ordered list of 500-weight buttons (40px). The current track is ochre and underlined.
- **Step back:** limewash label with the up-stroke icon. Underlines on hover.

### Now-Playing Line
Caption type bottom-left with the title (and "(placeholder)" when relevant) and a 44px icon-only Pause button. A status region, shown only while audio plays and the player is not in focus.

### Section Page
Green-black page, the masthead with the current section marked, a display heading, a faded-limewash blurb, and an ochre "Back to the room" link with a 1px underline. The link scales to 0.97 when pressed.

### Shelf Label Plaque (in scene)
A paper plaque hanging from the shelf's front edge. Plaque paper with an inked 5px border and the section name in print ink at 600, centred. When hot, the paper lightens to lit plaque paper and an ink underline is drawn beneath the name.

### Record Sleeve (in scene)
A salmon bookcloth sleeve with a hand-drawn double ink ring (the record seen from above), the brand name at 700, "Side A" at 500, and a numbered, hairline-ruled track list. The current track is 700 on a 14% ink band, with three ink bars while it plays.

## Do's and Don'ts

### Do:
- **Do** set every interface word as text over the scene, with the ink halo for legibility.
- **Do** reserve ochre for hot, current, primary and focus states.
- **Do** keep Bricolage Grotesque as the only face, including text painted into the scene.
- **Do** take new colours from the room's materials and let the screen pass ink, hatch and grade them.
- **Do** place a control where its object stands in the room, with an arrow pointing toward it.
- **Do** keep targets at least 44px tall and keep motion on the ease-out curve (cubic-bezier(0.23, 1, 0.32, 1)), cut to 0ms under reduced motion.
- **Do** paint world text (labels, sleeves, frames) onto canvas materials in print ink, as objects in the room.

### Don't:
- **Don't** put boxes, cards, glass or blur behind DOM text. The skip link is the only fill.
- **Don't** add a light theme or a second palette. The scene is the page.
- **Don't** hatch lit surfaces or smooth the cel bands into gradients.
- **Don't** use oxblood or any colour other than ochre to signal interaction.
