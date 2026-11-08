/**
 * Navigation out of the scene. Experience sets `go` to the Next router;
 * scene components call it without needing router context inside the Canvas.
 */
export const nav = {
  go: (href: string) => {
    window.location.assign(href);
  },
};

export function setCursor(kind: "pointer" | "auto") {
  document.body.style.cursor = kind;
}
