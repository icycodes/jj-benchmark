import { type GetDocuments, type GetDocument, type GetVersions, type GetPermissions } from "wasp/server/operations";
import { HttpError } from "wasp/server";

export const getDocuments: GetDocuments<void, any[]> = async (_args, context) => {
  const user = context.user;
  if (!user) {
    throw new HttpError(401, "Not authenticated");
  }

  return context.entities.Document.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        {
          permissions: {
            some: {
              userId: user.id,
            },
          },
        },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      owner: true,
      permissions: {
        include: {
          user: true,
        },
      },
    },
  });
};

export const getDocument: GetDocument<{ id: number }, any> = async (args, context) => {
  const user = context.user;
  if (!user) {
    throw new HttpError(401, "Not authenticated");
  }

  const document = await context.entities.Document.findUnique({
    where: { id: Number(args.id) },
    include: {
      owner: true,
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

  let role: string | null = null;
  if (document.ownerId === user.id) {
    role = "OWNER";
  } else {
    const permission = document.permissions.find(p => p.userId === user.id);
    if (permission) {
      role = permission.role;
    }
  }

  if (!role) {
    throw new HttpError(403, "Access Denied");
  }

  return { document, role };
};

export const getVersions: GetVersions<{ documentId: number }, any[]> = async (args, context) => {
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

  const hasAccess = document.ownerId === user.id || document.permissions.some(p => p.userId === user.id);
  if (!hasAccess) {
    throw new HttpError(403, "Access Denied");
  }

  return context.entities.Version.findMany({
    where: { documentId: Number(args.documentId) },
    orderBy: { createdAt: "asc" },
    include: {
      author: true,
    },
  });
};

export const getPermissions: GetPermissions<{ documentId: number }, any[]> = async (args, context) => {
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
    throw new HttpError(403, "Only the owner can view permissions");
  }

  return context.entities.Permission.findMany({
    where: { documentId: Number(args.documentId) },
    include: {
      user: true,
    },
  });
};
