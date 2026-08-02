import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { signup } from "wasp/client/auth";
import { RUN_ID } from "./config";
import "./Main.css";

export function SignupPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let finalUsername = username.trim();
    if (!finalUsername) {
      setError("Username is required");
      return;
    }

    if (!finalUsername.endsWith(`-${RUN_ID}`)) {
      finalUsername = `${finalUsername}-${RUN_ID}`;
    }

    try {
      await signup({ username: finalUsername, password });
      navigate("/login");
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Sign Up for Wasp Drive</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter desired username"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter strong password"
              required
            />
          </div>
          <button type="submit" className="auth-btn">
            Sign Up
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
