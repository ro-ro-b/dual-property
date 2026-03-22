import { NextResponse } from "next/server";
import { getDualClient } from "@/lib/dual-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = getDualClient();
    const stats = await client.indexer.getPublicStats();
    return NextResponse.json({ stats });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch public stats" },
      { status: err.status || 500 }
    );
  }
}
