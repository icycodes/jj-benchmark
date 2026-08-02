import { sanitizeAndSerializeProviderData } from "wasp/server/auth";

export const seedData = async (prisma: any) => {
  // Clean up existing transactions to prevent duplicates
  await prisma.transaction.deleteMany({});

  // Check if testuser already exists
  const existingIdentities = await prisma.authIdentity.findMany({
    where: {
      providerName: "username",
      providerUserId: "testuser",
    }
  });

  let userId: number;

  if (existingIdentities.length > 0) {
    const authId = existingIdentities[0].authId;
    const auth = await prisma.auth.findUnique({
      where: { id: authId },
      include: { user: true }
    });
    if (auth && auth.user) {
      userId = auth.user.id;
    } else {
      const user = await prisma.user.create({ data: {} });
      userId = user.id;
      await prisma.auth.update({
        where: { id: authId },
        data: { userId: userId }
      });
    }
  } else {
    const providerData = await sanitizeAndSerializeProviderData({
      hashedPassword: "password123",
    });

    const user = await prisma.user.create({
      data: {
        auth: {
          create: {
            identities: {
              create: {
                providerName: "username",
                providerUserId: "testuser",
                providerData: providerData,
              }
            }
          }
        }
      }
    });
    userId = user.id;
  }

  // Seed exactly the 4 transactions
  await prisma.transaction.createMany({
    data: [
      {
        date: new Date("2026-07-01T00:00:00.000Z"),
        amount: 5000.0,
        type: "INCOME",
        category: "Sales",
        description: "Project payment",
        userId: userId,
      },
      {
        date: new Date("2026-07-15T00:00:00.000Z"),
        amount: 1200.0,
        type: "EXPENSE",
        category: "Marketing",
        description: "Ad campaign",
        userId: userId,
      },
      {
        date: new Date("2026-07-20T00:00:00.000Z"),
        amount: 800.0,
        type: "EXPENSE",
        category: "Software",
        description: "SaaS subscriptions",
        userId: userId,
      },
      {
        date: new Date("2026-07-25T00:00:00.000Z"),
        amount: 2500.0,
        type: "INCOME",
        category: "Investment",
        description: "Dividend payout",
        userId: userId,
      },
    ]
  });

  console.log("Database seeded successfully with testuser and 4 transactions.");
};
