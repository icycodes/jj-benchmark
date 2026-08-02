import { useState, useEffect } from "react";
import { useQuery, getProductsWithFilters } from "wasp/client/operations";
import "./Main.css";

export function MainPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [inStock, setInStock] = useState(false);
  const [sortBy, setSortBy] = useState<
    "price_asc" | "price_desc" | "rating_desc" | "createdAt_desc"
  >("price_asc");

  // Pagination state
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  // Query products with current filters and cursor
  const { data, isLoading, error } = useQuery(getProductsWithFilters, {
    search: search || undefined,
    category: category || undefined,
    brand: brand || undefined,
    minPrice: minPrice !== "" ? Number(minPrice) : undefined,
    maxPrice: maxPrice !== "" ? Number(maxPrice) : undefined,
    inStock: inStock || undefined,
    sortBy,
    limit: 2, // Fetch in pages of 2 to show pagination clearly
    cursor,
  });

  // Sync loaded products
  useEffect(() => {
    if (data) {
      if (cursor === undefined) {
        setAllProducts(data.products);
      } else {
        setAllProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newProducts = data.products.filter((p) => !existingIds.has(p.id));
          return [...prev, ...newProducts];
        });
      }
    }
  }, [data, cursor]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCursor(undefined);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
    setCursor(undefined);
  };

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBrand(e.target.value);
    setCursor(undefined);
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === "" ? "" : Number(e.target.value);
    setMinPrice(val);
    setCursor(undefined);
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === "" ? "" : Number(e.target.value);
    setMaxPrice(val);
    setCursor(undefined);
  };

  const handleInStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInStock(e.target.checked);
    setCursor(undefined);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as any);
    setCursor(undefined);
  };

  const handleLoadMore = () => {
    if (data?.nextCursor) {
      setCursor(data.nextCursor);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Wasp Product Catalog</h1>
        <p>Full-Text Search, Multi-Faceted Filtering & Sorting</p>
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
              onChange={handleSearchChange}
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
              onChange={handleCategoryChange}
              className="form-select"
            >
              <option value="">All Categories</option>
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
              onChange={handleBrandChange}
              className="form-select"
            >
              <option value="">All Brands</option>
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
                onChange={handleMinPriceChange}
                placeholder="Min"
                className="form-input price-input"
              />
              <span>to</span>
              <input
                type="number"
                data-testid="max-price-input"
                value={maxPrice}
                onChange={handleMaxPriceChange}
                placeholder="Max"
                className="form-input price-input"
              />
            </div>
          </div>

          <div className="filter-group checkbox-group">
            <input
              type="checkbox"
              id="instock"
              data-testid="instock-checkbox"
              checked={inStock}
              onChange={handleInStockChange}
            />
            <label htmlFor="instock">In Stock Only</label>
          </div>

          <div className="filter-group">
            <label htmlFor="sort">Sort By</label>
            <select
              id="sort"
              data-testid="sort-select"
              value={sortBy}
              onChange={handleSortChange}
              className="form-select"
            >
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating_desc">Highest Rated</option>
              <option value="createdAt_desc">Newest Arrivals</option>
            </select>
          </div>

          {/* Facets Section */}
          <div className="facets-section">
            <h3>Filter Facets</h3>
            
            <div className="facet-block">
              <h4>Categories</h4>
              <div data-testid="facet-categories" className="facet-list">
                {data?.facets?.categories.map((cat) => (
                  <div
                    key={cat.name}
                    data-testid="facet-category-item"
                    data-category-name={cat.name}
                    className={`facet-item ${category === cat.name ? "active" : ""}`}
                    onClick={() => {
                      setCategory(category === cat.name ? "" : cat.name);
                      setCursor(undefined);
                    }}
                  >
                    <span className="facet-name">{cat.name}</span>
                    <span className="facet-count">{cat.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="facet-block">
              <h4>Brands</h4>
              <div data-testid="facet-brands" className="facet-list">
                {data?.facets?.brands.map((b) => (
                  <div
                    key={b.name}
                    data-testid="facet-brand-item"
                    data-brand-name={b.name}
                    className={`facet-item ${brand === b.name ? "active" : ""}`}
                    onClick={() => {
                      setBrand(brand === b.name ? "" : b.name);
                      setCursor(undefined);
                    }}
                  >
                    <span className="facet-name">{b.name}</span>
                    <span className="facet-count">{b.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="main-content">
          {isLoading && allProducts.length === 0 ? (
            <div className="loading">Loading products...</div>
          ) : error ? (
            <div className="error">Error loading products: {(error as Error).message}</div>
          ) : (
            <>
              <div data-testid="product-list" className="product-grid">
                {allProducts.map((product) => (
                  <div
                    key={product.id}
                    data-testid="product-item"
                    data-product-id={product.id}
                    className="product-card"
                  >
                    <div className="product-details">
                      <span data-testid="product-category" className="badge category-badge">
                        {product.category}
                      </span>
                      <span data-testid="product-brand" className="badge brand-badge">
                        {product.brand}
                      </span>
                      <h2 data-testid="product-name" className="product-title">
                        {product.name}
                      </h2>
                      <p className="product-desc">{product.description}</p>
                      <div className="product-footer">
                        <span data-testid="product-price" className="product-price">
                          ${product.price.toFixed(2)}
                        </span>
                        <span data-testid="product-rating" className="product-rating">
                          ⭐ {product.rating.toFixed(1)}
                        </span>
                      </div>
                      <div className={`stock-status ${product.inStock ? "in-stock" : "out-of-stock"}`}>
                        {product.inStock ? "In Stock" : "Out of Stock"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {allProducts.length === 0 && (
                <div className="no-results">No products match your search criteria.</div>
              )}

              {data?.nextCursor !== null && data?.nextCursor !== undefined && (
                <div className="load-more-container">
                  <button
                    data-testid="load-more-button"
                    onClick={handleLoadMore}
                    className="btn-load-more"
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
