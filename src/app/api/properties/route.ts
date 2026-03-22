import { NextRequest, NextResponse } from "next/server";
import { getDataProvider } from "@/lib/data-provider";
import { getAuthenticatedClient } from "@/lib/dual-auth";

export const dynamic = "force-dynamic";

// Known fallback values (discovered during initial setup)
const FALLBACK_TEMPLATE_ID = '69c057ffee7cf8d3342efec4';
const FALLBACK_ORG_ID = '69b935b4187e903f826bbe71';

// GET /api/properties — List all properties
// Uses direct HTTP to DUAL gateway with JWT from cookies for org-scoped access
export async function GET(req: NextRequest) {
  try {
    const BASE = process.env.NEXT_PUBLIC_DUAL_API_URL || 'https://gateway-48587430648.europe-west6.run.app';
    const templateId = process.env.DUAL_PROPERTIES_TEMPLATE_ID || FALLBACK_TEMPLATE_ID;

    // Try to get JWT from cookie for authenticated listing
    let jwtToken = req.cookies.get('dual_jwt')?.value || process.env.DUAL_API_TOKEN || '';
    const orgId = process.env.DUAL_ORG_ID || FALLBACK_ORG_ID;

    // If we have a JWT, check if it's system-scoped and needs org switch
    if (jwtToken) {
      try {
        const payload = JSON.parse(Buffer.from(jwtToken.split('.')[1], 'base64').toString());
        if (payload.fqdn === 'system' && orgId) {
          // System-scoped JWT — switch to org context
          const switchRes = await fetch(`${BASE}/organizations/switch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` },
            body: JSON.stringify({ id: orgId }),
          });
          if (switchRes.ok) {
            const switchData = await switchRes.json();
            jwtToken = switchData.access_token || jwtToken;
          }
        }
      } catch { /* JWT parse error — use as-is */ }
    }

    const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (jwtToken) authHeaders['Authorization'] = `Bearer ${jwtToken}`;

    // Direct HTTP call to DUAL gateway — SDK client often lacks org context on serverless
    const url = `${BASE}/objects?template_id=${templateId}&limit=100`;
    const res = await fetch(url, { headers: authHeaders, cache: 'no-store' });

    if (!res.ok) {
      // If auth fails, fall back to data provider (which uses API key)
      console.warn(`Direct objects fetch failed (${res.status}), falling back to data provider`);
      const provider = getDataProvider();
      const properties = await provider.listProperties();
      return NextResponse.json({ properties });
    }

    const data = await res.json();
    const allObjects = data?.items || data?.objects || data?.data || (Array.isArray(data) ? data : []);

    // Filter out receipt tokens (yield receipts, distribution receipts, transfer intents)
    const RECEIPT_TYPES = ['yield_receipt', 'distribution_receipt', 'transfer_intent'];
    const objects = allObjects.filter((obj: any) => {
      const customType = obj.custom?.type;
      return !customType || !RECEIPT_TYPES.includes(customType);
    });

    // Map gateway objects to property format
    // Note: custom fields may be flat (tokenPricePerShare) or nested (investment.tokenPricePerShare)
    const properties = objects.map((obj: any) => {
      const c = obj.custom || {};
      const inv = c.investment || {};
      const fin = c.financials || {};
      return {
        id: obj.id || obj._id,
        name: c.name || obj.metadata?.name || `Property ${(obj.id || '').slice(-6)}`,
        description: c.description || obj.metadata?.description || '',
        status: 'active',
        propertyType: c.propertyType || 'residential',
        location: {
          address: c.address || '',
          city: c.city || '',
          country: c.country || '',
        },
        investment: {
          totalPropertyValue: inv.totalPropertyValue || c.totalPropertyValue || 0,
          tokenPricePerShare: inv.tokenPricePerShare || c.tokenPricePerShare || 0,
          totalTokens: inv.totalTokens || c.totalTokens || 0,
          annualYield: inv.annualYield || c.annualYield || 0,
          minimumInvestment: inv.minimumInvestment || c.minimumInvestment || 0,
        },
        financials: {
          monthlyRentalIncome: fin.monthlyRentalIncome || c.monthlyRentalIncome || 0,
          annualExpenses: fin.annualExpenses || c.annualExpenses || 0,
          netOperatingIncome: fin.netOperatingIncome || c.netOperatingIncome || 0,
          capRate: fin.capRate || c.capRate || 0,
          projectedAppreciation: fin.projectedAppreciation || c.projectedAppreciation || 0,
        },
        templateId: obj.template_id,
        ownerId: obj.owner_id || obj.owner,
        blockchainTxHash: obj.integrity_hash,
        createdAt: obj.created_at || obj.createdAt,
        updatedAt: obj.updated_at || obj.updatedAt,
      };
    });

    return NextResponse.json({ properties });
  } catch (err: any) {
    console.error('Properties GET error:', err.message);
    // Last resort fallback
    try {
      const provider = getDataProvider();
      const properties = await provider.listProperties();
      return NextResponse.json({ properties });
    } catch {
      return NextResponse.json({ properties: [], error: err.message }, { status: 200 });
    }
  }
}

