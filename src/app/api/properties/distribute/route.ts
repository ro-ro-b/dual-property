import { NextRequest, NextResponse } from "next/server";
import { getOrgToken, dualFetch } from "@/lib/get-org-token";

export const dynamic = "force-dynamic";

const FALLBACK_TEMPLATE_ID = '69c057ffee7cf8d3342efec4';

/**
 * POST /api/properties/distribute
 *
 * Distribute yield across properties by minting "Distribution Receipt" tokens.
 * Each receipt is an on-chain object recording the payout for a given period.
 *
 * Body:
 *   { propertyId }   — single property
 *   { all: true }    — all properties
 */
export async function POST(req: NextRequest) {
  try {
    const token = await getOrgToken(req);
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const period = body.period || new Date().toISOString().slice(0, 7);
    const templateId = process.env.DUAL_PROPERTIES_TEMPLATE_ID || FALLBACK_TEMPLATE_ID;
    const results: any[] = [];

    // Determine which properties to distribute
    let propertyIds: string[] = [];

    if (body.all) {
      const listRes = await dualFetch(`/objects?template_id=${templateId}&limit=100`, token);
      if (listRes.ok) {
        const data = await listRes.json();
        const objects = data?.items || data?.objects || [];
        // Only include actual property objects (not receipts)
        propertyIds = objects
          .filter((o: any) => !o.custom?.type || o.custom.type !== 'yield_receipt')
          .map((o: any) => o.id);
      }
    } else if (body.propertyId) {
      propertyIds = [body.propertyId];
    } else {
      return NextResponse.json({ error: "Provide propertyId or { all: true }" }, { status: 400 });
    }

    for (const propId of propertyIds) {
      const objRes = await dualFetch(`/objects/${propId}`, token);
      if (!objRes.ok) continue;

      const obj = await objRes.json();
      const c = obj.custom || {};
      if (c.type === 'yield_receipt' || c.type === 'distribution_receipt') continue;

      const totalValue = c.totalPropertyValue || 0;
      const annualYield = c.annualYield || 0;
      const totalTokens = c.totalTokens || 1;
      const name = c.name || 'Property';
      const monthlyYieldPool = Math.round((totalValue * (annualYield / 100)) / 12 * 100) / 100;
      const yieldPerToken = Math.round((monthlyYieldPool / totalTokens) * 10000) / 10000;

      // Mint a distribution receipt on-chain
      const mintRes = await dualFetch('/ebus/execute', token, {
        method: 'POST',
        body: JSON.stringify({
          action: {
            mint: {
              template_id: templateId,
              num: 1,
              data: {
                metadata: {
                  name: `Distribution Receipt — ${name}`,
                  description: `Yield distribution for ${period}`,
                  category: 'Distribution Receipt',
                },
                custom: {
                  type: 'distribution_receipt',
                  propertyId: propId,
                  propertyName: name,
                  period,
                  totalPropertyValue: totalValue,
                  annualYieldPercent: annualYield,
                  monthlyYieldPool,
                  yieldPerToken,
                  totalTokens,
                  distributedAt: new Date().toISOString(),
                },
              },
            },
          },
        }),
      });

      const mintResult = mintRes.ok ? await mintRes.json() : null;

      results.push({
        propertyId: propId,
        propertyName: name,
        totalValue,
        annualYield,
        monthlyYieldPool,
        yieldPerToken,
        receiptId: mintResult?.steps?.[0]?.output?.ids?.[0] || null,
        actionId: mintResult?.action_id || null,
        status: mintRes.ok ? 'distributed' : 'failed',
      });
    }

    const totalDistributed = results.reduce((s, r) => s + (r.status === 'distributed' ? r.monthlyYieldPool : 0), 0);

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
