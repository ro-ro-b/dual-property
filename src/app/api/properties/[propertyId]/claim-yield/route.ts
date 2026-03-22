import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/dual-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { propertyId: string } }) {
  try {
    const client = await getAuthenticatedClient();
    if (!client) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const result = await client.ebus.execute({
      action: {
        custom: {
          name: "claim_yield",
          object_id: params.propertyId,
          data: {
            custom: {
              claimedAt: new Date().toISOString(),
              period: new Date().toISOString().slice(0, 7),
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      actionId: result.action_id,
      claimedAt: new Date().toISOString(),
      period: new Date().toISOString().slice(0, 7),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Yield claim failed" }, { status: err.status || 500 });
  }
}
