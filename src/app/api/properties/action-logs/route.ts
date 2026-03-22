import { NextResponse } from "next/server";
import { getDualClient } from "@/lib/dual-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = getDualClient();
    const result = await client.ebus.listActionLogs({ limit: 50 });
    const logs = result?.items || result?.actions || result?.data || [];
    return NextResponse.json({ logs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
