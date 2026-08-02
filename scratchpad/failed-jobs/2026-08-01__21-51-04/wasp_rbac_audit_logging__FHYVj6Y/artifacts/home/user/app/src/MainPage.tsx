import { useState } from "react";
import { logout } from "wasp/client/auth";
import {
  useQuery,
  getDocuments,
  getAuditLogs,
  createDocument,
  updateDocument,
  deleteDocument,
} from "wasp/client/operations";
import "./Main.css";

export function MainPage({ user }: { user: any }) {
  const { data: documents, isLoading: docsLoading, error: docsError } = useQuery(getDocuments);
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      await createDocument({ title: docTitle, content: docContent });
      setDocTitle("");
      setDocContent("");
    } catch (err: any) {
      setActionError(err.message || "Failed to create document");
    }
  };

  const handleUpdateDoc = async (doc: any) => {
    setActionError(null);
    try {
      await updateDocument({
        id: doc.id,
        title: `${doc.title} (updated)`,
        content: `${doc.content} (updated)`,
      });
    } catch (err: any) {
      setActionError(err.message || "Failed to update document");
    }
  };

  const handleDeleteDoc = async (docId: number) => {
    setActionError(null);
    try {
      await deleteDocument({ id: docId });
    } catch (err: any) {
      setActionError(err.message || "Failed to delete document");
    }
  };

  const username = user?.identities?.username?.id || user?.username || "User";

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "15px", marginBottom: "20px" }}>
        <div>
          <h1 style={{ margin: 0 }}>Enterprise Dashboard</h1>
          <p style={{ margin: "5px 0 0 0" }}>Welcome, <strong>{username}</strong></p>
          <p id="user-role" style={{ margin: "5px 0 0 0", color: "#666" }}>Role: {user?.role}</p>
        </div>
        <button id="logout-btn" onClick={logout} style={{ padding: "8px 16px", backgroundColor: "#dc3545", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          Logout
        </button>
      </div>

      {actionError && (
        <div style={{ padding: "10px", backgroundColor: "#f8d7da", color: "#721c24", borderRadius: "4px", marginBottom: "20px" }}>
          {actionError}
        </div>
      )}

      {(user?.role === "MANAGER" || user?.role === "ADMIN") && (
        <div style={{ backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "8px", marginBottom: "30px" }}>
          <h3 style={{ marginTop: 0 }}>Create New Document</h3>
          <form onSubmit={handleCreateDoc}>
            <div style={{ marginBottom: "15px" }}>
              <label htmlFor="doc-title" style={{ display: "block", marginBottom: "5px" }}>Title</label>
              <input
                id="doc-title"
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                required
                style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label htmlFor="doc-content" style={{ display: "block", marginBottom: "5px" }}>Content</label>
              <textarea
                id="doc-content"
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                required
                style={{ width: "100%", padding: "8px", boxSizing: "border-box", minHeight: "100px" }}
              />
            </div>
            <button id="create-doc-btn" type="submit" style={{ padding: "10px 20px", backgroundColor: "#28a745", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
              Create Document
            </button>
          </form>
        </div>
      )}

      <div style={{ marginBottom: "30px" }}>
        <h2>Documents</h2>
        {docsLoading && <p>Loading documents...</p>}
        {docsError && <p style={{ color: "red" }}>Error loading documents: {docsError.message}</p>}
        {documents && documents.length === 0 && <p>No documents found.</p>}
        {documents && documents.length > 0 && (
          <div style={{ display: "grid", gap: "15px" }}>
            {documents.map((doc: any) => (
              <div key={doc.id} style={{ border: "1px solid #eee", padding: "15px", borderRadius: "6px" }}>
                <h4 style={{ margin: "0 0 10px 0" }}>{doc.title}</h4>
                <p style={{ margin: "0 0 15px 0", color: "#333" }}>{doc.content}</p>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    data-testid={`update-doc-btn-${doc.id}`}
                    onClick={() => handleUpdateDoc(doc)}
                    style={{ padding: "6px 12px", backgroundColor: "#ffc107", color: "#000", border: "none", borderRadius: "4px", cursor: "pointer" }}
                  >
                    Update
                  </button>
                  {user?.role === "ADMIN" && (
                    <button
                      data-testid={`delete-doc-btn-${doc.id}`}
                      onClick={() => handleDeleteDoc(doc.id)}
                      style={{ padding: "6px 12px", backgroundColor: "#dc3545", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {user?.role === "ADMIN" && <AuditLogsSection />}
    </div>
  );
}

function AuditLogsSection() {
  const { data: logs, isLoading, error } = useQuery(getAuditLogs);

  return (
    <div style={{ marginTop: "40px", borderTop: "2px solid #eee", paddingTop: "20px" }}>
      <h2>System Audit Logs</h2>
      {isLoading && <p>Loading audit logs...</p>}
      {error && <p style={{ color: "red" }}>Error loading audit logs: {error.message}</p>}
      {logs && logs.length === 0 && <p>No audit logs available.</p>}
      {logs && logs.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {logs.map((log: any) => (
            <div
              key={log.id}
              data-testid="audit-log-item"
              style={{
                border: "1px solid #ddd",
                padding: "10px 15px",
                borderRadius: "4px",
                backgroundColor: "#f9f9f9",
                fontFamily: "monospace",
                fontSize: "13px",
              }}
            >
              <div><strong>Action:</strong> {log.action}</div>
              <div><strong>Entity Name:</strong> {log.entityName}</div>
              <div><strong>Entity ID:</strong> {log.entityId}</div>
              <div><strong>User ID:</strong> {log.userId}</div>
              <div><strong>Payload:</strong> {log.payload}</div>
              <div style={{ color: "#888", fontSize: "11px", marginTop: "5px" }}>
                {new Date(log.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
