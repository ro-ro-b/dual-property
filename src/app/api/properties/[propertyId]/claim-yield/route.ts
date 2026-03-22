import { NextRequest, NextResponse } from "next/server";
import { getOrgToken, dualFetch } from "@/lib/get-org-token";

export const dynamic = "force-dynamic";

const FALLBACK_TEMPLATE_ID = '69c057ffee7cf8d3342efec4';

/**
 * POST /api/properties/:propertyId/claim-yield
 *
 * Claims the monthly yield for a property by minting a "Yield Receipt" token
 * on the DUAL network.  The receipt is a real on-chain object whose custom
 * fields record property name, period, yield amount, etc.
 *
 * The DUAL gateway supports mint / burn / transfer — not arbitrary custom
 * actions — so we use mint to create an immutable receipt.
 */
export async function POST(req: NextRequest, { params }: { params: { propertyId: string } }) {
  try {
    const token = await getOrgToken(req);
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const period = new Date().toISOString().slice(0, 7); // "2026-03"

    // 1. Fetch the property to calculate yield
    let yieldAmount = 0;
    let propertyName = 'Property';
    let annualYieldPct = 0;
    let totalValue = 0;

    const objRes = await dualFetch(`/objects/${params.propertyId}`, token);
    if (objRes.ok) {
      const obj = await objRes.json();
      const c = obj.custom || {};
      totalValue = c.totalPropertyValue || 0;
      annualYieldPct = c.annualYield || 0;
      propertyName = c.name || 'Property';
      // Monthly yield = (totalValue × annualYield%) / 12
      yieldAmount = Math.round((totalValue * (annualYieldPct / 100)) / 12 * 100) / 100;
    } else {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // 2. Mint a yield receipt token on-chain
    const templateId = process.env.DUAL_PROPERTIES_TEMPLATE_ID || FALLBACK_TEMPLATE_ID;
    const mintRes = await dualFetch('/ebus/execute', token, {
      method: 'POST',
      body: JSON.stringify({
        action: {
          mint: {
            template_id: templateId,
            num: 1,
            data: {
              metadata: {
                name: `Yield Receipt — ${propertyName}`,
                description: `Monthly yield distribution for ${period}`,
                category: 'Yield Receipt',
              },
              custom: {
                type: 'yield_receipt',
                propertyId: params.propertyId,
                propertyName,
                period,
                yieldAmount,
                annualYieldPercent: annualYieldPct,
                totalPropertyValue: totalValue,
                claimedAt: new Date().toISOString(),
              },
            },
          },
        },
      }),
    });

    if (!mintRes.ok) {
      const err = await mintRes.json().catch(() => ({ message: 'Mint failed' }));
      return NextResponse.json({ error: err.message || 'Yield receipt mint failed' }, { status: mintRes.status });
    }

    const result = await mintRes.json();
    const receiptId = result.steps?.[0]?.output?.ids?.[0] || null;

    return NextResponse.json({
      success: true,
      actionId: result.action_id,
      receiptId,
      propertyName,
      period,
      yieldAmount,
      claimedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Yield claim failed" }, { status: 500 });
  }
}
