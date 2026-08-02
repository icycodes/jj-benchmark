import React, { useState } from "react";
import { useQuery, createApiKey, deleteApiKey } from "wasp/client/operations";
import { getApiKeys } from "wasp/client/operations";
import { logout } from "wasp/client/auth";

export function MainPage() {
  const { data: apiKeys, isLoading, error, refetch } = useQuery(getApiKeys);

  const [keyName, setKeyName] = useState("");
  const [keyQuota, setKeyQuota] = useState("");

  const [testApiKey, setTestApiKey] = useState("");
  const [testResponseStatus, setTestResponseStatus] = useState<number | null>(null);
  const [testResponseBody, setTestResponseBody] = useState("");

  const [actionError, setActionError] = useState("");

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    if (!keyName) {
      setActionError("Key name is required");
      return;
    }
    const quotaNum = parseInt(keyQuota, 10);
    if (isNaN(quotaNum) || quotaNum <= 0) {
      setActionError("Quota must be a positive number");
      return;
    }

    try {
      await createApiKey({ name: keyName, quota: quotaNum });
      setKeyName("");
      setKeyQuota("");
    } catch (err: any) {
      setActionError(err.message || "Failed to create API key");
    }
  };

  const handleDeleteKey = async (id: number) => {
    setActionError("");
    try {
      await deleteApiKey({ id });
    } catch (err: any) {
      setActionError(err.message || "Failed to delete API key");
    }
  };

  const handleSendTestRequest = async () => {
    setTestResponseStatus(null);
    setTestResponseBody("");
    try {
      const serverUrl = "http://localhost:3001";
      const url = `${serverUrl}/api/request`;
      const headers: HeadersInit = {};
      if (testApiKey) {
        headers["Authorization"] = `Bearer ${testApiKey}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      setTestResponseStatus(response.status);
      const text = await response.text();
      setTestResponseBody(text);
    } catch (err: any) {
      setTestResponseStatus(500);
      setTestResponseBody(err.message || "Network error");
    }
  };

  return (
    <div style={{ fontFamily: "sans-serif", padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "20px" }}>
        <h1>API Key Management Portal</h1>
        <button onClick={logout} style={{ padding: "8px 16px", cursor: "pointer" }}>Logout</button>
      </header>

      {actionError && (
        <div style={{ color: "red", backgroundColor: "#ffebee", padding: "10px", borderRadius: "4px", marginBottom: "20px" }}>
          {actionError}
        </div>
      )}

      {/* Create API Key Form */}
      <section style={{ backgroundColor: "#f9f9f9", padding: "20px", borderRadius: "8px", marginBottom: "30px" }}>
        <h3>Create API Key</h3>
        <form onSubmit={handleCreateKey} style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label htmlFor="key-name">Key Name</label>
            <input
              type="text"
              id="key-name"
              data-testid="key-name"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="e.g., Production Key"
              style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label htmlFor="key-quota">Quota</label>
            <input
              type="number"
              id="key-quota"
              data-testid="key-quota"
              value={keyQuota}
              onChange={(e) => setKeyQuota(e.target.value)}
              placeholder="e.g., 100"
              style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </div>
          <button
            type="submit"
            id="generate-key-btn"
            data-testid="generate-key-btn"
            style={{ padding: "8px 16px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            Generate Key
          </button>
        </form>
      </section>

      {/* API Keys List */}
      <section style={{ marginBottom: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3>Your API Keys</h3>
          <button
            data-testid="refresh-btn"
            onClick={() => refetch()}
            style={{ padding: "6px 12px", cursor: "pointer" }}
          >
            Refresh
          </button>
        </div>

        {isLoading && <p>Loading API keys...</p>}
        {error && <p style={{ color: "red" }}>Error loading API keys: {error.message}</p>}

        {apiKeys && apiKeys.length === 0 && <p>No API keys generated yet.</p>}

        {apiKeys && apiKeys.map((apiKey: any) => (
          <div
            key={apiKey.id}
            data-testid="api-key-item"
            style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "15px", marginBottom: "15px", backgroundColor: "#fff" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
              <div>
                <h4 data-testid="key-name-display" style={{ margin: "0 0 5px 0" }}>{apiKey.name}</h4>
                <code data-testid="key-value-display" style={{ backgroundColor: "#eee", padding: "2px 6px", borderRadius: "4px" }}>{apiKey.key}</code>
              </div>
              <div style={{ textAlign: "right" }}>
                <div data-testid="key-usage-display" style={{ fontWeight: "bold", marginBottom: "5px" }}>
                  {apiKey.usage} / {apiKey.quota}
                </div>
                <button
                  data-testid="delete-key-btn"
                  onClick={() => handleDeleteKey(apiKey.id)}
                  style={{ padding: "4px 8px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Logs List */}
            <div style={{ marginTop: "15px", borderTop: "1px solid #eee", paddingTop: "10px" }}>
              <h5 style={{ margin: "0 0 8px 0" }}>Request Logs</h5>
              <ul data-testid="key-logs-list" style={{ listStyle: "none", padding: 0, margin: 0, maxHeight: "150px", overflowY: "auto" }}>
                {apiKey.logs && apiKey.logs.length === 0 && (
                  <li style={{ color: "#777", fontSize: "14px" }}>No requests logged yet.</li>
                )}
                {apiKey.logs && apiKey.logs.map((log: any) => (
                  <li
                    key={log.id}
                    data-testid="log-item"
                    style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "14px", borderBottom: "1px dashed #eee" }}
                  >
                    <span>{log.endpoint}</span>
                    <span style={{ fontWeight: "bold", color: log.status === 200 ? "green" : "red" }}>{log.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </section>

      {/* Test API Key Section */}
      <section style={{ backgroundColor: "#f1f3f5", padding: "20px", borderRadius: "8px" }}>
        <h3>Test API Key</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label htmlFor="test-api-key">API Key</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                id="test-api-key"
                data-testid="test-api-key"
                value={testApiKey}
                onChange={(e) => setTestApiKey(e.target.value)}
                placeholder="Paste your sk_... key here"
                style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              />
              <button
                id="send-test-request-btn"
                data-testid="send-test-request-btn"
                onClick={handleSendTestRequest}
                style={{ padding: "8px 16px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
              >
                Send Test Request
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "20px" }}>
            <div style={{ flex: 1 }}>
              <strong>Response Status:</strong>
              <div
                data-testid="test-response-status"
                style={{ padding: "10px", backgroundColor: "#fff", border: "1px solid #ccc", borderRadius: "4px", marginTop: "5px", minHeight: "20px", fontWeight: "bold" }}
              >
                {testResponseStatus !== null ? testResponseStatus : ""}
              </div>
            </div>
            <div style={{ flex: 2 }}>
              <strong>Response Body:</strong>
              <pre
                data-testid="test-response-body"
                style={{ padding: "10px", backgroundColor: "#fff", border: "1px solid #ccc", borderRadius: "4px", marginTop: "5px", minHeight: "20px", overflowX: "auto", margin: 0 }}
              >
                {testResponseBody}
              </pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
