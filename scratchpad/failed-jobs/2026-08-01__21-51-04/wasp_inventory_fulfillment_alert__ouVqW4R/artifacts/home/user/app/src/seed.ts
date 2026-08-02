import {
  createProviderId,
  createUser,
  sanitizeAndSerializeProviderData,
} from "wasp/server/auth";

export const seedData = async (prisma: any) => {
  console.log("Seeding database...");

  // 1. Clear existing data to ensure exact seed state
  // Delete in reverse order of dependencies
  await prisma.alert.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.authIdentity.deleteMany({});
  await prisma.auth.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create the test user
  const username = "warehouse_manager";
  const password = "password123";
  const providerId = createProviderId("username", username);
  const providerData = await sanitizeAndSerializeProviderData<"username">({
    hashedPassword: password,
  });

  console.log("Creating user...");
  await createUser(providerId, providerData, {
    username,
    password, // Store as requested by User model
  });

  // 3. Seed exactly the 2 Suppliers
  console.log("Creating suppliers...");
  const s1 = await prisma.supplier.create({
    data: {
      id: 1,
      name: "Global Tech Distributors",
      email: "supply@globaltech.com",
    },
  });

  const s2 = await prisma.supplier.create({
    data: {
      id: 2,
      name: "Apex Logistics",
      email: "orders@apexlogistics.com",
    },
  });

  // 4. Seed exactly the 2 Products
  console.log("Creating products...");
  const p1 = await prisma.product.create({
    data: {
      id: 1,
      sku: "PROD-001",
      name: "Wireless Mouse",
      stock: 15,
      lowStockThreshold: 10,
      reorderQuantity: 50,
      supplierId: s1.id,
    },
  });

  const p2 = await prisma.product.create({
    data: {
      id: 2,
      sku: "PROD-002",
      name: "Mechanical Keyboard",
      stock: 8,
      lowStockThreshold: 5,
      reorderQuantity: 20,
      supplierId: s2.id,
    },
  });

  // 5. Seed exactly the 2 Customer Orders
  console.log("Creating customer orders...");
  // Order 1
  await prisma.order.create({
    data: {
      id: 1,
      customerName: "TechCorp Solutions",
      status: "PENDING",
      orderItems: {
        create: [
          { productId: p1.id, quantity: 8 },
          { productId: p2.id, quantity: 2 },
        ],
      },
    },
  });

  // Order 2
  await prisma.order.create({
    data: {
      id: 2,
      customerName: "RetailHub",
      status: "PENDING",
      orderItems: {
        create: [
          { productId: p1.id, quantity: 10 },
          { productId: p2.id, quantity: 2 },
        ],
      },
    },
  });

  console.log("Database seeded successfully!");
};
