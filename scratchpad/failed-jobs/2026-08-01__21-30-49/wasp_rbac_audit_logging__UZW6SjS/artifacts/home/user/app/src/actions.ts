import { HttpError } from "wasp/server";
import { type CreateDocument, type UpdateDocument, type DeleteDocument } from "wasp/server/operations";

export const createDocument: CreateDocument<{ title: string; content: string }, any> = async ({ title, content }, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  if (context.user.role !== "MANAGER" && context.user.role !== "ADMIN") {
    throw new HttpError(403, "Access denied: MANAGER or ADMIN only");
  }

  const newDoc = await context.entities.Document.create({
    data: {
      title,
      content,
      owner: {
        connect: { id: context.user.id },
      },
    },
  });

  await context.entities.AuditLog.create({
    data: {
      action: "CREATE",
      entityName: "Document",
      entityId: newDoc.id,
      user: {
        connect: { id: context.user.id },
      },
      payload: JSON.stringify({ title, content }),
    },
  });

  return newDoc;
};

export const updateDocument: UpdateDocument<{ id: number; title: string; content: string }, any> = async ({ id, title, content }, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  if (context.user.role !== "MANAGER" && context.user.role !== "ADMIN") {
    throw new HttpError(403, "Access denied: MANAGER or ADMIN only");
  }

  const updatedDoc = await context.entities.Document.update({
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
      entityId: id,
      user: {
        connect: { id: context.user.id },
      },
      payload: JSON.stringify({ title, content }),
    },
  });

  return updatedDoc;
};

export const deleteDocument: DeleteDocument<{ id: number }, any> = async ({ id }, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  if (context.user.role !== "ADMIN") {
    throw new HttpError(403, "Access denied: ADMIN only");
  }

  const deletedDoc = await context.entities.Document.delete({
    where: { id },
  });

  await context.entities.AuditLog.create({
    data: {
      action: "DELETE",
      entityName: "Document",
      entityId: id,
      user: {
        connect: { id: context.user.id },
      },
      payload: JSON.stringify({ id }),
    },
  });

  return deletedDoc;
};
