/**
 * Helius DAS API – Asset Discovery (Phase 1)
 * getAssetsByOwner + filter by DRiP creator for verified collectibles
 */

import type { DASAsset } from "./types";
import type { GameCard } from "./types";

const DEFAULT_DECK_LIMIT = 52;
const POWER_MIN = 2;
const POWER_MAX = 10;

function getHeliusRpcUrl(): string {
  const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY || process.env.HELIUS_API_KEY;
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
  const base = network === "mainnet-beta"
    ? "https://mainnet.helius-rpc.com"
    : "https://devnet.helius-rpc.com";
  return apiKey ? `${base}/?api-key=${apiKey}` : base;
}

export interface GetAssetsByOwnerParams {
  ownerAddress: string;
  page?: number;
  limit?: number;
}

export interface GetAssetsByOwnerResult {
  items: DASAsset[];
  total?: number;
  page?: number;
  limit?: number;
}

/**
 * Fetch all assets owned by wallet via Helius DAS getAssetsByOwner
 */
export async function getAssetsByOwner(
  params: GetAssetsByOwnerParams
): Promise<GetAssetsByOwnerResult> {
  const { ownerAddress, page = 1, limit = 1000 } = params;
  const rpcUrl = getHeliusRpcUrl();

  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "drip-royale",
      method: "getAssetsByOwner",
      params: {
        ownerAddress,
        page,
        limit,
        options: {
          showUnverifiedCollections: false,
          showCollectionMetadata: false,
          showFungible: false,
          showNativeBalance: false,
        },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Helius DAS request failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as {
    result?: { items?: DASAsset[]; total?: number; page?: number; limit?: number };
    error?: { message: string };
  };

  if (data.error) {
    throw new Error(data.error.message || "Helius DAS error");
  }

  const result = data.result ?? {};
  return {
    items: result.items ?? [],
    total: result.total,
    page: result.page,
    limit: result.limit,
  };
}

/**
 * Filter assets by DRiP creator address (only verified DRiP collectibles)
 */
export function filterByDripCreator(
  items: DASAsset[],
  dripCreatorAddress: string | undefined
): DASAsset[] {
  if (!dripCreatorAddress) return items;
  const creatorLower = dripCreatorAddress.toLowerCase();
  return items.filter((asset) => {
    const creators = asset.creators ?? [];
    return creators.some(
      (c) => c.address.toLowerCase() === creatorLower && c.verified
    );
  });
}

/**
 * Map DAS asset to GameCard with power 2–10 (common scaling)
 */
export function assetToGameCard(asset: DASAsset, power: number): GameCard {
  const uri =
    asset.content?.files?.[0]?.cdn_uri ??
    asset.content?.files?.[0]?.uri ??
    "";
  return {
    assetId: asset.id,
    imageUri: uri,
    name: (asset.content as { metadata?: { name?: string } })?.metadata?.name,
    power: Math.max(POWER_MIN, Math.min(POWER_MAX, power)),
  };
}

/**
 * Fetch wallet's DRiP assets and build cards for a deck.
 * Assigns random power 2–10 to each. Returns up to maxCards (default 52).
 */
export async function fetchDripAssetsForDeck(
  ownerAddress: string,
  maxCards: number = DEFAULT_DECK_LIMIT
): Promise<GameCard[]> {
  const dripCreator = process.env.NEXT_PUBLIC_DRIP_CREATOR_ADDRESS;
  const cap = Math.min(Math.max(1, maxCards), DEFAULT_DECK_LIMIT);
  const all: GameCard[] = [];
  let page = 1;
  const limit = 1000;

  while (all.length < cap) {
    const { items } = await getAssetsByOwner({ ownerAddress, page, limit });
    const dripOnly = filterByDripCreator(items, dripCreator);
    for (const asset of dripOnly) {
      if (all.length >= cap) break;
      const power = POWER_MIN + Math.floor(Math.random() * (POWER_MAX - POWER_MIN + 1));
      all.push(assetToGameCard(asset, power));
    }
    if (items.length < limit) break;
    page++;
  }

  return all.slice(0, cap);
}
