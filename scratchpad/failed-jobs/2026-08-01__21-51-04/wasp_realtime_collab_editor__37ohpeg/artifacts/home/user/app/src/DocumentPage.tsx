import { useState, useEffect, FormEvent } from "react";
import { useParams, Link } from "react-router";
import { useQuery, getDocument, getVersions, getPermissions, shareDocument, revokePermission, saveVersion, restoreVersion } from "wasp/client/operations";
import { useSocket, useSocketListener } from "wasp/client/webSocket";
import { useAuth } from "wasp/client/auth";

export function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const { data: user } = useAuth();
  const { socket, isConnected } = useSocket();

  const { data: docData, error: docError, isLoading: docLoading } = useQuery(getDocument, { id: Number(id) });
  const { data: versions, refetch: refetchVersions } = useQuery(getVersions, { documentId: Number(id) });
  
  const isOwner = docData?.role === "OWNER";
  const isEditor = docData?.role === "EDIT" || isOwner;

  const { data: permissions, refetch: refetchPermissions } = useQuery(
    getPermissions,
    { documentId: Number(id) },
    { enabled: isOwner }
  );

  const [content, setContent] = useState("");
  const [hasInitializedContent, setHasInitializedContent] = useState(false);

  // Sharing form state
  const [shareUsername, setShareUsername] = useState("");
  const [shareRole, setShareRole] = useState("VIEW");
  const [shareError, setShareError] = useState("");
  const [shareSuccess, setShareSuccess] = useState("");

  const [saveError, setSaveError] = useState("");

  // Initialize content on load
  useEffect(() => {
    if (docData && !hasInitializedContent) {
      setContent(docData.document.content);
      setHasInitializedContent(true);
    }
  }, [docData, hasInitializedContent]);

  // WebSocket Room Join/Leave
  useEffect(() => {
    if (socket && isConnected && id) {
      socket.emit("joinDocument", Number(id));
    }
    return () => {
      if (socket && isConnected && id) {
        socket.emit("leaveDocument", Number(id));
      }
    };
  }, [socket, isConnected, id]);

  // Real-time edits listener
  useSocketListener("documentUpdated", ({ content: updatedContent }: { content: string }) => {
    setContent(updatedContent);
  });

  const handleTextareaChange = (newContent: string) => {
    setContent(newContent);
    if (socket && isConnected) {
      socket.emit("editDocument", { documentId: Number(id), content: newContent });
    }
  };

  const handleSaveVersion = async () => {
    setSaveError("");
    try {
      await saveVersion({
        documentId: Number(id),
        content,
      });
      refetchVersions();
    } catch (err: any) {
      setSaveError(err.message || "Failed to save version");
    }
  };

  const handleRestoreVersion = async (versionId: number) => {
    try {
      await restoreVersion({
        documentId: Number(id),
        versionId,
      });
      refetchVersions();
    } catch (err: any) {
      alert(err.message || "Failed to restore version");
    }
  };

  const handleShare = async (e: FormEvent) => {
    e.preventDefault();
    if (!shareUsername.trim()) return;
    setShareError("");
    setShareSuccess("");
    try {
      await shareDocument({
        documentId: Number(id),
        username: shareUsername.trim(),
        role: shareRole,
      });
      setShareUsername("");
      setShareSuccess(`Successfully shared with ${shareUsername}`);
      refetchPermissions();
    } catch (err: any) {
      setShareError(err.message || "Failed to share document");
    }
  };

  const handleRevoke = async (userId: number) => {
    try {
      await revokePermission({
        documentId: Number(id),
        userId,
      });
      refetchPermissions();
    } catch (err: any) {
      alert(err.message || "Failed to revoke permission");
    }
  };

  if (docLoading) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading document...</div>;
  }

  if (docError) {
    const isAccessDenied = (docError as any).status === 403 || docError.message?.includes("Access Denied");
    return (
      <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
        <h1>{isAccessDenied ? "Access Denied" : "Error"}</h1>
        <p>{isAccessDenied ? "You do not have permission to view this document." : (docError.message || "Failed to load document")}</p>
        <Link to="/" style={{ color: "#0070f3", textDecoration: "none", fontWeight: "bold" }}>Go back to Homepage</Link>
      </div>
    );
  }

  if (!docData) {
    return (
      <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
        <h1>Document Not Found</h1>
        <Link to="/" style={{ color: "#0070f3", textDecoration: "none", fontWeight: "bold" }}>Go back to Homepage</Link>
      </div>
    );
  }

  const { document, role } = docData;

  return (
    <div style={{ maxWidth: "1000px", margin: "40px auto", padding: "0 20px", fontFamily: "sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid #eee", paddingBottom: "20px" }}>
        <div>
          <Link to="/" style={{ color: "#0070f3", textDecoration: "none", fontSize: "14px", fontWeight: "bold" }}>&larr; Back to Dashboard</Link>
          <h1 style={{ margin: "10px 0 5px 0" }}>{document.title}</h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
            Owner: <strong>{document.owner.username}</strong> | Your Role: <strong style={{ color: isOwner ? "#2e7d32" : "#ed6c02" }}>{role}</strong>
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", backgroundColor: isConnected ? "#4caf50" : "#f44336" }}></span>
          <span style={{ fontSize: "14px", color: "#555" }}>{isConnected ? "Connected" : "Disconnected"}</span>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "40px" }}>
        {/* Editor Section */}
        <div>
          <textarea
            id="document-content-textarea"
            value={content}
            onChange={(e) => handleTextareaChange(e.target.value)}
            disabled={!isEditor}
            placeholder={isEditor ? "Start typing to edit in real-time..." : "You only have read-only access to this document."}
            style={{
              width: "100%",
              height: "400px",
              padding: "20px",
              fontSize: "16px",
              fontFamily: "monospace",
              borderRadius: "8px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
              resize: "vertical",
              backgroundColor: isEditor ? "white" : "#f5f5f5"
            }}
          />

          {isEditor && (
            <div style={{ marginTop: "20px" }}>
              <button
                id="save-version-btn"
                onClick={handleSaveVersion}
                style={{ padding: "10px 20px", fontSize: "16px", backgroundColor: "#4caf50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
              >
                Save Version
              </button>
              {saveError && <p style={{ color: "red", marginTop: "10px" }}>{saveError}</p>}
            </div>
          )}
        </div>

        {/* Sidebar Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          {/* Version History */}
          <div style={{ padding: "20px", backgroundColor: "#f9f9f9", borderRadius: "8px", border: "1px solid #eee" }}>
            <h3 style={{ margin: "0 0 15px 0" }}>Version History</h3>
            <ul id="version-history-list" style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
              {!versions || versions.length === 0 ? (
                <li style={{ color: "#666", fontStyle: "italic", fontSize: "14px" }}>No saved versions yet.</li>
              ) : (
                versions.map((v: any, idx: number) => (
                  <li key={v.id} style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "4px", backgroundColor: "white", fontSize: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong>v{idx + 1}</strong> <span style={{ color: "#666" }}>(ID: {v.id})</span>
                        <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>By: {v.author.username}</div>
                      </div>
                      {isEditor && (
                        <button
                          className="restore-version-btn"
                          onClick={() => handleRestoreVersion(v.id)}
                          style={{ padding: "4px 8px", fontSize: "12px", backgroundColor: "#2196f3", color: "white", border: "none", borderRadius: "3px", cursor: "pointer" }}
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Document Sharing (Owner Only) */}
          {isOwner && (
            <div style={{ padding: "20px", backgroundColor: "#f9f9f9", borderRadius: "8px", border: "1px solid #eee" }}>
              <h3 style={{ margin: "0 0 15px 0" }}>Share Document</h3>
              <form onSubmit={handleShare} style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                <div>
                  <label htmlFor="share-username-input" style={{ display: "block", fontSize: "12px", color: "#666", marginBottom: "5px" }}>Username</label>
                  <input
                    id="share-username-input"
                    type="text"
                    placeholder="Enter username..."
                    value={shareUsername}
                    onChange={(e) => setShareUsername(e.target.value)}
                    style={{ width: "100%", padding: "8px", boxSizing: "border-box", borderRadius: "4px", border: "1px solid #ccc" }}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="share-role-select" style={{ display: "block", fontSize: "12px", color: "#666", marginBottom: "5px" }}>Role</label>
                  <select
                    id="share-role-select"
                    value={shareRole}
                    onChange={(e) => setShareRole(e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                  >
                    <option value="VIEW">VIEW</option>
                    <option value="EDIT">EDIT</option>
                  </select>
                </div>
                <button
                  id="share-document-btn"
                  type="submit"
                  style={{ padding: "8px 16px", backgroundColor: "#0070f3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  Share
                </button>
              </form>
              {shareError && <p style={{ color: "red", fontSize: "14px", margin: "0 0 10px 0" }}>{shareError}</p>}
              {shareSuccess && <p style={{ color: "green", fontSize: "14px", margin: "0 0 10px 0" }}>{shareSuccess}</p>}

              <h4 style={{ margin: "20px 0 10px 0" }}>Current Permissions</h4>
              <ul id="permissions-list" style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                {!permissions || permissions.length === 0 ? (
                  <li style={{ color: "#666", fontStyle: "italic", fontSize: "14px" }}>Not shared with anyone yet.</li>
                ) : (
                  permissions.map((p: any) => (
                    <li key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px", border: "1px solid #ddd", borderRadius: "4px", backgroundColor: "white", fontSize: "13px" }}>
                      <span>{p.user.username} ({p.role})</span>
                      <button
                        onClick={() => handleRevoke(p.userId)}
                        style={{ padding: "2px 6px", fontSize: "11px", backgroundColor: "#f44336", color: "white", border: "none", borderRadius: "3px", cursor: "pointer" }}
                      >
                        Revoke
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
