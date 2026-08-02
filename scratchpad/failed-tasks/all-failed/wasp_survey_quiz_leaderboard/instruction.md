# Interactive Quiz Platform with Server-Enforced Timers and Leaderboard

## Background
In modern web applications, interactive quizzes, assessments, and learning platforms require robust state management, precise timing, and secure server-side scoring. Defining these features in a full-stack application can be complex because client-side timers can be easily bypassed or manipulated. To prevent cheating and ensure integrity, quiz duration and scoring must be strictly validated and enforced on the server.

In this task, you will build an interactive quiz platform using Wasp.sh (v0.24.0), React, Node.js, and Prisma/SQLite. Wasp is a declarative, spec-driven full-stack framework where high-level configuration is defined in `main.wasp.ts` using `@wasp.sh/spec` and database models are defined in `schema.prisma`.

## Requirements

### 1. Database Schema (`schema.prisma`)
Define the following entities to model the quiz, questions, choices, submissions, and leaderboard:
- **`User`**: Linked to Wasp's auth system, with a unique `username` (String) and relation to `QuizSubmission`.
- **`Quiz`**: Represents a quiz with `title` (String), `timeLimit` (Int, in seconds), and relations to `Question` and `QuizSubmission`.
- **`Question`**: Represents a question inside a quiz, with `text` (String), `points` (Int, score weighting), and relations to `Quiz` and `Choice`.
- **`Choice`**: Represents a multiple-choice option for a question, with `text` (String), `isCorrect` (Boolean), and relation to `Question`.
- **`QuizSubmission`**: Tracks a user's attempt at a quiz, with `startedAt` (DateTime, defaults to `now()`), `completedAt` (DateTime, optional), `score` (Int, optional), `isTimedOut` (Boolean, defaults to `false`), and relations to `User`, `Quiz`, and `SubmittedAnswer`.
- **`SubmittedAnswer`**: Stores the user's selected choice for each question in a submission, with relations to `QuizSubmission` and `Choice`, and a unique constraint on the combination of `submissionId` and `questionId`.

### 2. Authentication
- Enable `usernameAndPassword` authentication in `main.wasp.ts`.
- Set up `userSignupFields` to automatically copy the signed-up `username` onto the `username` field of your custom `User` entity.
- Set up routes and pages for `/login` and `/signup` using Wasp's built-in `LoginForm` and `SignupForm` from `wasp/client/auth`.
- The root route `/` must render the `MainPage` and require authentication.

### 3. Server-Side Operations (Queries & Actions)
Implement the following operations with strict validation and server-side enforcement:
- **`getQuizzes` Query**: Fetches all available quizzes from the database, including the total number of questions for each quiz.
- **`getQuizSubmission` Query**:
  - Accepts `{ submissionId: number }`.
  - Returns the `QuizSubmission` along with its associated `Quiz` and its questions (including their choices).
  - **Cheating Prevention**: To prevent client-side cheating, this query must NOT return the `isCorrect` field of the choices unless the submission has already been completed (`completedAt` is not null).
- **`getLeaderboard` Query**:
  - Accepts `{ quizId: number }`.
  - Returns the top submissions for the given quiz, ordered by `score` descending, then by completion duration (`completedAt` - `startedAt`) ascending.
- **`startQuiz` Action**:
  - Accepts `{ quizId: number }`.
  - Checks if the authenticated user already has an uncompleted (active) submission for this quiz. If so, returns it. Otherwise, creates and returns a new `QuizSubmission` with `startedAt` set to the current time.
- **`submitQuiz` Action**:
  - Accepts `{ submissionId: number, answers: Array<{ questionId: number, selectedChoiceId: number }> }`.
  - Fetches the `QuizSubmission` and ensures it belongs to the authenticated user and is not already completed.
  - **Server-Enforced Timer**: Calculates the elapsed time in seconds between `startedAt` and the current server time.
    - If the elapsed time exceeds the quiz's `timeLimit` plus a 5-second grace period (i.e., `elapsed > timeLimit + 5`), the action must grade the submission with a score of `0`, set `isTimedOut` to `true`, record `completedAt` as the current time, and save the submitted answers anyway.
    - Otherwise (within time limit), it grades the submission:
      - For each question, verifies if the `selectedChoiceId` is correct (`isCorrect` is `true`). If correct, adds the question's `points` to the total score.
      - Saves the answers as `SubmittedAnswer` records.
      - Records the calculated total score, sets `isTimedOut` to `false`, and records `completedAt` as the current server time.
  - Returns the graded submission details.

