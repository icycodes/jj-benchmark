import { SignupForm } from "wasp/client/auth";
import { Link } from "react-router";

export const SignupPage = () => {
  return (
    <div style={{ maxWidth: "400px", margin: "100px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Sign Up</h2>
      <SignupForm />
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        I already have an account (<Link to="/login">Go to login</Link>).
      </div>
    </div>
  );
};
