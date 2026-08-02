import { HttpError } from "wasp/server";
import crypto from "crypto";

export const getApiKeys = async (_args: void, context: any) => {
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

export const createApiKey = async (args: { name: string; quota: number }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }
  if (!args.name || typeof args.name !== "string") {
    throw new HttpError(400, "Name is required and must be a string");
  }
  if (typeof args.quota !== "number" || args.quota <= 0) {
    throw new HttpError(400, "Quota must be a positive number");
  }

  const uuid = crypto.randomUUID().replace(/-/g, "");
  const key = `sk_${uuid}`;

  return context.entities.ApiKey.create({
    data: {
      key,
      name: args.name,
      quota: args.quota,
      user: {
        connect: {
          id: context.user.id,
        },
      },
    },
  });
};

export const deleteApiKey = async (args: { id: number }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const apiKey = await context.entities.ApiKey.findFirst({
    where: {
      id: args.id,
      userId: context.user.id,
    },
  });

  if (!apiKey) {
    throw new HttpError(404, "API key not found");
  }

  return context.entities.ApiKey.delete({
    where: {
      id: args.id,
    },
  });
};
