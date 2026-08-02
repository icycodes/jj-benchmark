import { expect, test, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { getProductsWithFilters } from "./queries";

let prisma: PrismaClient;

beforeAll(async () => {
  prisma = new PrismaClient();
});

afterAll(async () => {
  await prisma.$disconnect();
});

test("getProductsWithFilters - no filters", async () => {
  const context = {
    entities: {
      Product: prisma.product,
    },
  } as any;

  const result = await getProductsWithFilters({ limit: 10 }, context);

  expect(result.products.length).toBe(6);
  expect(result.nextCursor).toBeNull();
  
  // Facets counts
  const electronics = result.facets.categories.find(c => c.name === "Electronics");
  const homeKitchen = result.facets.categories.find(c => c.name === "Home & Kitchen");
  const furniture = result.facets.categories.find(c => c.name === "Furniture");

  expect(electronics?.count).toBe(2);
  expect(homeKitchen?.count).toBe(2);
  expect(furniture?.count).toBe(2);
});

test("getProductsWithFilters - search 'chair' and inStock: true", async () => {
  const context = {
    entities: {
      Product: prisma.product,
    },
  } as any;

  const result = await getProductsWithFilters({ search: "chair", inStock: true }, context);

  // Product 3 (Ergonomic Office Desk Chair) is out of stock.
  // Product 6 (Leather Executive Swivel Chair) is in stock.
  // So only Product 6 should match.
  expect(result.products.length).toBe(1);
  expect(result.products[0].name).toBe("Leather Executive Swivel Chair");
  
  expect(result.facets.categories).toEqual([{ name: "Furniture", count: 1 }]);
  expect(result.facets.brands).toEqual([{ name: "ErgoComfort", count: 1 }]);
});

test("getProductsWithFilters - price range and sorting", async () => {
  const context = {
    entities: {
      Product: prisma.product,
    },
  } as any;

  const result = await getProductsWithFilters({
    minPrice: 30,
    maxPrice: 150,
    sortBy: "price_desc",
  }, context);

  // Matching:
  // Product 2: 89.99 (Home & Kitchen)
  // Product 3: 149.99 (Furniture)
  // Product 4: 39.99 (Electronics)
  // Product 5: 49.99 (Home & Kitchen)
  // Sorted by price desc: Product 3 (149.99), Product 2 (89.99), Product 5 (49.99), Product 4 (39.99)
  expect(result.products.map(p => p.id)).toEqual([3, 2, 5, 4]);

  const electronics = result.facets.categories.find(c => c.name === "Electronics");
  const homeKitchen = result.facets.categories.find(c => c.name === "Home & Kitchen");
  const furniture = result.facets.categories.find(c => c.name === "Furniture");

  expect(electronics?.count).toBe(1);
  expect(homeKitchen?.count).toBe(2);
  expect(furniture?.count).toBe(1);
});

test("getProductsWithFilters - pagination using cursor", async () => {
  const context = {
    entities: {
      Product: prisma.product,
    },
  } as any;

  // Page 1
  const page1 = await getProductsWithFilters({ limit: 2 }, context);
  expect(page1.products.length).toBe(2);
  expect(page1.products.map(p => p.id)).toEqual([1, 2]);
  expect(page1.nextCursor).toBe(3);

  // Page 2
  const page2 = await getProductsWithFilters({ limit: 2, cursor: page1.nextCursor as number }, context);
  expect(page2.products.length).toBe(2);
  expect(page2.products.map(p => p.id)).toEqual([3, 4]);
  expect(page2.nextCursor).toBe(5);

  // Page 3
  const page3 = await getProductsWithFilters({ limit: 2, cursor: page2.nextCursor as number }, context);
  expect(page3.products.length).toBe(2);
  expect(page3.products.map(p => p.id)).toEqual([5, 6]);
  expect(page3.nextCursor).toBeNull();
});
