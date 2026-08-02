import type { DbSeedFn } from "wasp/server";
import { sanitizeAndSerializeProviderData } from "wasp/server/auth";

export const devSeedSimple: DbSeedFn = async (prisma) => {
  const username = "devuser";
  const password = "password123";

  const existing = await prisma.user.findUnique({
    where: { username },
  });

  if (existing) {
    return;
  }

  const providerData = await sanitizeAndSerializeProviderData<"username">({
    hashedPassword: password,
  });

  await prisma.user.create({
    data: {
      username,
      password: providerData,
      auth: {
        create: {
          identities: {
            create: {
              providerName: "username",
              providerUserId: username,
              providerData,
            },
          },
        },
      },
    },
  });
};
