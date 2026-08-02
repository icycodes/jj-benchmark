# Real-time Kanban Project Management Board in Wasp.sh

## Background
Kanban boards are essential tools for agile software development, enabling teams to visualize workflows, assign tasks, track subtasks, and monitor activities. In collaborative environments, multiple users often edit the same board concurrently. This requires the application to support persistent list and task ordering, secure assignments, subtask tracking, detailed activity logging, and real-time/frequent synchronization across concurrent user sessions.

In this task, you will build a full-stack collaborative Kanban board using Wasp.sh (v0.24.0), React, Node.js, and Prisma/SQLite. Wasp is a declarative, spec-driven full-stack framework where high-level configuration is defined in `main.wasp.ts` using `@wasp.sh/spec` and database models are defined in `schema.prisma`.

## Requirements

### 1. Database Schema (`schema.prisma`)
Define the following entities to model the Kanban board, columns, tasks, subtasks, and activity logs:
- **`User`**: Linked to Wasp's auth system, with a unique `username` (String), relation `createdTasks` to `Task` as creator, and relation `assignedTasks` to `Task` as assignee.
- **`Board`**: Represents a Kanban board with `name` (String) and relation `lists` to `List`.
- **`List`**: Represents a column/list on a board with `name` (String), `position` (Float for sorting), `boardId` (Int), and relations `board` and `tasks` to `Task`.
- **`Task`**: Represents a task card with `title` (String), `description` (String, default: ""), `position` (Float for sorting), `listId` (Int), `creatorId` (Int), `assigneeId` (Int, optional), and relations `list`, `creator`, `assignee`, `subtasks` to `Subtask`, and `activities` to `ActivityLog`.
- **`Subtask`**: Represents a checklist item under a task with `title` (String), `isDone` (Boolean, default: false), `taskId` (Int), and relation `task`.
- **`ActivityLog`**: Tracks task modifications with `content` (String), `createdAt` (DateTime, default: `now()`), `taskId` (Int), and relation `task`.

### 2. Authentication
- Enable `usernameAndPassword` authentication in `main.wasp.ts`.
- Set up `userSignupFields` to automatically copy the signed-up `username` onto the `username` field of your custom `User` entity.
- Set up routes and pages for `/login` and `/signup` using Wasp's built-in `LoginForm` and `SignupForm` from `wasp/client/auth`.
- The root route `/` must render the `MainPage` and require authentication.
- The board route `/board/:id` must render the `BoardPage` and require authentication.

### 3. Server-Side Operations (Queries & Actions)
Implement the following operations with strict validation and automatic activity logging:
- **`getBoards` Query**: Fetches all boards.
- **`getBoard` Query**:
  - Accepts `{ id: number }`.
  - Returns the Board with its associated Lists (sorted by `position` ascending) and their associated Tasks (sorted by `position` ascending), including their creator, assignee, subtasks, and activity logs (sorted by `createdAt` descending).
- **`getUsers` Query**: Fetches all users in the system (needed for assignee dropdown).
- **`createBoard` Action**: Accepts `{ name: string }` and creates a new board.
- **`createList` Action**: Accepts `{ boardId: number, name: string, position: number }` and creates a column.
- **`createTask` Action**: Accepts `{ listId: number, title: string, description: string, position: number }` and creates a task. It must set the current user as the `creator` and log an activity: `"Task created"`.
- **`updateTaskList` Action**:
  - Accepts `{ taskId: number, listId: number }`.
  - Moves the task to the specified list. It must also log a new activity: `"Task moved to [ListName]"` (e.g. `"Task moved to In Progress"`).
- **`assignTask` Action**:
  - Accepts `{ taskId: number, assigneeId: number | null }`.
  - Assigns the task to the specified user (or unassigns if `null`). It must log a new activity: `"Task assigned to [Username]"` (or `"Task unassigned"` if assigneeId is null).
- **`createSubtask` Action**:
  - Accepts `{ taskId: number, title: string }`.
  - Creates a new subtask under the task. It must log a new activity: `"Subtask [Title] added"`.
- **`toggleSubtask` Action**:
  - Accepts `{ subtaskId: number, isDone: boolean }`.
  - Toggles the subtask's completion status. It must log a new activity on the parent task: `"Subtask [Title] completed"` (or `"Subtask [Title] uncompleted"` if isDone is toggled to false).
