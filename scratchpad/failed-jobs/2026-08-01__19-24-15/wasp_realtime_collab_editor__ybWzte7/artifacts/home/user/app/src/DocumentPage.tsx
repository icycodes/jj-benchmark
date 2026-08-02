import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { useQuery, getDocument, saveVersion, restoreVersion, shareDocument, revokePermission } from "wasp/client/operations";
import { useSocket, useSocketListener } from "wasp/client/webSocket";

export const DocumentPage = ({ user }: { user: any }) => {
  const { id } = useParams();
  const docId = id ? parseInt(id, 10) : NaN;

  const { socket, isConnected } = useSocket();
  const { data, isLoading, error, refetch } = useQuery(getDocument, { id: docId });

  const [content, setContent] = useState("");
  const [shareUsername, setShareUsername] = useState("");
  const [shareRole, setShareRole] = useState("VIEW");
  const [shareError, setShareError] = useState("");
  const [saveError, setSaveError] = useState("");

  // Join the document room when socket connects and docId is available
  useEffect(() => {
    if (socket && !isNaN(docId)) {
      socket.emit("joinDocument", docId);
    }
  }, [socket, docId]);

  // Sync content when document is fetched
  useEffect(() => {
    if (data?.document) {
      setContent(data.document.content);
    }
  }, [data]);

  // Listen for real-time document updates
  useSocketListener("documentUpdated", ({ content: newContent }) => {
    setContent(newContent);
  });

  if (isNaN(docId)) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px", fontFamily: "sans-serif" }}>
        <h2>Invalid Document ID</h2>
        <Link to="/">Go to Home</Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px", fontFamily: "sans-serif" }}>
        <h2>Loading Document...</h2>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px", fontFamily: "sans-serif" }}>
        <h2 style={{ color: "red" }}>Access Denied</h2>
        <p>You do not have permission to view this document, or it does not exist.</p>
        <Link to="/">Go to Home</Link>
      </div>
    );
  }

  const { document, role } = data;
  const isOwner = role === "OWNER";
  const canEdit = isOwner || role === "EDIT";

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    socket?.emit("editDocument", { documentId: docId, content: val });
  };

  const handleSaveVersion = async () => {
    setSaveError("");
    try {
      await saveVersion({ documentId: docId, content });
      await refetch();
      alert("Version saved successfully!");
    } catch (err: any) {
      setSaveError(err.message || "Failed to save version");
    }
  };

  const handleRestoreVersion = async (version: any) => {
    try {
      await restoreVersion({ documentId: docId, versionId: version.id });
      // Broadcast the restored content immediately via socket
      socket?.emit("restoreVersion", { documentId: docId, content: version.content });
      await refetch();
      alert(`Restored to version ${version.id}`);
    } catch (err: any) {
      alert("Failed to restore version: " + err.message);
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setShareError("");
    if (!shareUsername.trim()) return;

    try {
      await shareDocument({ documentId: docId, username: shareUsername.trim(), role: shareRole });
      setShareUsername("");
      await refetch();
      alert("Document shared successfully!");
    } catch (err: any) {
      setShareError(err.message || "Failed to share document");
    }
  };

  const handleRevoke = async (permissionId: number) => {
    if (confirm("Are you sure you want to revoke this user's access?")) {
      try {
        await revokePermission({ id: permissionId });
        await refetch();
      } catch (err: any) {
        alert("Failed to revoke permission: " + err.message);
      }
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "40px auto", padding: "0 20px", fontFamily: "sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #eee", paddingBottom: "15px" }}>
        <div>
          <Link to="/" style={{ textDecoration: "none", color: "#2196F3", fontWeight: "bold" }}>&larr; Back to Dashboard</Link>
          <h1 style={{ margin: "10px 0 5px 0" }}>{document.title}</h1>
          <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>
            Owner: <strong>{document.owner.username}</strong> | Your Role: <span style={{ fontWeight: "bold", color: isOwner ? "#4CAF50" : "#2196F3" }}>{role}</span>
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ 
            display: "inline-block", 
            width: "10px", 
            height: "10px", 
            borderRadius: "50%", 
            backgroundColor: isConnected ? "#4CAF50" : "#f44336" 
          }} />
          <span style={{ fontSize: "0.85rem", color: "#666" }}>
            {isConnected ? "Connected (Real-time sync active)" : "Disconnected"}
          </span>
        </div>
      </header>

      <main style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "30px" }}>
        {/* Editor Section */}
        <section>
          <div style={{ marginBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3>Document Content</h3>
            {canEdit && (
              <button
                id="save-version-btn"
                onClick={handleSaveVersion}
                style={{ padding: "8px 16px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
              >
                Save Version
              </button>
            )}
          </div>
          {saveError && <p style={{ color: "red", margin: "5px 0" }}>{saveError}</p>}
          <textarea
            id="document-content-textarea"
            value={content}
            onChange={handleContentChange}
            disabled={!canEdit}
            placeholder={canEdit ? "Type your document content here..." : "You only have read-only access to this document."}
            style={{
              width: "100%",
              height: "400px",
              padding: "15px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "1rem",
              lineHeight: "1.5",
              boxSizing: "border-box",
              fontFamily: "monospace",
              resize: "vertical",
              backgroundColor: canEdit ? "white" : "#f5f5f5"
            }}
          />
        </section>

        {/* Sidebar (Versions & Sharing) */}
        <aside style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          {/* Document Sharing - Only visible to Owner */}
          {isOwner && (
            <section style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "8px", backgroundColor: "#fafafa" }}>
              <h3 style={{ margin: "0 0 15px 0" }}>Share Document</h3>
              <form onSubmit={handleShare} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <label htmlFor="share-username-input" style={{ fontSize: "0.85rem", fontWeight: "bold", display: "block", marginBottom: "5px" }}>Username</label>
                  <input
                    id="share-username-input"
                    type="text"
                    placeholder="Enter username..."
                    value={shareUsername}
                    onChange={(e) => setShareUsername(e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="share-role-select" style={{ fontSize: "0.85rem", fontWeight: "bold", display: "block", marginBottom: "5px" }}>Permission Role</label>
                  <select
                    id="share-role-select"
                    value={shareRole}
                    onChange={(e) => setShareRole(e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                  >
                    <option value="VIEW">VIEW (Read Only)</option>
                    <option value="EDIT">EDIT (Read & Write)</option>
                  </select>
                </div>
                <button
                  id="share-document-btn"
                  type="submit"
                  style={{ padding: "10px", backgroundColor: "#2196F3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", marginTop: "5px" }}
                >
                  Share
                </button>
              </form>
              {shareError && <p style={{ color: "red", fontSize: "0.85rem", marginTop: "10px", margin: 0 }}>{shareError}</p>}

              <h4 style={{ margin: "20px 0 10px 0", borderBottom: "1px solid #eee", paddingBottom: "5px" }}>Current Permissions</h4>
              <ul id="permissions-list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {document.permissions.length === 0 ? (
                  <p style={{ fontSize: "0.85rem", color: "#666", fontStyle: "italic", margin: 0 }}>Not shared with anyone yet.</p>
                ) : (
                  document.permissions.map((perm: any) => (
                    <li key={perm.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", padding: "6px 0", borderBottom: "1px solid #f0f0f0" }}>
                      <span>
                        <strong>{perm.user.username}</strong> ({perm.role})
                      </span>
                      <button
                        onClick={() => handleRevoke(perm.id)}
                        style={{ padding: "2px 6px", backgroundColor: "#f44336", color: "white", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "0.75rem" }}
                      >
                        Revoke
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </section>
          )}

          {/* Version History */}
          <section style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "8px" }}>
            <h3 style={{ margin: "0 0 15px 0" }}>Version History</h3>
            <ul id="version-history-list" style={{ listStyle: "none", padding: 0, margin: 0, maxHeight: "300px", overflowY: "auto" }}>
              {document.versions.length === 0 ? (
                <p style={{ fontSize: "0.9rem", color: "#666", fontStyle: "italic", margin: 0 }}>No saved versions yet.</p>
              ) : (
                document.versions.map((version: any, index: number) => (
                  <li 
                    key={version.id} 
                    style={{ 
                      padding: "10px", 
                      borderBottom: "1px solid #eee", 
                      fontSize: "0.85rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span><strong>Version #{index + 1}</strong> (ID: {version.id})</span>
                      <span style={{ color: "#666" }}>{new Date(version.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div style={{ color: "#555" }}>
                      Author: {version.author.username}
                    </div>
                    {canEdit && (
                      <button
                        className="restore-version-btn"
                        onClick={() => handleRestoreVersion(version)}
                        style={{ 
                          alignSelf: "flex-start", 
                          padding: "3px 8px", 
                          backgroundColor: "#FF9800", 
                          color: "white", 
                          border: "none", 
                          borderRadius: "3px", 
                          cursor: "pointer", 
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                          marginTop: "2px"
                        }}
                      >
                        Restore
                      </button>
                    )}
                  </li>
                ))
              )}
            </ul>
          </section>
        </aside>
      </main>
    </div>
  );
};
