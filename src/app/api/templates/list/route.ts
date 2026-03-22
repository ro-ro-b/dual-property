import { NextResponse } from "next/server";
import { getDualClient } from "@/lib/dual-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = getDualClient();
    const result = await client.templates.listTemplates({ limit: 50 });
    const templates = result?.items || result?.templates || result?.data || [];

    const mapped = (templates as any[]).map((t: any) => ({
      id: t.id || '',
      name: t.name || t.object?.metadata?.name || 'Untitled Template',
      description: t.object?.metadata?.description || '',
      category: t.object?.metadata?.category || 'general',
      createdAt: t.when_created || '',
    }));

    return NextResponse.json({ templates: mapped });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
