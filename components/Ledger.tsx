"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { LedgerEntry } from "@/lib/types";
import { PageLayout, CustomButton } from "@/components/avax";

const LEDGER_STORAGE_KEY = "dripRoyale:ledger";

export default function Ledger() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(LEDGER_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as LedgerEntry[];
      if (Array.isArray(parsed)) {
        setEntries(parsed);
      }
    } catch {
      // ignore hydration errors
    }
  }, []);

  const hasRealEntries = entries.length > 0;

  return (
    <PageLayout
      title="The Ledger"
      description="Transparent history of won/lost DRiP assets with direct links to Solscan when available."
    >
      {hasRealEntries ? (
        <>
          <ul className="space-y-4">
            {entries.map((entry) => (
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
                  {entry.txSignature && (
                    <p className="font-rajdhani text-xs text-siteWhite/70 mt-1 break-all">
                      Tx: {entry.txSignature}
                    </p>
                  )}
                </div>
                <a href={entry.solscanUrl} target="_blank" rel="noopener noreferrer">
                  <CustomButton title="Solscan →" handleClick={() => {}} />
                </a>
              </li>
            ))}
          </ul>
          <p className="font-rajdhani font-medium text-siteWhite mt-8 text-sm">
            New matches append to the top of this list.
          </p>
        </>
      ) : (
        <p className="font-rajdhani font-medium text-siteWhite text-center py-16 text-xl">
          Play a match in the Arena with your DRiP deck to see real entries appear here.
        </p>
      )}
    </PageLayout>
  );
}
