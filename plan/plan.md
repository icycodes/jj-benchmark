# Wasp Benchmark Research Plan

This research plan outlines the core architecture, primitives, developer friction points, and evaluation ideas for **Wasp** (v0.25), a declarative, batteries-included full-stack framework for React, Node.js, and Prisma.

---

## 1. Library Overview

### Core Purpose & Value Proposition
Wasp (Web App Specification) is a tool that allows developers to build full-stack web applications by writing high-level declarative specifications in TypeScript (`main.wasp.ts`) alongside standard React, Node.js, and Prisma code.

Wasp compiles this high-level spec into a complete, optimized full-stack application (frontend, backend, database client, and background workers) without requiring developers to manually configure boilerplate glue code, routing, API endpoints, or complex authentication flows.

### Project Setup & Directory Layout
A standard Wasp project is initialized and run using the Wasp CLI:

```bash
# 1. Install Wasp CLI globally
npm install -g wasp-cli

# 2. Create a new project (interactive template selection)
wasp new my-fullstack-app
cd my-fullstack-app

# 3. Start development environment (spins up local DB, server, and client)
wasp start
```

#### Typical Directory Structure:
```text
├── main.wasp.ts       # The core Wasp Spec (routes, operations, auth, jobs, etc.)
├── schema.prisma      # Prisma schema file defining database models
├── package.json       # Project dependencies and configurations
├── tsconfig.json      # Root TypeScript configuration
├── vite.config.ts     # Vite bundler configuration
├── public/            # Static assets served from the root (e.g., favicon, robots.txt)
└── src/               # Custom frontend and backend implementation code
    ├── MainPage.tsx   # React page component
    ├── queries.ts     # Node.js backend read operations
    ├── actions.ts     # Node.js backend write operations
    └── jobs/          # Custom background worker tasks
```

---

## 2. Core Primitives & APIs

In Wasp 0.25, the application is configured using a TypeScript-native specification file `main.wasp.ts` importing from `@wasp.sh/spec`. Custom client or server functions are imported into the spec using the special ES import attribute `with { type: "ref" }`.

### A. The Wasp Spec Entry (`main.wasp.ts`)
The entry point defines global metadata, authentication rules, and a collection of spec building blocks in the `spec` array.

```typescript
import { app, page, route, query, action, job, api, crud } from "@wasp.sh/spec";
import { MainPage } from "./src/MainPage" with { type: "ref" };
import { LoginPage } from "./src/auth/LoginPage" with { type: "ref" };
import { getTasks } from "./src/tasks/queries" with { type: "ref" };
import { createTask } from "./src/tasks/actions" with { type: "ref" };
import { emailCleanupJob } from "./src/jobs/cleanup" with { type: "ref" };
import { webhookHandler } from "./src/api/webhooks" with { type: "ref" };

export default app({
  name: "TodoApp",
  wasp: { version: "^0.25.0" },
  title: "My React/Node App",
  auth: {
    userEntity: "User",
    methods: {
      usernameAndPassword: {},
    },
    onAuthFailedRedirectTo: "/login",
  },
  spec: [
    // Routing & Pages
    route("RootRoute", "/", page(MainPage, { authRequired: true })),
    route("LoginRoute", "/login", page(LoginPage)),

    // RPC Operations
    query(getTasks, { entities: ["Task"] }),
    action(createTask, { entities: ["Task"] }),

    // Background Jobs
    job(cleanupJob, {
      executor: PgBoss,
      perform: { fn: emailCleanupJob },
      schedule: { cron: "0 * * * *" } // Hourly
    }),

    // Custom HTTP Endpoints
    api(stripeWebhook, {
      fn: webhookHandler,
      httpRoute: ["POST", "/webhook/stripe"],
      auth: false
    }),

    // Automated CRUD Operations
    crud(TasksCrud, {
      entity: Task,
      operations: {
        get: {},
        create: { auth: true },
        update: {},
        delete: {}
      }
    })
  ]
});
```

---

