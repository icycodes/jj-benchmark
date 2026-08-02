import { type Product } from "wasp/entities";
import { type GetProductsWithFilters } from "wasp/server/operations";

function formatSearchQuery(search: string | undefined): string | undefined {
  if (!search) return undefined;
  // Keep only alphanumeric characters and spaces
  const sanitized = search.replace(/[^a-zA-Z0-9\s]/g, " ").trim();
  if (!sanitized) return undefined;
  // Split by whitespace and join with '&'
  return sanitized.split(/\s+/).join(" & ");
}

export const getProductsWithFilters: GetProductsWithFilters<{
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'rating_desc' | 'createdAt_desc';
  limit?: number;
  cursor?: number;
}, {
  products: Product[];
  nextCursor: number | null;
  facets: {
    categories: { name: string; count: number }[];
    brands: { name: string; count: number }[];
  };
}> = async (args, context) => {
  const {
    search,
    category,
    brand,
    minPrice,
    maxPrice,
    inStock,
    sortBy,
    limit,
    cursor,
  } = args;

  const where: any = {};

  // 1. Full-text search
  const searchQuery = formatSearchQuery(search);
  if (searchQuery) {
    where.OR = [
      { name: { search: searchQuery } },
      { description: { search: searchQuery } },
    ];
  }

  // 2. Category
  if (category && category !== 'All' && category !== '') {
    where.category = category;
  }

  // 3. Brand
  if (brand && brand !== 'All' && brand !== '') {
    where.brand = brand;
  }

  // 4. Price range
  if (minPrice !== undefined && minPrice !== null && !isNaN(minPrice)) {
    where.price = {
      ...where.price,
      gte: Number(minPrice),
    };
  }
  if (maxPrice !== undefined && maxPrice !== null && !isNaN(maxPrice)) {
    where.price = {
      ...where.price,
      lte: Number(maxPrice),
    };
  }

  // 5. In Stock
  if (inStock === true) {
    where.inStock = true;
  }

  // Calculate facets counts matching current search and filters
  const allMatchingProducts = await context.entities.Product.findMany({
    where,
    select: {
      category: true,
      brand: true,
    },
  });

  const categoryCounts: Record<string, number> = {};
  const brandCounts: Record<string, number> = {};

  for (const p of allMatchingProducts) {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
  }

  const categoriesFacet = Object.entries(categoryCounts).map(([name, count]) => ({
    name,
    count,
  }));

  const brandsFacet = Object.entries(brandCounts).map(([name, count]) => ({
    name,
    count,
  }));

  // Pagination and sorting
  const limitVal = limit ?? 10;
  const prismaQuery: any = {
    where,
    take: limitVal + 1,
  };

  if (cursor) {
    prismaQuery.cursor = { id: cursor };
  }

  // Sorting
  if (sortBy === 'price_asc') {
    prismaQuery.orderBy = [
      { price: 'asc' },
      { id: 'asc' },
    ];
  } else if (sortBy === 'price_desc') {
    prismaQuery.orderBy = [
      { price: 'desc' },
      { id: 'asc' },
    ];
  } else if (sortBy === 'rating_desc') {
    prismaQuery.orderBy = [
      { rating: 'desc' },
      { id: 'asc' },
    ];
  } else if (sortBy === 'createdAt_desc') {
    prismaQuery.orderBy = [
      { createdAt: 'desc' },
      { id: 'asc' },
    ];
  } else {
    prismaQuery.orderBy = { id: 'asc' };
  }

  const products = await context.entities.Product.findMany(prismaQuery);

  let nextCursor: number | null = null;
  if (products.length > limitVal) {
    const nextProduct = products[products.length - 1];
    nextCursor = nextProduct.id;
    products.pop();
  }

  return {
    products,
    nextCursor,
    facets: {
      categories: categoriesFacet,
      brands: brandsFacet,
    },
  };
};
