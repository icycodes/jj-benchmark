# Wasp Social Feed & Activity

## Background
Wasp is a declarative, batteries-included full-stack framework. In version 0.24.0, Wasp uses a TypeScript configuration spec (`main.wasp.ts`) instead of the old `.wasp` DSL. All configuration is defined using the `@wasp.sh/spec` package.

In this task, you will implement a social network feed with nested comments, likes, and a personalized activity feed. Wasp automatically manages React Query cache invalidation when actions touch entities that queries depend on, allowing for real-time reactive updates out of the box.

## Requirements

### 1. Data Model (`schema.prisma`)
You must implement the following entities in `schema.prisma`:
- **User**: Standard user entity connected to Wasp's auth system. It must have a unique `username` (String) field.
- **Follow**: Represents a follower-following relationship between two users. It must have `followerId` and `followingId` fields with a unique constraint on the pair.
- **Post**: Represents a user's post, with `title`, `content`, `userId`, and `createdAt`.
- **Comment**: Represents a comment on a post. To support nested replies (tree structure), each comment can optionally have a `parentId` pointing to another comment, and a `replies` relation.
- **Like**: Represents a like on a post, with `postId` and `userId` and a unique constraint on the pair.
- **Activity**: Represents a social action performed by a user. It must have `userId`, `type` (e.g., `POST_CREATED`, `COMMENT_ADDED`, `POST_LIKED`), `targetId` (ID of post or comment), `targetType` (`POST` or `COMMENT`), `content` (text description), and `createdAt`.

### 2. Authentication
- Enable `usernameAndPassword` authentication in `main.wasp.ts`.
- Set up `userSignupFields` to automatically copy the signed-up `username` onto the `username` field of your custom `User` entity.
- Set up routes and pages for `/login` and `/signup` using Wasp's built-in `LoginForm` and `SignupForm` from `wasp/client/auth`.
- The root route `/` must render the `MainPage` and require authentication.

### 3. Server Operations (Queries & Actions)
You must declare and implement the following operations:
- **`getPosts` Query**: Fetches all posts from the database, including the post author, likes, and comments (with comment authors).
- **`getPost` Query**: Fetches a single post by ID, including the post author, likes, and comments (with comment authors).
- **`getActivities` Query**: Fetches the personalized activity feed of the logged-in user. It should return activities performed by users the logged-in user follows, sorted by `createdAt` in descending order.
- **`createPost` Action**: Creates a new `Post` and a corresponding `Activity` record of type `POST_CREATED`.
- **`createComment` Action**: Creates a new `Comment` (supporting optional nested `parentId`) and a corresponding `Activity` record of type `COMMENT_ADDED`.
- **`toggleLike` Action**: Toggles a `Like` on a post. If the user hasn't liked the post, create a `Like` and a corresponding `Activity` record of type `POST_LIKED`. If they have, remove the `Like` (no activity needed for unliking).

### 4. Frontend UI
- **Post Creation**: A form with input `id="post-title"` (or placeholder `"Post Title"`), textarea `id="post-content"` (or placeholder `"Post Content"`), and button `id="create-post-btn"` (or text `"Create Post"`).
- **Post List**: Displays all posts. Each post item must have class `post-item` or `data-testid="post-item"`.
  - Inside each post item, display the post title (class `post-title`), content (class `post-content`), author (class `post-author`), and a like button (class `like-btn` or `data-testid="like-btn"`) showing the count of likes (e.g. `"Likes: 1"`).
- **Comment Section**: Under each post, display a comment input (class `comment-input` or placeholder `"Add a comment..."`) and a button to submit (class `add-comment-btn` or text `"Comment"`).
- **Nested Replies**: Comments must be displayed in a tree structure. Each comment must have class `comment-item` or `data-testid="comment-item"`.
  - Inside each comment item, display the comment content (class `comment-content`), author (class `comment-author`), a reply input (class `reply-input` or placeholder `"Reply to this comment..."`), and a submit reply button (class `reply-btn` or text `"Reply"`).
  - Nested replies must be rendered inside their parent comment's container, visually nested.
- **Activity Feed**: A sidebar or section with `id="activity-feed"` or `data-testid="activity-feed"`. It must list activity items (class `activity-item` or `data-testid="activity-item"`) displaying the activity's description.
- **Logout**: A button with `id="logout-btn"` or text `"Log out"` to sign out.

