import { Link } from "react-router";
import { SignupForm } from "wasp/client/auth";

export function SignupPage() {
  return (
    <div style={{ maxWidth: "400px", margin: "40px auto", padding: "20px", fontFamily: "sans-serif" }}>
      <h2 style={{ textAlign: "center" }}>Sign Up</h2>
      <SignupForm />
      <p style={{ marginTop: "20px", textAlign: "center" }}>
        Already have an account? <Link to="/login">Go to login</Link>
      </p>
    </div>
  );
}
