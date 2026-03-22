import { NextRequest, NextResponse } from "next/server";
import { getDualClient } from "@/lib/dual-client";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { objectId: string } }
) {
  try {
    const client = getDualClient();
    const parents = await client.objects.getObjectParents(params.objectId);
    return NextResponse.json({ parents });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch parents" },
      { status: err.status || 500 }
    );
  }
}
