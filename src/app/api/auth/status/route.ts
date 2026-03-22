import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated, getJwtToken } from "@/lib/dual-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Check in-memory cache first
  let authed = isAuthenticated();
  let token = getJwtToken();

  // Fallback: check cookie
  if (!authed || !token) {
    const jwtCookie = req.cookies.get('dual_jwt');
    if (jwtCookie?.value) {
      try {
        const payload = JSON.parse(Buffer.from(jwtCookie.value.split('.')[1], 'base64').toString());
        if ((payload.exp || 0) * 1000 > Date.now()) {
          authed = true;
          token = jwtCookie.value;
        }
      } catch {
        // invalid JWT
      }
    }
  }

  return NextResponse.json({
    authenticated: authed,
    ...(authed && token ? { token } : {}),
  });
}
