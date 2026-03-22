import { NextResponse } from "next/server";
import { getDataProvider } from "@/lib/data-provider";

export const dynamic = "force-dynamic";

export async function GET() {
  const provider = getDataProvider();
  const stats = await provider.getDashboardStats();
  return NextResponse.json(stats);
}
