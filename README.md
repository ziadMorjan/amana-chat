## Overview

Amana Chat is a real-time messaging experience built with Next.js 15, React 19, and Ably. The application provides authenticated access to a shared chat room, presence indicators for connected users, and a responsive UI designed for both desktop and mobile screens.

## Key Features

- Secure email/password authentication with hashed credentials and JWT-backed sessions.
- MongoDB persistence for user accounts and chat history.
- Ably-powered realtime messaging, presence tracking, and typing indicators.
- Accessible, mobile-friendly interface with live connection status and logout controls.

## Prerequisites

- Node.js 20 or later
- npm (comes with Node)
- Ably account and API key

## Environment Configuration

Use `.env.example` as a reference and create a `.env.local` file with the following variables:

```
ABLY_API_KEY=your-ably-api-key
NEXT_PUBLIC_ABLY_AUTH_URL=/api/ably-auth
AUTH_SECRET=replace-with-32-char-secret
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=amana_chat
```

Recommendations:

- Keep `.env.local` out of version control.
- Use a long, random string for `AUTH_SECRET`, and rotate it regularly in production.
- Point `MONGODB_URI`/`MONGODB_DB` at a development cluster (Atlas or local) and configure production secrets in your deployment environment.

## Installation

```bash
npm install
```

## Local Development

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000). Register a new account or sign in with existing credentials to join the chat.

## Project Structure Highlights

- `app/` – Next.js App Router pages and API routes (auth, Ably token exchange, chat messages).
- `components/` – Client components for chat UI, message input, user list, and auth form.
- `lib/auth/` – Session helpers, validation schema, and Mongo-backed user repository.
- `lib/messages/` – MongoDB persistence helpers for chat history.
- `lib/db/mongo.ts` – Shared MongoDB client with connection caching.
- `lib/ablyClient.ts` – Lazy Ably client initializer that respects the active session.

## Security Notes

- Never commit secrets or API keys. Rotate compromised keys immediately.
- Ensure MongoDB credentials and network access rules are scoped to the minimum necessary privileges.
- JWT cookies are httpOnly and set to expire after seven days—adjust the duration to match your security requirements.

## Deployment

This project targets the standard Next.js deployment workflow (Vercel, Docker, or custom Node hosting). Ensure environment variables are configured for the target platform and consider upgrading the credential store before going live.
