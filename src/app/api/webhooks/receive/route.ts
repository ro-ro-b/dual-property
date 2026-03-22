import { NextRequest, NextResponse } from "next/server";
import { sseManager } from "@/lib/realtime";

export const dynamic = "force-dynamic";

/**
 * Webhook receiver endpoint — registered with DUAL WebhooksModule.
 * When DUAL fires an event (mint, transfer, burn, custom), this endpoint
 * receives it and broadcasts via SSE to all connected frontend clients.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract event type from webhook payload
    const eventType = body.event || body.type || body.action?.actionType || "unknown";
    const eventData = {
      id: body.id || body.action_id || `wh_${Date.now()}`,
      event: eventType,
      timestamp: body.timestamp || new Date().toISOString(),
      data: body.data || body.action || body,
      objectId: body.object_id || body.data?.object_id,
    };

    // Broadcast to all connected SSE clients
    sseManager.broadcast(eventType, eventData);

    return NextResponse.json({ received: true, eventType }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process webhook" },
      { status: 400 }
    );
  }
}