### B. Database Schema (`schema.prisma`)
Entity models and database connections are defined in standard Prisma format. Wasp reads this file directly to generate migrations, database clients, and type-safe backend contexts.

```prisma
datasource db {
  provider = "sqlite" // Or "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id       Int      @id @default(autoincrement())
  username String   @unique
  password String
  tasks    Task[]
}

model Task {
  id          Int      @id @default(autoincrement())
  description String
  isDone      Boolean  @default(false)
  userId      Int
  user        User     @relation(fields: [userId], references: [id])
}
```

---

### C. Operations (Queries & Actions)
Operations are Wasp's RPC layer. They bridge client-side calls to server-side Node.js functions with automatic end-to-end type safety and reactive cache invalidation based on Prisma entity declarations.

#### Server-Side Query Implementation (`src/tasks/queries.ts`)
```typescript
import { type GetTasks } from "wasp/server/operations";
import { HttpError } from "wasp/server";

// Context is pre-typed with the authenticated user and declared database entities
export const getTasks: GetTasks<void, Array<{ id: number; description: string; isDone: boolean }>> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized access");
  }
  return context.entities.Task.findMany({
    where: { userId: context.user.id },
    orderBy: { id: "asc" }
  });
};
```

#### Server-Side Action Implementation (`src/tasks/actions.ts`)
```typescript
import { type CreateTask } from "wasp/server/operations";
import { HttpError } from "wasp/server";

type CreateTaskArgs = {
  description: string;
};

export const createTask: CreateTask<CreateTaskArgs, { id: number }> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized access");
  }
  if (!args.description) {
    throw new HttpError(400, "Description is required");
  }
  return context.entities.Task.create({
    data: {
      description: args.description,
      user: { connect: { id: context.user.id } }
    }
  });
};
```

#### Client-Side React Usage (`src/MainPage.tsx`)
```typescript
import React, { useState } from "react";
import { useQuery, getTasks, createTask } from "wasp/client/operations";
import { logout } from "wasp/client/auth";

export const MainPage = () => {
  const { data: tasks, isLoading, error } = useQuery(getTasks);
  const [description, setDescription] = useState("");

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTask({ description });
      setDescription("");
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  if (isLoading) return <div>Loading tasks...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <button onClick={logout} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">Logout</button>
      </div>

      <form onSubmit={handleCreateTask} className="flex mb-4">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border border-gray-300 p-2 flex-grow rounded-l focus:outline-none"
          placeholder="What needs to be done?"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600">Add</button>
      </form>

      <ul className="space-y-2">
        {tasks?.map(task => (
          <li key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded shadow-sm">
            <span className={task.isDone ? "line-through text-gray-400" : ""}>{task.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

---

### D. Authentication (`auth`)
Wasp generates full-stack authentication out-of-the-box. Developers get custom forms and state-tracking hooks automatically.

#### Client-Side Auth Flow Example (`src/auth/LoginPage.tsx`)
```typescript
import React, { useState } from "react";
import { login } from "wasp/client/auth";
import { Link } from "react-router-dom";

export const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
    } catch (err: any) {
      alert("Login failed: " + err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Sign In</h2>
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-600 mb-2">Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-600 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white p-3 w-full rounded font-bold hover:bg-blue-600">Login</button>
        <p className="mt-4 text-center text-sm text-gray-600">
          Need an account? <Link to="/signup" className="text-blue-500 hover:underline">Sign up</Link>
        </p>
      </form>
    </div>
  );
};
```

---

### E. Background Jobs (`job`)
Wasp integrates background task runners using `pg-boss` (for PostgreSQL) or simple memory-based executors.

#### Server-Side Job Worker (`src/jobs/cleanup.ts`)
```typescript
import { type CleanupJob } from "wasp/server/jobs";

