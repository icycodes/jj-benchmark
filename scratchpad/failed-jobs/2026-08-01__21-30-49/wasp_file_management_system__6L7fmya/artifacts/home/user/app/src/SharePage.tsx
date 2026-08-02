import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { useQuery } from "wasp/client/operations";
import { getShareLinkDetails } from "wasp/client/operations";
import { config } from "wasp/client";
import "./Main.css";

export function SharePage() {
  const { linkId } = useParams<{ linkId: string }>();
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch share link details
  const { data: details, isLoading, error: queryError } = useQuery(getShareLinkDetails, {
    linkId: linkId || "",
  });

  useEffect(() => {
    if (details?.isExpired) {
      setError("This sharing link has expired.");
    }
  }, [details]);

  if (isLoading) return <div className="loading">Loading Shared File...</div>;

  if (queryError) {
    return (
      <div className="share-public-container">
        <div className="share-public-card">
          <div data-testid="share-error" className="error-message">
            {queryError.message || "Sharing link not found or invalid."}
          </div>
        </div>
      </div>
    );
  }

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    try {
      const downloadUrl = `${config.apiUrl.replace(/\/$/, "")}/api/download/${linkId}?password=${encodeURIComponent(password)}`;
      // Make a lightweight fetch request to verify the password
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Incorrect password");
      }
      setIsUnlocked(true);
    } catch (err: any) {
      setError(err.message || "Incorrect password");
    }
  };

  const downloadUrl = `${config.apiUrl.replace(/\/$/, "")}/api/download/${linkId}${
    password ? `?password=${encodeURIComponent(password)}` : ""
  }`;

  return (
    <div className="share-public-container">
      <div className="share-public-card">
        <h2>Shared File</h2>
        <div className="file-box">
          <span className="file-icon large">📄</span>
          <span className="file-name large">{details?.fileName}</span>
        </div>

        {error && (
          <div data-testid="share-error" className="error-message">
            {error}
          </div>
        )}

        {details?.isPasswordProtected && !isUnlocked ? (
          <form onSubmit={handleUnlock} className="unlock-form">
            <p className="instruction">This file is password-protected. Enter password to access.</p>
            <div className="form-group">
              <input
                type="password"
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="unlock-password-input"
                className="form-input"
                required
              />
            </div>
            <button type="submit" data-testid="unlock-btn" className="auth-btn">
              Unlock
            </button>
          </form>
        ) : (
          <div className="download-section">
            {!details?.isExpired && (
              <>
                <p className="success-text">File is ready for download!</p>
                <a
                  href={downloadUrl}
                  data-testid="download-btn"
                  className="download-btn-link"
                  download
                >
                  Download File
                </a>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
