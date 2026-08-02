import { sanitizeAndSerializeProviderData } from 'wasp/server/auth';

export const devSeedSimple = async (prisma: any) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      username: 'devuser'
    }
  });

  if (existingUser) {
    return;
  }

  const providerData = await sanitizeAndSerializeProviderData({
    hashedPassword: 'password123'
  });

  await prisma.user.create({
    data: {
      username: 'devuser',
      password: 'password123',
      auth: {
        create: {
          identities: {
            create: {
              providerName: 'username',
              providerUserId: 'devuser',
              providerData: providerData,
            },
          },
        },
      },
    },
  });
};
