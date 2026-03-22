import { NextRequest, NextResponse } from "next/server";
import { getDualClient } from "@/lib/data-provider";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, filters } = body;
    const client = getDualClient();

    // Dual strategy: try searchObjects first, fall back to local listing
    try {
      const results = await client.objects.searchObjects({
        query: query || "",
        ...filters,
      });
      return NextResponse.json({ results });
    } catch {
      // Fallback: list all objects and filter locally
      const allObjects = await client.objects.listObjects({ limit: 100 });
      const items = Array.isArray(allObjects?.data) ? allObjects.data : Array.isArray(allObjects) ? allObjects : [];
      const q = (query || "").toLowerCase();
      const filtered = q
        ? items.filter((obj: any) => {
            const name = (obj.name || obj.title || "").toLowerCase();
            const type = (obj.type || "").toLowerCase();
            const id = (obj.id || "").toLowerCase();
            return name.includes(q) || type.includes(q) || id.includes(q);
          })
        : items;
      return NextResponse.json({ results: filtered });
    }
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

    // Dual strategy: try searchObjects first, fall back to local listing
    try {
      const results = await client.objects.searchObjects({ query: q });
      return NextResponse.json({ results });
    } catch {
      const allObjects = await client.objects.listObjects({ limit: 100 });
      const items = Array.isArray(allObjects?.data) ? allObjects.data : Array.isArray(allObjects) ? allObjects : [];
      const query = q.toLowerCase();
      const filtered = query
        ? items.filter((obj: any) => {
            const name = (obj.name || obj.title || "").toLowerCase();
            const type = (obj.type || "").toLowerCase();
            const id = (obj.id || "").toLowerCase();
            return name.includes(query) || type.includes(query) || id.includes(query);
          })
        : items;
      return NextResponse.json({ results: filtered });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Search failed" },
      { status: err.status || 500 }
    );
  }
}
