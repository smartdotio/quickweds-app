import type { Metadata } from "next";
import { DemoBanner } from "@/components/demo-banner";
import { SiteHeader } from "@/components/site-header";
import { repo } from "@/lib/repo";
import { Wizard } from "./wizard";

export const metadata: Metadata = {
  title: "Readiness check",
  description: "Free 3-minute check of your documents and funds against published Austria and Germany requirements.",
};

export default async function CheckPage({ searchParams }: PageProps<"/check">) {
  const { route } = await searchParams;
  const [routes, settings] = await Promise.all([repo.getRoutes(), repo.getSettings()]);
  const initialRoute = routes.find((r) => r.slug === route)?.slug;
  return (
    <>
      <DemoBanner />
      <SiteHeader />
      <main className="flex-1 px-4 pb-24 pt-8 sm:px-6">
        <Wizard routes={routes} fx={settings.fxNgnPerEur} fxUpdatedAt={settings.fxUpdatedAt} initialRoute={initialRoute} />
      </main>
    </>
  );
}
