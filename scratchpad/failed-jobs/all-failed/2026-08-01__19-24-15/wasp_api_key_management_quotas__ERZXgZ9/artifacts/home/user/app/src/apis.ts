import type { ApiRequestHandler } from 'wasp/server/api';

export const apiRequestHandler: ApiRequestHandler = async (req, res, context) => {
  let apiKeyString = '';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    apiKeyString = authHeader.substring(7);
  } else if (req.query.apiKey) {
    apiKeyString = req.query.apiKey as string;
  }

  if (!apiKeyString) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const apiKey = await context.entities.ApiKey.findUnique({
    where: { key: apiKeyString },
  });

  if (!apiKey) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // Rate Limit Check
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
        endpoint: 'GET /api/request',
        status: 429,
        apiKeyId: apiKey.id,
      },
    });
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  // Quota Check
  if (apiKey.usage >= apiKey.quota) {
    await context.entities.ApiLog.create({
      data: {
        endpoint: 'GET /api/request',
        status: 429,
        apiKeyId: apiKey.id,
      },
    });
    return res.status(429).json({ error: 'Quota exceeded' });
  }

  // Successful Request
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
      endpoint: 'GET /api/request',
      status: 200,
      apiKeyId: apiKey.id,
    },
  });

  return res.status(200).json({
    success: true,
    message: 'Request successful',
    usage: updatedApiKey.usage,
    quota: updatedApiKey.quota,
  });
};
