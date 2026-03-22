import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/dual-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    authenticated: isAuthenticated(),
  });
}
