import React from "react";
import { useQuery, getAccessLogs } from "wasp/client/operations";
import { Link, useNavigate } from "react-router";
import { logout } from "wasp/client/auth";

export const LogsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: logs, isLoading, error } = useQuery(getAccessLogs);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (isLoading) {
    return <div style={{ padding: "20px", fontFamily: "sans-serif" }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ padding: "20px", color: "red", fontFamily: "sans-serif" }}>Error: {error.message}</div>;
  }

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "1000px", margin: "0 auto" }}>
      {/* Navbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "15px", marginBottom: "20px" }}>
        <h1 style={{ margin: 0, fontSize: "24px" }}>Wasp Drive - Access Logs</h1>
        <div>
          <Link to="/" style={{ marginRight: "15px", textDecoration: "none", color: "#007bff", fontWeight: "bold" }}>Dashboard</Link>
          <Link to="/logs" style={{ marginRight: "15px", textDecoration: "none", color: "#007bff", fontWeight: "bold" }}>Access Logs</Link>
          <button onClick={handleLogout} style={{ padding: "8px 12px", backgroundColor: "#dc3545", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ border: "1px solid #ddd", padding: "20px", borderRadius: "6px" }}>
        <h3 style={{ marginTop: 0, borderBottom: "1px solid #eee", paddingBottom: "10px" }}>Download History</h3>
        <div data-testid="logs-container">
          {logs?.length === 0 ? (
            <p style={{ color: "#6c757d", fontStyle: "italic" }}>No access logs found.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {logs?.map((log: any) => (
                <div
                  key={log.id}
                  className="log-item"
                  style={{
                    padding: "12px",
                    border: "1px solid #eee",
                    borderRadius: "4px",
                    backgroundColor: "#f9f9f9",
                    fontSize: "14px",
                    lineHeight: "1.6"
                  }}
                >
                  <div><strong>File Name:</strong> {log.fileName}</div>
                  <div><strong>Accessed At:</strong> {new Date(log.timestamp).toLocaleString()}</div>
                  <div><strong>IP Address:</strong> {log.ipAddress}</div>
                  <div><strong>User-Agent:</strong> {log.userAgent}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
