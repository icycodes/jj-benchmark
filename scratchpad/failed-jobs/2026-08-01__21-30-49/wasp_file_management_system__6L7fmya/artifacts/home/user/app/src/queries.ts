import { HttpError } from "wasp/server";

export const getFolderContents = async (args: { folderId?: number | null }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }
  const userId = context.user.id;
  const folderId = args.folderId ? Number(args.folderId) : null;

  // Fetch folders inside current folder
  const folders = await context.entities.Folder.findMany({
    where: {
      userId,
      parentId: folderId,
    },
    orderBy: { name: "asc" },
  });

  // Fetch files inside current folder
  const files = await context.entities.File.findMany({
    where: {
      userId,
      folderId,
    },
    orderBy: { name: "asc" },
  });

  // Build breadcrumbs path
  const breadcrumbs: { id: number; name: string }[] = [];
  let currentId = folderId;
  while (currentId) {
    const f = await context.entities.Folder.findUnique({
      where: { id: currentId, userId },
    });
    if (!f) break;
    breadcrumbs.unshift({ id: f.id, name: f.name });
    currentId = f.parentId;
  }

  return {
    folders,
    files,
    breadcrumbs,
  };
};

export const getAccessLogs = async (args: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }
  const userId = context.user.id;

  const logs = await context.entities.AccessLog.findMany({
    where: {
      shareLink: {
        file: {
          userId,
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
    orderBy: { timestamp: "desc" },
  });

  return logs.map((log: any) => ({
    id: log.id,
    fileName: log.shareLink.file.name,
    timestamp: log.timestamp.toISOString(),
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
  }));
};

export const getShareLinkDetails = async (args: { linkId: string }, context: any) => {
  const shareLink = await context.entities.ShareLink.findUnique({
    where: { id: args.linkId },
    include: {
      file: true,
    },
  });

  if (!shareLink) {
    throw new HttpError(404, "Sharing link not found");
  }

  const isExpired = shareLink.expiresAt && new Date() > new Date(shareLink.expiresAt);

  return {
    id: shareLink.id,
    fileName: shareLink.file.name,
    isPasswordProtected: !!shareLink.password,
    isExpired: !!isExpired,
  };
};
