import { HttpError } from "wasp/server";

export const getDocuments = async (args: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  return context.entities.Document.findMany({
    where: {
      OR: [
        { ownerId: context.user.id },
        { permissions: { some: { userId: context.user.id } } },
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

export const getDocument = async (args: { id: string | number }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const docId = typeof args.id === "string" ? parseInt(args.id, 10) : args.id;
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
          createdAt: "asc",
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

  const isOwner = document.ownerId === context.user.id;
  const userPermission = await context.entities.Permission.findUnique({
    where: {
      documentId_userId: {
        documentId: docId,
        userId: context.user.id,
      },
    },
  });

  if (!isOwner && !userPermission) {
    throw new HttpError(403, "Access Denied");
  }

  const role = isOwner ? "OWNER" : userPermission!.role;

  return {
    document,
    role,
  };
};

export const getDocumentPermissions = async (args: { documentId: string | number }, context: any) => {
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

  return context.entities.Permission.findMany({
    where: { documentId: docId },
    include: {
      user: true,
    },
  });
};
