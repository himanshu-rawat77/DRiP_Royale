"use client";

import Link from "next/link";
import { PageLayout, CustomButton } from "@/components/avax";

export default function Home() {
  return (
    <PageLayout
      title={
        <>
          Welcome to DRiP Royale
          <br /> The War of Art
        </>
      }
      description={
        <>
          Connect your wallet to build your deck from DRiP cNFTs
          <br /> and enter the Arena. Winner takes all.
        </>
      }
    >
      <nav className="flex flex-wrap gap-4">
        <Link href="/vault">
          <CustomButton
            title="The Vault (Deck Builder)"
            handleClick={() => {}}
            restStyles="glow-accent"
          />
        </Link>
        <Link href="/arena">
          <CustomButton
            title="The Arena"
            handleClick={() => {}}
            restStyles="glow-accent"
          />
        </Link>
        <Link href="/ledger">
          <CustomButton
            title="The Ledger"
            handleClick={() => {}}
            restStyles="border border-white/30"
          />
        </Link>
        <Link href="/battleground">
          <CustomButton
            title="Battleground"
            handleClick={() => {}}
            restStyles="border border-white/30"
          />
        </Link>
      </nav>
    </PageLayout>
  );
}
