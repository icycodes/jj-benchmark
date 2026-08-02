import { HttpError } from "wasp/server";
import { RUN_ID } from "./config";

export const createFolder = async (
  args: { name: string; parentId?: number | null },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }
  const userId = context.user.id;

  if (!args.name || !args.name.trim()) {
    throw new HttpError(400, "Folder name is required");
  }

  let folderName = args.name.trim();
  if (!folderName.endsWith(`-${RUN_ID}`)) {
    folderName = `${folderName}-${RUN_ID}`;
  }

  const parentId = args.parentId ? Number(args.parentId) : null;

  // If parentId is specified, ensure it exists and belongs to the user
  if (parentId) {
    const parentFolder = await context.entities.Folder.findUnique({
      where: { id: parentId, userId },
    });
    if (!parentFolder) {
      throw new HttpError(400, "Parent folder not found");
    }
  }

  const newFolder = await context.entities.Folder.create({
    data: {
      name: folderName,
      parentId,
      userId,
    },
  });

  return newFolder;
};

export const createShareLink = async (
  args: { fileId: number; password?: string; expiresInMinutes?: number },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }
  const userId = context.user.id;

  const file = await context.entities.File.findUnique({
    where: { id: Number(args.fileId), userId },
  });

  if (!file) {
    throw new HttpError(404, "File not found");
  }

  let expiresAt: Date | null = null;
  if (args.expiresInMinutes && args.expiresInMinutes > 0) {
    expiresAt = new Date(Date.now() + args.expiresInMinutes * 60 * 1000);
  }

  const shareLink = await context.entities.ShareLink.create({
    data: {
      fileId: file.id,
      password: args.password || null,
      expiresAt,
    },
  });

  return shareLink;
};
