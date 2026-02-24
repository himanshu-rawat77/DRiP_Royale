"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { GameCard } from "@/lib/types";
import { PageLayout, CustomInput, CustomButton } from "@/components/avax";

const MIN_DECK = 5;
const MAX_DECK = 52;
const DECK_PRESETS = [10, 20, 26, 52];

const DECK_STORAGE_KEY = "dripRoyale:battleDeck";
const WALLET_STORAGE_KEY = "dripRoyale:wallet";

export default function Vault() {
  const router = useRouter();

  const [wallet, setWallet] = useState("");
  const [deckSize, setDeckSize] = useState(52);
  const [cards, setCards] = useState<GameCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchAssets = useCallback(async () => {
    if (!wallet.trim()) {
      setError("Enter a wallet address");
      return;
    }
    setLoading(true);
    setError(null);
    setCards([]);
    setSelected(new Set());
    try {
      const limit = Math.min(MAX_DECK, Math.max(MIN_DECK, deckSize));
      const res = await fetch(
        `/api/assets?owner=${encodeURIComponent(wallet.trim())}&limit=${limit}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");
      setCards(data.cards || []);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(WALLET_STORAGE_KEY, wallet.trim());
        } catch {
          // ignore storage errors
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load assets");
    } finally {
      setLoading(false);
    }
  }, [wallet, deckSize]);

  const toggleSelect = (assetId: string) => {
    const cap = Math.min(MAX_DECK, Math.max(MIN_DECK, deckSize));
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) next.delete(assetId);
      else if (next.size < cap) next.add(assetId);
      return next;
    });
  };

  const selectAll = () => {
    const cap = Math.min(MAX_DECK, Math.max(MIN_DECK, deckSize));
    if (cards.length <= cap) setSelected(new Set(cards.map((c) => c.assetId)));
    else setSelected(new Set(cards.slice(0, cap).map((c) => c.assetId)));
  };

  const clearSelection = () => setSelected(new Set());

  const effectiveDeckSize = Math.min(MAX_DECK, Math.max(MIN_DECK, deckSize));

  const persistDeckAndGoToArena = () => {
    if (selected.size < MIN_DECK) {
      setError(`Select at least ${MIN_DECK} cards for your Battle Deck`);
      return;
    }
    if (selected.size !== effectiveDeckSize) {
      setError(
        `Select exactly ${effectiveDeckSize} cards (currently ${selected.size}) to start a match`
      );
      return;
    }
    const deck = cards.filter((c) => selected.has(c.assetId));
    if (deck.length === 0) {
      setError("Select at least one card from the loaded DRiP assets");
      return;
    }
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(deck));
        if (wallet.trim()) {
          window.localStorage.setItem(WALLET_STORAGE_KEY, wallet.trim());
        }
      } catch {
        // ignore storage errors
      }
    }
    router.push("/arena");
  };

  return (
    <PageLayout
      title="The Vault"
      description={
        <>
          Load NFTs from your wallet via Helius. Choose deck size and select that
          many cards for your Battle Deck, then enter the Arena.
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <CustomInput
              label="Wallet address"
              placeHolder="e.g. 86xCnPeV..."
              value={wallet}
              handleValueChange={setWallet}
              alphanumericOnly={false}
              fullWidth
            />
          </div>
          <CustomButton
            title={loading ? "Loading…" : "Load NFTs"}
            handleClick={fetchAssets}
            disabled={loading}
            restStyles="glow-accent"
          />
          <CustomButton title="Select deck" handleClick={selectAll} />
          <CustomButton
            title="Clear"
            handleClick={clearSelection}
            restStyles="border border-danger/50"
          />
        </div>

        <div className="flex flex-wrap gap-4 items-center mb-4">
          <label className="flex items-center gap-2 font-rajdhani font-semibold text-xl text-white">
            <span>Deck size:</span>
            <input
              type="number"
              min={MIN_DECK}
              max={MAX_DECK}
              value={deckSize}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!Number.isNaN(v)) {
                  setDeckSize(Math.min(MAX_DECK, Math.max(MIN_DECK, v)));
                }
              }}
              className="w-20 px-3 py-2 rounded-md bg-siteDimBlack border border-white/20 text-white focus:ring-2 focus:ring-siteViolet focus:outline-none font-rajdhani [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              aria-label="Deck size"
            />
            <span className="text-siteWhite/70 text-base">cards ({MIN_DECK}–{MAX_DECK})</span>
          </label>
          <div className="flex gap-2">
            {DECK_PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setDeckSize(n)}
                className={`px-4 py-2 rounded-lg font-rajdhani font-semibold text-sm transition ${
                  deckSize === n
                    ? "bg-siteViolet text-white glow-accent"
                    : "bg-siteDimBlack border border-white/20 text-siteWhite hover:border-siteViolet/50"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-danger font-rajdhani font-semibold mb-2" role="alert">
            {error}
          </p>
        )}

        <p className="font-rajdhani font-medium text-siteWhite mb-2">
          Selected: {selected.size} / {effectiveDeckSize}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {cards.map((card) => {
            const rarityColor =
              card.power >= 9
                ? "from-amber-400 to-pink-500"
                : card.power >= 7
                  ? "from-siteViolet to-cyan-400"
                  : "from-siteWhite/40 to-siteViolet/40";

            return (
              <button
                key={card.assetId}
                type="button"
                onClick={() => toggleSelect(card.assetId)}
                className={`relative rounded-xl overflow-hidden border-2 transition battle-card ${
                  selected.has(card.assetId)
                    ? "border-siteViolet glow-accent"
                    : "border-white/20 hover:border-siteViolet/50"
                }`}
              >
                <div className="aspect-square relative bg-siteDimBlack">
                  {card.imageUri ? (
                    <Image
                      src={card.imageUri}
                      alt={card.name || card.assetId.slice(0, 8)}
                      fill
                      className="object-cover"
                      unoptimized
                      sizes="160px"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-siteWhite/50 text-xs font-rajdhani">
                      No image
                    </span>
                  )}

                  {/* NFT metadata overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 hover:opacity-100 transition-opacity">
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-black/70 border border-white/20 flex items-center gap-1">
                      <span className="text-[10px] font-rajdhani text-siteWhite/80 uppercase">
                        DRiP Collection
                      </span>
                    </div>
                    <div className="absolute top-2 right-2">
                      <div
                        className={`px-2 py-1 rounded-full bg-gradient-to-r ${rarityColor} text-[10px] font-rajdhani font-bold uppercase tracking-wide`}
                      >
                        ◎ {card.power >= 9 ? "Mythic" : card.power >= 7 ? "Rare" : "Common"}
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-rajdhani font-semibold text-white">
                        {card.name || card.assetId.slice(0, 8)}
                      </p>
                      <span className="text-[11px] font-mono text-siteWhite/70">
                        {card.assetId.slice(0, 4)}…{card.assetId.slice(-4)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/85 py-1.5 px-2 flex items-center justify-between text-xs font-rajdhani">
                  <span className="text-siteWhite/70">Power</span>
                  <span className="text-base font-extrabold text-siteViolet">{card.power}</span>
                </div>
              </button>
            );
          })}
        </div>

        {cards.length === 0 && !loading && (
          <p className="font-rajdhani font-medium text-siteWhite text-center py-8 text-xl">
            Enter a wallet and click &quot;Load NFTs&quot; to see collectibles.
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <p className="font-rajdhani text-sm text-siteWhite/80">
            When ready, lock in your selection and enter the Arena. Only the NFTs you
            select here are used as your Battle Deck.
          </p>
          <CustomButton
            title="Enter Arena with this deck"
            handleClick={persistDeckAndGoToArena}
            disabled={selected.size < MIN_DECK}
            restStyles="glow-accent"
          />
        </div>
      </div>
    </PageLayout>
  );
}
