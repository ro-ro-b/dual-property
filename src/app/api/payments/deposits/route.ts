import { NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/dual-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = await getAuthenticatedClient();
    if (!client) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const deposits = await client.payments.listDeposits();
    return NextResponse.json({ deposits });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch deposits" },
      { status: err.status || 500 }
    );
  }
}
