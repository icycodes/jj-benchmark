import { sanitizeAndSerializeProviderData } from 'wasp/server/auth';

export const devSeedSimple = async (prisma: any) => {
  const providerData = await sanitizeAndSerializeProviderData({
    hashedPassword: 'password123',
  });

  const existingUser = await prisma.user.findUnique({
    where: { username: 'devuser' }
  });

  if (!existingUser) {
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
  }
};
