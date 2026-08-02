import { prisma } from "wasp/server";
import { devSeed } from "./seeds.js";

export const serverSetup = async () => {
  console.log("Running server setup and checking if database needs seeding...");
  try {
    const count = await prisma.product.count();
    if (count === 0) {
      console.log("Database is empty, seeding default products...");
      await devSeed(prisma);
      console.log("Database seeded successfully!");
    } else {
      console.log(`Database already has ${count} products. Skipping seeding.`);
    }
  } catch (error) {
    console.error("Error during server setup seeding:", error);
  }
};
