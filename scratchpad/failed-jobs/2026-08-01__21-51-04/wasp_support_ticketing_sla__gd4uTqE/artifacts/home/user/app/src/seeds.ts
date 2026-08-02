import type { DbSeedFn } from "wasp/server";
import { sanitizeAndSerializeProviderData } from "wasp/server/auth";

export const seedData: DbSeedFn = async (prisma) => {
  const usersToSeed = [
    { username: "manager", password: "password123", role: "MANAGER" },
    { username: "agent1", password: "password123", role: "AGENT" },
    { username: "agent2", password: "password123", role: "AGENT" },
    { username: "customer1", password: "password123", role: "CUSTOMER" },
  ];

  for (const u of usersToSeed) {
    const existing = await prisma.user.findUnique({
      where: { username: u.username },
    });
    if (existing) {
      continue;
    }

    const providerDataStr = await sanitizeAndSerializeProviderData<"username">({
      hashedPassword: u.password,
    });
    const providerData = JSON.parse(providerDataStr);
    const hashedPassword = providerData.hashedPassword;

    await prisma.user.create({
      data: {
        username: u.username,
        password: hashedPassword,
        role: u.role,
        auth: {
          create: {
            identities: {
              create: {
                providerName: "username",
                providerUserId: u.username,
                providerData: providerDataStr,
              },
            },
          },
        },
      },
    });
  }
};
