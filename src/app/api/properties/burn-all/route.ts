import { NextRequest, NextResponse } from "next/server";
import { getOrgToken } from "@/lib/get-org-token";

export const dynamic = "force-dynamic";

// POST /api/properties/burn-all — Burn multiple property tokens
// Body: { ids: ["id1", "id2", ...] }
// Correct gateway format: { action: { burn: { id: "..." } } } (singular "id")
export async function POST(req: NextRequest) {
  const jwtToken = await getOrgToken(req);
  if (!jwtToken || jwtToken.split('.').length !== 3) {
    return NextResponse.json({ error: 'Burn requires JWT auth. Login via OTP first.' }, { status: 401 });
  }

  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
  }

  const BASE = process.env.NEXT_PUBLIC_DUAL_API_URL || 'https://gateway-48587430648.europe-west6.run.app';
  const results: any[] = [];

  for (const id of ids) {
    try {
      const res = await fetch(`${BASE}/ebus/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({ action: { burn: { id } } }),
        cache: 'no-store',
      });
      const data = await res.json();
      results.push({ id, success: res.ok, actionId: data.action_id, error: res.ok ? null : data.message });
    } catch (err: any) {
      results.push({ id, success: false, error: err.message });
    }
  }

  return NextResponse.json({ results });
}
