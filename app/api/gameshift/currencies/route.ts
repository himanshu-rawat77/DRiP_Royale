/**
 * GameShift – get user currencies (GET ?referenceId=...)
 */
import { NextRequest, NextResponse } from "next/server";
import { getUserCurrencies } from "@/lib/gameshift";

export async function GET(request: NextRequest) {
  if (!process.env.GAMESHIFT_API_KEY) {
    return NextResponse.json(
      { error: "GameShift is not configured (GAMESHIFT_API_KEY)" },
      { status: 503 }
    );
  }
  const referenceId = request.nextUrl.searchParams.get("referenceId");
  if (!referenceId) {
    return NextResponse.json(
      { error: "referenceId query required" },
      { status: 400 }
    );
  }
  try {
    const result = await getUserCurrencies(referenceId);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "GameShift error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
