# Wasp.sh Evaluation Benchmark Dataset

This dataset is designed to evaluate AI coding agents on their proficiency with Wasp (wasp.sh), a batteries-included full-stack framework with a TypeScript configuration spec (`main.wasp.ts`) for building web applications using React, Node.js, and Prisma.

## 1. Library Overview

*   **Version**: This dataset targets **Wasp `^0.24.0`** (latest as of June 2026). Starting with the TypeScript Spec release, Wasp replaced its custom `.wasp` DSL with a **TypeScript SDK**: the app is now configured in a `main.wasp.ts` file using the `@wasp.sh/spec` package.
*   **Description**: Wasp is a declarative, batteries-included full-stack framework. You define a web app's high-level structure (auth, routing, database, jobs) in `main.wasp.ts` by exporting an `app({...})` spec. Wasp compiles this config along with your React/Node.js code into a full-stack application.
*   **Ecosystem Role**: It acts as a "glue" framework that reduces boilerplate by managing the connections between the frontend, backend, and database. It leverages **Prisma** for ORM (schema defined in `schema.prisma`), **React Query** for data fetching, and **Lucia** for authentication.
*   **Requirements**: Node.js `>= 24.14.1` and npm.
*   **Project Setup**:
    1.  Install CLI: `npm i -g @wasp.sh/wasp-cli@latest`
    2.  Create project: `wasp new <project-name>` (interactive), `wasp new <project-name> -t minimal` for a bare template, or `wasp new <project-name> -t saas` for the SaaS template.
    3.  Run development server: `cd <project-name> && wasp start`.
    4.  Update database: `wasp db migrate-dev`.

## 2. Core Primitives & APIs

