"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/avax/PageLayout";
import CustomInput from "@/components/avax/CustomInput";
import CustomButton from "@/components/avax/CustomButton";
import { styles } from "@/lib/avaxStyles";

function makeRoomId(name: string): string {
  const base =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "room";
  const rand = Math.random().toString(36).slice(2, 8);
  return `${base}-${rand}`;
}

export default function CreateRoomPage() {
  const [roomName, setRoomName] = useState("");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const handleCreate = () => {
    const trimmed = roomName.trim();
    if (!trimmed || creating) return;
    setCreating(true);

    // For now we keep rooms client-side and use a sharable URL.
    const roomId = makeRoomId(trimmed);
    const params = new URLSearchParams({
      mode: "room",
      room: roomId,
    });
    router.push(`/arena?${params.toString()}`);
  };

  return (
    <PageLayout
      title={
        <>
          Create <br /> a new Room
        </>
      }
      description={
        <>
          Spin up a sharable battle room and send the link to a friend so you
          can play DRiP Royale together.
        </>
      }
    >
      <div className="flex flex-col gap-6 max-w-xl">
        <div className="relative rounded-2xl border border-white/10 bg-black/50 px-5 py-4 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.7)]">
          <div className="pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-r from-siteViolet/40 via-cyan-400/30 to-pink-500/40 opacity-40 blur-2xl" />
          <div className="relative space-y-4">
            <CustomInput
              label="Room name"
              placeHolder="Enter room name (e.g. DRiP Duel)"
              value={roomName}
              handleValueChange={setRoomName}
              fullWidth
              id="room-name-input"
            />

            <CustomButton
              title={creating ? "Creating..." : "Create Room"}
              handleClick={handleCreate}
              disabled={creating || roomName.trim() === ""}
              restStyles="mt-1 glow-accent w-full justify-center"
            />

            <p className="font-rajdhani text-xs text-siteWhite/70">
              After creating, you&apos;ll land in your private Arena room. Copy the URL and
              share it with your opponent — when you both join, start the room match from
              the Arena screen.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-rajdhani text-siteWhite/80">
          <div className="rounded-xl border border-white/10 bg-siteDimBlack/80 p-3">
            <p className="font-semibold text-siteWhite mb-1">How rooms work</p>
            <p>
              Rooms are lightweight lobbies that share a match between two browsers via a
              WebSocket server. Both players must use the same room link.
            </p>
          </div>
          <div className="rounded-xl border border-siteViolet/40 bg-black/70 p-3">
            <p className="font-semibold text-siteWhite mb-1">Pro tip</p>
            <p>
              For best results, run the <span className="text-siteViolet">room server</span>{" "}
              locally and keep the browser tab open for the whole match.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

