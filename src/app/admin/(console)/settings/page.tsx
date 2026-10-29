import type { Metadata } from "next";
import { Button, Card, Field, Flag, Hud } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { repo } from "@/lib/repo";
import { saveFx, saveProductPrice, saveQuickTags, saveRoute } from "../../actions";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireAdmin();
  const [settings, products, routes, deletions] = await Promise.all([
    repo.getSettings(),
    repo.getProducts(),
    repo.getRoutes(),
    repo.listDeletionRequests(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Hud className="text-cyan">{"// Configuration"}</Hud>
        <h1 className="mt-2 font-display text-3xl">Settings</h1>
        <p className="mt-2 text-sm text-muted">Changes apply immediately to the readiness check and checkout. No deploy needed.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <h2 className="font-display text-lg">Exchange rate</h2>
          <form action={saveFx} className="mt-4 space-y-3">
            <Field label="₦ per €1" hint={`Updated ${settings.fxUpdatedAt}`}>
              <input name="rate" type="number" step="1" defaultValue={settings.fxNgnPerEur} className="field" />
            </Field>
            <Button size="sm" type="submit">Save rate</Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-lg">Prices</h2>
          {products.map((p) => (
            <form key={p.id} action={saveProductPrice} className="mt-4 space-y-3">
              <input type="hidden" name="productId" value={p.id} />
              <Field label={`${p.name} (₦)`}>
                <input name="price" inputMode="numeric" defaultValue={p.priceKobo / 100} className="field" />
              </Field>
              <Button size="sm" type="submit">Save price</Button>
            </form>
          ))}
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-lg">Review quick tags</h2>
          <form action={saveQuickTags} className="mt-4 space-y-3">
            <textarea name="tags" rows={6} defaultValue={settings.quickTags.join("\n")} className="field resize-y text-sm" />
            <Button size="sm" type="submit">Save tags</Button>
          </form>
        </Card>
      </div>

      <div>
        <h2 className="font-display text-xl">Routes &amp; thresholds</h2>
        <p className="mt-1 text-sm text-muted">Verify each figure against the official source, then set the verified date. Unverified routes show &ldquo;pending verification&rdquo; publicly.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {routes.map((r) => (
          <Card key={r.id} glow={!r.verifiedAt} className="p-6">
            <div className="flex items-center gap-3">
              <Flag country={r.country} />
              <h3 className="font-medium">{r.name}</h3>
            </div>
            <p className={`mt-2 text-xs ${r.verifiedAt ? "text-ok" : "text-warn"}`}>
              {r.verifiedAt ? `Verified ${formatDate(r.verifiedAt)}` : "Not verified yet"}
            </p>
            <form action={saveRoute} className="mt-4 space-y-3">
              <input type="hidden" name="routeId" value={r.id} />
              {r.funds.kind === "monthly_by_age" ? (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="€/month under 24"><input name="under24" type="number" step="0.01" defaultValue={r.funds.under24Eur} className="field" /></Field>
                  <Field label="€/month 24+"><input name="from24" type="number" step="0.01" defaultValue={r.funds.from24Eur} className="field" /></Field>
                </div>
              ) : (
                <Field label="€/month"><input name="monthly" type="number" step="0.01" defaultValue={r.funds.monthlyEur} className="field" /></Field>
              )}
              <Field label="Months to show"><input name="months" type="number" defaultValue={r.funds.months} className="field" /></Field>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Funds wt"><input name="wFunds" type="number" defaultValue={r.weights.funds} className="field" /></Field>
                <Field label="Docs wt"><input name="wDocs" type="number" defaultValue={r.weights.documents} className="field" /></Field>
                <Field label="Route wt"><input name="wRoute" type="number" defaultValue={r.weights.route} className="field" /></Field>
              </div>
              <Field label="Official source URL"><input name="sourceUrl" type="url" defaultValue={r.sourceUrl} className="field" /></Field>
              <Field label="Verified on"><input name="verifiedAt" type="date" defaultValue={r.verifiedAt?.slice(0, 10) ?? ""} className="field" /></Field>
              <Button size="sm" type="submit">Save route</Button>
            </form>
          </Card>
        ))}
      </div>

      <Card id="deletions" className="scroll-mt-24 p-6">
        <h2 className="font-display text-lg">Deletion requests</h2>
        <p className="mt-1 text-sm text-muted">Complete within 30 days (NDPA 2023). Keep payment records for 6 years; delete documents and profile data.</p>
        <ul className="mt-4 divide-y divide-line text-sm">
          {deletions.map((d) => (
            <li key={d.id} className="flex justify-between py-3">
              <span>{d.profile.fullName} <span className="text-dim">· {d.profile.email}</span></span>
              <span className="text-dim">requested {formatDate(d.requestedAt)}</span>
            </li>
          ))}
          {deletions.length === 0 && <li className="py-3 text-dim">None open.</li>}
        </ul>
      </Card>
    </div>
  );
}
