import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CalendarCheck2, Video } from "@/components/icons";
import { DemoBanner } from "@/components/demo-banner";
import { SiteHeader } from "@/components/site-header";
import { ButtonLink, Card, Hud } from "@/components/ui";
import { calEmbedUrl } from "@/lib/cal";
import { calEnabled } from "@/lib/env";
import { formatDateTime } from "@/lib/format";
import { repo } from "@/lib/repo";
import { SlotPicker } from "./slot-picker";

export const metadata: Metadata = { title: "Book your session", robots: { index: false } };

export default async function BookPage({ params }: PageProps<"/book/[orderId]">) {
  const { orderId } = await params;
  const order = await repo.getOrder(orderId);
  if (!order || order.kind !== "session") notFound();
  if (order.status !== "paid") redirect("/checkout");
  const booking = await repo.getBookingForOrder(order.id);

  return (
    <>
      <DemoBanner />
      <SiteHeader />
      <main className="flex-1 px-4 pb-24 pt-8 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Hud className="text-ok">Payment confirmed · {order.reference}</Hud>
          <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">
            {booking ? "You're booked." : `Pick a time, ${order.fullName.split(" ")[0]}.`}
          </h1>
          <p className="mt-2 text-muted">
            {booking ? "A calendar invite and your agreement copy are in your inbox." : "45 minutes, 1-on-1, by video. Reschedule up to 24 hours before."}
          </p>

          {booking ? (
            <Card glow className="mt-8 p-6 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ok/15 text-ok">
                    <CalendarCheck2 size={26} />
                  </span>
                  <div>
                    <p className="font-display text-xl">{formatDateTime(booking.startsAt)}</p>
                    <p className="text-sm text-muted">Strategy Session · 45 min</p>
                  </div>
                </div>
                {booking.meetingUrl && (
                  <a href={booking.meetingUrl} className="inline-flex items-center gap-2 text-sm text-cyan hover:underline" target="_blank" rel="noreferrer">
                    <Video size={16} /> Join link
                  </a>
                )}
              </div>
              <ButtonLink href="/portal" size="lg" className="mt-8 w-full">
                Open your client portal
              </ButtonLink>
            </Card>
          ) : calEnabled ? (
            <Card className="mt-8 overflow-hidden p-0">
              <iframe
                src={calEmbedUrl({ orderId: order.id, name: order.fullName, email: order.email })}
                title="Book your session"
                className="h-[720px] w-full"
              />
              <div className="border-t border-line p-4 text-center">
                <ButtonLink href={`/book/${order.id}`} variant="ghost" size="sm">
                  I&apos;ve booked — refresh
                </ButtonLink>
              </div>
            </Card>
          ) : (
            <Card glow className="mt-8 p-5 sm:p-8">
              <SlotPicker orderId={order.id} />
            </Card>
          )}
        </div>
      </main>
    </>
  );
}
