import { HttpError } from "wasp/server";
import type { GetApiKeys } from "wasp/server/operations";
import type { ApiKey, ApiLog } from "wasp/entities";

type ApiKeyWithLogs = ApiKey & { logs: ApiLog[] };

export const getApiKeys: GetApiKeys<void, ApiKeyWithLogs[]> = async (
  _args,
  context,
) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  return context.entities.ApiKey.findMany({
    where: { userId: context.user.id },
    include: {
      logs: {
        orderBy: { timestamp: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};
