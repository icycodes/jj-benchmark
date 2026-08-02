import { HttpError } from "wasp/server";
import type {
  GetDocuments,
  GetAuditLogs,
  CreateDocument,
  UpdateDocument,
  DeleteDocument,
} from "wasp/server/operations";

export const getDocuments: GetDocuments<void, any[]> = async (
  _args,
  context
) => {
  if (!context.user) {
    throw new HttpError(401, "Not authenticated");
  }
  return context.entities.Document.findMany({
    include: { owner: true },
    orderBy: { id: "asc" },
  });
};

export const getAuditLogs: GetAuditLogs<void, any[]> = async (
  _args,
  context
) => {
  if (!context.user) {
    throw new HttpError(401, "Not authenticated");
  }
  if (context.user.role !== "ADMIN") {
    throw new HttpError(403, "Forbidden");
  }
  return context.entities.AuditLog.findMany({
    include: { user: true },
    orderBy: { timestamp: "desc" },
  });
};

export const createDocument: CreateDocument<
  { title: string; content: string },
  any
> = async ({ title, content }, context) => {
  if (!context.user) {
    throw new HttpError(401, "Not authenticated");
  }
  if (context.user.role !== "MANAGER" && context.user.role !== "ADMIN") {
    throw new HttpError(403, "Forbidden");
  }

  const doc = await context.entities.Document.create({
    data: {
      title,
      content,
      owner: { connect: { id: context.user.id } },
    },
  });

  await context.entities.AuditLog.create({
    data: {
      action: "CREATE",
      entityName: "Document",
      entityId: doc.id,
      user: { connect: { id: context.user.id } },
      payload: JSON.stringify({ title, content }),
    },
  });

  return doc;
};

export const updateDocument: UpdateDocument<
  { id: number; title: string; content: string },
  any
> = async ({ id, title, content }, context) => {
  if (!context.user) {
    throw new HttpError(401, "Not authenticated");
  }
  if (context.user.role !== "MANAGER" && context.user.role !== "ADMIN") {
    throw new HttpError(403, "Forbidden");
  }

  const doc = await context.entities.Document.update({
    where: { id },
    data: {
      title,
      content,
    },
  });

  await context.entities.AuditLog.create({
    data: {
      action: "UPDATE",
      entityName: "Document",
      entityId: doc.id,
      user: { connect: { id: context.user.id } },
      payload: JSON.stringify({ title, content }),
    },
  });

  return doc;
};

export const deleteDocument: DeleteDocument<{ id: number }, any> = async (
  { id },
  context
) => {
  if (!context.user) {
    throw new HttpError(401, "Not authenticated");
  }
  if (context.user.role !== "ADMIN") {
    throw new HttpError(403, "Forbidden");
  }

  await context.entities.Document.delete({
    where: { id },
  });

  await context.entities.AuditLog.create({
    data: {
      action: "DELETE",
      entityName: "Document",
      entityId: id,
      user: { connect: { id: context.user.id } },
      payload: JSON.stringify({ id }),
    },
  });

  return { id };
};
