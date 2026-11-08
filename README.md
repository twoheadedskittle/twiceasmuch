# twiceasmuch

A portfolio you walk into. Scroll to cross a small reading room toward a rainy window; the bookshelf on the left leads to the sections, the record player on the right plays the songs. Keep scrolling and the room turns around: the wall behind you opens onto a hallway of framed artwork that never ends.

Next.js (App Router) + TypeScript, React Three Fiber + drei, GSAP ScrollTrigger. No backend. Deploys to Vercel as-is.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build, what Vercel runs
```

Add `?at=0.5` to the URL to open the walk partway through (0 to 1 is the room walk). Add `?sky=night` (or `dawn`, `clear`, `overcast`, `rain`, `golden`, `dusk`) to hold the weather on one look.

## Add content: `src/config/site.ts`

Everything a visitor can reach is in this one file. Scene code never needs to change.

| What | Where in `site.ts` | Files go in |
|---|---|---|
| Shelf sections (each becomes `/<slug>`) | `sections` | (page content: `src/app/[slug]/page.tsx`) |
| Songs on the record sleeve | `tracks` (`title`, `src`) | `public/audio/` (MP3 or M4A) |
| Artwork in the hallway frames | `artwork` (`title`, `src`) | `public/artwork/` (WebP, max 1600 px tall) |
| Your own hands model | `scene.handsModel` | `public/models/` (glTF/GLB) |
| Site name | `name` | |
| Scroll length, hallway pace | `scene.scrollScreens`, `scene.hallMetersPerScreen` | |
| How often the weather outside turns | `scene.outdoorCycleMinutes` (default 3) | |
| Hover time before stepping up to a frame | `scene.frameDwellSeconds` | |
| Where "Buy?" goes | `artwork[].buyUrl`, else `shop.fallbackBuyUrl` | |

A shelf gets taller automatically when you add a section. Tracks with `src: null` play a quiet synthesized placeholder (crackle and a chord) so the player can be tested; artwork with `src: null` shows a labelled placeholder frame.

### What you still need to provide

- **Songs**: audio files plus their titles.
- **Artwork**: images plus titles. WebP keeps the hallway light; KTX2 is only worth it past ~20 large pieces.
- **Hands**: optional. The placeholder hands are built from primitives. A replacement GLB should contain both hands posed together, origin between them, -Z forward, roughly 0.5 m in front of the eye; set `scene.handsModel: "/models/hands.glb"`.
- **Shop link**: `shop.fallbackBuyUrl` is a placeholder `mailto:`. Set a real shop or email, or a `buyUrl` per piece.
- **Section pages**: each currently shows its placeholder `blurb`. Write the real pages in `src/app/[slug]/page.tsx` (or give a section its own folder, e.g. `src/app/books/page.tsx`, which takes precedence).
- **Brand name**: "twice as much" is a working name taken from this repo.

## How it is built

```
src/config/site.ts        all content
src/components/           Experience (canvas, scroll, input), Hud (buttons, panels), SiteIndex (plain links)
src/scene/rig.ts          shared per-frame state and room dimensions
src/scene/timeline.ts     the scroll-scrubbed camera walk (GSAP ScrollTrigger)
src/scene/CameraRig.tsx   applies walk + hallway distance + focus blend to the camera
src/scene/focus.ts        walk to the shelf / record player and back (interruptible)
src/scene/Room.tsx        room shell, window, reading corner, panel wall, lights
src/scene/Furniture.tsx   bookshelf (labels) and record player (deck, sleeve)
src/scene/Ink.tsx         ink line, hatching, grade, grain, bloom (post-processing)
src/scene/Hallway.tsx     recycled hallway segments, frames, lamps, fog and grade
src/scene/lsystem.ts      seeded L-system plants (wallpaper relief, the tree outside)
src/scene/textures.ts     every texture, painted on canvas at load (nothing downloaded)
src/scene/Hands.tsx       first-person hands, walk bob and sway
src/audio/player.ts       the record player's audio (starts only on a click)
```

- **Endless hallway**: nine 3 m segments are recycled as you walk; segment `k` always grows the same plants (seeded by `k`), so walking back shows the same corridor. The scroll track grows as you near its end.
- **Relief wallpaper**: each wall panel is a bump map grown from L-systems (umbellifers, grasses, sprigs), generated in idle time and cached (32 panels).
- **Look**: cel-shaded `MeshToonMaterial` with a three-band ramp and canvas-painted materials (limewash, sage paint, oak boards, bookcloth). One screen pass (`src/scene/Ink.tsx`) draws the ink line from depth and normal edges, hatches the darkest shadows, adds paper grain, and grades warm in the room to cold, desaturated blue-grey in the hallway.
- **Performance**: instanced books, three real lights in the hallway regardless of length, textures generated off the main path, resolution drops automatically if frames slip. The ink pass renders scene normals once more per frame; on a struggling machine, lowering `dpr` in `Experience.tsx` is the first lever.
- **Outdoors**: a physical sky (sun, Rayleigh and Mie scattering), drifting clouds, farmland, hedgerows, copses and ridges in aerial-perspective haze, a 520-bird murmuration (boids with wandering attractors), stars at night. The weather cycles dawn, clear, overcast, rain, golden hour, dusk, night; the light through the window follows it.
- **Hallway frames**: rest the pointer on a frame and a ring fills; you then step up to it, with "Buy?" below and an arrow back to the hallway. A tap or click goes straight there.
- **Accessibility**: the section links live on the bookshelf; a keyboard-only index (revealed on focus) and a "Skip the room" link stay in the page for keyboard and screen-reader users; every in-scene choice has a keyboard and touch button; Escape steps back; audio never autoplays. With `prefers-reduced-motion`, the walk becomes still stations joined by cuts, and lamps stop flickering.

## Deploy

1. Push to GitHub (see below).
2. On vercel.com: **Add New → Project → Import** `twoheadedskittle/twiceasmuch`. Framework preset: Next.js. No environment variables. **Deploy**.
3. Every later push to `main` redeploys.

References for the look live in `/references` (not shipped to the site).
