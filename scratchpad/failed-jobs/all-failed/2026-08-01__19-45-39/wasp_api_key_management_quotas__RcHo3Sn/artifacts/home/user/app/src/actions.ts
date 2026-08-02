import { randomUUID } from "crypto";
import { HttpError } from "wasp/server";
import type { CreateApiKey, DeleteApiKey } from "wasp/server/operations";
import type { ApiKey } from "wasp/entities";

type CreateApiKeyInput = {
  name: string;
  quota: number;
};

export const createApiKey: CreateApiKey<CreateApiKeyInput, ApiKey> = async (
  args,
  context,
) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const key = `sk_${randomUUID().replace(/-/g, "")}`;

  return context.entities.ApiKey.create({
    data: {
      key,
      name: args.name,
      quota: args.quota,
      usage: 0,
      userId: context.user.id,
    },
  });
};

type DeleteApiKeyInput = {
  id: number;
};

export const deleteApiKey: DeleteApiKey<DeleteApiKeyInput, void> = async (
  args,
  context,
) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const apiKey = await context.entities.ApiKey.findUnique({
    where: { id: args.id },
  });

  if (!apiKey || apiKey.userId !== context.user.id) {
    throw new HttpError(404, "API key not found");
  }

  await context.entities.ApiKey.delete({
    where: { id: args.id },
  });
};
