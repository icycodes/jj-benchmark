import { SignupForm } from "wasp/client/auth";

export function SignupPage() {
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem' }}>
      <SignupForm
        additionalFields={[
          {
            name: "role",
            label: "Role (CUSTOMER, AGENT, or MANAGER)",
            type: "input",
            validations: {
              required: "Role is required",
            },
          },
        ]}
      />
    </div>
  );
}
