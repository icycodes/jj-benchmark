import { useState } from "react";
import { useAuth, logout } from "wasp/client/auth";
import { useQuery, getDocuments, getAuditLogs, createDocument, updateDocument, deleteDocument } from "wasp/client/operations";

export function MainPage() {
  const { data: user } = useAuth();
  const { data: documents, isLoading: isDocsLoading } = useQuery(getDocuments);
  
  // Conditionally enable getAuditLogs only for ADMIN
  const { data: auditLogs, isLoading: isLogsLoading } = useQuery(
    getAuditLogs,
    undefined,
    { enabled: user?.role === "ADMIN" }
  );

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createDocument({ title, content });
      setTitle("");
      setContent("");
    } catch (err: any) {
      setError(err?.message || "Failed to create document");
    }
  };

  const handleUpdateDoc = async (doc: any) => {
    setError(null);
    try {
      await updateDocument({
        id: doc.id,
        title: `${doc.title} (updated)`,
        content: `${doc.content} (updated)`,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to update document");
    }
  };

  const handleDeleteDoc = async (id: number) => {
    setError(null);
    try {
      await deleteDocument({ id });
    } catch (err: any) {
      setError(err?.message || "Failed to delete document");
    }
  };

  if (!user) {
    return <div>Loading user...</div>;
  }

  const isManagerOrAdmin = user.role === "MANAGER" || user.role === "ADMIN";
  const isAdmin = user.role === "ADMIN";

  return (
    <main style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
        <div>
          <h1>Enterprise Dashboard</h1>
          <p id="user-role" style={{ fontWeight: "bold" }}>Role: {user.role}</p>
        </div>
        <button id="logout-btn" onClick={logout} style={{ padding: "8px 16px", background: "#eaeaea", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer" }}>
          Logout
        </button>
      </header>

      {error && (
        <div style={{ color: "red", padding: "10px", border: "1px solid red", borderRadius: "4px", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {/* Document Creation Form (only visible/enabled for MANAGER and ADMIN roles) */}
      {isManagerOrAdmin && (
        <section style={{ marginBottom: "40px", padding: "20px", border: "1px solid #ddd", borderRadius: "8px" }}>
          <h2>Create Document</h2>
          <form onSubmit={handleCreateDoc}>
            <div style={{ marginBottom: "10px" }}>
              <label htmlFor="doc-title">Title:</label>
              <input
                type="text"
                id="doc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{ width: "100%", padding: "8px", marginTop: "4px" }}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label htmlFor="doc-content">Content:</label>
              <textarea
                id="doc-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={4}
                style={{ width: "100%", padding: "8px", marginTop: "4px" }}
              />
            </div>
            <button type="submit" id="create-doc-btn" style={{ padding: "10px 20px", background: "#0070f3", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
              Create Document
            </button>
          </form>
        </section>
      )}

      {/* Document List */}
      <section style={{ marginBottom: "40px" }}>
        <h2>Documents</h2>
        {isDocsLoading ? (
          <div>Loading documents...</div>
        ) : !documents || documents.length === 0 ? (
          <p>No documents found.</p>
        ) : (
          <div style={{ display: "grid", gap: "15px" }}>
            {documents.map((doc: any) => (
              <div key={doc.id} style={{ padding: "15px", border: "1px solid #eee", borderRadius: "6px" }}>
                <h3>{doc.title}</h3>
                <p>{doc.content}</p>
                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  {isManagerOrAdmin && (
                    <button
                      data-testid={`update-doc-btn-${doc.id}`}
                      onClick={() => handleUpdateDoc(doc)}
                      style={{ padding: "6px 12px", background: "#4caf50", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
                    >
                      Update
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      data-testid={`delete-doc-btn-${doc.id}`}
                      onClick={() => handleDeleteDoc(doc.id)}
                      style={{ padding: "6px 12px", background: "#f44336", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Audit Logs Section (only visible/accessible for ADMIN role) */}
      {isAdmin && (
        <section style={{ borderTop: "2px solid #eee", paddingTop: "20px" }}>
          <h2>Audit Logs</h2>
          {isLogsLoading ? (
            <div>Loading audit logs...</div>
          ) : !auditLogs || auditLogs.length === 0 ? (
            <p>No audit logs found.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
              <thead>
                <tr style={{ background: "#f9f9f9", borderBottom: "1px solid #ddd" }}>
                  <th style={{ padding: "8px", textAlign: "left" }}>Action</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Entity Name</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Entity ID</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>User ID</th>
                  <th style={{ padding: "8px", textAlign: "left" }}>Payload</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log: any) => (
                  <tr key={log.id} data-testid="audit-log-item" style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "8px" }}>{log.action}</td>
                    <td style={{ padding: "8px" }}>{log.entityName}</td>
                    <td style={{ padding: "8px" }}>{log.entityId}</td>
                    <td style={{ padding: "8px" }}>{log.userId}</td>
                    <td style={{ padding: "8px", fontFamily: "monospace", fontSize: "12px" }}>{log.payload}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </main>
  );
}
