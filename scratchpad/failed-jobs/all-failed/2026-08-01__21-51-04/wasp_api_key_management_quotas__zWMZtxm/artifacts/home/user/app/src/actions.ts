import { HttpError } from 'wasp/server';
import crypto from 'crypto';

export const createApiKey = async (args: { name: string; quota: number }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!args.name || typeof args.name !== 'string') {
    throw new HttpError(400, 'Name is required');
  }

  if (args.quota === undefined || args.quota === null || typeof args.quota !== 'number' || args.quota < 0) {
    throw new HttpError(400, 'Valid quota is required');
  }

  const key = `sk_${crypto.randomUUID().replace(/-/g, '')}`;

  return context.entities.ApiKey.create({
    data: {
      name: args.name,
      quota: args.quota,
      key: key,
      userId: context.user.id,
    },
  });
};

export const deleteApiKey = async (args: { id: number }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  const apiKey = await context.entities.ApiKey.findUnique({
    where: { id: args.id },
  });

  if (!apiKey) {
    throw new HttpError(404, 'API Key not found');
  }

  if (apiKey.userId !== context.user.id) {
    throw new HttpError(403, 'Forbidden');
  }

  return context.entities.ApiKey.delete({
    where: { id: args.id },
  });
};
