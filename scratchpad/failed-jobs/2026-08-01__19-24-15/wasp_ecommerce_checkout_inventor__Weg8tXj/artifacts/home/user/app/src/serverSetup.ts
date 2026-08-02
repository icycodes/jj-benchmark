import { prisma } from "wasp/server";

export const serverSetup = async () => {
  console.log("Running serverSetup...");

  // Seed Products
  const premiumHeadphones = await prisma.product.findFirst({
    where: { name: "Premium Wireless Headphones" },
  });
  if (!premiumHeadphones) {
    await prisma.product.create({
      data: {
        name: "Premium Wireless Headphones",
        price: 100.00,
        inventory: 10,
      },
    });
    console.log("Seeded: Premium Wireless Headphones");
  }

  const mechanicalKeyboard = await prisma.product.findFirst({
    where: { name: "Ergonomic Mechanical Keyboard" },
  });
  if (!mechanicalKeyboard) {
    await prisma.product.create({
      data: {
        name: "Ergonomic Mechanical Keyboard",
        price: 150.00,
        inventory: 1,
      },
    });
    console.log("Seeded: Ergonomic Mechanical Keyboard");
  }

  // Seed Coupons
  const save20 = await prisma.coupon.findUnique({
    where: { code: "SAVE20" },
  });
  if (!save20) {
    await prisma.coupon.create({
      data: {
        code: "SAVE20",
        type: "PERCENT",
        value: 20,
      },
    });
    console.log("Seeded: SAVE20 Coupon");
  }

  const flat50 = await prisma.coupon.findUnique({
    where: { code: "FLAT50" },
  });
  if (!flat50) {
    await prisma.coupon.create({
      data: {
        code: "FLAT50",
        type: "FLAT",
        value: 50,
      },
    });
    console.log("Seeded: FLAT50 Coupon");
  }

  console.log("serverSetup completed successfully.");
};
