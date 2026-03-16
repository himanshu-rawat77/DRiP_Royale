import { NextRequest, NextResponse } from "next/server";
import {
  buildAuthMessage,
  createSessionToken,
  getSessionCookieName,
  isChallengeValid,
  isIssuedAtFresh,
  sessionCookieMaxAge,
  verifyWalletSignature,
} from "@/lib/walletAuth";

export async function POST(request: NextRequest) {
  let body: {
    walletAddress?: string;
    nonce?: string;
    issuedAt?: number;
    challenge?: string;
    signature?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const walletAddress = body.walletAddress?.trim() ?? "";
  const nonce = body.nonce?.trim() ?? "";
  const challenge = body.challenge?.trim() ?? "";
  const signature = body.signature?.trim() ?? "";
  const issuedAt = Number(body.issuedAt);

  if (!walletAddress || !nonce || !challenge || !signature || !Number.isFinite(issuedAt)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!isIssuedAtFresh(issuedAt)) {
    return NextResponse.json({ error: "Challenge expired" }, { status: 401 });
  }

  if (!isChallengeValid(walletAddress, nonce, issuedAt, challenge)) {
    return NextResponse.json({ error: "Invalid challenge" }, { status: 401 });
  }

  const message = buildAuthMessage(walletAddress, nonce, issuedAt);
  if (!verifyWalletSignature(walletAddress, message, signature)) {
    return NextResponse.json({ error: "Invalid wallet signature" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, walletAddress });
  response.cookies.set({
    name: getSessionCookieName(),
    value: createSessionToken(walletAddress),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionCookieMaxAge(),
  });

  return response;
}
