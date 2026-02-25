# DRiP Royale

> **War of Art on Solana** — turn collectible DRiP cNFTs into battle-ready decks and compete in winner-takes-all card matches.

<img width="890" height="805" alt="Screenshot 2026-01-30 002608" src="assets\Screenshot 2026-02-25 231313.png" />

---

## Table of Contents

- [Overview](#overview)
- [Core Gameplay Loop](#core-gameplay-loop)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Run Locally](#run-locally)
- [Game Rules](#game-rules)
- [Scripts](#scripts)
- [API & Integration Notes](#api--integration-notes)
- [Security & Validation](#security--validation)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**DRiP Royale** is a Next.js-based Web3 game experience where players:

1. Connect and load eligible collectible assets.
2. Build a custom battle deck.
3. Enter a head-to-head “War” match.
4. Resolve outcomes and track historical wins/losses.

The project currently combines:
- **UI/gameplay orchestration** in Next.js + React.
- **Asset discovery and ownership checks** through Helius/GameShift-backed flows.
- **Deterministic card battle mechanics** inspired by the classic game of War.

---

## Core Gameplay Loop

1. **Vault (`/vault`)**
   - Choose deck size (6–52 cards).
   - Load owned DRiP assets.
   - Select cards to form your Battle Deck.

2. **Arena (`/arena`)**
   - Play 1v1 high-card rounds.
   - Winner collects the round pile.
   - Tie triggers a “Royale War” sequence.

3. **Ledger (`/ledger`)**
   - Review match outcomes.
   - Track collected/lost assets.
   - Follow on-chain references via explorer links.


<img width="890" height="805" alt="Screenshot 2026-01-30 002608" src="assets\Screenshot 2026-02-25 231530.png" />

<img width="890" height="805" alt="Screenshot 2026-01-30 002608" src="assets\Screenshot 2026-02-25 231643.png" />


---

## Features

- Flexible deck-building with player-selected deck size.
- Turn-based card resolution with tie escalation.
- Web3-compatible ownership-aware item handling.
- User history and ledger-style match tracking.
- Modular route-based experience (`vault`, `arena`, `ledger`, and battleground/home surfaces).

---

## Tech Stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **UI Runtime:** React 18
- **Styling:** Tailwind CSS
- **Blockchain SDK:** `@solana/web3.js`
- **Integrations:** Helius APIs, GameShift APIs (project phase dependent)

---

## Project Structure

```text
app/
  page.tsx              # Landing / entry
  vault/page.tsx        # Deck builder
  arena/page.tsx        # Match gameplay
  ledger/page.tsx       # Match history
  battleground/page.tsx # Additional gameplay surface
components/             # Shared UI and domain components
lib/                    # Helpers, data utilities, integration logic
public/                 # Static media and game assets
scripts/                # Utility scripts (asset copy, build helpers)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- A Helius API key (Phase 1/asset discovery)
- A GameShift API key + wallet key (Phase 2/settlement flows)

### Installation

```bash
git clone <your-repo-url>
cd DRiP_Royale
npm install
```

### Environment Variables

Create local env file:

```bash
cp .env.example .env.local
```

Suggested variables:

| Variable | Required | Description |
|---|---:|---|
| `NEXT_PUBLIC_HELIUS_API_KEY` | Yes (Phase 1) | Client-accessible Helius key for asset views. |
| `HELIUS_API_KEY` | Yes (Phase 1) | Server-side Helius key for secure calls. |
| `GAMESHIFT_API_KEY` | Yes (Phase 2) | Backend GameShift key for user/item operations. |
| `NEXT_PUBLIC_GAMESHIFT_API_KEY` | Optional/UI-gated | Enables client-facing connect/flow controls. |
| `GAMESHIFT_WALLET_KEY` | Yes (Phase 2 settlement) | Developer wallet key used for item transfer settlement. |
| `NEXT_PUBLIC_DRIP_CREATOR_ADDRESS` | Optional | Restricts displayed assets to verified DRiP creator assets. |

> Keep server-side secrets out of client code and never commit `.env.local`.

### Run Locally

```bash
npm run dev
```

Open: `http://localhost:3000`

---

## Game Rules

- Deck size range: **6 to 52** cards.
- Card power range: **2 to 10** (current scaling model).
- Each round: both players reveal one card.
- Higher power wins the round and takes both cards.
- Tie → **Royale War**:
  - 3 cards face-down per player into stake.
  - 4th card revealed decides winner of entire stake.
- Match ends when a player cannot continue due to deck depletion.

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Copies required assets, then starts local Next.js dev server. |
| `npm run build` | Creates production build. |
| `npm run start` | Starts production server from built output. |
| `npm run lint` | Runs Next.js linting checks. |

---

## API & Integration Notes

- **Helius (Asset Discovery):** Supports reading wallet-owned assets for deck construction.
- **GameShift (User + Settlement):**
  - Create/fetch users (e.g., email-based flow).
  - Read owned items/currencies.
  - Transfer won items from developer wallet during settlement.

These integration paths can be enabled progressively depending on deployment phase.

---

## Security & Validation

- Prefer server-side validation for ownership and settlement-sensitive actions.
- Ensure all transfer requests are authenticated and audit-logged.
- Rotate API keys and wallet secrets regularly.
- Apply strict allowlists/filters for creator-verified assets where needed.

---

## Deployment

Recommended production baseline:

1. Deploy on a Next.js-friendly host (e.g., Vercel).
2. Configure environment variables in host secrets manager.
3. Run `npm run build` in CI.
4. Gate production settlement flows behind server-side authorization checks.

---

## Roadmap

- Matchmaking + multiplayer session orchestration.
- Ranked ladders and seasonal reward systems.
- Tournament mode and spectator views.
- Expanded rarity/power balancing with trait-weighted systems.
- Enhanced analytics for retention, economy flow, and battle fairness.

---

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Commit with clear, scoped messages.
4. Open a pull request with:
   - Problem statement
   - Solution summary
   - Test evidence
   - Screenshots (if UI changes)

---

## License

Add your project license here (e.g., MIT) and include a `LICENSE` file in the root.

