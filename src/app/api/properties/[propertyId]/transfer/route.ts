import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/dual-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { propertyId: string } }) {
  try {
    const client = await getAuthenticatedClient();
    if (!client) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { recipientEmail, tokenCount } = body;

    if (!recipientEmail) {
      return NextResponse.json({ error: "recipientEmail is required" }, { status: 400 });
    }

    const result = await client.ebus.execute({
      action: {
        custom: {
          name: "transfer_tokens",
          object_id: params.propertyId,
          data: {
            custom: {
              recipientEmail,
              tokenCount: tokenCount || 1,
              transferredAt: new Date().toISOString(),
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      actionId: result.action_id,
      transferredTo: recipientEmail,
      tokenCount: tokenCount || 1,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Transfer failed" }, { status: err.status || 500 });
  }
}
