"use server";

import { randomUUID } from "node:crypto";
import { refresh } from "next/cache";
import { bookingEmail, sendEmail } from "@/lib/email";
import { isDemo } from "@/lib/env";
import { repo } from "@/lib/repo";

/** Demo-only stand-in for the Cal.com booking flow. */
export async function bookDemoSlot(orderId: string, startsAt: string) {
  if (!isDemo) throw new Error("Not available");
  const order = await repo.getOrder(orderId);
  if (!order || order.status !== "paid") throw new Error("Order not paid");
  if (Number.isNaN(Date.parse(startsAt)) || Date.parse(startsAt) < Date.now()) throw new Error("Invalid slot");
  const meetingUrl = `https://meet.google.com/osg-${randomUUID().slice(0, 3)}-${randomUUID().slice(0, 4)}`;
  await repo.upsertBooking({ calUid: randomUUID(), orderId, email: order.email, startsAt, status: "booked", meetingUrl });
  await sendEmail({ to: order.email, ...bookingEmail(order.fullName, startsAt, meetingUrl, "booked") });
  refresh();
}
