import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/dual-auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { objectId: string } }
) {
  try {
    const client = await getAuthenticatedClient();
    if (!client) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Use StorageModule to fetch files associated with this object
    const files = await client.storage.getTemplateAssets(params.objectId).catch(() => ({ data: [] }));
    return NextResponse.json({ documents: files?.data || files || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch documents" },
      { status: err.status || 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: { objectId: string } }) {
  try {
    const client = await getAuthenticatedClient();
    if (!client) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const result = await client.storage.uploadFile({ ...body, objectId: params.objectId });
    return NextResponse.json({ result }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to upload document" },
      { status: err.status || 500 }
    );
  }
}
