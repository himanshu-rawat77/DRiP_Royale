"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageLayout, CustomButton } from "@/components/avax";
import { fadeInUp } from "@/lib/motionPresets";
import { battlegrounds } from "@/lib/avaxAssets";

const DECK_STORAGE_KEY = "dripRoyale:battleDeck";
const WALLET_STORAGE_KEY = "dripRoyale:wallet";

export default function Home() {
  const [walletShort, setWalletShort] = useState<string | null>(null);
  const [deckSize, setDeckSize] = useState<number | null>(null);
  const [battlegroundLabel, setBattlegroundLabel] = useState<string>("Random");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const wallet = window.localStorage.getItem(WALLET_STORAGE_KEY);
      if (wallet) {
        setWalletShort(`${wallet.slice(0, 4)}…${wallet.slice(-4)}`);
      }
      const rawDeck = window.localStorage.getItem(DECK_STORAGE_KEY);
      if (rawDeck) {
        const parsed = JSON.parse(rawDeck) as unknown[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDeckSize(parsed.length);
        }
      }
      const storedBg = window.localStorage.getItem("battleground");
      if (storedBg) {
        const found = battlegrounds.find((b) => b.id === storedBg);
        if (found) setBattlegroundLabel(found.name);
      }
    } catch {
      // ignore client storage errors
    }
  }, []);

  const modes = [
    {
      href: "/vault",
      label: "The Vault",
      subtitle: "Deck Builder",
      copy: "Pull DRiP cNFTs from your wallet and curate a battle-ready deck.",
      badge: "Deck",
      primary: true,
    },
    {
      href: "/arena",
      label: "The Arena",
      subtitle: "PVP / Demo",
      copy: "Flip cards in a high-stakes war match. Winner takes the pile.",
      badge: "Battle",
      primary: true,
    },
    {
      href: "/create-room",
      label: "Rooms",
      subtitle: "Private Duels",
      copy: "Spin up a sharable room and invite a friend to battle.",
      badge: "Room",
      primary: false,
    },
    {
      href: "/ledger",
      label: "The Ledger",
      subtitle: "Match History",
      copy: "Review previous matches and see which NFTs won or lost.",
      badge: "History",
      primary: false,
    },
  ];

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
          Draft a deck from your DRiP cNFTs, then flip for glory in the Arena.
          <br />
          Private rooms, on-chain vibes, winner-takes-all.
        </>
      }
    >
      {/* HUD strip */}
      <div className="relative mb-8">
        <div className="pointer-events-none absolute -inset-1 rounded-3xl bg-siteViolet/40 blur-3xl opacity-40 animate-glow-pulse" />
        <div className="relative flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-black/60 border border-white/10 px-4 py-3 backdrop-blur-xl">
          <div className="flex flex-col">
            <span className="text-[11px] font-rajdhani uppercase tracking-wide text-siteWhite/60">
              Wallet
            </span>
            <span className="text-sm font-rajdhani font-semibold text-white">
              {walletShort ?? "Not connected"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-rajdhani uppercase tracking-wide text-siteWhite/60">
              Battle Deck
            </span>
            <span className="text-sm font-rajdhani font-semibold text-white">
              {deckSize ? `${deckSize} cards ready` : "No deck locked in"}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[11px] font-rajdhani uppercase tracking-wide text-siteWhite/60">
              Battleground
            </span>
            <span className="text-sm font-rajdhani font-semibold text-white">
              {battlegroundLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Mode cards */}
      <div className="relative">
        {/* Ambient particles */}
        <div className="pointer-events-none absolute -left-6 top-4 h-24 w-24 rounded-full bg-siteViolet/40 blur-3xl opacity-60 animate-glow-pulse" />
        <div className="pointer-events-none absolute right-0 top-20 h-24 w-24 rounded-full bg-cyan-400/30 blur-3xl opacity-60 animate-glow-pulse" />

        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-5">
          {modes.map((mode, idx) => (
            <Link key={mode.href} href={mode.href}>
              <motion.div
                className={`group relative overflow-hidden rounded-2xl border px-5 py-4 cursor-pointer transition ${
                  mode.primary
                    ? "border-siteViolet/70 bg-siteDimBlack/90 hover:border-siteViolet hover:bg-siteblack"
                    : "border-white/10 bg-black/70 hover:border-siteViolet/60"
                }`}
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -4, scale: 1.02 }}
              >
                <div className="pointer-events-none absolute inset-px rounded-2xl bg-gradient-to-br from-siteViolet/20 via-transparent to-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-rajdhani uppercase tracking-[0.2em] text-siteWhite/60">
                        {mode.subtitle}
                      </p>
                      <h2 className="text-lg sm:text-xl font-rajdhani font-bold text-white">
                        {mode.label}
                      </h2>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-rajdhani font-semibold uppercase tracking-wide ${
                        mode.primary
                          ? "bg-siteViolet/90 text-white"
                          : "bg-siteDimBlack text-siteWhite/80 border border-white/20"
                      }`}
                    >
                      {mode.badge}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-rajdhani text-siteWhite/80">
                    {mode.copy}
                  </p>
                  <div className="mt-2">
                    <CustomButton
                      title="Launch"
                      handleClick={() => {}}
                      restStyles={`px-4 py-1 text-xs ${
                        mode.primary
                          ? "glow-accent"
                          : "border border-white/30 bg-transparent hover:bg-siteViolet/30"
                      }`}
                    />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
