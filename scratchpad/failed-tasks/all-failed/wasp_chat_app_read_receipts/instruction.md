# Real-Time Chat Application with Typing Indicators and Read Receipts

## Background
In modern collaborative chat platforms (like Slack or Discord), real-time communication is critical. Users expect instant message delivery, real-time typing indicators, and immediate read receipt updates when other users read their messages. Wasp.sh (v0.24.0) provides built-in support for Socket.IO-based WebSockets alongside its full-stack Query/Action architecture. In this task, you will build a robust, real-time multi-channel chat application with active user tracking, typing status timeouts, and real-time read receipt updates.

## Requirements

### 1. Database Schema (`schema.prisma`)
Define the following entities in your `schema.prisma` file:
- **User**: Standard user entity connected to Wasp's auth system. It must have a unique `username` (String) field, and relations to messages and read receipts.
- **Channel**: Represents a chat room. It must have a unique `name` (String) field, and relations to messages and read receipts.
- **Message**: Represents a message sent in a channel. It must have `content` (String), `senderId` (Int, foreign key to User), `channelId` (Int, foreign key to Channel), and `createdAt` (DateTime, defaults to now).
- **ReadReceipt**: Represents the "read cursor" for a user in a channel. It must have `userId` (Int, foreign key to User), `channelId` (Int, foreign key to Channel), and `lastReadMessageId` (Int, foreign key to Message). There must be a unique constraint on the pair of `[userId, channelId]` so each user has at most one read cursor per channel.

### 2. Wasp Configuration (`main.wasp.ts`)
Configure the Wasp application spec with the following:
- **Authentication**: Enable `usernameAndPassword` auth, using `User` as the user entity, and redirecting failed authentication to `/login`.
- **WebSockets**: Enable WebSocket support with `autoConnect: true`, referencing a custom server-side function `webSocketFn` in `src/webSocket.ts`.
- **Routes & Pages**:
  - `/` -> `MainPage` (requires authentication).
  - `/channel/:id` -> `ChannelPage` (requires authentication).
  - `/login` -> `LoginPage` (public).
  - `/signup` -> `SignupPage` (public).
- **Operations**:
  - Query `getChannels` (uses `Channel` entity).
  - Query `getChannel` (uses `Channel` entity).
  - Query `getChannelMessages` (uses `Message`, `ReadReceipt`, and `User` entities).
  - Action `createChannel` (uses `Channel` entity).
  - Action `createMessage` (uses `Message` and `ReadReceipt` entities).
  - Action `markAsRead` (uses `ReadReceipt` and `Message` entities).
- **Database Seeding**: Register a seed function named `seedDevData` under `db.seeds`.

### 3. Server-Side Operations & WebSocket Integration
- **WebSocket Setup (`src/webSocket.ts`)**:
  - Implement `webSocketFn` to initialize the Socket.IO server.
  - When a client connects and is authenticated, store their socket/user association.
  - Implement handlers for:
    - `joinChannel`: Accepts `{ channelId: number }`. Adds the socket to room `channel-${channelId}`. Tracks that this user is active in this channel, and broadcasts the list of all active usernames in that channel to everyone in the room via the `activeUsers` event.
    - `leaveChannel`: Accepts `{ channelId: number }`. Removes the socket from room `channel-${channelId}`. Updates the active users tracking and broadcasts the updated list.
    - `typing`: Accepts `{ channelId: number, isTyping: boolean }`. Broadcasts `{ username: string, isTyping: boolean }` to room `channel-${channelId}` (excluding the sender) via the `typing` event.
    - `disconnect`: Cleans up the user's active status from all channels they were in, and broadcasts updated active user lists to those channels.
  - **Critical Seam**: To allow server-side operations (like Actions) to emit WebSocket events, you must store a reference to the Socket.IO `io` server instance globally/module-level and export a helper/getter to retrieve it.
