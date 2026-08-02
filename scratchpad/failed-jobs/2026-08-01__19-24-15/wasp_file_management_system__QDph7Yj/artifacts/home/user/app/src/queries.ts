import { type GetFolderContent, type GetAccessLogs, type GetShareLink } from "wasp/server/operations";

export const getFolderContent: GetFolderContent<
  { folderId: number | null },
  {
    folders: any[];
    files: any[];
    breadcrumbs: any[];
  }
> = async (args, context) => {
  if (!context.user) {
    throw new Error("Unauthorized");
  }

  const userId = context.user.id;
  const folderId = args.folderId;

  // Fetch folders and files in this folder (or root)
  const folders = await context.entities.Folder.findMany({
    where: {
      userId,
      parentId: folderId,
    },
    orderBy: {
      name: "asc",
    },
  });

  const files = await context.entities.File.findMany({
    where: {
      userId,
      folderId,
    },
    include: {
      shareLinks: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // Construct breadcrumbs if folderId is provided
  let breadcrumbs: any[] = [];
  if (folderId) {
    let currentFolder = await context.entities.Folder.findFirst({
      where: { id: folderId, userId },
    });

    while (currentFolder) {
      breadcrumbs.unshift({
        id: currentFolder.id,
        name: currentFolder.name,
      });

      if (currentFolder.parentId) {
        currentFolder = await context.entities.Folder.findFirst({
          where: { id: currentFolder.parentId, userId },
        });
      } else {
        currentFolder = null;
      }
    }
  }

  return {
    folders,
    files,
    breadcrumbs,
  };
};

export const getAccessLogs: GetAccessLogs<void, any[]> = async (args, context) => {
  if (!context.user) {
    throw new Error("Unauthorized");
  }

  // Fetch access logs for files owned by the logged-in user
  const logs = await context.entities.AccessLog.findMany({
    where: {
      shareLink: {
        file: {
          userId: context.user.id,
        },
      },
    },
    include: {
      shareLink: {
        include: {
          file: true,
        },
      },
    },
    orderBy: {
      timestamp: "desc",
    },
  });

  return logs.map((log) => ({
    id: log.id,
    timestamp: log.timestamp,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    fileName: log.shareLink.file.name,
  }));
};

export const getShareLink: GetShareLink<
  { linkId: string; password?: string },
  {
    id: string;
    hasPassword: boolean;
    passwordCorrect: boolean;
    fileName?: string;
    fileSize?: number;
    expired: boolean;
    notFound?: boolean;
  }
> = async (args, context) => {
  const shareLink = await context.entities.ShareLink.findUnique({
    where: { id: args.linkId },
    include: {
      file: true,
    },
  });

  if (!shareLink) {
    return {
      id: args.linkId,
      hasPassword: false,
      passwordCorrect: false,
      expired: false,
      notFound: true,
    };
  }

  const isExpired = shareLink.expiresAt && new Date() > shareLink.expiresAt;

  if (isExpired) {
    return {
      id: shareLink.id,
      hasPassword: !!shareLink.password,
      passwordCorrect: false,
      expired: true,
    };
  }

  const hasPassword = !!shareLink.password;
  let passwordCorrect = !hasPassword;

  if (hasPassword && args.password) {
    passwordCorrect = shareLink.password === args.password;
  }

  return {
    id: shareLink.id,
    hasPassword,
    passwordCorrect,
    fileName: shareLink.file.name,
    fileSize: shareLink.file.size,
    expired: false,
  };
};
