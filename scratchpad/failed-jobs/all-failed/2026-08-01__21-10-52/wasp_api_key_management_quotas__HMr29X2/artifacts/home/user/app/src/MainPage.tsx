import { useState } from "react";
import { logout } from "wasp/client/auth";
import { getApiKeys, createApiKey, deleteApiKey, useQuery } from "wasp/client/operations";
import { config } from "wasp/client";

export function MainPage() {
  const { data: apiKeys, isLoading, error, refetch } = useQuery(getApiKeys);
  const [keyName, setKeyName] = useState("");
  const [keyQuota, setKeyQuota] = useState("");
  
  // Test section states
  const [testKey, setTestKey] = useState("");
  const [testResponseStatus, setTestResponseStatus] = useState("");
  const [testResponseBody, setTestResponseBody] = useState("");

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName || !keyQuota) {
      alert("Please fill in all fields");
      return;
    }
    try {
      await createApiKey({ name: keyName, quota: Number(keyQuota) });
      setKeyName("");
      setKeyQuota("");
      refetch();
    } catch (err: any) {
      alert(err.message || "Failed to create API key");
    }
  };

  const handleDeleteKey = async (id: number) => {
    if (confirm("Are you sure you want to delete this API key?")) {
      try {
        await deleteApiKey({ id });
        refetch();
      } catch (err: any) {
        alert(err.message || "Failed to delete API key");
      }
    }
  };

  const handleSendTestRequest = async () => {
    if (!testKey) {
      alert("Please enter an API Key to test");
      return;
    }
    setTestResponseStatus("Sending...");
    setTestResponseBody("");
    try {
      const response = await fetch(`${config.apiUrl}/api/request`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${testKey}`,
        },
      });
      setTestResponseStatus(response.status.toString());
      const body = await response.text();
      setTestResponseBody(body);
      refetch(); // Automatically refresh after testing so logs update!
    } catch (err: any) {
      setTestResponseStatus("Error");
      setTestResponseBody(err.message || "Request failed");
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "20px", fontFamily: "sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid #ccc", paddingBottom: "15px" }}>
        <h1>API Key Management Portal</h1>
        <button onClick={logout} style={{ padding: "8px 16px", cursor: "pointer" }}>Logout</button>
      </header>

      {/* Create API Key Section */}
      <section style={{ marginBottom: "40px", padding: "20px", border: "1px solid #ddd", borderRadius: "8px" }}>
        <h2>Create API Key</h2>
        <form onSubmit={handleCreateKey} style={{ display: "flex", gap: "15px", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label htmlFor="key-name">Key Name</label>
            <input
              type="text"
              id="key-name"
              data-testid="key-name"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="e.g. Production Key"
              style={{ padding: "8px", width: "200px" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label htmlFor="key-quota">Quota (Lifetime Limit)</label>
            <input
              type="number"
              id="key-quota"
              data-testid="key-quota"
              value={keyQuota}
              onChange={(e) => setKeyQuota(e.target.value)}
              placeholder="e.g. 100"
              style={{ padding: "8px", width: "150px" }}
            />
          </div>
          <button
            type="submit"
            id="generate-key-btn"
            data-testid="generate-key-btn"
            style={{ padding: "10px 20px", cursor: "pointer", backgroundColor: "#0070f3", color: "#fff", border: "none", borderRadius: "4px" }}
          >
            Generate Key
          </button>
        </form>
      </section>

      {/* Test API Key Section */}
      <section style={{ marginBottom: "40px", padding: "20px", border: "1px solid #ddd", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
        <h2>Test API Key</h2>
        <p style={{ fontSize: "14px", color: "#666" }}>Make requests to <code>GET /api/request</code> directly from the browser.</p>
        <div style={{ display: "flex", gap: "15px", alignItems: "flex-end", marginBottom: "15px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: 1 }}>
            <label htmlFor="test-api-key">API Key</label>
            <input
              type="text"
              id="test-api-key"
              data-testid="test-api-key"
              value={testKey}
              onChange={(e) => setTestKey(e.target.value)}
              placeholder="Paste sk_... key here"
              style={{ padding: "8px" }}
            />
          </div>
          <button
            id="send-test-request-btn"
            data-testid="send-test-request-btn"
            onClick={handleSendTestRequest}
            style={{ padding: "10px 20px", cursor: "pointer", backgroundColor: "#22c55e", color: "#fff", border: "none", borderRadius: "4px" }}
          >
            Send Test Request
          </button>
        </div>
        <div style={{ display: "flex", gap: "20px" }}>
          <div style={{ flex: 1, border: "1px solid #eee", padding: "10px", borderRadius: "4px", backgroundColor: "#fff" }}>
            <strong>Response Status:</strong>
            <div data-testid="test-response-status" style={{ marginTop: "5px", fontWeight: "bold", color: testResponseStatus === "200" ? "#22c55e" : "#ef4444" }}>
              {testResponseStatus}
            </div>
          </div>
          <div style={{ flex: 2, border: "1px solid #eee", padding: "10px", borderRadius: "4px", backgroundColor: "#fff" }}>
            <strong>Response Body:</strong>
            <pre data-testid="test-response-body" style={{ marginTop: "5px", whiteSpace: "pre-wrap", wordBreak: "break-all", fontSize: "12px", margin: 0 }}>
              {testResponseBody}
            </pre>
          </div>
        </div>
      </section>

      {/* API Keys List Section */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2>Your API Keys</h2>
          <button
            data-testid="refresh-btn"
            onClick={() => refetch()}
            style={{ padding: "8px 16px", cursor: "pointer" }}
          >
            Refresh
          </button>
        </div>

        {isLoading && <p>Loading API keys...</p>}
        {error && <p style={{ color: "red" }}>Error: {error.message}</p>}

        {!isLoading && !error && (!apiKeys || apiKeys.length === 0) && (
          <p>No API keys created yet. Use the form above to generate your first key.</p>
        )}

        {!isLoading && !error && apiKeys && apiKeys.map((keyItem: any) => (
          <div
            key={keyItem.id}
            data-testid="api-key-item"
            style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "20px", marginBottom: "20px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
              <div>
                <h3 data-testid="key-name-display" style={{ margin: "0 0 5px 0" }}>{keyItem.name}</h3>
                <code data-testid="key-value-display" style={{ backgroundColor: "#eee", padding: "2px 6px", borderRadius: "4px", fontSize: "14px" }}>
                  {keyItem.key}
                </code>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <span data-testid="key-usage-display" style={{ fontWeight: "bold" }}>
                  {keyItem.usage} / {keyItem.quota}
                </span>
                <button
                  data-testid="delete-key-btn"
                  onClick={() => handleDeleteKey(keyItem.id)}
                  style={{ padding: "5px 10px", cursor: "pointer", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "4px" }}
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Logs List */}
            <div style={{ borderTop: "1px solid #eee", paddingTop: "15px" }}>
              <h4 style={{ margin: "0 0 10px 0" }}>Request Logs</h4>
              <ul data-testid="key-logs-list" style={{ listStyleType: "none", padding: 0, margin: 0 }}>
                {!keyItem.logs || keyItem.logs.length === 0 ? (
                  <li style={{ color: "#666", fontSize: "14px" }}>No logs yet</li>
                ) : (
                  keyItem.logs.map((log: any) => (
                    <li
                      key={log.id}
                      data-testid="log-item"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "6px 10px",
                        borderBottom: "1px solid #f0f0f0",
                        fontSize: "14px",
                      }}
                    >
                      <span>{log.endpoint}</span>
                      <span style={{ fontWeight: "bold", color: log.status === 200 ? "#22c55e" : "#ef4444" }}>
                        {log.status}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
