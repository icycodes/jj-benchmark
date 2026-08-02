import { SignupForm } from "wasp/client/auth";

export function SignupPage() {
  return (
    <main style={{ padding: "2rem", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <div style={{ maxWidth: "400px", width: "100%", background: "#f9f9f9", padding: "2rem", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>Sign Up</h2>
        <SignupForm />
        <p style={{ textAlign: "center", marginTop: "1rem" }}>
          Already have an account? <a href="/login">Log in</a>
        </p>
      </div>
    </main>
  );
}
