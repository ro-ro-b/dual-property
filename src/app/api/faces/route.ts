import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/dual-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = await getAuthenticatedClient();
    if (!client) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const faces = await client.faces.listFaces({ limit: 50 });
    return NextResponse.json({ faces });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch faces" },
      { status: err.status || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const client = await getAuthenticatedClient();
    if (!client) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const face = await client.faces.createFace(body);
    return NextResponse.json({ face }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create face" },
      { status: err.status || 500 }
    );
  }
}
