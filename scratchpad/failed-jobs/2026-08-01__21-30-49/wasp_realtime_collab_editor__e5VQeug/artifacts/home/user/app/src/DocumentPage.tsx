import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { useQuery, getDocument, updateDocumentContent, saveVersion, restoreVersion, shareDocument, revokePermission } from "wasp/client/operations";
import { useSocket, useSocketListener } from "wasp/client/webSocket";

export const DocumentPage = () => {
  const { id } = useParams<{ id: string }>();
  const docId = Number(id);

  const { data, isLoading, error } = useQuery(getDocument, { id: docId });
  const { socket } = useSocket();

  const [content, setContent] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const [shareUsername, setShareUsername] = useState("");
  const [shareRole, setShareRole] = useState("VIEW");
  const [shareError, setShareError] = useState("");
  const [shareSuccess, setShareSuccess] = useState("");

  // Initialize content from database
  useEffect(() => {
    if (data?.document && !isFocused) {
      setContent(data.document.content);
    }
  }, [data, isFocused]);

  // Join/leave WebSocket room
  useEffect(() => {
    if (socket && docId) {
      socket.emit("joinDocument", docId);
      return () => {
        socket.emit("leaveDocument", docId);
      };
    }
  }, [socket, docId]);

  // Listen for real-time document edits
  useSocketListener("documentEdited", ({ content: newContent }) => {
    setContent(newContent);
  });

  if (isLoading) {
    return <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>Loading document...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
        <h2 style={{ color: "red" }}>Access Denied</h2>
        <p>{error.message || "You do not have permission to view this document."}</p>
        <Link to="/" style={{ color: "#0070f3", textDecoration: "none", fontWeight: "bold" }}>Go back to home</Link>
      </div>
    );
  }

  const { document: doc, role } = data;
  const isOwner = role === "OWNER";
  const canEdit = isOwner || role === "EDIT";

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (socket) {
      socket.emit("editDocument", { documentId: docId, content: newContent });
    }
  };

  const handleSaveVersion = async () => {
    try {
      await saveVersion({ id: docId, content });
      alert("Version saved successfully!");
    } catch (err: any) {
      alert(err?.message || "Failed to save version");
    }
  };

  const handleRestoreVersion = async (versionId: number) => {
    try {
      const updatedDoc = await restoreVersion({ documentId: docId, versionId });
      setContent(updatedDoc.content);
      if (socket) {
        socket.emit("restoreVersion", { documentId: docId, content: updatedDoc.content });
      }
      alert("Version restored successfully!");
    } catch (err: any) {
      alert(err?.message || "Failed to restore version");
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareUsername.trim()) return;
    try {
      setShareError("");
      setShareSuccess("");
      await shareDocument({ documentId: docId, username: shareUsername.trim(), role: shareRole });
      setShareSuccess(`Successfully shared with ${shareUsername}`);
      setShareUsername("");
    } catch (err: any) {
      setShareError(err?.message || "Failed to share document");
    }
  };

  const handleRevoke = async (permissionId: number) => {
    if (!confirm("Are you sure you want to revoke this user's access?")) return;
    try {
      await revokePermission({ permissionId });
    } catch (err: any) {
      alert(err?.message || "Failed to revoke permission");
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "40px auto", padding: "20px", fontFamily: "sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "20px", marginBottom: "30px" }}>
        <div>
          <Link to="/" style={{ color: "#0070f3", textDecoration: "none", fontSize: "14px" }}>&larr; Back to Dashboard</Link>
          <h1 style={{ margin: "10px 0 0 0" }}>{doc.title}</h1>
          <p style={{ margin: "5px 0 0 0", fontSize: "14px", color: "#666" }}>
            Owner: {doc.owner.username} | Your Role: <span style={{ fontWeight: "bold", color: canEdit ? "#4CAF50" : "#f44336" }}>{role}</span>
          </p>
        </div>
        {canEdit && (
          <button
            id="save-version-btn"
            onClick={handleSaveVersion}
            style={{ padding: "10px 20px", backgroundColor: "#0070f3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
          >
            Save Version
          </button>
        )}
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "30px" }}>
        {/* Editor Section */}
        <div>
          <textarea
            id="document-content-textarea"
            value={content}
            onChange={handleContentChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={!canEdit}
            placeholder={canEdit ? "Start typing here..." : "You have read-only access to this document."}
            style={{
              width: "100%",
              height: "500px",
              padding: "15px",
              fontSize: "16px",
              fontFamily: "monospace",
              borderRadius: "8px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
              resize: "vertical",
              backgroundColor: canEdit ? "#fff" : "#f5f5f5",
            }}
          />
        </div>

        {/* Sidebar Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          {/* Share Section (Only visible to owner) */}
          {isOwner && (
            <section style={{ padding: "20px", border: "1px solid #e0e0e0", borderRadius: "8px", backgroundColor: "#fafafa" }}>
              <h3 style={{ marginTop: 0, marginBottom: "15px" }}>Share Document</h3>
              <form onSubmit={handleShare} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <label htmlFor="share-username-input" style={{ fontSize: "14px", display: "block", marginBottom: "5px" }}>Username</label>
                  <input
                    id="share-username-input"
                    type="text"
                    placeholder="Enter username"
                    value={shareUsername}
                    onChange={(e) => setShareUsername(e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label htmlFor="share-role-select" style={{ fontSize: "14px", display: "block", marginBottom: "5px" }}>Permission Role</label>
                  <select
                    id="share-role-select"
                    value={shareRole}
                    onChange={(e) => setShareRole(e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
                  >
                    <option value="VIEW">VIEW (Read-only)</option>
                    <option value="EDIT">EDIT (Read & Write)</option>
                  </select>
                </div>
                <button
                  id="share-document-btn"
                  type="submit"
                  style={{ padding: "10px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                >
                  Share
                </button>
              </form>
              {shareError && <p style={{ color: "red", fontSize: "14px", marginTop: "10px" }}>{shareError}</p>}
              {shareSuccess && <p style={{ color: "green", fontSize: "14px", marginTop: "10px" }}>{shareSuccess}</p>}

              <h4 style={{ marginBottom: "10px", marginTop: "20px" }}>Shared Users</h4>
              <ul id="permissions-list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {doc.permissions.length === 0 && <li style={{ fontSize: "14px", color: "#888" }}>Not shared with anyone yet.</li>}
                {doc.permissions.map((p: any) => (
                  <li key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #eee", fontSize: "14px" }}>
                    <span>
                      <strong>{p.user.username}</strong> ({p.role})
                    </span>
                    <button
                      onClick={() => handleRevoke(p.id)}
                      style={{ padding: "4px 8px", backgroundColor: "#ff5722", color: "white", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "12px" }}
                    >
                      Revoke
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Version History */}
          <section style={{ padding: "20px", border: "1px solid #e0e0e0", borderRadius: "8px", backgroundColor: "#fafafa" }}>
            <h3 style={{ marginTop: 0, marginBottom: "15px" }}>Version History</h3>
            <ul id="version-history-list" style={{ listStyle: "none", padding: 0, margin: 0, maxHeight: "300px", overflowY: "auto" }}>
              {doc.versions.length === 0 && <li style={{ fontSize: "14px", color: "#888" }}>No saved versions yet.</li>}
              {doc.versions.map((v: any, index: number) => {
                const displayIndex = doc.versions.length - index;
                return (
                  <li key={v.id} style={{ padding: "10px 0", borderBottom: "1px solid #eee", display: "flex", flexDirection: "column", gap: "5px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                      <span>
                        <strong>Version #{displayIndex}</strong> (ID: {v.id})
                      </span>
                      {canEdit && (
                        <button
                          className="restore-version-btn"
                          onClick={() => handleRestoreVersion(v.id)}
                          style={{ padding: "2px 6px", backgroundColor: "#ff9800", color: "white", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "12px" }}
                        >
                          Restore
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      Saved by: {v.author.username}
                    </div>
                    <div style={{ fontSize: "11px", color: "#999" }}>
                      {new Date(v.createdAt).toLocaleString()}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};
export default DocumentPage;
