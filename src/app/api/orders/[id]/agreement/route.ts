import { NextResponse } from "next/server";
import { agreementPdf } from "@/lib/agreement-pdf";
import { getViewer } from "@/lib/auth";
import { repo } from "@/lib/repo";

export async function GET(_req: Request, { params }: RouteContext<"/api/orders/[id]/agreement">) {
  const { id } = await params;
  const viewer = await getViewer();
  const order = await repo.getOrder(id);
  if (!viewer || !order || order.status !== "paid" || (viewer.role === "client" && order.profileId !== viewer.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const offer = order.packageOfferId ? await repo.getOffer(order.packageOfferId) : null;
  const pdf = await agreementPdf(order, offer);
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="agreement-${order.reference}.pdf"`,
    },
  });
}
