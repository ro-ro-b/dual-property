import { NextRequest, NextResponse } from "next/server";
import { getOrgToken, dualFetch } from "@/lib/get-org-token";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { propertyId: string } }) {
  try {
    const token = await getOrgToken(req);
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const period = new Date().toISOString().slice(0, 7); // e.g. "2026-03"

    // Fetch the property to calculate yield amount
    let yieldAmount = 0;
    let propertyName = 'Property';
    const objRes = await dualFetch(`/objects/${params.propertyId}`, token);
    if (objRes.ok) {
      const obj = await objRes.json();
      const c = obj.custom || {};
      const totalValue = c.totalPropertyValue || c.investment?.totalPropertyValue || 0;
      const annualYield = c.annualYield || c.investment?.annualYield || 0;
      propertyName = c.name || 'Property';
      // Monthly yield = (totalValue × annualYield%) / 12
      yieldAmount = Math.round((totalValue * (annualYield / 100)) / 12 * 100) / 100;
    }

    // Execute the claim action on DUAL
    const res = await dualFetch('/ebus/execute', token, {
      method: 'POST',
      body: JSON.stringify({
        action: {
          custom: {
            name: "claim_yield",
            object_id: params.propertyId,
            data: {
              custom: {
                claimedAt: new Date().toISOString(),
                period,
                yieldAmount,
                propertyName,
              },
            },
          },
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Claim failed' }));
      return NextResponse.json({ error: err.message || 'Claim failed' }, { status: res.status });
    }

    const result = await res.json();

    return NextResponse.json({
      success: true,
      actionId: result.action_id,
      claimedAt: new Date().toISOString(),
      period,
      yieldAmount,
      propertyName,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Yield claim failed" }, { status: 500 });
  }
}
