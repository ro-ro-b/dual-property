import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/dual-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/objects/:objectId
 * Get raw gateway object (no mapping).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ objectId: string }> }
) {
  try {
    const { objectId } = await params;
    const client = await getAuthenticatedClient();
    if (!client) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const data = await client.objects.getObject(objectId);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

/**
 * PATCH /api/objects/:objectId
 * Update an object's metadata/custom fields.
 *
 * Body: { metadata?: { name?, description?, image?: { url } }, custom?: { ... } }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ objectId: string }> }
) {
  try {
    const { objectId } = await params;
    const client = await getAuthenticatedClient();
    if (!client) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const result = await client.objects.updateObject(objectId, body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Object update failed" }, { status: err.status || 500 });
  }
}
