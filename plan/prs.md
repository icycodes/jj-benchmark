# Selected Pull Requests for Benchmark Tasks

This document contains a curated list of selected Pull Requests (PRs) from the `fetched_prs.json` dataset. These PRs have been analyzed and chosen because they introduce non-trivial logic, fix complex bugs, or implement significant backend and tooling features.

All selected tasks are **container-based, self-contained, and free from external cloud dependencies**, making them ideal candidates for robust benchmark tasks.

---

## Tooling & Process Management

### 1. Type-check the app while `wasp start` runs
* **URL:** [PR #4669](https://github.com/wasp-lang/wasp/pull/4669)
* **Title:** `Type-check the app while wasp start runs`
* **Why it represents a good benchmark task:**
  * **Process Management:** Spawns `tsc` in a detached child process on every change during development.
  * **Asynchronous Control:** Implements a 150ms debounce mechanism and cancels any currently running type-check process if a new change arrives to prevent process/resource leakages.
  * **Non-blocking Execution:** Runs concurrently with server restarts, ensuring that compilation errors do not block the runtime or degrade the developer experience.
  * **Self-contained:** Operates entirely within local workspace environments, testing file-watching, process orchestration, and TypeScript compiler APIs locally.

### 2. Run the dev server inside Vite instead of nodemon
* **URL:** [PR #4667](https://github.com/wasp-lang/wasp/pull/4667)
* **Title:** `Run the dev server inside Vite instead of nodemon`
* **Why it represents a good benchmark task:**
  * **Architectural Complexity:** Migrates from a dual-process runner (`nodemon` + `vite`) to a unified, single-process dev server running the server in-process via Vite's module runner.
  * **Lifecycle Management:** Manages start/stop sequences via a promise queue, handles HMR updates, and implements address-in-use (`EADDRINUSE`) retries.
  * **Robustness & Error Isolation:** Installs custom `unhandledRejection` and `uncaughtException` guards to prevent runtime crashes from taking down the dev server.
  * **Self-contained:** Perfect local-only developer tooling benchmark focusing on process lifecycle and bundler integration.

### 3. Bundle the server with Vite instead of rollup
* **URL:** [PR #4665](https://github.com/wasp-lang/wasp/pull/4665)
* **Title:** `Bundle the server with Vite instead of rollup`
* **Why it represents a good benchmark task:**
  * **Build System Logic:** Replaces Rollup with Vite's environment builder APIs (`createBuilder`) for bundling the generated Node.js server.
  * **Compile-Time Validation:** Resolves virtual user modules and blocks server code from importing client-only components (`wasp/client*`).
  * **Self-contained:** Focuses on static analysis, bundler configurations, and code generation validation.

---

## Security, Authentication & Session Management

### 4. Validate the reset token before the password in `resetPassword`
* **URL:** [PR #4657](https://github.com/wasp-lang/wasp/pull/4657)
* **Title:** `[auth-fixes 7/12] Validate the reset token before the password in resetPassword`
* **Why it represents a good benchmark task:**
  * **Security Logic:** Corrects a vulnerability where password strength validation ran before JWT token verification, allowing unauthenticated clients to probe password policy rules.
  * **Execution Ordering:** Re-sequences validation steps (checking token presence first, verifying the JWT token, then running password strength checks).
  * **Self-contained:** A pure-logic, security-focused task that can be easily tested within a container via simulated HTTP requests.

### 5. Invalidate existing sessions on password reset
* **URL:** [PR #4653](https://github.com/wasp-lang/wasp/pull/4653)
* **Title:** `[auth-fixes 5/12] Invalidate existing sessions on password reset`
* **Why it represents a good benchmark task:**
  * **State & Session Management:** Integrates with the authentication library (Lucia) to implement session invalidation (`invalidateAllSessionsForAuthId`) upon password resets.
  * **Security Improvement:** Ensures active sessions on other devices are terminated immediately when a password is changed.
  * **Self-contained:** Easily testable using a local database container and mock session requests.

### 6. Await the auth email send instead of firing and forgetting
* **URL:** [PR #4654](https://github.com/wasp-lang/wasp/pull/4654)
* **Title:** `[auth-audit 6/14] Await the auth email send instead of firing and forgetting`
* **Why it represents a good benchmark task:**
  * **Asynchronous Flow Control:** Converts a fire-and-forget email send into an awaited promise to ensure correct sequencing of metadata writes.
  * **Timing Oracle Security:** Catches delivery errors internally to ensure that the API response (status code and body) remains identical regardless of delivery success, preventing timing attacks or user enumeration.
  * **Self-contained:** Tests deep asynchronous patterns, exception handling, and security design trade-offs without requiring actual external SMTP servers (can be tested using mock email providers).

### 7. Guard against an unguarded null dereference in `verifyEmail`
* **URL:** [PR #4652](https://github.com/wasp-lang/wasp/pull/4652)
* **Title:** `[auth-fixes 4/12] Guard against an unguarded null dereference in verifyEmail`
* **Why it represents a good benchmark task:**
  * **Defensive Programming:** Fixes a potential 500 crash caused by unlinked orphan `Auth` rows during email verification.
  * **TypeScript Strictness:** Solves a compiler error when `strictNullChecks` is enabled (`auth is possibly null`).
  * **Self-contained:** Excellent standard bugfix benchmark focusing on type safety and null-guarding.

---

## Database Integration & Error Parsing

### 8. Stop reporting every P2002 as "same identity already exists"
* **URL:** [PR #4656](https://github.com/wasp-lang/wasp/pull/4656)
* **Title:** `[auth-audit 8/15] Stop reporting every P2002 as "same identity already exists"`
* **Why it represents a good benchmark task:**
  * **Error Parsing & Normalization:** Parses database-specific unique-constraint violation errors (Prisma `P2002`).
  * **Data Structure Handling:** Safely handles both array-based targets (PostgreSQL/MySQL) and string-based targets (SQLite model-prefixed format) in `e.meta.target`.
  * **User Experience:** Dynamically extracts colliding column names and formats precise error messages instead of generic fallbacks.
  * **Self-contained:** Focuses on error-handling middleware, Prisma client integration, and database driver error parsing.

---

## CLI Tooling & Diagnostics

### 9. Fix version mismatch error message in `wasp deploy`
* **URL:** [PR #4633](https://github.com/wasp-lang/wasp/pull/4633)
* **Title:** `Fix version mismatch error message in wasp deploy`
* **Why it represents a good benchmark task:**
  * **Inter-process Communication:** Checks both `stdout` and `stderr` streams of a spawned `wasp info` subprocess.
  * **Error Propagation:** Detects version mismatch strings and correctly propagates precise errors to the user rather than swallowing them.
  * **Self-contained:** Tests subprocess handling, stream reading, and error parsing in a CLI environment.

### 10. Add `wasp show build` command
* **URL:** [PR #4625](https://github.com/wasp-lang/wasp/pull/4625)
* **Title:** `Add wasp show build command`
* **Why it represents a good benchmark task:**
  * **CLI Feature Implementation:** Adds a new command under the `wasp show` parser.
  * **Data Formatting:** Inspects local build metadata, calculates directory sizes, formats output tables, and supports JSON output formatting (`--json`).
  * **Self-contained:** Evaluates command-line interface design, argument parsing, and structured output formatting.
