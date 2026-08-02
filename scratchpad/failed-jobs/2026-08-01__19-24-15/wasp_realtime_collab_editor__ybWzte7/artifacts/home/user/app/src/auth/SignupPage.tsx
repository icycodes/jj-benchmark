import { Link } from "react-router";
import { SignupForm } from "wasp/client/auth";

export const SignupPage = () => {
  return (
    <div style={{ maxWidth: "400px", margin: "100px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h2 style={{ textAlign: "center" }}>Sign Up</h2>
      <SignupForm />
      <br />
      <div style={{ textAlign: "center" }}>
        <span>
          I already have an account (<Link to="/login">go to login</Link>).
        </span>
      </div>
    </div>
  );
};
