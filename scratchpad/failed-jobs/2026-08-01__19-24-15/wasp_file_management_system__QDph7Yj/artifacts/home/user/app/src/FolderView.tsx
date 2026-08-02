import React, { useState } from "react";
import { useQuery, getFolderContent, createFolder, createShareLink } from "wasp/client/operations";
import { api } from "wasp/client/api";
import { logout } from "wasp/client/auth";
import { Link, useNavigate } from "react-router";

interface FolderViewProps {
  folderId: number | null;
}

export const FolderView: React.FC<FolderViewProps> = ({ folderId }) => {
  const navigate = useNavigate();
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [folderError, setFolderError] = useState("");

  // Share Link Form State
  const [sharingFileId, setSharingFileId] = useState<number | null>(null);
  const [sharePassword, setSharePassword] = useState("");
  const [shareExpires, setShareExpires] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [shareError, setShareError] = useState("");

  // Fetch content
  const { data: content, isLoading, error } = useQuery(getFolderContent, { folderId });

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setFolderError("");

    try {
      await createFolder({ name: newFolderName, parentId: folderId });
      setNewFolderName("");
    } catch (err: any) {
      setFolderError(err.message || "Failed to create folder");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("file", selectedFile);
    if (folderId !== null) {
      formData.append("folderId", folderId.toString());
    }

    try {
      await api.post("api/upload", {
        body: formData,
      });
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById("file-upload-input-field") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleCreateShareLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sharingFileId) return;
    setShareError("");
    setGeneratedLink("");

    try {
      const expiresMinutes = shareExpires ? parseInt(shareExpires, 10) : undefined;
      const res = await createShareLink({
        fileId: sharingFileId,
        password: sharePassword || undefined,
        expiresMinutes,
      });

      const fullLink = `${window.location.origin}/share/${res.id}`;
      setGeneratedLink(fullLink);
    } catch (err: any) {
      setShareError(err.message || "Failed to create share link");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (isLoading) {
    return <div style={{ padding: "20px", fontFamily: "sans-serif" }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ padding: "20px", color: "red", fontFamily: "sans-serif" }}>Error: {error.message}</div>;
  }

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "1000px", margin: "0 auto" }}>
      {/* Navbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "15px", marginBottom: "20px" }}>
        <h1 style={{ margin: 0, fontSize: "24px" }}>Wasp Drive</h1>
        <div>
          <Link to="/" style={{ marginRight: "15px", textDecoration: "none", color: "#007bff", fontWeight: "bold" }}>Dashboard</Link>
          <Link to="/logs" style={{ marginRight: "15px", textDecoration: "none", color: "#007bff", fontWeight: "bold" }}>Access Logs</Link>
          <button onClick={handleLogout} style={{ padding: "8px 12px", backgroundColor: "#dc3545", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
            Logout
          </button>
        </div>
      </div>

      {/* Breadcrumb Trail */}
      <div style={{ marginBottom: "20px", backgroundColor: "#f8f9fa", padding: "10px 15px", borderRadius: "4px", fontSize: "16px" }}>
        <Link to="/" style={{ textDecoration: "none", color: "#007bff" }}>Root</Link>
        {content?.breadcrumbs?.map((crumb: any) => (
          <span key={crumb.id}>
            <span style={{ margin: "0 8px", color: "#6c757d" }}>/</span>
            <Link to={`/folder/${crumb.id}`} style={{ textDecoration: "none", color: "#007bff" }}>
              {crumb.name}
            </Link>
          </span>
        ))}
      </div>

      {/* Forms Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
        {/* Create Folder Form */}
        <div style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "6px" }}>
          <h3 style={{ marginTop: 0, marginBottom: "15px" }}>Create Folder</h3>
          {folderError && <p style={{ color: "red", fontSize: "14px" }}>{folderError}</p>}
          <form onSubmit={handleCreateFolder} style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              placeholder="Folder Name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              data-testid="folder-name-input"
              required
              style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
            <button
              type="submit"
              data-testid="create-folder-btn"
              style={{ padding: "8px 15px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
            >
              Create
            </button>
          </form>
        </div>

        {/* Upload File Form */}
        <div style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "6px" }}>
          <h3 style={{ marginTop: 0, marginBottom: "15px" }}>Upload File</h3>
          {uploadError && <p style={{ color: "red", fontSize: "14px" }}>{uploadError}</p>}
          <form onSubmit={handleUploadFile} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              id="file-upload-input-field"
              type="file"
              onChange={handleFileChange}
              data-testid="file-upload-input"
              required
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              data-testid="upload-file-btn"
              disabled={uploading || !selectedFile}
              style={{
                padding: "8px 15px",
                backgroundColor: "#28a745",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: selectedFile ? "pointer" : "not-allowed",
                fontWeight: "bold",
                opacity: selectedFile ? 1 : 0.6
              }}
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </form>
        </div>
      </div>

      {/* Folders and Files Display */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Folders List */}
        <div style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "6px" }}>
          <h3 style={{ marginTop: 0, borderBottom: "1px solid #eee", paddingBottom: "10px" }}>Folders</h3>
          {content?.folders?.length === 0 ? (
            <p style={{ color: "#6c757d", fontStyle: "italic" }}>No folders in this directory.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {content?.folders?.map((folder: any) => (
                <li key={folder.id} style={{ padding: "10px 0", borderBottom: "1px solid #f1f1f1" }}>
                  <Link
                    to={`/folder/${folder.id}`}
                    data-testid={`folder-link-${folder.id}`}
                    className="folder-link"
                    style={{ textDecoration: "none", color: "#333", fontWeight: "bold", display: "flex", alignItems: "center" }}
                  >
                    📁 {folder.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Files List */}
        <div style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "6px" }}>
          <h3 style={{ marginTop: 0, borderBottom: "1px solid #eee", paddingBottom: "10px" }}>Files</h3>
          {content?.files?.length === 0 ? (
            <p style={{ color: "#6c757d", fontStyle: "italic" }}>No files in this directory.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {content?.files?.map((file: any) => (
                <li
                  key={file.id}
                  data-testid={`file-item-${file.id}`}
                  className="file-item"
                  style={{ padding: "10px 0", borderBottom: "1px solid #f1f1f1", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <span style={{ fontWeight: "medium" }}>📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                  <button
                    data-testid={`share-btn-${file.id}`}
                    className="share-btn"
                    onClick={() => {
                      setSharingFileId(file.id);
                      setSharePassword("");
                      setShareExpires("");
                      setGeneratedLink("");
                      setShareError("");
                    }}
                    style={{ padding: "5px 10px", backgroundColor: "#17a2b8", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px" }}
                  >
                    Share
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Share Link Modal/Form */}
      {sharingFileId && (
        <div style={{ marginTop: "30px", border: "1px solid #17a2b8", padding: "20px", borderRadius: "6px", backgroundColor: "#f4fcfd" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3 style={{ margin: 0, color: "#17a2b8" }}>
              Generate Share Link for File #{sharingFileId}
            </h3>
            <button
              onClick={() => setSharingFileId(null)}
              style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#666" }}
            >
              &times;
            </button>
          </div>
          {shareError && <p style={{ color: "red", fontSize: "14px" }}>{shareError}</p>}
          <form onSubmit={handleCreateShareLink} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "15px", alignItems: "end" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "bold" }}>Password (Optional)</label>
              <input
                type="password"
                placeholder="Leave blank for none"
                value={sharePassword}
                onChange={(e) => setSharePassword(e.target.value)}
                data-testid="share-password-input"
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "bold" }}>Expires In (Minutes, Optional)</label>
              <input
                type="number"
                placeholder="Never"
                value={shareExpires}
                onChange={(e) => setShareExpires(e.target.value)}
                data-testid="share-expires-input"
                min="1"
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
              />
            </div>
            <button
              type="submit"
              data-testid="create-share-link-btn"
              style={{ padding: "10px 20px", backgroundColor: "#17a2b8", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
            >
              Create Link
            </button>
          </form>

          {generatedLink && (
            <div style={{ marginTop: "20px", backgroundColor: "#fff", border: "1px solid #bee5eb", padding: "15px", borderRadius: "4px" }}>
              <p style={{ margin: "0 0 10px 0", fontWeight: "bold", color: "#0c5460" }}>Your Share Link is Ready:</p>
              <div
                data-testid="share-link-display"
                style={{ wordBreak: "break-all", padding: "10px", backgroundColor: "#e2f0d9", border: "1px solid #b2d8b2", borderRadius: "4px", fontWeight: "bold", color: "#2d5a27" }}
              >
                {generatedLink}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
