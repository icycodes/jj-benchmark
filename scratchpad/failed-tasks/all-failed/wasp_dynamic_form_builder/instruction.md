# Wasp Dynamic Form Builder with Conditional Logic & Server-Side Validation

## Background
In modern web applications, admins often need to create custom forms dynamically without writing new code. In this task, you will build a dynamic form builder using Wasp (v0.24.0) with TypeScript configuration. Admins can create forms by defining a JSON schema, and users can fill out and submit responses. The application must support conditional rendering of fields and robust client-side and server-side validation.

## Requirements

### 1. Wasp Configuration (`main.wasp.ts`)
- Use Wasp `^0.24.0` with TypeScript configuration spec (`main.wasp.ts`).
- Enable authentication using `usernameAndPassword` method.
- Implement custom signup fields to set user roles. If the username is `"admin"`, set the role to `"ADMIN"`. Otherwise, set it to `"USER"`.
- Configure the following routes and pages:
  - `RootRoute` (`/`): Maps to `MainPage`.
  - `NewFormRoute` (`/forms/new`): Maps to `NewFormPage` (accessible only to ADMINs).
  - `FormRoute` (`/forms/:id`): Maps to `FormPage` (accessible to authenticated users).
  - `FormResponsesRoute` (`/forms/:id/responses`): Maps to `FormResponsesPage` (accessible only to ADMINs).

### 2. Database Schema (`schema.prisma`)
- `User` entity:
  - Add a `role` field (String, default is `"USER"`).
  - Add relationships to `Form` and `FormResponse`.
- `Form` entity:
  - `id`: String (ID / UUID) @id @default(uuid()) or similar.
  - `title`: String.
  - `description`: String (optional).
  - `schema`: String (stores the JSON schema of fields and conditions).
  - `createdAt`: DateTime @default(now()).
  - `userId`: String.
  - `user`: Relationship to `User`.
  - `responses`: Relationship to `FormResponse[]`.
- `FormResponse` entity:
  - `id`: String @id @default(uuid()) or similar.
  - `formId`: String.
  - `form`: Relationship to `Form`.
  - `data`: String (stores the submitted dynamic form values as JSON).
  - `submittedAt`: DateTime @default(now()).
  - `userId`: String.
  - `user`: Relationship to `User`.

### 3. Backend Operations (Queries & Actions)
Define the following in `main.wasp.ts` and implement them with full type safety:
- **Queries**:
  - `getForms`: Returns all forms.
  - `getForm(formId)`: Returns a specific form by ID.
  - `getFormResponses(formId)`: Returns all responses for a form (ADMIN only, throw HttpError 403 if USER).
- **Actions**:
  - `createForm({ title, description, schema })`: Creates a new form (ADMIN only, throw HttpError 403 if USER).
  - `submitResponse({ formId, data })`: Validates the response data against the form's schema on the server. If valid, saves it to the database. If invalid, throws an `HttpError` (e.g., 400 Bad Request) with validation details.

### 4. Dynamic Form Schema & Validation Engine
The form `schema` is stored as a JSON string representing an array of field objects.
Example schema:
```json
[
  {
    "id": "name",
    "label": "Full Name",
    "type": "text",
    "required": true
  },
  {
    "id": "age",
    "label": "Age",
    "type": "number",
    "required": true,
    "min": 18
  },
  {
    "id": "has_license",
    "label": "Do you have a driver's license?",
    "type": "boolean",
    "required": false
  },
  {
    "id": "license_number",
    "label": "License Number",
    "type": "text",
    "required": true,
    "conditions": [
      {
        "field": "has_license",
        "value": true
      }
    ]
  }
]
```

#### Fields format:
- `id`: String (unique identifier for the field).
- `label`: String (display label).
- `type`: String (`"text"`, `"number"`, or `"boolean"`).
- `required`: Boolean.
- `min`: Number (optional, only applies to `"number"` type).
- `conditions`: Array of condition objects (optional).
  - Each condition has `field` (referenced field ID) and `value` (expected value).
  - A field is **visible/active** if and only if **all** of its conditions are met. If a field has no conditions, it is always visible/active.
  - If a field is not visible/active, it must **not** be validated (even if `required: true`) and its value must not be saved in the final response data (or should be stripped/ignored).

#### Validation Rules (Client & Server):
- **Required fields**: If a field is visible/active and `required` is `true`, it must not be null, undefined, or empty string.
- **Numbers**: If a field is of type `"number"`, the value must be a valid number. If `min` is defined, the value must be `>= min`.
- **Booleans**: If a field is of type `"boolean"`, the value should be a boolean.

### 5. Frontend Pages & UI Flow
- **Authentication**: Use Wasp's built-in Auth UI or custom forms to let users signup and login.
- **MainPage (`/`)**:
  - Displays the current user's username and role.
  - Displays a "Logout" button.
  - If role is `"ADMIN"`:
    - Displays a "Create New Form" button/link pointing to `/forms/new`.
    - Lists all created forms. For each form, displays its title, description, and links to:
      - View Form: `/forms/:id`
      - View Responses: `/forms/:id/responses`
  - If role is `"USER"`:
    - Lists all available forms. For each form, displays its title and description with a "Fill Out Form" link pointing to `/forms/:id`.
- **NewFormPage (`/forms/new`)** (ADMIN only):
  - Form to create a new dynamic form.
  - Input fields: Form Title, Form Description (textarea), and Schema (textarea).
  - The Schema textarea is where the admin pastes the JSON schema.
  - A "Create Form" button that triggers the `createForm` action and redirects to `/` on success.
- **FormPage (`/forms/:id`)**:
  - Fetches the form details and schema.
  - Renders the form dynamically.
  - Implements dynamic conditional visibility: fields with conditions must show or hide immediately in real-time as the user interacts with the form.
  - Renders input fields based on their type:
    - `"text"`: `<input type="text" />`
    - `"number"`: `<input type="number" />`
    - `"boolean"`: `<input type="checkbox" />`
  - Provides a `"Submit"` button.
  - Displays validation errors (e.g. `"Age must be at least 18"` or `"License Number is required"`) in the UI if submission fails validation (either client-side or server-side).
  - On successful submission, redirects to `/` or shows a success message.
- **FormResponsesPage (`/forms/:id/responses`)** (ADMIN only):
  - Lists all submitted responses for the form.
  - Displays the responses in a clear table or list, showing the user who submitted it, the submission time, and the submitted field values (e.g. Full Name, Age, Has License, License Number).

## Implementation Hints
1. **Wasp Spec Imports**: Ensure all references in `main.wasp.ts` (like pages, queries, actions) use `with { type: "ref" }` imports.
2. **Server-Side Imports**: In your operation files, import from `wasp/server/operations` and use `context.entities` to interact with Prisma.
3. **Custom Signup Hook**: Implement `userSignupFields` in `src/auth.ts` (or similar) and register it in `main.wasp.ts`.
4. **JSON Parsing**: Remember that `schema` in `Form` and `data` in `FormResponse` are stored as Strings in SQLite/Prisma, so you should use `JSON.parse` and `JSON.stringify` on the server and client.
5. **Conditional Logic**: Keep a state object for the form values in React. When rendering fields, check if their conditions are met by inspecting the current values in the state object.

## Constraints
- **Project Path**: `/home/user/app`
- **Start Command**: `wasp start`
- **Port**: 3000

