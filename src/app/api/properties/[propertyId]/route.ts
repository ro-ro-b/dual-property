import { NextRequest, NextResponse } from "next/server";
import { getDataProvider } from "@/lib/data-provider";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const provider = getDataProvider();
    const property = await provider.getProperty(params.propertyId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    return NextResponse.json(property);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
