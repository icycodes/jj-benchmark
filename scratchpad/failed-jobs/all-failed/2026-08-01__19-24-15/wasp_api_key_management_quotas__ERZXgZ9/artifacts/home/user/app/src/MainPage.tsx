import { useState } from 'react';
import type { AuthUser } from 'wasp/auth';
import { logout } from 'wasp/client/auth';
import { useQuery, getApiKeys, createApiKey, deleteApiKey } from 'wasp/client/operations';
import { api } from 'wasp/client/api';

export function MainPage({ user }: { user: AuthUser }) {
  const { data: apiKeys, isLoading, error, refetch } = useQuery(getApiKeys);

  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyQuota, setNewKeyQuota] = useState('');
  const [testApiKey, setTestApiKey] = useState('');
  const [testResponseStatus, setTestResponseStatus] = useState('');
  const [testResponseBody, setTestResponseBody] = useState('');
  const [formError, setFormError] = useState('');

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!newKeyName.trim()) {
      setFormError('Name is required');
      return;
    }
    const quotaNum = Number(newKeyQuota);
    if (isNaN(quotaNum) || quotaNum < 0 || newKeyQuota === '') {
      setFormError('Quota must be a non-negative number');
      return;
    }

    try {
      await createApiKey({ name: newKeyName, quota: quotaNum });
      setNewKeyName('');
      setNewKeyQuota('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to create API key');
    }
  };

  const handleDeleteKey = async (id: number) => {
    try {
      await deleteApiKey({ id });
    } catch (err: any) {
      alert(err.message || 'Failed to delete API key');
    }
  };

  const handleSendTestRequest = async () => {
    setTestResponseStatus('');
    setTestResponseBody('');

    try {
      const response = await api.get('api/request', {
        headers: testApiKey ? { Authorization: `Bearer ${testApiKey}` } : {},
      });
      const body = await response.json();
      setTestResponseStatus(String(response.status));
      setTestResponseBody(JSON.stringify(body));
      refetch();
    } catch (err: any) {
      if (err.response) {
        setTestResponseStatus(String(err.response.status));
        try {
          const errorBody = await err.response.json();
          setTestResponseBody(JSON.stringify(errorBody));
        } catch {
          setTestResponseBody(await err.response.text());
        }
      } else {
        setTestResponseStatus('Error');
        setTestResponseBody(err.message || 'Request failed');
      }
      refetch();
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto', padding: '20px', color: '#333' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>API Key Management Portal</h1>
          <p style={{ margin: '5px 0 0', color: '#666' }}>Logged in as {user.identities.username?.id || 'User'}</p>
        </div>
        <button 
          onClick={logout}
          style={{ padding: '8px 16px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Logout
        </button>
      </header>

      <main style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Left Column: Key Generation & Test Section */}
        <div>
          {/* Create Key Section */}
          <section style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #e0e0e0', marginBottom: '20px' }}>
            <h2 style={{ marginTop: 0, fontSize: '18px', marginBottom: '15px' }}>Generate New API Key</h2>
            <form onSubmit={handleCreateKey} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label htmlFor="key-name" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Key Name</label>
                <input 
                  type="text" 
                  id="key-name" 
                  data-testid="key-name" 
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Production Key"
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label htmlFor="key-quota" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Usage Quota (Lifetime Limit)</label>
                <input 
                  type="number" 
                  id="key-quota" 
                  data-testid="key-quota" 
                  value={newKeyQuota}
                  onChange={(e) => setNewKeyQuota(e.target.value)}
                  placeholder="e.g. 100"
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              {formError && <p style={{ color: 'red', margin: 0, fontSize: '14px' }}>{formError}</p>}
              <button 
                type="submit"
                id="generate-key-btn" 
                data-testid="generate-key-btn"
                style={{ padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Generate Key
              </button>
            </form>
          </section>

          {/* Test API Key Section */}
          <section style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            <h2 style={{ marginTop: 0, fontSize: '18px', marginBottom: '15px' }}>Test API Key</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label htmlFor="test-api-key" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>API Key</label>
                <input 
                  type="text" 
                  id="test-api-key" 
                  data-testid="test-api-key" 
                  value={testApiKey}
                  onChange={(e) => setTestApiKey(e.target.value)}
                  placeholder="Paste your sk_... key here"
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <button 
                id="send-test-request-btn" 
                data-testid="send-test-request-btn"
                onClick={handleSendTestRequest}
                style={{ padding: '10px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Send Test Request
              </button>

              {/* Responses */}
              <div style={{ marginTop: '10px', borderTop: '1px solid #e0e0e0', paddingTop: '15px' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: '15px' }}>Response</h3>
                <div style={{ marginBottom: '10px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '14px' }}>HTTP Status: </span>
                  <span id="test-response-status" data-testid="test-response-status" style={{ fontWeight: 'bold', color: testResponseStatus === '200' ? '#4CAF50' : '#f44336' }}>
                    {testResponseStatus}
                  </span>
                </div>
                <div>
                  <span style={{ fontWeight: 'bold', fontSize: '14px', display: 'block', marginBottom: '5px' }}>Response Body:</span>
                  <pre 
                    id="test-response-body" 
                    data-testid="test-response-body"
                    style={{ backgroundColor: '#eaeaea', padding: '10px', borderRadius: '4px', overflowX: 'auto', margin: 0, fontSize: '13px', minHeight: '40px' }}
                  >
                    {testResponseBody}
                  </pre>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Key List & Logs */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ margin: 0, fontSize: '20px' }}>Your API Keys</h2>
            <button 
              data-testid="refresh-btn"
              onClick={() => refetch()}
              style={{ padding: '6px 12px', backgroundColor: '#9e9e9e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
            >
              Refresh Keys
            </button>
          </div>

          {isLoading ? (
            <p>Loading API keys...</p>
          ) : error ? (
            <p style={{ color: 'red' }}>Error loading keys: {error.message}</p>
          ) : !apiKeys || apiKeys.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No API keys generated yet. Create one on the left!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {apiKeys.map((keyItem: any) => (
                <div 
                  key={keyItem.id}
                  data-testid="api-key-item"
                  style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '15px', backgroundColor: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <h3 data-testid="key-name-display" style={{ margin: '0 0 5px', fontSize: '16px', color: '#111' }}>
                        {keyItem.name}
                      </h3>
                      <code data-testid="key-value-display" style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: '4px', fontSize: '13px', color: '#e91e63' }}>
                        {keyItem.key}
                      </code>
                    </div>
                    <button 
                      data-testid="delete-key-btn"
                      onClick={() => handleDeleteKey(keyItem.id)}
                      style={{ padding: '4px 8px', backgroundColor: '#ffebee', color: '#d32f2f', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                    >
                      Delete
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#666', borderTop: '1px solid #f5f5f5', paddingTop: '10px', marginTop: '10px' }}>
                    <span>Usage Limit:</span>
                    <strong data-testid="key-usage-display" style={{ color: keyItem.usage >= keyItem.quota ? '#d32f2f' : '#333' }}>
                      {keyItem.usage} / {keyItem.quota}
                    </strong>
                  </div>

                  {/* Logs Section */}
                  <div style={{ marginTop: '12px' }}>
                    <h4 style={{ margin: '0 0 5px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#999' }}>Request Logs</h4>
                    <div 
                      data-testid="key-logs-list"
                      style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: '4px', fontSize: '12px' }}
                    >
                      {!keyItem.logs || keyItem.logs.length === 0 ? (
                        <div style={{ padding: '8px', color: '#999', fontStyle: 'italic', textAlign: 'center' }}>No logs recorded yet</div>
                      ) : (
                        keyItem.logs.map((log: any) => (
                          <div 
                            key={log.id}
                            data-testid="log-item"
                            style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderBottom: '1px solid #f5f5f5', backgroundColor: log.status === 200 ? '#e8f5e9' : '#ffebee' }}
                          >
                            <span>{log.endpoint}</span>
                            <span style={{ fontWeight: 'bold', color: log.status === 200 ? '#2e7d32' : '#c62828' }}>
                              {log.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
