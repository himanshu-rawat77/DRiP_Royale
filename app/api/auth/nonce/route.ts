import { NextRequest, NextResponse } from "next/server";
import {
  buildAuthMessage,
  createChallenge,
  createNonce,
  getAuthIssuedAt,
} from "@/lib/walletAuth";

export async function POST(request: NextRequest) {
  let body: { walletAddress?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const walletAddress = body.walletAddress?.trim();
  if (!walletAddress) {
    return NextResponse.json({ error: "walletAddress is required" }, { status: 400 });
  }

  const nonce = createNonce();
  const issuedAt = getAuthIssuedAt();
  const challenge = createChallenge(walletAddress, nonce, issuedAt);
  const message = buildAuthMessage(walletAddress, nonce, issuedAt);

  return NextResponse.json({ nonce, issuedAt, challenge, message });
}
