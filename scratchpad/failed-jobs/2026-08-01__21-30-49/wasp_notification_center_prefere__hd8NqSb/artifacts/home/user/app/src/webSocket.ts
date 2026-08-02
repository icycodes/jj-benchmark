import { type WebSocketDefinition } from "wasp/server/webSocket";

let ioInstance: any = null;

export const getIoInstance = () => {
  return ioInstance;
};

export const webSocketFn: WebSocketDefinition = (io, _context) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    const user = socket.data.user;
    if (user) {
      const userId = user.id;
      const roomName = `user-${userId}`;
      socket.join(roomName);
      console.log(`User ${userId} joined room ${roomName}`);
    } else {
      console.log("A socket connected without an authenticated user.");
    }
  });
};
