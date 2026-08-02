import React, { useState } from "react";
import { useAuth, logout } from "wasp/client/auth";
import { useQuery, getDocuments, getAuditLogs, createDocument, updateDocument, deleteDocument } from "wasp/client/operations";

export function MainPage() {
  const { data: user, isLoading: authLoading } = useAuth();
  const { data: documents, isLoading: docsLoading } = useQuery(getDocuments);
  
  // Only enable audit logs query for ADMIN users
  const { data: auditLogs, isLoading: logsLoading } = useQuery(
    getAuditLogs,
    undefined,
    { enabled: user?.role === "ADMIN" }
  );

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (authLoading) {
    return <div style={{ padding: "20px" }}>Loading user...</div>;
  }

  if (!user) {
    return <div style={{ padding: "20px" }}>Redirecting to login...</div>;
  }

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createDocument({ title, content });
      setTitle("");
      setContent("");
    } catch (err: any) {
      setError(err.message || "Failed to create document");
    }
  };

  const handleUpdateDocument = async (doc: any) => {
    setError(null);
    try {
      await updateDocument({
        id: doc.id,
        title: `${doc.title} (updated)`,
        content: `${doc.content} (updated)`
      });
    } catch (err: any) {
      setError(err.message || "Failed to update document");
    }
  };

  const handleDeleteDocument = async (id: number) => {
    setError(null);
    try {
      await deleteDocument({ id });
    } catch (err: any) {
      setError(err.message || "Failed to delete document");
    }
  };

  const isManagerOrAdmin = user.role === "MANAGER" || user.role === "ADMIN";
  const isAdmin = user.role === "ADMIN";

  return (
    <div style={{ maxWidth: "800px", margin: "20px auto", padding: "20px", fontFamily: "sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "20px" }}>
        <div>
          <h1>Wasp Enterprise App</h1>
          <p style={{ margin: 0, fontWeight: "bold" }}>Role: {user.role}</p>
        </div>
        <button id="logout-btn" onClick={logout} style={{ padding: "8px 16px", background: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          Logout
        </button>
      </header>

      {error && (
        <div style={{ padding: "10px", background: "#f8d7da", color: "#721c24", borderRadius: "4px", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {isManagerOrAdmin && (
        <section style={{ background: "#f8f9fa", padding: "20px", borderRadius: "5px", marginBottom: "30px" }}>
          <h2>Create Document</h2>
          <form onSubmit={handleCreateDocument}>
            <div style={{ marginBottom: "10px" }}>
              <label htmlFor="doc-title" style={{ display: "block", marginBottom: "5px" }}>Title</label>
              <input
                id="doc-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label htmlFor="doc-content" style={{ display: "block", marginBottom: "5px" }}>Content</label>
              <textarea
                id="doc-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                style={{ width: "100%", padding: "8px", boxSizing: "border-box", minHeight: "100px" }}
              />
            </div>
            <button id="create-doc-btn" type="submit" style={{ padding: "10px 20px", background: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
              Create Document
            </button>
          </form>
        </section>
      )}

      <section style={{ marginBottom: "30px" }}>
        <h2>Documents</h2>
        {docsLoading ? (
          <p>Loading documents...</p>
        ) : !documents || documents.length === 0 ? (
          <p>No documents found.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {documents.map((doc: any) => (
              <li key={doc.id} style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "5px", marginBottom: "10px" }}>
                <h3>{doc.title}</h3>
                <p>{doc.content}</p>
                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <button
                    data-testid={`update-doc-btn-${doc.id}`}
                    onClick={() => handleUpdateDocument(doc)}
                    style={{ padding: "6px 12px", background: "#ffc107", color: "black", border: "none", borderRadius: "4px", cursor: "pointer" }}
                  >
                    Update
                  </button>
                  {isAdmin && (
                    <button
                      data-testid={`delete-doc-btn-${doc.id}`}
                      onClick={() => handleDeleteDocument(doc.id)}
                      style={{ padding: "6px 12px", background: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isAdmin && (
        <section style={{ borderTop: "2px solid #eee", paddingTop: "20px" }}>
          <h2>Audit Logs</h2>
          {logsLoading ? (
            <p>Loading audit logs...</p>
          ) : !auditLogs || auditLogs.length === 0 ? (
            <p>No audit logs.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {auditLogs.map((log: any) => (
                <div
                  key={log.id}
                  data-testid="audit-log-item"
                  style={{ background: "#f1f3f5", padding: "10px 15px", borderRadius: "4px", fontSize: "14px" }}
                >
                  <strong>Action:</strong> {log.action} |{" "}
                  <strong>Entity:</strong> {log.entityName} (ID: {log.entityId}) |{" "}
                  <strong>User ID:</strong> {log.userId} |{" "}
                  <strong>Timestamp:</strong> {new Date(log.timestamp).toLocaleString()}
                  <div style={{ marginTop: "5px", background: "#e9ecef", padding: "5px", borderRadius: "3px", fontFamily: "monospace", fontSize: "12px" }}>
                    {log.payload}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
