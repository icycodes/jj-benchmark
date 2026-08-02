import { createProviderId, sanitizeAndSerializeProviderData, createUser } from 'wasp/server/auth';
import type { PrismaClient } from '@prisma/client';

export const seedData = async (prisma: PrismaClient) => {
  // First, let's delete existing data to avoid conflicts
  await prisma.ticket.deleteMany({});
  await prisma.user.deleteMany({});

  const usersToSeed = [
    { username: 'manager', password: 'password123', role: 'MANAGER' },
    { username: 'agent1', password: 'password123', role: 'AGENT' },
    { username: 'agent2', password: 'password123', role: 'AGENT' },
    { username: 'customer1', password: 'password123', role: 'CUSTOMER' },
  ];

  for (const user of usersToSeed) {
    const providerId = createProviderId('username', user.username);
    const providerData = await sanitizeAndSerializeProviderData({
      hashedPassword: user.password,
    });
    await createUser(
      providerId,
      providerData,
      {
        role: user.role,
      }
    );
  }
};
