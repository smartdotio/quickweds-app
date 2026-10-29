import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { repo } from "@/lib/repo";

export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const data = await repo.exportClientData(viewer.id);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="osagieco-data-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
