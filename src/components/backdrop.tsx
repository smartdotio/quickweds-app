/** Fixed ambient layer: aurora blobs, star dust, noise. Pure CSS — no JS. */
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute -top-[30%] -left-[20%] h-[80vmax] w-[80vmax] animate-aurora rounded-full bg-[radial-gradient(circle,rgba(242,196,109,0.16),transparent_60%)] blur-3xl" />
      <div
        className="absolute -right-[25%] top-[10%] h-[70vmax] w-[70vmax] animate-aurora rounded-full bg-[radial-gradient(circle,rgba(91,231,224,0.12),transparent_60%)] blur-3xl"
        style={{ animationDelay: "-7s" }}
      />
      <div
        className="absolute -bottom-[40%] left-[20%] h-[70vmax] w-[70vmax] animate-aurora rounded-full bg-[radial-gradient(circle,rgba(155,140,255,0.12),transparent_60%)] blur-3xl"
        style={{ animationDelay: "-14s" }}
      />
      <div className="dot-grid absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,#000_20%,transparent_75%)]" />
      <div className="noise absolute inset-0 opacity-70 mix-blend-overlay" />
    </div>
  );
}
