"use client";

import Image from "next/image";
import { PageLayout, CustomButton } from "@/components/avax";

const SOLSCAN_BASE = "https://solscan.io";
const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK === "mainnet-beta" ? "" : "?cluster=devnet";

/** Build Solscan link for tx or asset */
function solscanUrl(txSignature?: string, assetId?: string): string {
  if (txSignature) return `${SOLSCAN_BASE}/tx/${txSignature}${NETWORK}`;
  if (assetId) return `${SOLSCAN_BASE}/token/${assetId}${NETWORK}`;
  return SOLSCAN_BASE;
}

/** Demo ledger entries (replace with real data from API/store) */
const DEMO_LEDGER = [
  {
    id: "1",
    assetId: "JCfTS6dmJZY4NXhjMwHqayGGHUwxp59pzcYhZrYqMBce",
    imageUri: "https://api.dicebear.com/7.x/shapes/png?seed=ledger1",
    name: "DRiP #1",
    outcome: "won" as const,
    txSignature: undefined,
    timestamp: new Date().toISOString(),
    solscanUrl: solscanUrl(undefined, "JCfTS6dmJZY4NXhjMwHqayGGHUwxp59pzcYhZrYqMBce"),
  },
  {
    id: "2",
    assetId: "8gQZkgZ1L91qkNPtsiRGkRzpNcEfhBABEQr1D3wquB8H",
    imageUri: "https://api.dicebear.com/7.x/shapes/png?seed=ledger2",
    name: "DRiP #2",
    outcome: "lost" as const,
    txSignature: "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnb",
    timestamp: new Date().toISOString(),
    solscanUrl: solscanUrl("5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnb"),
  },
];

export default function Ledger() {
  return (
    <PageLayout
      title="The Ledger"
      description="Transparent history of won/lost assets with direct links to Solscan."
    >
      <ul className="space-y-4">
          {DEMO_LEDGER.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center gap-5 p-5 rounded-xl glass-morphism"
            >
              <div className="w-16 h-16 relative rounded-xl overflow-hidden flex-shrink-0 border-2 border-white/20 battle-card">
                <Image
                  src={entry.imageUri}
                  alt={entry.name || entry.assetId.slice(0, 8)}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-rajdhani font-bold text-white text-lg truncate">
                  {entry.name || entry.assetId.slice(0, 12)}…
                </p>
                <p className="font-rajdhani font-medium text-siteWhite mt-1">
                  {new Date(entry.timestamp).toLocaleString()} — {entry.outcome}
                </p>
              </div>
              <a href={entry.solscanUrl} target="_blank" rel="noopener noreferrer">
                <CustomButton title="Solscan →" handleClick={() => {}} />
              </a>
            </li>
          ))}
      </ul>

      <p className="font-rajdhani font-medium text-siteWhite mt-8">
        After settlement, real matches will appear here with tx signatures.
      </p>
    </PageLayout>
  );
}
