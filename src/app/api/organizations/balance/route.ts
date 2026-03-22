import { NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/dual-auth";

export const dynamic = "force-dynamic";

const ORG_ID = process.env.DUAL_ORG_ID || '';

export async function GET() {
  try {
    const client = await getAuthenticatedClient();
    if (!client) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const balance = await client.organizations.getOrganizationBalance(ORG_ID);
    const history = await client.organizations.getBalanceHistory(ORG_ID).catch(() => ({ items: [] }));

    return NextResponse.json({
      balance,
      history: history?.items || history?.data || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
