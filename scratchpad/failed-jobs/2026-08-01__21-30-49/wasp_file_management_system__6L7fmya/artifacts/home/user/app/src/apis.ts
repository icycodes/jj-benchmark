import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const UPLOADS_DIR = "/home/user/app/uploads/";

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${crypto.randomUUID()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage }).single("file");

export const uploadFile = (req: any, res: any, context: any) => {
  if (!context.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = context.user.id;

  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to upload file" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const folderId = req.body.folderId ? Number(req.body.folderId) : null;

    if (folderId) {
      const folder = await context.entities.Folder.findUnique({
        where: { id: folderId, userId },
      });
      if (!folder) {
        return res.status(400).json({ error: "Folder not found" });
      }
    }

    const fileRecord = await context.entities.File.create({
      data: {
        name: req.file.originalname,
        filePath: req.file.path,
        folderId,
        userId,
      },
    });

    return res.json(fileRecord);
  });
};

export const downloadFile = async (req: any, res: any, context: any) => {
  const { linkId } = req.params;
  const password = req.query.password || null;

  const shareLink = await context.entities.ShareLink.findUnique({
    where: { id: linkId },
    include: {
      file: true,
    },
  });

  if (!shareLink) {
    return res.status(404).json({ error: "Sharing link not found" });
  }

  if (shareLink.expiresAt && new Date() > new Date(shareLink.expiresAt)) {
    return res.status(410).json({ error: "Sharing link has expired" });
  }

  if (shareLink.password && shareLink.password !== password) {
    return res.status(403).json({ error: "Incorrect password" });
  }

  const { file } = shareLink;
  if (!fs.existsSync(file.filePath)) {
    return res.status(404).json({ error: "File not found on server" });
  }

  const ipAddress = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const userAgent = req.headers["user-agent"] || "unknown";

  await context.entities.AccessLog.create({
    data: {
      shareLinkId: shareLink.id,
      ipAddress: String(ipAddress),
      userAgent: String(userAgent),
    },
  });

  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(file.name)}"`);
  res.sendFile(file.filePath);
};
