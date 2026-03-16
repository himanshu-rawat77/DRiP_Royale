"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  clearWalletSessionFromStorage,
  getWalletSessionStorageKey,
  readWalletSessionFromStorage,
  type WalletSession,
} from "@/lib/walletSession";

type SolanaProvider = {
  isPhantom?: boolean;
  publicKey?: { toString: () => string };
  connect: () => Promise<void>;
  signMessage: (
    message: Uint8Array,
    display?: "hex" | "utf8"
  ) => Promise<{ signature: Uint8Array } | Uint8Array>;
};

function getProvider(): SolanaProvider | null {
  if (typeof window === "undefined") return null;
  return (window as Window & { solana?: SolanaProvider }).solana ?? null;
}

export default function WalletConnect() {
  const [session, setSession] = useState<WalletSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = readWalletSessionFromStorage();
    if (stored) setSession(stored);
  }, []);

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = getProvider();
      if (!provider) {
        throw new Error("No Solana wallet found. Install Phantom or compatible wallet.");
      }

      await provider.connect();
      const walletAddress = provider.publicKey?.toString();
      if (!walletAddress) throw new Error("Unable to read wallet address");

      const nonceRes = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });
      const nonceData = await nonceRes.json();
      if (!nonceRes.ok) throw new Error(nonceData.error || "Failed to create auth challenge");

      const message = new TextEncoder().encode(nonceData.message as string);
      const signed = await provider.signMessage(message, "utf8");
      const signatureBytes = signed instanceof Uint8Array ? signed : signed.signature;
      const signature = btoa(String.fromCharCode(...Array.from(signatureBytes)));

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          nonce: nonceData.nonce,
          issuedAt: nonceData.issuedAt,
          challenge: nonceData.challenge,
          signature,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || "Wallet verification failed");

      const nextSession: WalletSession = {
        walletAddress,
        nonce: nonceData.nonce,
        issuedAt: nonceData.issuedAt,
        signature,
      };
      setSession(nextSession);
      window.localStorage.setItem(getWalletSessionStorageKey(), JSON.stringify(nextSession));
      window.localStorage.setItem("dripRoyale:wallet", walletAddress);
      router.push("/ledger");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const disconnect = useCallback(() => {
    setSession(null);
    setError(null);
    clearWalletSessionFromStorage();
  }, []);

  const address = session?.walletAddress;

  return (
    <div className="flex items-center gap-3">
      {address ? (
        <>
          <span
            className="max-w-[120px] truncate font-rajdhani font-medium text-siteWhite text-sm"
            title={address}
          >
            {address.slice(0, 4)}…{address.slice(-4)}
          </span>
          <button
            type="button"
            onClick={disconnect}
            className="px-4 py-2 rounded-lg bg-siteDimBlack border border-white/20 text-siteWhite font-rajdhani font-semibold text-sm hover:border-danger/50 hover:text-danger transition"
          >
            Disconnect
          </button>
        </>
      ) : (
        <div className="flex flex-col gap-2 items-end">
          {error && (
            <p className="text-danger font-rajdhani font-medium text-xs w-full text-right">
              {error}
            </p>
          )}
          <button
            type="button"
            disabled={loading}
            onClick={connect}
            className="px-5 py-2 rounded-lg bg-siteViolet text-white font-rajdhani font-semibold text-sm hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Connecting…" : "Connect Wallet"}
          </button>
        </div>
      )}
    </div>
  );
}
