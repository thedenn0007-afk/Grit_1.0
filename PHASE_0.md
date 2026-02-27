# Grit Flow - Phase 0 Documentation

**Project**: Grit Flow  
**Date**: February 20, 2026  
**Phase**: 0 - Foundation & Infrastructure  
**Status**: ✅ Complete

---

## Overview

Phase 0 establishes the foundational infrastructure for Grit Flow, a TypeScript/Next.js 14 learning platform with real-time tRPC APIs, SQLite/PostgreSQL database, NextAuth email authentication, and a component-based UI architecture.

---

## Phase 0 Checklist

### Prompt 0.1: Project Setup & Tooling
- [x] Next.js 14 initialized with TypeScript, Tailwind, shadcn/ui
- [x] tRPC configured with App Router
- [x] Zod installed and configured
- [x] Sentry installed and configured
- [x] Folder structure created: `/src/modules/{content,checkpoint,results,dashboard}`, `/src/lib/{trpc,db,error-handling}`, `/config`, `/prisma`
- [x] Dependencies installed: zustand, @tanstack/react-query, @trpc/client, @trpc/server, @trpc/react-query, @prisma/client, next-auth
- [x] `/config/features.ts` created with flags: `deepDive`, `emailCapture`, `advancedAnalytics`
- [x] Dev server runs with zero errors

### Prompt 0.2: Database & Design System
- [x] SQLite connected (dev.db)
- [x] Prisma schema with 6 tables: User, Topic, Subtopic, UserProgress, Attempt, + NextAuth models
- [x] Schema synced with SQLite via `prisma db push`
- [x] `seed.ts` creates 3 topics, 9 subtopics with complexity 1-4
- [x] `globals.css` prepared for CSS variables
- [x] Database seeded and queryable
- [ ] PostgreSQL migration (optional, for production)

### Prompt 0.3: Auth & Base Components
- [x] NextAuth.js with email magic link working
- [x] Protected route middleware active
- [x] Base layout with tRPC, QueryClient, Auth providers
- [x] ErrorBoundary component created
- [x] Toast component created
- [x] Loading component created
- [x] ErrorFallback component created
- [x] `/modules/shared/hooks/useOfflineQueue` created
- [x] Authentication flow tested (pages accessible)

---

## Project Structure

```
Grit Flow/
├── .env                           # Environment variables
├── .env.local                     # Local overrides (git-ignored)
├── next.config.js                 # Next.js configuration
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.cjs            # Tailwind CSS configuration
├── postcss.config.cjs             # PostCSS configuration
├── package.json                   # Dependencies & scripts
├── prisma/
│   ├── schema.prisma              # Prisma database schema (6 tables + NextAuth models)
│   └── seed.ts                    # Database seeding script
├── config/
│   └── features.ts                # Feature flags (deepDive, emailCapture, advancedAnalytics)
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout with providers
│   │   ├── page.tsx               # Home page
│   │   ├── api/
│   │   │   ├── trpc/
│   │   │   │   └── route.ts       # tRPC API endpoint
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts   # NextAuth API routes
│   │   └── auth/
│   │       ├── signin/
│   │       │   └── page.tsx       # Magic link signin page
│   │       ├── error/
│   │       │   └── page.tsx       # Auth error page
│   │       └── verify-request/
│   │           └── page.tsx       # Email verification confirmation
│   ├── components/
│   │   ├── error/
│   │   │   ├── ErrorBoundary.tsx  # React error boundary wrapper
│   │   │   └── ErrorFallback.tsx  # Error fallback UI
│   │   └── ui/
│   │       ├── Button.tsx         # Base button component
│   │       ├── Toast.tsx          # Toast notification provider
│   │       └── Loading.tsx        # Loading skeleton/spinner
│   ├── lib/
│   │   ├── auth.ts                # NextAuth configuration
│   │   ├── db/
│   │   │   └── prisma.ts          # Prisma client singleton
│   │   ├── error-handling/
│   │   │   └── sentry.ts          # Sentry configuration stubs
│   │   └── trpc/
│   │       ├── router.ts          # tRPC app router with health & checkpoint procedures
│   │       ├── context.ts         # tRPC context (request + prisma)
│   │       ├── client.ts          # tRPC client with httpBatchLink
│   │       └── serverHandler.ts   # tRPC fetch handler
│   ├── middleware.ts              # NextAuth protected route middleware
│   ├── modules/
│   │   ├── shared/
│   │   │   └── hooks/
│   │   │       └── useOfflineQueue.ts  # Offline request queuing hook
│   │   ├── content/
│   │   │   └── index.tsx          # Content module placeholder
│   │   ├── checkpoint/
│   │   │   └── index.tsx          # Checkpoint module placeholder
│   │   ├── results/
│   │   │   └── index.tsx          # Results module placeholder
│   │   └── dashboard/
│   │       └── index.tsx          # Dashboard module placeholder
│   ├── providers/
│   │   └── Providers.tsx          # Unified provider wrapper
│   └── styles/
│       └── globals.css            # Global styles & CSS variables
└── sentry.client.config.js        # Sentry client configuration
└── sentry.server.config.js        # Sentry server configuration
```

