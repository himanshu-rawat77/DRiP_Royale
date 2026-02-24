/**
 * Match settlement API.
 * Wraps GameShift settleMatch() so the Arena can trigger reward transfers
 * from the developer wallet to the winner's GameShift embedded wallet.
 *
 * POST body: { winnerReferenceId, loserReferenceId, wonItemIds: string[] }
 */
import { NextRequest, NextResponse } from "next/server";
import { settleMatch } from "@/lib/gameshift";

export async function POST(request: NextRequest) {
  if (!process.env.GAMESHIFT_API_KEY) {
    return NextResponse.json(
      { error: "GameShift is not configured (GAMESHIFT_API_KEY)" },
      { status: 503 }
    );
  }
  if (!process.env.GAMESHIFT_WALLET_KEY) {
    return NextResponse.json(
      { error: "GameShift wallet not configured (GAMESHIFT_WALLET_KEY required for settlement)" },
      { status: 503 }
    );
  }

  let body: {
    winnerReferenceId?: string;
    loserReferenceId?: string;
    wonItemIds?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { winnerReferenceId, loserReferenceId, wonItemIds } = body;
  if (!winnerReferenceId || !Array.isArray(wonItemIds) || wonItemIds.length === 0) {
    return NextResponse.json(
      { error: "winnerReferenceId and non-empty wonItemIds are required" },
      { status: 400 }
    );
  }

  try {
    const result = await settleMatch(
      winnerReferenceId,
      loserReferenceId ?? "opponent",
      wonItemIds
    );
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "GameShift settlement failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

