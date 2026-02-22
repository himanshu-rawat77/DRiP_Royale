/**
 * API: Fetch DRiP assets for wallet (uses Helius server-side)
 * Query: owner (required), limit (optional, 6–52, default 52)
 */
import { NextRequest, NextResponse } from "next/server";
import { getAssetsByOwner, filterByDripCreator, assetToGameCard } from "@/lib/helius";
import type { GameCard } from "@/lib/types";

const MIN_DECK = 6;
const MAX_DECK = 52;
const POWER_MIN = 2;
const POWER_MAX = 10;

export async function GET(request: NextRequest) {
  const owner = request.nextUrl.searchParams.get("owner");
  if (!owner) {
    return NextResponse.json(
      { error: "Missing owner address" },
      { status: 400 }
    );
  }

  const rawLimit = request.nextUrl.searchParams.get("limit");
  const limit = rawLimit != null
    ? Math.min(MAX_DECK, Math.max(MIN_DECK, parseInt(rawLimit, 10) || MAX_DECK))
    : MAX_DECK;

  try {
    const dripCreator = process.env.NEXT_PUBLIC_DRIP_CREATOR_ADDRESS;
    const all: GameCard[] = [];
    let page = 1;
    const pageLimit = 1000;

    while (all.length < limit) {
      const { items } = await getAssetsByOwner({ ownerAddress: owner, page, limit: pageLimit });
      const dripOnly = filterByDripCreator(items, dripCreator);
      for (const asset of dripOnly) {
        if (all.length >= limit) break;
        const power =
          POWER_MIN + Math.floor(Math.random() * (POWER_MAX - POWER_MIN + 1));
        all.push(assetToGameCard(asset, power));
      }
      if (items.length < pageLimit) break;
      page++;
    }

    return NextResponse.json({
      cards: all.slice(0, limit),
      total: all.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch assets";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
