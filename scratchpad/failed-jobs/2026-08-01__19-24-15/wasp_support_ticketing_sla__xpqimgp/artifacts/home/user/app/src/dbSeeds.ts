import type { DbSeedFn } from "wasp/server";
import { sanitizeAndSerializeProviderData } from "wasp/server/auth";
import type { PrismaClient } from "wasp/server";

export const seedData: DbSeedFn = async (prisma) => {
  // Clear existing data to make seeding clean and repeatable
  await prisma.ticket.deleteMany({});
  await prisma.user.deleteMany({});

  await createUser(prisma, { username: "manager", password: "password123", role: "MANAGER" });
  await createUser(prisma, { username: "agent1", password: "password123", role: "AGENT" });
  await createUser(prisma, { username: "agent2", password: "password123", role: "AGENT" });
  await createUser(prisma, { username: "customer1", password: "password123", role: "CUSTOMER" });
};

async function createUser(
  prisma: PrismaClient,
  data: { username: string, password: string, role: string }
) {
  const hashedPassword = await sanitizeAndSerializeProviderData<"username">({ hashedPassword: data.password });
  const newUser = await prisma.user.create({
    data: {
      username: data.username,
      password: data.password,
      role: data.role,
      auth: {
        create: {
          identities: {
            create: {
              providerName: "username",
              providerUserId: data.username,
              providerData: hashedPassword,
            },
          },
        },
      },
    },
  });
  return newUser;
}
