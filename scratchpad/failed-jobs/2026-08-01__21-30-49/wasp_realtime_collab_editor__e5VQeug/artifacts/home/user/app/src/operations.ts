import { HttpError } from "wasp/server";
import {
  type GetDocuments,
  type GetDocument,
  type CreateDocument,
  type UpdateDocumentContent,
  type SaveVersion,
  type RestoreVersion,
  type ShareDocument,
  type RevokePermission,
} from "wasp/server/operations";

export const getDocuments: GetDocuments<void, any[]> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  return context.entities.Document.findMany({
    where: {
      OR: [
        { ownerId: context.user!.id },
        {
          permissions: {
            some: {
              userId: context.user!.id,
            },
          },
        },
      ],
    },
    include: {
      owner: true,
      permissions: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
};

export const getDocument: GetDocument<{ id: number }, any> = async ({ id }, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const docId = Number(id);
  if (isNaN(docId)) {
    throw new HttpError(400, "Invalid document ID");
  }

  const document = await context.entities.Document.findUnique({
    where: { id: docId },
    include: {
      owner: true,
      versions: {
        include: {
          author: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      permissions: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!document) {
    throw new HttpError(404, "Document not found");
  }

  const isOwner = document.ownerId === context.user!.id;
  const userPermission = document.permissions.find(
    (p: any) => p.userId === context.user!.id
  );

  if (!isOwner && !userPermission) {
    throw new HttpError(403, "Access Denied");
  }

  const role = isOwner ? "OWNER" : userPermission ? userPermission.role : null;

  return {
    document,
    role,
  };
};

export const createDocument: CreateDocument<{ title: string }, any> = async ({ title }, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  if (!title || title.trim() === "") {
    throw new HttpError(400, "Title is required");
  }

  return context.entities.Document.create({
    data: {
      title: title.trim(),
      ownerId: context.user!.id,
      content: "",
    },
  });
};

export const updateDocumentContent: UpdateDocumentContent<{ id: number; content: string }, any> = async ({ id, content }, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const docId = Number(id);
  const document = await context.entities.Document.findUnique({
    where: { id: docId },
    include: {
      permissions: true,
    },
  });

  if (!document) {
    throw new HttpError(404, "Document not found");
  }

  const isOwner = document.ownerId === context.user!.id;
  const hasEditPermission = document.permissions.some(
    (p: any) => p.userId === context.user!.id && p.role === "EDIT"
  );

  if (!isOwner && !hasEditPermission) {
    throw new HttpError(403, "Access Denied");
  }

  return context.entities.Document.update({
    where: { id: docId },
    data: {
      content,
    },
  });
};

export const saveVersion: SaveVersion<{ id: number; content: string }, any> = async ({ id, content }, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const docId = Number(id);
  const document = await context.entities.Document.findUnique({
    where: { id: docId },
    include: {
      permissions: true,
    },
  });

  if (!document) {
    throw new HttpError(404, "Document not found");
  }

  const isOwner = document.ownerId === context.user!.id;
  const hasEditPermission = document.permissions.some(
    (p: any) => p.userId === context.user!.id && p.role === "EDIT"
  );

  if (!isOwner && !hasEditPermission) {
    throw new HttpError(403, "Access Denied");
  }

  await context.entities.Document.update({
    where: { id: docId },
    data: {
      content,
    },
  });

  return context.entities.Version.create({
    data: {
      documentId: docId,
      content,
      authorId: context.user!.id,
    },
  });
};

export const restoreVersion: RestoreVersion<{ documentId: number; versionId: number }, any> = async ({ documentId, versionId }, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const docId = Number(documentId);
  const vId = Number(versionId);

  const document = await context.entities.Document.findUnique({
    where: { id: docId },
    include: {
      permissions: true,
    },
  });

  if (!document) {
    throw new HttpError(404, "Document not found");
  }

  const isOwner = document.ownerId === context.user!.id;
  const hasEditPermission = document.permissions.some(
    (p: any) => p.userId === context.user!.id && p.role === "EDIT"
  );

  if (!isOwner && !hasEditPermission) {
    throw new HttpError(403, "Access Denied");
  }

  const version = await context.entities.Version.findFirst({
    where: {
      id: vId,
      documentId: docId,
    },
  });

  if (!version) {
    throw new HttpError(404, "Version not found");
  }

  return context.entities.Document.update({
    where: { id: docId },
    data: {
      content: version.content,
    },
  });
};

export const shareDocument: ShareDocument<{ documentId: number; username: string; role: string }, any> = async ({ documentId, username, role }, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const docId = Number(documentId);
  const document = await context.entities.Document.findUnique({
    where: { id: docId },
  });

  if (!document) {
    throw new HttpError(404, "Document not found");
  }

  if (document.ownerId !== context.user!.id) {
    throw new HttpError(403, "Only the owner can share the document");
  }

  const targetUser = await context.entities.User.findUnique({
    where: { username },
  });

  if (!targetUser) {
    throw new HttpError(404, `User "${username}" not found`);
  }

  if (targetUser.id === context.user!.id) {
    throw new HttpError(400, "You cannot share the document with yourself");
  }

  if (role !== "VIEW" && role !== "EDIT") {
    throw new HttpError(400, "Invalid role. Must be VIEW or EDIT");
  }

  return context.entities.Permission.upsert({
    where: {
      documentId_userId: {
        documentId: docId,
        userId: targetUser.id,
      },
    },
    update: {
      role,
    },
    create: {
      documentId: docId,
      userId: targetUser.id,
      role,
    },
  });
};

export const revokePermission: RevokePermission<{ permissionId: number }, any> = async ({ permissionId }, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const pId = Number(permissionId);
  const permission = await context.entities.Permission.findUnique({
    where: { id: pId },
    include: {
      document: true,
    },
  });

  if (!permission) {
    throw new HttpError(404, "Permission record not found");
  }

  if (permission.document.ownerId !== context.user!.id) {
    throw new HttpError(403, "Only the owner can revoke permissions");
  }

  return context.entities.Permission.delete({
    where: { id: pId },
  });
};
