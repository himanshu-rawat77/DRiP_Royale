"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Keypair, PublicKey } from "@solana/web3.js";
import { clearEmbeddedWallet, createOrLoadWallet, getWalletKeypair, getWalletPublicKey } from "@/lib/embeddedWallet";

interface EmbeddedWalletContextValue {
  walletPublicKey: PublicKey | null;
  walletAddress: string | null;
  connect: () => Keypair;
  disconnect: () => void;
  getKeypair: () => Keypair | null;
}

const EmbeddedWalletContext = createContext<EmbeddedWalletContextValue | null>(null);

export function EmbeddedWalletProvider({ children }: { children: React.ReactNode }) {
  const [walletPublicKey, setWalletPublicKey] = useState<PublicKey | null>(null);

  useEffect(() => {
    setWalletPublicKey(getWalletPublicKey());
  }, []);

  const connect = useCallback(() => {
    const keypair = createOrLoadWallet();
    setWalletPublicKey(keypair.publicKey);
    return keypair;
  }, []);

  const disconnect = useCallback(() => {
    clearEmbeddedWallet();
    setWalletPublicKey(null);
  }, []);

  const getKeypair = useCallback(() => getWalletKeypair(), []);

  const value = useMemo(
    () => ({
      walletPublicKey,
      walletAddress: walletPublicKey?.toBase58() ?? null,
      connect,
      disconnect,
      getKeypair,
    }),
    [connect, disconnect, getKeypair, walletPublicKey],
  );

  return <EmbeddedWalletContext.Provider value={value}>{children}</EmbeddedWalletContext.Provider>;
}

export function useEmbeddedWallet() {
  const ctx = useContext(EmbeddedWalletContext);
  if (!ctx) {
    throw new Error("useEmbeddedWallet must be used within EmbeddedWalletProvider");
  }
  return ctx;
}
