import { type DownloadFile } from "wasp/server/api";
import fs from "fs";

export const downloadFile: DownloadFile = async (req, res, context) => {
  try {
    const linkId = req.params.linkId as string;
    const password = req.query.password as string | undefined;

    const shareLink = (await context.entities.ShareLink.findUnique({
      where: { id: linkId },
      include: { file: true },
    })) as any;

    if (!shareLink) {
      res.status(404).json({ error: "Share link not found" });
      return;
    }

    // Check expiration
    if (shareLink.expiresAt && new Date() > new Date(shareLink.expiresAt)) {
      res.status(410).json({ error: "Share link has expired" });
      return;
    }

    // Check password protection
    if (shareLink.password) {
      if (!password || password !== shareLink.password) {
        res.status(403).json({ error: "Incorrect password" });
        return;
      }
    }

    const filePath = shareLink.file.path;
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "File not found on server" });
      return;
    }

    // Create AccessLog entry
    const ip = req.ip || (req.headers["x-forwarded-for"] as string) || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    await context.entities.AccessLog.create({
      data: {
        fileId: shareLink.file.id,
        ip: String(ip),
        userAgent: String(userAgent),
      },
    });

    // Serve the file
    res.setHeader("Content-Type", shareLink.file.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(shareLink.file.name)}"`);
    res.setHeader("Content-Length", shareLink.file.size);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error: any) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
