"use server";

import { z } from "zod";
import { env, isDemo } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";

export type LoginState = { sent?: string; error?: string } | undefined;

export async function sendMagicLink(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = z.email().safeParse(String(form.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { error: "Enter a valid email address." };
  const next = String(form.get("next") ?? "/portal");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/portal";
  if (isDemo) return { sent: email.data };

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: {
      shouldCreateUser: false, // accounts are created on first payment
      emailRedirectTo: `${env.siteUrl}/auth/confirm?next=${encodeURIComponent(safeNext)}`,
    },
  });
  // Same response whether or not the account exists, to avoid leaking who is a client.
  if (error && !/signups not allowed|not found/i.test(error.message)) {
    console.error("[auth] magic link", error.message);
    return { error: "We couldn't send the link just now. Please try again." };
  }
  return { sent: email.data };
}
