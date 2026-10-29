import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatNgn } from "./format";
import { getLegal } from "./legal";
import type { Order, PackageOffer } from "./types";

/** Signed copy of the agreement the client accepted at checkout. */
export async function agreementPdf(order: Order, offer: PackageOffer | null): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const margin = 56;
  let page = pdf.addPage([595, 842]);
  let y = 842 - margin;
  const width = 595 - margin * 2;

  const write = (text: string, opts: { size?: number; f?: typeof font; color?: [number, number, number]; gap?: number } = {}) => {
    const size = opts.size ?? 10;
    const f = opts.f ?? font;
    const words = text.replace(/[^\x20-\x7E€₦]/g, (c) => (c === "—" ? "-" : c === "’" ? "'" : " ")).replace(/₦/g, "NGN ").replace(/€/g, "EUR ").split(/\s+/);
    let line = "";
    const flush = () => {
      if (y < margin + size) {
        page = pdf.addPage([595, 842]);
        y = 842 - margin;
      }
      page.drawText(line, { x: margin, y, size, font: f, color: rgb(...(opts.color ?? [0.1, 0.1, 0.12])) });
      y -= size * 1.45;
      line = "";
    };
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(next, size) > width) flush();
      line = line ? `${line} ${w}` : w;
    }
    if (line) flush();
    y -= opts.gap ?? 4;
  };

  write("OSAGIE & CO. EURO-CONSULTING", { size: 9, f: bold, color: [0.62, 0.45, 0.12] });
  write("Advisory Agreement - client copy", { size: 18, f: bold, gap: 10 });
  write(`Client: ${order.fullName} <${order.email}>`);
  write(`Service: ${order.productName} - ${formatNgn(order.amountKobo)}`);
  write(`Payment reference: ${order.reference}`);
  write(`Agreement version: ${order.agreementVersion}`);
  write(`Accepted electronically: ${new Date(order.acceptedAt).toUTCString()}`);
  if (order.paidAt) write(`Paid: ${new Date(order.paidAt).toUTCString()}`);
  y -= 8;

  if (offer) {
    write("Package scope", { size: 12, f: bold });
    offer.scope.forEach((s) => write(`- ${s}`));
    y -= 6;
  }

  const doc = getLegal("advisory-agreement")!;
  for (const s of doc.sections) {
    write(s.heading, { size: 11, f: bold, gap: 2 });
    s.body.forEach((p) => write(p));
  }
  const refund = getLegal("refund-policy")!;
  write("Refund Policy", { size: 11, f: bold, gap: 2 });
  refund.sections.forEach((s) => s.body.forEach((p) => write(`${s.heading}: ${p}`)));

  return pdf.save();
}
