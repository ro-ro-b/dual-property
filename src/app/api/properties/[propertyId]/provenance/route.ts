import { NextRequest, NextResponse } from "next/server";
import { getDualClient } from "@/lib/dual-client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { propertyId: string } }) {
  try {
    const client = getDualClient();
    const result = await client.objects.getObjectActivity(params.propertyId);
    const activity = result?.items || result?.activity || result?.actions || result?.data || [];

    return NextResponse.json({
      propertyId: params.propertyId,
      provenance: (activity as any[]).map((a: any) => ({
        id: a.id || a.action_id,
        type: a.action_type || a.type || 'action',
        description: a.description || `${a.action_type || 'Action'} executed`,
        timestamp: a.when_created || a.created_at || new Date().toISOString(),
        actor: a.triggered_by || a.actor || 'system',
        txHash: a.id || a.action_id,
        status: a.status || 'completed',
        data: a.data || {},
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ propertyId: params.propertyId, provenance: [] });
  }
}
