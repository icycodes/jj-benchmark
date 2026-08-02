# Calendar Scheduling System with Recurring Events & Conflict Detection

## Background
Scheduling meetings and events is a core feature of many business applications. However, handling recurring events, timezones, and overlapping event detection is notoriously complex. In this task, you will implement a full-stack Calendar Scheduling System using Wasp (v0.24.0), React, Node.js, and Prisma.

## Requirements

### 1. Database Schema (`schema.prisma`)
Define the following models in your `schema.prisma` file:
- `User` model:
  - Connected to Wasp's auth system.
  - `id`: Int, primary key (`@id @default(autoincrement())`)
  - `username`: String, unique
  - `events`: Relation to `Event[]`
- `Event` model:
  - `id`: Int, primary key (`@id @default(autoincrement())`)
  - `title`: String
  - `description`: String (optional, nullable)
  - `startDate`: DateTime (the start date and time of the first/single occurrence)
  - `endDate`: DateTime (the end date and time of the first/single occurrence)
  - `isRecurring`: Boolean, default `false`
  - `rrule`: String (optional, nullable, stores RFC 5545 RRULE string, e.g., `FREQ=WEEKLY;BYDAY=MO`)
  - `timezone`: String (the timezone name, e.g., `UTC`, `America/New_York`)
  - `userId`: Int
  - `user`: Relation to `User` via `userId`

### 2. Authentication
- Configure standard username and password authentication in `main.wasp.ts` with `userEntity: "User"` and redirecting failed authentication to `/login`.
- Implement `userSignupFields` to automatically map the signed-up username to the `username` field on the `User` entity.
- Create `/login` and `/signup` routes and pages using Wasp's built-in `LoginForm` and `SignupForm` from `wasp/client/auth`.
- Protect the main dashboard route `/` so that only authenticated users can access it.

### 3. Server-Side Operations & Conflict Detection
You must declare and implement the following operations in Wasp:
- **Query `getEvents`**:
  - Input: `void`
  - Behavior: Returns all raw `Event` records belonging to the authenticated user.
- **Query `getEventsForRange`**:
  - Input: `{ start: string, end: string }` (ISO date strings, e.g., `2026-08-01` and `2026-08-31`)
  - Behavior: Returns an array of expanded event occurrences within the specified date range (inclusive) for the authenticated user.
  - Output format:
    ```typescript
    Array<{
      id: string; // unique identifier for the occurrence, e.g., "eventID-timestamp"
      eventId: number; // original Event ID
      title: string;
      start: string; // ISO string representing occurrence start time
      end: string; // ISO string representing occurrence end time
    }>
    ```
- **Action `createEvent`**:
  - Input: `{ title: string, description?: string, startDate: string, endDate: string, isRecurring: boolean, rrule?: string, timezone: string }` (where start/end dates are ISO datetime strings, e.g., `2026-08-03T09:00:00.000Z` or local datetime strings like `2026-08-03T09:00`)
  - Behavior:
    - **Conflict/Overlap Rules**:
      - Before saving, you must check for scheduling conflicts!
      - Expand occurrences of all existing events for the next 3 months (from the new event's start date).
      - Expand occurrences of the new event for the next 3 months.
      - If any occurrence of the new event overlaps in time with any occurrence of any existing event for the user, reject the creation!
      - Overlap is defined as: `start1 < end2` and `start2 < end1`.
      - If there is a conflict, throw an `HttpError` (status 400) with an error message containing "overlap" or "conflict".
      - Otherwise, save the new `Event` in the database and return it.

- **Expansion & Timezone Logic**:
  - You can use the pre-installed `rrule`, `date-fns`, and `date-fns-tz` packages to help with parsing RRULEs and expanding occurrences.
  - Ensure that timezone offsets are correctly accounted for when expanding occurrences so that the calendar is accurate.

### 4. Database Seed
Implement a seed function `seedCalendarUser` under `db.seeds` that:
- Creates a test user with username `calendaruser` and password `password123`.
- Use `sanitizeAndSerializeProviderData` from `'wasp/server/auth'` to hash the password for the auth identities.

### 5. Frontend UI & Test IDs
Implement the dashboard (`/`) with the following elements and exact `data-testid` attributes:
- **Event Creation Form**:
  - Title input: `<input id="event-title" data-testid="event-title" />`
  - Start date/time input: `<input type="datetime-local" id="event-start" data-testid="event-start" />`
  - End date/time input: `<input type="datetime-local" id="event-end" data-testid="event-end" />`
  - Is Recurring checkbox: `<input type="checkbox" id="event-is-recurring" data-testid="event-is-recurring" />`
  - RRULE input (visible/enabled if isRecurring is checked): `<input id="event-rrule" data-testid="event-rrule" />`
  - Timezone select: `<select id="event-timezone" data-testid="event-timezone">` (must have at least `<option value="UTC">UTC</option>`)
  - Create Event button: `<button id="create-event-btn" data-testid="create-event-btn">Create Event</button>`
- **Error/Feedback Display**:
  - If event creation fails (e.g. due to conflict), display the error message inside an element with `data-testid="error-message"`.
- **Date Range Controls**:
  - Range Start input: `<input type="date" id="range-start" data-testid="range-start" />` (default: `2026-08-01`)
  - Range End input: `<input type="date" id="range-end" data-testid="range-end" />` (default: `2026-08-31`)
- **Occurrence List**:
  - Display all expanded occurrences in the selected date range inside a container with `data-testid="expanded-occurrences-list"`.
  - Each occurrence must be rendered as an element with `data-testid="occurrence-item"`.
  - Inside each occurrence item, display:
    - The title of the event: element or text with `data-testid="occurrence-title"`
    - The start time/date: element or text with `data-testid="occurrence-start"`
    - The end time/date: element or text with `data-testid="occurrence-end"`
- **Logout**:
  - A button or link to log out: `data-testid="logout-btn"`.

## Implementation Hints
- **Project Path**: `/home/user/app`
- **Start Command**: `wasp start`
- **Port**: `3000`
- Ensure you run database migrations using `wasp db migrate-dev` before starting the application.
- Make sure all reference imports in `main.wasp.ts` use the correct `with { type: "ref" }` syntax.

