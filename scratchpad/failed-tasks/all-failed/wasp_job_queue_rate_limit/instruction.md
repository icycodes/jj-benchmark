# Email Marketing Campaign Manager with PgBoss Background Jobs

## Background
You are building an Email Marketing Campaign Manager using Wasp (v0.24.0). The application allows users to create email marketing campaigns and process them in the background using PgBoss jobs. Since sending emails to external SMTP servers can be rate-limited, you must implement a robust rolling window rate limiter and exponential backoff retry strategy for the background jobs.

## Requirements
- **Wasp v0.24.0 (TypeScript Spec)**: All configuration must be defined in `main.wasp.ts` using the `@wasp.sh/spec` package.
- **Database**: PostgreSQL (required for PgBoss background jobs).
- **Authentication**: Wasp's built-in `usernameAndPassword` auth. The user entity is `User`. Protect the main dashboard so that only logged-in users can access it. Unauthenticated users must be redirected to `/login`.
- **Database Schema**:
  - `User`: Standard Wasp user entity.
  - `Campaign`: Fields include `id` (Int, PK, autoincrement), `name` (String), `status` (String: "PENDING", "PROCESSING", "COMPLETED"), `totalEmails` (Int), `sentCount` (Int), `failedCount` (Int), `createdAt` (DateTime), and relationships.
  - `CampaignEmail`: Fields include `id` (Int, PK, autoincrement), `campaignId` (Int), `emailAddress` (String), `status` (String: "PENDING", "SENT", "FAILED"), `errorMessage` (String, optional), `sentAt` (DateTime, optional), and `attempts` (Int, default 0).
- **Campaign Triggering & Operations**:
  - Create a Wasp Action `startCampaign` that is called from the frontend. It creates a `Campaign` and its associated `CampaignEmail` records, then schedules a PgBoss background job for each email in the campaign.
  - Create a Wasp Query `getCampaigns` that returns all campaigns and their emails for the logged-in user.
- **Background Job (`sendEmailJob`)**:
  - Define a background job `sendEmailJob` in `main.wasp.ts` using the `PgBoss` executor.
  - The job worker must process a single `CampaignEmail` by its ID.
  - **Rate Limiting (5 emails/min)**: Before simulating the send, the worker must query the database to count how many `CampaignEmail` records have `status === "SENT"` and a `sentAt` timestamp within the last 60 seconds (across all campaigns). If this count is >= 5, the job must throw a "Rate limit exceeded" error to trigger PgBoss retries.
  - **Simulated Delivery Failures**: If the email address contains the word `fail` (e.g., `fail-user@example.com`), the worker must intentionally throw a "Delivery failed" error on the first 2 attempts, but succeed on the 3rd attempt. This simulates a transient delivery issue.
  - **Success Handling**: On success, set `status` to `"SENT"`, `sentAt` to the current time, increment `attempts`, and update the campaign's progress (`sentCount`).
  - **Failure/Retry Handling**: If the job throws an error, increment `attempts` in the database, set `status` to `"FAILED"`, and store the error message in `errorMessage`. The campaign's `failedCount` must be updated. PgBoss must automatically retry the job using exponential backoff.
- **Job Retry Configuration**:
  - When submitting the job, configure PgBoss to retry up to 3 times (i.e., `retryLimit: 3`) with an initial delay of 5 seconds (`retryDelay: 5`) and backoff enabled (`retryBackoff: true`).
- **Frontend UI**:
  - `/signup`: Sign up page using Wasp's built-in `SignupForm` component.
  - `/login`: Login page using Wasp's built-in `LoginForm` component.
  - `/`: Protected dashboard showing:
    - A button with `id="trigger-campaign"` to trigger a new campaign. Clicking this button must call the `startCampaign` action to create a campaign with exactly 10 emails: 8 normal emails (e.g. `user1@example.com` to `user8@example.com`) and 2 failing emails (`fail1@example.com` and `fail2@example.com`).
    - A list of campaigns. For each campaign, display its name, status, total emails, sent count, and failed count.
    - A list of emails for each campaign, showing the email address, status, attempt count, and last error message.

## Implementation Hints
- Project path: `/home/user/app`
- Start command: `wasp start`
- Port: `3000`
- All custom server code must be written in TypeScript under `src/`.
- Ensure `DATABASE_URL` is set to your PostgreSQL connection string in the environment.
- All database modifications must be done via Prisma. Ensure you run `wasp db migrate-dev` to apply schema changes.
- Wasp's built-in auth uses Lucia. Ensure the user entity has the fields required by Wasp's auth system.
- The rate limit of 5 emails/minute must be evaluated using a rolling 60-second window based on the `sentAt` timestamp in the database.

