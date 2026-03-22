import { NextResponse } from "next/server";
import { getDataProvider } from "@/lib/data-provider";

export const dynamic = "force-dynamic";

export async function GET() {
  const provider = getDataProvider();
  const org = await provider.getOrganization("org-001");
  return NextResponse.json(org ? [org] : []);
}
