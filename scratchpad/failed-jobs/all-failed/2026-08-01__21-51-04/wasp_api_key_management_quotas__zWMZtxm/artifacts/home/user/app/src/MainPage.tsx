import React, { useState } from "react";
import { useQuery, getApiKeys, createApiKey, deleteApiKey } from "wasp/client/operations";
import { logout } from "wasp/client/auth";

export function MainPage() {
  const { data: apiKeys, isLoading, error, refetch } = useQuery(getApiKeys);

  const [keyName, setKeyName] = useState("");
  const [keyQuota, setKeyQuota] = useState("");
  const [testApiKey, setTestApiKey] = useState("");
  const [testResponseStatus, setTestResponseStatus] = useState("");
  const [testResponseBody, setTestResponseBody] = useState("");
  const [formError, setFormError] = useState("");

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!keyName.trim()) {
      setFormError("Name is required");
      return;
    }
    const quotaNum = parseInt(keyQuota);
    if (isNaN(quotaNum) || quotaNum < 0) {
      setFormError("Quota must be a non-negative number");
      return;
    }

    try {
      await createApiKey({ name: keyName, quota: quotaNum });
      setKeyName("");
      setKeyQuota("");
    } catch (err: any) {
      setFormError(err.message || "Failed to create API key");
    }
  };

  const handleDeleteKey = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this API key?")) {
      try {
        await deleteApiKey({ id });
      } catch (err: any) {
        alert(err.message || "Failed to delete API key");
      }
    }
  };

  const handleSendTestRequest = async () => {
    setTestResponseStatus("");
    setTestResponseBody("");
    try {
      const serverUrl = import.meta.env.REACT_APP_API_URL || "http://localhost:3001";
      const response = await fetch(`${serverUrl}/api/request`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });
      setTestResponseStatus(response.status.toString());
      const text = await response.text();
      setTestResponseBody(text);
    } catch (err: any) {
      setTestResponseStatus("Error");
      setTestResponseBody(err.message || "Network error");
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "20px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid #eee", paddingBottom: "15px" }}>
        <h1 style={{ margin: 0, fontSize: "24px" }}>API Key Portal</h1>
        <button 
          onClick={logout} 
          style={{ padding: "8px 16px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          Logout
        </button>
      </header>

      {/* Create Key Section */}
      <section style={{ backgroundColor: "#f9fafb", padding: "20px", borderRadius: "8px", marginBottom: "30px", border: "1px solid #f3f4f6" }}>
        <h2 style={{ marginTop: 0, fontSize: "18px", marginBottom: "15px" }}>Create API Key</h2>
        <form onSubmit={handleCreateKey} style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, minWidth: "150px" }}>
            <label htmlFor="key-name" style={{ fontSize: "14px", fontWeight: "500" }}>Key Name</label>
            <input 
              type="text" 
              id="key-name" 
              data-testid="key-name" 
              value={keyName} 
              onChange={(e) => setKeyName(e.target.value)}
              style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
              placeholder="e.g. Production Key"
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, minWidth: "150px" }}>
            <label htmlFor="key-quota" style={{ fontSize: "14px", fontWeight: "500" }}>Quota (Requests)</label>
            <input 
              type="number" 
              id="key-quota" 
              data-testid="key-quota" 
              value={keyQuota} 
              onChange={(e) => setKeyQuota(e.target.value)}
              style={{ padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
              placeholder="e.g. 100"
            />
          </div>
          <button 
            type="submit" 
            id="generate-key-btn" 
            data-testid="generate-key-btn"
            style={{ padding: "8px 16px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", height: "38px" }}
          >
            Generate Key
          </button>
        </form>
        {formError && <p style={{ color: "#ef4444", marginTop: "10px", fontSize: "14px" }}>{formError}</p>}
      </section>

      {/* API Keys List Section */}
      <section style={{ marginBottom: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h2 style={{ margin: 0, fontSize: "18px" }}>Your API Keys</h2>
          <button 
            data-testid="refresh-btn" 
            onClick={() => refetch()}
            style={{ padding: "6px 12px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            Refresh
          </button>
        </div>

        {isLoading && <p>Loading keys...</p>}
        {error && <p style={{ color: "#ef4444" }}>Error loading keys: {error.message || "Unknown error"}</p>}

        {!isLoading && !error && (!apiKeys || apiKeys.length === 0) && (
          <p style={{ color: "#6b7280", fontStyle: "italic" }}>No API keys generated yet.</p>
        )}

        {apiKeys && apiKeys.map((apiKey: any) => (
          <div 
            key={apiKey.id} 
            data-testid="api-key-item" 
            style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px", marginBottom: "15px", backgroundColor: "white" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div>
                <h3 data-testid="key-name-display" style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>{apiKey.name}</h3>
                <code 
                  data-testid="key-value-display" 
                  style={{ display: "inline-block", backgroundColor: "#f3f4f6", padding: "2px 6px", borderRadius: "4px", fontSize: "14px", marginTop: "4px", wordBreak: "break-all" }}
                >
                  {apiKey.key}
                </code>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span data-testid="key-usage-display" style={{ fontSize: "14px", fontWeight: "500", color: "#4b5563" }}>
                  {apiKey.usage} / {apiKey.quota}
                </span>
                <button 
                  data-testid="delete-key-btn" 
                  onClick={() => handleDeleteKey(apiKey.id)}
                  style={{ padding: "4px 8px", backgroundColor: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "4px", cursor: "pointer", color: "#ef4444" }}
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Logs List */}
            <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "10px", marginTop: "10px" }}>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Logs</h4>
              <ul data-testid="key-logs-list" style={{ listStyle: "none", padding: 0, margin: 0, maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
                {!apiKey.logs || apiKey.logs.length === 0 ? (
                  <li style={{ fontSize: "13px", color: "#9ca3af", fontStyle: "italic" }}>No activity logs yet.</li>
                ) : (
                  apiKey.logs.map((log: any) => (
                    <li 
                      key={log.id} 
                      data-testid="log-item" 
                      style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", backgroundColor: "#f9fafb", borderRadius: "4px", fontSize: "13px" }}
                    >
                      <span style={{ fontFamily: "monospace" }}>{log.endpoint}</span>
                      <span style={{ fontWeight: "600", color: log.status === 200 ? "#10b981" : "#ef4444" }}>{log.status}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        ))}
      </section>

      {/* Test API Key Section */}
      <section style={{ backgroundColor: "#f0fdf4", padding: "20px", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
        <h2 style={{ marginTop: 0, fontSize: "18px", marginBottom: "15px", color: "#166534" }}>Test API Key</h2>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap", marginBottom: "15px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, minWidth: "250px" }}>
            <label htmlFor="test-api-key" style={{ fontSize: "14px", fontWeight: "500", color: "#166534" }}>API Key</label>
            <input 
              type="text" 
              id="test-api-key" 
              data-testid="test-api-key" 
              value={testApiKey} 
              onChange={(e) => setTestApiKey(e.target.value)}
              style={{ padding: "8px", border: "1px solid #86efac", borderRadius: "4px", backgroundColor: "white" }}
              placeholder="sk_..."
            />
          </div>
          <button 
            id="send-test-request-btn" 
            data-testid="send-test-request-btn"
            onClick={handleSendTestRequest}
            style={{ padding: "8px 16px", backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", height: "38px" }}
          >
            Send Test Request
          </button>
        </div>

        {testResponseStatus && (
          <div style={{ backgroundColor: "white", padding: "12px", borderRadius: "6px", border: "1px solid #e5e7eb" }}>
            <p style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600" }}>
              Status: <span data-testid="test-response-status" style={{ fontFamily: "monospace", color: testResponseStatus === "200" ? "#16a34a" : "#dc2626" }}>{testResponseStatus}</span>
            </p>
            <pre 
              data-testid="test-response-body" 
              style={{ margin: 0, padding: "8px", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "4px", fontSize: "13px", overflowX: "auto", fontFamily: "monospace", whiteSpace: "pre-wrap" }}
            >
              {testResponseBody}
            </pre>
          </div>
        )}
      </section>
    </div>
  );
}
