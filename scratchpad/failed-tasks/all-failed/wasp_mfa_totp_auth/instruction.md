# Wasp.sh Multi-Factor Authentication (MFA) via TOTP

## Background
Multi-Factor Authentication (MFA) is a critical security feature for modern web applications. In this task, you will implement a complete, robust 2FA system using Time-based One-Time Passwords (TOTP) in a Wasp (v0.24.x) application.

## Requirements
1. **User Authentication**: Use Wasp's built-in `usernameAndPassword` authentication method.
2. **2FA Enrollment**:
   - Users should be able to enable 2FA from their dashboard.
   - When enabling, the system must generate a cryptographically secure TOTP secret and 8 backup codes (each 8 alphanumeric characters).
   - Display the raw TOTP secret as text (`Secret: <secret_code>`) and a QR code (or an SVG rendering of the QR code) so the user can scan it.
   - The user must enter a valid 6-digit TOTP token from their authenticator app to confirm and finalize enabling 2FA.
3. **2FA Verification**:
   - If a user has 2FA enabled, logging in with username and password should NOT immediately grant them full access. They must be redirected to a `/verify-2fa` page.
   - On `/verify-2fa`, they must enter a valid 6-digit TOTP token or one of their unused backup codes to complete the login.
   - Once verified, they are redirected to the home page `/`.
   - If they have 2FA enabled but have not verified it for the current session, they must be blocked from accessing the home page and any protected queries/actions.
4. **Backup Codes Management**:
   - Each backup code can only be used once.
   - Once a backup code is used, it must be marked as used or deleted from the database.
5. **Protected Resource**:
   - Implement a `SecretNote` entity in `schema.prisma`.
   - Users can only query or create `SecretNote`s if they are logged in AND their 2FA is verified (if 2FA is enabled). Otherwise, the operations must throw a `403 Forbidden` error.

## Implementation Hints
- **Project path**: `/home/user/app`
- **Start command**: `wasp start`
- **Port**: `3000`
- **Database**: SQLite (default)
- **Database Schema (`schema.prisma`)**:
  - The `User` entity must have the following fields:
    - `id`: `Int @id @default(autoincrement())`
    - `totpSecret`: `String?`
    - `totpEnabled`: `Boolean @default(false)`
    - `backupCodes`: `String?` (to store the backup codes, e.g. as a comma-separated string or serialized JSON array of strings)
  - The `SecretNote` entity must have:
    - `id`: `Int @id @default(autoincrement())`
    - `content`: `String`
    - `userId`: `Int`
    - `user`: `User @relation(fields: [userId], references: [id])`
- **Frontend Pages & Routes**:
  - `/signup`: Standard signup page.
  - `/login`: Standard login page.
  - `/verify-2fa`: The 2FA verification page.
  - `/`: The home page (requires auth).
- **UI Elements and Selectors**:
  - **Signup Page**:
    - Username input: `input[name="username"]`
    - Password input: `input[name="password"]`
    - Signup button: `button` containing the text "Sign up" or "Signup"
  - **Login Page**:
    - Username input: `input[name="username"]`
    - Password input: `input[name="password"]`
    - Login button: `button` containing the text "Log in" or "Login"
  - **Verify 2FA Page**:
    - Code input: `input[name="verifyCode"]` or placeholder "Verification Code"
    - Verify button: `button` containing the text "Verify"
  - **Home Page (`/`)**:
    - Username display text: must contain "Logged in as: <username>"
    - 2FA status display text: must contain "2FA Status: Enabled" or "2FA Status: Disabled"
    - "Enable 2FA" button: `button` containing the text "Enable 2FA"
    - "Disable 2FA" button: `button` containing the text "Disable 2FA"
    - **2FA Setup Section** (visible after clicking "Enable 2FA" but before confirming):
      - Must display the raw TOTP secret in an element with text: `Secret: <secret_code>` (where `<secret_code>` is the exact secret key, e.g., `Secret: JBSWY3DPEHPK3PXP`)
      - Must display a QR code or an SVG of the QR code.
      - Must display the backup codes in a list or block.
      - Confirmation code input: `input[name="totpCode"]` or placeholder "TOTP Code"
      - Confirm & Enable button: `button` containing the text "Confirm & Enable"
    - **Secret Notes Section** (only visible when logged in and 2FA verified/disabled):
      - Note input: `input[name="noteContent"]` or placeholder "New Secret Note"
      - Add note button: `button` containing the text "Add Note"
      - Notes list: display the content of all notes created by the user.
- **Session Tracking**:
  - You must implement a reliable session-level tracking mechanism to know if a logged-in user has verified their 2FA for the current session.
  - This can be done by generating a session token upon successful 2FA verification, storing it in `localStorage` as `'2fa_token'`, and checking it in your queries/actions.

