import { HttpError } from 'wasp/server';
import type { CreateApiKey, DeleteApiKey } from 'wasp/server/operations';
import type { ApiKey } from 'wasp/entities';
import crypto from 'crypto';

type CreateApiKeyInput = {
  name: string;
  quota: number;
};

export const createApiKey: CreateApiKey<CreateApiKeyInput, ApiKey> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Unauthorized');
  }

  if (!args.name) {
    throw new HttpError(400, 'Name is required');
  }

  if (args.quota === undefined || args.quota === null || args.quota < 0) {
    throw new HttpError(400, 'Quota must be a non-negative number');
  }

  const key = `sk_${crypto.randomUUID()}`;

  return context.entities.ApiKey.create({
    data: {
      key,
      name: args.name,
      quota: Number(args.quota),
      userId: context.user.id,
    },
  });
};

type DeleteApiKeyInput = {
  id: number;
};

export const deleteApiKey: DeleteApiKey<DeleteApiKeyInput, void> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Unauthorized');
  }

  const apiKey = await context.entities.ApiKey.findUnique({
    where: { id: Number(args.id) },
  });

  if (!apiKey || apiKey.userId !== context.user.id) {
    throw new HttpError(404, 'API Key not found');
  }

  await context.entities.ApiKey.delete({
    where: { id: Number(args.id) },
  });
};
