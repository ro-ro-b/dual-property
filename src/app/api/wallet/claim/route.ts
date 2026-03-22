import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface ClaimRequest {
  objectId: string;
}

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

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: ClaimRequest = await req.json();
    const { objectId } = body;

    if (!objectId || typeof objectId !== "string") {
      return NextResponse.json({ error: "Invalid objectId" }, { status: 400 });
    }

    // Parse existing wallet from cookie using Next.js API
    const cookieValue = req.cookies.get("dual_wallet")?.value;
    const claimedIds: string[] = parseCookie(cookieValue);

    // Add new objectId if not already claimed
    if (!claimedIds.includes(objectId)) {
      claimedIds.push(objectId);
    }

    // Create response
    const response = NextResponse.json(
      { success: true, claimedIds },
      { status: 201 }
    );

    // Set cookie with JSON array — no manual encoding, Next.js handles it
    response.cookies.set("dual_wallet", JSON.stringify(claimedIds), {
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
    });

    return response;
  } catch (err: unknown) {
    return NextResponse.json({ error: "Failed to claim object" }, { status: 500 });
  }
}
