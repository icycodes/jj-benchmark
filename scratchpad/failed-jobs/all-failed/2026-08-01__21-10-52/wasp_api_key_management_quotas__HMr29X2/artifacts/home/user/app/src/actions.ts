import { HttpError } from "wasp/server";
import crypto from "crypto";
import type { CreateApiKey, DeleteApiKey } from "wasp/server/operations";

export const createApiKey: CreateApiKey<{ name: string; quota: number }, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  if (!args.name) {
    throw new HttpError(400, "Name is required");
  }

  if (args.quota === undefined || args.quota === null || args.quota < 0) {
    throw new HttpError(400, "Quota must be a non-negative number");
  }

  const keyUuid = crypto.randomUUID();
  const secureKey = `sk_${keyUuid}`;

  return context.entities.ApiKey.create({
    data: {
      key: secureKey,
      name: args.name,
      quota: Number(args.quota),
      userId: context.user.id,
    },
  });
};

export const deleteApiKey: DeleteApiKey<{ id: number }, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const key = await context.entities.ApiKey.findUnique({
    where: { id: args.id },
  });

  if (!key) {
    throw new HttpError(404, "API Key not found");
  }

  if (key.userId !== context.user.id) {
    throw new HttpError(403, "You do not own this API Key");
  }

  return context.entities.ApiKey.delete({
    where: { id: args.id },
  });
};
