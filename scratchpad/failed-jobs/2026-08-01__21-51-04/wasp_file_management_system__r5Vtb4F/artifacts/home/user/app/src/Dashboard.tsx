import { useState, useRef } from "react";
import { useQuery, getFolder, createFolder, uploadFile, createShareLink } from "wasp/client/operations";
import { Link, useNavigate } from "react-router";
import { logout, useAuth } from "wasp/client/auth";
import { getUsername } from "wasp/auth";

export function Dashboard({ folderId }: { folderId?: string | null }) {
  const navigate = useNavigate();
  const { data: user } = useAuth();

  // Queries
  const { data, isLoading, error } = useQuery(getFolder, { folderId: folderId || null });

  // State for forms
  const [folderName, setFolderName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for sharing
  const [activeShareFile, setActiveShareFile] = useState<any | null>(null);
  const [sharePassword, setSharePassword] = useState("");
  const [shareExpires, setShareExpires] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    try {
      await createFolder({ name: folderName, parentId: folderId || null });
      setFolderName("");
    } catch (err: any) {
      alert("Error creating folder: " + err.message);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = (reader.result as string).split(",")[1];
      try {
        await uploadFile({
          name: file.name,
          mimeType: file.type,
          size: file.size,
          base64Data,
          folderId: folderId || null,
        });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (err: any) {
        alert("Upload failed: " + err.message);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateShareLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShareFile) return;

    try {
      const expiresMinutes = shareExpires ? parseInt(shareExpires) : null;
      const link = await createShareLink({
        fileId: activeShareFile.id,
        password: sharePassword || null,
        expiresMinutes,
      });

      const fullUrl = `${window.location.origin}/share/${link.id}`;
      setGeneratedLink(fullUrl);
    } catch (err: any) {
      alert("Error creating share link: " + err.message);
    }
  };

  if (isLoading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">Error loading dashboard: {String(error)}</div>;

  const { folder, subfolders = [], files = [], breadcrumbs = [] } = data || {};

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Wasp Drive</h1>
        <div className="user-info">
          <span>Logged in as: <strong>{user ? (getUsername(user as any) || user?.id) : ""}</strong></span>
          <Link to="/logs" className="btn btn-secondary">View Access Logs</Link>
          <button onClick={() => logout()} className="btn btn-danger">Log Out</button>
        </div>
      </header>

      <div className="breadcrumb-trail">
        <Link to="/">Root</Link>
        {breadcrumbs.map((crumb: any) => (
          <span key={crumb.id}>
            {" / "}
            <Link to={`/folder/${crumb.id}`}>{crumb.name}</Link>
          </span>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Left column: Actions */}
        <div className="actions-panel">
          <div className="panel-card">
            <h3>Create Folder</h3>
            <form onSubmit={handleCreateFolder} className="panel-form">
              <input
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Folder Name"
                data-testid="folder-name-input"
                required
              />
              <button type="submit" data-testid="create-folder-btn" className="btn btn-primary">
                Create Folder
              </button>
            </form>
          </div>

          <div className="panel-card">
            <h3>Upload File</h3>
            <form onSubmit={handleFileUpload} className="panel-form">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                data-testid="file-upload-input"
                required
              />
              <button
                type="submit"
                data-testid="upload-file-btn"
                className="btn btn-primary"
                disabled={uploading || !file}
              >
                {uploading ? "Uploading..." : "Upload File"}
              </button>
            </form>
          </div>
        </div>

        {/* Right column: Content List */}
        <div className="content-panel">
          <div className="folders-section">
            <h2>Folders</h2>
            {subfolders.length === 0 ? (
              <p className="empty-text">No folders here.</p>
            ) : (
              <div className="folder-list">
                {subfolders.map((f: any) => (
                  <div key={f.id} className="folder-item">
                    <Link
                      to={`/folder/${f.id}`}
                      className="folder-link"
                      data-testid={`folder-link-${f.id}`}
                    >
                      📁 {f.name}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="files-section">
            <h2>Files</h2>
            {files.length === 0 ? (
              <p className="empty-text">No files here.</p>
            ) : (
              <div className="file-list">
                {files.map((f: any) => (
                  <div
                    key={f.id}
                    className="file-item"
                    data-testid={`file-item-${f.id}`}
                  >
                    <span className="file-name">📄 {f.name} ({(f.size / 1024).toFixed(1)} KB)</span>
                    <button
                      className="share-btn btn btn-secondary"
                      data-testid={`share-btn-${f.id}`}
                      onClick={() => {
                        setActiveShareFile(f);
                        setSharePassword("");
                        setShareExpires("");
                        setGeneratedLink("");
                      }}
                    >
                      Share
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {activeShareFile && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Share File: {activeShareFile.name}</h3>
            <form onSubmit={handleCreateShareLink} className="modal-form">
              <div className="form-group">
                <label>Password Protection (optional)</label>
                <input
                  type="password"
                  value={sharePassword}
                  onChange={(e) => setSharePassword(e.target.value)}
                  data-testid="share-password-input"
                  placeholder="Password"
                />
              </div>
              <div className="form-group">
                <label>Expiration (minutes, optional)</label>
                <input
                  type="number"
                  value={shareExpires}
                  onChange={(e) => setShareExpires(e.target.value)}
                  data-testid="share-expires-input"
                  placeholder="Minutes"
                  min="1"
                />
              </div>
              <div className="modal-actions">
                <button
                  type="submit"
                  data-testid="create-share-link-btn"
                  className="btn btn-primary"
                >
                  Create Link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveShareFile(null);
                    setGeneratedLink("");
                  }}
                  className="btn btn-secondary"
                >
                  Close
                </button>
              </div>
            </form>

            {generatedLink && (
              <div className="generated-link-box">
                <p>Sharing Link:</p>
                <div data-testid="share-link-display" className="share-link-text">
                  {generatedLink}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
