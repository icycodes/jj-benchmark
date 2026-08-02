import { LoginForm, SignupForm } from "wasp/client/auth";
import { Link } from "react-router";

export function LoginPage() {
  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "2rem" }}>
      <LoginForm />
      <p style={{ marginTop: "1rem" }}>
        Don't have an account yet? <Link to="/signup">Go to signup</Link>.
      </p>
    </div>
  );
}

export function SignupPage() {
  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "2rem" }}>
      <SignupForm
        additionalFields={[
          (form, state) => (
            <div key="role-field" style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Role</label>
              <select
                {...form.register("role", { required: "Role is required" })}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              >
                <option value="CUSTOMER">Customer</option>
                <option value="AGENT">Agent</option>
                <option value="MANAGER">Manager</option>
              </select>
              {form.formState.errors.role && (
                <span style={{ color: "red", fontSize: "0.875rem" }}>
                  {form.formState.errors.role.message as string}
                </span>
              )}
            </div>
          ),
        ]}
      />
      <p style={{ marginTop: "1rem" }}>
        I already have an account (<Link to="/login">Go to login</Link>).
      </p>
    </div>
  );
}
