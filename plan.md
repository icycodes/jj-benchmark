# Wasp.sh Evaluation Benchmark Dataset

This dataset is designed to evaluate AI coding agents on their proficiency with Wasp (wasp.sh), a domain-specific language (DSL) for building full-stack web applications using React, Node.js, and Prisma.

## 1. Library Overview

*   **Description**: Wasp is a declarative DSL that allows developers to define a web app's high-level structure (auth, routing, database, jobs) in a single `.wasp` file. It compiles this config along with your React/Node.js code into a full-stack application.
*   **Ecosystem Role**: It acts as a "glue" framework that reduces boilerplate by managing the connections between the frontend, backend, and database. It leverages **Prisma** for ORM, **React Query** for data fetching, and **Lucia** for authentication.
*   **Project Setup**:
    1.  Install CLI: `npm i -g @wasp.sh/wasp-cli@latest`
    2.  Create project: `wasp new <project-name>` (or `wasp new <project-name> -t saas` for the SaaS template).
    3.  Run development server: `cd <project-name> && wasp start`.
    4.  Update database: `wasp db migrate-dev`.

## 2. Core Primitives & APIs

### A. The `.wasp` File (App Configuration)
The heart of a Wasp project where you declare the app's components.
```wasp
app MySaaS {
  wasp: { version: "^0.15.0" },
  title: "My SaaS",
  auth: {
    userEntity: User,
    methods: { usernameAndPassword: {} },
    onAuthFailedRedirectTo: "/login"
  }
}

route RootRoute { path: "/", to: MainPage }
page MainPage { component: import { MainPage } from "@src/MainPage" }
```
*Documentation:* [App Declaration](https://wasp.sh/docs/language/basic-elements#app)

### B. Operations (Queries & Actions)
Operations are Node.js functions on the server that Wasp makes available on the client with full-stack type safety and automatic cache invalidation.
```wasp
// main.wasp
query getTasks {
  fn: import { getTasks } from "@src/queries",
  entities: [Task]
}

action createTask {
  fn: import { createTask } from "@src/actions",
  entities: [Task]
}
```
```typescript
// src/queries.ts
import { type GetTasks } from 'wasp/server/operations';

export const getTasks: GetTasks<void, Task[]> = async (args, context) => {
  if (!context.user) throw new HttpError(401);
  return context.entities.Task.findMany({ where: { userId: context.user.id } });
};
```
*Documentation:* [Operations Overview](https://wasp.sh/docs/data-model/operations/overview)

### C. Automatic CRUD
Generates standard operations for an entity with minimal code.
```wasp
crud Tasks {
  entity: Task,
  operations: {
    getAll: { isPublic: true },
    create: { overrideFn: import { customCreate } from "@src/tasks" }
  }
}
```
*Documentation:* [Automatic CRUD](https://wasp.sh/docs/data-model/crud)

### D. Background Jobs
Defines async tasks using `PgBoss` (PostgreSQL) or simple executors.
```wasp
job emailJob {
  executor: PgBoss,
  perform: { fn: import { sendEmail } from "@src/jobs/email" }
}
```
*Documentation:* [Jobs](https://wasp.sh/docs/advanced/jobs)

## 3. Real-World Use Cases & Templates

*   **Todo App (Tutorial)**: Demonstrates basic CRUD, Auth, and React Query integration. [Repo](https://github.com/wasp-lang/wasp/tree/release/examples/tutorials/TodoApp)
*   **Open SaaS**: A comprehensive SaaS boilerplate featuring Stripe payments, OpenAI integration, Cron jobs, and an Admin dashboard. [Docs](https://docs.opensaas.sh/)
*   **Mage (wasp-ai)**: An AI-powered generator that creates Wasp apps from a single prompt. [Link](https://usemage.ai/)

## 4. Developer Friction Points

1.  **Server-Side Operation Imports**: Developers often try to import actions/queries on the server from `wasp/client/operations`. They must use `wasp/server/operations` and manually provide the `user` context if needed. [Issue #1909](https://github.com/wasp-lang/wasp/issues/1909)
2.  **Relative Imports & Operations**: Importing from `wasp/server/operations` can sometimes break relative imports in the same file due to how Wasp handles virtual modules. [Discussion](https://githubhelp.com/wasp-lang/wasp/issues/2247)
3.  **Auth UI Customization**: Adding extra fields to the built-in `SignupForm` requires specific `additionalFields` props and corresponding `userSignupFields` logic in the backend. Mixing these up often leads to validation errors. [Docs](https://wasp.sh/docs/auth/overview#customizing-the-signup-process)
4.  **CORS in Custom APIs**: Custom HTTP endpoints (`api` declaration) often run into CORS issues if not configured correctly for external webhooks (e.g., Stripe). [Issue #1757](https://github.com/wasp-lang/wasp/issues/1757)

## 5. Evaluation Ideas

*   **Simple**: Implement a "Like" button for a post that uses an `action` and `useQuery` for reactive updates.
*   **Medium**: Add a "Role" field to the `User` entity and restrict a specific `page` to only users with the `ADMIN` role.
*   **Medium**: Set up a background `job` that triggers every hour to clean up "expired" tasks in the database.
*   **Medium**: Implement a custom `SignupForm` that includes a "Company Name" field and saves it to the `User` entity.
*   **Complex**: Integrate a Stripe webhook using the `api` declaration to update a user's subscription status.
*   **Complex**: Implement an optimistic update for a "Task Priority" toggle using the `useAction` hook's `optimisticUpdates` property.
*   **Complex**: Migrate a Wasp project from SQLite to PostgreSQL, including environment variable configuration and migration regeneration.

## 6. Sources

1.  [Wasp Official Documentation (llms-full.txt)](https://wasp.sh/llms-full.txt) - Comprehensive technical guide for Wasp 0.21.
2.  [Open SaaS Documentation (llms.txt)](https://docs.opensaas.sh/llms.txt) - Overview of the Open SaaS template and integrations.
3.  [Wasp GitHub Repository](https://github.com/wasp-lang/wasp) - Source of truth for issues and latest features.
4.  [Wasp Discord Community Threads](https://discord.com/invite/rzdnErX) - Insights into common developer questions and pain points.
5.  [AnswerOverflow: Wasp CORS Issues](https://www.answeroverflow.com/m/1274465743936815154) - Community discussion on custom API endpoint challenges.