"use client";

import { useRef } from "react";
import { X } from "@/components/icons";
import type { LegalDoc } from "@/lib/legal";

/** Required consent checkbox; agreement texts open in an in-page dialog. */
export function AgreementConsent({ docs, scope }: { docs: LegalDoc[]; scope?: string[] }) {
  const refs = useRef<Record<string, HTMLDialogElement | null>>({});
  const open = (slug: string) => refs.current[slug]?.showModal();
  return (
    <>
      <label className="flex gap-3 rounded-2xl border border-line bg-white/[0.02] p-4 text-sm text-muted">
        <input type="checkbox" name="agree" required className="mt-1 h-4 w-4 shrink-0 accent-[#f2c46d]" />
        <span>
          I agree to the{" "}
          <button type="button" className="text-text underline underline-offset-2" onClick={() => open(docs[0].slug)}>
            {docs[0].title}
          </button>{" "}
          and{" "}
          <button type="button" className="text-text underline underline-offset-2" onClick={() => open(docs[1].slug)}>
            {docs[1].title}
          </button>
          . I understand fees cover advice and process support, and do not guarantee any visa or permit decision by foreign
          authorities.
        </span>
      </label>
      {docs.map((d) => (
        <dialog
          key={d.slug}
          ref={(el) => {
            refs.current[d.slug] = el;
          }}
          className="glass-strong m-auto max-h-[85dvh] w-[min(680px,calc(100vw-32px))] rounded-3xl p-0 text-text backdrop:bg-black/70 backdrop:backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        >
          <div className="sticky top-0 flex items-center justify-between border-b border-line bg-panel/90 px-6 py-4 backdrop-blur">
            <h2 className="font-display text-lg">{d.title}</h2>
            <button type="button" aria-label="Close" onClick={() => refs.current[d.slug]?.close()} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10">
              <X size={18} />
            </button>
          </div>
          <div className="space-y-5 px-6 py-5 text-sm leading-relaxed text-muted">
            {scope && d.slug === "advisory-agreement" && (
              <section>
                <h3 className="font-medium text-text">Package scope</h3>
                <ul className="mt-1 list-disc pl-5">{scope.map((s) => <li key={s}>{s}</li>)}</ul>
              </section>
            )}
            {d.sections.map((s) => (
              <section key={s.heading}>
                <h3 className="font-medium text-text">{s.heading}</h3>
                {s.body.map((p) => (
                  <p key={p} className="mt-1">{p}</p>
                ))}
              </section>
            ))}
          </div>
        </dialog>
      ))}
    </>
  );
}
