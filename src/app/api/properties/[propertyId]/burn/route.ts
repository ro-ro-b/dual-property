import { NextRequest, NextResponse } from "next/server";
import { dualFetch } from "@/lib/get-org-token";

export const dynamic = "force-dynamic";

// DELETE /api/properties/[propertyId]/burn — Burn (delete) a property token
export async function DELETE(
  req: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  const apiKey = process.env.DUAL_API_TOKEN || process.env.DUAL_API_KEY || '';
  if (!apiKey) {
    return NextResponse.json({ error: 'No API token configured' }, { status: 500 });
  }

  try {
    const res = await dualFetch('/ebus/execute', apiKey, {
      method: 'POST',
      body: JSON.stringify({
        action: {
          burn: {
            ids: [params.propertyId],
          },
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.message || 'Burn failed', details: data }, { status: res.status });
    }

    return NextResponse.json({ success: true, result: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
