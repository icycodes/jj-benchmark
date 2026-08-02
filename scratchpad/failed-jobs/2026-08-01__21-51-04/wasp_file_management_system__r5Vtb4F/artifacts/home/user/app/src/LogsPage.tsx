import { useQuery, getAccessLogs } from "wasp/client/operations";
import { Link } from "react-router";
import "./Main.css";

export function LogsPage() {
  const { data: logs, isLoading, error } = useQuery(getAccessLogs);

  if (isLoading) return <div className="loading">Loading access logs...</div>;
  if (error) return <div className="error">Error loading access logs: {String(error)}</div>;

  return (
    <div className="logs-page-container">
      <header className="dashboard-header">
        <h1>Access Logs</h1>
        <Link to="/" className="btn btn-secondary">Back to Dashboard</Link>
      </header>

      <div className="logs-content" data-testid="logs-container">
        {!logs || logs.length === 0 ? (
          <p className="empty-text">No download logs yet.</p>
        ) : (
          <div className="logs-list">
            {logs.map((log: any) => (
              <div key={log.id} className="log-item">
                <div className="log-header">
                  <span className="log-file">📄 {log.file.name}</span>
                  <span className="log-time">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <div className="log-details">
                  <p><strong>IP Address:</strong> {log.ip}</p>
                  <p><strong>User-Agent:</strong> {log.userAgent}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
