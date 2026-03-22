import { NextRequest, NextResponse } from "next/server";
import { getDualClient } from "@/lib/dual-client";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { objectId: string } }
) {
  try {
    const client = getDualClient();
    // List faces and filter by objectId context if possible
    const faces = await client.faces.listFaces({ objectId: params.objectId });
    return NextResponse.json({ faces });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch faces" },
      { status: err.status || 500 }
    );
  }
}
