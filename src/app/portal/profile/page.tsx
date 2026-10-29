import type { Metadata } from "next";
import { Download, LogOut, Trash2 } from "lucide-react";
import { Button, ButtonLink, Card, Hud } from "@/components/ui";
import { requireClient } from "@/lib/auth";
import { formatDate, formatNgn } from "@/lib/format";
import { repo } from "@/lib/repo";
import { requestDeletion } from "../actions";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const viewer = await requireClient();
  const caseId = await repo.getActiveCaseIdForClient(viewer.id);
  const c = caseId ? await repo.getCase(caseId) : null;
  const pendingDeletion = (await repo.listDeletionRequests()).some((d) => d.profile.id === viewer.id);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <div>
          <Hud className="text-gold">Account</Hud>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl">Profile</h1>
        </div>
        <Card className="p-6">
          <ProfileForm fullName={viewer.fullName} phone={viewer.phone ?? ""} email={viewer.email} />
        </Card>
        <form action="/auth/signout" method="post">
          <Button variant="ghost" type="submit">
            <LogOut size={16} /> Sign out
          </Button>
        </form>
      </div>

      <div className="space-y-6 lg:pt-[4.5rem]">
        <Card className="p-6">
          <h2 className="font-display text-lg">Payments &amp; agreements</h2>
          <ul className="mt-4 divide-y divide-line">
            {(c?.orders ?? []).filter((o) => o.status === "paid").map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p>{o.productName}</p>
                  <p className="font-mono text-xs text-dim">
                    {o.reference} · {o.paidAt && formatDate(o.paidAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono">{formatNgn(o.amountKobo)}</span>
                  <a href={`/api/orders/${o.id}/agreement`} className="text-xs text-gold hover:underline">PDF</a>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-lg">Your data</h2>
          <p className="mt-2 text-sm text-muted">
            Under the Nigeria Data Protection Act 2023 you can download or ask us to delete your data. Deletion requests are completed within 30 days.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <ButtonLink href="/api/me/export" variant="outline" size="sm" prefetch={false}>
              <Download size={14} /> Download my data
            </ButtonLink>
            {pendingDeletion ? (
              <span className="inline-flex h-9 items-center rounded-full border border-warn/30 bg-warn/10 px-4 text-sm text-warn">Deletion requested</span>
            ) : (
              <form action={requestDeletion}>
                <Button variant="danger" size="sm" type="submit">
                  <Trash2 size={14} /> Request deletion
                </Button>
              </form>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
