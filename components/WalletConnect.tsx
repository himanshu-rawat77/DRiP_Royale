"use client";

import { useState, useCallback } from "react";

interface GameShiftUser {
  id: string;
  address?: string;
  walletAddress?: string;
  email?: string;
  referenceId?: string;
}

/**
 * GameShift Embedded Wallet connect.
 * Create/get user by email; show wallet address when connected.
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

  const connect = useCallback(async () => {
    if (!email.trim()) {
      setError("Enter your email");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/gameshift/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          referenceId: email.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 64),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to connect");
      setUser(data);
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
            <p className="text-danger font-rajdhani font-medium text-xs w-full text-right">{error}</p>
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
