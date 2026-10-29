"use client";

import { useRef, useState, useTransition } from "react";
import { clsx } from "clsx";
import { Loader2, ShieldCheck, Upload, X } from "@/components/icons";
import { Button } from "@/components/ui";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { acceptDeclaration, confirmUpload, prepareUpload } from "../actions";

const BUCKET = "case-documents";

export function Uploader({ docId, label, declared, replace }: { docId: string; label: string; declared: boolean; replace: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [pending, start] = useTransition();
  const [hasDeclared, setHasDeclared] = useState(declared);

  const pick = () => (hasDeclared ? input.current?.click() : dialog.current?.showModal());

  const upload = (file: File) =>
    start(async () => {
      setError(null);
      const prep = await prepareUpload(docId, file.name, file.size);
      if (!prep.ok) {
        if (prep.needsDeclaration) dialog.current?.showModal();
        setError(prep.error);
        return;
      }
      let path: string | null = null;
      if (prep.mode === "signed") {
        const { error: upErr } = await supabaseBrowser()
          .storage.from(BUCKET)
          .uploadToSignedUrl(prep.path, prep.token, file, { contentType: file.type || "application/octet-stream" });
        if (upErr) {
          setError("Upload failed — check your connection and try again.");
          return;
        }
        path = prep.path;
      }
      try {
        await confirmUpload(docId, path, file.name);
      } catch {
        setError("We couldn't confirm the upload. Please try again.");
      }
    });

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files[0];
        if (!f) return;
        if (hasDeclared) upload(f);
        else dialog.current?.showModal();
      }}
      className={clsx("flex flex-col items-end gap-1 rounded-full transition", drag && "ring-2 ring-gold/60")}
    >
      <input
        ref={input}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,application/pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      <Button size="sm" variant={replace ? "outline" : "primary"} onClick={pick} disabled={pending} aria-label={`Upload ${label}`}>
        {pending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        {pending ? "Encrypting…" : replace ? "Replace" : "Upload"}
      </Button>
      {error && <span className="max-w-[220px] text-right text-xs text-danger">{error}</span>}

      <dialog
        ref={dialog}
        className="glass-strong m-auto w-[min(460px,calc(100vw-32px))] rounded-3xl p-0 text-text backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        <div className="p-6">
          <div className="flex items-start justify-between">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold/15 text-gold">
              <ShieldCheck size={22} />
            </span>
            <button aria-label="Close" onClick={() => dialog.current?.close()} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10">
              <X size={18} />
            </button>
          </div>
          <h2 className="mt-4 font-display text-xl">One-time declaration</h2>
          <p className="mt-2 text-sm text-muted">
            I confirm the documents I upload are genuine and unaltered. I understand Osagie &amp; Co. will end its services if a document is not genuine.
          </p>
          <Button
            className="mt-6 w-full"
            onClick={() =>
              start(async () => {
                await acceptDeclaration();
                setHasDeclared(true);
                dialog.current?.close();
                setError(null);
                input.current?.click();
              })
            }
          >
            I confirm — choose file
          </Button>
        </div>
      </dialog>
    </div>
  );
}
