import { type WebSocketDefinition } from "wasp/server/webSocket";

export const webSocketFn: WebSocketDefinition = (io, context) => {
  io.on("connection", (socket) => {
    socket.on("joinDocument", (documentId) => {
      socket.join(`document-${documentId}`);
    });

    socket.on("leaveDocument", (documentId) => {
      socket.leave(`document-${documentId}`);
    });

    socket.on("editDocument", async ({ documentId, content }) => {
      try {
        await context.entities.Document.update({
          where: { id: Number(documentId) },
          data: { content },
        });
      } catch (err) {
        console.error("Failed to update document content in WS:", err);
      }
      socket.to(`document-${documentId}`).emit("documentEdited", { content });
    });

    socket.on("restoreVersion", ({ documentId, content }) => {
      socket.to(`document-${documentId}`).emit("documentEdited", { content });
    });
  });
};
