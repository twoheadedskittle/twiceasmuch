import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteIndex } from "@/components/SiteIndex";
import { findSection, site } from "@/config/site";

export function generateStaticParams() {
  return site.sections.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const section = findSection(slug);
  return { title: section ? `${section.label} · ${site.name}` : site.name };
}

export default async function SectionPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const section = findSection(slug);
  if (!section) notFound();

  return (
    <main className="section-page">
      <SiteIndex current={section.slug} />
      <article className="section-body">
        <h1>{section.label}</h1>
        <p>{section.blurb}</p>
        <Link className="back" href="/">
          Back to the room
        </Link>
      </article>
    </main>
  );
}
