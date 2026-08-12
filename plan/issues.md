# Selected Wasp Issues for Evaluation Tasks

After reviewing the list of user issues for the Wasp repository, we have selected **10 high-quality issues** that represent authentic developer friction points, complex build/configuration challenges, or significant bugs.

These issues have been selected because they are:
1. **Self-contained**: They do not depend on external cloud providers or third-party paid services (such as Fly.io or Railway).
2. **Container-safe & Locally Reproducible**: They can be run, developed, and tested in a local environment or isolated Docker container.
3. **Deterministically Verifiable**: They have clear success/failure criteria that can be checked programmatically (via compiler checks, CLI outputs, file generation, or integration tests).

---

## Summary of Selected Issues

| Issue # | Title | Category | Complexity | Key Challenge |
| :--- | :--- | :--- | :--- | :--- |
| **#4598** | [Using one page in two routes breaks wasp start](#issue-4598-using-one-page-in-two-routes-breaks-wasp-start) | Code Generation Bug | Medium | Deduplicate import generation in Haskell compiler |
| **#4572** | [Prevent `wasp start` from connecting to another project's database](#issue-4572-prevent-wasp-start-from-connecting-to-another-projects-database) | Database / Security | Medium | Derive secure DB credentials from project-specific unique ID |
| **#4528** | [Wasp watches too many files in projects and can create infinite loops](#issue-4528-wasp-watches-too-many-files-in-projects-and-can-create-infinite-loops) | Build System / Watcher | Medium | Refine file watching filters to ignore logs/notes |
| **#4603** | [Add an apply-only database migration command](#issue-4603-add-an-apply-only-database-migration-command) | CLI / Database | Medium | Implement non-interactive Prisma migration deployment |
| **#4594** | [`wasp db start` can leave a container running if interrupted](#issue-4594-wasp-db-start-can-leave-a-container-running-if-interrupted) | CLI / Container | Medium | Add robust signal handling and Docker container cleanup |
| **#4481** | [Choose another port in `wasp start` when the default one is in use](#issue-4481-choose-another-port-in-wasp-start-when-the-default-one-is-in-use) | CLI / Configuration | Hard | Implement dynamic port scanning and CLI port parameters |
| **#4480** | [Flash of unstyled content (FOUC) on pre-rendered and lazy loaded pages](#issue-4480-flash-of-unstyled-content-fouc-on-pre-rendered-and-lazy-loaded-pages) | Frontend / Bundler | Hard | Parse Vite manifest to inject lazy-loaded CSS chunks during SSR |
| **#4478** | [Fail gracefully on concurrent compiles](#issue-4478-fail-gracefully-on-concurrent-compiles) | Concurrency / Locking | Hard | Implement process-level locking using a PID lockfile |
| **#4470** | [Gracefully handle syntax errors in user spec files](#issue-4470-gracefully-handle-syntax-errors-in-user-spec-files) | Parser / Error UX | Medium | Catch Node/TS parsing errors and print clean diagnostics |
| **#4465** | [dedup head content between global and prerendered pages](#issue-4465-dedup-head-content-between-global-and-prerendered-pages) | SSG / Prerendering | Medium | Parse and merge page-level and global HTML head tags |

---

## Detailed Analysis of Selected Issues

