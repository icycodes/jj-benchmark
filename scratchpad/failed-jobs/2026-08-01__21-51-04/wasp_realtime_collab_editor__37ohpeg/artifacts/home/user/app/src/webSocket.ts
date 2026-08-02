let ioInstance: any = null;

export const webSocketFn = (io: any, context: any) => {
  ioInstance = io;

  io.on("connection", (socket: any) => {
    console.log("A user connected: ", socket.data.user?.username);

    socket.on("joinDocument", (documentId: number) => {
      socket.join(`document-${documentId}`);
      console.log(`Socket ${socket.id} joined document-${documentId}`);
    });

    socket.on("leaveDocument", (documentId: number) => {
      socket.leave(`document-${documentId}`);
      console.log(`Socket ${socket.id} left document-${documentId}`);
    });

    socket.on("editDocument", async ({ documentId, content }: { documentId: number; content: string }) => {
      // Broadcast the change to other users in the room
      socket.to(`document-${documentId}`).emit("documentUpdated", { content });

      // Save the content to the database
      try {
        await context.entities.Document.update({
          where: { id: Number(documentId) },
          data: { content },
        });
      } catch (err) {
        console.error("Error saving document content: ", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected: ", socket.data.user?.username);
    });
  });
};

export function broadcastDocumentUpdate(documentId: number, content: string) {
  if (ioInstance) {
    ioInstance.to(`document-${documentId}`).emit("documentUpdated", { content });
  }
}
