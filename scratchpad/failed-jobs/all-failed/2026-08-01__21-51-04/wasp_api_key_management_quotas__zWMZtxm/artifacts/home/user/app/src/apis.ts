export const apiRequestHandler = async (req: any, res: any, context: any) => {
  let extractedKey: string | null = null;
  const authHeader = req.headers.authorization;

  if (authHeader && typeof authHeader === 'string') {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      extractedKey = parts[1];
    }
  }

  if (!extractedKey && req.query.apiKey && typeof req.query.apiKey === 'string') {
    extractedKey = req.query.apiKey;
  }

  if (!extractedKey) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  const apiKey = await context.entities.ApiKey.findUnique({
    where: { key: extractedKey },
  });

  if (!apiKey) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  // 1. Rate Limit Check (rolling rate limit of max 3 requests in the last 10 seconds)
  const tenSecondsAgo = new Date(Date.now() - 10000);
  const recentLogsCount = await context.entities.ApiLog.count({
    where: {
      apiKeyId: apiKey.id,
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
        apiKeyId: apiKey.id,
      },
    });
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  // 2. Quota Check (lifetime usage quota)
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

  // 3. Successful Request
  const updatedApiKey = await context.entities.ApiKey.update({
    where: { id: apiKey.id },
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
      apiKeyId: apiKey.id,
    },
  });

  return res.status(200).json({
    success: true,
    message: "Request successful",
    usage: updatedApiKey.usage,
    quota: apiKey.quota,
  });
};
