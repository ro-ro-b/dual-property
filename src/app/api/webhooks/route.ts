import { NextRequest, NextResponse } from "next/server";
import { sseManager } from "@/lib/realtime";
import crypto from "crypto";
import { getConfig } from "@/lib/env";

// Receive webhook events from DUAL network
export async function POST(req: NextRequest) {
  try {
    const config = getConfig();
    const body = await req.text();
    const signature = req.headers.get("x-dual-signature") ?? "";

    // Verify HMAC signature if configured
    if (config.dualWebhookSecret) {
      const expected = crypto
        .createHmac("sha256", config.dualWebhookSecret)
        .update(body)
        .digest("hex");
      if (signature !== expected) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(body);

    // Broadcast to connected SSE clients
    sseManager.broadcast("webhook", event);

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
