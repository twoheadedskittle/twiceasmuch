# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) + TypeScript, deployed to Vercel, no backend or database. Three.js through React Three Fiber and drei; GSAP ScrollTrigger drives the scroll-linked camera timeline. Chosen by the owner in the brief.

## Users

Visitors to the owner's personal-project brand: people who arrive from a link to look around, read, listen, and maybe write back by post. They come on a laptop first, on a phone second, with time to wander rather than a task to finish.

## Product Purpose

A portfolio for one person's personal project, entered as a place rather than a page: a first-person walk through a small reading room, where a bookshelf leads to the written and drawn work and a record player plays the owner's own songs. Success is a visitor who walks in, finds a shelf or a record, and stays long enough to discover the hallway behind them.

## Positioning

The site is the room. Sections are objects in it (shelf labels, a record sleeve), and the archive of artwork hangs in an endless hallway behind the reader, so the work is met in place instead of listed.

## Capabilities and Constraints

- Sections, links, songs and artwork are driven from one config file (`src/config/site.ts`); adding a section must never require touching scene code.
- Sections at launch: Artwork (`/artwork`), Books (`/books`), Snail Mail (`/snail-mail`). More will be added.
- Audio plays only after a visitor's gesture (browser autoplay rules).
- Target: 60fps on a mid-range laptop; simplified touch fallback on phones.
- Must work without the 3D scene: a visible plain-links index and keyboard navigation.
- Brand name is not final: the working name is "twice as much" (from the repository), held in config.

## Brand Commitments

- Visual direction pinned by the owner: semi-realistic 3D with a comic touch, toon/cel shading, soft ink outlines, painterly textures; warm grading in the room, cold desaturated grading in the hallway. References live in `/references`.
- Hallway is horror-tinged but atmospheric, never gory.
- Window views are original artwork made for this site (the Maori Sakai illustrations in `/references/window` are reference only and must not ship).
- The oxblood mark in `/references/palette/03-oxblood-mark.png` is not the owner's logo; reference only.

## Evidence on Hand

None yet. Songs, artwork images, book entries and a hand model do not exist; every slot ships as a labelled placeholder until the owner supplies the file. Nothing is to be invented as real work.

## Product Principles

1. The room is the navigation: every link is also an object you can walk to.
2. Nothing is gated by the scene: plain links, keyboard and reduced motion always reach the same content.
3. Quiet first, strange second: the cozy room earns the hallway.
4. Content lives in config; the scene only renders it.

## Accessibility & Inclusion

Keyboard navigation throughout, a visible skip / plain-links index, `prefers-reduced-motion` support (no camera travel, cuts instead of flights), audio never starts on its own.
