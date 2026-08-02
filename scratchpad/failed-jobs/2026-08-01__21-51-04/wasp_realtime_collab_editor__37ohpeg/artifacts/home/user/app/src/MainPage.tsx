import { useState, FormEvent } from "react";
import { Link } from "react-router";
import { useQuery, getDocuments, createDocument } from "wasp/client/operations";
import { useAuth, logout } from "wasp/client/auth";
import "./Main.css";

export function MainPage() {
  const { data: user } = useAuth();
  const { data: documents, isLoading, error } = useQuery(getDocuments);
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");

  const handleCreateDocument = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setCreateError("");
    try {
      await createDocument({ title: title.trim() });
      setTitle("");
    } catch (err: any) {
      setCreateError(err.message || "Failed to create document");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px", fontFamily: "sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", borderBottom: "1px solid #eee", paddingBottom: "20px" }}>
        <div>
          <h1 style={{ margin: 0 }}>Collaborative Doc Editor</h1>
          {user && <p style={{ margin: "5px 0 0 0", color: "#666" }}>Logged in as: <strong>{user.username}</strong></p>}
        </div>
        <button 
          onClick={logout}
          style={{ padding: "8px 16px", backgroundColor: "#f44336", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          Logout
        </button>
      </header>

      <section style={{ marginBottom: "40px", padding: "20px", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
        <h2 style={{ margin: "0 0 20px 0" }}>Create a New Document</h2>
        <form onSubmit={handleCreateDocument} style={{ display: "flex", gap: "10px" }}>
          <input
            id="document-title-input"
            type="text"
            placeholder="Enter document title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            style={{ flex: 1, padding: "10px", fontSize: "16px", borderRadius: "4px", border: "1px solid #ccc" }}
            required
          />
          <button
            id="create-document-btn"
            type="submit"
            disabled={isSubmitting}
            style={{ padding: "10px 20px", fontSize: "16px", backgroundColor: "#0070f3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            {isSubmitting ? "Creating..." : "Create Document"}
          </button>
        </form>
        {createError && <p style={{ color: "red", marginTop: "10px", marginBottom: 0 }}>{createError}</p>}
      </section>

      <section>
        <h2>Your Documents</h2>
        {isLoading && <p>Loading documents...</p>}
        {error && <p style={{ color: "red" }}>Error loading documents: {error.message}</p>}
        
        {!isLoading && !error && (!documents || documents.length === 0) && (
          <p style={{ color: "#666", fontStyle: "italic" }}>No documents found. Create one above to get started!</p>
        )}

        {documents && documents.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "15px" }}>
            {documents.map((doc) => {
              const isOwner = user && doc.ownerId === user.id;
              const userPerm = user && doc.permissions.find((p: any) => p.userId === user.id);
              const roleLabel = isOwner ? "Owner" : `Shared: ${userPerm?.role}`;

              return (
                <li key={doc.id} style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "white" }}>
                  <div>
                    <h3 style={{ margin: "0 0 5px 0" }}>
                      <Link to={`/document/${doc.id}`} style={{ color: "#0070f3", textDecoration: "none", fontWeight: "bold" }}>
                        {doc.title}
                      </Link>
                    </h3>
                    <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
                      Owner: {doc.owner.username} | Role: <span style={{ fontWeight: "bold", color: isOwner ? "#2e7d32" : "#ed6c02" }}>{roleLabel}</span>
                    </p>
                  </div>
                  <Link 
                    to={`/document/${doc.id}`}
                    style={{ padding: "8px 16px", backgroundColor: "#0070f3", color: "white", textDecoration: "none", borderRadius: "4px", fontSize: "14px" }}
                  >
                    Open Editor
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