### 4. Frontend UI & Test Hooks
Implement the pages with the following test hooks (`data-testid`) to ensure deterministic browser verification:
- **Main Page (`/`)**:
  - **Quiz List**: Displays all quizzes. Each quiz container must have `data-testid="quiz-item-{quizId}"`.
    - Inside each quiz item, display the quiz title (`data-testid="quiz-title-{quizId}"`) and a button to start the quiz (`data-testid="start-quiz-btn-{quizId}"`).
  - **Leaderboard Section**: Displays the leaderboard for the quiz using a table or list with `data-testid="leaderboard"`.
    - Each entry in the leaderboard must be rendered in an element with `data-testid="leaderboard-row"`.
    - Inside each leaderboard row, display the user's username (`data-testid="leaderboard-username"`), the score (`data-testid="leaderboard-score"`), and the completion duration in seconds (`data-testid="leaderboard-time"`).
  - **Logout Button**: A button with `data-testid="logout-btn"` to sign out.
- **Quiz Page (`/quiz/:submissionId`)**:
  - Display the quiz title with `data-testid="quiz-title"`.
  - **Countdown Timer**: Display the remaining seconds with `data-testid="timer"`. This timer must count down in real-time. If it reaches 0, the frontend should automatically submit the current answers or display a time-out message and trigger submission.
  - **Questions List**: Render each question inside an element with `data-testid="question-item-{questionId}"`.
    - Under each question, render choice radio inputs. Each choice input must have `data-testid="choice-{choiceId}"`.
  - **Submit Button**: A button with `data-testid="submit-quiz-btn"` to submit the quiz.
- **Results Page (`/results/:submissionId`)**:
  - Display the score with `data-testid="results-score"`.
  - Display whether the quiz timed out with `data-testid="results-timeout"` (must contain "Yes" or "Timed Out" if timed out, or "No" or "Completed" if not).
  - Display the time taken in seconds with `data-testid="results-duration"` (e.g., "8 seconds").
  - Provide a button/link with `data-testid="go-home-btn"` to return to the homepage.

## Implementation Hints
- **Project Path**: `/home/user/app`
- **Start Command**: `wasp start`
- **Port**: `3000`
- **Wasp Version**: Target Wasp `^0.24.0` using the TypeScript configuration spec (`main.wasp.ts`).
- **Database**: SQLite (default).
- **Imports in `main.wasp.ts`**: Remember that in Wasp `^0.24.0`, imports of your own code (pages, queries, actions) in `main.wasp.ts` must use the `with { type: "ref" }` syntax.

### Database Seeding (`src/seeds.ts`)
Implement a seed function `seedQuizData` that creates exactly the following initial state:
1. A test user with username `quizmaster` and password `password123`.
2. A competitor user with username `competitor` and password `password123`.
3. A Quiz with title "JavaScript & Wasp Trivia", `timeLimit: 30` seconds.
4. Three questions for the quiz:
   - **Question 1**: "Which keyword is used to import pages or queries in Wasp main.wasp.ts?" with `points: 10`.
     - Choices:
       - "import ... with { type: 'ref' }" (Correct)
       - "import ... with { type: 'link' }" (Incorrect)
       - "import ... from 'wasp/client'" (Incorrect)
       - "require(...)" (Incorrect)
   - **Question 2**: "What database does Wasp use by default for local development?" with `points: 15`.
     - Choices:
       - "SQLite" (Correct)
       - "PostgreSQL" (Incorrect)
       - "MongoDB" (Incorrect)
       - "MySQL" (Incorrect)
   - **Question 3**: "Which package is used to define the configuration in main.wasp.ts?" with `points: 25`.
     - Choices:
       - "@wasp.sh/spec" (Correct)
       - "@wasp.sh/core" (Incorrect)
       - "wasp-config" (Incorrect)
       - "@wasp.sh/dsl" (Incorrect)
5. A completed submission for the `competitor` user on this quiz:
   - Score: `25` (answered Question 1 and Question 2 correctly).
   - Started: exactly 10 seconds ago, completed: exactly 5 seconds ago (duration: 5 seconds).
   - This ensures the leaderboard displays the competitor with score 25 and duration 5 seconds before the test user starts.

