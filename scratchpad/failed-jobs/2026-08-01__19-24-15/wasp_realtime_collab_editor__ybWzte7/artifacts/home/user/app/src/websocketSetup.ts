import { type WebSocketDefinition } from "wasp/server/webSocket";

export const webSocketFn: WebSocketDefinition = (io, context) => {
  io.on("connection", (socket) => {
    const username = socket.data.user?.username ?? "Unknown";
    console.log("User connected to WebSocket: " + username);

    socket.on("joinDocument", (documentId: string | number) => {
      const room = `document:${documentId}`;
      socket.join(room);
      console.log(`User ${username} joined room ${room}`);
    });

    socket.on("editDocument", async ({ documentId, content }: { documentId: string | number; content: string }) => {
      const docId = typeof documentId === "string" ? parseInt(documentId, 10) : documentId;
      if (isNaN(docId)) return;

      try {
        // Update database
        await context.entities.Document.update({
          where: { id: docId },
          data: { content },
        });

        // Broadcast to other users in the same room
        socket.to(`document:${docId}`).emit("documentUpdated", { content });
      } catch (err) {
        console.error("Error updating document content in WebSocket:", err);
      }
    });

    socket.on("restoreVersion", async ({ documentId, content }: { documentId: string | number; content: string }) => {
      const docId = typeof documentId === "string" ? parseInt(documentId, 10) : documentId;
      if (isNaN(docId)) return;

      // Broadcast to all users in the room (including the sender to ensure sync)
      io.to(`document:${docId}`).emit("documentUpdated", { content });
    });

    socket.on("disconnect", () => {
      console.log(`User ${username} disconnected`);
    });
  });
};
