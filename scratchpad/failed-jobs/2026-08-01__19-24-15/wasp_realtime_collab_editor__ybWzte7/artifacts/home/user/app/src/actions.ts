import { HttpError } from "wasp/server";

export const createDocument = async (args: { title: string }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  if (typeof args.title !== "string" || !args.title.trim()) {
    throw new HttpError(400, "Title is required");
  }

  return context.entities.Document.create({
    data: {
      title: args.title.trim(),
      content: "",
      ownerId: context.user.id,
    },
  });
};

export const updateDocumentContent = async (args: { id: string | number; content: string }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const docId = typeof args.id === "string" ? parseInt(args.id, 10) : args.id;
  if (isNaN(docId)) {
    throw new HttpError(400, "Invalid document ID");
  }

  const document = await context.entities.Document.findUnique({
    where: { id: docId },
  });

  if (!document) {
    throw new HttpError(404, "Document not found");
  }

  const isOwner = document.ownerId === context.user.id;
  const userPermission = await context.entities.Permission.findUnique({
    where: {
      documentId_userId: {
        documentId: docId,
        userId: context.user.id,
      },
    },
  });

  if (!isOwner && (!userPermission || userPermission.role !== "EDIT")) {
    throw new HttpError(403, "Access Denied");
  }

  return context.entities.Document.update({
    where: { id: docId },
    data: {
      content: args.content,
    },
  });
};

export const saveVersion = async (args: { documentId: string | number; content: string }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const docId = typeof args.documentId === "string" ? parseInt(args.documentId, 10) : args.documentId;
  if (isNaN(docId)) {
    throw new HttpError(400, "Invalid document ID");
  }

  const document = await context.entities.Document.findUnique({
    where: { id: docId },
  });

  if (!document) {
    throw new HttpError(404, "Document not found");
  }

  const isOwner = document.ownerId === context.user.id;
  const userPermission = await context.entities.Permission.findUnique({
    where: {
      documentId_userId: {
        documentId: docId,
        userId: context.user.id,
      },
    },
  });

  if (!isOwner && (!userPermission || userPermission.role !== "EDIT")) {
    throw new HttpError(403, "Access Denied");
  }

  // Save the new version
  await context.entities.Version.create({
    data: {
      documentId: docId,
      content: args.content,
      authorId: context.user.id,
    },
  });

  // Update document's primary content
  return context.entities.Document.update({
    where: { id: docId },
    data: {
      content: args.content,
    },
  });
};

export const restoreVersion = async (args: { documentId: string | number; versionId: string | number }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const docId = typeof args.documentId === "string" ? parseInt(args.documentId, 10) : args.documentId;
  const verId = typeof args.versionId === "string" ? parseInt(args.versionId, 10) : args.versionId;
  if (isNaN(docId) || isNaN(verId)) {
    throw new HttpError(400, "Invalid parameter IDs");
  }

  const document = await context.entities.Document.findUnique({
    where: { id: docId },
  });

  if (!document) {
    throw new HttpError(404, "Document not found");
  }

  const isOwner = document.ownerId === context.user.id;
  const userPermission = await context.entities.Permission.findUnique({
    where: {
      documentId_userId: {
        documentId: docId,
        userId: context.user.id,
      },
    },
  });

  if (!isOwner && (!userPermission || userPermission.role !== "EDIT")) {
    throw new HttpError(403, "Access Denied");
  }

  const version = await context.entities.Version.findUnique({
    where: { id: verId },
  });

  if (!version || version.documentId !== docId) {
    throw new HttpError(404, "Version not found or does not belong to this document");
  }

  // Update document content to version content
  return context.entities.Document.update({
    where: { id: docId },
    data: {
      content: version.content,
    },
  });
};

export const shareDocument = async (
  args: { documentId: string | number; username: string; role: string },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const docId = typeof args.documentId === "string" ? parseInt(args.documentId, 10) : args.documentId;
  if (isNaN(docId)) {
    throw new HttpError(400, "Invalid document ID");
  }

  const document = await context.entities.Document.findUnique({
    where: { id: docId },
  });

  if (!document) {
    throw new HttpError(404, "Document not found");
  }

  if (document.ownerId !== context.user.id) {
    throw new HttpError(403, "Access Denied");
  }

  const targetUser = await context.entities.User.findUnique({
    where: { username: args.username },
  });

  if (!targetUser) {
    throw new HttpError(404, "User not found");
  }

  if (targetUser.id === context.user.id) {
    throw new HttpError(400, "Cannot share with yourself");
  }

  if (args.role !== "VIEW" && args.role !== "EDIT") {
    throw new HttpError(400, "Invalid role");
  }

  return context.entities.Permission.upsert({
    where: {
      documentId_userId: {
        documentId: docId,
        userId: targetUser.id,
      },
    },
    update: {
      role: args.role,
    },
    create: {
      documentId: docId,
      userId: targetUser.id,
      role: args.role,
    },
  });
};

export const revokePermission = async (args: { id: string | number }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const permId = typeof args.id === "string" ? parseInt(args.id, 10) : args.id;
  if (isNaN(permId)) {
    throw new HttpError(400, "Invalid permission ID");
  }

  const permission = await context.entities.Permission.findUnique({
    where: { id: permId },
    include: {
      document: true,
    },
  });

  if (!permission) {
    throw new HttpError(404, "Permission not found");
  }

  if (permission.document.ownerId !== context.user.id) {
    throw new HttpError(403, "Access Denied");
  }

  return context.entities.Permission.delete({
    where: { id: permId },
  });
};
