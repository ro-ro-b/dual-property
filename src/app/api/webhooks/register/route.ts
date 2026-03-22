import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/dual-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const client = await getAuthenticatedClient();
    if (!client) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { url, events } = body;

    if (!url) {
      return NextResponse.json({ error: "Webhook URL is required" }, { status: 400 });
    }

    const webhook = await client.webhooks.createWebhook({
      url,
      events: events || ["mint", "transfer", "burn", "custom"],
      active: true,
    });

    return NextResponse.json({ webhook }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to register webhook" },
      { status: err.status || 500 }
    );
  }
}

export async function GET() {
  try {
    const client = await getAuthenticatedClient();
    if (!client) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const webhooks = await client.webhooks.listWebhooks();
    return NextResponse.json({ webhooks });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to list webhooks" },
      { status: err.status || 500 }
    );
  }
}
