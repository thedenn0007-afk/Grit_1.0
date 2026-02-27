# Grit Flow - Complete Product Roadmap & Specifications

**Project**: Grit Flow - Adaptive Learning Platform  
**Date**: February 20, 2026  
**Status**: Phase 0 ✅ Complete | Phase 1 🚀 Ready to Start  
**Document Version**: 1.0

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Vision](#product-vision)
3. [Phase 0: Foundation](#phase-0-foundation) ✅
4. [Phase 1: MVP Core](#phase-1-mvp-core) 🎯 **NEXT**
5. [Phase 2: Deep Dive & Advanced](#phase-2-deep-dive--advanced)
6. [Locked Specifications](#locked-specifications)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)
9. [Technology Stack](#technology-stack)
10. [How to Run](#how-to-run)
11. [All Phase Prompts (0-5)](#all-phase-prompts)

---

## Executive Summary

**Grit Flow** is an adaptive learning platform that transforms any syllabus into personalized learning paths with real-time difficulty adjustment. The user uploads content, the system breaks it into topics/subtopics, students learn and test, and the platform invisibly adapts questions based on performance.

### Key Achievements

- ✅ **Phase 0**: Full TypeScript/Next.js foundation, PostgreSQL-ready, NextAuth authentication, tRPC API layer
- ✅ **Database**: 6 tables + NextAuth models, seedable with 3 topics, 9 subtopics
- ✅ **Infrastructure**: Error boundaries, offline queue, Sentry stubs, feature flags
- 🎯 **Phase 1**: Content reader, question generation, checkpoint system, results screen
- 📍 **Phase 2**: Deep dive recursive layers, branch exploration, advanced adaptation

---

## Product Vision

### Core Concept

Adaptive learning platform that transforms any syllabus into personalized learning paths with real-time difficulty adjustment.

### Key Principles

- **Start simple, expand naturally**: MVP covers linear flow; branches come later
- **User behavior drives adaptation silently**: No "difficulty levels" shown to user
- **No explicit difficulty labels**: Ramp adjusts invisibly based on scroll speed/accuracy
- **Seamless flow between concepts**: Content → Questions → Results → Next topic

### User Flow

```
Upload/Paste Content
    ↓
AI Analysis (Extract topics, complexity)
    ↓
Topic Breakdown (3-5 main topics, 2-3 subtopics each)
    ↓
LEARN (Scroll content, bookmark, exit anytime)
    ↓
TEST (5-10 questions, mixed MCQ/SA)
    ↓
RESULTS (Score, explanations, feedback)
    ↓
ADAPT (Adjust next question difficulty)
    ↓
PROGRESS (Unlock next subtopic if 70%+)
```

---

## Phase 0: Foundation

### Status: ✅ Complete

**Deliverables:**
- [x] Next.js 14 + TypeScript + Tailwind
- [x] tRPC API layer with Zod validation
- [x] NextAuth email magic link authentication
- [x] Prisma ORM (SQLite dev, PostgreSQL ready)
- [x] Database schema (6 tables + NextAuth models)
- [x] Protected route middleware
- [x] Error boundaries, Toast, Loading components
- [x] Offline queue hook for resilience
- [x] Feature flags (deepDive, emailCapture, advancedAnalytics)
- [x] Development server running at localhost:3000

### Prompts Completed: 0.1, 0.2, 0.3

**See**: PHASE_0.md for detailed infrastructure breakdown

---

## Phase 1: MVP Core

### Status: 🎯 **NEXT TO START**

**Duration**: 4 weeks (Week 1-4)

### Week 1: Content Flow & Exit Tracking

**Deliverable**: Content reader with scroll tracking and position saving

**Key Components**:
- `ContentReader`: Renders MDX content from `content_json`
- `useScrollTracking`: Calculates scroll %, pause points, revisits, speed
- `useAutoSave`: Debounced 5s, saves position to DB, queues offline
- `ProgressBar`: Visual progress indicator (no numbers)
- `ContinueCTA`: Appears at 95% scroll
- Exit tracking: Saves `{type:'content', position, timestamp, phase}`

**Prompts**: 1.1, 1.2

### Week 2: Question Generation & Checkpoint

**Deliverable**: Dynamic question system with scoring

**Key Components**:
- `QuestionGenerationEngine`: Formula `min(5 + complexity - 1 + adaptation, 10)`
- `CheckpointScreen`: State machine (loading → question → validating → next → submit)
- `QuestionCard`: MCQ (4 options) and ShortAnswer (3 attempts, semantic match)
- `useCheckpointState`: Client-side React state, no localStorage
- Submit logic: Validate all, calculate score, create ATTEMPT, update USER_PROGRESS

**Scoring Formula**: Foundation 40% + Application 35% + Synthesis 25%

**Prompts**: 2.1, 2.2, 2.3

### Week 3: Results & Progression

**Deliverable**: Results screen, history view, linear progression

**Key Components**:
- `ResultsScreen`: Circular score, feedback text, collapsible breakdown
- `HistoryList`: Read-only, scores + completion dates
- Progression logic: Unlock next subtopic if score ≥ 70%
- Dashboard: Free topic selection, linear subtopic order
- Resume logic: Content (restore position) → Checkpoint (fresh) → Results (show again)

**Prompts**: 3.1, 3.2, 4.1, 4.2

### Week 4: Polish & Analytics

**Deliverable**: End-to-end testing, performance, analytics baseline

**Key Components**:
- Playwright e2e tests (exit/resume, checkpoint, progression, linear enforcement)
- Error boundaries per module
- Sentry integration active
- Offline banner when navigator.onLine = false
- Bundle optimization

**Prompts**: 5.1, 5.2

### Phase 1 Locked Features

✅ **Upload**: PDF, DOC, DOCX, TXT, paste text  
✅ **AI Analysis**: Extract topics, subtopics, complexity (1-4)  
✅ **Content Structure**: 2-5 natural paragraphs  
✅ **Questions**: 5-10 mixed MCQ/shortAnswer  
✅ **No Partial Storage**: Answers discarded on exit  
✅ **Exit Tracking**: Position, timestamp, phase, duration  
✅ **Progression**: 70% threshold, no skip, no retest  
✅ **History**: View only, read-only  
✅ **Deep Dive**: Placeholder UI only (Stage 2)  

---

## Phase 2: Deep Dive & Advanced

### Status: 📍 Planned (Post-MVP)

### Deep Dive Specification

**Trigger**: User completes core subtopic with 80%+ score → [Explore More] button appears

**Structure**:
```
Subtopic
├── Core Content (2-5 paragraphs)
├── Core Questions (5-6 mixed MCQ/SA)
└── [Explore More] → DEEP DIVE LAYER
    │
    ├── Layer 1: Foundations
    │   ├── Content → Questions (5-6)
    │   └── BRANCHES (2-3 seamless choices)
    │       ├── Branch A: Mathematical Deep Dive
    │       │   └── Content → Questions → [Explore layer 2?]
    │       └── Branch B: Practical Application
    │           └── Content → Questions → [Explore layer 2?]
    │
    └── Layer 2: Research Frontiers
        └── [Same recursive structure]
```

### Features Added

- Recursive layers (infinite depth, configurable)
- Multiple branches per layer (2-3 seamless options)
- Layer-specific exit tracking (where user stopped)
- Deepest reached tracking (layer N, branch X)
- Time spent per layer/branch
- Spaced repetition (weak areas resurface)
- Advanced adaptation: Speed + Accuracy + Consistency (3-axis model)

### Doubt Button (Added Week 4, Phase 1)

**Universal Placement**: Floating `[?]` button, bottom-right, all pages

**On Tap**:
- Suggested prompts based on current context (content/checkpoint/results)
- User types question or selects suggestion
- AI generates context-aware response
- Response streamed 1-2 sentences
- User feedback: 👍 / 👎

**Suggested Prompts By Context**:
- **Reading Content**: "Explain differently", "Simpler version", "Real-world example"
- **Stuck on Question**: "Why is this the answer?", "Hint without revealing", "Common mistake"
- **Viewing Results**: "Why was I wrong?", "Similar practice question", "Deep dive into this"

**Integration**:
- Logs all doubts to `DOUBT_LOG` table
- Feed into adaptation engine (detect struggles)
- Surface in history view for pattern recognition

---

## Locked Specifications

### Topic Selection & Flow

| Requirement | Spec |
|---|---|
| **Topic Selection** | User chooses any main topic freely, any order |
| **Subtopic Flow** | Linear sequence, complete 1 before 2 |
| **Content Structure** | 2-5 paragraphs, natural conversational flow |
| **Scenarios** | Embedded seamlessly, no labels |
| **Adaptation** | Invisible, based on scroll speed & accuracy |

### Question System

| Requirement | Spec |
|---|---|
| **Count** | 5-10 based on complexity |
| **Formula** | `min(5 + complexity(0-3) + adaptation(0-2), 10)` |
| **Types** | Mixed MCQ (4 options, single select) + ShortAnswer (text, semantic) |
| **Timing** | After complete content, separate screen |
| **Difficulty** | Silent ramp (foundation → application → synthesis) |
| **No Storage** | Answers in RAM only, discarded on exit, confirmed |

### Exit & Resume

| Exit Point | Tracked Data | User Sees |
|---|---|---|
| **Mid-Learn** | Content section, scroll position | "[Resume here]" |
| **Pre-Questions** | Learn complete, not started test | "[Take checkpoint]" |
| **Mid-Questions** | Q2 of 6 completed | "[Resume question 3]" |
| **Post-Results** | Score viewed, not continued | "[See results]" |
| **All Exits** | Timestamp, duration, position, phase inferred | Resume link in dashboard |

### Progression & History

| Requirement | Spec |
|---|---|
| **Unlock Next** | 70%+ score required |
| **Skip** | Not allowed (linear enforcement) |
| **Retest** | Not available (view history read-only) |
| **History View** | Scores, completion status, time spent |
| **Deep Dive** | Stage 2 only — placeholder in Stage 1 |

### Deep Dive Placeholder (Stage 1)

| Element | Spec |
|---|---|
| **Location** | Post-results, below "[Next Subtopic]" button |
| **Visual** | 🔒 Locked icon, muted color |
| **Copy** | "Deeper exploration — statistical foundations, optimization mathematics, research applications — unlocking in next update" |
| **Action** | None (or email capture for notify) |
| **Feature Flag** | `features.deepDive` (visible if false, hidden if true) |

---

## Database Schema

### Core Tables

```sql
-- Users
USER (
  id                String    @id @default(cuid())
  email             String    @unique
  emailVerified     DateTime?
  name              String?
  image             String?
  createdAt         DateTime  @default(now())
  
  -- Relations
  accounts          Account[]    -- NextAuth
  sessions          Session[]    -- NextAuth
  progress          UserProgress[]
  attempts          Attempt[]
  doubts            DoubtLog[]
)

-- Learning Structure
TOPIC (
  id              String     @id @default(cuid())
  title           String
  description     String
  orderIndex      Int
  status          String     @default("available")  -- locked|available|completed
  
  -- Relations
  subtopics       Subtopic[]
)

SUBTOPIC (
  id              String   @id @default(cuid())
  topicId         String   @map("topic_id")
  title           String
  complexityScore Int      @map("complexity_score")  -- 1-4
  contentJson     String   @map("content_json")      -- MDX paragraphs
  estimatedMinutes Int    @map("estimated_minutes")
  status          String   @default("locked")
  
  -- Relations
  topic           Topic    @relation(fields: [topicId], references: [id])
  progress        UserProgress[]
  attempts        Attempt[]
  doubts          DoubtLog[]
  deepLayers      DeepLayer[]  -- Phase 2
)

-- Progress Tracking
USER_PROGRESS (
  userId          String
  subtopicId      String
  status          String     -- not_started|in_progress|completed
  currentPhase    String     -- learn|checkpoint|results
  exitPointJson   String?    -- {type, position, timestamp, duration}
  coreMastery     Float      @default(0.0)  -- 0-100
  completedAt     DateTime?
  updatedAt       DateTime   @updatedAt
  
  -- Relations
  user            User      @relation(fields: [userId], references: [id])
  subtopic        Subtopic  @relation(fields: [subtopicId], references: [id])
  
  @@id([userId, subtopicId])
)

-- Assessments (Complete Only, No Partial)
ATTEMPT (
  id              String   @id @default(cuid())
  userId          String
  subtopicId      String
  questionsJson   String   -- Full question set
  answersJson     String   -- User's answers
  scoresJson      String   -- Individual scores
  totalScore      Int      -- 0-100
  timeSpentSeconds Int
  createdAt       DateTime @default(now())
  
  -- Relations
  user            User     @relation(fields: [userId], references: [id])
  subtopic        Subtopic @relation(fields: [subtopicId], references: [id])
)

-- Help System (Phase 1, Week 4)
DOUBT_LOG (
  id              String   @id @default(cuid())
  userId          String
  subtopicId      String
  phase           String   -- learn|checkpoint|results
  contentPosition Int?     -- Paragraph or question number
  questionAsked   String   -- User's question
  responseGiven   String   -- AI response
  resolved        Boolean  @default(false)
  helpful         Int?     -- -1 (no), 0 (neutral), 1 (yes)
  createdAt       DateTime @default(now())
  
  -- Relations
  user            User     @relation(fields: [userId], references: [id])
  subtopic        Subtopic @relation(fields: [subtopicId], references: [id])
)

-- Phase 2 (Deferred, Empty Tables)
DEEP_LAYER (
  id              String   @id @default(cuid())
  subtopicId      String
  layerNumber     Int      -- 1, 2, 3...
  parentLayerId   String?  -- Null for layer 1
  title           String
  content         String   -- MDX
  difficulty      Int      -- 3-5
  
  -- Relations
  subtopic        Subtopic  @relation(fields: [subtopicId], references: [id])
  branches        DeepBranch[]
)

DEEP_BRANCH (
  id              String   @id @default(cuid())
  layerId         String
  branchCode      String   -- A, B, C (internal)
  title           String
  content         String   -- MDX
  orderIndex      Int
  
  -- Relations
  layer           DeepLayer  @relation(fields: [layerId], references: [id])
  progress        DeepProgress[]
)

DEEP_PROGRESS (
  userId          String
  deepBranchId    String
  status          String     -- not_started|in_progress|completed
  mastery         Float      -- 0-100
  exitPoint       String?    -- {layer, branch, phase}
  attemptCount    Int
  
  -- Relations
  user            User       @relation(fields: [userId], references: [id])
  branch          DeepBranch @relation(fields: [deepBranchId], references: [id])
  
  @@id([userId, deepBranchId])
)

-- NextAuth (Automatic)
ACCOUNT { ... }
SESSION { ... }
VERIFICATION_TOKEN { ... }
```

---

## API Endpoints

### Topics & Subtopics

```
GET    /api/trpc/topics.list
       Returns all topics with progress

POST   /api/trpc/topics.start
       Input: { topicId }
       Creates USER_PROGRESS for first subtopic

GET    /api/trpc/subtopics.getContent
       Input: { subtopicId }
       Returns content + resumePosition

POST   /api/trpc/subtopics.saveProgress
       Input: { subtopicId, position, phase }
       Updates USER_PROGRESS
```

### Content & Learning

```
POST   /api/trpc/content.trackScroll
       Input: { subtopicId, scrollPercent, pausePoints }
       Updates scroll tracking signals

POST   /api/trpc/content.exit
       Input: { subtopicId, exitType, position }
       Saves exit_point_json
```

### Checkpoint & Assessment

```
GET    /api/trpc/checkpoint.generate
       Input: { subtopicId }
       Returns 5-10 questions (fresh, no answers)

POST   /api/trpc/checkpoint.submit
       Input: { subtopicId, answers, timeSpent }
       Validates, scores, creates ATTEMPT, returns score + canProgress

GET    /api/trpc/checkpoint.results
       Input: { attemptId }
       Returns attempt + feedback + nextSubtopicId
```

### History & Resume

```
GET    /api/trpc/history.getAttempts
       Returns all ATTEMPT records for user

GET    /api/trpc/resume.getPoint
       Returns {url, phase} or null

POST   /api/trpc/resume.restore
       Input: { attemptId or subtopicId }
       Redirects to resume point with position
```

### Help System

```
POST   /api/trpc/doubt.ask
       Input: { subtopicId, question, context }
       Returns AI response

POST   /api/trpc/doubt.feedback
       Input: { doubtLogId, helpful: -1|0|1 }
       Records feedback
```

---

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router, SSR)
- **Language**: TypeScript 5.6
- **UI**: React 18.3, Tailwind CSS 3.4, shadcn/ui
- **State**: Zustand, React Query (4.36)
- **API**: tRPC 10, Zod validation
- **Async**: useCallback, useEffect, custom hooks

### Backend
- **Runtime**: Node.js (Next.js serverless)
- **API**: tRPC, JSON-RPC 2.0
- **Database**: PostgreSQL (production) / SQLite (dev)
- **ORM**: Prisma 5.21
- **Auth**: NextAuth.js 4.24 (email magic link)

### Infrastructure
- **Error Tracking**: Sentry 8.34
- **Email**: Nodemailer 6.9 (dev), SendGrid/AWS SES (prod)
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions (planned)

### Dependencies

**Production** (18 packages):
```json
next@14.2.15
react@18.3.1, react-dom@18.3.1
@trpc/server@10.45.2
@trpc/client@10.45.2
@trpc/react-query@10.45.2
@tanstack/react-query@4.36.1
superjson@2.2.1
zod@3.23.8
zustand@5.0.0
@prisma/client@5.21.1
@next-auth/prisma-adapter@1.0.7
next-auth@4.24.8
@sentry/nextjs@8.34.0
nodemailer@6.9.7
```

**Development** (13 packages):
```json
typescript@5.6.3
tailwindcss@3.4.14
postcss@8.4.47
autoprefixer@10.4.20
prisma@5.21.1
eslint@8.57.1, eslint-config-next@14.2.15
@types/node, @types/react, @types/react-dom
@types/nodemailer@6.4.14
ts-node@10.9.1
tsx@3.12.7
```

---

## How to Run

### Prerequisites

- Node.js 18+ (LTS)
- npm 9+
- PostgreSQL 14+ (production) or SQLite (dev)

### Installation

```bash
# Clone repository
cd "c:/Users/user/OneDrive/Desktop/Tech/Grit Flow"

# Install dependencies
npm install --legacy-peer-deps

# Generate Prisma client
npx prisma generate

# Create/sync database
npx prisma db push

# Seed with test data (3 topics, 9 subtopics, 52 questions)
npx prisma db seed
```

### Environment Setup

Create `.env.local`:

```dotenv
# Database
DATABASE_URL="file:./dev.db"  # SQLite for dev
# DATABASE_URL="postgresql://user:pass@localhost:5432/gritflow?schema=public"

# NextAuth
NEXTAUTH_SECRET="<generate: openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"

# Email (Development)
EMAIL_FROM="noreply@gritflow.dev"
ETHEREAL_EMAIL="dev@ethereal.email"
ETHEREAL_PASSWORD="dev_pass"

# Optional: Production Email
# EMAIL_HOST="smtp.sendgrid.net"
# EMAIL_USER="apikey"
# EMAIL_PASS="<SendGrid API Key>"

# Optional: Sentry
# NEXT_PUBLIC_SENTRY_DSN="<Your Sentry DSN>"
```

### Development

```bash
# Start dev server (localhost:3000)
npm run dev

# Open in browser
# http://localhost:3000
```

### Database Management

```bash
# Open Prisma Studio (visual DB editor)
npm run prisma:studio

# Create migration (if schema changes)
npm run prisma:migrate

# Re-seed database
npm run prisma:seed
```

### Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm run start

# Deploy to Vercel
vercel deploy --prod
```

### Testing

```bash
# Run E2E tests (Playwright)
npx playwright test

# Run specific test
npx playwright test critical-flows.spec.ts
```

### Monitoring

```bash
# Sentry errors: https://sentry.io/organizations/[your-org]
# Analytics: Dashboard at /admin/analytics (Phase 2)
# Database: Prisma Studio, SQL queries
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     NEXT.JS 14 APP                      │
│                    (App Router, SSR)                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐  ┌──────────────────┐             │
│  │ /auth/signin     │  │ /modules/        │             │
│  │ /auth/error      │  │  ├─ dashboard    │             │
│  │ /auth/verify     │  │  ├─ content      │ (Protected) │
│  │                  │  │  ├─ checkpoint   │             │
│  │ (Public)         │  │  ├─ results      │             │
│  └──────────────────┘  └──────────────────┘             │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                  MIDDLEWARE LAYER                       │
│  NextAuth protected routes, session validation          │
├─────────────────────────────────────────────────────────┤
│                    PROVIDERS STACK                      │
│  SessionProvider (NextAuth)                             │
│  → ToastProvider (Notifications)                        │
│  → tRPC Provider (API Client)                           │
│  → QueryClientProvider (React Query)                    │
├─────────────────────────────────────────────────────────┤
│                   tRPC API LAYER                        │
│  /api/trpc/[trpc]  (JSON-RPC 2.0)                       │
│                                                         │
│  ├─ /topics.*              (List, Start)                │
│  ├─ /subtopics.*           (Content, Save)              │
│  ├─ /checkpoint.*          (Generate, Submit)           │
│  ├─ /results.*             (Fetch)                      │
│  ├─ /history.*             (Attempts, Resume)           │
│  ├─ /doubt.*               (Ask, Feedback)              │
│  └─ /adapt.*               (Complexity Adjustment)      │
├─────────────────────────────────────────────────────────┤
│ DATABASE LAYER (Prisma ORM → PostgreSQL / SQLite)     │
│                                                         │
│ USER → USER_PROGRESS ← SUBTOPIC                         │
│            ↓                                            │
│         ATTEMPT                DEEP_PROGRESS (Phase 2)  │
│            ↓                                            │
│      (Score, Feedback)                                  │
│                                                         │
│ Supporting: TOPIC, DOUBT_LOG, Account, Session         │
└─────────────────────────────────────────────────────────┘

CLIENT FLOW:
Dashboard → Topic → Subtopic → Content → Progress Bar → [Continue]
                                           ↓
                                  Checkpoint (5-10 Qs)
                                           ↓
                                  Results (Score, Feedback)
                                           ↓
                        [Next Subtopic] or [Retry] or [Exit]
```

---

## All Phase Prompts

### Phase 0: Foundation (3 Prompts)

#### Prompt 0.1: Project Setup & Tooling

Initialize Next.js 14 project with TypeScript, Tailwind, shadcn/ui. Configure tRPC with App Router, Zod for validation. Setup Sentry for error tracking. Create folder structure: `/src/modules/{content,checkpoint,results,dashboard}`, `/src/lib/{trpc,db,error-handling}`, `/config`, `/prisma`. Install dependencies: zustand, @tanstack/react-query, @trpc/client, @trpc/server, @trpc/react-query, @prisma/client, next-auth. Create `/config/features.ts` with feature flag object: `deepDive`, `emailCapture`, `advancedAnalytics` as boolean flags. Output: working dev server, no errors.

#### Prompt 0.2: Database & Design System

Setup PostgreSQL with Prisma. Schema: USER(id,email,created_at), TOPIC(id,title,description,order_index,status), SUBTOPIC(id,topic_id,title,complexity_score,content_json,estimated_minutes,status), USER_PROGRESS(user_id,subtopic_id,status,current_phase,exit_point_json,core_mastery,completed_at,updated_at), ATTEMPT(id,user_id,subtopic_id,questions_json,answers_json,scores_json,total_score,time_spent_seconds,created_at). Create `seed.ts` with 3 topics, 9 subtopics (complexity 1-4). In `globals.css`, define CSS variables: `--color-primary/success/warning/error` with HSL values, `--space-xs/sm/md/lg/xl`, `--ease-smooth`, `--duration-fast/normal`, `--feature-deep-dive`. Output: migrated database with seed data, design system variables applied to html element.

#### Prompt 0.3: Auth & Base Components

Implement NextAuth.js with email magic link provider. Create protected route middleware. Build base layout with providers (TRPC, QueryClient, Auth). Create ErrorBoundary component wrapping each module. Create Toast component for recoverable errors. Create Loading and ErrorFallback components. Create `/modules/shared/hooks/useOfflineQueue` for failed requests. Output: authenticated routes working, error boundaries active, toast system ready.

---

### Phase 1: MVP Core (6 Prompts)

#### Prompt 1.1: Content Reader & Tracking

Build `/modules/content/components/ContentReader`: scrollable container, renders MDX content from SUBTOPIC.content_json. Hook `useScrollTracking`: calculates scroll percentage, detects pause points (>3s), revisits, speed (px/s). Hook `useAutoSave`: debounced 5s, calls `trpc.progress.save` with `{subtopicId, position, timestamp}`, on error queues to `useOfflineQueue`. Component `ProgressBar`: visual progress only, no numbers. Component `ContinueCTA`: appears at 95% scroll. Exit handler: `beforeunload` saves `exit_point_json` with `{type:'content', position, timestamp, duration}`. Output: smooth scrolling, position restores on reload, auto-save working, exit tracking active.

**Status**: 🚀 Ready to build (Week 1)

#### Prompt 1.2: Adaptive Engine & Resume

Build `/lib/adaptive-engine/calculator.ts`: function `calculateComplexityAdjustment(signals: {scrollSpeed, pausePoints, revisitCount, timeOnPage}, baseComplexity: number)` returns 0-2 modifier. Fast + few pauses = +1/+2, slow + revisits = 0. Build `/modules/content/api/router.ts`: `getContent.query` fetches subtopic and USER_PROGRESS, returns content + resumePosition. `saveProgress.mutation` updates USER_PROGRESS. Build resume logic: dashboard checks USER_PROGRESS.status='in_progress', redirects to `/subtopic/[id]/content?position=X`. Output: adaptation signals calculated, resume restores exact scroll position, progress saved to database.

**Status**: 🚀 Ready to build (Week 1)

#### Prompt 2.1: Question Generation Engine

Build `/lib/question-generator/engine.ts`: `generateQuestionSet(config: {subtopicId, complexityScore, adaptationModifier})` returns `{count: min(5 + complexityScore-1 + adaptationModifier, 10), distribution: {mcq: number, shortAnswer: number}, difficultyCurve: array}`. ComplexityScore 1-4, adaptationModifier 0-2. Types: MCQ (4 options, single select), ShortAnswer (text input, semantic matching). Build `/modules/checkpoint/api/router.ts`: `generate.query` uses engine, returns question set. Questions stored in memory only, no database save. Output: 5-10 questions generated based on formula, mixed types, difficulty ramp implicit in ordering.

**Status**: 🚀 Ready to build (Week 2)

#### Prompt 2.2: Checkpoint UI & State

Build `/modules/checkpoint/components/CheckpointScreen`: state machine (loading → question → validating → next → submit). Component `QuestionCard`: renders MCQ or ShortAnswer based on type. MCQ: selectable options, instant visual validation (no score reveal). ShortAnswer: text input, 3 attempts, semantic match (keyword presence). Hook `useCheckpointState`: stores answers in React state only (useState), no localStorage, no API calls until submit. Exit handler: confirm dialog "Progress will be lost", on confirm discard answers, save `exit_point_json {type:'checkpoint', timestamp}`. Output: answer state client-side only, exit discards, no partial persistence.

**Status**: 🚀 Ready to build (Week 2)

#### Prompt 2.3: Submit & Scoring

Build `/modules/checkpoint/api/router.ts`: `submit.mutation` input `z.object({subtopicId, answers, timeSpent})`. Transaction: validate all answers, calculate score (foundation 40%, application 35%, synthesis 25%), create ATTEMPT record, update USER_PROGRESS to completed if score≥70 else keep in_progress. Return `{score, breakdown, canProgress: score>=70}`. Component `SubmitButton`: disabled until all answered, on click calls mutation, redirects to `/subtopic/[id]/results?attemptId=X`. Error handling: network error shows retry, server error shows toast + keep answers. Output: atomic submit, all-or-nothing save, score calculated, progression determined.

**Status**: 🚀 Ready to build (Week 2)

#### Prompt 3.1: Results Screen

Build `/modules/results/components/ResultsScreen`: fetches attempt via `trpc.results.get(attemptId)`. Display: circular score progress (CSS conic-gradient), feedback text based on score ranges ("Strong foundation" 70-100, "Review concepts" 50-69, "Restart recommended" <50). Collapsible question breakdown: each question shows correct/incorrect, your answer, explanation. Actions: `[Next Subtopic]` if canProgress, `[Retry Checkpoint]` if !canProgress, `[Exit]`. DeepDive placeholder: below actions, locked icon, muted color, text "Deeper exploration — statistical foundations, optimization mathematics, research applications — unlocking in next update", respects `features.deepDive` flag (hidden if true, visible if false). Output: results display complete, progression gated, placeholder visible.

**Status**: ✅ Complete (Feb 26, 2026)

#### Prompt 3.2: Progression Logic

Build `/modules/results/api/router.ts`: `get.query` returns attempt + canProgress + nextSubtopicId (if canProgress). Build `/modules/dashboard/api/router.ts`: `startTopic.mutation` creates USER_PROGRESS for first subtopic, `unlockSubtopic.mutation` updates status from locked to in_progress (called when previous completed with 70%+). Build linear enforcement: TopicView shows subtopics list, active only if status=in_progress or completed, locked if status=locked, clickable only if active. No skip allowed. Output: 70% threshold enforced, linear progression locked, next subtopic unlocks automatically on pass.

**Status**: ✅ Complete (Feb 26, 2026)

#### Prompt 4.1: Dashboard & Topic Selection

Build `/modules/dashboard/components/TopicGrid`: grid of all TOPIC records, any order clickable, shows progress badge (0%, 50%, 100%). Build `ResumeBanner`: appears if USER_PROGRESS.status='in_progress', shows "Continue: [Topic] > [Subtopic]", links to resume point. Build `/modules/dashboard/api/router.ts`: `getTopics.query` returns all topics with progress percentage, `getResumePoint.query` returns `{url, phase, metadata}` or null. Output: dashboard with free topic choice, resume banner functional, progress visible.

**Status**: 🚀 Ready to build (Week 3)

#### Prompt 4.2: History & Resume Deep

Build `/modules/dashboard/components/HistoryList`: list of completed subtopics, shows score, completion date, time spent, status badge. Read-only, no retest button. Build resume deep logic: if phase='content', redirect to content with position; if phase='checkpoint', redirect to checkpoint fresh (no answers); if phase='results', redirect to results. Build `/modules/dashboard/api/router.ts`: `getHistory.query` returns ATTEMPT records joined with SUBTOPIC. Output: history view complete, resume handles all phases correctly, no retest possible.

**Status**: 🚀 Ready to build (Week 3)

#### Prompt 5.1: Testing & Error Resilience

Write Playwright tests in `/tests/e2e/critical-flows.spec.ts`: `test('exit and resume content')` - scroll, exit, return, position restored; `test('complete checkpoint')` - answer all, submit, score shown; `test('fail and retry')` - score <70, retry button works; `test('pass and progress')` - score >=70, next unlocked; `test('linear enforcement')` - try skip locked subtopic, blocked. Add global error boundary in layout.tsx catching unhandled errors, logging to Sentry. Add module error boundaries in each `/modules/[name]/layout.tsx`. Add offline detection: banner when navigator.onLine=false, queue saves. Output: all tests passing, errors caught and logged, offline handling active.

**Status**: 🚀 Ready to build (Week 4)

#### Prompt 5.2: Performance & Deploy

Optimize: React Query staleTime 5min for content, cacheTime 10min. Virtualize long content with react-window if >5000px. Add database indexes: USER_PROGRESS(user_id, status), ATTEMPT(user_id, subtopic_id). Configure Sentry source maps. Build production, verify bundle size <200kb initial. Deploy to Vercel, environment variables set (DATABASE_URL, NEXTAUTH_SECRET, SENTRY_DSN). Run seed in production with 3 topics. Verify all feature flags false. Output: production URL, analytics dashboard, monitoring active, product live.

**Status**: 🚀 Ready to build (Week 4)

---

## Phase 1 Build Plan (Week by Week)

### Week 1: Content Flow & Exit Tracking

**Prompts**: 1.1, 1.2

**Components**:
- ContentReader, useScrollTracking, useAutoSave, ProgressBar, ContinueCTA
- Adaptive engine calculator, resume logic
- API: getContent, saveProgress, trackScroll, exit

**Tests**: Manual scroll test, exit tracking verification

**Output**: Content reader working, position persists through reload/exit

### Week 2: Question Generation & Checkpoint System

**Prompts**: 2.1, 2.2, 2.3

**Components**:
- QuestionGenerationEngine, CheckpointScreen, QuestionCard, useCheckpointState
- Submit logic, score calculation, progression mutation
- API: generate, submit, results

**Tests**: Question count formula, checkpoint flow, scoring validation

**Output**: End-to-end checkpoint working, score calculated

### Week 3: Results & Progression

**Prompts**: 3.1, 3.2, 4.1, 4.2

**Components**:
- ResultsScreen, HistoryList, TopicGrid, ResumeBanner
- Progression logic (70% unlock), linear enforcement
- API: get (results), startTopic, unlockSubtopic, getTopics, getHistory

**Tests**: E2E flow (pass → unlock, fail → retry), linear enforcement

**Output**: Full learning loop working, progression enforced

### Week 4: Polish, Testing & Analytics

**Prompts**: 5.1, 5.2

**Components**:
- Playwright test suite (5 critical flows)
- Error boundaries per module
- Sentry integration, offline banner
- Performance optimization, bundling

**Tests**: All critical flows passing, bundle <200kb

**Output**: Production-ready MVP, deployed to Vercel

---

## Phase 2: Deep Dive & Advanced Features

### Deep Dive System

- Recursive layers (configurable 2-3 levels)
- Multiple branches per layer (2-3 options, seamless narrative)
- Layer-specific exit tracking
- Deepest reached tracking
- Spaced repetition for weak areas

### Doubt Button (Added Week 4, Phase 1)

- Floating [?] button on all pages
- Context-aware suggestions
- AI-generated responses
- Feedback loop for improvement

### Advanced Adaptation

- Speed + Accuracy + Consistency (3-axis model)
- Per-session learning curve detection
- Personalized difficulty curve

### Analytics Dashboard (Phase 2)

- User journey visualization
- Topic mastery heatmap
- Common struggle points
- Performance predictions

---

## Next Immediate Actions

### For Phase 1 Start (Week 1)

1. Create branch: `feature/phase-1-content`
2. Set up `/modules/content` folder structure
3. Implement `ContentReader` component
4. Build `useScrollTracking` hook
5. Create `calculator.ts` for adaptive engine
6. Write API route: `getContent.query`
7. Test with Prisma Studio (verify seed data)

### Environment Check

```bash
# Verify Phase 0 setup
npm run dev          # Should run without errors
npm run prisma:studio  # Should open DB with 9 subtopics
curl http://localhost:3000  # Should return home page
```

---

## Key Links & Resources

- [Next.js 14 Docs](https://nextjs.org/docs)
- [tRPC Docs](https://trpc.io/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth Docs](https://next-auth.js.org)
- [Zod Docs](https://zod.dev)
- [Tailwind Docs](https://tailwindcss.com/docs)

---

## Document History

| Date | Version | Changes |
|---|---|---|
| Feb 20, 2026 | 1.0 | Phase 0 complete, Phase 1 plan finalized, all specs locked |

**Document Owner**: Product Team  
**Last Updated**: February 20, 2026  
**Next Review**: After Phase 1 kickoff

---

**End of Product Roadmap Document**