- **`updateTaskPosition` Action**: Accepts `{ taskId: number, position: number }` and updates the sorting position of the task.

### 4. Real-Time Synchronization
To support real-time updates for concurrent board editors without complex WebSocket setup, the frontend `BoardPage` client must poll the `getBoard` query frequently (e.g. every 1-2 seconds using a React `useEffect` with `setInterval` calling the query's `refetch()` function). This ensures that actions performed by one user are immediately synchronized and visible in other users' active browser sessions.

### 5. Frontend UI & Test Hooks
Implement the pages with the following test hooks (`data-testid`) to ensure deterministic browser verification:
- **Main Page (`/`)**:
  - **Board List**: Displays all boards. Each board link/button must be inside an element with `data-testid="board-link-{boardId}"`.
  - **Create Board**: A form with an input `data-testid="new-board-input"` and a button `data-testid="create-board-button"` to create a new board.
  - **Logout Button**: A button with `data-testid="logout-btn"` or text "Logout" to sign out.
- **Board Page (`/board/:id`)**:
  - **Board Title**: Displays the board name with `data-testid="board-title"`.
  - **Columns/Lists**: Render each list inside an element with `data-testid="column-{listId}"`.
    - Display the column name (e.g., "Todo", "In Progress", "Done").
    - **Create Task Form**: Under each column, render an input with `data-testid="new-task-input-{listId}"` and a button with `data-testid="create-task-button-{listId}"` to create a task in that column.
  - **Task Cards**: Each task card must be rendered in an element with `data-testid="task-card-{taskId}"`.
    - Inside each task card, display:
      - Task title with `data-testid="task-title-{taskId}"`.
      - Assignee's username (or "Unassigned") with `data-testid="task-assignee-{taskId}"`.
      - Subtask progress (e.g., "1/2 subtasks complete") with `data-testid="task-progress-{taskId}"`.
      - **Move Column Select**: A select/dropdown with `data-testid="move-list-select-{taskId}"` containing option elements whose values are the column/list IDs. Selecting a column moves the task via `updateTaskList`.
      - **Assign User Select**: A select/dropdown with `data-testid="assign-user-select-{taskId}"` containing option elements whose values are the user IDs, and an option with value `"unassigned"`. Selecting a user assigns the task via `assignTask`.
      - **Create Subtask Form**: An input with `data-testid="new-subtask-input-{taskId}"` and a button with `data-testid="add-subtask-button-{taskId}"` to add a subtask to this task.
      - **Subtasks List**: Render each subtask item. Each subtask checkbox must have `data-testid="subtask-checkbox-{subtaskId}"` to toggle completion via `toggleSubtask`.
      - **Activity Log Container**: An element with `data-testid="activity-log-{taskId}"` displaying the activity logs of the task in chronological order (or reverse chronological order).

## Implementation Hints
- **Project Path**: `/home/user/app`
- **Start Command**: `wasp start`
- **Port**: `3000`
- **Wasp Version**: Target Wasp `^0.24.0` using the TypeScript configuration spec (`main.wasp.ts`).
- **Database**: SQLite (default).
- **Imports in `main.wasp.ts`**: Remember that in Wasp `^0.24.0`, imports of your own code (pages, queries, actions) in `main.wasp.ts` must use the `with { type: "ref" }` syntax.

### Database Seeding (`src/seeds.ts`)
Implement a seed function `seedKanbanData` that creates exactly the following initial state:
1. A test user with username `testuser` and password `password123`.
2. A collaborator user with username `collabuser` and password `password123`.
3. A Board with title "Project Kanban" (id: 1).
4. Three lists for this board:
   - "Todo" (id: 1, position: 1.0)
   - "In Progress" (id: 2, position: 2.0)
   - "Done" (id: 3, position: 3.0)
5. A single task under the "Todo" column (id: 1):
   - Title: "Implement Auth"
   - Description: "Set up username and password authentication."
   - Position: 1.0
   - Creator: `testuser`
   - Subtask: "Configure main.wasp.ts" (id: 1, isDone: false)
   - Activity: "Task created"

