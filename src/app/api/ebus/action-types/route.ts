import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/dual-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = await getAuthenticatedClient();
    if (!client) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const actionTypes = await client.ebus.listActionTypes();
    return NextResponse.json({ actionTypes });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch action types" },
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
    const actionType = await client.ebus.createActionType(body);
    return NextResponse.json({ actionType }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create action type" },
      { status: err.status || 500 }
    );
  }
}
