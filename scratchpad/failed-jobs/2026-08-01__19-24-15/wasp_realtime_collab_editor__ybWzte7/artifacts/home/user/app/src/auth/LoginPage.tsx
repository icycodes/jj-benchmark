import { Link } from "react-router";
import { LoginForm } from "wasp/client/auth";

export const LoginPage = () => {
  return (
    <div style={{ maxWidth: "400px", margin: "100px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h2 style={{ textAlign: "center" }}>Log In</h2>
      <LoginForm />
      <br />
      <div style={{ textAlign: "center" }}>
        <span>
          I don't have an account yet (<Link to="/signup">go to signup</Link>).
        </span>
      </div>
    </div>
  );
};
