import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/dual-auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/mint
 * Mint a new wine token via /ebus/execute.
 * Requires prior authentication via /api/auth/login.
 *
 * Body: { templateId?, num?, data? }
 *
 * The `data` field is structured into:
 *   - metadata: { name, description, image } — object-level overrides
 *   - custom: { vintage, region, varietal, ... } — wine-specific fields
 */
export async function POST(req: NextRequest) {
  try {
    const client = await getAuthenticatedClient();
    if (!client) {
      return NextResponse.json(
        { error: "Not authenticated. Send OTP and login first via /api/auth/otp and /api/auth/login." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const templateId = body.templateId || process.env.DUAL_TEMPLATE_ID || '';
    const num = body.num || 1;
    // Accept either body.data (nested) or flat top-level fields
    const { templateId: _t, num: _num, data: _data, ...topLevelFields } = body;
    const rawData = body.data || (Object.keys(topLevelFields).length > 0 ? topLevelFields : {});

    if (!templateId) {
      return NextResponse.json({ error: "templateId is required" }, { status: 400 });
    }

    // Structure the data into metadata + custom per DUAL object schema.
    // The form sends flat wine fields — we re-map them here.
    const mintData: Record<string, any> = {};

    // metadata overrides (name, description, image shown on the token & Blockscout)
    if (rawData.name || rawData.description || rawData.imageUrl) {
      mintData.metadata = {
        ...(rawData.name ? { name: rawData.name } : {}),
        ...(rawData.description ? { description: rawData.description } : {}),
        ...(rawData.imageUrl ? { image: { url: rawData.imageUrl, name: rawData.name || 'token-image', type: 'image/png' } } : {}),
      };
    }

    // Everything else goes into custom.
    // Also keep name/description in custom so the data provider can read them
    // (template metadata may override object-level metadata on read).
    const {
      name: _n, description: _d, // already mapped to metadata
      ...customFields
    } = rawData;

    const custom: Record<string, any> = { ...customFields };
    if (rawData.name) custom.name = rawData.name;
    if (rawData.description) custom.description = rawData.description;

    if (Object.keys(custom).length > 0) {
      mintData.custom = custom;
    }

    // Build the action payload per API v3 spec
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
    const message = err.body?.message || err.message || "Mint failed";
    return NextResponse.json({ error: message }, { status });
  }
}
