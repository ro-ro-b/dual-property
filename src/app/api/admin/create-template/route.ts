import { NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/dual-auth";

export const dynamic = "force-dynamic";

// POST /api/admin/create-template — Create a property template on the DUAL platform
export async function POST() {
  try {
    const client = await getAuthenticatedClient();
    if (!client) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const result = await client.templates.createTemplate({
      name: "Property Token",
      description: "Tokenised real estate property",
      category: "real-estate",
      schema: {
        name: { type: "string", required: true },
        address: { type: "string" },
        city: { type: "string" },
        country: { type: "string" },
        propertyType: { type: "string" },
        yearBuilt: { type: "number" },
        totalSqft: { type: "number" },
        numberOfUnits: { type: "number" },
        description: { type: "string" },
        keyFeatures: { type: "string" },
        totalPropertyValue: { type: "number" },
        tokenPricePerShare: { type: "number" },
        totalTokens: { type: "number" },
        annualYield: { type: "number" },
        minimumInvestment: { type: "number" },
      },
    });

    return NextResponse.json({
      success: true,
      templateId: result.id || result.template_id || result?.data?.id,
      result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, body: err.body }, { status: 500 });
  }
}

// GET — List templates using authenticated client
export async function GET() {
  try {
    const client = await getAuthenticatedClient();
    if (!client) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const result = await client.templates.listTemplates({ limit: 50 });
    return NextResponse.json({ result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, body: err.body }, { status: 500 });
  }
}
