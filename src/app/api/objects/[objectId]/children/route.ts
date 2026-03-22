import { NextRequest, NextResponse } from "next/server";
import { getDualClient } from "@/lib/dual-client";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { objectId: string } }
) {
  try {
    const client = getDualClient();
    const children = await client.objects.getObjectChildren(params.objectId);
    return NextResponse.json({ children });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch children" },
      { status: err.status || 500 }
    );
  }
}
