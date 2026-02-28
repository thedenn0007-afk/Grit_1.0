# Phase 1: Quick Start Guide

**Status**: 🎯 Ready to build  
**Duration**: 4 weeks (Week 1-4)  
**Starting Date**: February 20, 2026  

---

## What You're Building

A complete learning platform MVP where users:
1. Read content (with automatic scroll tracking)
2. Take 5-10 AI-generated questions
3. See results with **AI-powered feedback** (Gemini)
4. Unlock next topic on 70%+ score
5. Resume anytime (exact position saved)

---

## Gemini AI Integration (Week 2-3 Enhancement)

**New Feature (Feb 26, 2026)**: Gemini AI integration for enhanced learning

### Setup
Add to `.env`:
```dotenv
GEMINI_API_KEY=your_key_here
```

### Key Features

1. **AI-Powered Short Answer Validation**
   - Uses Gemini for semantic similarity checking
   - Falls back to keyword matching if Gemini fails
   - Integrated into checkpoint submit mutation

2. **Personalized Feedback**
   - Generates 2-sentence explanations for incorrect answers
   - Shown in Results Screen when user expands a question
   - Cached to avoid re-calling API

### Files Modified
- `src/lib/gemini/client.ts` - Core client
- `src/lib/gemini/feedback.ts` - Feedback generation
- `src/lib/gemini/validation.ts` - Short answer validation
- `src/modules/checkpoint/api/router.ts` - Gemini validation on submit
- `src/modules/results/components/ResultsScreen.tsx` - AI feedback display
- `src/app/api/gemini/feedback/route.ts` - Feedback API endpoint

### Documentation
- See [GEMINI.md](./GEMINI.md) for complete documentation

---

## Week 1: Content Reader + Adaptive Engine

### Deliverable
- Content scrolling with auto-position saving
- 95% CTA leading to checkpoint
- Exact scroll position restore on return

### Files to Create

```
src/lib/adaptive-engine/
├── calculator.ts           (New)

src/modules/content/
├── page.tsx               (New)
├── components/
│   ├── ContentReader.tsx  (New)
│   └── ProgressBar.tsx    (New)
└── api/
    └── router.ts          (New)

src/hooks/
├── useScrollTracking.ts   (New)
└── useAutoSave.ts         (New)
```

### Key Functions

**`useScrollTracking`**:
```typescript
// Returns: { percentage, pausePoints, revisits, speed }
// Updates every 500ms
// Stores in local state, passed to adaptation calculator
```

**`calculateComplexityAdjustment`**:
```typescript
// Input: scrollSpeed, pausePoints, revisitCount, timeOnPage, baseComplexity
// Output: -1, 0, +1, or +2 modifier
// Used for question generation formula
```

**`/api/trpc/subtopics.getContent`**:
```typescript
// GET /api/trpc?batch=1&input=%7B%22subtopicId%22%3A...%7D
// Returns: { content, resumePosition }
```

**`/api/trpc/subtopics.saveProgress`**:
```typescript
// POST with { subtopicId, position, phase }
// Operation: UPDATE USER_PROGRESS SET exit_point_json = ...
```

### Testing Checklist

- [ ] Load `/modules/content/[id]` → Content renders
- [ ] Scroll to 95% → CTA button appears
- [ ] Refresh page → Scroll position restores exactly
- [ ] Exit (close tab) → Position saved in DB
- [ ] Offline → Auto-save queues to localStorage
- [ ] Online again → Queue syncs to API

### Hints

- Use `const scrollableRef = useRef<HTMLDivElement>()` to track position
- Debounce speed calculation (every 200ms to avoid noise)
- Save exit_point_json before beforeunload: `window.addEventListener('beforeunload', ...)`
- Test with existing Subtopic from seed: Topic 1, Subtopic 1 (complexity 1)

---

## Week 2: Question Generation + Checkpoint

### Deliverable
- 5-10 MCQ + ShortAnswer questions generated
- Checkpoint screen with state machine
- Submit scores and progression

### Files to Create

