"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "@/components/icons";
import { Button, Field } from "@/components/ui";
import { supabaseBrowser } from "@/lib/supabase/browser";

export function MfaForm() {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sb = supabaseBrowser();
    (async () => {
      const { data } = await sb.auth.mfa.listFactors();
      const verified = data?.totp.find((f) => f.status === "verified");
      if (verified) return setFactorId(verified.id);
      // Clean up abandoned enrolments, then enrol fresh.
      for (const f of data?.all.filter((f) => f.status === "unverified") ?? []) await sb.auth.mfa.unenroll({ factorId: f.id });
      const { data: enrol, error } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: `Authenticator ${Date.now()}` });
      if (error || !enrol) return setError("Couldn't start enrolment. Refresh to retry.");
      setFactorId(enrol.id);
      setQr(enrol.totp.qr_code);
      setSecret(enrol.totp.secret);
    })();
  }, []);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    setBusy(true);
    setError(null);
    const { error } = await supabaseBrowser().auth.mfa.challengeAndVerify({ factorId, code });
    setBusy(false);
    if (error) return setError("That code didn't work. Try the latest one.");
    router.replace("/admin");
    router.refresh();
  };

  return (
    <form onSubmit={verify} className="space-y-4">
      {qr && (
        <div className="space-y-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Scan with your authenticator app" className="mx-auto h-44 w-44 rounded-2xl bg-white p-2" />
          <p className="font-mono text-xs break-all text-dim">{secret}</p>
        </div>
      )}
      <Field label={qr ? "Scan, then enter the 6-digit code" : "Enter the 6-digit code from your app"} error={error ?? undefined}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          className="field text-center font-mono text-2xl tracking-[0.5em]"
          placeholder="••••••"
        />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={code.length !== 6 || busy || !factorId}>
        {busy && <Loader2 size={18} className="animate-spin" />} Verify
      </Button>
    </form>
  );
}
