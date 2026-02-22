# DRiP Royale — War of Art

Transform passive DRiP cNFTs into active game assets. Winner-takes-all card battles on Solana.

## Setup

1. **Copy environment variables**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in `.env.local`** (see `.env.example`):
   - **Phase 1:** `NEXT_PUBLIC_HELIUS_API_KEY` / `HELIUS_API_KEY` from [Helius](https://dashboard.helius.dev/api-keys).
   - **Phase 2 (GameShift):** `GAMESHIFT_API_KEY` (required for users/items/transfers), `NEXT_PUBLIC_GAMESHIFT_API_KEY` (shows Connect button), and `GAMESHIFT_WALLET_KEY` (required for sending items to winner from developer wallet).
   - **Optional:** `NEXT_PUBLIC_DRIP_CREATOR_ADDRESS` to filter verified DRiP collectibles only.

3. **Install and run**
   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Project structure

- **The Vault** (`/vault`) — Deck builder: choose deck size (6–52), load wallet DRiP assets via Helius DAS, select that many for your Battle Deck.
- **The Arena** (`/arena`) — 1v1 War: flip cards, high card takes both; on tie, Royale War (3 face-down + 4th decides pile).
- **The Ledger** (`/ledger`) — History of won/lost assets with Solscan links.

## Tech

- **Phase 1:** Next.js 14, Helius DAS `getAssetsByOwner`, TypeScript War engine, server-side validation API.
- **Phase 2 (GameShift):** Embedded wallets (create/get user by email), list items by owner (`/nx/items`), transfer from developer wallet to user (`/nx/developer-wallet/items/:id/transfer`), user currencies. Connect button in header creates or fetches user and shows wallet address. Settlement uses `settleMatch()` to transfer won items to winner (requires `GAMESHIFT_WALLET_KEY`).

## Game rules

- Deck size is flexible (6–52 cards, user choice); power 2–10 (common scaling).
- Each turn: flip one card each. Higher power wins both cards.
- On tie: 3 cards staked face-down from each, 4th flip decides winner of entire pile.
- When a deck is depleted, the match ends and settlement runs (Phase 2: GameShift transfer).
