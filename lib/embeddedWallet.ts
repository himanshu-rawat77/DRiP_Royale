"use client";

import { Keypair, PublicKey } from "@solana/web3.js";

const EMBEDDED_WALLET_KEY = "dripRoyale:embeddedWalletSecret";
const WALLET_ADDRESS_KEY = "dripRoyale:wallet";

function ensureClient() {
  if (typeof window === "undefined") {
    throw new Error("Embedded wallet is only available in the browser");
  }
}

function decodeSecret(secret: string): Uint8Array {
  const parsed = JSON.parse(secret) as number[];
  return Uint8Array.from(parsed);
}

export function createOrLoadWallet(): Keypair {
  ensureClient();
  const existing = window.localStorage.getItem(EMBEDDED_WALLET_KEY);
  const keypair = existing
    ? Keypair.fromSecretKey(decodeSecret(existing))
    : Keypair.generate();

  if (!existing) {
    window.localStorage.setItem(
      EMBEDDED_WALLET_KEY,
      JSON.stringify(Array.from(keypair.secretKey)),
    );
  }
  window.localStorage.setItem(WALLET_ADDRESS_KEY, keypair.publicKey.toBase58());
  return keypair;
}

export function getWalletPublicKey(): PublicKey | null {
  if (typeof window === "undefined") return null;
  const secret = window.localStorage.getItem(EMBEDDED_WALLET_KEY);
  if (!secret) return null;
  return Keypair.fromSecretKey(decodeSecret(secret)).publicKey;
}

export function getWalletKeypair(): Keypair | null {
  if (typeof window === "undefined") return null;
  const secret = window.localStorage.getItem(EMBEDDED_WALLET_KEY);
  if (!secret) return null;
  return Keypair.fromSecretKey(decodeSecret(secret));
}

export function clearEmbeddedWallet() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(EMBEDDED_WALLET_KEY);
  window.localStorage.removeItem(WALLET_ADDRESS_KEY);
}
