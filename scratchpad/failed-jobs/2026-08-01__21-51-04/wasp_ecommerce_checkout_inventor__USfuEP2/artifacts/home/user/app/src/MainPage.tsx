import { useState } from "react";
import { useQuery, getProducts, validateCoupon, checkout } from "wasp/client/operations";
import "./Main.css";

export function MainPage() {
  const { data: products, isLoading, error } = useQuery(getProducts);

  const [cart, setCart] = useState<{ [productId: number]: number }>({});
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: string; value: number } | null>(null);

  const [checkoutStatus, setCheckoutStatus] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  if (isLoading) {
    return (
      <div className="loading-container">
        <h2>Loading product catalog...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error loading catalog: {error.message || "Unknown error"}</h2>
      </div>
    );
  }

  const addToCart = (productId: number) => {
    const product = products?.find((p) => p.id === productId);
    if (!product) return;

    const currentQty = cart[productId] || 0;
    if (currentQty >= product.inventory) {
      alert(`Cannot add more. Only ${product.inventory} available in stock.`);
      return;
    }

    setCart((prev) => ({
      ...prev,
      [productId]: currentQty + 1,
    }));
  };

  const decreaseQty = (productId: number) => {
    const currentQty = cart[productId] || 0;
    if (currentQty <= 1) {
      const newCart = { ...cart };
      delete newCart[productId];
      setCart(newCart);
    } else {
      setCart((prev) => ({
        ...prev,
        [productId]: currentQty - 1,
      }));
    }
  };

  const increaseQty = (productId: number) => {
    const product = products?.find((p) => p.id === productId);
    if (!product) return;

    const currentQty = cart[productId] || 0;
    if (currentQty >= product.inventory) {
      alert(`Cannot add more. Only ${product.inventory} available in stock.`);
      return;
    }

    setCart((prev) => ({
      ...prev,
      [productId]: currentQty + 1,
    }));
  };

  const removeFromCart = (productId: number) => {
    const newCart = { ...cart };
    delete newCart[productId];
    setCart(newCart);
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    setCouponSuccess("");

    if (!couponInput.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    try {
      const coupon = await validateCoupon({ code: couponInput.trim() });
      setAppliedCoupon(coupon);
      setCouponSuccess(`Coupon "${coupon.code}" applied successfully!`);
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err.message || "Invalid coupon code");
    }
  };

  const handleCheckout = async () => {
    setCheckoutStatus("");
    setIsCheckingOut(true);

    const items = cartItems.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));

    try {
      const order = await checkout({
        items,
        couponCode: appliedCoupon?.code,
      });
      setCheckoutStatus(`Order placed successfully! Order ID: ${order.id}`);
      setCart({});
      setAppliedCoupon(null);
      setCouponInput("");
    } catch (err: any) {
      const errMsg = err.message || "An error occurred during checkout";
      setCheckoutStatus(errMsg);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const cartItems = Object.entries(cart)
    .map(([idStr, quantity]) => {
      const id = parseInt(idStr, 10);
      const product = products?.find((p) => p.id === id);
      return {
        product,
        quantity,
      };
    })
    .filter((item) => item.product !== undefined) as { product: any; quantity: number }[];

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "PERCENT") {
      discount = subtotal * (appliedCoupon.value / 100);
    } else if (appliedCoupon.type === "FLAT") {
      discount = appliedCoupon.value;
    }
  }

  let grandTotal = subtotal - discount;
  if (grandTotal < 0) {
    discount = subtotal;
    grandTotal = 0;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>⚡ Wasp E-commerce Checkout</h1>
        <p className="subtitle">Secure, fast, and transaction-safe shopping cart</p>
      </header>

      <main className="main-content">
        {/* Product Catalog Section */}
        <section className="catalog-section">
          <h2>Product Catalog</h2>
          <div className="product-list">
            {products?.map((product) => {
              const inCartQty = cart[product.id] || 0;
              const isOutOfStock = product.inventory <= 0;
              const isMaxInCart = inCartQty >= product.inventory;

              return (
                <div key={product.id} className="product-card">
                  <div className="product-details">
                    <h3>{product.name}</h3>
                    <p className="product-price">${product.price.toFixed(2)}</p>
                    <p className={`product-inventory ${isOutOfStock ? "out-of-stock" : ""}`}>
                      Available Inventory: <strong>{product.inventory}</strong>
                    </p>
                  </div>
                  <button
                    className="add-to-cart-btn"
                    onClick={() => addToCart(product.id)}
                    disabled={isOutOfStock || isMaxInCart}
                  >
                    {isOutOfStock ? "Out of Stock" : isMaxInCart ? "All in Cart" : "Add to Cart"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Shopping Cart Section */}
        <section className="cart-section">
          <h2>Shopping Cart</h2>
          {cartItems.length === 0 ? (
            <div className="empty-cart-message">
              <p>Your cart is empty. Add some products from the catalog!</p>
            </div>
          ) : (
            <div className="cart-details">
              <div className="cart-items-list">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="cart-item">
                    <div className="cart-item-info">
                      <h4>{item.product.name}</h4>
                      <p className="cart-item-price">
                        ${item.product.price.toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <div className="cart-item-actions">
                      <button className="qty-btn" onClick={() => decreaseQty(item.product.id)}>
                        -
                      </button>
                      <span className="qty-display">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => increaseQty(item.product.id)}
                        disabled={item.quantity >= item.product.inventory}
                      >
                        +
                      </button>
                      <button className="remove-btn" onClick={() => removeFromCart(item.product.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Application */}
              <form onSubmit={handleApplyCoupon} className="coupon-form">
                <input
                  type="text"
                  id="coupon-input"
                  placeholder="Enter Coupon Code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  disabled={isCheckingOut}
                />
                <button type="submit" id="apply-coupon-btn" disabled={isCheckingOut}>
                  Apply Coupon
                </button>
              </form>

              {couponError && <p className="coupon-message error">{couponError}</p>}
              {couponSuccess && <p className="coupon-message success">{couponSuccess}</p>}

              {/* Pricing Summary */}
              <div className="pricing-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="summary-row discount">
                    <span>Discount:</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="summary-row grand-total">
                  <span>Grand Total:</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Action */}
              <button
                id="checkout-btn"
                className="checkout-btn"
                onClick={handleCheckout}
                disabled={isCheckingOut}
              >
                {isCheckingOut ? "Processing..." : "Place Order"}
              </button>

              {checkoutStatus && (
                <div
                  className={`checkout-status-message ${
                    checkoutStatus.includes("successfully") ? "success" : "error"
                  }`}
                >
                  {checkoutStatus}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
