/**
 * Everything a visitor can reach lives here. Add a section, a song or a
 * piece of artwork by editing this file only; the scene reads from it.
 *
 * Placeholders are marked `placeholder: true` and say so on screen.
 */

export type Section = {
  /** URL segment: /artwork, /books, ... */
  slug: string;
  /** Label painted on the shelf and used in the plain index. */
  label: string;
  /** One line shown on the section page. */
  blurb: string;
  placeholder?: boolean;
};

export type Track = {
  title: string;
  /** Path under /public, e.g. "/audio/first-song.mp3". null until supplied. */
  src: string | null;
  placeholder?: boolean;
};

export type Artwork = {
  title: string;
  /** Where "Buy?" goes for this piece: a shop page, a checkout link or a mailto:. */
  buyUrl?: string;
  /** Path under /public, e.g. "/artwork/stairwell.webp". null until supplied. */
  src: string | null;
  year?: string;
  placeholder?: boolean;
};

export const site = {
  /** Working name; the brand name is not final. */
  name: "twice as much",
  description:
    "A small reading room on the internet: a shelf of books and artwork, a record player, and a hallway that keeps going.",

  /** Shelf sections, top shelf first. Each becomes a route at /<slug>. */
  sections: [
    { slug: "artwork", label: "Artwork", blurb: "Placeholder: one line about the artwork shelf.", placeholder: true },
    { slug: "books", label: "Books", blurb: "Placeholder: one line about the books shelf.", placeholder: true },
    { slug: "snail-mail", label: "Snail Mail", blurb: "Placeholder: one line about writing by post.", placeholder: true },
  ] satisfies Section[],

  /** Songs on the record sleeve, in play order. Files go in /public/audio. */
  tracks: [
    { title: "Placeholder track one", src: null, placeholder: true },
    { title: "Placeholder track two", src: null, placeholder: true },
    { title: "Placeholder track three", src: null, placeholder: true },
    { title: "Placeholder track four", src: null, placeholder: true },
  ] satisfies Track[],

  /** Frames along the hallway, nearest first. Files go in /public/artwork. */
  artwork: [
    { title: "Placeholder frame one", src: null, placeholder: true },
    { title: "Placeholder frame two", src: null, placeholder: true },
    { title: "Placeholder frame three", src: null, placeholder: true },
  ] satisfies Artwork[],

  scene: {
    /** How many screen-heights of scroll the room walk takes (window, turn, threshold). */
    scrollScreens: 8,
    /** Metres walked down the hallway per screen-height of scroll. */
    hallMetersPerScreen: 4,
    /** Path to your own hands glTF under /public (e.g. "/models/hands.glb"); null uses the placeholder. */
    handsModel: null as string | null,
    /** Minutes the weather outside holds before it turns (dawn, clear, overcast, rain, golden hour, dusk, night). */
    outdoorCycleMinutes: 3,
    /** Seconds the pointer rests on a hallway frame before you walk up to it. */
    frameDwellSeconds: 1.2,
  },

  /** Used by "Buy?" when a piece has no buyUrl of its own. Placeholder: replace with your shop or email. */
  shop: {
    fallbackBuyUrl: "mailto:hello@example.com?subject=Buying%20a%20piece",
  },
} as const;

export type SiteConfig = typeof site;

export function findSection(slug: string): Section | undefined {
  return site.sections.find((s) => s.slug === slug);
}
