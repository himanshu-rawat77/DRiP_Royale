"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useEmbeddedWallet } from "@/components/providers/EmbeddedWalletProvider";

export default function WalletStatus() {
  const { walletAddress, connect, disconnect } = useEmbeddedWallet();
  const router = useRouter();

  const handleConnect = useCallback(() => {
    connect();
    router.push("/ledger");
  }, [connect, router]);

  return (
    <div className="flex items-center gap-3">
      {walletAddress ? (
        <>
          <span
            className="max-w-[120px] truncate font-rajdhani font-medium text-siteWhite text-sm"
            title={walletAddress}
          >
            {walletAddress.slice(0, 4)}…{walletAddress.slice(-4)}
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
        <button
          type="button"
          onClick={handleConnect}
          className="px-5 py-2 rounded-lg bg-siteViolet text-white font-rajdhani font-semibold text-sm hover:opacity-90"
        >
          Create Local Wallet
        </button>
      )}
    </div>
  );
}
