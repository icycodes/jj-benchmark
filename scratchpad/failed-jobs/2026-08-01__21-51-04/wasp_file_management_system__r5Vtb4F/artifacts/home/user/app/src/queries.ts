import { HttpError } from "wasp/server";

export const getFolder = async (args: { folderId?: number | string | null }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }
  const userId = context.user.id;
  const currentFolderId = args.folderId ? Number(args.folderId) : null;

  let folder = null;
  if (currentFolderId) {
    folder = await context.entities.Folder.findFirst({
      where: { id: currentFolderId, userId },
    });
    if (!folder) {
      throw new HttpError(404, "Folder not found");
    }
  }

  const subfolders = await context.entities.Folder.findMany({
    where: { parentId: currentFolderId, userId },
    orderBy: { name: 'asc' },
  });

  const files = await context.entities.File.findMany({
    where: { folderId: currentFolderId, userId },
    orderBy: { name: 'asc' },
  });

  // Calculate breadcrumbs
  const breadcrumbs: { id: number; name: string }[] = [];
  let tempFolderId = currentFolderId;
  while (tempFolderId) {
    const f = await context.entities.Folder.findUnique({
      where: { id: tempFolderId },
    });
    if (f && f.userId === userId) {
      breadcrumbs.unshift({ id: f.id, name: f.name });
      tempFolderId = f.parentId;
    } else {
      break;
    }
  }

  return {
    folder,
    subfolders,
    files,
    breadcrumbs,
  };
};

export const getAccessLogs = async (args: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }
  const userId = context.user.id;
  return context.entities.AccessLog.findMany({
    where: {
      file: { userId },
    },
    include: {
      file: true,
    },
    orderBy: { timestamp: 'desc' },
  });
};

export const getShareLink = async (args: { linkId: string }, context: any) => {
  const shareLink = await context.entities.ShareLink.findUnique({
    where: { id: args.linkId },
    include: { file: true },
  });

  if (!shareLink) {
    throw new HttpError(404, "Share link not found");
  }

  // Check expiration
  if (shareLink.expiresAt && new Date() > new Date(shareLink.expiresAt)) {
    throw new HttpError(410, "Share link has expired");
  }

  return {
    id: shareLink.id,
    fileId: shareLink.fileId,
    fileName: shareLink.file.name,
    isPasswordProtected: !!shareLink.password,
    expiresAt: shareLink.expiresAt,
  };
};
