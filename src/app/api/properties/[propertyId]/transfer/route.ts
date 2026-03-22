import { NextRequest, NextResponse } from "next/server";
import { getOrgToken, dualFetch } from "@/lib/get-org-token";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { propertyId: string } }) {
  try {
    const token = await getOrgToken(req);
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { recipientEmail, tokenCount } = body;

    if (!recipientEmail) {
      return NextResponse.json({ error: "recipientEmail is required" }, { status: 400 });
    }

    const res = await dualFetch('/ebus/execute', token, {
      method: 'POST',
      body: JSON.stringify({
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
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Transfer failed' }));
      return NextResponse.json({ error: err.message || 'Transfer failed' }, { status: res.status });
    }

    const result = await res.json();

    return NextResponse.json({
      success: true,
      actionId: result.action_id,
      transferredTo: recipientEmail,
      tokenCount: tokenCount || 1,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Transfer failed" }, { status: 500 });
  }
}
