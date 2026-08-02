import type { MiddlewareConfigFn } from "wasp/server";
import type { Request, Response } from "express";
import multer from "multer";
import fs from "fs";

const uploadDir = "/home/user/app/uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

export const configureFileUploadMiddleware: MiddlewareConfigFn = (config) => {
  config.set("multer", upload.single("file"));
  return config;
};

export const uploadFile = async (req: Request, res: Response, context: any) => {
  if (!context.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const file = (req as any).file;
  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const folderIdStr = req.body.folderId;
  const folderId = folderIdStr ? parseInt(folderIdStr, 10) : null;

  try {
    const newFile = await context.entities.File.create({
      data: {
        name: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        path: file.path,
        folderId: folderId,
        userId: context.user.id,
      },
    });

    return res.json(newFile);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const downloadFile = async (req: Request, res: Response, context: any) => {
  const { linkId } = req.params;
  const password = req.query.password as string | undefined;

  try {
    const shareLink = await context.entities.ShareLink.findUnique({
      where: { id: linkId },
      include: {
        file: true,
      },
    });

    if (!shareLink) {
      return res.status(404).send("Share link not found");
    }

    // Verify expiration
    if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
      return res.status(410).send("Share link has expired");
    }

    // Verify password
    if (shareLink.password && shareLink.password !== password) {
      return res.status(403).send("Forbidden: Incorrect password");
    }

    // Check if file exists on disk
    const filePath = shareLink.file.path;
    if (!fs.existsSync(filePath)) {
      return res.status(404).send("File not found on server");
    }

    // Create AccessLog entry
    const ipAddress = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    await context.entities.AccessLog.create({
      data: {
        ipAddress,
        userAgent,
        shareLinkId: shareLink.id,
      },
    });

    // Serve file with correct headers
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(shareLink.file.name)}"`);
    res.setHeader("Content-Type", shareLink.file.mimeType);
    res.setHeader("Content-Length", shareLink.file.size);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err: any) {
    return res.status(500).send(err.message);
  }
};
