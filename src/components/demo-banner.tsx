import { isDemo } from "@/lib/env";

export function DemoBanner() {
  if (!isDemo) return null;
  return (
    <div className="relative z-[60] border-b border-violet/20 bg-violet/10 px-4 py-2 text-center text-xs text-violet backdrop-blur">
      <span className="hud mr-2 text-violet">Demo mode</span>
      Sample data, simulated payments and bookings. Add Supabase, Paystack and Cal.com keys to go live.
    </div>
  );
}
