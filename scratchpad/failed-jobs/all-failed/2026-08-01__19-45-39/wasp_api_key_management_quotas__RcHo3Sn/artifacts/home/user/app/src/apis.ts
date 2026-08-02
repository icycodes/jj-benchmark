import type { ApiRequestHandler } from "wasp/server/api";

const ENDPOINT_LABEL = "GET /api/request";
const RATE_LIMIT_WINDOW_MS = 10 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 3;

function extractApiKey(req: Parameters<ApiRequestHandler>[0]): string | null {
  const authHeader = req.headers["authorization"];
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    if (token.length > 0) {
      return token;
    }
  }

  const queryKey = req.query["apiKey"];
  if (typeof queryKey === "string" && queryKey.length > 0) {
    return queryKey;
  }

  return null;
}

export const apiRequestHandler: ApiRequestHandler = async (
  req,
  res,
  context,
) => {
  res.set("Access-Control-Allow-Origin", "*");

  const providedKey = extractApiKey(req);

  if (!providedKey) {
    res.status(401).json({ error: "Invalid API key" });
    return;
  }

  const apiKey = await context.entities.ApiKey.findUnique({
    where: { key: providedKey },
  });

  if (!apiKey) {
    res.status(401).json({ error: "Invalid API key" });
    return;
  }

  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const recentRequestCount = await context.entities.ApiLog.count({
    where: {
      apiKeyId: apiKey.id,
      timestamp: { gte: windowStart },
    },
  });

  if (recentRequestCount >= RATE_LIMIT_MAX_REQUESTS) {
    await context.entities.ApiLog.create({
      data: {
        endpoint: ENDPOINT_LABEL,
        status: 429,
        apiKeyId: apiKey.id,
      },
    });
    res.status(429).json({ error: "Rate limit exceeded" });
    return;
  }

  if (apiKey.usage >= apiKey.quota) {
    await context.entities.ApiLog.create({
      data: {
        endpoint: ENDPOINT_LABEL,
        status: 429,
        apiKeyId: apiKey.id,
      },
    });
    res.status(429).json({ error: "Quota exceeded" });
    return;
  }

  const updatedApiKey = await context.entities.ApiKey.update({
    where: { id: apiKey.id },
    data: { usage: { increment: 1 } },
  });

  await context.entities.ApiLog.create({
    data: {
      endpoint: ENDPOINT_LABEL,
      status: 200,
      apiKeyId: apiKey.id,
    },
  });

  res.status(200).json({
    success: true,
    message: "Request successful",
    usage: updatedApiKey.usage,
    quota: updatedApiKey.quota,
  });
};
