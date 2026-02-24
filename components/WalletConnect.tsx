"use client";

import { useState, useCallback, useEffect } from "react";

interface GameShiftUser {
  id: string;
  address?: string;
  walletAddress?: string;
  email?: string;
  referenceId?: string;
}

const STORAGE_KEY = "dripRoyale:gameshiftUser";

/**
 * GameShift Embedded Wallet connect.
 * Create/get user by email; show wallet address when connected.
 * The connected user is also stored in localStorage so Arena / Ledger
 * can read the referenceId for settlement flows.
 */
export default function WalletConnect() {
  const [user, setUser] = useState<GameShiftUser | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const hasGameShift =
    typeof process.env.NEXT_PUBLIC_GAMESHIFT_API_KEY === "string" &&
    process.env.NEXT_PUBLIC_GAMESHIFT_API_KEY.length > 0;

  // Hydrate from localStorage so other pages can reuse the same GameShift user.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const stored = JSON.parse(raw) as GameShiftUser | null;
      if (stored && stored.id) {
        setUser(stored);
        if (stored.email) setEmail(stored.email);
      }
    } catch {
      // ignore hydration errors
    }
  }, []);

  const connect = useCallback(async () => {
    if (!email.trim()) {
      setError("Enter your email");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const trimmed = email.trim();
      const referenceId = trimmed.toLowerCase().replace(/\s+/g, "-").slice(0, 64);
      const res = await fetch("/api/gameshift/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          referenceId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to connect");
      const nextUser: GameShiftUser = {
        id: data.id,
        address: data.address ?? data.walletAddress,
        walletAddress: data.walletAddress ?? data.address,
        email: data.email ?? trimmed,
        referenceId: data.referenceId ?? referenceId,
      };
      setUser(nextUser);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
        } catch {
          // ignore storage errors
        }
      }
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  }, [email]);

  const disconnect = useCallback(() => {
    setUser(null);
    setEmail("");
    setError(null);
    setShowForm(false);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore storage errors
      }
    }
  }, []);

  if (!hasGameShift) return null;

  const address = user?.address ?? user?.walletAddress;

  return (
    <div className="flex items-center gap-3">
      {user && address ? (
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
      ) : showForm ? (
        <div className="flex flex-col gap-2 items-end">
          <input
            type="email"
            placeholder="Email (GameShift wallet)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && connect()}
            className="w-52 px-4 py-2 rounded-md bg-siteDimBlack border border-white/20 text-white font-rajdhani placeholder-siteWhite/50 focus:ring-2 focus:ring-siteViolet focus:outline-none"
            autoFocus
          />
          {error && (
            <p className="text-danger font-rajdhani font-medium text-xs w-full text-right">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg bg-siteDimBlack border border-white/20 text-siteWhite font-rajdhani font-semibold text-sm hover:border-siteViolet/50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={connect}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-siteViolet text-white font-rajdhani font-bold text-sm hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Connecting…" : "Connect"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="px-5 py-2.5 rounded-lg bg-siteViolet text-white font-rajdhani font-bold text-sm hover:opacity-90"
        >
          Connect (GameShift)
        </button>
      )}
    </div>
  );
}
