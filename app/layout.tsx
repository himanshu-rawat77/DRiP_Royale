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
            <div className="flex items-center gap-6">
              <a
                href="/"
                className="font-rajdhani font-bold text-lg sm:text-xl text-siteViolet hover:text-white transition"
              >
                DRiP Royale
              </a>
              <div className="flex flex-wrap gap-2 sm:gap-3 rounded-full bg-black/40 px-2 py-1 border border-white/10">
                <a
                  href="/vault"
                  className="px-3 py-1 rounded-full text-xs sm:text-sm font-rajdhani font-medium text-siteWhite/80 hover:text-white hover:bg-siteViolet/20 transition"
                >
                  Vault
                </a>
                <a
                  href="/arena"
                  className="px-3 py-1 rounded-full text-xs sm:text-sm font-rajdhani font-medium text-white bg-siteViolet/90 shadow-[0_0_18px_rgba(127,70,240,0.8)] hover:bg-siteViolet transition"
                >
                  Arena
                </a>
                <a
                  href="/ledger"
                  className="px-3 py-1 rounded-full text-xs sm:text-sm font-rajdhani font-medium text-siteWhite/80 hover:text-white hover:bg-siteViolet/20 transition"
                >
                  Ledger
                </a>
                <a
                  href="/create-room"
                  className="px-3 py-1 rounded-full text-xs sm:text-sm font-rajdhani font-medium text-siteWhite/80 hover:text-white hover:bg-siteViolet/20 transition"
                >
                  Rooms
                </a>
              </div>
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
