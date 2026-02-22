/**
 * GameShift – transfer item from developer wallet to user (POST).
 * Body: { itemId, recipientReferenceId, amount? }
 * Requires GAMESHIFT_API_KEY and GAMESHIFT_WALLET_KEY.
 */
import { NextRequest, NextResponse } from "next/server";
import { transferItemToUser } from "@/lib/gameshift";

export async function POST(request: NextRequest) {
  if (!process.env.GAMESHIFT_API_KEY) {
    return NextResponse.json(
      { error: "GameShift is not configured (GAMESHIFT_API_KEY)" },
      { status: 503 }
    );
  }
  if (!process.env.GAMESHIFT_WALLET_KEY) {
    return NextResponse.json(
      { error: "GameShift wallet not configured (GAMESHIFT_WALLET_KEY required for transfers)" },
      { status: 503 }
    );
  }
  let body: { itemId: string; recipientReferenceId: string; amount?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { itemId, recipientReferenceId, amount } = body;
  if (!itemId || !recipientReferenceId) {
    return NextResponse.json(
      { error: "itemId and recipientReferenceId are required" },
      { status: 400 }
    );
  }
  try {
    const result = await transferItemToUser({
      itemId,
      recipientReferenceId,
      ...(amount != null && { amount }),
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "GameShift transfer failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
