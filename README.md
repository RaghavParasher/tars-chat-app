# Tars Chat App - Real-Time Messaging Platform

A premium, real-time chat application built for the Tars Full-Stack Developer Internship Challenge.

## ✨ Features
- **Real-Time Messaging**: Instant message delivery using Convex.
- **Biomedical Auth**: Secure login via Clerk (Google & Email).
- **Presence & Processing**: See who's online and when they are typing.
- **Unread Badges**: Real-time message counters for each conversation.
- **Soft Delete**: Remove messages while keeping conversation context.
- **Responsive Design**: Beautiful UI built with Tailwind CSS and Framer Motion.

## 🚀 Tech Stack
- **Frontend**: Next.js 16 (App Router), Tailwind CSS, Lucide React.
- **Backend**: Convex (Real-time database and serverless functions).
- **Auth**: Clerk (Next.js SDK).
- **State Management**: React Hooks & Convex Hooks.

## 🛠️ Local Setup

1. **Clone the repository**:
   ```bash
   git clone <your-repo-link>
   cd tars-chat-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Create a `.env.local` file with:
   ```env
   NEXT_PUBLIC_CONVEX_URL=https://<your-project>.convex.cloud
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

4. **Run Convex**:
   ```bash
   npx convex dev
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```

## 📄 Submission Requirements
- **Vercel URL**: Live application link.
- **GitHub Repo**: Public repository with clean code.
- **Video Walkthrough**: 5-minute recording showing functionality and a code change.
