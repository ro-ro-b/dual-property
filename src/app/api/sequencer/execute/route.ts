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
    const { actions } = body;

    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return NextResponse.json({ error: "Actions array required" }, { status: 400 });
    }

    // Execute actions sequentially through the ebus
    const results = [];
    for (const action of actions) {
      try {
        const result = await client.ebus.execute(action);
        results.push({ success: true, action: action.type, result });
      } catch (err: any) {
        results.push({ success: false, action: action.type, error: err.message });
      }
    }

    return NextResponse.json({ results, totalExecuted: results.length });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to execute sequence" },
      { status: err.status || 500 }
    );
  }
}
