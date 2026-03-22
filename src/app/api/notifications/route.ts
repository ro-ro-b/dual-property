import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/dual-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = await getAuthenticatedClient();
    if (!client) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const messages = await client.notifications.listMessages({ limit: 50 });
    return NextResponse.json({ messages });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch notifications" },
      { status: err.status || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const client = await getAuthenticatedClient();
    if (!client) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const result = await client.notifications.sendMessage(body);
    return NextResponse.json({ result }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to send notification" },
      { status: err.status || 500 }
    );
  }
}

// Mark notification(s) as read
export async function PATCH(req: NextRequest) {
  try {
    const client = await getAuthenticatedClient();
    if (!client) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { ids, markAllRead } = body;

    // The DUAL API doesn't have a native mark-read endpoint,
    // so we track read state client-side and acknowledge here
    return NextResponse.json({
      success: true,
      markedRead: markAllRead ? 'all' : ids || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to mark as read" },
      { status: err.status || 500 }
    );
  }
}