### A. `main.wasp.ts` (App Configuration)
The heart of a Wasp project. It exports a default `app({...})` spec that declares the app's top-level config plus a `spec` array of features (routes, pages, queries, actions, cruds, jobs). Code is referenced with `with { type: "ref" }` imports.
```typescript
// main.wasp.ts
import { app, page, route } from "@wasp.sh/spec"
import { MainPage } from "./src/MainPage" with { type: "ref" }

export default app({
  name: "MySaaS",
  wasp: { version: "^0.24.0" },
  title: "My SaaS",
  auth: {
    userEntity: "User",
    methods: { usernameAndPassword: {} },
    onAuthFailedRedirectTo: "/login",
  },
  spec: [
    route("RootRoute", "/", page(MainPage, { authRequired: true })),
  ],
})
```
*Documentation:* [Wasp Spec (main.wasp.ts)](https://wasp.sh/docs/general/spec)

### B. Operations (Queries & Actions)
Operations are Node.js functions on the server that Wasp makes available on the client with full-stack type safety and automatic cache invalidation. Declare them with `query(...)` / `action(...)` in the `spec` array; the operation name is derived from the referenced function.
```typescript
// main.wasp.ts
import { app, query, action } from "@wasp.sh/spec"
import { getTasks } from "./src/queries" with { type: "ref" }
import { createTask } from "./src/actions" with { type: "ref" }

export default app({
  // ...
  spec: [
    query(getTasks, { entities: ["Task"] }),
    action(createTask, { entities: ["Task"] }),
  ],
})
```
```typescript
// src/queries.ts
import { type GetTasks } from 'wasp/server/operations';
import { HttpError } from 'wasp/server';

export const getTasks: GetTasks<void, Task[]> = async (args, context) => {
  if (!context.user) throw new HttpError(401);
  return context.entities.Task.findMany({ where: { userId: context.user.id } });
};
```
*Documentation:* [Operations Overview](https://wasp.sh/docs/data-model/operations/overview)

### C. Automatic CRUD
Generates standard operations for an entity with minimal code via `crud(name, entity, options)`.
```typescript
// main.wasp.ts
import { app, crud } from "@wasp.sh/spec"
import { customCreate } from "./src/tasks" with { type: "ref" }

export default app({
  // ...
  spec: [
    crud("Tasks", "Task", {
      getAll: { isPublic: true }, // by default operations require auth
      get: {},
      create: { overrideFn: customCreate },
      update: {},
    }),
  ],
})
```
Client usage: `import { Tasks } from "wasp/client/crud"` then `Tasks.getAll.useQuery()`, `Tasks.create.useAction()`.
*Documentation:* [Automatic CRUD](https://wasp.sh/docs/data-model/crud)

### D. Background Jobs
Defines async tasks using the `PgBoss` executor (requires a PostgreSQL provider).
```typescript
// main.wasp.ts
import { app, job } from "@wasp.sh/spec"
import { sendEmail } from "./src/jobs/email" with { type: "ref" }

export default app({
  // ...
  spec: [
    job(sendEmail, {
      executor: "PgBoss",
      entities: ["Task"],
      // Optional recurring schedule:
      // schedule: { cron: "0 * * * *", args: { name: "Johnny" } },
    }),
  ],
})
```
Submit work from any server code: `import { sendEmail } from "wasp/server/jobs"` then `await sendEmail.submit({ ... })` (optionally `.delay(seconds)`).
*Documentation:* [Recurring Jobs](https://wasp.sh/docs/advanced/jobs)

## 3. Real-World Use Cases & Templates

*   **Todo App (Tutorial)**: Demonstrates basic CRUD, Auth, and React Query integration. [Repo](https://github.com/wasp-lang/wasp/tree/release/examples/tutorials/TodoApp)
*   **Open SaaS**: A comprehensive SaaS boilerplate featuring Stripe payments, OpenAI integration, Cron jobs, and an Admin dashboard. [Docs](https://docs.opensaas.sh/)
*   **Mage (wasp-ai)**: An AI-powered generator that creates Wasp apps from a single prompt. [Link](https://usemage.ai/)

## 4. Developer Friction Points

1.  **Reference Imports**: In `main.wasp.ts`, imports of your own code (pages, operation/job functions) must use the `with { type: "ref" }` suffix. Forgetting it (or importing without a ref) causes the code to be executed at config time instead of being registered as a reference. [Docs](https://wasp.sh/docs/general/spec#reference-imports)
2.  **Server-Side Operation Imports**: Developers often try to import actions/queries on the server from `wasp/client/operations`. They must use `wasp/server/operations` and manually provide the `user` context if needed. [Issue #1909](https://github.com/wasp-lang/wasp/issues/1909)
3.  **Auth UI Customization**: Adding extra fields to the built-in `SignupForm` requires specific `additionalFields` props and corresponding `userSignupFields` logic in the backend. Mixing these up often leads to validation errors. [Docs](https://wasp.sh/docs/auth/overview#customizing-the-signup-process)
4.  **CORS in Custom APIs**: Custom HTTP endpoints (`api` spec) often run into CORS issues if not configured correctly for external webhooks (e.g., Stripe). [Issue #1757](https://github.com/wasp-lang/wasp/issues/1757)

## 5. Evaluation Ideas

*   **Simple**: Implement a "Like" button for a post that uses an `action` and `useQuery` for reactive updates.
*   **Medium**: Add a "Role" field to the `User` entity and restrict a specific `page` to only users with the `ADMIN` role.
*   **Medium**: Set up a background `job` that triggers every hour to clean up "expired" tasks in the database.
*   **Medium**: Implement a custom `SignupForm` that includes a "Company Name" field and saves it to the `User` entity.
*   **Complex**: Integrate a Stripe webhook using the `api` declaration to update a user's subscription status.
*   **Complex**: Implement an optimistic update for a "Task Priority" toggle using the `useAction` hook's `optimisticUpdates` property.
*   **Complex**: Migrate a Wasp project from SQLite to PostgreSQL, including environment variable configuration and migration regeneration.

## 6. Sources

1.  [Wasp Official Documentation (llms-full.txt)](https://wasp.sh/llms-full.txt) - Comprehensive technical guide for Wasp 0.24 (TypeScript Spec).
2.  [Open SaaS Documentation (llms.txt)](https://docs.opensaas.sh/llms.txt) - Overview of the Open SaaS template and integrations.
3.  [Wasp GitHub Repository](https://github.com/wasp-lang/wasp) - Source of truth for issues and latest features.
4.  [Wasp Discord Community Threads](https://discord.com/invite/rzdnErX) - Insights into common developer questions and pain points.
5.  [AnswerOverflow: Wasp CORS Issues](https://www.answeroverflow.com/m/1274465743936815154) - Community discussion on custom API endpoint challenges.