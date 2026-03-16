import crypto from "crypto";
import bs58 from "bs58";
import { ed25519 } from "@noble/curves/ed25519";

const SESSION_COOKIE = "dripRoyale:session";
const AUTH_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_SEC = 7 * 24 * 60 * 60;

export function getSessionCookieName(): string {
  return SESSION_COOKIE;
}

function getSessionSecret(): string {
  const value = process.env.SESSION_SECRET;
  if (value && value.trim().length >= 16) return value;
  if (process.env.NODE_ENV !== "production") {
    return "dev-only-insecure-session-secret-change-me";
  }
  throw new Error("SESSION_SECRET is required in production");
}

export function createNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function getAuthIssuedAt(): number {
  return Date.now();
}

export function buildAuthMessage(walletAddress: string, nonce: string, issuedAt: number): string {
  return [
    "DRiP Royale wallet login",
    `Wallet: ${walletAddress}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join("\n");
}

export function createChallenge(
  walletAddress: string,
  nonce: string,
  issuedAt: number
): string {
  const payload = `${walletAddress}:${nonce}:${issuedAt}`;
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");
}

export function isChallengeValid(
  walletAddress: string,
  nonce: string,
  issuedAt: number,
  challenge: string
): boolean {
  const expected = createChallenge(walletAddress, nonce, issuedAt);
  const a = Buffer.from(expected);
  const b = Buffer.from(challenge);
  if (a.length != b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function isIssuedAtFresh(issuedAt: number): boolean {
  return Number.isFinite(issuedAt) && Date.now() - issuedAt >= 0 && Date.now() - issuedAt <= AUTH_TTL_MS;
}

export function verifyWalletSignature(
  walletAddress: string,
  message: string,
  signatureBase64: string
): boolean {
  try {
    const publicKey = bs58.decode(walletAddress);
    const signature = Buffer.from(signatureBase64, "base64");
    const messageBytes = new TextEncoder().encode(message);
    return ed25519.verify(signature, messageBytes, publicKey);
  } catch {
    return false;
  }
}

export function createSessionToken(walletAddress: string): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC;
  const payload = `${walletAddress}.${exp}`;
  const sig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function sessionCookieMaxAge(): number {
  return SESSION_TTL_SEC;
}
