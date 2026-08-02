import { LoginForm } from "wasp/client/auth";

export function LoginPage() {
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem' }}>
      <LoginForm />
    </div>
  );
}
