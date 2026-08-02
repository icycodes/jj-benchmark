import { HttpError } from "wasp/server";
import type { Notification, NotificationPreference } from "wasp/entities";
import type {
  GetNotifications,
  BatchUpdateNotificationStatus,
  GetNotificationPreferences,
  UpdateNotificationPreferences,
  TriggerNotificationEvent,
} from "wasp/server/operations";
import { getIoInstance } from "./webSocket";

export const getNotifications: GetNotifications<void, Notification[]> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  return context.entities.Notification.findMany({
    where: { userId: context.user.id },
    orderBy: { createdAt: "desc" },
  });
};

export const batchUpdateNotificationStatus: BatchUpdateNotificationStatus<
  { ids: number[]; isRead: boolean },
  { count: number }
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const { ids, isRead } = args;

  const result = await context.entities.Notification.updateMany({
    where: {
      id: { in: ids },
      userId: context.user.id,
    },
    data: {
      isRead,
    },
  });

  return { count: result.count };
};

export const getNotificationPreferences: GetNotificationPreferences<
  void,
  NotificationPreference
> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const preference = await context.entities.NotificationPreference.findUnique({
    where: { userId: context.user.id },
  });

  if (preference) {
    return preference;
  }

  return context.entities.NotificationPreference.create({
    data: {
      userId: context.user.id,
      systemEnabled: true,
      securityEnabled: true,
      activityEnabled: true,
    },
  });
};

export const updateNotificationPreferences: UpdateNotificationPreferences<
  { systemEnabled: boolean; securityEnabled: boolean; activityEnabled: boolean },
  NotificationPreference
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const { systemEnabled, securityEnabled, activityEnabled } = args;

  return context.entities.NotificationPreference.upsert({
    where: { userId: context.user.id },
    update: {
      systemEnabled,
      securityEnabled,
      activityEnabled,
    },
    create: {
      userId: context.user.id,
      systemEnabled,
      securityEnabled,
      activityEnabled,
    },
  });
};

export const triggerNotificationEvent: TriggerNotificationEvent<
  { type: "SYSTEM" | "SECURITY" | "ACTIVITY"; title: string; message: string },
  { success: boolean; created: boolean }
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const { type, title, message } = args;

  // 1. Get or create preferences
  let preference = await context.entities.NotificationPreference.findUnique({
    where: { userId: context.user.id },
  });

  if (!preference) {
    preference = await context.entities.NotificationPreference.create({
      data: {
        userId: context.user.id,
        systemEnabled: true,
        securityEnabled: true,
        activityEnabled: true,
      },
    });
  }

  // 2. Check if preference for given type is enabled
  let isEnabled = false;
  if (type === "SYSTEM") {
    isEnabled = preference.systemEnabled;
  } else if (type === "SECURITY") {
    isEnabled = preference.securityEnabled;
  } else if (type === "ACTIVITY") {
    isEnabled = preference.activityEnabled;
  }

  if (isEnabled) {
    // Create new Notification in the database
    const newNotification = await context.entities.Notification.create({
      data: {
        userId: context.user.id,
        type,
        title,
        message,
        isRead: false,
      },
    });

    // Emit real-time 'notification' event to the user's Socket.IO room
    const io = getIoInstance();
    if (io) {
      io.to(`user-${context.user.id}`).emit("notification", newNotification);
    }

    return { success: true, created: true };
  } else {
    return { success: true, created: false };
  }
};
