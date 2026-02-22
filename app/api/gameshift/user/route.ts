/**
 * Phase 2: GameShift – create or get user (embedded wallet).
 * Requires GAMESHIFT_API_KEY in .env.local.
 */
import { NextRequest, NextResponse } from "next/server";
import { createOrGetUser, getUserByReferenceId } from "@/lib/gameshift";

export async function POST(request: NextRequest) {
  if (!process.env.GAMESHIFT_API_KEY) {
    return NextResponse.json(
      { error: "GameShift is not configured (GAMESHIFT_API_KEY)" },
      { status: 503 }
    );
  }
  let body: { email: string; referenceId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }
  const { email, referenceId } = body;
  if (!email || typeof email !== "string") {
    return NextResponse.json(
      { error: "email is required" },
      { status: 400 }
    );
  }
  try {
    const user = await createOrGetUser({ email, referenceId });
    return NextResponse.json(user);
  } catch (e) {
    const message = e instanceof Error ? e.message : "GameShift error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!process.env.GAMESHIFT_API_KEY) {
    return NextResponse.json(
      { error: "GameShift is not configured" },
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
    const user = await getUserByReferenceId(referenceId);
    if (!user) return NextResponse.json(null, { status: 404 });
    return NextResponse.json(user);
  } catch (e) {
    const message = e instanceof Error ? e.message : "GameShift error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
