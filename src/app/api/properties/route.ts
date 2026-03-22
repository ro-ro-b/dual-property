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

// POST /api/properties — Mint a new property token
export async function POST(req: NextRequest) {
  try {
    const client = await getAuthenticatedClient();
    if (!client) {
      return NextResponse.json(
        { error: "Not authenticated. Login first via /api/auth/otp and /api/auth/login." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const templateId = body.templateId || process.env.DUAL_PROPERTIES_TEMPLATE_ID || '';
    const num = body.num || 1;
    const rawData = body.data || {};

    if (!templateId) {
      return NextResponse.json({ error: "Properties template ID not configured" }, { status: 400 });
    }

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

    if (Object.keys(custom).length > 0) {
      mintData.custom = custom;
    }

    const actionPayload: any = {
      action: {
        mint: {
          template_id: templateId,
          num,
          ...(Object.keys(mintData).length > 0 ? { data: mintData } : {}),
        },
      },
    };

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
    return NextResponse.json({ error: message }, { status });
  }
}
