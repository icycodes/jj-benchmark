import type { DbSeedFn } from "wasp/server";
import { sanitizeAndSerializeProviderData } from "wasp/server/auth";

export const devSeedSimple: DbSeedFn = async (prisma) => {
  const user = await prisma.user.create({
    data: {
      username: "devuser",
      password: "password123",
    },
  });

  const serializedData = await sanitizeAndSerializeProviderData({
    hashedPassword: "password123",
  });

  const auth = await prisma.auth.create({
    data: {
      userId: user.id,
    },
  });

  await prisma.authIdentity.create({
    data: {
      providerName: "username",
      providerUserId: "devuser",
      providerData: serializedData,
      authId: auth.id,
    },
  });
};
