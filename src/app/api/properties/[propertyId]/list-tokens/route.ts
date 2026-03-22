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
    const { tokenCount, askPrice, sellerEmail } = body;

    if (!tokenCount || !askPrice || !sellerEmail) {
      return NextResponse.json(
        { error: "tokenCount, askPrice, and sellerEmail are required" },
        { status: 400 }
      );
    }

    const result = await client.ebus.execute({
      action: {
        custom: {
          name: "list_tokens",
          object_id: params.propertyId,
          data: {
            custom: {
              tokenCount,
              askPrice,
              sellerEmail,
              totalValue: tokenCount * askPrice,
              listedAt: new Date().toISOString(),
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        listingId: result.action_id || `listing_${Date.now()}`,
        propertyId: params.propertyId,
        tokenCount,
        askPrice,
        totalValue: tokenCount * askPrice,
        seller: sellerEmail,
        status: "active",
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Listing failed" },
      { status: err.status || 500 }
    );
  }
}
