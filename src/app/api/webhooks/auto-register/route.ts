import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/dual-auth";

export const dynamic = "force-dynamic";

const DEFAULT_EVENTS = [
  'object.created',
  'object.updated',
  'object.transferred',
  'action.executed',
  'payment.completed',
  'payment.failed',
];

export async function POST(req: NextRequest) {
  try {
    const client = await getAuthenticatedClient();
    if (!client) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { callbackUrl, events } = body;

    if (!callbackUrl) {
      return NextResponse.json({ error: "callbackUrl required" }, { status: 400 });
    }

    const eventsToRegister = events || DEFAULT_EVENTS;
    const results = [];

    for (const event of eventsToRegister) {
      try {
        const result = await client.webhooks.createWebhook({
          url: callbackUrl,
          events: [event],
          active: true,
        });
        results.push({ event, success: true, webhookId: result?.id || result?.data?.id });
      } catch (err: any) {
        results.push({ event, success: false, error: err.message });
      }
    }

    return NextResponse.json({
      registered: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to auto-register webhooks" },
      { status: err.status || 500 }
    );
  }
}
