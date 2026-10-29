"use client";

import { useActionState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button, Field } from "@/components/ui";
import { updateProfile, type ProfileState } from "../actions";

export function ProfileForm({ fullName, phone, email }: { fullName: string; phone: string; email: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, undefined);
  return (
    <form action={action} className="space-y-4">
      <Field label="Full name">
        <input name="fullName" defaultValue={fullName} required className="field" />
      </Field>
      <Field label="WhatsApp number">
        <input name="phone" defaultValue={phone} required className="field" />
      </Field>
      <Field label="Email" hint="Contact us to change">
        <input value={email} disabled className="field opacity-60" />
      </Field>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 size={16} className="animate-spin" /> : state?.ok ? <Check size={16} /> : null}
        {state?.ok ? "Saved" : "Save changes"}
      </Button>
    </form>
  );
}
