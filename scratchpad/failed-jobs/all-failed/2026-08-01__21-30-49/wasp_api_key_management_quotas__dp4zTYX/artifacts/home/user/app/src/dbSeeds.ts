import { sanitizeAndSerializeProviderData } from "wasp/server/auth";

export const devSeedSimple = async (prisma: any) => {
  const username = "devuser";
  const password = "password123";

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    console.log("Seed user already exists");
    return;
  }

  await prisma.user.create({
    data: {
      username,
      password,
      auth: {
        create: {
          identities: {
            create: {
              providerName: "username",
              providerUserId: username,
              providerData: await sanitizeAndSerializeProviderData({
                hashedPassword: password,
              }),
            },
          },
        },
      },
    },
  });

  console.log("Database seeded with user: devuser");
};
