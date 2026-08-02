import { useState, useEffect } from "react";
import { useQuery, getProductsWithFilters } from "wasp/client/operations";
import { type Product } from "wasp/entities";
import "./Main.css";

export function MainPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [brand, setBrand] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStock, setInStock] = useState(false);
  const [sortBy, setSortBy] = useState<"price_asc" | "price_desc" | "rating_desc" | "createdAt_desc">("price_asc");

  // The cursor we are currently requesting (undefined for first page)
  const [cursor, setCursor] = useState<number | undefined>(undefined);

  // State to accumulate products across pages
  const [products, setProducts] = useState<Product[]>([]);

  // Reset cursor whenever filters change
  useEffect(() => {
    setCursor(undefined);
  }, [search, category, brand, minPrice, maxPrice, inStock, sortBy]);

  const queryArgs = {
    search: search || undefined,
    category: category === "All" ? undefined : category,
    brand: brand === "All" ? undefined : brand,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    inStock: inStock || undefined,
    sortBy,
    limit: 2, // Small limit to showcase cursor-based pagination
    cursor,
  };

  const { data, isLoading, error } = useQuery(getProductsWithFilters, queryArgs);

  // Accumulate products as pages load
  useEffect(() => {
    if (data) {
      if (cursor === undefined) {
        setProducts(data.products);
      } else {
        setProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newProducts = data.products.filter((p) => !existingIds.has(p.id));
          return [...prev, ...newProducts];
        });
      }
    }
  }, [data, cursor]);

  const handleLoadMore = () => {
    if (data?.nextCursor) {
      setCursor(data.nextCursor);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Wasp Product Catalog</h1>
      </header>

      <div className="catalog-layout">
        {/* Sidebar Filters */}
        <aside className="sidebar">
          <div className="filter-group">
            <label htmlFor="search">Search</label>
            <input
              id="search"
              type="text"
              data-testid="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="form-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              data-testid="category-filter"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-select"
            >
              <option value="All">All</option>
              <option value="Electronics">Electronics</option>
              <option value="Home & Kitchen">Home & Kitchen</option>
              <option value="Furniture">Furniture</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="brand">Brand</label>
            <select
              id="brand"
              data-testid="brand-filter"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="form-select"
            >
              <option value="All">All</option>
              <option value="VoltCharge">VoltCharge</option>
              <option value="NutriBlend">NutriBlend</option>
              <option value="ErgoComfort">ErgoComfort</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Price Range</label>
            <div className="price-inputs">
              <input
                type="number"
                data-testid="min-price-input"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min"
                className="form-input price-input"
              />
              <span className="price-separator">to</span>
              <input
                type="number"
                data-testid="max-price-input"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max"
                className="form-input price-input"
              />
            </div>
          </div>

          <div className="filter-group checkbox-group">
            <input
              id="inStock"
              type="checkbox"
              data-testid="instock-checkbox"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
            />
            <label htmlFor="inStock">In Stock Only</label>
          </div>

          <div className="filter-group">
            <label htmlFor="sort">Sort By</label>
            <select
              id="sort"
              data-testid="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="form-select"
            >
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating_desc">Rating: High to Low</option>
              <option value="createdAt_desc">Newest First</option>
            </select>
          </div>

          {/* Facets */}
          <div className="facets-section">
            <h3>Categories Facets</h3>
            <div data-testid="facet-categories" className="facet-list">
              {data?.facets?.categories.map((cat) => (
                <div
                  key={cat.name}
                  data-testid="facet-category-item"
                  data-category-name={cat.name}
                  className="facet-item"
                >
                  {cat.name} ({cat.count})
                </div>
              ))}
            </div>

            <h3>Brands Facets</h3>
            <div data-testid="facet-brands" className="facet-list">
              {data?.facets?.brands.map((b) => (
                <div
                  key={b.name}
                  data-testid="facet-brand-item"
                  data-brand-name={b.name}
                  className="facet-item"
                >
                  {b.name} ({b.count})
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Product List Area */}
        <main className="main-content">
          {isLoading && products.length === 0 ? (
            <div className="loading">Loading products...</div>
          ) : error ? (
            <div className="error">Error loading products: {(error as Error).message}</div>
          ) : (
            <>
              <div data-testid="product-list" className="product-grid">
                {products.map((p) => (
                  <div
                    key={p.id}
                    data-testid="product-item"
                    data-product-id={p.id}
                    className="product-card"
                  >
                    <h2 data-testid="product-name" className="product-title">{p.name}</h2>
                    <div className="product-meta">
                      <span data-testid="product-category" className="badge">{p.category}</span>
                      <span data-testid="product-brand" className="badge secondary">{p.brand}</span>
                    </div>
                    <p className="product-description">{p.description}</p>
                    <div className="product-footer">
                      <span data-testid="product-price" className="product-price">${p.price.toFixed(2)}</span>
                      <span data-testid="product-rating" className="product-rating">★ {p.rating.toFixed(1)}</span>
                    </div>
                    <div className={`stock-status ${p.inStock ? "in-stock" : "out-of-stock"}`}>
                      {p.inStock ? "In Stock" : "Out of Stock"}
                    </div>
                  </div>
                ))}
              </div>

              {products.length === 0 && (
                <div className="no-products">No products match your criteria.</div>
              )}

              <div className="pagination-container">
                <button
                  data-testid="load-more-button"
                  onClick={handleLoadMore}
                  disabled={!data?.nextCursor}
                  className="load-more-btn"
                  style={{ display: data?.nextCursor ? "block" : "none" }}
                >
                  Load More
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
