import { NextRequest, NextResponse } from "next/server";
import { getDataProvider } from "@/lib/data-provider";

export async function GET(_req: NextRequest, { params }: { params: { actionId: string } }) {
  const provider = getDataProvider();
  const action = await provider.getAction(params.actionId);
  if (!action) return NextResponse.json({ error: "Action not found" }, { status: 404 });
  return NextResponse.json(action);
}
