import { ButtonLink, Hud } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="grid flex-1 place-items-center px-4 py-24 text-center">
      <div>
        <Hud className="text-gold">Error 404 · signal lost</Hud>
        <h1 className="mt-4 font-display text-5xl sm:text-7xl">Off the map.</h1>
        <p className="mt-4 text-muted">This page doesn&apos;t exist, or the link has expired.</p>
        <ButtonLink href="/" className="mt-8">Back to base</ButtonLink>
      </div>
    </main>
  );
}
