/** A small authored icon set: one 1.75px stroke, round caps, 20px box. */

type P = { className?: string };
const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const ArrowLeft = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M16 10H4M9 5l-5 5 5 5" />
  </svg>
);

export const ArrowRight = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M4 10h12M11 5l5 5-5 5" />
  </svg>
);

export const Play = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M6.5 4.5v11l9-5.5-9-5.5z" fill="currentColor" stroke="none" />
  </svg>
);

export const Pause = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M7 4.5v11M13 4.5v11" strokeWidth={2.4} />
  </svg>
);

export const StepBack = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M10 16V4M5 9l5-5 5 5" />
  </svg>
);
