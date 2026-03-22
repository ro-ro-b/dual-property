import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/dual-auth";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  // Check in-memory cache first, then cookie fallback
  let authed = isAuthenticated();

  if (!authed) {
    try {
      const cookieStore = await cookies();
      const jwtCookie = cookieStore.get('dual_jwt');
      if (jwtCookie?.value) {
        // Validate JWT isn't expired
        try {
          const payload = JSON.parse(Buffer.from(jwtCookie.value.split('.')[1], 'base64').toString());
          authed = (payload.exp || 0) * 1000 > Date.now();
        } catch {
          authed = false;
        }
      }
    } catch {
      // ignore
    }
  }

  return NextResponse.json({
    authenticated: authed,
  });
}
