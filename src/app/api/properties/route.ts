import { NextRequest, NextResponse } from "next/server";
import { getDataProvider } from "@/lib/data-provider";
import { getAuthenticatedClient } from "@/lib/dual-auth";

export const dynamic = "force-dynamic";

// GET /api/properties — List all properties
export async function GET() {
  try {
    const provider = getDataProvider();
    const properties = await provider.listProperties();
    return NextResponse.json({ properties });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
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
    let templateId = body.templateId || process.env.DUAL_PROPERTIES_TEMPLATE_ID || cachedTemplateId || '';
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
