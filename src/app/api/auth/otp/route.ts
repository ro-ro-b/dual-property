import { NextRequest, NextResponse } from "next/server";
import { sendOtp } from "@/lib/dual-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }
    await sendOtp(email);
    return NextResponse.json({ success: true, message: "OTP sent" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