## Implementation Guide & I/O Contracts

### 1. Database Schema (`schema.prisma`)
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id         Int        @id @default(autoincrement())
  username   String     @unique
  posts      Post[]
  comments   Comment[]
  likes      Like[]
  activities Activity[]
  following  Follow[]   @relation("follower")
  followers  Follow[]   @relation("following")
}

model Follow {
  id          Int    @id @default(autoincrement())
  followerId  Int
  follower    User   @relation("follower", fields: [followerId], references: [id])
  followingId Int
  following   User   @relation("following", fields: [followingId], references: [id])
  @@unique([followerId, followingId])
}

model Post {
  id        Int       @id @default(autoincrement())
  title     String
  content   String
  userId    Int
  user      User      @relation(fields: [userId], references: [id])
  comments  Comment[]
  likes     Like[]
  createdAt DateTime  @default(now())
}

model Comment {
  id        Int       @id @default(autoincrement())
  content   String
  postId    Int
  post      Post      @relation(fields: [postId], references: [id])
  userId    Int
  user      User      @relation(fields: [userId], references: [id])
  parentId  Int?
  parent    Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies   Comment[] @relation("CommentReplies")
  createdAt DateTime  @default(now())
}

model Like {
  id        Int      @id @default(autoincrement())
  postId    Int
  post      Post     @relation(fields: [postId], references: [id])
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  @@unique([postId, userId])
}

model Activity {
  id         Int      @id @default(autoincrement())
  userId     Int
  user       User     @relation(fields: [userId], references: [id])
  type       String
  targetId   Int
  targetType String
  content    String
  createdAt  DateTime @default(now())
}
```

### 2. Wasp Config (`main.wasp.ts`)
```typescript
import { app, page, route, query, action } from "@wasp.sh/spec"
import { MainPage } from "./src/MainPage" with { type: "ref" }
import { LoginPage } from "./src/LoginPage" with { type: "ref" }
import { SignupPage } from "./src/SignupPage" with { type: "ref" }
import { userSignupFields } from "./src/auth" with { type: "ref" }
import { devSeedSimple } from "./src/seeds" with { type: "ref" }
import { getPosts, getPost, getActivities } from "./src/queries" with { type: "ref" }
import { createPost, createComment, toggleLike } from "./src/actions" with { type: "ref" }

export default app({
  name: "app",
  wasp: { version: "^0.24.0" },
  title: "Social Feed & Activity",
  auth: {
    userEntity: "User",
    methods: {
      usernameAndPassword: {
        userSignupFields
      }
    },
    onAuthFailedRedirectTo: "/login"
  },
  db: {
    seeds: [
      devSeedSimple
    ]
  },
  spec: [
    route("RootRoute", "/", page(MainPage, { authRequired: true })),
    route("LoginRoute", "/login", page(LoginPage)),
    route("SignupRoute", "/signup", page(SignupPage)),
    query(getPosts, { entities: ["Post", "Comment", "Like"] }),
    query(getPost, { entities: ["Post", "Comment", "Like"] }),
    query(getActivities, { entities: ["Activity", "Follow"] }),
    action(createPost, { entities: ["Post", "Activity"] }),
    action(createComment, { entities: ["Comment", "Activity"] }),
    action(toggleLike, { entities: ["Like", "Activity"] })
  ]
})
```

### 3. Custom Signup Fields (`src/auth.ts`)
```typescript
import { defineUserSignupFields } from 'wasp/server/auth'

export const userSignupFields = defineUserSignupFields({
  username: (data: any) => {
    if (!data.username) {
      throw new Error('Username is required')
    }
    return data.username
  }
})
```

### 4. Database Seed (`src/seeds.ts`)
Your seed function `devSeedSimple` must pre-create:
- User `alice` (password: `password123`)
- User `bob` (password: `password123`)
- A follow relationship where `bob` follows `alice`.
Use `sanitizeAndSerializeProviderData` from `'wasp/server/auth'` to hash the password for the auth identities.

## Constraints
- **Project Path**: `/home/user/app`
- **Start Command**: `wasp start`
- **Port**: 3000

