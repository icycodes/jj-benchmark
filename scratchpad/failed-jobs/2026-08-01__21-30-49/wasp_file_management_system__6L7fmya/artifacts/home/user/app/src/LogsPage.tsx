import { useQuery } from "wasp/client/operations";
import { getAccessLogs } from "wasp/client/operations";
import { Link } from "react-router";
import "./Main.css";

export function LogsPage() {
  const { data: logs, isLoading, error } = useQuery(getAccessLogs, {});

  if (isLoading) return <div className="loading">Loading Access Logs...</div>;
  if (error) return <div className="error-message">Error: {error.message}</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Wasp Drive - Access Logs</h1>
        </div>
        <div className="header-right">
          <Link to="/" className="nav-link">Dashboard</Link>
          <Link to="/logs" className="nav-link active">Access Logs</Link>
        </div>
      </header>

      <div className="logs-content">
        <h2>File Access History</h2>
        {logs && logs.length === 0 ? (
          <p className="empty-text">No download logs available yet.</p>
        ) : (
          <div data-testid="logs-container" className="logs-container">
            {logs?.map((log: any) => (
              <div key={log.id} className="log-item">
                <div className="log-item-header">
                  <span className="log-file-icon">📄</span>
                  <span className="log-file-name">{log.fileName}</span>
                </div>
                <div className="log-item-details">
                  <p><strong>Timestamp:</strong> {new Date(log.timestamp).toLocaleString()}</p>
                  <p><strong>IP Address:</strong> {log.ipAddress}</p>
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
