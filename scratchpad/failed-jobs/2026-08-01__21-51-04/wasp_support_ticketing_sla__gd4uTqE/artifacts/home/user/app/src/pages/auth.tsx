import { LoginForm, SignupForm } from "wasp/client/auth";
import { Link } from "react-router";

export function LoginPage() {
  return (
    <div style={{ maxWidth: "400px", margin: "40px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h2>Login</h2>
      <LoginForm />
      <p style={{ marginTop: "15px" }}>
        Don't have an account yet? <Link to="/signup">Go to signup</Link>.
      </p>
    </div>
  );
}

export function SignupPage() {
  return (
    <div style={{ maxWidth: "400px", margin: "40px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h2>Signup</h2>
      <SignupForm
        additionalFields={[
          {
            name: "role",
            label: "Role (CUSTOMER, AGENT, MANAGER)",
            type: "input",
            validations: {
              required: "Role is required",
            },
          },
        ]}
      />
      <p style={{ marginTop: "15px" }}>
        I already have an account <Link to="/login">(Go to login)</Link>.
      </p>
    </div>
  );
}
