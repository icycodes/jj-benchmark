import { type WebSocketDefinition, type WaspSocketData } from "wasp/server/webSocket";
import { type Notification } from "wasp/entities";

let ioInstance: any = null;

export const getIoInstance = () => {
  return ioInstance;
};

export const webSocketFn: WebSocketFn = (io, context) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    const user = socket.data.user;
    if (user) {
      const userId = user.id;
      const room = `user-${userId}`;
      socket.join(room);
      console.log(`User ${userId} joined room ${room}`);
    }
  });
};

type WebSocketFn = WebSocketDefinition<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

interface ServerToClientEvents {
  notification: (notification: Notification) => void;
}

interface ClientToServerEvents {}

interface InterServerEvents {}

interface SocketData extends WaspSocketData {}
