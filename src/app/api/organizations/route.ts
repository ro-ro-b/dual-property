import { NextResponse } from "next/server";
import { getDualClient } from "@/lib/dual-client";

export const dynamic = "force-dynamic";

const ORG_ID = process.env.DUAL_ORG_ID || '';

export async function GET() {
  try {
    const client = getDualClient();
    if (ORG_ID) {
      const org = await client.organizations.getOrganization(ORG_ID);
      return NextResponse.json(org ? [org] : []);
    }
    const result = await client.organizations.listOrganizations();
    return NextResponse.json(result?.items || result?.data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
