"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  createGameState,
  playTurn,
  isGameOver,
} from "@/lib/warEngine";
import type { GameCard, DuelResult, LedgerEntry } from "@/lib/types";
import { CustomButton, GameInfo, Alert } from "@/components/avax";
import { player01, player02, allCards, battlegrounds, attack } from "@/lib/avaxAssets";
import { styles } from "@/lib/avaxStyles";
import { fadeInUp, cardFlipEnter } from "@/lib/motionPresets";

const BATTLEGROUND_BG: Record<string, string> = {
  "bg-saiman": "bg-saiman",
  "bg-astral": "bg-astral",
  "bg-eoaalien": "bg-eoaalien",
  "bg-panight": "bg-panight",
};

const DECK_STORAGE_KEY = "dripRoyale:battleDeck";
const WALLET_STORAGE_KEY = "dripRoyale:wallet";
const GAMESHIFT_USER_KEY = "dripRoyale:gameshiftUser";
const LEDGER_STORAGE_KEY = "dripRoyale:ledger";

const MIN_DECK = 5;

type MatchMode = "demo" | "drip" | "room";

interface MatchMeta {
  id: string;
  mode: MatchMode;
  playerDeck: GameCard[];
  opponentDeck: GameCard[];
  roomId?: string;
}

interface GameShiftUser {
  id: string;
  address?: string;
  walletAddress?: string;
  email?: string;
  referenceId?: string;
}

type RoomRole = "host" | "guest" | "spectator" | null;

interface RoomMessage {
  type: "room_joined" | "players" | "start_match" | "flip";
  roomId?: string;
  role?: RoomRole;
  players?: number;
  payload?: {
    seed?: string;
    players?: number;
  };
}

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