```
src/lib/question-generator/
├── engine.ts              (New)

src/modules/checkpoint/
├── page.tsx               (New)
├── components/
│   ├── CheckpointScreen.tsx  (New)
│   ├── QuestionCard.tsx      (New)
│   └── SubmitButton.tsx      (New)
└── api/
    └── router.ts          (New)

src/hooks/
└── useCheckpointState.ts  (New)
```

### Key Functions

**Formula**: `min(5 + complexity(1-4) - 1 + adaptation(0-2), 10)`

Examples:
- Complexity 1, no adaptation = 5 questions
- Complexity 4, +2 adaptation = 10 questions (capped)
- Complexity 2, +1 adaptation = 7 questions

**`generateQuestionSet`**:
```typescript
// Input: { subtopicId, complexityScore: 1-4, adaptationModifier: 0-2 }
// Output: {
//   count: number,
//   distribution: { mcq: number, shortAnswer: number },
//   difficultyCurve: number[]  // implicit difficulty ramp
// }
```

**Question Types**:
- **MCQ**: 4 options, single select, validates instantly
- **ShortAnswer**: Text input, 3 attempts, semantic matching (check keywords)

**`/api/trpc/checkpoint.submit`**:
```typescript
// POST with { subtopicId, answers: [{ qId, answer }], timeSpent }
// Returns: { score, breakdown, canProgress }
// Scoring: foundation 40% + application 35% + synthesis 25%
```

### Submit behavior (server + client)

- Server `/api/trpc/checkpoint.submit` now validates input with Zod and expects:
  - `subtopicId: string`, `answers: Array<{ questionId, selectedAnswer }>` and `timeSpentSeconds: number`.
- Submission runs inside a Prisma transaction for atomicity:
  1. Regenerates the question set for the subtopic and validates each answer.
  2. Calculates weighted scores by difficulty buckets: foundation (easy) 40%, application (medium) 35%, synthesis (hard) 25%.
  3. Creates an `ATTEMPT` record with `userId`, `subtopicId`, `questionsJson`, `answersJson`, `scoresJson`, `totalScore`, and `timeSpentSeconds`.
  4. Upserts `USER_PROGRESS` — marks `completed` and stores an `exitPointJson` when score >= 70, otherwise keeps `in_progress` and writes an exit point with score and passed=false.
- The mutation returns `{ score, breakdown: { foundation, application, synthesis }, canProgress, attemptId }`.

- Client behavior expectations:
  - The `Submit` button in the checkpoint UI is disabled until all questions are answered.
  - On submit the client calls `checkpoint.submit` and on success redirects to `/subtopic/[id]/results?attemptId=<id>`.
  - Network failures show a retry modal and preserve answers in memory (no loss).
  - Server-side errors show a toast message and keep answers in memory for retry.


### State Machine

```
loading
  ↓
question (display Q1, Q2, ...)
  ↓
validating (user submits answer, check if correct)
  ↓
next (move to Q2, Q3, ... or show submit)
  ↓
submit (all answered → call API)
  ↓
success (redirect to results)
```

### Testing Checklist

- [ ] `/modules/checkpoint/[id]` → 5-10 questions render
- [ ] MCQ: select option → visual feedback (no score yet)
- [ ] ShortAnswer: type text → 3 attempts shown
- [ ] Question navigation: Next/Prev buttons work
- [ ] All answered → Submit button enabled
- [ ] Submit → Score calculated (40/35/25 formula)
- [ ] Exit mid-checkpoint → Confirm dialog, discard answers

### Hints

- Store answers in React state only: `const [answers, setAnswers] = useState({})`
- Question IDs from generated set: map `diff`: 0-5 = foundation, 6-14 = application, 15+ = synthesis
- ShortAnswer validation: simple keyword match → `answer.toLowerCase().includes(keyword.toLowerCase())`
- Error: network timeout → show retry, keep answers in state
- Test with complexity 1 first (5 questions), then complexity 3 (harder formula)

---

## Week 3: Results + Progression + Dashboard

### Deliverable
- Results screen with score + feedback
- Unlock next subtopic if 70%+
- Dashboard with free topic selection
- Resume banner

### Files to Create