- **Query `getChannels`**: Returns all channels.
- **Query `getChannel`**: Returns a single channel by ID.
- **Query `getChannelMessages`**: Returns all messages for a specific channel, sorted chronologically, along with their sender's details and the read receipts of other users for those messages.
- **Action `createChannel`**: Accepts `{ name: string }` and creates a new channel. If a channel with that name already exists, throw an error.
- **Action `createMessage`**:
  - Accepts `{ channelId: number, content: string }`.
  - Creates a new message linked to the logged-in user and the channel.
  - Automatically creates or updates the sender's `ReadReceipt` record for this channel to point to this new message as `lastReadMessageId`.
  - Broadcasts the new message to room `channel-${channelId}` via the `messageCreated` WebSocket event.
  - Returns the created message.
- **Action `markAsRead`**:
  - Accepts `{ channelId: number, lastReadMessageId: number }`.
  - Creates or updates the logged-in user's `ReadReceipt` record for this channel to point to `lastReadMessageId`.
  - Broadcasts a `readReceiptUpdated` WebSocket event to room `channel-${channelId}` with `{ userId: number, username: string, lastReadMessageId: number }`.
  - Returns the updated/created read receipt.

### 4. Client-Side UI & Test Hooks
Implement the pages with the following test hooks (`data-testid`) to ensure deterministic browser verification:
- **Login Page (`/login`) & Signup Page (`/signup`)**: Use Wasp's built-in `LoginForm` and `SignupForm` components from `wasp/client/auth`.
- **Main Page (`/`)**:
  - Title: Element with `data-testid="main-title"`.
  - Create Channel Form:
    - Input: `<input id="channel-name-input" data-testid="channel-name-input" />`.
    - Button: `<button id="create-channel-btn" data-testid="create-channel-btn">Create Channel</button>`.
  - Channels List:
    - Container: `<div data-testid="channels-list">`.
    - Each channel item: `<a data-testid="channel-link" data-channel-id="<channelId>" href="/channel/<channelId>">`.
  - Logout Button: `<button data-testid="logout-btn">Logout</button>`.
- **Channel Page (`/channel/:id`)**:
  - Channel Title: `<h1 data-testid="channel-title">` showing the channel name (e.g. `#general`).
  - Active Users List:
    - Container: `<div data-testid="active-users-list">`.
    - Each active user: `<span data-testid="active-user-item" data-username="<username>">`.
  - Typing Indicators:
    - Container: `<div data-testid="typing-indicators">`.
    - Each typing user: `<span data-testid="typing-user-item" data-username="<username>">` (displays e.g. "Alice is typing...").
    - **Inactivity Timeout**: The typing indicator must disappear if no keystroke is detected from that user for 3 seconds, or when they send a message. When typing, client-side keystroke listeners must emit `{ isTyping: true }` (debounced/throttled) and clear/reset a 3-second local timer that emits `{ isTyping: false }` when it fires.
  - Messages List:
    - Container: `<div data-testid="messages-list">`.
    - Each message item: `<div data-testid="message-item" data-message-id="<id>">`.
      - Sender: `<span data-testid="message-sender">`.
      - Content: `<span data-testid="message-content">`.
      - Read Receipts Container: `<div data-testid="message-read-receipts">`.
        - Each reader: `<span data-testid="reader-name" data-username="<username>">` (displays username of other users who have read this message. A message is read by user X if their `lastReadMessageId` in this channel is >= the message's ID. Do NOT include the sender's own name in their own message's read receipts list).
  - Message Input Form:
    - Input: `<input id="message-input" data-testid="message-input" />`.
    - Button: `<button id="send-message-btn" data-testid="send-message-btn">Send</button>`.
    - **Typing Trigger**: Any key down in the input field must trigger the typing indicator state. Sending a message must immediately clear the typing indicator state.
  - Back Link: `<a data-testid="back-to-channels" href="/">`.

### 5. Database Seeding
Implement the seed function `seedDevData` that pre-creates:
- User `alice` (password: `password123`)
- User `bob` (password: `password123`)
- Two Channels: `#general` and `#random`.
Use `sanitizeAndSerializeProviderData` from `'wasp/server/auth'` to hash the passwords for the auth identities.