export const emailCleanupJob: CleanupJob<void, { count: number }> = async (args, context) => {
  console.log("Executing scheduled task cleanup...");

  const result = await context.entities.Task.deleteMany({
    where: { isDone: true }
  });

  return { count: result.count };
};
```

---

### F. Custom HTTP APIs (`api`)
When standard RPC operations aren't enough (e.g., webhook endpoints, third-party integrations), custom Express endpoints can be registered.

#### Server-Side API Handler (`src/api/webhooks.ts`)
```typescript
import { type StripeWebhook } from "wasp/server/api";

export const webhookHandler: StripeWebhook = async (req, res, context) => {
  const event = req.body;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log(`Payment completed for session: ${session.id}`);

    // Perform database writes through context.entities
    await context.entities.User.updateMany({
      where: { username: session.client_reference_id },
      data: { /* update premium status */ }
    });
  }

  res.status(200).json({ received: true });
};
```

---

### G. Automatic CRUD (`crud`)
CRUD declarations automatically generate standard REST-like operations for an entity, exposing them directly to client-side code.

#### Client-Side CRUD Usage (`src/pages/CrudPage.tsx`)
```typescript
import React from "react";
import { TasksCrud } from "wasp/client/crud";

export const CrudPage = () => {
  const { data: tasks, isLoading } = TasksCrud.get.useQuery();
  const createTask = TasksCrud.create.useAction();

  const handleQuickAdd = async () => {
    await createTask({ description: "Quick Task Added via CRUD" });
  };

  if (isLoading) return <div>Loading CRUD task lists...</div>;

  return (
    <div className="p-4">
      <button onClick={handleQuickAdd} className="bg-green-500 text-white p-2 rounded mb-4 hover:bg-green-600">Quick Add</button>
      <ul>
        {tasks?.map(t => (
          <li key={t.id} className="border-b py-2 text-gray-700">{t.description}</li>
        ))}
      </ul>
    </div>
  );
};
```

---

### H. WebSockets (`webSocket`)
Wasp bundles custom Socket.IO configurations directly into the server and client SDK.

#### Server-Side WebSocket Handler (`src/webSocket.ts`)
```typescript
import { type WebSocketFn } from "wasp/server/webSockets";

export const webSocketFn: WebSocketFn = (io, context) => {
  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("messageFromClient", (data) => {
      console.log("Broadcasting data:", data);
      io.emit("messageFromServer", data);
    });
  });
};
```

#### Client-Side WebSocket React Usage (`src/pages/ChatPage.tsx`)
```typescript
import React, { useState, useEffect } from "react";
import { useSocket } from "wasp/client/webSockets";

export const ChatPage = () => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!socket) return;

    socket.on("messageFromServer", (msg: string) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.off("messageFromServer");
    };
  }, [socket]);

  const handleSend = () => {
    if (socket && input) {
      socket.emit("messageFromClient", input);
      setInput("");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4">Connection Status: <span className={isConnected ? "text-green-500 font-bold" : "text-red-500 font-bold"}>{isConnected ? "Connected" : "Disconnected"}</span></div>
      <div className="border h-48 overflow-y-auto mb-4 p-2 bg-gray-50 rounded">
        {messages.map((m, idx) => <div key={i} className="py-1 border-b text-sm">{m}</div>)}
      </div>
      <div className="flex">
        <input type="text" value={input} onChange={e => setInput(e.target.value)} className="border p-2 flex-grow rounded-l" />
        <button onClick={handleSend} className="bg-blue-500 text-white px-4 py-2 rounded-r">Send</button>
      </div>
    </div>
  );
};
```

---

## 3. Real-World Use Cases & Templates

### Open SaaS
Open SaaS (`https://opensaas.sh`) is the canonical, open-source SaaS boilerplate built on top of Wasp. It serves as the primary real-world showcase for Wasp's architectural capabilities, integrating:
* Stripe payments
* Plausible/Google Analytics
* SendGrid/Mailgun email templates
* Admin dashboards with charts
* Full user management with Tailwind and Shadcn UI

---

## 4. Developer Friction Points

### 1. Multi-Project Database Port Collision
When running multiple Wasp projects locally, they all attempt to spin up and connect to a database on the default port `5432` with hardcoded dev credentials. Consequently, starting Project B silently and accidentally connects to Project A's database instead of starting its own, leading to silent data leaks and development corruption.

