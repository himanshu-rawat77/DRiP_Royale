export interface GameshiftSessionUser {
  id: string;
  address?: string;
  walletAddress?: string;
  email?: string;
  referenceId?: string;
}

const STORAGE_KEY = "dripRoyale:gameshiftUser";

export function readGameshiftUserFromStorage(): GameshiftSessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameshiftSessionUser | null;
    if (parsed && parsed.id) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function clearGameshiftUserFromStorage() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getCurrentReferenceId(): string | null {
  const user = readGameshiftUserFromStorage();
  return user?.referenceId ?? null;
}

