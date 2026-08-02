import { LoginForm } from "wasp/client/auth";

export function LoginPage() {
  return (
    <main className="container">
      <h1>Login</h1>
      <LoginForm />
    </main>
  );
}
