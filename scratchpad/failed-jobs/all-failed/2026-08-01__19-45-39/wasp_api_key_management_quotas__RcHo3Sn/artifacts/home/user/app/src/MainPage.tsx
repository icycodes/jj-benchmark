import { useState } from "react";
import type { AuthUser } from "wasp/auth";
import { logout } from "wasp/client/auth";
import { useQuery, getApiKeys, createApiKey, deleteApiKey } from "wasp/client/operations";
import { api } from "wasp/client/api";
import "./Main.css";

export function MainPage({ user }: { user: AuthUser }) {
  const { data: apiKeys, isLoading, error, refetch } = useQuery(getApiKeys);

  const [keyName, setKeyName] = useState("");
  const [keyQuota, setKeyQuota] = useState<number | "">(5);

  const [testApiKey, setTestApiKey] = useState("");
  const [testResponseStatus, setTestResponseStatus] = useState<string>("");
  const [testResponseBody, setTestResponseBody] = useState<string>("");

  async function handleGenerateKey() {
    if (!keyName.trim() || keyQuota === "" || Number(keyQuota) <= 0) {
      return;
    }
    const newKey = await createApiKey({
      name: keyName.trim(),
      quota: Number(keyQuota),
    });
    setKeyName("");
    setKeyQuota(5);
    setTestApiKey(newKey.key);
    await refetch();
  }

  async function handleDeleteKey(id: number) {
    await deleteApiKey({ id });
    await refetch();
  }

  async function handleSendTestRequest() {
    setTestResponseStatus("");
    setTestResponseBody("");
    try {
      const response = await api.get("/api/request", {
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
        throwHttpErrors: false,
      });
      const status = response.status;
      const bodyText = await response.text();
      setTestResponseStatus(String(status));
      setTestResponseBody(bodyText);
    } catch (e) {
      setTestResponseStatus("error");
      setTestResponseBody(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <main className="container">
      <div className="header-row">
        <h2 className="title">Developer API Key Management Portal</h2>
        <div>
          <span>Logged in as {user.identities.username?.id}</span>{" "}
          <button onClick={() => logout()}>Logout</button>
        </div>
      </div>

      <button data-testid="refresh-btn" onClick={() => refetch()}>
        Refresh
      </button>

      <section>
        <h3>Generate a new API Key</h3>
        <div className="form-row">
          <label htmlFor="key-name">Name</label>
          <input
            type="text"
            id="key-name"
            data-testid="key-name"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label htmlFor="key-quota">Quota</label>
          <input
            type="number"
            id="key-quota"
            data-testid="key-quota"
            value={keyQuota}
            onChange={(e) =>
              setKeyQuota(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </div>
        <button
          id="generate-key-btn"
          data-testid="generate-key-btn"
          onClick={handleGenerateKey}
        >
          Generate Key
        </button>
      </section>

      <section>
        <h3>Your API Keys</h3>
        {isLoading && <p>Loading...</p>}
        {error && <p>Error loading API keys: {error.message}</p>}
        <ul className="api-key-list">
          {apiKeys?.map((apiKey) => (
            <li key={apiKey.id} data-testid="api-key-item">
              <div>
                <strong data-testid="key-name-display">{apiKey.name}</strong>
              </div>
              <div>
                Key: <code data-testid="key-value-display">{apiKey.key}</code>
              </div>
              <div data-testid="key-usage-display">
                {apiKey.usage} / {apiKey.quota}
              </div>
              <button
                data-testid="delete-key-btn"
                onClick={() => handleDeleteKey(apiKey.id)}
              >
                Delete
              </button>
              <div data-testid="key-logs-list">
                <h4>Logs</h4>
                <ul>
                  {apiKey.logs?.map((log) => (
                    <li key={log.id} data-testid="log-item">
                      {log.endpoint} - {log.status}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Test API Key</h3>
        <div className="form-row">
          <label htmlFor="test-api-key">API Key</label>
          <input
            type="text"
            id="test-api-key"
            data-testid="test-api-key"
            value={testApiKey}
            onChange={(e) => setTestApiKey(e.target.value)}
          />
        </div>
        <button
          id="send-test-request-btn"
          data-testid="send-test-request-btn"
          onClick={handleSendTestRequest}
        >
          Send Test Request
        </button>
        <div>
          Status: <span data-testid="test-response-status">{testResponseStatus}</span>
        </div>
        <div>
          Body: <pre data-testid="test-response-body">{testResponseBody}</pre>
        </div>
      </section>
    </main>
  );
}
