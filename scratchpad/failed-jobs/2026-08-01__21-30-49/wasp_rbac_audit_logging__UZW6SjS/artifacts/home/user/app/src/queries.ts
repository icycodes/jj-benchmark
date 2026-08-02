import { HttpError } from "wasp/server";
import { type GetDocuments, type GetAuditLogs } from "wasp/server/operations";

export const getDocuments: GetDocuments<void, any> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  return context.entities.Document.findMany({
    include: {
      owner: true,
    },
  });
};

export const getAuditLogs: GetAuditLogs<void, any> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  if (context.user.role !== "ADMIN") {
    throw new HttpError(403, "Access denied: ADMIN only");
  }
  return context.entities.AuditLog.findMany({
    include: {
      user: true,
    },
    orderBy: {
      timestamp: "desc",
    },
  });
};
