import { useState } from "react";
import { useQuery, getProducts, checkout, applyCouponCode } from "wasp/client/operations";
import "./Main.css";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export function MainPage() {
  const { data: products, isLoading, error } = useQuery(getProducts);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: string; value: number } | null>(null);

  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.inventory) {
          alert(`Cannot add more. Only ${product.inventory} items available in stock.`);
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        if (product.inventory <= 0) {
          alert("This product is out of stock.");
          return prev;
        }
        return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (productId: number, delta: number, inventory: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > inventory) {
              alert(`Cannot add more. Only ${inventory} items available in stock.`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const handleApplyCoupon = async () => {
    setCouponError(null);
    setCouponSuccess(null);
    if (!couponInput.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    try {
      const coupon = await applyCouponCode({ code: couponInput.trim() });
      setAppliedCoupon(coupon);
      setCouponSuccess(`Coupon "${coupon.code}" applied successfully!`);
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err.message || "Invalid coupon code");
    }
  };

  const handlePlaceOrder = async () => {
    setCheckoutError(null);
    setCheckoutSuccess(null);
    setIsCheckoutLoading(true);

    try {
      const cartItems = cart.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      }));

      const result = await checkout({
        cartItems,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      });

      setCheckoutSuccess(`Order placed successfully! Order ID: ${result.orderId}`);
      setCart([]);
      setAppliedCoupon(null);
      setCouponInput("");
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || "";
      if (errMsg.toLowerCase().includes("inventory") || errMsg.toLowerCase().includes("stock")) {
        setCheckoutError("Insufficient inventory. Out of stock.");
      } else {
        setCheckoutError(errMsg || "Failed to place order.");
      }
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "PERCENT") {
      discount = subtotal * (appliedCoupon.value / 100);
    } else if (appliedCoupon.type === "FLAT") {
      discount = appliedCoupon.value;
    }
  }
  const grandTotal = Math.max(0, subtotal - discount);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Wasp E-commerce Checkout</h1>
        <p className="subtitle">Fast, safe, and robust shopping experience</p>
      </header>

      <main className="app-main">
        {/* Product Catalog Section */}
        <section className="catalog-section">
          <h2>Product Catalog</h2>
          {isLoading ? (
            <p className="loading">Loading products...</p>
          ) : error ? (
            <p className="error">Error loading products: {error.message}</p>
          ) : !products || products.length === 0 ? (
            <p className="empty">No products available</p>
          ) : (
            <div className="product-grid">
              {products.map((product: any) => (
                <div key={product.id} className="product-card">
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="product-price">${product.price.toFixed(2)}</p>
                    <p className="product-inventory">
                      Available Stock: <span className={product.inventory > 0 ? "in-stock" : "out-of-stock"}>{product.inventory}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.inventory <= 0}
                    className="add-to-cart-btn"
                  >
                    {product.inventory > 0 ? "Add to Cart" : "Out of Stock"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Shopping Cart Section */}
        <section className="cart-section">
          <h2>Your Shopping Cart</h2>
          {cart.length === 0 ? (
            <p className="empty-cart">Your cart is empty. Add some items to get started!</p>
          ) : (
            <div className="cart-container">
              <div className="cart-items">
                {cart.map((item) => {
                  const productInCatalog = products?.find((p: any) => p.id === item.id);
                  const maxInventory = productInCatalog ? productInCatalog.inventory : 999;
                  return (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-details">
                        <h4>{item.name}</h4>
                        <p className="cart-item-price">${item.price.toFixed(2)} each</p>
                      </div>
                      <div className="cart-item-actions">
                        <div className="quantity-controls">
                          <button onClick={() => updateQuantity(item.id, -1, maxInventory)}>-</button>
                          <span className="quantity-display">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1, maxInventory)}>+</button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="remove-btn">
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Coupon and Summary Section */}
              <div className="cart-summary">
                <div className="coupon-box">
                  <h3>Apply Coupon</h3>
                  <div className="coupon-input-group">
                    <input
                      type="text"
                      id="coupon-input"
                      placeholder="Enter Coupon Code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                    />
                    <button id="apply-coupon-btn" onClick={handleApplyCoupon}>
                      Apply Coupon
                    </button>
                  </div>
                  {couponSuccess && <p className="coupon-message success">{couponSuccess}</p>}
                  {couponError && <p className="coupon-message error">{couponError}</p>}
                </div>

                <div className="summary-box">
                  <h3>Order Summary</h3>
                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="summary-row discount-row">
                      <span>Discount ({appliedCoupon.code}):</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="summary-row total-row">
                    <span>Grand Total:</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </div>

                  <button
                    id="checkout-btn"
                    onClick={handlePlaceOrder}
                    disabled={isCheckoutLoading || cart.length === 0}
                    className="checkout-button"
                  >
                    {isCheckoutLoading ? "Processing..." : "Place Order"}
                  </button>

                  {checkoutSuccess && <p className="checkout-message success">{checkoutSuccess}</p>}
                  {checkoutError && <p className="checkout-message error">{checkoutError}</p>}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
