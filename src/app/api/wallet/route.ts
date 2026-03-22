import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function parseCookie(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const cookieValue = req.cookies.get("dual_wallet")?.value;
  const claimedIds: string[] = parseCookie(cookieValue);
  return NextResponse.json({ claimedIds });
}

export async function DELETE(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("dual_wallet");
  return response;
}
