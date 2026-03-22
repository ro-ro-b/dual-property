import { NextRequest, NextResponse } from "next/server";
import { loginWithOtp } from "@/lib/dual-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) {
      return NextResponse.json({ error: "email and otp are required" }, { status: 400 });
    }
    const tokens = await loginWithOtp(email, otp);

    // Return JWT to client + set cookie for serverless persistence
    const response = NextResponse.json({
      success: true,
      message: "Authenticated with org context",
      expiresAt: tokens.expiresAt,
      token: tokens.accessToken, // Client stores this for Authorization header
    });

    response.cookies.set('dual_jwt', tokens.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 3600,
    });

    if (tokens.refreshToken) {
      response.cookies.set('dual_refresh', tokens.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 86400,
      });
    }

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
