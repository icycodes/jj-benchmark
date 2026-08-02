import { type CreateDocument, type ShareDocument, type RevokePermission, type SaveVersion, type RestoreVersion } from "wasp/server/operations";
import { HttpError } from "wasp/server";
import { broadcastDocumentUpdate } from "./webSocket";

export const createDocument: CreateDocument<{ title: string }, any> = async (args, context) => {
  const user = context.user;
  if (!user) {
    throw new HttpError(401, "Not authenticated");
  }

  if (!args.title || typeof args.title !== 'string') {
    throw new HttpError(400, "Title is required");
  }

  return context.entities.Document.create({
    data: {
      title: args.title,
      ownerId: user.id,
      content: "",
    },
  });
};

export const shareDocument: ShareDocument<{ documentId: number; username: string; role: string }, any> = async (args, context) => {
  const user = context.user;
  if (!user) {
    throw new HttpError(401, "Not authenticated");
  }

  const document = await context.entities.Document.findUnique({
    where: { id: Number(args.documentId) },
  });

  if (!document) {
    throw new HttpError(404, "Document not found");
  }

  if (document.ownerId !== user.id) {
    throw new HttpError(403, "Only the owner can share the document");
  }

  const targetUser = await context.entities.User.findUnique({
    where: { username: args.username },
  });

  if (!targetUser) {
    throw new HttpError(404, `User ${args.username} not found`);
  }

  if (targetUser.id === user.id) {
    throw new HttpError(400, "You cannot share a document with yourself");
  }

  if (args.role !== "VIEW" && args.role !== "EDIT") {
    throw new HttpError(400, "Invalid role");
  }

  return context.entities.Permission.upsert({
    where: {
      documentId_userId: {
        documentId: Number(args.documentId),
        userId: targetUser.id,
      },
    },
    update: {
      role: args.role,
    },
    create: {
      documentId: Number(args.documentId),
      userId: targetUser.id,
      role: args.role,
    },
  });
};

export const revokePermission: RevokePermission<{ documentId: number; userId: number }, any> = async (args, context) => {
  const user = context.user;
  if (!user) {
    throw new HttpError(401, "Not authenticated");
  }

  const document = await context.entities.Document.findUnique({
    where: { id: Number(args.documentId) },
  });

  if (!document) {
    throw new HttpError(404, "Document not found");
  }

  if (document.ownerId !== user.id) {
    throw new HttpError(403, "Only the owner can revoke permissions");
  }

  return context.entities.Permission.delete({
    where: {
      documentId_userId: {
        documentId: Number(args.documentId),
        userId: Number(args.userId),
      },
    },
  });
};

export const saveVersion: SaveVersion<{ documentId: number; content: string }, any> = async (args, context) => {
  const user = context.user;
  if (!user) {
    throw new HttpError(401, "Not authenticated");
  }

  const document = await context.entities.Document.findUnique({
    where: { id: Number(args.documentId) },
    include: {
      permissions: true,
    },
  });

  if (!document) {
    throw new HttpError(404, "Document not found");
  }

  const isOwner = document.ownerId === user.id;
  const permission = document.permissions.find(p => p.userId === user.id);
  const hasEditAccess = isOwner || (permission && permission.role === "EDIT");

  if (!hasEditAccess) {
    throw new HttpError(403, "Only owners or editors can save versions");
  }

  const version = await context.entities.Version.create({
    data: {
      documentId: Number(args.documentId),
      content: args.content,
      authorId: user.id,
    },
  });

  await context.entities.Document.update({
    where: { id: Number(args.documentId) },
    data: { content: args.content },
  });

  return version;
};

export const restoreVersion: RestoreVersion<{ documentId: number; versionId: number }, any> = async (args, context) => {
  const user = context.user;
  if (!user) {
    throw new HttpError(401, "Not authenticated");
  }

  const document = await context.entities.Document.findUnique({
    where: { id: Number(args.documentId) },
    include: {
      permissions: true,
    },
  });

  if (!document) {
    throw new HttpError(404, "Document not found");
  }

  const isOwner = document.ownerId === user.id;
  const permission = document.permissions.find(p => p.userId === user.id);
  const hasEditAccess = isOwner || (permission && permission.role === "EDIT");

  if (!hasEditAccess) {
    throw new HttpError(403, "Only owners or editors can restore versions");
  }

  const version = await context.entities.Version.findUnique({
    where: { id: Number(args.versionId) },
  });

  if (!version || version.documentId !== Number(args.documentId)) {
    throw new HttpError(404, "Version not found");
  }

  await context.entities.Document.update({
    where: { id: Number(args.documentId) },
    data: { content: version.content },
  });

  broadcastDocumentUpdate(Number(args.documentId), version.content);

  return version;
};