### Issue #4598: Using one page in two routes breaks wasp start
* **URL**: [https://github.com/wasp-lang/wasp/issues/4598](https://github.com/wasp-lang/wasp/issues/4598)
* **Category**: Code Generation Bug
* **Description**:
  When a developer registers the same page component on multiple routes in Wasp `0.25.0`, the generated `routes.tsx` file contains duplicate imports for the same page identifier (e.g., `import { MainPage } from ...`). While `wasp compile` passes, `wasp start` crashes with a parse error: `[PARSE_ERROR] Identifier MainPage has already been declared`.
* **Why it makes a robust evaluation task**:
  This is a highly deterministic, reproducible code generation bug. It tests the agent's ability to modify the Haskell-based compiler's route generation template to deduplicate page imports before emitting them to the build directory.
  * **Test Plan**: Create a Wasp spec containing duplicate page references across different routes. Run the compiler and assert that the generated `routes.tsx` has deduplicated imports and that the application compiles and starts successfully.

---

### Issue #4572: Prevent `wasp start` from connecting to another project's database
* **URL**: [https://github.com/wasp-lang/wasp/issues/4572](https://github.com/wasp-lang/wasp/issues/4572)
* **Category**: Database & Security Isolation
* **Description**:
  When running multiple Wasp projects locally, they all attempt to spin up and connect to a database on the default port `5432` with hardcoded dev credentials. Consequently, if Project A has its database running, starting Project B causes it to silently and accidentally connect to Project A's database instead of starting its own.
* **Why it makes a robust evaluation task**:
  This highlights a critical local developer isolation friction point. The solution involves deriving the database password (and potentially default ports or database names) from the project's unique ID.
  * **Test Plan**: Start a database for Project A, then run `wasp start` on Project B. Verify that Project B does not connect to Project A's database and instead uses its own derived, project-specific credentials.

---

### Issue #4528: Wasp watches too many files in projects and can create infinite loops
* **URL**: [https://github.com/wasp-lang/wasp/issues/4528](https://github.com/wasp-lang/wasp/issues/4528)
* **Category**: Build System / File Watcher Bug
* **Description**:
  Wasp's file watcher monitors all files in the project directory. If an external tool writes logs (e.g., `wasp start | tee some-log`), or if a developer creates a random markdown file for notes, the watcher triggers a reload. In the logging case, this creates an infinite loop of reloads and writes.
* **Why it makes a robust evaluation task**:
  This is a classic developer experience bug that is highly frustrating. The task requires refactoring the Haskell compiler's file-watching configuration to ignore non-source files, log files, and other transient artifacts.
  * **Test Plan**: Run the Wasp dev server, write to a non-source file (such as a log or markdown file), and assert that the watcher does not trigger a recompile/reload.

---

### Issue #4603: Add an apply-only database migration command
* **URL**: [https://github.com/wasp-lang/wasp/issues/4603](https://github.com/wasp-lang/wasp/issues/4603)
* **Category**: CLI / Database Configuration
* **Description**:
  Wasp lacks a non-interactive command to apply existing, already-committed database migrations without prompting the user or generating new migrations (equivalent to `prisma migrate deploy`). This makes setting up fresh worktrees or automated testing environments difficult because `wasp db migrate-dev` is interactive and can modify files.
* **Why it makes a robust evaluation task**:
  This is a highly practical CLI and database configuration task. It requires adding a new subcommand, mapping it to the underlying Prisma engine's deployment command, and ensuring it runs non-interactively without side effects.
  * **Test Plan**: Run the new command (e.g., `wasp db migrate`) in a non-interactive shell with pending migrations. Verify that migrations are applied to the database, no new migration files are created, and no interactive prompts are shown.

---

### Issue #4594: `wasp db start` can leave a container running if interrupted
* **URL**: [https://github.com/wasp-lang/wasp/issues/4594](https://github.com/wasp-lang/wasp/issues/4594)
* **Category**: CLI / Container Interaction Bug
* **Description**:
  If a developer interrupts `wasp db start` (via `Ctrl+C`) at the exact moment the Docker container is being spun up, the process exits but the container is left running in an orphan state. Subsequent invocations of `wasp db start` crash because the container name is already in use.
* **Why it makes a robust evaluation task**:
  This is a robust container-interaction task. It tests the agent's ability to implement robust signal handling (SIGINT/SIGTERM) in Haskell/Node, ensuring that any spawned Docker processes are gracefully cleaned up on exit.
  * **Test Plan**: Start the database, send a SIGINT/SIGTERM signal to the process, and verify using `docker ps` that the container has been successfully stopped and removed.

---

### Issue #4481: Choose another port in `wasp start` when the default one is in use
* **URL**: [https://github.com/wasp-lang/wasp/issues/4481](https://github.com/wasp-lang/wasp/issues/4481)
* **Category**: CLI / Port Allocation Configuration
* **Description**:
  Wasp requires three different ports (DB, Server, Client). If any of these default ports are occupied, startup fails. Wasp should query if the preferred ports are available and automatically bind to the next available port (e.g., fallback from 3000 to 3001), printing a warning message. It should also support a `--strict-port` flag to fail if the exact port is unavailable.
* **Why it makes a robust evaluation task**:
  This is a sophisticated networking and configuration task. It requires implementing port scanning, dynamically passing the allocated ports to the client/server configurations, and handling strict port enforcement.
  * **Test Plan**: Occupy port 3000 externally, run `wasp start`, and verify that the dev server starts on port 3001. Run with `--strict-port` and verify that it fails immediately.

---

### Issue #4480: Flash of unstyled content (FOUC) on pre-rendered and lazy loaded pages
* **URL**: [https://github.com/wasp-lang/wasp/issues/4480](https://github.com/wasp-lang/wasp/issues/4480)
* **Category**: Frontend / Bundler Integration Bug
* **Description**:
  When using prerendering (`prerender: true`) with lazy loading (`lazy: true`), the first paint of the page exhibits a Flash of Unstyled Content (FOUC). The prerendered `index.html` has the page markup but lacks a `<link rel="stylesheet">` tag in the head because the CSS resides in a lazy chunk that is only loaded after the client-entry JS runs.
* **Why it makes a robust evaluation task**:
  This is a complex, high-fidelity full-stack bug. The fix involves modifying the prerendering engine (`@wasp.sh/lib-vite-ssr`) to parse the Vite build manifest, locate the CSS assets associated with the prerendered route's chunk, and inject them as `<link rel="stylesheet">` tags in the HTML head during static generation.
  * **Test Plan**: Build a prerendered lazy-loaded Wasp app. Inspect the generated `index.html` and verify that `<link rel="stylesheet">` tags are present in the `<head>` for the route's specific chunk.

---

### Issue #4478: Fail gracefully on concurrent compiles
* **URL**: [https://github.com/wasp-lang/wasp/issues/4478](https://github.com/wasp-lang/wasp/issues/4478)
* **Category**: Concurrency & Process Locking
* **Description**:
  Concurrent runs of `wasp compile` or `wasp start` in the same directory corrupt the shared `.wasp/out` build directory. The current lock mechanism (`.waspchecksums`) fails destructively, causing parallel runs to delete build directories out from under each other.
* **Why it makes a robust evaluation task**:
  This is an excellent concurrency and process-coordination task. It requires implementing a robust lockfile mechanism (e.g., `.lock` file) containing the PID of the compilation process. It should verify if the holding process is still alive and fail gracefully with an informative error message if a concurrent compile is attempted.
  * **Test Plan**: Spawn two `wasp compile` processes in parallel. Verify that the second process fails gracefully with a clear locking error message without destroying the build output of the first.

---

### Issue #4470: Gracefully handle syntax errors in user spec files
* **URL**: [https://github.com/wasp-lang/wasp/issues/4470](https://github.com/wasp-lang/wasp/issues/4470)
* **Category**: Parser / Error UX
* **Description**:
  When a user introduces a syntax error into a `*.wasp.ts` spec file, Wasp crashes and dumps a raw, unreadable Node/TS stack trace. Wasp should instead catch these syntax errors and format them into clear, user-friendly compiler diagnostics.
* **Why it makes a robust evaluation task**:
  This task focuses on developer experience and error robustness (crucial for both human developers and AI agents). It involves modifying the compiler's spec parsing pipeline to catch and format syntax errors elegantly.
  * **Test Plan**: Feed a malformed `*.wasp.ts` file to the compiler and verify that it outputs a clean, descriptive compilation error rather than a raw stack trace.

---

### Issue #4465: dedup head content between global and prerendered pages
* **URL**: [https://github.com/wasp-lang/wasp/issues/4465](https://github.com/wasp-lang/wasp/issues/4465)
* **Category**: Static Site Generation Bug
* **Description**:
  When a prerendered page defines its own `<title>` or `<meta>` tags, they get appended alongside the global head tags, resulting in duplicate tags in the final HTML. The static generation engine should merge and deduplicate head tags, allowing page-specific tags to override global ones.
* **Why it makes a robust evaluation task**:
  This is a self-contained static site generation bug. The agent must modify the HTML head post-processing logic to identify duplicate tags (by tag name, `name`, or `property` attributes) and deduplicate them.
  * **Test Plan**: Prerender a page with custom meta tags that overlap with global configurations. Verify that the generated HTML has exactly one instance of each tag, with the page-specific values overriding the global ones.

---

## Excluded Issues

The following issues from `fetched_issues.json` were excluded from the evaluation list:
* **Fly/Railway specific issues (#4564, #4673)**: Excluded because they rely on external cloud providers, making them impossible to run/test reliably in a self-contained container.
* **Vague or process-oriented issues (#4604, #4628, #4607)**: Excluded because they focus on team processes, LLM prompting strategies, or general accessibility guidelines, which do not translate to concrete coding/compilation tasks.
* **Purely cosmetic CLI issues (#4547, #4546, #4544, #4543)**: Excluded because they are subjective, low-impact, and do not represent significant technical or configuration challenges.
* **Release/dependency issues (#4531, #4675)**: Excluded because they are administrative tasks or simple package upgrades rather than robust coding challenges.
