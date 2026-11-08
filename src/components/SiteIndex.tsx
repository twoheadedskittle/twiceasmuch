import Link from "next/link";
import { site } from "@/config/site";

/**
 * The plain-links way in. Always visible, always first in tab order after
 * the skip link, and the whole site when WebGL or JavaScript is missing.
 */
export function SiteIndex({ current }: { current?: string }) {
  return (
    <header className="masthead">
      <a className="skip" href="#index">
        Skip the room
      </a>
      <Link className="brand" href="/">
        {site.name}
      </Link>
      <nav id="index" aria-label="Sections" tabIndex={-1}>
        <ul>
          {site.sections.map((s) => (
            <li key={s.slug}>
              <Link href={`/${s.slug}`} aria-current={current === s.slug ? "page" : undefined}>
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
