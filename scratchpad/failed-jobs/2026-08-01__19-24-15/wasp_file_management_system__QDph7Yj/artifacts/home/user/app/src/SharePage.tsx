import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import { getShareLink, useQuery } from "wasp/client/operations";
import { config } from "wasp/client";

export const SharePage: React.FC = () => {
  const { linkId } = useParams<{ linkId: string }>();
  const [password, setPassword] = useState("");
  const [enteredPassword, setEnteredPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { data: shareLink, isLoading, error } = useQuery(
    getShareLink,
    { linkId: linkId || "", password: enteredPassword || undefined }
  );

  useEffect(() => {
    if (shareLink) {
      if (shareLink.notFound) {
        setErrorMsg("Share link not found");
      } else if (shareLink.expired) {
        setErrorMsg("This sharing link has expired");
      } else if (shareLink.hasPassword && !shareLink.passwordCorrect && enteredPassword) {
        setErrorMsg("Incorrect password");
      } else {
        setErrorMsg("");
      }
    }
  }, [shareLink, enteredPassword]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setEnteredPassword(password);
  };

  if (isLoading) {
    return <div style={{ padding: "20px", fontFamily: "sans-serif" }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ padding: "20px", color: "red", fontFamily: "sans-serif" }}>Error: {error.message}</div>;
  }

  const showDownload = shareLink && !shareLink.expired && !shareLink.notFound && (!shareLink.hasPassword || shareLink.passwordCorrect);

  const downloadUrl = shareLink
    ? `${config.apiUrl}/api/download/${linkId}${enteredPassword ? `?password=${encodeURIComponent(enteredPassword)}` : ""}`
    : "";

  return (
    <div style={{ maxWidth: "500px", margin: "100px auto", padding: "30px", border: "1px solid #17a2b8", borderRadius: "8px", fontFamily: "sans-serif", backgroundColor: "#fcfdfe" }}>
      <h2 style={{ textAlign: "center", color: "#17a2b8", marginBottom: "20px" }}>Wasp File Share</h2>

      {errorMsg && (
        <div
          data-testid="share-error"
          style={{
            padding: "12px",
            backgroundColor: "#f8d7da",
            color: "#721c24",
            border: "1px solid #f5c6cb",
            borderRadius: "4px",
            marginBottom: "20px",
            textAlign: "center",
            fontWeight: "bold"
          }}
        >
          {errorMsg}
        </div>
      )}

      {shareLink && !shareLink.expired && !shareLink.notFound && (
        <div>
          <p style={{ fontSize: "16px", marginBottom: "20px", textAlign: "center" }}>
            You have been invited to download: <br />
            <strong style={{ fontSize: "18px", color: "#333" }}>{shareLink.fileName}</strong>
            {shareLink.fileSize !== undefined && ` (${(shareLink.fileSize / 1024).toFixed(1)} KB)`}
          </p>

          {shareLink.hasPassword && !shareLink.passwordCorrect && (
            <form onSubmit={handleUnlock} style={{ marginBottom: "20px" }}>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>This file is password-protected:</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="unlock-password-input"
                  required
                  style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
                />
              </div>
              <button
                type="submit"
                data-testid="unlock-btn"
                style={{ width: "100%", padding: "10px", backgroundColor: "#17a2b8", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
              >
                Unlock File
              </button>
            </form>
          )}

          {showDownload && (
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <p style={{ color: "#28a745", fontWeight: "bold", marginBottom: "15px" }}>🔓 Unlocked Successfully!</p>
              <a
                href={downloadUrl}
                data-testid="download-btn"
                style={{
                  display: "inline-block",
                  padding: "12px 30px",
                  backgroundColor: "#28a745",
                  color: "#fff",
                  textDecoration: "none",
                  borderRadius: "4px",
                  fontWeight: "bold",
                  fontSize: "16px",
                  boxShadow: "0 4px 6px rgba(40,167,69,0.2)"
                }}
              >
                Download File
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
