import { useState } from "react";
import { useQuery, getDocuments, createDocument } from "wasp/client/operations";
import { logout } from "wasp/client/auth";
import { Link } from "react-router";

export const MainPage = () => {
  const { data: documents, isLoading, error } = useQuery(getDocuments);
  const [title, setTitle] = useState("");
  const [createError, setCreateError] = useState("");

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      setCreateError("");
      await createDocument({ title });
      setTitle("");
    } catch (err: any) {
      setCreateError(err?.message || "Failed to create document");
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "20px", fontFamily: "sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "20px", marginBottom: "30px" }}>
        <h1>Collaborative Document Editor</h1>
        <button 
          onClick={logout}
          style={{ padding: "8px 16px", backgroundColor: "#f44336", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          Logout
        </button>
      </header>

      <section style={{ marginBottom: "40px", padding: "20px", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
        <h3>Create a New Document</h3>
        <form onSubmit={handleCreateDocument} style={{ display: "flex", gap: "10px" }}>
          <input
            id="document-title-input"
            type="text"
            placeholder="Document Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ flex: 1, padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
          <button
            id="create-document-btn"
            type="submit"
            style={{ padding: "10px 20px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            Create Document
          </button>
        </form>
        {createError && <p style={{ color: "red", marginTop: "10px" }}>{createError}</p>}
      </section>

      <section>
        <h3>Your Documents</h3>
        {isLoading && <p>Loading documents...</p>}
        {error && <p style={{ color: "red" }}>Error loading documents: {error.message}</p>}
        {documents && documents.length === 0 && <p>No documents found. Create one above!</p>}
        {documents && documents.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {documents.map((doc: any) => (
              <li key={doc.id} style={{ padding: "15px", border: "1px solid #ddd", borderRadius: "6px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <Link to={`/document/${doc.id}`} style={{ fontSize: "18px", fontWeight: "bold", textDecoration: "none", color: "#0070f3" }}>
                    {doc.title}
                  </Link>
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                    Owned by: {doc.owner.username}
                  </div>
                </div>
                <div style={{ fontSize: "14px", color: "#888" }}>
                  Last updated: {new Date(doc.updatedAt).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
export default MainPage;
