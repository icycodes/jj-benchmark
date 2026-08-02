import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useQuery } from "wasp/client/operations";
import { getFolderContents } from "wasp/client/operations";
import { createFolder, createShareLink } from "wasp/client/operations";
import { logout } from "wasp/client/auth";
import { config } from "wasp/client";
import "./Main.css";

interface DriveDashboardProps {
  folderId: number | null;
}

export function DriveDashboard({ folderId }: DriveDashboardProps) {
  const navigate = useNavigate();
  const [newFolderName, setNewFolderName] = useState("");
  const [folderError, setFolderNameError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Sharing state
  const [sharingFileId, setSharingFileId] = useState<number | null>(null);
  const [sharePassword, setSharePassword] = useState("");
  const [shareExpires, setShareExpires] = useState("");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  // Fetch folder contents
  const { data: contents, isLoading, error, refetch } = useQuery(getFolderContents, { folderId });

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFolderNameError(null);
    if (!newFolderName.trim()) return;

    try {
      await createFolder({ name: newFolderName, parentId: folderId });
      setNewFolderName("");
    } catch (err: any) {
      setFolderNameError(err.message || "Failed to create folder");
    }
  };

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadError(null);
    setUploading(true);

    const formData = new FormData(e.currentTarget);
    if (folderId) {
      formData.append("folderId", String(folderId));
    }

    const fileInput = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      setUploadError("Please select a file first");
      setUploading(false);
      return;
    }

    try {
      const sessionId = localStorage.getItem("wasp:sessionId");
      const uploadUrl = `${config.apiUrl.replace(/\/$/, "")}/api/upload`;

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          ...(sessionId && { Authorization: `Bearer ${sessionId}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.error || "Failed to upload file");
      }

      // Reset file input
      e.currentTarget.reset();
      // Refetch the query
      refetch();
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleCreateShareLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setShareError(null);
    setGeneratedLink(null);

    if (!sharingFileId) return;

    const expiresInMinutes = shareExpires ? Number(shareExpires) : undefined;

    try {
      const result = await createShareLink({
        fileId: sharingFileId,
        password: sharePassword || undefined,
        expiresInMinutes,
      });

      const sharePath = `/share/${result.id}`;
      // Construct full URL
      const fullUrl = `${window.location.origin}${sharePath}`;
      setGeneratedLink(fullUrl);
    } catch (err: any) {
      setShareError(err.message || "Failed to create share link");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Failed to log out", err);
    }
  };

  if (isLoading) return <div className="loading">Loading Wasp Drive...</div>;
  if (error) return <div className="error-message">Error: {error.message}</div>;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Wasp Drive</h1>
        </div>
        <div className="header-right">
          <Link to="/" className="nav-link">Dashboard</Link>
          <Link to="/logs" className="nav-link">Access Logs</Link>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <Link to="/" className="breadcrumb-item">Root</Link>
        {contents?.breadcrumbs.map((crumb: any) => (
          <span key={crumb.id}>
            <span className="breadcrumb-separator">/</span>
            <Link to={`/folder/${crumb.id}`} className="breadcrumb-item">
              {crumb.name}
            </Link>
          </span>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Left column: Controls */}
        <div className="controls-panel">
          {/* Create Folder Form */}
          <div className="panel-card">
            <h3>Create Folder</h3>
            {folderError && <div className="error-message">{folderError}</div>}
            <form onSubmit={handleCreateFolder}>
              <input
                type="text"
                placeholder="Folder Name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                data-testid="folder-name-input"
                className="form-input"
                required
              />
              <button
                type="submit"
                data-testid="create-folder-btn"
                className="action-btn"
              >
                Create Folder
              </button>
            </form>
          </div>

          {/* Upload File Form */}
          <div className="panel-card">
            <h3>Upload File</h3>
            {uploadError && <div className="error-message">{uploadError}</div>}
            <form onSubmit={handleFileUpload}>
              <input
                type="file"
                name="file"
                data-testid="file-upload-input"
                className="file-input"
                required
              />
              <button
                type="submit"
                data-testid="upload-file-btn"
                disabled={uploading}
                className="action-btn"
              >
                {uploading ? "Uploading..." : "Upload File"}
              </button>
            </form>
          </div>
        </div>

        {/* Right column: Content Lists */}
        <div className="content-panel">
          {/* Folder List */}
          <div className="content-section">
            <h3>Folders</h3>
            {contents?.folders.length === 0 ? (
              <p className="empty-text">No subfolders in this folder.</p>
            ) : (
              <div className="folders-grid">
                {contents?.folders.map((folder: any) => (
                  <Link
                    key={folder.id}
                    to={`/folder/${folder.id}`}
                    data-testid={`folder-link-${folder.id}`}
                    className="folder-link"
                  >
                    <span className="folder-icon">📁</span>
                    <span className="folder-name">{folder.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* File List */}
          <div className="content-section">
            <h3>Files</h3>
            {contents?.files.length === 0 ? (
              <p className="empty-text">No files in this folder.</p>
            ) : (
              <div className="files-list">
                {contents?.files.map((file: any) => (
                  <div
                    key={file.id}
                    data-testid={`file-item-${file.id}`}
                    className="file-item"
                  >
                    <div className="file-info">
                      <span className="file-icon">📄</span>
                      <span className="file-name">{file.name}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSharingFileId(file.id);
                        setSharePassword("");
                        setShareExpires("");
                        setGeneratedLink(null);
                        setShareError(null);
                      }}
                      data-testid={`share-btn-${file.id}`}
                      className="share-btn"
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

      {/* Share Link Form / Modal (if file is selected) */}
      {sharingFileId && (
        <div className="share-modal-overlay">
          <div className="share-modal">
            <div className="share-modal-header">
              <h3>
                Generate Share Link for "
                {contents?.files.find((f: any) => f.id === sharingFileId)?.name || "File"}
                "
              </h3>
              <button onClick={() => setSharingFileId(null)} className="close-btn">
                &times;
              </button>
            </div>
            {shareError && <div className="error-message">{shareError}</div>}
            <form onSubmit={handleCreateShareLink}>
              <div className="form-group">
                <label>Password (optional)</label>
                <input
                  type="password"
                  placeholder="Leave empty for public"
                  value={sharePassword}
                  onChange={(e) => setSharePassword(e.target.value)}
                  data-testid="share-password-input"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Expires In (minutes, optional)</label>
                <input
                  type="number"
                  placeholder="Never expires"
                  value={shareExpires}
                  onChange={(e) => setShareExpires(e.target.value)}
                  data-testid="share-expires-input"
                  className="form-input"
                  min="1"
                />
              </div>
              <button
                type="submit"
                data-testid="create-share-link-btn"
                className="action-btn"
              >
                Create Share Link
              </button>
            </form>

            {generatedLink && (
              <div className="generated-link-section">
                <p>Share Link Created successfully!</p>
                <div data-testid="share-link-display" className="share-link-display-box">
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
