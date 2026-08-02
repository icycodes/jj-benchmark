import { useState, useEffect } from 'react';
import { useQuery, getProductsWithFilters } from 'wasp/client/operations';
import type { Product } from 'wasp/entities';
import "./Main.css";

export function MainPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [brand, setBrand] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStock, setInStock] = useState(false);
  const [sortBy, setSortBy] = useState('price_asc');
  const [cursor, setCursor] = useState<number | undefined>(undefined);

  const queryArgs = {
    search: search || undefined,
    category: category === 'All' ? undefined : category,
    brand: brand === 'All' ? undefined : brand,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    inStock: inStock || undefined,
    sortBy: sortBy as any,
    limit: 10,
    cursor: cursor,
  };

  const { data, isLoading, error } = useQuery(getProductsWithFilters, queryArgs);
  const [products, setProducts] = useState<Product[]>([]);

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
    setMinPrice(e.target.value);
    setCursor(undefined);
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxPrice(e.target.value);
    setCursor(undefined);
  };

  const handleInStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInStock(e.target.checked);
    setCursor(undefined);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
    setCursor(undefined);
  };

  const handleLoadMore = () => {
    if (data && data.nextCursor !== null) {
      setCursor(data.nextCursor);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Wasp Product Catalog</h1>
      </header>

      <div className="main-layout">
        {/* Filters Sidebar */}
        <aside className="sidebar">
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              data-testid="search-input"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search products..."
            />
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select
              data-testid="category-filter"
              value={category}
              onChange={handleCategoryChange}
            >
              <option value="All">All</option>
              <option value="Electronics">Electronics</option>
              <option value="Home & Kitchen">Home & Kitchen</option>
              <option value="Furniture">Furniture</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Brand</label>
            <select
              data-testid="brand-filter"
              value={brand}
              onChange={handleBrandChange}
            >
              <option value="All">All</option>
              <option value="VoltCharge">VoltCharge</option>
              <option value="NutriBlend">NutriBlend</option>
              <option value="ErgoComfort">ErgoComfort</option>
            </select>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label>Min Price</label>
              <input
                type="number"
                data-testid="min-price-input"
                value={minPrice}
                onChange={handleMinPriceChange}
                placeholder="0"
              />
            </div>
            <div className="filter-group">
              <label>Max Price</label>
              <input
                type="number"
                data-testid="max-price-input"
                value={maxPrice}
                onChange={handleMaxPriceChange}
                placeholder="1000"
              />
            </div>
          </div>

          <div className="filter-group checkbox-group">
            <input
              type="checkbox"
              data-testid="instock-checkbox"
              checked={inStock}
              onChange={handleInStockChange}
              id="instock-checkbox"
            />
            <label htmlFor="instock-checkbox">In Stock Only</label>
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select
              data-testid="sort-select"
              value={sortBy}
              onChange={handleSortChange}
            >
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating_desc">Highest Rated</option>
              <option value="createdAt_desc">Newest Arrivals</option>
            </select>
          </div>

          {/* Facets */}
          <div className="facets-section">
            <h3>Categories</h3>
            <div data-testid="facet-categories" className="facets-list">
              {data?.facets.categories.map((cat) => (
                <div
                  key={cat.name}
                  data-testid="facet-category-item"
                  data-category-name={cat.name}
                  className={`facet-item ${category === cat.name ? 'active' : ''}`}
                  onClick={() => {
                    setCategory(category === cat.name ? 'All' : cat.name);
                    setCursor(undefined);
                  }}
                >
                  <span className="facet-name">{cat.name}</span>
                  <span className="facet-count">({cat.count})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="facets-section">
            <h3>Brands</h3>
            <div data-testid="facet-brands" className="facets-list">
              {data?.facets.brands.map((b) => (
                <div
                  key={b.name}
                  data-testid="facet-brand-item"
                  data-brand-name={b.name}
                  className={`facet-item ${brand === b.name ? 'active' : ''}`}
                  onClick={() => {
                    setBrand(brand === b.name ? 'All' : b.name);
                    setCursor(undefined);
                  }}
                >
                  <span className="facet-name">{b.name}</span>
                  <span className="facet-count">({b.count})</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <main className="content-area">
          {isLoading && products.length === 0 ? (
            <div className="loading">Loading products...</div>
          ) : error ? (
            <div className="error">Error loading products: {error.message}</div>
          ) : (
            <>
              <div data-testid="product-list" className="product-grid">
                {products.map((product) => (
                  <div
                    key={product.id}
                    data-testid="product-item"
                    data-product-id={product.id}
                    className="product-card"
                  >
                    <div className="product-info">
                      <h2 data-testid="product-name">{product.name}</h2>
                      <p className="description">{product.description}</p>
                      <div className="meta-info">
                        <span data-testid="product-category" className="badge category-badge">
                          {product.category}
                        </span>
                        <span data-testid="product-brand" className="badge brand-badge">
                          {product.brand}
                        </span>
                      </div>
                      <div className="price-rating">
                        <span data-testid="product-price" className="price">
                          ${product.price.toFixed(2)}
                        </span>
                        <span data-testid="product-rating" className="rating">
                          ⭐ {product.rating}
                        </span>
                      </div>
                      <div className="stock-status">
                        {product.inStock ? (
                          <span className="in-stock">In Stock</span>
                        ) : (
                          <span className="out-of-stock">Out of Stock</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {products.length === 0 && (
                <div className="no-results">No products match your criteria.</div>
              )}

              {data && data.nextCursor !== null && (
                <div className="pagination-area">
                  <button
                    data-testid="load-more-button"
                    onClick={handleLoadMore}
                    className="load-more-btn"
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
