import type { CreateApiKey, DeleteApiKey } from "wasp/server/operations";
import type { ApiKey } from "wasp/entities";
import { randomBytes } from "node:crypto";

function generateApiKey(): string {
  return "sk_" + randomBytes(16).toString("hex");
}

export const createApiKey: CreateApiKey<{ name: string; quota: number }, ApiKey> = async (args, context) => {
  const key = generateApiKey();
  return context.entities.ApiKey.create({
    data: {
      key,
      name: args.name,
      quota: args.quota,
      usage: 0,
      userId: context.user!.id,
    },
  });
};

export const deleteApiKey: DeleteApiKey<{ id: number }, ApiKey> = async (args, context) => {
  return context.entities.ApiKey.delete({
    where: {
      id: args.id,
      userId: context.user!.id,
    },
  });
};
