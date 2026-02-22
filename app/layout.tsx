import type { Metadata } from "next";
import "./globals.css";
import WalletConnect from "@/components/WalletConnect";

export const metadata: Metadata = {
  title: "DRiP Royale — War of Art",
  description:
    "Transform passive DRiP cNFTs into active game assets. Winner-takes-all on Solana.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-[100dvh] bg-siteblack text-siteWhite antialiased font-rajdhani overflow-x-hidden w-full max-w-full">
        <header className="fixed top-0 left-0 right-0 z-50 bg-siteDimBlack/90 backdrop-blur border-b border-white/10 px-4 sm:px-6 py-3">
          <nav className="max-w-6xl mx-auto flex flex-wrap gap-3 sm:gap-6 items-center justify-between">
            <div className="flex flex-wrap gap-4 sm:gap-8 items-center">
              <a href="/" className="font-rajdhani font-bold text-xl text-siteViolet hover:text-white transition">
                DRiP Royale
              </a>
              <a href="/vault" className="font-rajdhani font-medium text-siteWhite hover:text-white transition">
                Vault
              </a>
              <a href="/arena" className="font-rajdhani font-medium text-siteWhite hover:text-white transition">
                Arena
              </a>
              <a href="/ledger" className="font-rajdhani font-medium text-siteWhite hover:text-white transition">
                Ledger
              </a>
              <a href="/battleground" className="font-rajdhani font-medium text-siteWhite hover:text-white transition">
                Battleground
              </a>
            </div>
            <WalletConnect />
          </nav>
        </header>
        <main className="pt-14 min-h-[calc(100dvh-3.5rem)] w-full max-w-full overflow-x-hidden flex flex-col">
          <div className="flex-1 flex flex-col min-h-0 w-full">{children}</div>
        </main>
      </body>
    </html>
  );
}
