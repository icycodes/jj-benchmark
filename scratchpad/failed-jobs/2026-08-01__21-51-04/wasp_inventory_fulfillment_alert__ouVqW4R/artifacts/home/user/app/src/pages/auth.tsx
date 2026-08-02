import { Link } from "react-router";
import { LoginForm, SignupForm } from "wasp/client/auth";

export const LoginPage = () => {
  return (
    <div style={{ maxWidth: "400px", margin: "40px auto", padding: "20px" }}>
      <h1>Login</h1>
      <LoginForm />
      <p style={{ marginTop: "20px" }}>
        Don't have an account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  );
};

export const SignupPage = () => {
  return (
    <div style={{ maxWidth: "400px", margin: "40px auto", padding: "20px" }}>
      <h1>Sign Up</h1>
      <SignupForm />
      <p style={{ marginTop: "20px" }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
};
