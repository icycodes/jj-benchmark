import { useState } from "react";
import { useAuth, logout } from "wasp/client/auth";
import {
  useQuery,
  getProducts,
  getOrders,
  getAlerts,
  getPurchaseOrders,
  fulfillOrder,
} from "wasp/client/operations";
import "./Main.css";

export function MainPage() {
  const { data: user } = useAuth();
  const { data: products, error: productsError } = useQuery(getProducts);
  const { data: orders, error: ordersError } = useQuery(getOrders);
  const { data: alerts, error: alertsError } = useQuery(getAlerts);
  const { data: purchaseOrders, error: posError } = useQuery(getPurchaseOrders);

  const [fulfillmentError, setFulfillmentError] = useState<string | null>(null);
  const [isFulfilling, setIsFulfillmentLoading] = useState<Record<number, boolean>>({});

  const handleFulfillOrder = async (orderId: number) => {
    setFulfillmentError(null);
    setIsFulfillmentLoading((prev) => ({ ...prev, [orderId]: true }));
    try {
      await fulfillOrder({ orderId });
    } catch (err: any) {
      console.error("Fulfillment error:", err);
      // Ensure we extract the error message accurately
      const errMsg = err.message || "Failed to fulfill the order.";
      setFulfillmentError(errMsg);
    } finally {
      setIsFulfillmentLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-brand">
          <h1>Warehouse Tracker</h1>
        </div>
        <div className="header-user">
          {user && (
            <span className="username-display">
              Logged in as: <strong>{user.username}</strong>
            </span>
          )}
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* Top Section: Error Display */}
        {fulfillmentError && (
          <div className="error-banner" data-testid="fulfillment-error">
            {fulfillmentError}
          </div>
        )}

        {/* Grid Layout for Sections */}
        <div className="dashboard-grid">
          {/* Products List */}
          <section className="grid-section products-section">
            <h2>Inventory & Stock Levels</h2>
            {productsError && (
              <p className="error-text">Error loading products: {productsError.message}</p>
            )}
            <div className="table-container">
              <table className="products-table" data-testid="products-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product Name</th>
                    <th>Stock</th>
                    <th>Supplier</th>
                    <th>Low Threshold</th>
                    <th>Reorder Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {products?.map((product: any) => (
                    <tr key={product.id}>
                      <td>{product.sku}</td>
                      <td>{product.name}</td>
                      <td>
                        <span
                          className={`stock-badge ${
                            product.stock < product.lowStockThreshold ? "low-stock" : "good-stock"
                          }`}
                          data-testid={`product-stock-${product.sku}`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td>{product.supplier?.name}</td>
                      <td>{product.lowStockThreshold}</td>
                      <td>{product.reorderQuantity}</td>
                    </tr>
                  ))}
                  {(!products || products.length === 0) && (
                    <tr>
                      <td colSpan={6} className="empty-row">
                        No products available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Customer Orders */}
          <section className="grid-section orders-section">
            <h2>Customer Orders</h2>
            {ordersError && (
              <p className="error-text">Error loading orders: {ordersError.message}</p>
            )}
            <div className="orders-list" data-testid="orders-list">
              {orders?.map((order: any) => (
                <div
                  key={order.id}
                  className={`order-card ${order.status.toLowerCase()}`}
                  data-testid={`order-card-${order.id}`}
                >
                  <div className="order-card-header">
                    <h3>{order.customerName}</h3>
                    <span
                      className={`status-label ${order.status.toLowerCase()}`}
                      data-testid={`order-status-${order.id}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="order-items-list">
                    <h4>Items:</h4>
                    <ul>
                      {order.orderItems?.map((item: any) => (
                        <li key={item.id}>
                          {item.product?.name} ({item.product?.sku}) &times; {item.quantity}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {order.status === "PENDING" && (
                    <button
                      className="fulfill-btn"
                      data-testid={`fulfill-btn-${order.id}`}
                      onClick={() => handleFulfillOrder(order.id)}
                      disabled={isFulfilling[order.id]}
                    >
                      {isFulfilling[order.id] ? "Fulfilling..." : "Fulfill Order"}
                    </button>
                  )}
                </div>
              ))}
              {(!orders || orders.length === 0) && (
                <p className="empty-text">No customer orders found.</p>
              )}
            </div>
          </section>

          {/* Low Stock Alerts */}
          <section className="grid-section alerts-section">
            <h2>Low Stock Alerts</h2>
            {alertsError && (
              <p className="error-text">Error loading alerts: {alertsError.message}</p>
            )}
            <div className="alerts-list" data-testid="alerts-list">
              {alerts?.map((alert: any) => (
                <div key={alert.id} className="alert-item-card" data-testid="alert-item">
                  <div className="alert-icon">⚠️</div>
                  <div className="alert-content">
                    <p className="alert-message">{alert.message}</p>
                    <span className="alert-time">
                      {new Date(alert.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
              {(!alerts || alerts.length === 0) && (
                <p className="empty-text text-center">No active stock alerts.</p>
              )}
            </div>
          </section>

          {/* Supplier Purchase Orders */}
          <section className="grid-section purchase-orders-section">
            <h2>Supplier Purchase Orders</h2>
            {posError && (
              <p className="error-text">Error loading purchase orders: {posError.message}</p>
            )}
            <div className="purchase-orders-list" data-testid="purchase-orders-list">
              {purchaseOrders?.map((po: any) => (
                <div key={po.id} className="po-item-card" data-testid="purchase-order-item">
                  <div className="po-header">
                    <span className="po-id">PO #{po.id}</span>
                    <span className="po-status-badge">{po.status}</span>
                  </div>
                  <div className="po-body">
                    <p>
                      <strong>Supplier:</strong> {po.supplier?.name}
                    </p>
                    <p>
                      <strong>Product SKU:</strong> {po.product?.sku}
                    </p>
                    <p>
                      <strong>Quantity Ordered:</strong> {po.quantity}
                    </p>
                  </div>
                  <div className="po-footer">
                    <span className="po-time">{new Date(po.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {(!purchaseOrders || purchaseOrders.length === 0) && (
                <p className="empty-text text-center">No purchase orders generated.</p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
