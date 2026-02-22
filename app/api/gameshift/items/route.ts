/**
 * GameShift – list items by owner (GET ?ownerReferenceId=...&page=1&perPage=50)
 */
import { NextRequest, NextResponse } from "next/server";
import { listItems } from "@/lib/gameshift";

export async function GET(request: NextRequest) {
  if (!process.env.GAMESHIFT_API_KEY) {
    return NextResponse.json(
      { error: "GameShift is not configured (GAMESHIFT_API_KEY)" },
      { status: 503 }
    );
  }
  const ownerReferenceId = request.nextUrl.searchParams.get("ownerReferenceId");
  if (!ownerReferenceId) {
    return NextResponse.json(
      { error: "ownerReferenceId query required" },
      { status: 400 }
    );
  }
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10));
  const perPage = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get("perPage") ?? "50", 10)));
  try {
    const result = await listItems({
      ownerReferenceId,
      page,
      perPage,
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "GameShift error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
