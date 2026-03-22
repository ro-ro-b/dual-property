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
    return NextResponse.json({
      success: true,
      message: "Authenticated with org context",
      expiresAt: tokens.expiresAt,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
