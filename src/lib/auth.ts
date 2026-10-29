import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { isDemo } from "./env";
import { repo } from "./repo";
import { DEMO_ADMIN_ID, DEMO_CLIENT_ID } from "./repo/demo";
import { supabaseServer } from "./supabase/server";
import type { Profile } from "./types";

export const DEMO_AS_COOKIE = "osg_demo_as";

/** The signed-in profile, or null. In demo mode, a seeded client (or the one who just paid). */
export const getViewer = cache(async (): Promise<Profile | null> => {
  if (isDemo) {
    const id = (await cookies()).get(DEMO_AS_COOKIE)?.value ?? DEMO_CLIENT_ID;
    return (await repo.getProfile(id)) ?? (await repo.getProfile(DEMO_CLIENT_ID));
  }
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return repo.getProfile(data.user.id);
});

export async function requireClient(): Promise<Profile> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/portal");
  return viewer;
}

/** Staff must be signed in with MFA (aal2). */
export const requireStaff = cache(async (): Promise<Profile> => {
  if (isDemo) return (await repo.getProfile(DEMO_ADMIN_ID))!;
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/admin");
  if (viewer.role === "client") redirect("/portal");
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (data?.currentLevel !== "aal2") redirect("/admin/mfa");
  return viewer;
});

export async function requireAdmin(): Promise<Profile> {
  const staff = await requireStaff();
  if (staff.role !== "admin") redirect("/admin");
  return staff;
}
