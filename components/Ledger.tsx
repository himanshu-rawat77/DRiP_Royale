"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { PublicKey } from "@solana/web3.js";
import type { LedgerEntry } from "@/lib/types";
import { PageLayout, CustomButton } from "@/components/avax";
import { useEmbeddedWallet } from "@/components/providers/EmbeddedWalletProvider";
import { getAssetsByOwner, assetToGameCard } from "@/lib/helius";
import { transferNft } from "@/lib/nftTransfer";

const LEDGER_STORAGE_KEY = "dripRoyale:ledger";
const PROFILE_STORAGE_KEY = "dripRoyale:playerProfiles";

function shortAddress(address?: string | null) {
  if (!address) return "Not linked";
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

export default function Ledger() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [displayName, setDisplayName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState<Record<string, string>>({});
  const [transferState, setTransferState] = useState<Record<string, string>>({});

  const { walletAddress, getKeypair } = useEmbeddedWallet();

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawProfiles = window.localStorage.getItem(PROFILE_STORAGE_KEY);
      const key = walletAddress ?? "default";
      if (rawProfiles) {
        const parsed = JSON.parse(rawProfiles) as Record<string, { name?: string; avatarUrl?: string }>;
        const storedProfile = parsed?.[key];
        if (storedProfile?.name) setDisplayName(storedProfile.name);
        else if (walletAddress) setDisplayName(`Player ${walletAddress.slice(0, 4)}`);
        if (storedProfile?.avatarUrl) setAvatarUrl(storedProfile.avatarUrl);
      } else if (walletAddress) {
        setDisplayName(`Player ${walletAddress.slice(0, 4)}`);
      }
    } catch {
      // ignore hydration errors
    }
  }, [walletAddress]);

  useEffect(() => {
    if (!walletAddress) return;
    let cancelled = false;
    const loadAssets = async () => {
      setLoadingAssets(true);
      try {
        const { items } = await getAssetsByOwner({ ownerAddress: walletAddress, page: 1, limit: 200 });
        const now = new Date().toISOString();
        const onchainEntries: LedgerEntry[] = items.map((asset, index) => {
          const card = assetToGameCard(asset, 2 + Math.floor(Math.random() * 9));
          return {
            id: `owned-${asset.id}-${index}`,
            assetId: card.assetId,
            imageUri: card.imageUri,
            name: card.name,
            outcome: "won",
            timestamp: now,
            solscanUrl: `https://solscan.io/token/${card.assetId}?cluster=devnet`,
          };
        });

        if (!cancelled) {
          const raw = window.localStorage.getItem(LEDGER_STORAGE_KEY);
          const localEntries = raw ? (JSON.parse(raw) as LedgerEntry[]) : [];
          const localByAsset = new Set(localEntries.map((entry) => entry.assetId));
          const merged = [...localEntries, ...onchainEntries.filter((entry) => !localByAsset.has(entry.assetId))];
          setEntries(merged);
        }
      } catch {
        if (!cancelled) {
          const raw = window.localStorage.getItem(LEDGER_STORAGE_KEY);
          if (raw) setEntries(JSON.parse(raw) as LedgerEntry[]);
        }
      } finally {
        if (!cancelled) setLoadingAssets(false);
      }
    };

    void loadAssets();
    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  const saveProfile = () => {
    if (typeof window === "undefined") return;
    try {
      const key = walletAddress ?? "default";
      const rawProfiles = window.localStorage.getItem(PROFILE_STORAGE_KEY);
      const parsed: Record<string, { name?: string; avatarUrl?: string }> = rawProfiles ? JSON.parse(rawProfiles) : {};
      parsed[key] = { name: displayName || undefined, avatarUrl: avatarUrl || undefined };
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(parsed));
      setEditing(false);
    } catch {
      // ignore
    }
  };

  const won = useMemo(() => entries.filter((e) => e.outcome === "won"), [entries]);
  const lost = useMemo(() => entries.filter((e) => e.outcome === "lost"), [entries]);

  const handleWithdraw = async (entry: LedgerEntry) => {
    const destination = withdrawAddress[entry.assetId]?.trim();
    if (!destination) {
      setTransferState((prev) => ({ ...prev, [entry.assetId]: "Enter destination wallet." }));
      return;
    }

    const keypair = getKeypair();
    if (!keypair) {
      setTransferState((prev) => ({ ...prev, [entry.assetId]: "Connect your embedded wallet first." }));
      return;
    }

    try {
      const destinationKey = new PublicKey(destination);
      setTransferState((prev) => ({ ...prev, [entry.assetId]: "Sending transfer..." }));
      const signature = await transferNft(keypair, destinationKey, entry.assetId);
      setTransferState((prev) => ({
        ...prev,
        [entry.assetId]: `Sent successfully • ${signature.slice(0, 10)}...`,
      }));
    } catch {
      setTransferState((prev) => ({ ...prev, [entry.assetId]: "Transfer failed. Check wallet address and try again." }));
    }
  };

  return (
    <PageLayout
      title="Player Profile"
      description="Manage your identity, review your performance, and transfer won NFTs to any Solana wallet."
    >
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-[#1f1136] via-[#101321] to-[#05131a] p-6 shadow-[0_0_50px_rgba(127,70,240,0.25)]">
          <div className="pointer-events-none absolute -top-16 -right-12 h-48 w-48 rounded-full bg-siteViolet/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />

          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-2xl overflow-hidden border border-white/25 bg-siteDimBlack flex items-center justify-center text-2xl font-bold">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Player avatar" width={80} height={80} className="h-full w-full object-cover" unoptimized />
                ) : (
                  (displayName || walletAddress || "P").charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-siteWhite/60">Profile</p>
                <h2 className="text-2xl font-bold text-white">{displayName || "Unnamed Challenger"}</h2>
                <p className="mt-1 text-sm text-siteWhite/75" title={walletAddress ?? undefined}>
                  {shortAddress(walletAddress)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 min-w-[220px]">
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wider text-emerald-300">Won</p>
                <p className="text-xl font-bold text-white">{won.length}</p>
              </div>
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wider text-red-300">Lost</p>
                <p className="text-xl font-bold text-white">{lost.length}</p>
              </div>
            </div>
          </div>

          <div className="relative mt-5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditing((prev) => !prev)}
              className="rounded-lg border border-white/25 px-4 py-2 text-xs font-semibold text-siteWhite hover:border-siteViolet/60 hover:text-white transition"
            >
              {editing ? "Close editor" : "Edit profile"}
            </button>
          </div>

          {editing && (
            <div className="relative mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-siteWhite/60">Display name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter a player name"
                  className="w-full rounded-lg border border-white/20 bg-siteDimBlack px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-siteViolet"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-siteWhite/60">Avatar URL</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-white/20 bg-siteDimBlack px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-siteViolet"
                />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="button"
                  onClick={saveProfile}
                  className="rounded-lg bg-siteViolet px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
                >
                  Save profile
                </button>
              </div>
            </div>
          )}
        </section>

        {loadingAssets && (
          <p className="text-sm text-siteWhite/70">Loading NFT inventory from Helius...</p>
        )}

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 rounded-2xl border border-emerald-500/25 bg-black/35 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-emerald-300">Won NFTs</h3>
              <span className="text-xs text-siteWhite/60">Withdrawal available here</span>
            </div>

            {won.length === 0 ? (
              <p className="text-sm text-siteWhite/70">You have no won NFTs yet. Win an Arena match to unlock transfer actions.</p>
            ) : (
              <ul className="space-y-3">
                {won.map((entry) => (
                  <li key={entry.id} className="rounded-xl border border-white/10 bg-black/35 p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-emerald-400/40">
                        <Image
                          src={entry.imageUri || "/assets/logo.svg"}
                          alt={entry.name || entry.assetId.slice(0, 8)}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white">{entry.name || entry.assetId}</p>
                        <p className="text-xs text-siteWhite/65">{new Date(entry.timestamp).toLocaleString()}</p>
                      </div>
                      <a href={entry.solscanUrl} target="_blank" rel="noopener noreferrer">
                        <CustomButton title="Solscan →" handleClick={() => {}} />
                      </a>
                    </div>

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        placeholder="Destination wallet public key"
                        value={withdrawAddress[entry.assetId] ?? ""}
                        onChange={(e) =>
                          setWithdrawAddress((prev) => ({ ...prev, [entry.assetId]: e.target.value }))
                        }
                        className="flex-1 rounded-lg border border-white/20 bg-siteDimBlack px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-siteViolet"
                      />
                      <button
                        type="button"
                        onClick={() => void handleWithdraw(entry)}
                        className="rounded-lg bg-siteViolet px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
                      >
                        Send to wallet
                      </button>
                    </div>

                    {transferState[entry.assetId] && (
                      <p className="mt-2 text-xs text-siteWhite/75">{transferState[entry.assetId]}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-white/15 bg-black/35 p-5">
            <h3 className="mb-4 text-lg font-bold text-red-300">Lost NFTs</h3>
            {lost.length === 0 ? (
              <p className="text-sm text-siteWhite/70">No lost NFT entries yet. Keep your winning streak alive.</p>
            ) : (
              <ul className="space-y-3">
                {lost.map((entry) => (
                  <li key={entry.id} className="flex items-center gap-3 rounded-xl border border-red-500/25 bg-black/35 p-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-red-500/40">
                      <Image
                        src={entry.imageUri || "/assets/logo.svg"}
                        alt={entry.name || entry.assetId.slice(0, 8)}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{entry.name || entry.assetId}</p>
                      <p className="text-xs text-siteWhite/65">{new Date(entry.timestamp).toLocaleString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
