import type { ApiRequestHandler } from "wasp/server/api";

export const apiRequestHandler: ApiRequestHandler = async (req, res, context) => {
  // Extract API key from Authorization header or query parameter
  let apiKeyValue = "";

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    apiKeyValue = authHeader.slice(7);
  } else if (req.query && typeof req.query.apiKey === "string") {
    apiKeyValue = req.query.apiKey;
  }

  if (!apiKeyValue) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  // Look up the API key
  const apiKey = await context.entities.ApiKey.findUnique({
    where: { key: apiKeyValue },
  });

  if (!apiKey) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  // Rate limit check: max 3 requests in the last 10 seconds
  const tenSecondsAgo = new Date(Date.now() - 10 * 1000);
  const recentLogs = await context.entities.ApiLog.findMany({
    where: {
      apiKeyId: apiKey.id,
      timestamp: {
        gte: tenSecondsAgo,
      },
    },
  });

  if (recentLogs.length >= 3) {
    await context.entities.ApiLog.create({
      data: {
        endpoint: "GET /api/request",
        status: 429,
        apiKeyId: apiKey.id,
      },
    });
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  // Quota check
  if (apiKey.usage >= apiKey.quota) {
    await context.entities.ApiLog.create({
      data: {
        endpoint: "GET /api/request",
        status: 429,
        apiKeyId: apiKey.id,
      },
    });
    return res.status(429).json({ error: "Quota exceeded" });
  }

  // Successful request
  const newUsage = apiKey.usage + 1;
  await context.entities.ApiKey.update({
    where: { id: apiKey.id },
    data: { usage: newUsage },
  });

  await context.entities.ApiLog.create({
    data: {
      endpoint: "GET /api/request",
      status: 200,
      apiKeyId: apiKey.id,
    },
  });

  return res.status(200).json({
    success: true,
    message: "Request successful",
    usage: newUsage,
    quota: apiKey.quota,
  });
};
