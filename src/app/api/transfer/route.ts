import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/dual-auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/transfer
 * Transfer a wine token to another user.
 * Body: { objectId, toAddress }
 *
 * The DUAL gateway's /ebus/execute accepts:
 *   { action: { transfer: { id: <objectId>, to: <walletId> } } }
 *
 * `to` must be a DUAL wallet ID (e.g. "69b92d49d5a95a6018672003"),
 * NOT an Ethereum address or email.
 */
export async function POST(req: NextRequest) {
  try {
    const client = await getAuthenticatedClient();
    if (!client) {
      return NextResponse.json(
        { error: "Not authenticated. Login first via /api/auth." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { objectId, toAddress } = body;

    if (!objectId || !toAddress) {
      return NextResponse.json(
        { error: "objectId and toAddress are required" },
        { status: 400 }
      );
    }

    // Execute the transfer via /ebus/execute
    // `to` field requires a DUAL wallet ID
    const result = await client.ebus.execute({
      action: {
        transfer: {
          id: objectId,
          to: toAddress,
        },
      },
    });

    return NextResponse.json({
      success: true,
      actionId: result.action_id || result.actionId,
      steps: result.steps,
    });
  } catch (err: any) {
    const status = err.status || 500;
    const message = err.body?.message || err.message || "Transfer failed";
    return NextResponse.json({ error: message }, { status });
  }
}
