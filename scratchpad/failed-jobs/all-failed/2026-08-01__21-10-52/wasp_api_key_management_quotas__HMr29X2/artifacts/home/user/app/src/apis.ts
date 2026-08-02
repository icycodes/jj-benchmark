export const apiRequestHandler = async (req: any, res: any, context: any) => {
  let apiKey: string | undefined;
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    apiKey = authHeader.substring(7).trim();
  }
  
  if (!apiKey && req.query && typeof req.query.apiKey === 'string') {
    apiKey = req.query.apiKey.trim();
  }

  if (!apiKey) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  const keyRecord = await context.entities.ApiKey.findUnique({
    where: { key: apiKey },
  });

  if (!keyRecord) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  // Rate Limit Check: Enforce a rolling rate limit of maximum 3 requests within the last 10 seconds per API key.
  const tenSecondsAgo = new Date(Date.now() - 10000);
  const logCount = await context.entities.ApiLog.count({
    where: {
      apiKeyId: keyRecord.id,
      timestamp: {
        gte: tenSecondsAgo,
      },
    },
  });

  if (logCount >= 3) {
    await context.entities.ApiLog.create({
      data: {
        endpoint: "GET /api/request",
        status: 429,
        apiKeyId: keyRecord.id,
      },
    });
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  // Quota Check: Enforce the lifetime usage quota.
  if (keyRecord.usage >= keyRecord.quota) {
    await context.entities.ApiLog.create({
      data: {
        endpoint: "GET /api/request",
        status: 429,
        apiKeyId: keyRecord.id,
      },
    });
    return res.status(429).json({ error: "Quota exceeded" });
  }

  // Successful Request:
  const updatedKey = await context.entities.ApiKey.update({
    where: { id: keyRecord.id },
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
      apiKeyId: keyRecord.id,
    },
  });

  return res.status(200).json({
    success: true,
    message: "Request successful",
    usage: updatedKey.usage,
    quota: keyRecord.quota,
  });
};
