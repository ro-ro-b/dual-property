import { NextResponse } from "next/server";
import { getDualClient } from "@/lib/dual-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = getDualClient();
    const result = await client.ebus.listActionLogs({ limit: 30 });
    const logs = result?.items || result?.actions || result?.data || [];

    const activity = (logs as any[]).map((log: any) => ({
      id: log.id || log.action_id,
      event: log.action_type || log.type || 'Transaction',
      hash: log.id || log.action_id || '',
      amount: log.data?.custom?.tokenCount ? `${log.data.custom.tokenCount} tokens` : '1 token',
      timestamp: log.when_created || log.created_at || new Date().toISOString(),
      objectId: log.object_id || log.data?.object_id || '',
      status: log.status || 'completed',
    }));

    return NextResponse.json({ activity });
  } catch (err: any) {
    return NextResponse.json({ activity: [] });
  }
}
