import {
  createProviderId,
  createUser,
  sanitizeAndSerializeProviderData,
} from "wasp/server/auth";

export const seedData = async (prismaClient: any) => {
  try {
    // Check if testuser already exists
    const existingIdentity = await prismaClient.authIdentity.findFirst({
      where: { providerUserId: "testuser" },
    });

    if (existingIdentity) {
      console.log("Test user already exists. Skipping seeding.");
      return;
    }

    // Create user using Wasp's helper
    const providerId = createProviderId("username", "testuser");
    const providerData = await sanitizeAndSerializeProviderData({
      hashedPassword: "password123",
    });

    const user = await createUser(providerId, providerData, {});

    // Seed exactly the 4 transactions for this user
    await prismaClient.transaction.createMany({
      data: [
        {
          date: new Date("2026-07-01T00:00:00.000Z"),
          amount: 5000.0,
          type: "INCOME",
          category: "Sales",
          description: "Project payment",
          userId: user.id,
        },
        {
          date: new Date("2026-07-15T00:00:00.000Z"),
          amount: 1200.0,
          type: "EXPENSE",
          category: "Marketing",
          description: "Ad campaign",
          userId: user.id,
        },
        {
          date: new Date("2026-07-20T00:00:00.000Z"),
          amount: 800.0,
          type: "EXPENSE",
          category: "Software",
          description: "SaaS subscriptions",
          userId: user.id,
        },
        {
          date: new Date("2026-07-25T00:00:00.000Z"),
          amount: 2500.0,
          type: "INCOME",
          category: "Investment",
          description: "Dividend payout",
          userId: user.id,
        },
      ],
    });

    console.log("Seeding completed successfully.");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
};
