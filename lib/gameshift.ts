/**
 * GameShift API integration (Phase 2)
 * - Users (embedded wallets): create, get by referenceId
 * - Items: list by owner
 * - Transfers: from developer wallet to user (settlement)
 * Docs: https://docs.gameshift.dev
 */

const GAMESHIFT_BASE =
  process.env.GAMESHIFT_ENV === "production"
    ? "https://api.gameshift.dev"
    : "https://api.gameshift.dev"; // use same base; set GAMESHIFT_ENV for future sandbox

function getApiKey(): string {
  const key = process.env.GAMESHIFT_API_KEY;
  if (!key) throw new Error("GAMESHIFT_API_KEY is not set");
  return key;
}

function getWalletKey(): string | null {
  return process.env.GAMESHIFT_WALLET_KEY ?? null;
}

function headers(includeWallet = false): Record<string, string> {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-key": getApiKey(),
  };
  const walletKey = getWalletKey();
  if (includeWallet && walletKey) h["x-wallet-key"] = walletKey;
  return h;
}

// --- Users ---

export interface CreateUserParams {
  email: string;
  referenceId?: string;
}

export interface GameShiftUser {
  id: string;
  address?: string;
  walletAddress?: string;
  email?: string;
  referenceId?: string;
}

/** Create a user (embedded wallet). Email locks the key in HSM. */
export async function createOrGetUser(
  params: CreateUserParams
): Promise<GameShiftUser> {
  const res = await fetch(`${GAMESHIFT_BASE}/users`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GameShift createUser failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as GameShiftUser & { walletAddress?: string };
  return {
    id: data.id,
    address: data.address ?? data.walletAddress,
    walletAddress: data.walletAddress ?? data.address,
    email: data.email,
    referenceId: data.referenceId ?? params.referenceId,
  };
}

/** Get user by reference ID. Tries /users/{referenceId} then /users/reference-id/{referenceId}. */
export async function getUserByReferenceId(
  referenceId: string
): Promise<GameShiftUser | null> {
  const paths = [
    `${GAMESHIFT_BASE}/users/${encodeURIComponent(referenceId)}`,
    `${GAMESHIFT_BASE}/users/reference-id/${encodeURIComponent(referenceId)}`,
  ];
  for (const url of paths) {
    const res = await fetch(url, { headers: headers() });
    if (res.status === 404) continue;
    if (!res.ok) throw new Error(`GameShift getUser failed: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as GameShiftUser & { walletAddress?: string };
    return {
      id: data.id,
      address: data.address ?? data.walletAddress,
      walletAddress: data.walletAddress ?? data.address,
      email: data.email,
      referenceId: data.referenceId ?? referenceId,
    };
  }
  return null;
}

/** Get user currencies (SOL, USDC, etc.) for a referenceId. */
export async function getUserCurrencies(referenceId: string): Promise<{
  items: Array<{ id: string; name?: string; quantity: string; [k: string]: unknown }>;
}> {
  const res = await fetch(
    `${GAMESHIFT_BASE}/users/${encodeURIComponent(referenceId)}/currencies`,
    { headers: headers() }
  );
  if (res.status === 404) return { items: [] };
  if (!res.ok) throw new Error(`GameShift getUserCurrencies failed: ${res.status}`);
  return res.json();
}

// --- Items (game assets) ---

export interface GameShiftItem {
  id: string;
  type: "UniqueAsset" | "Currency";
  name?: string;
  description?: string;
  imageUrl?: string;
  owner?: { address?: string; referenceId?: string };
  [key: string]: unknown;
}

export interface ListItemsParams {
  ownerReferenceId: string;
  page?: number;
  perPage?: number;
  types?: ("UniqueAsset" | "Currency")[];
}

export interface ListItemsResult {
  items: GameShiftItem[];
  page: number;
  perPage: number;
  totalPages: number;
  totalResults: number;
}

/** List items (assets) owned by a user. */
export async function listItems(
  params: ListItemsParams
): Promise<ListItemsResult> {
  const { ownerReferenceId, page = 1, perPage = 50, types } = params;
  const url = new URL(`${GAMESHIFT_BASE}/nx/items`);
  url.searchParams.set("ownerReferenceId", ownerReferenceId);
  url.searchParams.set("page", String(page));
  url.searchParams.set("perPage", String(perPage));
  if (types?.length) url.searchParams.set("types", types.join(","));

  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(`GameShift listItems failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// --- Transfers (developer wallet → user) ---

export interface TransferItemParams {
  itemId: string;
  recipientReferenceId: string;
  amount?: string; // for Currency type
}

/** Transfer an item from the developer wallet to a user (by referenceId). Requires GAMESHIFT_WALLET_KEY. */
export async function transferItemToUser(
  params: TransferItemParams
): Promise<{ id: string; txSignature?: string; [k: string]: unknown }> {
  const walletKey = getWalletKey();
  if (!walletKey) throw new Error("GAMESHIFT_WALLET_KEY is required for transfers");

  const { itemId, recipientReferenceId, amount } = params;
  const res = await fetch(
    `${GAMESHIFT_BASE}/nx/developer-wallet/items/${encodeURIComponent(itemId)}/transfer`,
    {
      method: "POST",
      headers: headers(true),
      body: JSON.stringify({
        recipientReferenceId,
        ...(amount != null && { amount }),
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GameShift transfer failed: ${res.status} ${err}`);
  }
  return res.json();
}

// --- Escrow & settlement (for DRiP Royale match flow) ---

/**
 * "Escrow" for a match: record that these GameShift item IDs are committed.
 * Actual movement of assets into escrow depends on your flow:
 * - If using GameShift items: user must first transfer to developer wallet (user-initiated), or you use your developer wallet to hold match stakes.
 * - If using external cNFTs (e.g. DRiP): use Helius + Solana transfers for lock/settle; GameShift is for embedded wallets and optional in-game assets.
 */
export async function escrowBattleDeck(
  _userReferenceId: string,
  itemIds: string[]
): Promise<{ escrowId: string; itemIds: string[] }> {
  // GameShift does not expose a dedicated escrow API. Items must already be in the developer wallet
  // or the user initiates a transfer (email approval). We return a logical escrow id for your match state.
  return {
    escrowId: `escrow-${Date.now()}`,
    itemIds,
  };
}

/**
 * Settle match: transfer won items from developer wallet to winner.
 * Call transferItemToUser for each won item. Requires items to be in developer wallet.
 */
export async function settleMatch(
  winnerReferenceId: string,
  _loserReferenceId: string,
  wonItemIds: string[]
): Promise<{ txSignatures: string[] }> {
  const txSignatures: string[] = [];
  for (const itemId of wonItemIds) {
    try {
      const result = await transferItemToUser({
        itemId,
        recipientReferenceId: winnerReferenceId,
      });
      const sig = (result as { txSignature?: string }).txSignature;
      if (sig) txSignatures.push(sig);
    } catch (e) {
      console.error(`GameShift settle transfer failed for item ${itemId}:`, e);
      throw e;
    }
  }
  return { txSignatures };
}
