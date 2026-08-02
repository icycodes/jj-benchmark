import { LoginForm } from "wasp/client/auth";
import { Link } from "react-router";

export const LoginPage = () => {
  return (
    <div style={{ maxWidth: "400px", margin: "100px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Login</h2>
      <LoginForm />
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        Don't have an account yet? <Link to="/signup">Go to signup</Link>.
      </div>
    </div>
  );
};
