import type { GetApiKeys } from "wasp/server/operations";
import type { ApiKey, ApiLog } from "wasp/entities";

export const getApiKeys: GetApiKeys<void, (ApiKey & { logs: ApiLog[] })[]> = async (_args, context) => {
  return context.entities.ApiKey.findMany({
    where: {
      userId: context.user!.id,
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
