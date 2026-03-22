import { NextRequest, NextResponse } from "next/server";
import { getOrgToken, dualFetch } from "@/lib/get-org-token";

export const dynamic = "force-dynamic";

// DELETE /api/properties/[propertyId]/burn — Burn (delete) a property token
// Requires the owner's JWT (from session cookie) — API key alone can't burn
export async function DELETE(
  req: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  // Get the user's org-scoped JWT from cookie/header
  const jwtToken = await getOrgToken(req);
  if (!jwtToken) {
    return NextResponse.json({ error: 'Not authenticated. Login via OTP first.' }, { status: 401 });
  }

  const BASE = process.env.NEXT_PUBLIC_DUAL_API_URL || 'https://gateway-48587430648.europe-west6.run.app';

  try {
    // Burn requires Bearer JWT from the token owner — send directly
    const res = await fetch(`${BASE}/ebus/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        action: {
          burn: {
            ids: [params.propertyId],
          },
        },
      }),
      cache: 'no-store',
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
