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

    // Store JWT in HTTP-only cookie so it survives across serverless invocations
    const response = NextResponse.json({
      success: true,
      message: "Authenticated with org context",
      expiresAt: tokens.expiresAt,
    });

    response.cookies.set('dual_jwt', tokens.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 3600, // 1 hour
    });

    if (tokens.refreshToken) {
      response.cookies.set('dual_refresh', tokens.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 86400, // 24 hours
      });
    }

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
