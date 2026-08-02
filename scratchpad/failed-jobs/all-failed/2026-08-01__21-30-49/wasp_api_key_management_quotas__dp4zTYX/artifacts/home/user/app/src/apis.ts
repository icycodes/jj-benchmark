import { Request, Response } from "express";

export const apiRequestHandler = async (req: Request, res: Response, context: any) => {
  let apiKeyString = "";
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    apiKeyString = authHeader.substring(7);
  } else if (req.query.apiKey) {
    apiKeyString = req.query.apiKey as string;
  }

  if (!apiKeyString) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  // Find the API key in the database
  const apiKeyRecord = await context.entities.ApiKey.findUnique({
    where: { key: apiKeyString },
  });

  if (!apiKeyRecord) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  // Rate Limit Check: Rolling rate limit of maximum 3 requests within the last 10 seconds per API key
  const tenSecondsAgo = new Date(Date.now() - 10 * 1000);
  const recentLogsCount = await context.entities.ApiLog.count({
    where: {
      apiKeyId: apiKeyRecord.id,
      timestamp: {
        gte: tenSecondsAgo,
      },
    },
  });

  if (recentLogsCount >= 3) {
    await context.entities.ApiLog.create({
      data: {
        endpoint: "GET /api/request",
        status: 429,
        apiKeyId: apiKeyRecord.id,
      },
    });
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  // Quota Check: Enforce the lifetime usage quota
  if (apiKeyRecord.usage >= apiKeyRecord.quota) {
    await context.entities.ApiLog.create({
      data: {
        endpoint: "GET /api/request",
        status: 429,
        apiKeyId: apiKeyRecord.id,
      },
    });
    return res.status(429).json({ error: "Quota exceeded" });
  }

  // Successful Request
  const updatedKey = await context.entities.ApiKey.update({
    where: { id: apiKeyRecord.id },
    data: {
      usage: {
        increment: 1,
      },
    },
  });

  await context.entities.ApiLog.create({
    data: {
      endpoint: "GET /api/request",
      status: 200,
      apiKeyId: apiKeyRecord.id,
    },
  });

  return res.status(200).json({
    success: true,
    message: "Request successful",
    usage: updatedKey.usage,
    quota: updatedKey.quota,
  });
};
