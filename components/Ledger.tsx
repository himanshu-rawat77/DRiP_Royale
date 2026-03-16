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

export default function Ledger() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [displayName, setDisplayName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState<Record<string, string>>({});
  const [transferState, setTransferState] = useState<Record<string, string>>({});

  const { walletAddress, walletPublicKey, getKeypair } = useEmbeddedWallet();

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawProfiles = window.localStorage.getItem(PROFILE_STORAGE_KEY);
      const key = walletAddress ?? "default";
      if (rawProfiles) {
        const parsed = JSON.parse(rawProfiles) as Record<string, { name?: string; avatarUrl?: string }>;
        const storedProfile = parsed?.[key];
        if (storedProfile?.name) setDisplayName(storedProfile.name);
        else if (walletAddress) setDisplayName(`${walletAddress.slice(0, 4)}...`);
        if (storedProfile?.avatarUrl) setAvatarUrl(storedProfile.avatarUrl);
      } else if (walletAddress) {
        setDisplayName(`${walletAddress.slice(0, 4)}...`);
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
          const raw = typeof window !== "undefined" ? window.localStorage.getItem(LEDGER_STORAGE_KEY) : null;
          const localEntries = raw ? (JSON.parse(raw) as LedgerEntry[]) : [];
          const localByAsset = new Set(localEntries.map((entry) => entry.assetId));
          const merged = [...localEntries, ...onchainEntries.filter((entry) => !localByAsset.has(entry.assetId))];
          setEntries(merged);
        }
      } catch {
        if (!cancelled && typeof window !== "undefined") {
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
    if (!keypair || !walletPublicKey) {
      setTransferState((prev) => ({ ...prev, [entry.assetId]: "Connect your embedded wallet first." }));
      return;
    }

    try {
      const destinationKey = new PublicKey(destination);
      setTransferState((prev) => ({ ...prev, [entry.assetId]: "Sending..." }));
      const signature = await transferNft(keypair, destinationKey, entry.assetId);
      setTransferState((prev) => ({ ...prev, [entry.assetId]: `Sent: ${signature.slice(0, 10)}...` }));
    } catch {
      setTransferState((prev) => ({ ...prev, [entry.assetId]: "Transfer failed." }));
    }
  };

  return (
    <PageLayout title="Player Profile" description="Embedded wallet profile and NFT ledger.">
      <div className="mb-8 rounded-2xl bg-black/60 border border-white/10 px-5 py-4 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-siteDimBlack border border-white/20 flex items-center justify-center text-lg font-rajdhani font-bold text-siteWhite">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Player avatar" width={56} height={56} className="object-cover w-full h-full" unoptimized />
              ) : (
                (displayName || walletAddress || "P").charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <p className="text-xs font-rajdhani uppercase tracking-[0.2em] text-siteWhite/60">Connected player</p>
              <p className="text-xl font-rajdhani font-bold text-white">{displayName || "No wallet connected"}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-rajdhani uppercase tracking-wide text-siteWhite/60">Wallet</p>
            <p className="text-sm font-rajdhani font-semibold text-white break-all">{walletAddress ?? "Not linked"}</p>
            <button
              type="button"
              onClick={() => setEditing((prev) => !prev)}
              className="mt-2 px-3 py-1 rounded-full border border-white/20 text-[11px] font-rajdhani text-siteWhite/80 hover:border-siteViolet/60 hover:text-white transition"
            >
              {editing ? "Cancel" : "Edit profile"}
            </button>
          </div>
        </div>

        {editing && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-rajdhani text-siteWhite/80">
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide text-siteWhite/60">Display name</label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Enter a player name" className="px-3 py-2 rounded-md bg-siteDimBlack border border-white/20 text-white focus:ring-2 focus:ring-siteViolet focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide text-siteWhite/60">Avatar image URL</label>
              <input type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." className="px-3 py-2 rounded-md bg-siteDimBlack border border-white/20 text-white focus:ring-2 focus:ring-siteViolet focus:outline-none" />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2 mt-1">
              <button type="button" onClick={saveProfile} className="px-4 py-2 rounded-lg bg-siteViolet text-white font-rajdhani font-semibold text-xs hover:opacity-90">Save profile</button>
            </div>
          </div>
        )}
      </div>

      {loadingAssets && <p className="font-rajdhani text-siteWhite/70 mb-4">Loading wallet NFTs from Helius...</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <h2 className="font-rajdhani font-bold text-lg text-emerald-400 mb-3">Won NFTs</h2>
          {won.length === 0 ? (
            <p className="font-rajdhani text-sm text-siteWhite/70">Win a match in the Arena to see NFTs you&apos;ve won here.</p>
          ) : (
            <ul className="space-y-3">
              {won.map((entry) => (
                <li key={entry.id} className="p-4 rounded-xl glass-morphism border border-emerald-500/40">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 relative rounded-xl overflow-hidden flex-shrink-0 border-2 border-emerald-400/60">
                      <Image src={entry.imageUri} alt={entry.name || entry.assetId.slice(0, 8)} fill className="object-cover" unoptimized />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-rajdhani font-bold text-white text-sm truncate">{entry.name || entry.assetId.slice(0, 12)}…</p>
                      <p className="font-rajdhani text-xs text-siteWhite/70">{new Date(entry.timestamp).toLocaleString()}</p>
                    </div>
                    <a href={entry.solscanUrl} target="_blank" rel="noopener noreferrer">
                      <CustomButton title="Solscan →" handleClick={() => {}} />
                    </a>
                  </div>
                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Destination public key"
                      value={withdrawAddress[entry.assetId] ?? ""}
                      onChange={(e) => setWithdrawAddress((prev) => ({ ...prev, [entry.assetId]: e.target.value }))}
                      className="flex-1 px-3 py-2 rounded-md bg-siteDimBlack border border-white/20 text-white focus:ring-2 focus:ring-siteViolet focus:outline-none text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => void handleWithdraw(entry)}
                      className="px-4 py-2 rounded-lg bg-siteViolet text-white font-rajdhani text-xs font-semibold"
                    >
                      Send to wallet
                    </button>
                  </div>
                  {transferState[entry.assetId] && (
                    <p className="mt-2 text-xs font-rajdhani text-siteWhite/70">{transferState[entry.assetId]}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-rajdhani font-bold text-lg text-danger mb-3">Lost NFTs</h2>
          {lost.length === 0 ? (
            <p className="font-rajdhani text-sm text-siteWhite/70">NFTs you lose in matches will appear here for reference.</p>
          ) : (
            <ul className="space-y-3">
              {lost.map((entry) => (
                <li key={entry.id} className="flex items-center gap-4 p-4 rounded-xl glass-morphism border border-danger/40">
                  <div className="w-14 h-14 relative rounded-xl overflow-hidden flex-shrink-0 border-2 border-danger/60">
                    <Image src={entry.imageUri} alt={entry.name || entry.assetId.slice(0, 8)} fill className="object-cover" unoptimized />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-rajdhani font-bold text-white text-sm truncate">{entry.name || entry.assetId.slice(0, 12)}…</p>
                    <p className="font-rajdhani text-xs text-siteWhite/70">{new Date(entry.timestamp).toLocaleString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageLayout>
  );
}
