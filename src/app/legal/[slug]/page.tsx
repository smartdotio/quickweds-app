import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Card, Hud } from "@/components/ui";
import { AGREEMENT_VERSION } from "@/lib/env";
import { LEGAL, getLegal } from "@/lib/legal";

export function generateStaticParams() {
  return LEGAL.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps<"/legal/[slug]">): Promise<Metadata> {
  const doc = getLegal((await params).slug);
  return { title: doc?.title ?? "Legal" };
}

export default async function LegalPage({ params }: PageProps<"/legal/[slug]">) {
  const doc = getLegal((await params).slug);
  if (!doc) notFound();
  return (
    <>
      <SiteHeader />
      <main className="px-4 pt-10 sm:px-6">
        <article className="mx-auto max-w-3xl">
          <Hud className="text-gold">Version {AGREEMENT_VERSION}</Hud>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl">{doc.title}</h1>
          <p className="mt-3 text-muted">{doc.summary}</p>
          <Card className="mt-8 space-y-8 p-6 sm:p-10">
            {doc.sections.map((s) => (
              <section key={s.heading}>
                <h2 className="font-display text-lg">{s.heading}</h2>
                {s.body.map((p) => (
                  <p key={p} className="mt-2 leading-relaxed text-muted">{p}</p>
                ))}
              </section>
            ))}
          </Card>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
