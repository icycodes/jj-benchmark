import type { Product } from 'wasp/entities';
import type { GetProductsWithFilters } from 'wasp/server/operations';

export type GetProductsWithFiltersInput = {
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

export type GetProductsWithFiltersOutput = {
  products: Product[];
  nextCursor: number | null;
  facets: {
    categories: { name: string; count: number }[];
    brands: { name: string; count: number }[];
  };
};

export const getProductsWithFilters: GetProductsWithFilters<
  GetProductsWithFiltersInput,
  GetProductsWithFiltersOutput
> = async (args, context) => {
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

  if (category && category !== 'All') {
    where.category = category;
  }
  if (brand && brand !== 'All') {
    where.brand = brand;
  }
  if (minPrice !== undefined && minPrice !== null) {
    where.price = { ...where.price, gte: minPrice };
  }
  if (maxPrice !== undefined && maxPrice !== null) {
    where.price = { ...where.price, lte: maxPrice };
  }
  if (inStock === true) {
    where.inStock = true;
  }

  let searchCondition: any = {};
  if (search) {
    const searchQuery = search.trim();
    if (searchQuery) {
      // Split by spaces and join with & for Postgres full-text search
      const words = searchQuery.split(/\s+/).filter(Boolean);
      const formattedSearch = words.join(' & ');
      searchCondition = {
        OR: [
          { name: { search: formattedSearch } },
          { description: { search: formattedSearch } },
        ],
      };
    }
  }

  let orderBy: any = [{ id: 'asc' }];
  if (sortBy === 'price_asc') {
    orderBy = [{ price: 'asc' }, { id: 'asc' }];
  } else if (sortBy === 'price_desc') {
    orderBy = [{ price: 'desc' }, { id: 'asc' }];
  } else if (sortBy === 'rating_desc') {
    orderBy = [{ rating: 'desc' }, { id: 'asc' }];
  } else if (sortBy === 'createdAt_desc') {
    orderBy = [{ createdAt: 'desc' }, { id: 'asc' }];
  }

  const limitVal = limit ?? 10;

  let products: Product[] = [];
  try {
    products = await context.entities.Product.findMany({
      where: { ...where, ...searchCondition },
      orderBy,
      take: limitVal + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  } catch (error) {
    // Graceful fallback to case-insensitive contains search if full-text search fails
    console.error('FTS failed, falling back to contains:', error);
    if (search) {
      searchCondition = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      };
    }
    products = await context.entities.Product.findMany({
      where: { ...where, ...searchCondition },
      orderBy,
      take: limitVal + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  let nextCursor: number | null = null;
  if (products.length > limitVal) {
    products.pop();
    const lastProduct = products[products.length - 1];
    nextCursor = lastProduct ? lastProduct.id : null;
  }

  // Facet Counts Logic
  let categoryGroups: any[] = [];
  let brandGroups: any[] = [];
  try {
    categoryGroups = await (context.entities.Product as any).groupBy({
      by: ['category'],
      where: { ...where, ...searchCondition },
      _count: {
        _all: true,
      },
    });

    brandGroups = await (context.entities.Product as any).groupBy({
      by: ['brand'],
      where: { ...where, ...searchCondition },
      _count: {
        _all: true,
      },
    });
  } catch (error) {
    console.error('Grouping failed:', error);
    // If grouping fails (e.g. due to FTS issue), we can fallback to fetching all matching products and counting in memory
    const allMatching = await context.entities.Product.findMany({
      where: { ...where, ...searchCondition },
      select: { category: true, brand: true },
    });

    const catMap: Record<string, number> = {};
    const brandMap: Record<string, number> = {};
    for (const item of allMatching) {
      catMap[item.category] = (catMap[item.category] || 0) + 1;
      brandMap[item.brand] = (brandMap[item.brand] || 0) + 1;
    }

    categoryGroups = Object.entries(catMap).map(([category, count]) => ({
      category,
      _count: { _all: count },
    }));

    brandGroups = Object.entries(brandMap).map(([brand, count]) => ({
      brand,
      _count: { _all: count },
    }));
  }

  const categories = categoryGroups.map((g) => ({
    name: g.category,
    count: g._count._all,
  }));

  const brands = brandGroups.map((g) => ({
    name: g.brand,
    count: g._count._all,
  }));

  return {
    products,
    nextCursor,
    facets: {
      categories,
      brands,
    },
  };
};
