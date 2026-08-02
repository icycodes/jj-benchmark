import { SignupForm } from 'wasp/client/auth';
import { Link } from 'wasp/client/router';

export function SignupPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f9f9f9' }}>
      <div style={{ maxWidth: '400px', width: '100%', padding: '30px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>Create an Account</h2>
        <SignupForm />
        <p style={{ marginTop: '20px', textAlign: 'center', color: '#666' }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
