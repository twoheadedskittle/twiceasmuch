"use client";

import dynamic from "next/dynamic";

// WebGL never renders on the server; the plain index carries the page there.
const Experience = dynamic(() => import("./Experience"), { ssr: false });

export function ExperienceLoader() {
  return <Experience />;
}
