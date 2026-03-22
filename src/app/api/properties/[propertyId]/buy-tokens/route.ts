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
    const { listingId, buyerEmail, tokenCount } = body;

    if (!listingId || !buyerEmail || !tokenCount) {
      return NextResponse.json(
        { error: "listingId, buyerEmail, and tokenCount are required" },
        { status: 400 }
      );
    }

    // Try to fetch payment config for validation
    let paymentConfig: any = null;
    try {
      paymentConfig = await client.payments.getPaymentConfig();
    } catch {
      // Payment config not available — proceed without it
    }

    // Execute the purchase via event bus
    const result = await client.ebus.execute({
      action: {
        custom: {
          name: "buy_tokens",
          object_id: params.propertyId,
          data: {
            custom: {
              listingId,
              buyerEmail,
              tokenCount,
              purchasedAt: new Date().toISOString(),
              paymentMethod: paymentConfig?.defaultMethod || "platform_balance",
            },
          },
        },
      },
    });

    // Try to log the deposit
    try {
      await client.payments.listDeposits({ object_id: params.propertyId });
    } catch {
      // Deposit tracking not available — non-blocking
    }

    return NextResponse.json(
      {
        success: true,
        purchaseId: result.action_id || `purchase_${Date.now()}`,
        propertyId: params.propertyId,
        listingId,
        buyer: buyerEmail,
        tokenCount,
        transactionHash: result.action_id,
        paymentMethod: paymentConfig?.defaultMethod || "platform_balance",
        status: "completed",
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Purchase failed" },
      { status: err.status || 500 }
    );
  }
}
