import { NextRequest, NextResponse } from "next/server";
import { getDataProvider } from "@/lib/data-provider";

export const dynamic = "force-dynamic";

export async function GET() {
  const provider = getDataProvider();
  const actions = await provider.listActions();
  return NextResponse.json(actions);
}

export async function POST(req: NextRequest) {
  try {
    const provider = getDataProvider();
    const { wineId, type, params } = await req.json();
    if (!wineId || !type) {
      return NextResponse.json({ error: "wineId and type are required" }, { status: 400 });
    }
    const action = await provider.executeAction(wineId, type, params);
    return NextResponse.json(action, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
