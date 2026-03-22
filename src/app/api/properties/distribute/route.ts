import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/dual-auth";

export const dynamic = "force-dynamic";

interface Holder {
  address: string;
  shares: number;
  payout: number;
}

export async function POST(req: NextRequest) {
  try {
    const client = await getAuthenticatedClient();
    if (!client) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { propertyId, amount, period, holders } = body;

    if (!propertyId || !amount || !period || !holders || !Array.isArray(holders)) {
      return NextResponse.json(
        { error: "propertyId, amount, period, and holders array are required" },
        { status: 400 }
      );
    }

    const txHashes: string[] = [];
    const distributedHolders = [];

    // Execute batch distribution
    for (const holder of holders) {
      const result = await client.ebus.execute({
        action: {
          custom: {
            name: "distribute_dividends",
            object_id: propertyId,
            data: {
              custom: {
                holderAddress: holder.address,
                shares: holder.shares,
                payoutAmount: holder.payout,
                period,
                distributedAt: new Date().toISOString(),
              },
            },
          },
        },
      });

      if (result.action_id) {
        txHashes.push(result.action_id);
        distributedHolders.push({
          address: holder.address,
          payout: holder.payout,
          txHash: result.action_id,
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        distributionId: `dist_${Date.now()}`,
        propertyId,
        totalPaid: amount,
        holdersCount: distributedHolders.length,
        txHashes,
        distributedHolders,
        period,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Distribution failed" },
      { status: err.status || 500 }
    );
  }
}