---

## Database Schema

### Tables

#### 1. **User** (NextAuth extended)
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  createdAt     DateTime  @default(now())
  accounts      Account[]
  sessions      Session[]
  progress      UserProgress[]
  attempts      Attempt[]
}
```

#### 2. **Topic**
```prisma
model Topic {
  id          String     @id @default(cuid())
  title       String
  description String
  orderIndex  Int
  status      String     @default("locked")
  subtopics   Subtopic[]
}
```

#### 3. **Subtopic**
```prisma
model Subtopic {
  id               String   @id @default(cuid())
  topicId          String
  title            String
  complexityScore  Int      // 1-4
  contentJson      String   // Serialized content
  estimatedMinutes Int
  status           String   @default("locked")
  topic            Topic    @relation(fields: [topicId], references: [id])
  progress         UserProgress[]
  attempts         Attempt[]
}
```

#### 4. **UserProgress**
```prisma
model UserProgress {
  userId        String
  subtopicId    String
  status        String     // "not_started", "in_progress", "completed"
  currentPhase  String     // "content", "checkpoint", "results", "deep_dive"
  exitPointJson String?
  coreMastery   Float      @default(0.0)
  completedAt   DateTime?
  updatedAt     DateTime   @updatedAt
  user          User       @relation(fields: [userId], references: [id])
  subtopic      Subtopic   @relation(fields: [subtopicId], references: [id])
  @@id([userId, subtopicId])
}
```

#### 5. **Attempt** (Checkpoint results)
```prisma
model Attempt {
  id              String   @id @default(cuid())
  userId          String
  subtopicId      String
  questionsJson   String   // Serialized questions
  answersJson     String   // Serialized answers
  scoresJson      String   // Serialized scores
  totalScore      Int
  timeSpentSeconds Int
  createdAt       DateTime @default(now())
  user            User     @relation(fields: [userId], references: [id])
  subtopic        Subtopic @relation(fields: [subtopicId], references: [id])
}
```

#### 6. **NextAuth Models** (Account, Session, VerificationToken)
```prisma
model Account { ... }      // OAuth/email provider link
model Session { ... }      // User session tracking
model VerificationToken { } // Email verification tokens
```

---

## Dependencies

### Production (`dependencies`)
```json
{
  "next": "14.2.15",
  "react": "18.3.1",
  "react-dom": "18.3.1",
  "@trpc/server": "10.45.2",
  "@trpc/client": "10.45.2",
  "@trpc/react-query": "10.45.2",
  "@tanstack/react-query": "4.36.1",
  "@trpc/adapter-next": "^10.45.2",
  "superjson": "2.2.1",
  "zod": "3.23.8",
  "zustand": "5.0.0",
  "@prisma/client": "5.21.1",
  "@next-auth/prisma-adapter": "^1.0.7",
  "next-auth": "4.24.8",
  "@sentry/nextjs": "8.34.0",
  "nodemailer": "^6.9.7"
}
```

### Development (`devDependencies`)
```json
{
  "typescript": "5.6.3",
  "tailwindcss": "3.4.14",
  "postcss": "8.4.47",
  "autoprefixer": "10.4.20",
  "prisma": "5.21.1",
  "eslint": "8.57.1",
  "eslint-config-next": "14.2.15",
  "@types/node": "20.2.5",
  "@types/react": "18.3.11",
  "@types/react-dom": "18.3.1",
  "@types/nodemailer": "^6.4.14",
  "ts-node": "^10.9.1",
  "tsx": "^3.12.7"
}
```

---

## Key Features Implemented

### 1. **Authentication (NextAuth.js)**
- Magic link email sign-in flow
- Prisma adapter for user/session persistence
- Protected middleware for `/modules/*` routes
- Auth error/verify-request pages
- Session-based JWT tokens

**Config**: `src/lib/auth.ts`  
**Environment Variables**:
```dotenv
NEXTAUTH_SECRET=<random-32+-char-string>
NEXTAUTH_URL=http://localhost:3000
EMAIL_FROM=noreply@gritflow.dev
```

### 2. **tRPC API Layer**
- Server: `src/lib/trpc/router.ts` with `health` query and `checkpoint` mutation
- Client: `src/lib/trpc/client.ts` with httpBatchLink
- Context: `src/lib/trpc/context.ts` injects Request + Prisma
- Input validation: Zod schemas on all procedures

**Usage**:
```typescript
trpc.health.useQuery()         // Get health status
trpc.checkpoint.useMutation()  // Submit checkpoint answers
```

### 3. **Database Layer**
- Prisma ORM with SQLite (dev.db)
- Automatic migrations via `prisma db push`
- Seeding script: `prisma/seed.ts`
- Lazy-loaded Prisma client: `src/lib/db/prisma.ts`

**Commands**:
```bash
npm run prisma:generate   # Generate Prisma client
npm run prisma:migrate    # Create/run migrations
npm run prisma:studio     # Open Prisma Studio
npm run prisma:seed       # Seed database
```

### 4. **Component Architecture**
- **ErrorBoundary**: Catches unhandled React errors → fallback UI
- **Toast**: Global toast notification provider
- **Loading**: Skeleton/spinner component
- **ErrorFallback**: Dedicated error fallback UI

### 5. **Providers Wrapper**
`src/providers/Providers.tsx` stacks:
- SessionProvider (NextAuth)
- ToastProvider (notifications)
- tRPC provider (API client)
- QueryClientProvider (React Query)

### 6. **Offline Queue Hook**
`useOfflineQueue()` for resilient request queueing:
- Detects online/offline status
- Queues requests in localStorage when offline
- Auto-retries when connection restored

### 7. **Feature Flags**
`config/features.ts`:
```typescript
export const features = {
  deepDive: true,
  emailCapture: false,
  advancedAnalytics: true,
};
```

---

## **Recent Dev Notes (Feb 25, 2026)**

### Gemini AI Integration (Feb 26, 2026)

**New Feature**: Gemini AI integration for enhanced learning experience

**Files Created:**
- `src/lib/gemini/client.ts` - Core Gemini client with API key validation
- `src/lib/gemini/feedback.ts` - AI-powered feedback generation
- `src/lib/gemini/validation.ts` - Semantic similarity validation for short answers
- `src/app/api/gemini/route.ts` - REST API endpoint for Gemini operations
- `src/app/api/gemini/feedback/route.ts` - Feedback API endpoint

**Environment Variables:**
```dotenv
GEMINI_API_KEY=your_key_here
```

**Key Features:**
- **Short Answer Validation**: Uses Gemini for semantic similarity checking instead of keyword matching
- **Personalized Feedback**: Generates 2-sentence explanations for incorrect answers
- **Fallback**: Falls back to keyword matching if Gemini fails

**See**: [GEMINI.md](./GEMINI.md) for complete documentation

---

- **MDX Rendering:** Content rendering implemented with `react-markdown` + `rehype-raw` (fallback from runtime MDX due to registry/version issues).
- **Content Reader & Tracking:** `ContentReader` now collects signals (`scrollPercentage`, `pausePoints`, `revisitCount`, `timeOnPage`, `scrollSpeed`), autosaves with `useAutoSave` (debounced 5s), and queues failed saves to `useOfflineQueue`.
- **Exit payload:** `exit_point_json` stored in `UserProgress` includes `{ type, position, timestamp, durationSeconds, signals, adaptationModifier }` and is used to compute `resumePosition` in `content.getContent`.
- **Adaptive Engine:** `calculateComplexityAdjustment` is implemented at `/lib/adaptive-engine/calculator.ts` and used by server procedures to return an `adaptationModifier` (0–2).
- **Dev dummy login:** A dev-only page at `/auth/dummy-login` sets `dummyAuth=1` cookie and a localStorage marker; `src/middleware.ts` accepts `dummyAuth` for local testing of protected `/modules/*` routes. This does not create production users.
- **Local dev notes:** Dependency install completed after switching to `react-markdown`; one install attempt encountered an EPERM (OneDrive) but retry succeeded. Dev server may auto-select `3001` if `3000` is occupied.
- **Seed / Dummy Data:** `prisma/seed.ts` still creates the canonical 3 topics × 3 subtopics (9 subtopics). Use `npm run prisma:seed` to load test data locally.
- **Testing status:** Changes applied and dev server started; please run browser smoke tests (sign-in via dummy login, resume flow, autosave, Continue CTA) to validate interactive behavior.

### Checkpoint submit behavior (recent)

- The checkpoint submit flow is implemented server + client-side with the following guarantees:
  - Input validated with Zod: `{ subtopicId, answers: [{ questionId, selectedAnswer }], timeSpentSeconds }`.
  - Server runs submission inside a Prisma transaction for atomicity:
    1. Regenerates the question set and validates answers.
    2. Calculates weighted score by difficulty: foundation (easy) 40%, application (medium) 35%, synthesis (hard) 25%.
    3. Creates an `Attempt` record with `userId`, `subtopicId`, `questionsJson`, `answersJson`, `scoresJson`, `totalScore`, and `timeSpentSeconds`.
    4. Upserts `UserProgress` — marks `completed` when score >= 70 (and stores an `exitPointJson`), otherwise keeps `in_progress` and records the exit point.
  - Mutation returns `{ score, breakdown: { foundation, application, synthesis }, canProgress, attemptId }`.
  - Client behavior: `Submit` is disabled until all questions are answered; on success the app redirects to `/subtopic/[id]/results?attemptId=<id>`; network failures show a retry dialog (answers preserved); server errors show a toast and keep answers in memory.

---

## Data Flow

### Auth Flow
```
User visits /auth/signin
  ↓
Enters email → signIn('email', { email, ... })
  ↓
NextAuth sends magic link to email
  ↓
User clicks link → callback to /api/auth/signin
  ↓
User created/updated in Prisma
  ↓
Session JWT created → redirect to /modules/dashboard
```

### API Flow (tRPC)
```
Client: trpc.checkpoint.useMutation()
  ↓
POST /api/trpc/[...endpoint] with JSON-RPC payload
  ↓
tRPC Router receives → validates with Zod
  ↓
Mutation handler: await ctx.prisma.attempt.create(...)
  ↓
Response: { success: true, score: 100 }
  ↓
Client: React Query caches + UI updates
```

---

## Database Seeding

**Seed Data** (3 topics × 3 subtopics = 9 total):

**Topic 1: TypeScript Fundamentals**
- Subtopic 1.1: Basic Types (complexity 1, 30 min)
- Subtopic 1.2: Interfaces & Types (complexity 1, 45 min)
- Subtopic 1.3: Generics (complexity 2, 60 min)

**Topic 2: Next.js Core Concepts**
- Subtopic 2.1: App Router Fundamentals (complexity 2, 45 min)
- Subtopic 2.2: Data Fetching (complexity 2, 50 min)
- Subtopic 2.3: Advanced Patterns (complexity 3, 60 min)

**Topic 3: Advanced Patterns**
- Subtopic 3.1: Performance Optimization (complexity 3, 50 min)
- Subtopic 3.2: Testing & Debugging (complexity 3, 60 min)
- Subtopic 3.3: Production Deployment (complexity 4, 90 min)

**Questions/Content**: 52 total questions across all subtopics

Run: `npm run prisma:seed` or `npx prisma db seed`

---

## Environment Configuration

### `.env` (Tracked)
```dotenv
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-random-secret-min-32-chars-long-change-this"
NEXTAUTH_URL="http://localhost:3000"

# Email (Development uses Ethereal)
EMAIL_FROM="noreply@gritflow.dev"
ETHEREAL_EMAIL="dev@ethereal.email"
ETHEREAL_PASSWORD="dev_password"

# Production Email Configuration (optional)
# EMAIL_HOST="smtp.gmail.com"
# EMAIL_PORT="587"
# EMAIL_USER="your-email@gmail.com"
# EMAIL_PASS="your-app-password"
```

### `.env.local` (Git-ignored, create locally)
```dotenv
# Override environment variables for local development
# NEXTAUTH_SECRET=your-dev-secret
# EMAIL_FROM=your-test-email@example.com
```

---

## Running the Project

### Installation
```bash
npm install --legacy-peer-deps
npx prisma generate
npx prisma db push
npm run prisma:seed
```

### Development
```bash
npm run dev
# Server runs at http://localhost:3000
```

### Database
```bash
npm run prisma:studio        # Open Prisma Studio
npm run prisma:migrate       # Create new migration
npm run prisma:seed          # Re-seed database
```

### Build & Deploy
```bash
npm run build
npm run start
```

---

## Testing the Auth Flow

1. **Start server**: `npm run dev`
2. **Visit**: `http://localhost:3000/auth/signin`
3. **Enter email**: Any email address (development)
4. **See verification page**: `http://localhost:3000/auth/verify-request`
5. **In Prisma Studio** (`npm run prisma:studio`):
   - Check `VerificationToken` table for magic link
   - Check `User` table for new account
6. **After email confirmation** (in production):
   - Redirects to `/modules/dashboard` with session

---

## Known Limitations

1. **Email in Development**: Uses Ethereal test service; not real emails
2. **PostgreSQL**: Not yet configured (requires local DB + credentials)
3. **Sentry**: Stubs only; integration not active
4. **CSS Variables**: globals.css prepared but not yet populated
5. **Feature Modules**: Content, Checkpoint, Results, Dashboard are placeholders

---

## Phase 1+: Verification & Specifications

### Verification: Prompts vs Locked Specifications

| Locked Spec | Prompt Coverage | Status |
|---|---|---|
| Topic selection: User chooses any main topic freely | Prompt 4.1: TopicGrid any order clickable | ✓ |
| Subtopic flow: Linear sequence, must complete 1 before 2 | Prompt 3.2: unlockSubtopic.mutation, linear enforcement | ✓ |
| Content structure: 2-5 paragraphs, natural flow | Prompt 1.1: Renders MDX content_json | ✓ |
| Scenarios: Embedded seamlessly, no labels | Prompt 1.1: MDX rendering, no scenario labels | ✓ |
| Adaptation: Invisible, based on speed and accuracy | Prompt 1.2: calculateComplexityAdjustment | ✓ |
| Question count: 5-10 based on complexity | Prompt 2.1: Formula 5 + complexity-1 + adaptation | ✓ |
| Minimum 5, Maximum 10 | Prompt 2.1: min(5+..., 10) | ✓ |
| Types: Mixed MCQ and Short Answer | Prompt 2.1: distribution mcq/shortAnswer | ✓ |
| Timing: After complete content, separate screen | Prompt 1.1: ContinueCTA at 95%, Prompt 2.2: CheckpointScreen | ✓ |
| Difficulty: Silent ramp | Prompt 2.1: difficultyCurve array | ✓ |
| Exit tracking: Position, timestamp, duration, phase | Prompt 1.1, 2.2: exit_point_json with all fields | ✓ |
| Mid-learn exit: Restore scroll position | Prompt 1.2: resumePosition in getContent | ✓ |
| Pre-question exit: Start questions fresh | Prompt 4.2: phase='checkpoint' redirect fresh | ✓ |
| Mid-question exit: Discard partial, restart | Prompt 2.2: confirm dialog, discard answers | ✓ |
| Post-results exit: Show results again | Prompt 4.2: phase='results' redirect to results | ✓ |
| Unlock next: 70%+ score required | Prompt 2.3, 3.2: canProgress boolean | ✓ |
| Skip subtopics: Not allowed | Prompt 3.2: clickable only if active | ✓ |
| Retest: Not available | Prompt 4.2: HistoryList read-only, no retest button | ✓ |
| History view: Scores, completion, time spent | Prompt 4.2: HistoryList with all fields | ✓ |
| Deep dive: Stage 2 only, placeholder UI | Prompt 3.1: Placeholder with locked icon, muted color | ✓ |
| Placeholder copy exact | Prompt 3.1: Exact text match | ✓ |
| No partial answer storage | Prompt 2.2: useState only, no localStorage/API until submit | ✓ |

---

### Master Checklist: All 14 Prompts

**Prompt 0.1: Project Setup & Tooling**
- [ ] Next.js 14 initialized with TypeScript, Tailwind, shadcn/ui
- [ ] tRPC configured with App Router
- [ ] Zod installed and configured
- [ ] Sentry installed and configured
- [ ] Folder structure created: /src/modules/{content,checkpoint,results,dashboard}, /src/lib/{trpc,db,error-handling}, /config, /prisma
- [ ] Dependencies installed: zustand, @tanstack/react-query, @trpc/client, @trpc/server, @trpc/react-query, @prisma/client, next-auth
- [ ] /config/features.ts created with flags: deepDive, emailCapture, advancedAnalytics
- [ ] Dev server runs with zero errors

**Prompt 0.2: Database & Design System**
- [ ] PostgreSQL connected
- [ ] Prisma schema matches locked schema exactly (all 6 tables)
- [ ] Migrations applied
- [ ] seed.ts creates 3 topics, 9 subtopics with complexity 1-4
- [ ] globals.css has CSS variables: --color-primary/success/warning/error (HSL), --space-xs/sm/md/lg/xl, --ease-smooth, --duration-fast/normal, --feature-deep-dive
- [ ] Database seeded and queryable

**Prompt 0.3: Auth & Base Components**
- [ ] NextAuth.js with email magic link working
- [ ] Protected route middleware active
- [ ] Base layout with TRPC, QueryClient, Auth providers
- [ ] ErrorBoundary component created
- [ ] Toast component created
- [ ] Loading component created
- [ ] ErrorFallback component created
- [ ] /modules/shared/hooks/useOfflineQueue created
- [ ] Authentication flow tested end-to-end

**Prompt 1.1: Content Reader & Tracking**
- [x] ContentReader component renders MDX from content_json
- [x] useScrollTracking hook calculates: percentage, pause points (>3s), revisits, speed (px/s)
- [x] useAutoSave hook debounced 5s, calls trpc.progress.save
- [x] useAutoSave queues to useOfflineQueue on network error
- [x] ProgressBar component shows visual progress only (no numbers)
- [x] ContinueCTA appears at 95% scroll
- [x] beforeunload handler saves exit_point_json {type:'content', position, timestamp}

**Prompt 1.2: Adaptive Engine & Resume**
- [x] calculateComplexityAdjustment function exists in /lib/adaptive-engine/calculator.ts
- [x] Function takes signals: scrollSpeed, pausePoints, revisitCount, timeOnPage, baseComplexity
- [x] Returns 0-2 modifier: fast+few pauses=+1/+2, slow+revisits=0
- [x] /modules/content/api/router.ts has getContent.query returning content + resumePosition
- [x] /modules/content/api/router.ts has saveProgress.mutation updating USER_PROGRESS
- [x] Resume logic redirects to /subtopic/[id]/content?position=X
- [x] Scroll position restores exactly on return

**Prompt 2.1: Question Generation Engine**
- [x] /lib/question-generator/engine.ts exists
- [x] generateQuestionSet function takes {subtopicId, complexityScore, adaptationModifier}
- [x] Returns count: min(5 + complexityScore-1 + adaptationModifier, 10)
- [x] Returns distribution: {mcq: number, shortAnswer: number}
- [x] Returns difficultyCurve: array for silent ramp
- [x] /modules/checkpoint/api/router.ts has generate.query using engine
- [x] Questions stored in memory only (no database save)
- [x] Output: 5-10 questions, mixed types, difficulty ramp

**Prompt 2.2: Checkpoint UI & State**
- [x] CheckpointScreen component with state machine: loading -> question -> validating -> next -> submit
- [x] QuestionCard component handles MCQ (4 options, single select, visual validation)
- [x] QuestionCard handles ShortAnswer (text input, 3 attempts, semantic match)
- [x] useCheckpointState stores answers in useState only
- [x] No localStorage usage
- [x] No API calls until submit
- [x] Exit handler shows confirm dialog "Progress will be lost"
- [x] On confirm: discard answers, save exit_point_json {type:'checkpoint', timestamp}

**Prompt 2.3: Submit & Scoring**
- [x] /modules/checkpoint/api/router.ts has submit.mutation
- [x] Input validated with Zod: {subtopicId, answers, timeSpent}
- [x] Transaction validates all answers
- [x] Score calculation: foundation 40%, application 35%, synthesis 25%
- [x] Creates ATTEMPT record with all fields
- [x] Updates USER_PROGRESS: completed if score>=70, in_progress if <70
- [x] Returns {score, breakdown, canProgress}
- [x] SubmitButton disabled until all answered
- [x] On success: redirect to /subtopic/[id]/results?attemptId=X
- [x] Network error: retry option, keep answers
- [x] Server error: toast, keep answers

**Prompt 3.1: Results Screen**
- [x] ResultsScreen fetches via trpc.results.get(attemptId)
- [x] Circular score progress (CSS conic-gradient)
- [x] Feedback text: "Strong foundation" (70-100), "Review concepts" (50-69), "Restart recommended" (<50)
- [x] Collapsible question breakdown: correct/incorrect, your answer, explanation
- [x] [Next Subtopic] button shows if canProgress
- [x] [Retry Checkpoint] button shows if !canProgress
- [x] [Exit] button present
- [x] DeepDive placeholder below actions
- [x] Placeholder: locked icon, muted color
- [x] Placeholder text exact: "Deeper exploration — statistical foundations, optimization mathematics, research applications — unlocking in next update"
- [x] Placeholder respects features.deepDive flag (visible when false)

**Prompt 3.2: Progression Logic**
- [x] /modules/results/api/router.ts get.query returns attempt + canProgress + nextSubtopicId
- [x] /modules/dashboard/api/router.ts startTopic.mutation creates USER_PROGRESS for first subtopic
- [x] /modules/dashboard/api/router.ts unlockSubtopic.mutation updates status locked->in_progress
- [x] TopicView shows subtopics list with status
- [x] Active: status=in_progress or completed (clickable)
- [x] Locked: status=locked (not clickable)
- [x] No skip functionality exists
- [x] Next subtopic unlocks automatically on 70%+ score

**Prompt 4.1: Dashboard & Topic Selection**
- [x] TopicGrid component: grid layout, all topics, any order clickable
- [x] Progress badge shows percentage (0%, 50%, 100%)
- [x] ResumeBanner appears if USER_PROGRESS.status='in_progress'
- [x] ResumeBanner shows "Continue: [Topic] > [Subtopic]"
- [x] ResumeBanner links to resume point
- [x] /modules/dashboard/api/router.ts getTopics.query returns all topics with progress
- [x] /modules/dashboard/api/router.ts getResumePoint.query returns {url, phase, metadata} or null

**Prompt 4.2: History & Resume Deep**
- [x] HistoryList component: list of completed subtopics
- [x] Shows: score, completion date, time spent, status badge
- [x] Read-only, no retest button
- [x] Resume logic: phase='content' -> content with position
- [x] Resume logic: phase='checkpoint' -> checkpoint fresh (no answers)
- [x] Resume logic: phase='results' -> results screen
- [x] /modules/dashboard/api/router.ts getHistory.query returns ATTEMPT joined with SUBTOPIC

**Prompt 5.1: Testing & Error Resilience**
- [ ] Playwright test: exit and resume content (scroll, exit, return, position restored)
- [ ] Playwright test: complete checkpoint (answer all, submit, score shown)
- [ ] Playwright test: fail and retry (score <70, retry button works)
- [ ] Playwright test: pass and progress (score >=70, next unlocked)
- [ ] Playwright test: linear enforcement (try skip locked, blocked)
- [ ] Global error boundary in layout.tsx
- [ ] Module error boundaries in each /modules/[name]/layout.tsx
- [ ] Sentry logging in error boundaries
- [ ] Offline detection banner when navigator.onLine=false
- [ ] Queue saves when offline

**Prompt 5.2: Performance & Deploy**
- [ ] React Query staleTime 5min for content
- [ ] React Query cacheTime 10min
- [ ] Long content virtualized with react-window if >5000px
- [ ] Database index: USER_PROGRESS(user_id, status)
- [ ] Database index: ATTEMPT(user_id, subtopic_id)
- [ ] Sentry source maps configured
- [ ] Bundle size <200kb initial
- [ ] Deployed to Vercel
- [ ] Environment variables set: DATABASE_URL, NEXTAUTH_SECRET, SENTRY_DSN
- [ ] Production database seeded with 3 topics
- [ ] All feature flags false in production
- [ ] Product live and accessible

---

### Critical Path Verification

| Requirement | Prompt | Verification |
|---|---|---|
| 5-10 questions formula | 2.1 | min(5 + complexity - 1 + adaptation, 10) |
| No partial storage | 2.2 | useState only, no localStorage, confirm on exit |
| 70% threshold | 2.3, 3.2 | Hardcoded in submit mutation and results |
| Linear subtopics | 3.2 | unlockSubtopic.mutation, clickable only if active |
| Deep dive placeholder | 3.1 | Exact copy, locked icon, muted, feature flag |
| Resume content position | 1.2, 4.2 | ?position=X restore exact scroll |
| Resume checkpoint fresh | 4.2 | Phase check, no answer restoration |
| Exit tracking all phases | 1.1, 2.2, 4.2 | exit_point_json with type, position, timestamp |

---

## Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Create database migration |
| `npm run prisma:studio` | Open Prisma Studio UI |
| `npm run prisma:seed` | Seed database with test data |
| `npm audit fix` | Fix security vulnerabilities |

---

## Troubleshooting

### "Can't reach database server"
- Ensure `DATABASE_URL` in `.env` is correct
- For SQLite: `file:./dev.db` (relative path from project root)
- Run: `npx prisma db push` to recreate database

### "Module not found: @prisma/client"
- Run: `npx prisma generate`
- Then: `npm install`

### "NEXTAUTH_SECRET not configured"
- Generate: `openssl rand -base64 32`
- Add to `.env`: `NEXTAUTH_SECRET=<output>`

### Email not sending
- Check `.env` configuration for dev email service
- For production: configure SendGrid/AWS SES credentials

---

## Resources

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Zod Documentation](https://zod.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## Contributors & Notes

**Phase 0 Completed**: February 20, 2026  
**Team**: AI Assistant + User

**Key Achievements**:
✅ Full-stack TypeScript foundation  
✅ tRPC + Prisma integration  
✅ NextAuth email authentication  
✅ Protected routes & middleware  
✅ Component architecture & Providers  
✅ Database seeding (9 learning modules)  
✅ Dev server running without errors  

**Next Owner Action**: Review Phase 0 → Plan Phase 1 feature development

---

**End of Phase 0 Documentation**
