import { NextResponse, type NextRequest } from "next/server";
import { isValidCalSignature } from "@/lib/cal";
import { bookingEmail, sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { repo } from "@/lib/repo";

interface CalPayload {
  triggerEvent: "BOOKING_CREATED" | "BOOKING_RESCHEDULED" | "BOOKING_CANCELLED" | string;
  payload: {
    uid: string;
    rescheduleUid?: string;
    startTime: string;
    attendees?: { email: string; name: string }[];
    metadata?: { orderId?: string; videoCallUrl?: string };
    videoCallData?: { url?: string };
  };
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!isValidCalSignature(raw, req.headers.get("x-cal-signature-256"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }
  const { triggerEvent, payload: p } = JSON.parse(raw) as CalPayload;
  if (!["BOOKING_CREATED", "BOOKING_RESCHEDULED", "BOOKING_CANCELLED"].includes(triggerEvent)) {
    return NextResponse.json({ ok: true, ignored: triggerEvent });
  }

  const attendee = p.attendees?.[0];
  const orderId = p.metadata?.orderId ?? null;
  const status = triggerEvent === "BOOKING_CANCELLED" ? "cancelled" : "booked";
  const meetingUrl = p.videoCallData?.url ?? p.metadata?.videoCallUrl ?? null;

  if (triggerEvent === "BOOKING_RESCHEDULED" && p.rescheduleUid) {
    await repo.upsertBooking({ calUid: p.rescheduleUid, orderId, email: attendee?.email ?? "", startsAt: p.startTime, status: "cancelled", meetingUrl: null });
  }
  const booking = await repo.upsertBooking({
    calUid: p.uid,
    orderId,
    email: attendee?.email ?? "",
    startsAt: p.startTime,
    status,
    meetingUrl,
  });
  if (!booking.matched) console.warn("[cal] booking without a paid order", p.uid);

  if (attendee) await sendEmail({ to: attendee.email, ...bookingEmail(attendee.name, p.startTime, meetingUrl, status) });
  if (env.staffNotifyEmail) {
    await sendEmail({
      to: env.staffNotifyEmail,
      ...bookingEmail(`${attendee?.name ?? "Client"}${booking.matched ? "" : " (UNMATCHED — check payment)"}`, p.startTime, meetingUrl, status),
    });
  }
  return NextResponse.json({ ok: true });
}
