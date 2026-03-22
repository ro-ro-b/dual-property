import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/dual-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = await getAuthenticatedClient();
    if (!client) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const messages = await client.support.listSupportMessages({ limit: 50 });
    return NextResponse.json({ messages });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch support messages" },
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
    const result = await client.support.sendSupportMessage(body);
    return NextResponse.json({ message: result }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to send support message" },
      { status: err.status || 500 }
    );
  }
}
