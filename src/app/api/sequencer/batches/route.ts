import { NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/dual-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = await getAuthenticatedClient();
    if (!client) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const batches = await client.sequencer.listBatches({ limit: 20 });
    return NextResponse.json({ batches });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch batches" },
      { status: err.status || 500 }
    );
  }
}
