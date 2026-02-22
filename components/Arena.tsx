"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  createGameState,
  playTurn,
  isGameOver,
} from "@/lib/warEngine";
import type { GameCard, DuelResult } from "@/lib/types";
import { CustomButton, GameInfo, Alert } from "@/components/avax";
import { player01, player02, allCards, battlegrounds, attack } from "@/lib/avaxAssets";
import { styles } from "@/lib/avaxStyles";

const BATTLEGROUND_BG: Record<string, string> = {
  "bg-saiman": "bg-saiman",
  "bg-astral": "bg-astral",
  "bg-eoaalien": "bg-eoaalien",
  "bg-panight": "bg-panight",
};

function makeDemoDeck(size: number): GameCard[] {
  const cards: GameCard[] = [];
  for (let i = 0; i < size; i++) {
    const imgIdx = Math.floor(Math.random() * allCards.length);
    cards.push({
      assetId: `demo-${i}`,
      imageUri: allCards[imgIdx] as string,
      power: 2 + Math.floor(Math.random() * 9),
    });
  }
  return cards;
}

export default function Arena() {
  const [gameState, setGameState] = useState<ReturnType<typeof createGameState> | null>(null);
  const [lastDuel, setLastDuel] = useState<DuelResult | null>(null);
  const [flipLock, setFlipLock] = useState(false);

  const startMatch = useCallback(() => {
    const playerDeck = makeDemoDeck(26);
    const opponentDeck = makeDemoDeck(26);
    const state = createGameState(`match-${Date.now()}`, playerDeck, opponentDeck);
    setGameState(state);
    setLastDuel(null);
  }, []);

  const handleFlip = useCallback(() => {
    if (!gameState || flipLock || isGameOver(gameState)) return;
    setFlipLock(true);
    const { state, duel } = playTurn(gameState);
    setGameState(state);
    setLastDuel(duel ?? null);
    setFlipLock(false);
  }, [gameState, flipLock]);

  const [battleAlert, setBattleAlert] = useState<{
    status: boolean;
    type: "info" | "success" | "failure";
    message: string;
  } | null>(null);

  const [battlegroundBg, setBattlegroundBg] = useState<string>("bg-astral");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("battleground");
    setBattlegroundBg(
      stored && BATTLEGROUND_BG[stored] ? BATTLEGROUND_BG[stored] : "bg-astral"
    );
  }, [gameState]);

  const handleBattleChoice = useCallback(
    (ground: (typeof battlegrounds)[0]) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("battleground", ground.id);
      }
      setBattleAlert({
        status: true,
        type: "info",
        message: `${ground.name} is battle ready!`,
      });
      setTimeout(() => setBattleAlert(null), 1500);
    },
    []
  );

  if (!gameState) {
    return (
      <div
        className={`flex-1 flex ${styles.flexCenter} ${styles.battlegroundContainer} min-h-[calc(100dvh-3.5rem)] flex-col overflow-x-hidden`}
      >
        {battleAlert?.status && (
          <Alert type={battleAlert.type} message={battleAlert.message} />
        )}

        <h1 className={`${styles.headText} text-center`}>
          Choose your{" "}
          <span className="text-siteViolet">Battle</span> Ground
        </h1>

        <div className={`${styles.flexCenter} ${styles.battleGroundsWrapper}`}>
          {battlegrounds.map((ground) => (
            <div
              key={ground.id}
              role="button"
              tabIndex={0}
              className={`${styles.flexCenter} ${styles.battleGroundCard}`}
              onClick={() => handleBattleChoice(ground)}
              onKeyDown={(e) =>
                e.key === "Enter" && handleBattleChoice(ground)
              }
            >
              <Image
                src={ground.image}
                alt={ground.name}
                width={420}
                height={260}
                className={styles.battleGroundCardImg}
              />
              <div className="info absolute">
                <p className={styles.battleGroundCardText}>{ground.name}</p>
              </div>
            </div>
          ))}
        </div>

        <CustomButton
          title="Start demo match"
          handleClick={startMatch}
          restStyles="mt-10 glow-accent"
        />
      </div>
    );
  }

  const gameOver = isGameOver(gameState);
  const winner =
    gameState.status === "player_wins"
      ? "You"
      : gameState.status === "opponent_wins"
        ? "Opponent"
        : null;

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full relative">
      {/* Full-area background so it always fills the viewport */}
      <div
        className={`absolute inset-0 bg-cover bg-no-repeat bg-center ${battlegroundBg}`}
        aria-hidden
      />
      <div
        className={`relative z-10 flex flex-col flex-1 min-h-0 w-full justify-between items-center py-4 sm:py-6 px-3 sm:px-4 overflow-x-hidden overflow-y-auto`}
      >
        <GameInfo />

        {/* Top: Opponent (PlayerInfo style - like Battle.jsx player2) */}
        <div className={`${styles.flexCenter} flex-col flex-shrink-0 mt-2`}>
        <Image
          src={player02}
          alt="Opponent"
          width={56}
          height={56}
          className={styles.playerImg}
        />
        <p className={`${styles.playerInfo} mt-2`}>
          <span className={styles.playerInfoSpan}>Opponent</span>
        </p>
        <div
          className="flex flex-wrap gap-0.5 bg-white/10 backdrop-blur rounded-md p-1.5 mt-2 max-w-[180px] sm:max-w-[240px] justify-center"
          title={`${gameState.opponentHand.length} cards`}
        >
          {Array.from({ length: Math.min(gameState.opponentHand.length, 26) }).map(
            (_, i) => (
              <div
                key={i}
                className={`${styles.playerHealthBar} bg-danger`}
              />
            )
          )}
        </div>
        <p className={`${styles.playerInfo} mt-1`}>
          <span className={styles.playerInfoSpan}>{gameState.opponentHand.length}</span> cards
        </p>
      </div>

      {/* Center: Cards + Action (Battle.jsx middle) */}
      <div className={`${styles.flexCenter} flex-col my-4 flex-1 min-h-0 w-full max-w-full`}>
        {winner && (
          <p className="font-rajdhani font-bold text-2xl text-siteViolet mb-4 glow-accent">
            {winner} win{winner === "You" ? "" : "s"}!
          </p>
        )}

        <div className="flex flex-col items-center gap-4 sm:gap-6 flex-1 min-h-0 overflow-y-auto">
          {lastDuel ? (
            <>
              <div className={`${styles.cardContainer} relative w-[min(220px,75vw)] sm:w-[260px] h-[min(280px,36vh)] sm:h-[335px]`}>
                <Image
                  src={lastDuel.opponentCard.imageUri || ""}
                  alt="Opponent card"
                  fill
                  className={styles.cardImg}
                  unoptimized
                />
                <div className={`${styles.cardPointContainer} sm:left-[21.2%] left-[22%] ${styles.flexCenter}`}>
                  <p className={`${styles.cardPoint} text-yellow-400`}>Power {lastDuel.opponentCard.power}</p>
                </div>
              </div>
              <p className={`${styles.playerInfo} text-siteWhite`}>
                {lastDuel.winner === "player"
                  ? "→ You take the pile"
                  : lastDuel.winner === "opponent"
                    ? "→ Opponent takes the pile"
                    : "→ War"}
              </p>
              <div className={`${styles.cardContainer} relative w-[min(220px,75vw)] sm:w-[260px] h-[min(280px,36vh)] sm:h-[335px]`}>
                <Image
                  src={lastDuel.playerCard.imageUri || ""}
                  alt="Your card"
                  fill
                  className={styles.cardImg}
                  unoptimized
                />
                <div className={`${styles.cardPointContainer} sm:left-[21.2%] left-[22%] ${styles.flexCenter}`}>
                  <p className={`${styles.cardPoint} text-yellow-400`}>Power {lastDuel.playerCard.power}</p>
                </div>
              </div>
            </>
          ) : (
            <p className="font-rajdhani font-semibold text-xl text-siteWhite">
              Ready to flip
            </p>
          )}

          <div className="flex items-center flex-row my-4">
            <button
              type="button"
              onClick={handleFlip}
              disabled={gameOver || flipLock}
              className={`${styles.gameMoveBox} ${styles.flexCenter} ${styles.glassEffect} border-siteViolet mr-2 hover:border-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Image src={attack} alt="Flip" width={32} height={32} className={styles.gameMoveIcon} />
            </button>
            <CustomButton
              title="New match"
              handleClick={startMatch}
              restStyles="ml-6 border border-white/30"
            />
          </div>
        </div>
      </div>

      {/* Bottom: You (PlayerInfo style - like Battle.jsx player1) */}
      <div className={`${styles.flexCenter} flex-col flex-shrink-0 mb-2`}>
        <Image
          src={player01}
          alt="You"
          width={56}
          height={56}
          className={styles.playerImg}
        />
        <p className={`${styles.playerInfo} mt-2`}>
          <span className={styles.playerInfoSpan}>You</span>
        </p>
        <div
          className="flex flex-wrap gap-0.5 bg-white/10 backdrop-blur rounded-md p-1.5 mt-2 max-w-[180px] sm:max-w-[240px] justify-center"
          title={`${gameState.playerHand.length} cards`}
        >
          {Array.from({ length: Math.min(gameState.playerHand.length, 26) }).map(
            (_, i) => (
              <div
                key={i}
                className={`${styles.playerHealthBar} bg-siteViolet`}
              />
            )
          )}
        </div>
        <p className={`${styles.playerInfo} mt-1`}>
          <span className={styles.playerInfoSpan}>{gameState.playerHand.length}</span> cards
        </p>
      </div>
      </div>
    </div>
  );
}
