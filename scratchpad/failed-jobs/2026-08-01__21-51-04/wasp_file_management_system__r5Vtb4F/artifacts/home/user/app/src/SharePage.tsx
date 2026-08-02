import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { useQuery, getShareLink } from "wasp/client/operations";
import "./Main.css";

export function SharePage() {
  const { linkId } = useParams<{ linkId: string }>();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Fetch share link metadata
  const { data: shareLink, isLoading, error: queryError } = useQuery(getShareLink, {
    linkId: linkId || "",
  });

  useEffect(() => {
    if (queryError) {
      setError((queryError as any).message || "Share link has expired or is invalid");
    }
  }, [queryError]);

  if (isLoading) return <div className="loading">Loading shared file...</div>;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // Verify password by calling the download API with query param
      const response = await fetch(`/api/download/${linkId}?password=${encodeURIComponent(password)}`);
      if (response.ok) {
        setIsUnlocked(true);
      } else {
        const data = await response.json();
        setError(data.error || "Incorrect password");
      }
    } catch (err: any) {
      setError("Failed to verify password");
    }
  };

  const downloadUrl = `/api/download/${linkId}${
    shareLink?.isPasswordProtected ? `?password=${encodeURIComponent(password)}` : ""
  }`;

  return (
    <div className="share-page-container">
      <div className="share-card">
        <h2>Shared File</h2>

        {error && (
          <div data-testid="share-error" className="error-message">
            {error}
          </div>
        )}

        {shareLink && (
          <div className="share-info">
            <p className="file-display">📄 <strong>{shareLink.fileName}</strong></p>

            {shareLink.isPasswordProtected && !isUnlocked ? (
              <form onSubmit={handleUnlock} className="unlock-form">
                <p className="help-text">This file is password-protected. Please enter the password to download.</p>
                <div className="form-group">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="unlock-password-input"
                    placeholder="Enter password"
                    required
                  />
                </div>
                <button type="submit" data-testid="unlock-btn" className="btn btn-primary">
                  Unlock
                </button>
              </form>
            ) : (
              <div className="download-section">
                <p className="success-text">File is ready for download!</p>
                <a
                  href={downloadUrl}
                  data-testid="download-btn"
                  className="btn btn-success"
                  download
                >
                  Download File
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