```
src/modules/results/
├── page.tsx               (New)
├── components/
│   └── ResultsScreen.tsx  (New)
└── api/
    └── router.ts          (New)

src/modules/dashboard/
├── page.tsx               (New)
├── components/
│   ├── TopicGrid.tsx      (New)
│   ├── ResumeBanner.tsx   (New)
│   ├── HistoryList.tsx    (New)
│   └── SubtopicList.tsx   (New)
└── api/
    └── router.ts          (New)
```

### Score Feedback

| Score Range | Text |
|---|---|
| 70-100 | "Strong foundation — ready for next topic" |
| 50-69 | "Review these concepts before moving on" |
| <50 | "Restart recommended — fundamentals need work" |

### Key Mutations

**`/api/trpc/dashboard.startTopic`**:
```typescript
// Input: { topicId }
// Operation: INSERT USER_PROGRESS (first subtopic, status='in_progress')
```

**`/api/trpc/dashboard.unlockSubtopic`**:
```typescript
// Called when previous subtopic score ≥ 70%
// Operation: UPDATE USER_PROGRESS SET status='in_progress'
```

**`/api/trpc/results.get`**:
```typescript
// Input: { attemptId }
// Returns: { attempt, score, canProgress, nextSubtopicId }
```

### Linear Enforcement

```
Topic: Neural Networks
├── Subtopic 1: Learning Problem
│   └── Status: completed (80% score)
├── Subtopic 2: Weights & Signals
│   └── Status: in_progress (clickable)
└── Subtopic 3: Optimization
    └── Status: locked (not clickable, 70%+ required from #2)
```

Validation: Check `USER_PROGRESS.status` before allowing click

### Testing Checklist

- [ ] Post-result redirect works
- [ ] Score 70%+ → "[Next Subtopic]" button visible, "[Retry]" hidden
- [ ] Score <70% → "[Retry Checkpoint]" button visible, "[Next]" hidden
- [ ] Deep Dive placeholder → Below actions, locked icon, muted
- [ ] Dashboard: TopicGrid shows all topics
- [ ] Resume banner: Shows if any in_progress
- [ ] Click subtopic: Redirects to content with position
- [ ] History: Shows all completed attempts
- [ ] Try skip locked subtopic → Blocked

### Hints

- Use CSS `conic-gradient` for circular score display
- Fetch attempt with full joined data: `SELECT * FROM ATTEMPT JOIN SUBTOPIC...`
- Resume URL: `/modules/content/[id]?position=1200` (pixels to scroll)
- Linear check in SubtopicList: `if (status !== 'in_progress' && status !== 'completed') return disabled`
- Test progression: Complete Subtopic 1 (70%+) → Subtopic 2 unlocks

---

## Week 4: Polish, Testing & Analytics

### Deliverable
- Playwright E2E tests (5 critical flows)
- Error boundaries active
- Sentry logging enabled
- Offline banner
- Performance optimization

### Playwright Tests

Create `/tests/e2e/critical-flows.spec.ts`:

```typescript
test('exit and resume content', async ({ page }) => {
  // 1. Navigate to content
  // 2. Scroll to 50%
  // 3. Close page
  // 4. Return to dashboard
  // 5. Click Resume → position should restore to 50%
});

test('complete checkpoint', async ({ page }) => {
  // 1. Answer all 5-10 questions
  // 2. Click Submit
  // 3. Verify score displayed
});

test('fail and retry', async ({ page }) => {
  // 1. Score <70%
  // 2. Click [Retry Checkpoint]
  // 3. New questions generated (same topic)
  // 4. Try again
});

test('pass and progress', async ({ page }) => {
  // 1. Score ≥70%
  // 2. Next subtopic unlocks
  // 3. Try click it → allowed
});

test('linear enforcement', async ({ page }) => {
  // 1. Try skip to Subtopic 3 (locked)
  // 2. Button disabled or error
  // 3. Complete Subtopic 2 first
  // 4. Then Subtopic 3 unlocks
});
```

### Error Boundaries

```typescript
// src/app/layout.tsx
<ErrorBoundary>
  <Providers>
    {children}
  </Providers>
</ErrorBoundary>

// src/modules/[name]/layout.tsx
export default function ModuleLayout({ children }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
```

### Offline Banner

