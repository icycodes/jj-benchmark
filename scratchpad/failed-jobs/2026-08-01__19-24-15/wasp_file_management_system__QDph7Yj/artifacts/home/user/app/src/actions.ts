import { type CreateFolder, type CreateShareLink, type UploadFileMetadata } from "wasp/server/operations";

const runId = "zrula60lhl";

export const createFolder: CreateFolder<{ name: string; parentId: number | null }, any> = async (args, context) => {
  if (!context.user) {
    throw new Error("Unauthorized");
  }

  let folderName = args.name;
  if (!folderName.endsWith(`-${runId}`)) {
    folderName = `${folderName}-${runId}`;
  }

  const newFolder = await context.entities.Folder.create({
    data: {
      name: folderName,
      parentId: args.parentId,
      userId: context.user.id,
    },
  });

  return newFolder;
};

export const createShareLink: CreateShareLink<
  { fileId: number; password?: string; expiresMinutes?: number },
  any
> = async (args, context) => {
  if (!context.user) {
    throw new Error("Unauthorized");
  }

  const file = await context.entities.File.findFirst({
    where: {
      id: args.fileId,
      userId: context.user.id,
    },
  });

  if (!file) {
    throw new Error("File not found or access denied");
  }

  let expiresAt: Date | null = null;
  if (args.expiresMinutes && args.expiresMinutes > 0) {
    expiresAt = new Date(Date.now() + args.expiresMinutes * 60 * 1000);
  }

  const shareLink = await context.entities.ShareLink.create({
    data: {
      password: args.password || null,
      expiresAt,
      fileId: args.fileId,
    },
  });

  return shareLink;
};

export const uploadFileMetadata: UploadFileMetadata<any, any> = async (args, context) => {
  return { success: true };
};
