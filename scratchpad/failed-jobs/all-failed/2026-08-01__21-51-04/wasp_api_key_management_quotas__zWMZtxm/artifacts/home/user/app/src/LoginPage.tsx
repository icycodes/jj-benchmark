import { LoginForm } from "wasp/client/auth";

export function LoginPage() {
  return (
    <div style={{ maxWidth: "400px", margin: "40px auto", padding: "20px", fontFamily: "sans-serif" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Log In</h2>
      <LoginForm />
      <p style={{ marginTop: "20px", textAlign: "center" }}>
        Don't have an account? <a href="/signup">Sign up</a>
      </p>
    </div>
  );
}
