import { NextRequest, NextResponse } from "next/server";
import { getOrgToken, dualFetch } from "@/lib/get-org-token";

export const dynamic = "force-dynamic";

/**
 * POST /api/properties/:propertyId/transfer
 *
 * Transfer a property token to another wallet.  Uses the native DUAL
 * `transfer` action which is supported by the gateway.
 *
 * Body: { recipientEmail, recipientWalletId?, tokenCount? }
 *
 * Note: DUAL transfer requires a wallet ID, not an email.  If only email
 * is provided we record it as metadata on a transfer receipt mint.
 */
export async function POST(req: NextRequest, { params }: { params: { propertyId: string } }) {
  try {
    const token = await getOrgToken(req);
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { recipientEmail, recipientWalletId, tokenCount } = body;

    if (!recipientEmail && !recipientWalletId) {
      return NextResponse.json({ error: "recipientEmail or recipientWalletId required" }, { status: 400 });
    }

    // If we have a wallet ID, do a real DUAL transfer
    if (recipientWalletId) {
      const res = await dualFetch('/ebus/execute', token, {
        method: 'POST',
        body: JSON.stringify({
          action: {
            transfer: {
              id: params.propertyId,
              to: recipientWalletId,
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
        transferredTo: recipientWalletId,
        tokenCount: tokenCount || 1,
        timestamp: new Date().toISOString(),
      });
    }

    // Otherwise, mint a transfer-intent receipt (email-based transfer needs off-chain resolution)
    const FALLBACK_TEMPLATE_ID = '69c057ffee7cf8d3342efec4';
    const templateId = process.env.DUAL_PROPERTIES_TEMPLATE_ID || FALLBACK_TEMPLATE_ID;

    // Get property name
    let propertyName = 'Property';
    const objRes = await dualFetch(`/objects/${params.propertyId}`, token);
    if (objRes.ok) {
      const obj = await objRes.json();
      propertyName = obj.custom?.name || 'Property';
    }

    const mintRes = await dualFetch('/ebus/execute', token, {
      method: 'POST',
      body: JSON.stringify({
        action: {
          mint: {
            template_id: templateId,
            num: 1,
            data: {
              metadata: {
                name: `Transfer Intent — ${propertyName}`,
                description: `Transfer of ${tokenCount || 1} tokens to ${recipientEmail}`,
                category: 'Transfer Intent',
              },
              custom: {
                type: 'transfer_intent',
                propertyId: params.propertyId,
                propertyName,
                recipientEmail,
                tokenCount: tokenCount || 1,
                status: 'pending',
                createdAt: new Date().toISOString(),
              },
            },
          },
        },
      }),
    });

    if (!mintRes.ok) {
      const err = await mintRes.json().catch(() => ({ message: 'Transfer intent failed' }));
      return NextResponse.json({ error: err.message || 'Transfer failed' }, { status: mintRes.status });
    }

    const result = await mintRes.json();

    return NextResponse.json({
      success: true,
      actionId: result.action_id,
      receiptId: result.steps?.[0]?.output?.ids?.[0] || null,
      transferredTo: recipientEmail,
      tokenCount: tokenCount || 1,
      status: 'pending_resolution',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Transfer failed" }, { status: 500 });
  }
}
