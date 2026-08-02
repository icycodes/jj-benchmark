import { SignupForm } from "wasp/client/auth";

export function SignupPage() {
  return (
    <div style={{ maxWidth: "400px", margin: "40px auto", padding: "20px", fontFamily: "sans-serif" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Sign Up</h2>
      <SignupForm />
      <p style={{ marginTop: "20px", textAlign: "center" }}>
        Already have an account? <a href="/login">Log in</a>
      </p>
    </div>
  );
}
