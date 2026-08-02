import { HttpError } from 'wasp/server';

export const getApiKeys = async (args: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  return context.entities.ApiKey.findMany({
    where: {
      userId: context.user.id,
    },
    include: {
      logs: {
        orderBy: {
          timestamp: 'desc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};
