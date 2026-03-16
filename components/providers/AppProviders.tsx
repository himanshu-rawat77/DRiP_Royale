"use client";

import { EmbeddedWalletProvider } from "@/components/providers/EmbeddedWalletProvider";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return <EmbeddedWalletProvider>{children}</EmbeddedWalletProvider>;
}