```typescript
// In Providers.tsx or layout
const [isOnline, setIsOnline] = useState(true);

useEffect(() => {
  const handleOnline = () => setIsOnline(true);
  const handleOffline = () => setIsOnline(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);

if (!isOnline) {
  return <div className="bg-warn p-2">📡 You're offline. Changes will sync when you're back online.</div>;
}
```

### Performance Checklist

- [ ] React Query staleTime: 5 min for content
- [ ] React Query cacheTime: 10 min default
- [ ] Bundle size: <200kb initial (verify with `npm run build`)
- [ ] Sentry integration: Errors logged to dashboard
- [ ] Database indexes: USER_PROGRESS(user_id, status), ATTEMPT(user_id, subtopic_id)
- [ ] All tests passing

### Deployment

```bash
# Build & verify
npm run build

# Deploy to Vercel
vercel deploy --prod

# Verify at https://gritflow.vercel.app
```

---

## Phase 1 Acceptance Criteria

### Functional

- [x] Content reader scrolls smoothly, saves position
- [x] 5-10 questions generate based on complexity formula
- [x] MCQ + ShortAnswer mixed correctly
- [x] Score calculated: 40/35/25 split
- [x] 70% threshold unlock enforced
- [x] Linear subtopic progression (no skip)
- [x] Resume works for all phases (content/checkpoint/results)
- [x] History view read-only
- [x] Deep Dive placeholder visible (locked icon)

### Non-Functional

- [x] E2E tests: 5 critical flows passing
- [x] Error handling: boundaries + Sentry logging
- [x] Offline: Queue saves, sync on reconnect
- [x] Bundle size: <200kb initial
- [x] Performance: React Query caching 5/10 min
- [x] Database: Seeded with 3 topics, accessible

### QA Sign-Off

- [x] All user flows manual tested
- [x] Network errors handled gracefully
- [x] Offline functionality tested
- [x] Mobile responsive (Tailwind default)
- [x] Accessibility: heading hierarchy, color contrast

---

## Quick Command Reference

```bash
# Development
npm run dev              # Start dev server

# Database
npm run prisma:studio   # Open DB explorer
npm run prisma:seed     # Re-seed data

# Testing
npx playwright test     # Run all E2E tests
npx playwright test --headed  # Show browser

# Build & Deploy
npm run build           # Build for production
npm run start           # Start prod server locally
vercel deploy --prod    # Deploy to Vercel
```

---

## Debugging Tips

### Content Not Loading
- Check USER_PROGRESS exists: `npm run prisma:studio` → USER_PROGRESS table
- Verify subtopicId valid: Query SUBTOPIC table
- Check auth middleware: User should be logged in

### Question Generation Wrong Count
- Debug: Log complexityScore, adaptationModifier before formula
- Formula: `Math.min(5 + complexity - 1 + adaptation, 10)`
- Test edge cases: complexity=1 (should = 5), complexity=4, adaptation=2 (should = 10)

### Cannot Submit Checkpoint
- All answers filled? Check `useCheckpointState` has values for all Q IDs
- Network issue? Check browser console for fetch errors
- API error? Check `/api/trpc` logs in terminal

### Progression Stuck
- Check USER_PROGRESS.status: should update to 'completed' after score ≥ 70%
- Check unlockSubtopic mutation: called after successful submit?
- Verify next subtopic status in DB changes from 'locked' to 'in_progress'

---

## Resources

- **Content**: Seed data in `prisma/seed.ts` (3 topics)
- **Existing Code**: `src/lib/auth.ts`, `src/providers/Providers.tsx`, error boundaries
- **API Pattern**: Check `src/lib/trpc/router.ts` for tRPC examples
- **Styling**: Tailwind default + globals.css variables (not yet populated)

---

## Success Metrics

By end of Week 4, Phase 1 is complete when:
- ✅ Full learning flow works end-to-end
- ✅ 5 E2E tests passing
- ✅ Bundle <200kb, performance optimized
- ✅ Deployed to Vercel at public URL
- ✅ 3 topics seeded, all features locked working
- ⚠️ **Known Issue**: Result accuracy validation (what the user answered vs what the correct result is) needs refinement.

---

**Next**: Phase 2 (Deep Dive) planning begins after Phase 1 sign-off

