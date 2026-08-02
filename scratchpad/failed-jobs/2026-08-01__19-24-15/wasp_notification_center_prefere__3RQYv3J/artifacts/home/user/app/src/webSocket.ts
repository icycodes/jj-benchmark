import { type WebSocketDefinition } from "wasp/server/webSocket";

let ioInstance: any = null;

export const webSocketFn: WebSocketDefinition = (io, context) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    if (socket.data.user) {
      const userId = socket.data.user.id;
      const room = `user-${userId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room} for user ${userId}`);
    } else {
      console.log(`Socket ${socket.id} connected without authentication`);
    }
  });
};

export function getIoInstance() {
  return ioInstance;
}
