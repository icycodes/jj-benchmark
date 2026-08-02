import { HttpError } from "wasp/server";
import type { GetApiKeys } from "wasp/server/operations";

export const getApiKeys: GetApiKeys<void, any> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  return context.entities.ApiKey.findMany({
    where: {
      userId: context.user.id,
    },
    include: {
      logs: {
        orderBy: {
          timestamp: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};
