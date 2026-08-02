export default async function devSeed(prisma: any) {
  await prisma.product.upsert({
    where: { id: 1 },
    update: { name: "Premium Wireless Headphones", price: 100.0, inventory: 10 },
    create: { id: 1, name: "Premium Wireless Headphones", price: 100.0, inventory: 10 }
  });

  await prisma.product.upsert({
    where: { id: 2 },
    update: { name: "Ergonomic Mechanical Keyboard", price: 150.0, inventory: 1 },
    create: { id: 2, name: "Ergonomic Mechanical Keyboard", price: 150.0, inventory: 1 }
  });

  await prisma.coupon.upsert({
    where: { code: "SAVE20" },
    update: { type: "PERCENT", value: 20.0 },
    create: { code: "SAVE20", type: "PERCENT", value: 20.0 }
  });

  await prisma.coupon.upsert({
    where: { code: "FLAT50" },
    update: { type: "FLAT", value: 50.0 },
    create: { code: "FLAT50", type: "FLAT", value: 50.0 }
  });

  console.log("Database seeded successfully!");
}
