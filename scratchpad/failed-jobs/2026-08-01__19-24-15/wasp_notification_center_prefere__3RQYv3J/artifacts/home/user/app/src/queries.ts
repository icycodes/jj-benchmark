import { type GetNotifications, type GetNotificationPreferences } from "wasp/server/operations";
import { type Notification, type NotificationPreference } from "wasp/entities";
import { HttpError } from "wasp/server";

export const getNotifications: GetNotifications<void, Notification[]> = async (
  _args,
  context
) => {
  if (!context.user) {
    throw new HttpError(401, "User not authenticated");
  }

  return context.entities.Notification.findMany({
    where: { userId: context.user.id },
    orderBy: { createdAt: "desc" },
  });
};

export const getNotificationPreferences: GetNotificationPreferences<
  void,
  NotificationPreference
> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, "User not authenticated");
  }

  let preferences = await context.entities.NotificationPreference.findUnique({
    where: { userId: context.user.id },
  });

  if (!preferences) {
    preferences = await context.entities.NotificationPreference.create({
      data: {
        userId: context.user.id,
        systemEnabled: true,
        securityEnabled: true,
        activityEnabled: true,
      },
    });
  }

  return preferences;
};
