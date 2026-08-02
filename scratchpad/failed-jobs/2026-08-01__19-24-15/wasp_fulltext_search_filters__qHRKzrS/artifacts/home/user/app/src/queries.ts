import { type Product } from "@prisma/client";

type GetProductsWithFiltersInput = {
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'rating_desc' | 'createdAt_desc';
  limit?: number;
  cursor?: number;
};

type GetProductsWithFiltersOutput = {
  products: Product[];
  nextCursor: number | null;
  facets: {
    categories: { name: string; count: number }[];
    brands: { name: string; count: number }[];
  };
};

export const getProductsWithFilters = async (
  args: GetProductsWithFiltersInput,
  context: any
): Promise<GetProductsWithFiltersOutput> => {
  const {
    search,
    category,
    brand,
    minPrice,
    maxPrice,
    inStock,
    sortBy,
    limit = 10,
    cursor,
  } = args;

  const prisma = context.entities.Product;

  // Build where clause
  const buildWhere = (useFullText: boolean) => {
    const where: any = {};

    if (category) {
      where.category = category;
    }
    if (brand) {
      where.brand = brand;
    }
    if (minPrice !== undefined && minPrice !== null) {
      where.price = { ...where.price, gte: minPrice };
    }
    if (maxPrice !== undefined && maxPrice !== null) {
      where.price = { ...where.price, lte: maxPrice };
    }
    if (inStock) {
      where.inStock = true;
    }

    if (search) {
      if (useFullText) {
        const searchTerms = search.trim().split(/\s+/).filter(Boolean).join(" & ");
        if (searchTerms) {
          where.OR = [
            { name: { search: searchTerms } },
            { description: { search: searchTerms } },
          ];
        }
      } else {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }
    }

    return where;
  };

  // Determine ordering
  let orderBy: any = [];
  if (sortBy === "price_asc") {
    orderBy = [{ price: "asc" }, { id: "asc" }];
  } else if (sortBy === "price_desc") {
    orderBy = [{ price: "desc" }, { id: "asc" }];
  } else if (sortBy === "rating_desc") {
    orderBy = [{ rating: "desc" }, { id: "asc" }];
  } else if (sortBy === "createdAt_desc") {
    orderBy = [{ createdAt: "desc" }, { id: "asc" }];
  } else {
    orderBy = [{ id: "asc" }];
  }

  let productsResult: Product[] = [];
  let allMatchingProducts: { category: string; brand: string }[] = [];
  let success = false;

  // Try PostgreSQL Full-Text Search
  try {
    const where = buildWhere(true);
    productsResult = await prisma.findMany({
      where,
      orderBy,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
    });

    allMatchingProducts = await prisma.findMany({
      where,
      select: {
        category: true,
        brand: true,
      },
    });
    success = true;
  } catch (error) {
    console.warn("PostgreSQL full-text search failed, falling back to contains search:", error);
  }

  // Fallback to contains search if full-text search fails or is unsupported
  if (!success) {
    const where = buildWhere(false);
    productsResult = await prisma.findMany({
      where,
      orderBy,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
    });

    allMatchingProducts = await prisma.findMany({
      where,
      select: {
        category: true,
        brand: true,
      },
    });
  }

  // Handle cursor-based pagination
  let nextCursor: number | null = null;
  let products = productsResult;
  if (productsResult.length > limit) {
    products = productsResult.slice(0, limit);
    nextCursor = products[products.length - 1].id;
  }

  // Compute facets
  const categoryCounts: Record<string, number> = {};
  const brandCounts: Record<string, number> = {};

  for (const p of allMatchingProducts) {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
  }

  const categories = Object.entries(categoryCounts).map(([name, count]) => ({
    name,
    count,
  }));
  const brands = Object.entries(brandCounts).map(([name, count]) => ({
    name,
    count,
  }));

  categories.sort((a, b) => a.name.localeCompare(b.name));
  brands.sort((a, b) => a.name.localeCompare(b.name));

  return {
    products,
    nextCursor,
    facets: {
      categories,
      brands,
    },
  };
};
