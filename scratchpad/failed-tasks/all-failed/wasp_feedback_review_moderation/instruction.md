# Product Feedback Review & Moderation System in Wasp.sh

## Background
Product reviews are crucial for e-commerce and feedback platforms, but they are highly susceptible to spam and abuse. A robust review system requires automatic spam detection, a manual moderation workflow for administrators, and dynamic rating aggregations.

In this task, you will build a full-stack Product Feedback Review and Moderation System using Wasp.sh (v0.24.0), React, Node.js, and Prisma. Wasp is a full-stack, spec-driven framework where high-level configuration is defined in `main.wasp.ts` using `@wasp.sh/spec`, and data models are defined in `schema.prisma`.

## Requirements

### 1. Database Schema (`schema.prisma`)
Define the following entities in your `schema.prisma` file:
- `User`:
  - `id`: Int, `@id`, `@default(autoincrement())`
  - `username`: String, `@unique`
  - `password`: String
  - `isAdmin`: Boolean, `@default(false)`
  - `reviews`: `Review[]` (relation to `Review`)
  - `votes`: `Vote[]` (relation to `Vote`)
- `Product`:
  - `id`: Int, `@id`, `@default(autoincrement())`
  - `name`: String
  - `description`: String
  - `reviews`: `Review[]` (relation to `Review`)
- `Review`:
  - `id`: Int, `@id`, `@default(autoincrement())`
  - `rating`: Int (1 to 5 stars)
  - `title`: String
  - `content`: String
  - `status`: String (defaults to "PENDING", can be "PENDING", "APPROVED", "SPAM", or "REJECTED")
  - `productId`: Int
  - `product`: `Product` (relation `fields: [productId], references: [id], onDelete: Cascade`)
  - `userId`: Int
  - `user`: `User` (relation `fields: [userId], references: [id], onDelete: Cascade`)
  - `votes`: `Vote[]` (relation to `Vote`)
  - `createdAt`: DateTime, `@default(now())`
- `Vote`:
  - `id`: Int, `@id`, `@default(autoincrement())`
  - `reviewId`: Int
  - `review`: `Review` (relation `fields: [reviewId], references: [id], onDelete: Cascade`)
  - `userId`: Int
  - `user`: `User` (relation `fields: [userId], references: [id], onDelete: Cascade`)
  - `isUpvote`: Boolean (default: true)
  - `@@unique([reviewId, userId])`

### 2. Wasp Config (`main.wasp.ts`)
Configure the Wasp application spec with the following:
- **Wasp Version**: You must use Wasp `^0.24.0`.
- **Authentication**: Enable `usernameAndPassword` auth, using `User` as the user entity, and redirecting failed authentication to `/login`.
  - Implement `userSignupFields` in `src/auth.ts` to copy the signed-up username to the `User` entity. If the username is "admin", set `isAdmin` to `true`, otherwise `false`.
- **Routes & Pages**:
  - `/signup` -> `SignupRoute` (renders `SignupPage` component, public)
  - `/login` -> `LoginRoute` (renders `LoginPage` component, public)
  - `/` -> `RootRoute` (renders `MainPage` component, `authRequired: true`)
  - `/product/:id` -> `ProductRoute` (renders `ProductPage` component, `authRequired: true`)
  - `/moderation` -> `ModerationRoute` (renders `ModerationPage` component, `authRequired: true`)
- **Operations**:
  - Query `getProducts` (uses `Product` entity)
  - Query `getProduct` (uses `Product`, `Review`, `Vote` entities)
  - Query `getPendingReviews` (uses `Review` entity)
  - Action `submitReview` (uses `Review`, `Product` entities)
  - Action `approveReview` (uses `Review` entity)
  - Action `rejectReview` (uses `Review` entity)
  - Action `upvoteReview` (uses `Vote`, `Review` entities)

### 3. Server-Side Operations & Spam Detection
- **Default Products Init**:
  - To avoid manual database seeding, if the `Product` table is empty when `getProducts` is called, the server must automatically seed two default products:
    1. Name: "Wireless Headphones", Description: "Noise-cancelling over-ear headphones."
    2. Name: "Smart Watch", Description: "Fitness tracker with heart rate monitor."
- **Query `getProducts`**:
  - Returns all products in the database.
