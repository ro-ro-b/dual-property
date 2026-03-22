import { NextRequest, NextResponse } from "next/server";
import { getOrgToken } from "@/lib/get-org-token";

export const dynamic = "force-dynamic";

// POST /api/properties/burn-all — Burn multiple property tokens
// Body: { ids: ["id1", "id2", ...] }
export async function POST(req: NextRequest) {
  const jwtToken = await getOrgToken(req);
  if (!jwtToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Only use JWT for burn (not API key)
  if (jwtToken.split('.').length !== 3) {
    return NextResponse.json({ error: 'Burn requires JWT auth, not API key. Login via OTP first.' }, { status: 401 });
  }

  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
  }

  const BASE = process.env.NEXT_PUBLIC_DUAL_API_URL || 'https://gateway-48587430648.europe-west6.run.app';
  const results: any[] = [];

  for (const id of ids) {
    // Try multiple burn approaches
    let success = false;
    let lastError = '';

    // Approach 1: /actions/execute with objectId + actionTypeId
    try {
      const res = await fetch(`${BASE}/actions/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({ objectId: id, actionTypeId: 'burn' }),
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok) {
        results.push({ id, approach: 'actions/execute', success: true, data });
        success = true;
        continue;
      }
      lastError = `actions/execute: ${res.status} ${data.message || JSON.stringify(data)}`;
    } catch (err: any) {
      lastError = `actions/execute: ${err.message}`;
    }

    // Approach 2: /ebus/execute with action.burn.object_ids
    if (!success) {
      try {
        const res = await fetch(`${BASE}/ebus/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`,
          },
          body: JSON.stringify({ action: { burn: { object_ids: [id] } } }),
          cache: 'no-store',
        });
        const data = await res.json();
        if (res.ok) {
          results.push({ id, approach: 'ebus/object_ids', success: true, data });
          success = true;
          continue;
        }
        lastError += ` | ebus/object_ids: ${res.status} ${data.message || JSON.stringify(data)}`;
      } catch (err: any) {
        lastError += ` | ebus/object_ids: ${err.message}`;
      }
    }

    // Approach 3: DELETE /objects/{id}
    if (!success) {
      try {
        const res = await fetch(`${BASE}/objects/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`,
          },
          cache: 'no-store',
        });
        const text = await res.text();
        if (res.ok) {
          results.push({ id, approach: 'DELETE /objects', success: true, data: text });
          success = true;
          continue;
        }
        lastError += ` | DELETE: ${res.status} ${text.substring(0, 100)}`;
      } catch (err: any) {
        lastError += ` | DELETE: ${err.message}`;
      }
    }

    results.push({ id, success: false, errors: lastError });
  }

  return NextResponse.json({ results });
}
