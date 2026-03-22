import { NextRequest, NextResponse } from "next/server";
import { getDualClient } from "@/lib/data-provider";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, filters } = body;

    const client = getDualClient();
    const results = await client.objects.searchObjects({
      query: query || "",
      ...filters,
    });

    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Search failed" },
      { status: err.status || 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q") || "";
    const client = getDualClient();
    const results = await client.objects.searchObjects({ query: q });
    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Search failed" },
      { status: err.status || 500 }
    );
  }
}
