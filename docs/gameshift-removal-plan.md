# GameShift Removal & Local Solana Wallet Migration Plan

This document outlines how to remove GameShift while preserving core DRiP Royale functionality:

- local player wallet identity,
- won/lost NFT tracking,
- NFT movement between players,
- and sending won NFTs to any external wallet.

## Current GameShift touchpoints in this repo

GameShift is currently used for:

1. Embedded user identity/wallet linking in `WalletConnect` and local storage session handling.
2. Server routes under `app/api/gameshift/*`.
3. Match settlement (`/api/match/settle`) via developer-wallet transfers.
4. Arena post-match settlement triggers.

## Target architecture (without GameShift)

Use a **wallet-native Solana flow**:

1. **Identity:** user connects a standard Solana wallet (Phantom/Solflare/Backpack) and signs a nonce for session auth.
2. **Inventory reads:** keep Helius DAS (`getAssetsByOwner`) for wallet asset discovery.
3. **Transfers/settlement:** perform SPL/cNFT transfers using your own backend signer + Solana RPC (or delegated transaction signing flow).
4. **Ledger:** keep your local ledger UX but persist to backend DB for integrity; localStorage can remain as cache.

## Recommended implementation phases

### Phase 1 — Introduce wallet-native session (keep gameplay unchanged)

- Replace `dripRoyale:gameshiftUser` with `dripRoyale:walletSession`.
- Session schema:
  - `walletAddress`
  - `signature`
  - `nonce`
  - `issuedAt`
- Add endpoints:
  - `POST /api/auth/nonce` → issue challenge nonce
  - `POST /api/auth/verify` → verify signed nonce and mint httpOnly session cookie
- UI updates:
  - Rename "Connect (GameShift)" to "Connect Wallet".
  - Display connected wallet short address anywhere GameShift profile is shown.

### Phase 2 — Replace settlement and transfer rails

- Remove dependency on `GAMESHIFT_API_KEY`, `GAMESHIFT_WALLET_KEY`, and `NEXT_PUBLIC_GAMESHIFT_*`.
- Replace `/api/match/settle` internals with Solana-native transfer logic:
  - Validate match result server-side.
  - Transfer staked/won NFT(s) from escrow custody or authorized source wallet to winner wallet.
  - Return transaction signatures for ledger links.
- Add `POST /api/transfer/nft` for user-initiated payout to arbitrary wallet:
  - Input: `mintAddress`/asset id, `destinationWallet`
  - Validate destination address format.
  - Verify sender ownership / custody rights.
  - Execute transfer and return tx signature.

### Phase 3 — Make won/lost tracking durable

- Keep localStorage for fast UI hydration, but persist authoritative records server-side:
  - `matches`
  - `settlements`
  - `nft_transfers`
- Continue exposing Solscan links from real signatures.
- In ledger page, fetch server history first, then merge local cache.

## Two safe custody models (choose one)

### A) Escrow custody wallet (recommended for competitive play)

- Before match starts, each player transfers stake NFT(s) into escrow wallet.
- After result, backend signs transfer from escrow to winner.
- Pros: deterministic settlement, no user interruption at result time.
- Cons: you operate custody infra and security controls.

### B) Non-custodial signed transfer at match end

- Winner/loser sign transfer transactions from their own wallet when required.
- Pros: less custody risk.
- Cons: worse UX; players can refuse signing after losing.

For a trust-minimized prize game, **A is usually better**.

## Data model to support your required functionality

Minimum entities:

- `players`
  - `id`, `wallet_address`, `created_at`
- `matches`
  - `id`, `player_a`, `player_b`, `winner`, `status`, `created_at`
- `match_assets`
  - `match_id`, `asset_id`, `owner_before`, `owner_after`
- `nft_transfers`
  - `id`, `asset_id`, `from_wallet`, `to_wallet`, `tx_signature`, `reason`, `created_at`

This gives you:

- won/lost NFT list per player,
- full transfer history between players,
- and external withdrawal history.

## Security controls you should not skip

- Verify wallet signatures server-side (nonce with expiry + replay protection).
- Validate ownership at transfer time using RPC/Helius.
- Rate-limit transfer endpoints and require auth for every settlement call.
- Store signer key in secure secret manager / KMS (not plain env in long term).
- Add audit logs for every transfer request + tx signature.

## Repo-level migration checklist

1. Remove GameShift modules and routes:
   - `lib/gameshift.ts`
   - `lib/gameshiftSession.ts`
   - `app/api/gameshift/*`
2. Refactor:
   - `components/WalletConnect.tsx`
   - `components/Arena.tsx`
   - `components/Ledger.tsx`
   - `app/api/match/settle/route.ts`
3. Update docs and env surface:
   - `.env.example`
   - `README.md`
4. Add Solana transfer utilities and auth middleware.
5. Add integration tests for:
   - auth nonce/verify
   - settlement success/failure
   - transfer-to-external-wallet.

## Suggested env variables after migration

- `HELIUS_API_KEY`
- `NEXT_PUBLIC_HELIUS_API_KEY`
- `NEXT_PUBLIC_SOLANA_NETWORK`
- `SOLANA_RPC_URL` (optional override)
- `ESCROW_PRIVATE_KEY` (short-term) or `KMS_KEY_ID` (preferred)
- `SESSION_SECRET`

## Practical first step (this week)

Ship a small vertical slice:

1. Wallet connect + signed session.
2. Replace Arena settlement call with a stubbed `/api/match/settle` that returns tx signature placeholders from your Solana service layer.
3. Add "Send won NFT" button in Ledger that calls `/api/transfer/nft` (devnet first).

Once this is stable on devnet, remove the remaining GameShift code paths entirely.
