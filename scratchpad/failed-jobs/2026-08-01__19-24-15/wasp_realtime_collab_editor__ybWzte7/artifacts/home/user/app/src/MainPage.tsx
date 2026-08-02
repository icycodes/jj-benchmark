import { useState, FormEvent } from "react";
import { Link } from "react-router";
import { useQuery, getDocuments, createDocument } from "wasp/client/operations";
import { logout } from "wasp/client/auth";

export const MainPage = ({ user }: { user: any }) => {
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
      await createDocument({ title });
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
          <h1>Collaborative Editor</h1>
          <p>Welcome, <strong>{user?.username}</strong>!</p>
        </div>
        <button 
          onClick={logout}
          style={{ padding: "8px 16px", backgroundColor: "#f44336", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          Logout
        </button>
      </header>

      <section style={{ marginBottom: "40px", padding: "20px", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
        <h2>Create a New Document</h2>
        <form onSubmit={handleCreateDocument} style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
          <input
            id="document-title-input"
            type="text"
            placeholder="Enter document title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            style={{ flex: 1, padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
            required
          />
          <button
            id="create-document-btn"
            type="submit"
            disabled={isSubmitting}
            style={{ padding: "10px 20px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            {isSubmitting ? "Creating..." : "Create Document"}
          </button>
        </form>
        {createError && <p style={{ color: "red", marginTop: "10px" }}>{createError}</p>}
      </section>

      <section>
        <h2>Your Documents</h2>
        {isLoading && <p>Loading documents...</p>}
        {error && <p style={{ color: "red" }}>Error loading documents: {error.message}</p>}
        
        {!isLoading && !error && (!documents || documents.length === 0) && (
          <p style={{ color: "#666", fontStyle: "italic" }}>No documents found. Create one above to get started!</p>
        )}

        {!isLoading && !error && documents && documents.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {documents.map((doc: any) => {
              const isOwner = doc.ownerId === user?.id;
              return (
                <li 
                  key={doc.id} 
                  style={{ 
                    padding: "15px", 
                    border: "1px solid #ddd", 
                    borderRadius: "6px", 
                    marginBottom: "10px", 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    backgroundColor: "white",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                  }}
                >
                  <div>
                    <h3 style={{ margin: "0 0 5px 0" }}>
                      <Link 
                        to={`/document/${doc.id}`} 
                        style={{ color: "#2196F3", textDecoration: "none", fontWeight: "bold" }}
                      >
                        {doc.title}
                      </Link>
                    </h3>
                    <span style={{ fontSize: "0.85rem", color: "#666" }}>
                      Owner: {isOwner ? "You" : doc.owner?.username} | Last updated: {new Date(doc.updatedAt).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <Link 
                      to={`/document/${doc.id}`} 
                      style={{ 
                        display: "inline-block", 
                        padding: "6px 12px", 
                        backgroundColor: "#2196F3", 
                        color: "white", 
                        textDecoration: "none", 
                        borderRadius: "4px",
                        fontSize: "0.9rem"
                      }}
                    >
                      Open
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};
