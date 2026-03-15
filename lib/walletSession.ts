export interface WalletSession {
  walletAddress: string;
  signature: string;
  nonce: string;
  issuedAt: number;
}

const STORAGE_KEY = "dripRoyale:walletSession";

export function getWalletSessionStorageKey(): string {
  return STORAGE_KEY;
}

export function readWalletSessionFromStorage(): WalletSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WalletSession;
    if (!parsed?.walletAddress) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearWalletSessionFromStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}