### 2. Duplicate Import Compiler Crash
If a developer maps the same React component/page to multiple routes in the Wasp spec (e.g., mounting `MainPage` under both `/` and `/dashboard` for testing), the Haskell code generator emits duplicate ES imports (e.g., `import { MainPage } from ...` twice) in the generated `routes.tsx`, causing the application to crash on startup.

### 3. Infinite Reload Loops in File Watcher
Wasp's file watcher listens to everything in the project root. If a developer redirects terminal output to a log file or notes file in the project directory, writing to the file triggers Wasp to recompile, which writes more output, triggering another recompile, leading to a CPU-exhausting infinite loop.

---

## 5. Evaluation Ideas

All evaluation tasks are **container-based, self-contained, and require no external cloud dependencies**.

### Task 1: Graceful Syntax Error Diagnostics [Simple]
* **Goal**: Catch and format Node/TypeScript syntax errors in `main.wasp.ts` instead of crashing the compiler with a raw Haskell/Node stack trace.
* **Requirements**: Modify the compiler's spec parsing pipeline to catch parsing exceptions, extract the file name and line number, and print a clean, user-friendly diagnostic output.

### Task 2: Custom CLI Command `wasp show build` [Simple]
* **Goal**: Implement a CLI command to query and format build-time metadata (compiled outputs, sizes, and paths).
* **Requirements**: Add a new command hierarchy under the `wasp show` parser. Support both formatted table layouts and structured JSON output using a `--json` parameter.

### Task 3: Secure Session Invalidation on Password Reset [Medium]
* **Goal**: Ensure that resetting a password terminates all other active client authentication sessions.
* **Requirements**: Integrate with the authentication backend library (Lucia) to call session invalidation APIs (`invalidateAllSessionsForAuthId`) immediately upon password update.

### Task 4: Non-Interactive Database Migration Deploy Command [Medium]
* **Goal**: Add a `wasp db migrate` subcommand that applies existing migrations non-interactively without generating new ones.
* **Requirements**: Map the subcommand to the underlying Prisma engine's deployment command (`prisma migrate deploy`) and ensure it runs non-interactively without side effects or file writes.

### Task 5: Project-Specific Local Database Isolation [Medium]
* **Goal**: Dynamically derive database credentials and ports from the project's unique ID.
* **Requirements**: Prevent multi-project database port collisions in local environments by scanning for free ports and setting project-specific PostgreSQL passwords.

### Task 6: High-Fidelity FOUC Fix for Pre-rendered SSR Pages [Hard]
* **Goal**: Prevent Flash of Unstyled Content (FOUC) on lazy-loaded pre-rendered routes.
* **Requirements**: Modify the static site generation (SSG) engine to parse the Vite compilation manifest, discover specific lazy-loaded CSS chunks, and inject them as `<link rel="stylesheet">` tags in the HTML head.

### Task 7: Process-Level Compiler Lockfile [Hard]
* **Goal**: Prevent concurrent runs of `wasp compile` or `wasp start` from corrupting the shared build directory.
* **Requirements**: Implement a PID-based lockfile (`.wasp.lock`) that verifies if the holding process is still alive and fails gracefully with an informative error message if a concurrent compile is attempted.

---

## 6. Sources

1. [Wasp Official Homepage](https://wasp.sh/)
2. [Wasp Spec Documentation](https://wasp.sh/docs/general/spec)
3. [Wasp GitHub Repository](https://github.com/wasp-lang/wasp)
4. [Open SaaS Documentation](https://docs.opensaas.sh/)
5. [Wasp 0.25 Full LLM Documentation](https://wasp.sh/llms-full.txt)
6. [Wasp WebSocket API Reference](https://wasp.sh/docs/advanced/web-sockets)
7. [Wasp CRUD API Reference](https://wasp.sh/docs/0.24/api/@wasp.sh/spec)
