"use client";

import { useActionState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { Button, Field } from "@/components/ui";
import { sendMagicLink, type LoginState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendMagicLink, undefined);
  if (state?.sent) {
    return (
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ok/15 text-ok">
          <MailCheck size={26} />
        </span>
        <p className="mt-4 font-display text-xl">Check your inbox</p>
        <p className="mt-2 text-sm text-muted">
          If <span className="text-text">{state.sent}</span> has a portal account, a sign-in link is on its way. It expires in 1 hour.
        </p>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Email" error={state?.error}>
        <input name="email" type="email" autoComplete="email" required className="field" placeholder="you@example.com" />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" size={18} />} Email me a sign-in link
      </Button>
    </form>
  );
}
