/**
 * API: Validate card values (server-side anti-cheat)
 */
import { NextRequest, NextResponse } from "next/server";
import { validateCardPower } from "@/lib/warEngine";
import type { GameCard } from "@/lib/types";

export async function POST(request: NextRequest) {
  let body: { cards: GameCard[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { valid: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const { cards } = body;
  if (!Array.isArray(cards)) {
    return NextResponse.json(
      { valid: false, error: "cards must be an array" },
      { status: 400 }
    );
  }

  const invalid = cards.filter((c) => !validateCardPower(c));
  const valid = invalid.length === 0;

  return NextResponse.json({
    valid,
    invalidCount: invalid.length,
    invalidIds: invalid.map((c) => c.assetId),
  });
}