// Deterministic RNG for room matches so both clients see identical decks.
function hashStringToInt(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let t = seed + 0x6d2b79f5;
  return () => {
    t |= 0;
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function makeSeededDeck(seed: string, size: number): GameCard[] {
  const rng = mulberry32(hashStringToInt(seed));
  const cards: GameCard[] = [];
  for (let i = 0; i < size; i++) {
    const imgIdx = Math.floor(rng() * allCards.length);
    const power = 2 + Math.floor(rng() * 9);
    cards.push({
      assetId: `room-${seed}-${i}`,
      imageUri: allCards[imgIdx] as string,
      power,
    });
  }
  return cards;
}

function makeOpponentDeckFromPlayer(playerDeck: GameCard[]): GameCard[] {
  // Simple opponent deck: shuffle player's deck and reuse images/powers.
  const clone = [...playerDeck];
  for (let i = clone.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function buildSolscanUrl(txSignature?: string, assetId?: string): string {
  const base = "https://solscan.io";
  const network =
    process.env.NEXT_PUBLIC_SOLANA_NETWORK === "mainnet-beta" ? "" : "?cluster=devnet";
  if (txSignature) return `${base}/tx/${txSignature}${network}`;
  if (assetId) return `${base}/token/${assetId}${network}`;
  return base;
}

export default function Arena() {
  const [gameState, setGameState] = useState<ReturnType<typeof createGameState> | null>(null);
  const [lastDuel, setLastDuel] = useState<DuelResult | null>(null);
  const [flipLock, setFlipLock] = useState(false);
  const [battleDeck, setBattleDeck] = useState<GameCard[] | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [gameshiftUser, setGameshiftUser] = useState<GameShiftUser | null>(null);
  const [matchMeta, setMatchMeta] = useState<MatchMeta | null>(null);
  const [matchSettled, setMatchSettled] = useState(false);
  const [roomRole, setRoomRole] = useState<RoomRole>(null);
  const [roomConnected, setRoomConnected] = useState(false);
  const [roomPlayers, setRoomPlayers] = useState<number>(0);

  const [battleAlert, setBattleAlert] = useState<{
    status: boolean;
    type: "info" | "success" | "failure";
    message: string;
  } | null>(null);

  const [battlegroundBg, setBattlegroundBg] = useState<string>("bg-astral");
  const settleInProgressRef = useRef(false);
  const roomSocketRef = useRef<WebSocket | null>(null);

  const searchParams = useSearchParams();
  const urlMode = searchParams.get("mode");
  const roomIdFromUrl = searchParams.get("room") ?? undefined;
  const isRoomMode = urlMode === "room" && !!roomIdFromUrl;

  // Hydrate stored deck, wallet, and GameShift user on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawDeck = window.localStorage.getItem(DECK_STORAGE_KEY);
      if (rawDeck) {
        const parsed = JSON.parse(rawDeck) as GameCard[];
        if (Array.isArray(parsed) && parsed.length >= MIN_DECK) {
          setBattleDeck(parsed);
        }
      }
      const storedWallet = window.localStorage.getItem(WALLET_STORAGE_KEY);
      if (storedWallet) setWallet(storedWallet);
      const gsRaw = window.localStorage.getItem(GAMESHIFT_USER_KEY);
      if (gsRaw) {
        const gs = JSON.parse(gsRaw) as GameShiftUser;
        if (gs && gs.id) setGameshiftUser(gs);
      }
    } catch {
      // ignore hydration errors
    }
  }, []);

  // Battleground background preference.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("battleground");
    setBattlegroundBg(
      stored && BATTLEGROUND_BG[stored] ? BATTLEGROUND_BG[stored] : "bg-astral"
    );
  }, [gameState]);

  // WebSocket setup for room mode.
  useEffect(() => {
    if (!isRoomMode || !roomIdFromUrl) return;
    if (typeof window === "undefined") return;

    const socket = new WebSocket("ws://localhost:4000");
    roomSocketRef.current = socket;
    const connectTimer = window.setTimeout(() => {
      if (socket.readyState !== WebSocket.OPEN) {
        setBattleAlert({
          status: true,
          type: "failure",
          message: "Room server not reachable. Start it with: npm run room-server",
        });
        setTimeout(() => setBattleAlert(null), 3500);
      }
    }, 2000);

    socket.addEventListener("open", () => {
      setRoomConnected(true);
      socket.send(
        JSON.stringify({
          type: "join",
          roomId: roomIdFromUrl,
        }),
      );
    });

    socket.addEventListener("error", () => {
      setRoomConnected(false);
    });

    socket.addEventListener("message", (event) => {
      let msg: RoomMessage;
      try {
        msg = JSON.parse(event.data as string) as RoomMessage;
      } catch {
        return;
      }
      if (!msg?.type) return;

      if (msg.type === "room_joined") {
        if (msg.role) setRoomRole(msg.role);
        if (typeof msg.players === "number") setRoomPlayers(msg.players);
        return;
      }

      if (msg.type === "players") {
        const p = msg.payload?.players;
        if (typeof p === "number") setRoomPlayers(p);
        return;
      }

      if (msg.type === "start_match") {
        const seed = msg.payload?.seed ?? `${Date.now()}`;
        const playerDeck = makeSeededDeck(`${seed}-p1`, 26);
        const opponentDeck = makeSeededDeck(`${seed}-p2`, 26);
        const matchId = `room-${seed}`;
        const state = createGameState(matchId, playerDeck, opponentDeck);
        setGameState(state);
        setLastDuel(null);
        setMatchMeta({
          id: matchId,
          mode: "room",
          playerDeck,
          opponentDeck,
          roomId: roomIdFromUrl,
        });
        setMatchSettled(false);
        settleInProgressRef.current = false;
        return;
      }

      if (msg.type === "flip") {
        setFlipLock(true);
        setGameState((prev) => {
          if (!prev || isGameOver(prev)) {
            setFlipLock(false);
            return prev;
          }
          const { state, duel } = playTurn(prev);
          setLastDuel(duel ?? null);
          if (isGameOver(state)) {
            void handleMatchEnd(state);
          }
          setFlipLock(false);
          return state;
        });
      }
    });

    socket.addEventListener("close", () => {
      setRoomConnected(false);
      setRoomRole(null);
      setRoomPlayers(0);
      roomSocketRef.current = null;
    });

    return () => {
      window.clearTimeout(connectTimer);
      socket.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRoomMode, roomIdFromUrl]);

  const startMatch = useCallback(
    (mode: MatchMode) => {
      let playerDeck: GameCard[];
      let opponentDeck: GameCard[];
      if (mode === "drip" && battleDeck && battleDeck.length >= MIN_DECK) {
        playerDeck = battleDeck;
        opponentDeck = makeOpponentDeckFromPlayer(battleDeck);
      } else {
        playerDeck = makeDemoDeck(26);
        opponentDeck = makeDemoDeck(26);
      }
      const matchId = `match-${Date.now()}`;
      const state = createGameState(matchId, playerDeck, opponentDeck);
      setGameState(state);
      setLastDuel(null);
      setMatchMeta({
        id: matchId,
        mode,
        playerDeck,
        opponentDeck,
        roomId: mode === "room" ? roomIdFromUrl : undefined,
      });
      setMatchSettled(false);
      settleInProgressRef.current = false;
    },
    [battleDeck, roomIdFromUrl]
  );

  const persistToLedger = useCallback(
    (state: ReturnType<typeof createGameState>, winner: "player" | "opponent" | null, txSignature?: string) => {
      if (!matchMeta || matchMeta.mode !== "drip") return;
      if (!battleDeck || battleDeck.length === 0) return;
      if (typeof window === "undefined") return;

      const outcomeForPlayer = winner === "player" ? "won" : "lost";
      const timestamp = new Date().toISOString();

      const newEntries: LedgerEntry[] = battleDeck.map((card, idx) => ({
        id: `${matchMeta.id}-${idx}`,
        assetId: card.assetId,
        imageUri: card.imageUri,
        name: card.name,
        outcome: outcomeForPlayer,
        txSignature,
        timestamp,
        solscanUrl: buildSolscanUrl(txSignature, card.assetId),
      }));

      try {
        const raw = window.localStorage.getItem(LEDGER_STORAGE_KEY);
        const existing: LedgerEntry[] = raw ? JSON.parse(raw) : [];
        const merged = [...newEntries, ...existing];
        window.localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // ignore storage errors
      }
    },
    [battleDeck, matchMeta]
  );

  const maybeSettleWithGameShift = useCallback(
    async (winner: "player" | "opponent" | null) => {
      if (winner !== "player") return null;
      if (!gameshiftUser?.referenceId) return null;

      const rewardIdsRaw =
        typeof process.env.NEXT_PUBLIC_GAMESHIFT_REWARD_ITEM_IDS === "string"
          ? process.env.NEXT_PUBLIC_GAMESHIFT_REWARD_ITEM_IDS
          : "";
      const rewardIds = rewardIdsRaw
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      if (rewardIds.length === 0) return null;

      try {
        const res = await fetch("/api/match/settle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            winnerReferenceId: gameshiftUser.referenceId,
            loserReferenceId: "opponent",
            wonItemIds: rewardIds,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          // Surface as info alert but don't break the game flow.
          setBattleAlert({
            status: true,
            type: "failure",
            message: data.error || "GameShift settlement failed",
          });
          setTimeout(() => setBattleAlert(null), 2000);
          return null;
        }
        const txs = (data?.txSignatures as string[]) || [];
        if (txs.length > 0) {
          setBattleAlert({
            status: true,
            type: "success",
            message: "Match settled via GameShift. Rewards sent to your embedded wallet.",
          });
          setTimeout(() => setBattleAlert(null), 2500);
        }
        return txs[0] ?? null;
      } catch {
        setBattleAlert({
          status: true,
          type: "failure",
          message: "GameShift settlement failed",
        });
        setTimeout(() => setBattleAlert(null), 2000);
        return null;
      }
    },
    [gameshiftUser]
  );

  const handleMatchEnd = useCallback(
    async (state: ReturnType<typeof createGameState>) => {
      if (settleInProgressRef.current || matchSettled) return;
      settleInProgressRef.current = true;
      const status = state.status;
      const winner: "player" | "opponent" | null =
        status === "player_wins" ? "player" : status === "opponent_wins" ? "opponent" : null;

      const txSig = await maybeSettleWithGameShift(winner);
      persistToLedger(state, winner, txSig ?? undefined);
      setMatchSettled(true);
    },
    [matchSettled, maybeSettleWithGameShift, persistToLedger]
  );

  const startRoomMatch = useCallback(() => {
    if (!isRoomMode || !roomIdFromUrl) return;
    if (roomRole && roomRole !== "host") {
      setBattleAlert({
        status: true,
        type: "info",
        message: "Waiting for the host to start the match.",
      });
      setTimeout(() => setBattleAlert(null), 2000);
      return;
    }
    if (roomPlayers < 2) {
      setBattleAlert({
        status: true,
        type: "info",
        message: "Waiting for your opponent to join the room...",
      });
      setTimeout(() => setBattleAlert(null), 2000);
      return;
    }
    const socket = roomSocketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    const seed = `${Date.now()}`;
    const msg: RoomMessage = {
      type: "start_match",
      roomId: roomIdFromUrl,
      payload: { seed },
    };
    socket.send(JSON.stringify(msg));
  }, [isRoomMode, roomIdFromUrl, roomPlayers, roomRole]);

  const handleFlip = useCallback(async () => {
    if (!gameState || flipLock || isGameOver(gameState)) return;

    // In room mode, flips are driven through the WebSocket so both players stay in sync.
    if (isRoomMode && roomIdFromUrl) {
      const socket = roomSocketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      const msg: RoomMessage = {
        type: "flip",
        roomId: roomIdFromUrl,
      };
      socket.send(JSON.stringify(msg));
      return;
    }

    // Local/demo/drip match.
    setFlipLock(true);
    const { state, duel } = playTurn(gameState);
    setGameState(state);
    setLastDuel(duel ?? null);
    setFlipLock(false);
    if (isGameOver(state)) {
      await handleMatchEnd(state);
    }
  }, [gameState, flipLock, handleMatchEnd, isRoomMode, roomIdFromUrl]);

  const handleBattleChoice = useCallback(
    (ground: (typeof battlegrounds)[0]) => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("battleground", ground.id);
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
                width={260}
                height={260}
                className={styles.battleGroundCardImg}
              />
              <div className="info absolute">
                <p className={styles.battleGroundCardText}>{ground.name}</p>
              </div>
            </div>
          ))}
        </div>

        {isRoomMode ? (
          <div className="flex flex-col items-center gap-4 mt-8 max-w-md rounded-2xl bg-black/60 border border-white/10 px-5 py-4 backdrop-blur-lg shadow-[0_0_40px_rgba(0,0,0,0.7)]">
            <div className="flex items-center justify-between gap-3 w-full">
              <div>
                <p className="font-rajdhani text-xs uppercase tracking-wide text-siteWhite/60">
                  Room mode
                </p>
                <p className="font-rajdhani font-semibold text-lg text-white">
                  Private duel
                </p>
              </div>
              {roomIdFromUrl && (
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-siteDimBlack/80 border border-siteViolet/60 text-xs font-mono text-siteWhite hover:border-siteViolet hover:bg-siteblack transition"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      void navigator.clipboard?.writeText(
                        `${window.location.origin}/arena?mode=room&room=${roomIdFromUrl}`,
                      );
                    }
                  }}
                >
                  <span className="truncate max-w-[120px]">{roomIdFromUrl}</span>
                  <span className="text-siteViolet font-bold">Copy</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 w-full text-xs font-rajdhani text-siteWhite/70">
              <span>
                Status:{" "}
                <span className={roomConnected ? "text-emerald-400" : "text-siteWhite/60"}>
                  {roomConnected ? "Connected" : "Connecting…"}
                </span>
              </span>
              {roomRole && (
                <span className="px-2 py-0.5 rounded-full bg-siteDimBlack/80 border border-white/20 uppercase tracking-wide">
                  {roomRole}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 w-full text-xs font-rajdhani text-siteWhite/70">
              <span>
                Players:{" "}
                <span className={roomPlayers >= 2 ? "text-emerald-400" : "text-amber-300"}>
                  {roomPlayers}/2
                </span>
              </span>
              <span className="font-mono text-[10px] text-siteWhite/50">ws://localhost:4000</span>
            </div>

            <CustomButton
              title="Start room match"
              handleClick={startRoomMatch}
              restStyles="mt-1 glow-accent w-full text-center justify-center"
              disabled={!roomConnected || (roomRole !== null && roomRole !== "host") || roomPlayers < 2}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 mt-8">
            {battleDeck && battleDeck.length >= MIN_DECK ? (
              <>
                <p className="font-rajdhani text-siteWhite text-sm text-center max-w-md">
                  Loaded <span className="font-bold text-siteViolet">{battleDeck.length}</span>{" "}
                  NFTs from your Vault{wallet ? ` (${wallet.slice(0, 4)}…${wallet.slice(-4)})` : ""}.
                </p>
                <CustomButton
                  title="Start match with my deck"
                  handleClick={() => startMatch("drip")}
                  restStyles="glow-accent"
                />
              </>
            ) : (
              <p className="font-rajdhani text-siteWhite/80 text-sm text-center max-w-md">
                No Battle Deck found. Visit the{" "}
                <Link href="/vault" className="text-siteViolet underline">
                  Vault
                </Link>{" "}
                to build your deck, then return here.
              </p>
            )}
            <CustomButton
              title="Start demo match"
              handleClick={() => startMatch("demo")}
              restStyles="mt-2 border border-white/30"
            />

            <p className="font-rajdhani text-siteWhite/70 text-xs text-center max-w-md mt-3">
              Want to battle a friend?{" "}
              <Link href="/create-room" className="text-siteViolet underline">
                Create a room
              </Link>{" "}
              and send them the link.
            </p>
          </div>
        )}
      </div>
    );
  }

  const gameOver = isGameOver(gameState);
  const winnerLabel =
    gameState.status === "player_wins"
      ? "You"
      : gameState.status === "opponent_wins"
        ? "Opponent"
        : null;
  const roundNumber = gameState.duelHistory.length + 1;

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full relative">
      {/* Full-area background so it always fills the viewport */}
      <div
        className={`absolute inset-0 bg-cover bg-no-repeat bg-center ${battlegroundBg} animate-bg-drift`}
        aria-hidden
      />
      {/* Soft ambient glow behind the duel area */}
      <div className="pointer-events-none absolute inset-x-10 top-1/3 h-64 rounded-full bg-siteViolet/30 blur-3xl opacity-60 animate-glow-pulse" />

      <div
        className={`relative z-10 flex flex-col flex-1 min-h-0 w-full justify-between items-center pt-2 pb-3 sm:pt-3 sm:pb-4 px-3 sm:px-4 overflow-x-hidden overflow-hidden`}
      >
        <GameInfo />

        {/* Top: Opponent (PlayerInfo style - like Battle.jsx player2) */}
        <motion.div
          className="flex flex-col items-stretch flex-shrink-0 mt-0 w-full max-w-4xl"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-black/40 border border-white/10 px-4 py-2 backdrop-blur-lg shadow-[0_0_40px_rgba(0,0,0,0.6)]">
            <div className="flex items-center gap-3">
              <Image
                src={player02}
                alt="Opponent"
                width={56}
                height={56}
                className={`${styles.playerImg} border border-danger/60 rounded-full`}
              />
              <div>
                <p className={`${styles.playerInfo} text-sm uppercase tracking-wide text-siteWhite/70`}>
                  Opponent
                </p>
                <p className="font-rajdhani font-semibold text-lg text-white">
                  Enemy Deck
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-xs font-rajdhani text-siteWhite/60">Cards in hand</span>
                <span className="text-xl font-rajdhani font-bold text-siteWhite">
                  {gameState.opponentHand.length}
                </span>
              </div>
              <div
                className="flex flex-wrap gap-0.5 bg-white/5 backdrop-blur rounded-md p-1.5 max-w-[180px] sm:max-w-[260px] justify-center animate-border-glow"
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
            </div>
          </div>
        </motion.div>

        {/* Center: Cards + Action (Battle.jsx middle) */}
        <div className={`${styles.flexCenter} flex-col my-4 flex-1 min-h-0 w-full max-w-full`}>
          {winnerLabel && (
            <motion.p
              className="font-rajdhani font-bold text-2xl text-siteViolet mb-2 sm:mb-3 glow-accent text-center"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
            >
              {winnerLabel} win{winnerLabel === "You" ? "" : "s"}!
            </motion.p>
          )}

          {/* Status strip */}
          <p className="font-rajdhani text-sm sm:text-base text-siteWhite/80 mb-2 text-center">
            Round {roundNumber}
            {lastDuel && (
              <>
                {" "}
                · You {lastDuel.playerCard.power} vs {lastDuel.opponentCard.power} ·{" "}
                {lastDuel.winner === "player"
                  ? "Advantage: You"
                  : lastDuel.winner === "opponent"
                    ? "Advantage: Opponent"
                    : "WAR!"}
              </>
            )}
          </p>

          <div className="flex flex-col items-center gap-4 sm:gap-6 flex-1 min-h-0 overflow-y-auto">
            {lastDuel ? (
              <>
                {/* Cards row with Flip button in between */}
                <div className="flex flex-row items-center justify-center gap-3 sm:gap-8 w-full max-w-4xl mx-auto">
                  <motion.div
                    className="flex flex-col items-center"
                    variants={cardFlipEnter}
                    initial="initial"
                    animate="animate"
                  >
                    <p className={`${styles.playerInfo} mb-1 text-siteWhite`}>Opponent</p>
                    <div className={`${styles.cardContainer} relative w-[min(180px,40vw)] sm:w-[200px] md:w-[240px] h-[min(240px,32vh)] sm:h-[280px] md:h-[320px]`}>
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
                  </motion.div>

                  <motion.div
                    className="flex flex-col items-center justify-center gap-3 sm:gap-4 px-1"
                    variants={fadeInUp}
                    initial="initial"
                    animate="animate"
                  >
                    <motion.button
                      type="button"
                      onClick={handleFlip}
                      disabled={gameOver || flipLock}
                      className={`${styles.gameMoveBox} ${styles.flexCenter} ${styles.glassEffect} border-siteViolet hover:border-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed`}
                      title="Flip"
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.04 }}
                    >
                      <Image src={attack} alt="Flip" width={32} height={32} className={styles.gameMoveIcon} />
                    </motion.button>
                    <CustomButton
                      title="New match"
                      handleClick={() => startMatch(matchMeta?.mode ?? "demo")}
                      restStyles="border border-white/30"
                    />
                  </motion.div>

                  <motion.div
                    className="flex flex-col items-center"
                    variants={cardFlipEnter}
                    initial="initial"
                    animate="animate"
                  >
                    <p className={`${styles.playerInfo} mb-1 text-siteWhite`}>You</p>
                    <div className={`${styles.cardContainer} relative w-[min(180px,40vw)] sm:w-[200px] md:w-[240px] h-[min(240px,32vh)] sm:h-[280px] md:h-[320px]`}>
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
                  </motion.div>
                </div>

                <p className={`${styles.playerInfo} text-siteWhite mt-3 text-center`}>
                  {lastDuel.winner === "player"
                    ? "→ You take the pile"
                    : lastDuel.winner === "opponent"
                      ? "→ Opponent takes the pile"
                      : "→ War"}
                </p>
              </>
            ) : (
              <>
                <div className="flex flex-row items-center justify-center gap-3 sm:gap-8 w-full max-w-4xl mx-auto">
                  <motion.div
                    className="flex flex-col items-center"
                    variants={cardFlipEnter}
                    initial="initial"
                    animate="animate"
                  >
                    <p className={`${styles.playerInfo} mb-1 text-siteWhite`}>Opponent</p>
                    <div className={`${styles.cardContainer} relative w-[min(180px,40vw)] sm:w-[200px] md:w-[240px] h-[min(240px,32vh)] sm:h-[280px] md:h-[320px]`}>
                      <div className={`${styles.glassEffect} w-full h-full rounded-xl border border-white/20`} />
                    </div>
                  </motion.div>

                  <motion.div
                    className="flex flex-col items-center justify-center gap-3 sm:gap-4 px-1"
                    variants={fadeInUp}
                    initial="initial"
                    animate="animate"
                  >
                    <motion.button
                      type="button"
                      onClick={handleFlip}
                      disabled={gameOver || flipLock}
                      className={`${styles.gameMoveBox} ${styles.flexCenter} ${styles.glassEffect} border-siteViolet hover:border-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed`}
                      title="Flip"
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.04 }}
                    >
                      <Image src={attack} alt="Flip" width={32} height={32} className={styles.gameMoveIcon} />
                    </motion.button>
                    <CustomButton
                      title="New match"
                      handleClick={() => startMatch(matchMeta?.mode ?? "demo")}
                      restStyles="border border-white/30"
                    />
                  </motion.div>

                  <motion.div
                    className="flex flex-col items-center"
                    variants={cardFlipEnter}
                    initial="initial"
                    animate="animate"
                  >
                    <p className={`${styles.playerInfo} mb-1 text-siteWhite`}>You</p>
                    <div className={`${styles.cardContainer} relative w-[min(180px,40vw)] sm:w-[200px] md:w-[240px] h-[min(240px,32vh)] sm:h-[280px] md:h-[320px]`}>
                      <div className={`${styles.glassEffect} w-full h-full rounded-xl border border-white/20`} />
                    </div>
                  </motion.div>
                </div>
                <p className="font-rajdhani font-semibold text-xl text-siteWhite text-center">
                  Ready to flip
                </p>
              </>
            )}
          </div>
        </div>

        {/* Bottom: You (PlayerInfo style - like Battle.jsx player1) */}
        <motion.div
          className="flex flex-col items-stretch flex-shrink-0 mb-2 w-full max-w-4xl"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-black/40 border border-white/10 px-4 py-2 backdrop-blur-lg shadow-[0_0_40px_rgba(0,0,0,0.6)]">
            <div className="flex items-center gap-3">
              <Image
                src={player01}
                alt="You"
                width={56}
                height={56}
                className={`${styles.playerImg} border border-siteViolet/70 rounded-full`}
              />
              <div>
                <p className={`${styles.playerInfo} text-sm uppercase tracking-wide text-siteWhite/70`}>
                  You
                </p>
                <p className="font-rajdhani font-semibold text-lg text-white">
                  DRiP Deck
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-xs font-rajdhani text-siteWhite/60">Cards in hand</span>
                <span className="text-xl font-rajdhani font-bold text-siteWhite">
                  {gameState.playerHand.length}
                </span>
              </div>
              <div
                className="flex flex-wrap gap-0.5 bg-white/5 backdrop-blur rounded-md p-1.5 max-w-[180px] sm:max-w-[260px] justify-center animate-border-glow"
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
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
