import { CheckCircle2, FileCheck2, Gauge } from "lucide-react";

const ORIGIN = { x: 214, y: 404, code: "LOS", name: "Lagos", coord: "6.52°N 3.37°E" };
const TARGETS = [
  { x: 266, y: 120, code: "BER", name: "Berlin", ctrl: "120 250", delay: "0s", color: "#5be7e0" },
  { x: 318, y: 168, code: "VIE", name: "Vienna", ctrl: "330 300", delay: "-1.1s", color: "#f2c46d" },
  { x: 292, y: 176, code: "LNZ", name: "Linz", ctrl: "200 260", delay: "-2.2s", color: "#9b8cff" },
];

/** Hero visual: a holographic globe with live routes from Lagos to DACH cities. */
export function RouteOrbit() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[560px]">
      {/* Orbital rings */}
      <div className="absolute inset-[4%] rounded-full border border-white/5" />
      <div className="absolute inset-[12%] animate-[spin_60s_linear_infinite] rounded-full border border-dashed border-gold/15" />
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_45%,rgba(91,231,224,0.10),transparent_60%)]" />

      <svg viewBox="0 0 520 520" className="relative h-full w-full" role="img" aria-label="Routes from Lagos to Berlin, Vienna and Linz">
        <defs>
          <radialGradient id="globe" cx="45%" cy="38%" r="65%">
            <stop offset="0" stopColor="#1a2340" stopOpacity="0.95" />
            <stop offset="0.7" stopColor="#0a0e1c" stopOpacity="0.95" />
            <stop offset="1" stopColor="#05060b" stopOpacity="1" />
          </radialGradient>
          <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5be7e0" stopOpacity="0.8" />
            <stop offset="0.5" stopColor="#f2c46d" stopOpacity="0.2" />
            <stop offset="1" stopColor="#9b8cff" stopOpacity="0.7" />
          </linearGradient>
          <clipPath id="globe-clip">
            <circle cx="260" cy="260" r="200" />
          </clipPath>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx="260" cy="260" r="200" fill="url(#globe)" />
        <g clipPath="url(#globe-clip)" stroke="#5be7e0" strokeOpacity="0.12" fill="none">
          {[-150, -100, -50, 0, 50, 100, 150].map((dy) => (
            <ellipse key={`lat${dy}`} cx="260" cy={260 + dy} rx={Math.sqrt(200 ** 2 - dy ** 2)} ry={Math.max(4, 22 - Math.abs(dy) / 8)} />
          ))}
          {[0, 40, 80, 120, 160].map((rx) => (
            <ellipse key={`lon${rx}`} cx="260" cy="260" rx={rx} ry="200" />
          ))}
          {/* Abstract landmass dots: Europe + West Africa */}
          {DOTS.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.6" fill="#eef1f7" fillOpacity="0.35" stroke="none" />
          ))}
        </g>
        <circle cx="260" cy="260" r="200" fill="none" stroke="url(#rim)" strokeWidth="1.2" />

        {TARGETS.map((t) => {
          const d = `M${ORIGIN.x} ${ORIGIN.y} Q ${t.ctrl} ${t.x} ${t.y}`;
          return (
            <g key={t.code}>
              <path d={d} fill="none" stroke={t.color} strokeOpacity="0.18" strokeWidth="6" />
              <path d={d} fill="none" stroke={t.color} strokeWidth="1.6" strokeDasharray="4 8" className="animate-dash" filter="url(#glow)" />
              <circle r="3.5" fill="#fff" filter="url(#glow)">
                <animateMotion dur="3.4s" repeatCount="indefinite" begin={t.delay} path={d} keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.4 0 0.2 1" />
              </circle>
              <circle cx={t.x} cy={t.y} r="5" fill={t.color} filter="url(#glow)" />
              <circle cx={t.x} cy={t.y} r="10" fill="none" stroke={t.color} strokeOpacity="0.5">
                <animate attributeName="r" values="5;16" dur="2.4s" repeatCount="indefinite" begin={t.delay} />
                <animate attributeName="stroke-opacity" values="0.7;0" dur="2.4s" repeatCount="indefinite" begin={t.delay} />
              </circle>
            </g>
          );
        })}

        <circle cx={ORIGIN.x} cy={ORIGIN.y} r="7" fill="#f2c46d" filter="url(#glow)" />
        <circle cx={ORIGIN.x} cy={ORIGIN.y} r="7" fill="none" stroke="#f2c46d">
          <animate attributeName="r" values="7;22" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="0.8;0" dur="2.4s" repeatCount="indefinite" />
        </circle>

        {/* HUD labels */}
        <g fontFamily="var(--font-geist-mono)" fontSize="10" letterSpacing="1.5">
          <text x={ORIGIN.x - 92} y={ORIGIN.y + 30} fill="#f2c46d">LOS · LAGOS</text>
          <text x={ORIGIN.x - 92} y={ORIGIN.y + 44} fill="#8a93a6">{ORIGIN.coord}</text>
          <text x="282" y="108" fill="#5be7e0">BER</text>
          <text x="334" y="164" fill="#f2c46d">VIE</text>
          <text x="226" y="196" fill="#9b8cff">LNZ</text>
        </g>
      </svg>

      {/* Floating telemetry cards */}
      <div className="glass-strong absolute left-0 top-[14%] w-44 animate-float rounded-2xl p-3.5 sm:-left-6 sm:w-52">
        <div className="flex items-center gap-2 text-gold">
          <Gauge size={14} />
          <span className="hud text-gold">Readiness</span>
        </div>
        <div className="mt-2 flex items-end gap-2">
          <span className="font-display text-3xl">86</span>
          <span className="mb-1 rounded-full bg-ok/15 px-2 py-0.5 text-[0.65rem] font-medium text-ok">Ready</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[86%] rounded-full bg-[linear-gradient(90deg,#c9932e,#f2c46d,#5be7e0)]" />
        </div>
      </div>

      <div className="glass-strong absolute bottom-[16%] right-0 w-48 animate-float rounded-2xl p-3.5 [animation-delay:-2.5s] sm:-right-4 sm:w-56">
        <div className="flex items-center gap-2 text-cyan">
          <CheckCircle2 size={14} />
          <span className="hud text-cyan">Stage 4 / 6</span>
        </div>
        <p className="mt-2 text-sm leading-snug">Under review — Magistrat Linz</p>
        <div className="mt-3 flex gap-1">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${i <= 4 ? "bg-cyan shadow-[0_0_8px_#5be7e0]" : "bg-white/10"}`} />
          ))}
        </div>
      </div>

      <div className="glass-strong absolute right-[6%] top-[4%] hidden animate-float items-center gap-2 rounded-full px-3 py-2 [animation-delay:-4s] sm:flex">
        <FileCheck2 size={14} className="text-ok" />
        <span className="text-xs">8 / 8 documents verified</span>
      </div>
    </div>
  );
}

// Hand-placed dot cloud suggesting Europe (top) and West Africa (bottom).
const DOTS: [number, number][] = [
  [232, 96], [244, 92], [256, 98], [268, 94], [280, 100], [292, 104], [304, 110], [252, 110], [264, 112], [276, 116],
  [288, 120], [300, 124], [312, 128], [324, 134], [240, 120], [252, 126], [240, 136], [252, 140], [264, 132], [276, 138],
  [288, 142], [300, 146], [312, 150], [324, 156], [336, 160], [264, 150], [276, 156], [288, 160], [300, 164], [312, 172],
  [324, 178], [228, 150], [216, 160], [220, 174], [232, 168], [244, 176], [256, 184], [268, 190], [280, 198], [292, 206],
  [180, 300], [192, 296], [204, 300], [216, 304], [228, 310], [240, 316], [252, 322], [264, 328], [168, 312], [180, 318],
  [192, 322], [204, 328], [216, 334], [228, 340], [240, 346], [252, 352], [176, 330], [188, 338], [200, 346], [212, 352],
  [224, 358], [236, 364], [248, 370], [196, 360], [208, 368], [220, 376], [232, 382], [244, 388], [204, 386], [216, 394],
  [228, 400], [240, 406], [252, 412], [264, 360], [276, 370], [272, 390], [260, 400], [286, 384],
];
