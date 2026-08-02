import { useState } from "react";
import { useQuery } from "wasp/client/operations";
import { getApiKeys } from "wasp/client/operations";
import { createApiKey } from "wasp/client/operations";
import { deleteApiKey } from "wasp/client/operations";
import { logout } from "wasp/client/auth";
import "./Main.css";

export function MainPage() {
  const { data: apiKeys, isLoading, refetch } = useQuery(getApiKeys);

  const [keyName, setKeyName] = useState("");
  const [keyQuota, setKeyQuota] = useState<number>(5);

  const [testApiKey, setTestApiKey] = useState("");
  const [testResponseStatus, setTestResponseStatus] = useState("");
  const [testResponseBody, setTestResponseBody] = useState("");

  const handleCreateKey = async () => {
    if (!keyName || keyQuota < 1) return;
    try {
      await createApiKey({ name: keyName, quota: keyQuota });
      setKeyName("");
      setKeyQuota(5);
      refetch();
    } catch (err: any) {
      alert(err.message || "Failed to create API key");
    }
  };

  const handleDeleteKey = async (id: number) => {
    try {
      await deleteApiKey({ id });
      refetch();
    } catch (err: any) {
      alert(err.message || "Failed to delete API key");
    }
  };

  const handleSendTestRequest = async () => {
    if (!testApiKey) {
      setTestResponseStatus("401");
      setTestResponseBody(JSON.stringify({ error: "Invalid API key" }));
      return;
    }
    try {
      const response = await fetch(
        `/api/request?apiKey=${encodeURIComponent(testApiKey)}`
      );
      const status = response.status.toString();
      setTestResponseStatus(status);
      try {
        const body = await response.json();
        setTestResponseBody(JSON.stringify(body));
      } catch {
        setTestResponseBody("");
      }
    } catch (err: any) {
      setTestResponseStatus("Error");
      setTestResponseBody(err.message || "Request failed");
    }
  };

  return (
    <main className="container">
      <div className="header">
        <h1>Developer API Key Management Portal</h1>
        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </div>

      {/* Create API Key Form */}
      <section className="section">
        <h2>Create New API Key</h2>
        <div className="form-row">
          <label htmlFor="key-name">Key Name:</label>
          <input
            type="text"
            id="key-name"
            data-testid="key-name"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="My API Key"
          />
        </div>
        <div className="form-row">
          <label htmlFor="key-quota">Quota:</label>
          <input
            type="number"
            id="key-quota"
            data-testid="key-quota"
            value={keyQuota}
            onChange={(e) => setKeyQuota(parseInt(e.target.value) || 0)}
            min={1}
          />
        </div>
        <button
          id="generate-key-btn"
          data-testid="generate-key-btn"
          onClick={handleCreateKey}
        >
          Generate Key
        </button>
      </section>

      {/* API Keys List */}
      <section className="section">
        <div className="section-header">
          <h2>Your API Keys</h2>
          <button
            data-testid="refresh-btn"
            onClick={() => refetch()}
            className="refresh-btn"
          >
            Refresh
          </button>
        </div>
        {isLoading && <p>Loading...</p>}
        {!isLoading && (!apiKeys || apiKeys.length === 0) && (
          <p>No API keys yet. Create one above.</p>
        )}
        {apiKeys &&
          apiKeys.map((key) => (
            <div key={key.id} data-testid="api-key-item" className="api-key-item">
              <div className="key-info">
                <span className="key-label">Name:</span>
                <span data-testid="key-name-display">{key.name}</span>
              </div>
              <div className="key-info">
                <span className="key-label">Key:</span>
                <code data-testid="key-value-display">{key.key}</code>
              </div>
              <div className="key-info">
                <span className="key-label">Usage:</span>
                <span data-testid="key-usage-display">
                  {key.usage} / {key.quota}
                </span>
              </div>
              <div className="key-info">
                <span className="key-label">Logs:</span>
                <ul data-testid="key-logs-list" className="logs-list">
                  {key.logs && key.logs.length > 0 ? (
                    key.logs.map((log) => (
                      <li key={log.id} data-testid="log-item">
                        {log.endpoint} - {log.status}
                      </li>
                    ))
                  ) : (
                    <li>No logs yet</li>
                  )}
                </ul>
              </div>
              <button
                data-testid="delete-key-btn"
                className="delete-btn"
                onClick={() => handleDeleteKey(key.id)}
              >
                Delete
              </button>
            </div>
          ))}
      </section>

      {/* Test API Key Section */}
      <section className="section">
        <h2>Test API Key</h2>
        <div className="form-row">
          <label htmlFor="test-api-key">API Key:</label>
          <input
            type="text"
            id="test-api-key"
            data-testid="test-api-key"
            value={testApiKey}
            onChange={(e) => setTestApiKey(e.target.value)}
            placeholder="sk_..."
          />
        </div>
        <button
          id="send-test-request-btn"
          data-testid="send-test-request-btn"
          onClick={handleSendTestRequest}
        >
          Send Test Request
        </button>
        <div className="test-results">
          <div className="result-row">
            <span className="result-label">Response Status:</span>
            <span data-testid="test-response-status">{testResponseStatus}</span>
          </div>
          <div className="result-row">
            <span className="result-label">Response Body:</span>
            <pre data-testid="test-response-body">{testResponseBody}</pre>
          </div>
        </div>
      </section>
    </main>
  );
}
