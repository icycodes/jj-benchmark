import { LoginForm, SignupForm } from "wasp/client/auth";
import { Link } from "react-router";

export function LoginPage() {
  return (
    <div className="auth-page">
      <LoginForm />
      <p>
        Don't have an account yet? <Link to="/signup">go to signup</Link>.
      </p>
    </div>
  );
}

export function SignupPage() {
  return (
    <div className="auth-page">
      <SignupForm />
      <p>
        I already have an account (<Link to="/login">go to login</Link>).
      </p>
    </div>
  );
}