- **Query `getProduct`**:
  - Accepts a product ID.
  - Returns the product along with its reviews that have the status "APPROVED" (including the reviewer's username and upvote counts), and the calculated average rating of those approved reviews (as a float, or 0 if none).
- **Query `getPendingReviews`**:
  - Returns all reviews with status "PENDING" (including product name and reviewer username).
  - **Access Control**: Must throw an error if the authenticated user is not an admin (`isAdmin` is `false`).
- **Action `submitReview`**:
  - Accepts `{ productId, rating, title, content }`.
  - **Spam Detection Filter**:
    - If the `title` or `content` contains any of the following case-insensitive keywords: "buy now", "crypto", "discount", "viagra", "click here".
    - Or if the `rating` is not an integer between 1 and 5 (inclusive).
    - If spam is detected, the review's status must be set directly to "SPAM" in the database.
    - If no spam is detected, the status must be set to "PENDING".
  - Returns the created review.
- **Action `approveReview`**:
  - Accepts `{ reviewId }`.
  - **Access Control**: Must throw an error if the authenticated user is not an admin.
  - Updates the review's status to "APPROVED".
- **Action `rejectReview`**:
  - Accepts `{ reviewId }`.
  - **Access Control**: Must throw an error if the authenticated user is not an admin.
  - Updates the review's status to "REJECTED".
- **Action `upvoteReview`**:
  - Accepts `{ reviewId }`.
  - Creates a `Vote` record for the authenticated user and specified review.
  - Ensure a user cannot upvote their own review, and cannot upvote the same review more than once (enforce unique constraint or handle gracefully).

### 4. Client-Side UI & Test Hooks
Implement the pages with the following test hooks (`data-testid`) to ensure deterministic browser verification:
- **Login Page (`/login`)**:
  - Uses Wasp's built-in `<LoginForm />`.
- **Signup Page (`/signup`)**:
  - Uses Wasp's built-in `<SignupForm />`.
- **Main Page (`/`)**:
  - Display list of products. Each product item must have `data-testid="product-item"`.
  - Within each product item, display the product name (`data-testid="product-name"`) and a link/button to view the details page (`data-testid="view-product-[productId]"` or a link with `href="/product/[productId]"`).
  - If the logged-in user is an admin, display a link to the moderation page with `data-testid="moderation-link"`.
  - Display a logout button with `data-testid="logout-btn"`.
- **Product Page (`/product/:id`)**:
  - Display product name (`data-testid="product-details-name"`) and description (`data-testid="product-details-desc"`).
  - Display average rating of approved reviews with `data-testid="average-rating"` (format as a decimal, e.g., `4.0`, or show "No reviews yet" if there are no approved reviews).
  - Display total approved reviews count with `data-testid="reviews-count"`.
  - **Review Submission Form**:
    - Star rating dropdown/select with `data-testid="review-rating"` (options 1 to 5).
    - Title input field with `data-testid="review-title"`.
    - Content textarea field with `data-testid="review-content"`.
    - Submit button with `data-testid="review-submit-btn"`.
  - **Approved Reviews List**:
    - Render list of approved reviews under an element with `data-testid="approved-reviews-list"`.
    - Each approved review item must have `data-testid="review-item"`.
    - Within each review item, display:
      - Rating: `data-testid="review-rating-value"`
      - Title: `data-testid="review-title-value"`
      - Content: `data-testid="review-content-value"`
      - Author: `data-testid="review-author"`
      - Upvote button: `data-testid="upvote-btn"` (or `data-testid="upvote-btn-[reviewId]"`)
      - Upvote count: `data-testid="upvotes-count"` (or `data-testid="upvotes-count-[reviewId]"`)
- **Moderation Page (`/moderation`)**:
  - Accessible only to admin users. Non-admins must see "Access Denied" or be redirected.
  - Render list of pending reviews under `data-testid="pending-reviews-list"`.
  - Each pending review item must have `data-testid="pending-review-item"`.
  - Within each pending review item, display:
    - Product name: `data-testid="pending-review-product"`
    - Reviewer: `data-testid="pending-review-author"`
    - Rating: `data-testid="pending-review-rating"`
    - Title: `data-testid="pending-review-title"`
    - Content: `data-testid="pending-review-content"`
    - Approve button: `data-testid="approve-btn"` or `data-testid="approve-btn-[reviewId]"`.
    - Reject button: `data-testid="reject-btn"` or `data-testid="reject-btn-[reviewId]"`.

## Implementation Hints
- **Project Path**: `/home/user/app`
- **Start Command**: `wasp start`
- **Port**: 3000
- **Database**: SQLite (default)
- Run `wasp db migrate-dev --name init` before starting the application.
- Make sure all reference imports in `main.wasp.ts` use the correct `with { type: "ref" }` syntax.

