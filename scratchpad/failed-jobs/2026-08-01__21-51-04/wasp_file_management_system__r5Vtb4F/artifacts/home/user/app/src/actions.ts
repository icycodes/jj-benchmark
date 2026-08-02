import { HttpError } from "wasp/server";
import fs from "fs";
import path from "path";

// Read run-id from /logs/artifacts/run-id
let runId = "zrp1u38kyk";
try {
  runId = fs.readFileSync("/logs/artifacts/run-id", "utf-8").trim();
} catch (e) {
  // fallback
}

export const createFolder = async (args: { name: string; parentId?: number | string | null }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  let finalName = args.name;
  if (!finalName.endsWith(`-${runId}`)) {
    finalName = `${finalName}-${runId}`;
  }

  const parentId = args.parentId ? Number(args.parentId) : null;

  return context.entities.Folder.create({
    data: {
      name: finalName,
      parentId,
      userId: context.user.id,
    },
  });
};

export const uploadFile = async (
  args: {
    name: string;
    mimeType: string;
    size: number;
    base64Data: string;
    folderId?: number | string | null;
  },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const uploadDir = "/home/user/app/uploads/";
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const buffer = Buffer.from(args.base64Data, "base64");
  const uniqueName = `${Date.now()}-${args.name}`;
  const filePath = path.join(uploadDir, uniqueName);

  fs.writeFileSync(filePath, buffer);

  const folderId = args.folderId ? Number(args.folderId) : null;

  return context.entities.File.create({
    data: {
      name: args.name,
      path: filePath,
      mimeType: args.mimeType,
      size: args.size,
      folderId,
      userId: context.user.id,
    },
  });
};

export const createShareLink = async (
  args: {
    fileId: number | string;
    password?: string | null;
    expiresMinutes?: number | string | null;
  },
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const fileId = Number(args.fileId);

  const file = await context.entities.File.findFirst({
    where: { id: fileId, userId: context.user.id },
  });

  if (!file) {
    throw new HttpError(404, "File not found");
  }

  let expiresAt: Date | null = null;
  if (args.expiresMinutes) {
    expiresAt = new Date(Date.now() + Number(args.expiresMinutes) * 60 * 1000);
  }

  return context.entities.ShareLink.create({
    data: {
      fileId,
      password: args.password || null,
      expiresAt,
    },
  });
};
