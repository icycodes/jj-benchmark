# Wasp Multi-Tenant SaaS Billing & Feature Flag System

## Background
In SaaS applications, managing multi-tenancy (organizations), role-based access control (RBAC), and subscription plans with feature restrictions is a common and complex task.
In this task, you will build a multi-tenant subscription management system in Wasp `^0.24.0` with custom roles, billing tiers, and feature flags.

## Requirements
- **Wasp Version**: You must use Wasp `^0.24.0`. The configuration must be defined in `main.wasp.ts` using the `@wasp.sh/spec` package.
- **Project Location**: `/home/user/app`
- **Start Command**: `wasp start`
- **Port**: 3000
- **Database**: SQLite (default)

### 1. Data Model (`schema.prisma`)
You must define the following entities:
- `User`:
  - `id`: Int (primary key, autoincrement)
  - `username`: String (unique)
  - `password`: String
  - `memberships`: Relation to `Membership`
- `Organization`:
  - `id`: Int (primary key, autoincrement)
  - `name`: String
  - `plan`: String (default: "FREE") - can be "FREE", "PRO", or "ENTERPRISE"
  - `memberships`: Relation to `Membership`
- `Membership`:
  - `id`: Int (primary key, autoincrement)
  - `role`: String (default: "MEMBER") - can be "OWNER", "ADMIN", or "MEMBER"
  - `userId`: Int
  - `organizationId`: Int
  - `user`: Relation to `User`
  - `organization`: Relation to `Organization`
  - There must be a unique constraint on `[userId, organizationId]` (a user cannot have multiple memberships in the same organization).

### 2. Authentication
- Enable `usernameAndPassword` authentication in Wasp.
- Redirect unauthenticated users to `/login`.

### 3. Routes & Pages
Configure the following routes and pages in `main.wasp.ts`:
- `/signup`: Render signup form.
- `/login`: Render login form.
- `/`: Main Dashboard page (authRequired: true).
  - Displays a list of organizations the logged-in user belongs to, with links/buttons to view each organization's details page at `/organization/:id`.
  - Displays a form to "Create Organization":
    - Input field labeled "Organization Name" (or with placeholder "Organization Name" or id `org-name-input`).
    - A button with text "Create Organization".
    - Clicking the button creates the organization, adds the current user as the "OWNER" of that organization, and redirects the user to `/organization/:id`.
- `/organization/:id`: Organization details page (authRequired: true).
  - Displays:
    - Organization name.
    - User's role: "Your Role: OWNER", "Your Role: ADMIN", or "Your Role: MEMBER".
    - Current Plan: "Current Plan: FREE", "Current Plan: PRO", or "Current Plan: ENTERPRISE".
  - **Add Member Section**:
    - If the user's role is "OWNER" or "ADMIN":
      - Display a form to add a member.
      - Input field with id `member-username-input` or labeled "Username".
      - Dropdown/select with id `member-role-select` containing options "ADMIN" and "MEMBER".
      - Button with text "Add Member".
      - Clicking "Add Member" adds the existing user with that username to the organization.
    - If the user's role is "MEMBER":
      - Do NOT show the form/button, and instead display the text: "Only Owners and Admins can add members".
  - **Billing Section**:
    - If the user's role is "OWNER":
      - Display a select dropdown with id `plan-select` containing options "FREE", "PRO", "ENTERPRISE".
      - Button with text "Update Plan".
      - Clicking "Update Plan" updates the organization's plan tier.
    - If the user's role is "ADMIN" or "MEMBER":
      - Do NOT show the billing update controls, and instead display the text: "Only Owners can manage billing".
  - **Features Section**:
    - "Analytics Feature":
      - If plan is "FREE": display "Upgrade to PRO to access Analytics".
      - If plan is "PRO" or "ENTERPRISE": display "Analytics Data: Active".
    - "Audit Logs Feature":
      - If plan is "FREE" or "PRO": display "Upgrade to ENTERPRISE to access Audit Logs".
      - If plan is "ENTERPRISE": display "Audit Logs: Active".
  - **Logout**:
    - Button with text "Logout" to sign out.

### 4. Implementation Hints & I/O Contracts
- Remember that in Wasp `^0.24.0`, imports of your own code (pages, queries, actions) in `main.wasp.ts` must use the `with { type: \"ref\" }` syntax!
- Use Prisma's relations and safe queries/actions on the server. Always validate permissions on the server (e.g., ensure only Owners can update billing plans, only Owners/Admins can add members).
- Run `wasp db migrate-dev` to apply database schema changes.
- Ensure that elements have the specified text, labels, or IDs so they can be easily found and verified by the automated browser test.

