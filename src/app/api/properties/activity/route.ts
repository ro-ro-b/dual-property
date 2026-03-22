import { NextRequest, NextResponse } from "next/server";
import { getOrgToken, dualFetch } from "@/lib/get-org-token";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = await getOrgToken(req);

    if (token) {
      // Use direct HTTP with org-scoped token
      const res = await dualFetch('/ebus/action-logs?limit=30', token);
      if (res.ok) {
        const result = await res.json();
        const logs = result?.items || result?.actions || result?.data || [];

        const activity = (logs as any[]).map((log: any) => {
          const customData = log.data?.custom || {};
          const actionName = customData.name || log.action_type || log.type || 'Transaction';

          // Format display based on action type
          let event = actionName;
          let amount = '1 token';
          if (actionName === 'claim_yield') {
            event = 'Yield Claimed';
            amount = customData.yieldAmount ? `$${customData.yieldAmount.toLocaleString()}` : 'yield';
          } else if (actionName === 'distribute_dividends') {
            event = 'Dividend Distributed';
            amount = customData.payoutAmount ? `$${customData.payoutAmount.toLocaleString()}` : 'dividend';
          } else if (actionName === 'transfer_tokens') {
            event = 'Token Transfer';
            amount = customData.tokenCount ? `${customData.tokenCount} tokens` : '1 token';
          } else if (actionName === 'mint') {
            event = 'Token Minted';
          }

          return {
            id: log.id || log.action_id,
            event,
            hash: log.id || log.action_id || '',
            amount,
            timestamp: log.when_created || log.created_at || new Date().toISOString(),
            objectId: log.object_id || log.data?.object_id || '',
            status: log.status || 'completed',
            details: customData,
          };
        });

        return NextResponse.json({ activity });
      }
    }

    // Fallback: return empty
    return NextResponse.json({ activity: [] });
  } catch {
    return NextResponse.json({ activity: [] });
  }
}
