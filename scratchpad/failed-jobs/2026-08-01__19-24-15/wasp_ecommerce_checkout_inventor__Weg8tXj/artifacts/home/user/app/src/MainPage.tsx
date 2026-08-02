import { useState } from "react";
import { useQuery, getProducts, getCoupon, checkout } from "wasp/client/operations";
import type { Product, Coupon } from "wasp/entities";
import "./Main.css";

export function MainPage() {
  const { data: products, isLoading, error, refetch } = useQuery(getProducts);

  // Cart state: array of { product: Product; quantity: number }
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Checkout state
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Add product to cart
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
    // Clear previous checkout/coupon messages on active interaction
    setCheckoutMessage(null);
    setCheckoutError(null);
  };

  // Update quantity in cart
  const updateQuantity = (productId: number, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
    setCheckoutMessage(null);
    setCheckoutError(null);
  };

  // Remove product from cart
  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
    setCheckoutMessage(null);
    setCheckoutError(null);
  };

  // Apply Coupon
  const handleApplyCoupon = async () => {
    setCouponMessage(null);
    setCouponError(null);
    if (!couponCodeInput.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    try {
      const coupon = await getCoupon({ code: couponCodeInput.trim().toUpperCase() });
      setAppliedCoupon(coupon);
      setCouponMessage(`Coupon "${coupon.code}" applied successfully!`);
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err.message || "Invalid coupon code");
    }
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "PERCENT") {
      discount = subtotal * (appliedCoupon.value / 100);
    } else if (appliedCoupon.type === "FLAT") {
      discount = appliedCoupon.value;
    }
  }

  const grandTotal = Math.max(0, subtotal - discount);

  // Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setCheckoutError("Your cart is empty");
      return;
    }

    setIsCheckingOut(true);
    setCheckoutMessage(null);
    setCheckoutError(null);

    try {
      const result = await checkout({
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      });

      setCheckoutMessage(`Order placed successfully! Order ID: ${result.orderId}`);
      setCart([]);
      setAppliedCoupon(null);
      setCouponCodeInput("");
      setCouponMessage(null);
      // Refetch products to show updated inventory
      await refetch();
    } catch (err: any) {
      setCheckoutError(err.message || "Checkout failed");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <main className="app-container">
      <header className="app-header">
        <h1>Wasp E-commerce Checkout</h1>
        <p className="subtitle">Inventory Tracking & Concurrency Control Demo</p>
      </header>

      <div className="layout-grid">
        {/* Product Catalog Section */}
        <section className="catalog-section">
          <h2>Product Catalog</h2>
          {isLoading && <p>Loading products...</p>}
          {error && <p className="error-text">Error loading products: {error.message}</p>}
          {products && (
            <div className="products-list">
              {products.map((product) => (
                <div key={product.id} className="product-card">
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="product-price">${product.price.toFixed(2)}</p>
                    <p className={`product-inventory ${product.inventory === 0 ? "out-of-stock" : ""}`}>
                      Available Inventory: {product.inventory}
                    </p>
                  </div>
                  <button
                    className="add-to-cart-btn"
                    onClick={() => addToCart(product)}
                    disabled={product.inventory === 0}
                  >
                    {product.inventory === 0 ? "Out of Stock" : "Add to Cart"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Shopping Cart Section */}
        <section className="cart-section">
          <h2>Shopping Cart</h2>
          {cart.length === 0 ? (
            <p className="empty-cart-text">Your cart is empty.</p>
          ) : (
            <div className="cart-content">
              <div className="cart-items">
                {cart.map((item) => (
                  <div key={item.product.id} className="cart-item">
                    <div className="cart-item-details">
                      <h4>{item.product.name}</h4>
                      <p>${item.product.price.toFixed(2)} each</p>
                    </div>
                    <div className="cart-item-actions">
                      <div className="quantity-controls">
                        <button onClick={() => updateQuantity(item.product.id, -1)}>-</button>
                        <span className="quantity-badge">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, 1)}>+</button>
                      </div>
                      <button className="remove-btn" onClick={() => removeFromCart(item.product.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                {/* Coupon Code Section */}
                <div className="coupon-area">
                  <div className="coupon-input-group">
                    <input
                      id="coupon-input"
                      type="text"
                      placeholder="Enter Coupon Code"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value)}
                    />
                    <button id="apply-coupon-btn" onClick={handleApplyCoupon}>
                      Apply Coupon
                    </button>
                  </div>
                  {couponMessage && <p className="success-text coupon-status">{couponMessage}</p>}
                  {couponError && <p className="error-text coupon-status">{couponError}</p>}
                </div>

                {appliedCoupon && (
                  <div className="summary-row discount-row">
                    <span>Discount ({appliedCoupon.code}):</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="summary-row grand-total-row">
                  <span>Grand Total:</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>

                {/* Place Order Section */}
                <div className="checkout-area">
                  <button
                    id="checkout-btn"
                    className="checkout-btn"
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                  >
                    {isCheckingOut ? "Processing..." : "Place Order"}
                  </button>
                  {checkoutMessage && <p className="success-text checkout-status">{checkoutMessage}</p>}
                  {checkoutError && <p className="error-text checkout-status">{checkoutError}</p>}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
