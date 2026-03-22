import { NextRequest, NextResponse } from "next/server";
import { getOrgToken, dualFetch } from "@/lib/get-org-token";

export const dynamic = "force-dynamic";

const FALLBACK_TEMPLATE_ID = '69c057ffee7cf8d3342efec4';

/**
 * POST /api/properties/distribute
 * Distribute yield across all properties (admin action).
 *
 * Body options:
 *   { propertyId }           — distribute for a single property
 *   { all: true }            — distribute for all properties
 *   { propertyId, holders }  — manual holder list (advanced)
 */
export async function POST(req: NextRequest) {
  try {
    const token = await getOrgToken(req);
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const period = body.period || new Date().toISOString().slice(0, 7);
    const results: any[] = [];

    // Determine which properties to distribute
    let propertyIds: string[] = [];

    if (body.all) {
      // Fetch all properties
      const templateId = process.env.DUAL_PROPERTIES_TEMPLATE_ID || FALLBACK_TEMPLATE_ID;
      const listRes = await dualFetch(`/objects?template_id=${templateId}&limit=100`, token);
      if (listRes.ok) {
        const data = await listRes.json();
        const objects = data?.items || data?.objects || [];
        propertyIds = objects.map((o: any) => o.id);
      }
    } else if (body.propertyId) {
      propertyIds = [body.propertyId];
    } else {
      return NextResponse.json({ error: "Provide propertyId or { all: true }" }, { status: 400 });
    }

    // For each property, calculate yield and record distribution
    for (const propId of propertyIds) {
      const objRes = await dualFetch(`/objects/${propId}`, token);
      if (!objRes.ok) continue;

      const obj = await objRes.json();
      const c = obj.custom || {};
      const totalValue = c.totalPropertyValue || 0;
      const annualYield = c.annualYield || 0;
      const totalTokens = c.totalTokens || 1;
      const name = c.name || 'Property';

      // Monthly yield pool for this property
      const monthlyYieldPool = Math.round((totalValue * (annualYield / 100)) / 12 * 100) / 100;
      const yieldPerToken = monthlyYieldPool / totalTokens;

      // For now, the org owner holds all tokens — single distribution
      // In production this would iterate actual holder wallets
      const holder = {
        address: obj.owner || 'org_owner',
        shares: totalTokens,
        payout: monthlyYieldPool,
      };

      // Execute distribution action on DUAL
      const distRes = await dualFetch('/ebus/execute', token, {
        method: 'POST',
        body: JSON.stringify({
          action: {
            custom: {
              name: "distribute_dividends",
              object_id: propId,
              data: {
                custom: {
                  holderAddress: holder.address,
                  shares: holder.shares,
                  payoutAmount: holder.payout,
                  yieldPerToken,
                  period,
                  propertyName: name,
                  totalPropertyValue: totalValue,
                  annualYieldPercent: annualYield,
                  distributedAt: new Date().toISOString(),
                },
              },
            },
          },
        }),
      });

      const distResult = distRes.ok ? await distRes.json() : null;

      results.push({
        propertyId: propId,
        propertyName: name,
        totalValue,
        annualYield,
        monthlyYieldPool,
        yieldPerToken,
        actionId: distResult?.action_id || null,
        status: distRes.ok ? 'distributed' : 'failed',
      });
    }

    const totalDistributed = results.reduce((sum, r) => sum + (r.status === 'distributed' ? r.monthlyYieldPool : 0), 0);

    return NextResponse.json({
      success: true,
      period,
      propertiesProcessed: results.length,
      totalDistributed: Math.round(totalDistributed * 100) / 100,
      distributions: results,
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Distribution failed" }, { status: 500 });
  }
}