// In-memory cache for auto-created template ID
let cachedTemplateId: string | null = null;

// POST /api/properties — Mint a new property token
export async function POST(req: NextRequest) {
  try {
    // Try standard auth first, then fall back to Authorization header / cookie
    let client = await getAuthenticatedClient();
    let rawToken: string | null = null;

    if (!client) {
      const authHeader = req.headers.get('authorization');
      const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      const cookieToken = req.cookies.get('dual_jwt')?.value;
      rawToken = headerToken || cookieToken || null;

      if (rawToken) {
        const { DualClient } = await import('@/lib/dual-sdk');
        client = new DualClient({
          baseUrl: process.env.NEXT_PUBLIC_DUAL_API_URL || 'https://gateway-48587430648.europe-west6.run.app',
          token: rawToken,
          apiKey: process.env.DUAL_API_KEY || '',
          timeout: 30000,
          retry: { maxAttempts: 2, backoffMs: 500 },
        });
      }
    }

    if (!client) {
      return NextResponse.json(
        { error: "Not authenticated. Login first via /api/auth/otp and /api/auth/login." },
        { status: 401 }
      );
    }

    const body = await req.json();
    let templateId = body.templateId || process.env.DUAL_PROPERTIES_TEMPLATE_ID || cachedTemplateId || FALLBACK_TEMPLATE_ID;
    const num = body.num || 1;
    const rawData = body.data || {};

    // Auto-discover or create a template if none is configured
    if (!templateId) {
      const BASE = process.env.NEXT_PUBLIC_DUAL_API_URL || 'https://gateway-48587430648.europe-west6.run.app';
      const token = rawToken || (client as any)?.http?.getToken?.() || '';
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      };

      try {
        // Try listing existing templates via direct HTTP
        const listRes = await fetch(`${BASE}/templates?limit=10`, { headers: authHeaders });
        if (listRes.ok) {
          const listData = await listRes.json();
          const templates = listData?.items || listData?.templates || listData?.data || [];
          if (Array.isArray(templates) && templates.length > 0) {
            templateId = templates[0].id;
          }
        }
      } catch { /* ignore list errors */ }

      // If still no template, try creating one
      if (!templateId) {
        try {
          const createRes = await fetch(`${BASE}/templates`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
              name: "Property Token",
              description: "Tokenised real estate property",
            }),
          });
          if (createRes.ok) {
            const createData = await createRes.json();
            templateId = createData.id || createData.template_id || '';
          } else {
            const errData = await createRes.text();
            // Log but don't fail yet — try minting without template
            console.warn('Template creation failed:', createRes.status, errData);
          }
        } catch (e: any) {
          console.warn('Template creation error:', e.message);
        }
      }

      if (templateId) cachedTemplateId = templateId;
    }

    // Build mint data
    const mintData: Record<string, any> = {};
    if (rawData.name || rawData.description) {
      mintData.metadata = {
        ...(rawData.name ? { name: rawData.name } : {}),
        ...(rawData.description ? { description: rawData.description } : {}),
      };
    }
    const { name: _n, description: _d, ...customFields } = rawData;
    const custom: Record<string, any> = { ...customFields };
    if (rawData.name) custom.name = rawData.name;
    if (rawData.description) custom.description = rawData.description;
    if (Object.keys(custom).length > 0) mintData.custom = custom;

    // Build action payload — include template_id only if we have one
    const mintAction: any = {
      num,
      ...(Object.keys(mintData).length > 0 ? { data: mintData } : {}),
    };
    if (templateId) {
      mintAction.template_id = templateId;
    }

    const actionPayload = { action: { mint: mintAction } };

    const result = await client.ebus.execute(actionPayload);

    return NextResponse.json({
      success: true,
      actionId: result.action_id,
      steps: result.steps,
      objectIds: result.steps?.[0]?.output?.ids || [],
    }, { status: 201 });
  } catch (err: any) {
    const status = err.status || 500;
    const message = err.body?.message || err.message || "Property mint failed";
    return NextResponse.json({ error: message, details: err.body }, { status });
  }
}
