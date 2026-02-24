// Simple WebSocket room server for DRiP Royale room matches.
// Run with: npm run room-server

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { WebSocketServer } = require("ws");

/**
 * @typedef {object} RoomState
 * @property {Set<any>} clients
 * @property {string | null} currentSeed
 */

/** @type {Map<string, RoomState>} */
const rooms = new Map();

const wss = new WebSocketServer({ port: 4000 });

function getRoomClients(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { clients: new Set(), currentSeed: null });
  }
  return rooms.get(roomId);
}

function broadcastToRoom(roomId, data) {
  const room = rooms.get(roomId);
  if (!room) return;
  for (const client of room.clients) {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(data));
    }
  }
}

wss.on("connection", (ws) => {
  let joinedRoomId = null;

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (!msg || typeof msg !== "object") return;

    const { type, roomId, payload } = msg;
    if (!type) return;

    if (type === "join") {
      if (!roomId) return;
      joinedRoomId = roomId;
      const room = getRoomClients(roomId);
      room.clients.add(ws);

      // First client is host, second is guest, others spectators.
      const size = room.clients.size;
      const role = size === 1 ? "host" : size === 2 ? "guest" : "spectator";
      ws.send(
        JSON.stringify({
          type: "room_joined",
          roomId,
          role,
          players: size,
        }),
      );

      // If a match already started in this room, sync the newcomer immediately.
      if (room.currentSeed) {
        ws.send(
          JSON.stringify({
            type: "start_match",
            roomId,
            payload: { seed: room.currentSeed },
          }),
        );
      }

      // Notify others about updated player count.
      broadcastToRoom(roomId, { type: "players", roomId, payload: { players: size } });
      return;
    }

    if (!joinedRoomId) return;

    // For now we just relay game events to everyone in the same room.
    if (type === "start_match") {
      const room = rooms.get(joinedRoomId);
      if (room && payload?.seed) room.currentSeed = payload.seed;
      broadcastToRoom(joinedRoomId, {
        type,
        roomId: joinedRoomId,
        payload: payload || {},
      });
      return;
    }

    if (type === "flip") {
      broadcastToRoom(joinedRoomId, {
        type,
        roomId: joinedRoomId,
        payload: payload || {},
      });
    }
  });

  ws.on("close", () => {
    if (joinedRoomId) {
      const room = rooms.get(joinedRoomId);
      if (room) {
        room.clients.delete(ws);
        const size = room.clients.size;
        if (size === 0) {
          rooms.delete(joinedRoomId);
        } else {
          broadcastToRoom(joinedRoomId, { type: "players", roomId: joinedRoomId, payload: { players: size } });
        }
      }
    }
  });
});

console.log("Room WebSocket server listening on ws://localhost:4000");

