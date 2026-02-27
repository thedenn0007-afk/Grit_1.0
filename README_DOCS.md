# Grit Flow - Documentation Index

**Project**: Grit Flow - Adaptive Learning Platform  
**Version**: 1.0  
**Last Updated**: February 20, 2026  

---

## 📚 Documentation Structure

Choose your document based on your role:

### For Project Managers & Stakeholders

**→ Start here**: [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md)
- Executive summary with key achievements
- Phase timeline and deliverables
- Locked specifications and feature list
- Critical path and dependencies
- Success metrics

**Time to read**: 20 minutes

---

### For Developers Starting Phase 1

**→ Start here**: [PHASE_1_QUICKSTART.md](./PHASE_1_QUICKSTART.md)
- Week-by-week breakdown
- Files to create per week
- Testing checklists
- Debugging tips
- Code hints and patterns

**Time to read**: 15 minutes (then 1 week to build)

---

### For DevOps & Infrastructure

**→ Start here**: [PHASE_0.md](./PHASE_0.md)
- Complete Phase 0 infrastructure
- Database setup details
- Authentication configuration
- Environment variables
- How to run locally and deploy

**Time to read**: 30 minutes

---

### For Architects & Design

**→ Start here**: [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md) → Section: Database Schema + API Endpoints
- Full ER diagram (in schema section)
- API layer design
- Technology stack rationale
- Architecture overview

**Time to read**: 25 minutes

---

## 🎯 Quick Navigation

### Gemini AI Integration

For detailed documentation on Gemini AI features:
- **[GEMINI.md](./GEMINI.md)** - Complete guide to all Gemini integrations

**Key Features:**
- AI-powered short answer validation (semantic similarity)
- Personalized feedback for incorrect answers
- REST API endpoints for content generation
- Full TypeScript support with Zod validation


### Current Status

| Phase | Status | Duration | Start Date | Key Deliverable |
|---|---|---|---|---|
| **Phase 0** | ✅ Complete | 3 weeks | Jan 2026 | Foundation, Auth, Infrastructure |
| **Phase 1** | 🎯 Ready to Build | 4 weeks | Feb 20, 2026 | MVP: Content → Checkpoint → Results |
| **Phase 2** | 📍 Planned | 4 weeks | Mar 20, 2026 | Deep Dive + Doubt Button + Analytics |
| **Phase 3-5** | 🗓️ Design | TBD | Apr 2026+ | Testing, Deployment, Optimization |

### Document Map

```
DOCUMENTATION/
├── README.md (this file)
├── PHASE_0.md
│   ├── Infrastructure setup
│   ├── Database schema (6 tables + NextAuth)
│   ├── Authentication flow
│   └── Deployment checklist
├── PRODUCT_ROADMAP.md
│   ├── Executive summary
│   ├── Phases 0-5 detailed specs
│   ├── Locked specifications
│   ├── All 14 prompts
│   ├── Database schema full
│   ├── API endpoints
│   └── Tech stack
├── PHASE_1_QUICKSTART.md
│   ├── Week 1-4 breakdown
│   ├── Testing checklists
│   ├── Code hints
│   └── Debugging guide
└── This File
    └── Navigation & reference
```

---

## 🚀 Getting Started

### First Time on Project?

1. **[ 5 min ]** Read: [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md) → Section: Executive Summary
2. **[ 10 min ]** Read: [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md) → Section: Tech Stack
3. **[ 10 min ]** Read: [PHASE_0.md](./PHASE_0.md) → Section: How to Run
4. **[ 5 min ]** Run locally: `npm run dev`
5. **Done!** You're ready to contribute

### Starting Phase 1 Development?

1. **[ 5 min ]** Review: [PHASE_1_QUICKSTART.md](./PHASE_1_QUICKSTART.md) → Overview section
2. **[ 10 min ]** Check: [PHASE_1_QUICKSTART.md](./PHASE_1_QUICKSTART.md) → Week 1 Deliverable
3. **[ 5 min ]** Create your feature branch: `git checkout -b feature/phase-1-content`
4. **[ 30 min ]** Create files per Week 1 checklist
5. **Start building!**

### Deploying to Production?

1. **[ 15 min ]** Read: [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md) → Section: How to Run → Build & Deploy
2. **[ 5 min ]** Read: [PHASE_0.md](./PHASE_0.md) → Section: Environment Configuration
3. **[ 10 min ]** Configure: `.env` variables for production
4. **[ 5 min ]** Deploy: `npm run build && vercel deploy --prod`

---

## 📋 Key Information at a Glance

### The Product

**What**: Adaptive learning platform that transforms any syllabus into personalized learning paths  
**User Flow**: Upload → AI Analysis → Learn → Test (5-10 Qs) → Results → Progress  
**Key Innovation**: Silent difficulty adjustment based on scroll speed and accuracy

### Architecture

**Frontend**: Next.js 14 + React 18 + Tailwind  
**Backend**: tRPC + Prisma ORM  
**Database**: PostgreSQL (production) / SQLite (development)  
**Auth**: NextAuth.js with email magic link  

### Database Tables

| Table | Purpose |
|---|---|
| USER | User profiles + NextAuth |
| TOPIC | Main learning topics (any order selection) |
| SUBTOPIC | Learning units (linear progression) |
| USER_PROGRESS | Track where user is in learning flow |
| ATTEMPT | Completed assessments with scores |
| DOUBT_LOG | Help system feedback (Phase 1, Week 4) |
| DEEP_* | Deep dive layers/branches (Phase 2) |

### Key Locked Specs

- ✅ 5-10 questions formula: `min(5 + complexity - 1 + adaptation, 10)`
- ✅ Scoring: Foundation 40% + Application 35% + Synthesis 25%
- ✅ Progression: 70% threshold unlock
- ✅ No retest: History view only
- ✅ Exit tracking: Position, timestamp, phase, duration
- ✅ Resume: Exact position restore (content), fresh start (checkpoint)
- ✅ Linear flow: No skip subtopics (enforced)
- ✅ Deep Dive: Placeholder in Phase 1, built in Phase 2

### Tech Stack Versions

| Package | Version |
|---|---|
| next | 14.2.15 |
| typescript | 5.6.3 |
| @trpc/server | 10.45.2 |
| @prisma/client | 5.21.1 |
| next-auth | 4.24.8 |
| zod | 3.23.8 |

---

## ✅ Phase 0 Completion Summary

**Status**: Production-ready foundation  
**Prompts**: 0.1, 0.2, 0.3 ✅  

### Infrastructure Delivered

- ✅ Next.js 14 + TypeScript + Tailwind configured
- ✅ tRPC API layer with Zod validation
- ✅ PostgreSQL ready (SQLite for dev)
- ✅ Prisma ORM with 6 tables + NextAuth models
- ✅ NextAuth email authentication (magic link)
- ✅ Protected route middleware
- ✅ Error boundaries + Toast + Loading components
- ✅ Offline queue for resilience
- ✅ Feature flags (deepDive, emailCapture, advancedAnalytics)
- ✅ Database seeded: 3 topics, 9 subtopics, 52 questions
- ✅ Dev server at localhost:3000 without errors

### How to Run It

```bash
# Install
npm install --legacy-peer-deps

# Setup database
npx prisma generate
npx prisma db push
npm run prisma:seed

# Run
npm run dev

# Access
http://localhost:3000  # Home page
http://localhost:3000/auth/signin  # Sign in
```

---

## 🎯 Phase 1 Build Plan (4 Weeks)

**Status**: 🚀 Ready to start  
**Prompts**: 1.1 → 1.2 → 2.1 → 2.2 → 2.3 → 3.1 → 3.2 → 4.1 → 4.2 → 5.1 → 5.2  

### Week 1: Content Reader & Adaptive Engine

**Prompts**: 1.1, 1.2  
**Build**: ContentReader, useScrollTracking, calculator.ts, resume logic  
**Output**: Content scrolls, position saves, 95% CTA works  

→ **Detailed guide**: [PHASE_1_QUICKSTART.md](./PHASE_1_QUICKSTART.md#week-1-content-reader--adaptive-engine)

### Week 2: Questions & Checkpoint System

**Prompts**: 2.1, 2.2, 2.3  
**Build**: QuestionEngine, CheckpointScreen, submit logic, scoring  
**Output**: 5-10 Qs generated, score calculated (40/35/25)  

→ **Detailed guide**: [PHASE_1_QUICKSTART.md](./PHASE_1_QUICKSTART.md#week-2-question-generation--checkpoint)

### Week 3: Results & Progression

**Prompts**: 3.1, 3.2, 4.1, 4.2  
**Build**: ResultsScreen, HistoryList, TopicGrid, progression logic  
**Output**: 70% unlock, linear enforcement, resume works  

→ **Detailed guide**: [PHASE_1_QUICKSTART.md](./PHASE_1_QUICKSTART.md#week-3-results--progression--dashboard)

### Week 4: Polish, Testing & Optimization

**Prompts**: 5.1, 5.2  
**Build**: E2E tests (5 flows), error boundaries, offline support, bundle optimization  
**Output**: Tests passing, <200kb bundle, deployed to Vercel  

→ **Detailed guide**: [PHASE_1_QUICKSTART.md](./PHASE_1_QUICKSTART.md#week-4-polish-testing--analytics)

---

## 🤔 FAQs

### Q: Where's the content coming from?
**A**: Currently seeded with 3 topics (TypeScript, Next.js, Advanced Patterns) and 9 subtopics. Phase 1 Week 1 implements content reading from `SUBTOPIC.content_json` field.

### Q: How are questions generated?
**A**: Formula: `min(5 + complexity(1-4) - 1 + adaptation(0-2), 10)`. AI-generated questions stored in memory during checkpoint, not persisted until submit. See [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md#prompt-21-question-generation-engine).

### Q: What happens if user exits mid-learning?
**A**: Position saved with timestamp. User can resume from exact position. Checkpoint answers discarded on exit. See [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md#exit--resume).

### Q: Why no retest feature?
**A**: Locked spec: users can view history and attempt other subtopics, but no "retake same checkpoint" allowed. Keeps momentum in learning flow. Phase 2 may add spaced repetition.

### Q: Deep Dive in Phase 1?
**A**: No. Only placeholder UI (locked icon, muted color, exact copy text). Full deep dive recursive layers built in Phase 2.

### Q: How is difficulty adapted?
**A**: Silently. Calculator tracks scroll speed, pause points, revisits. Fast reading = easier questions. Slow/revisiting = harder questions. No "difficulty level" shown to user.

### Q: Deployment timeline?
**A**: Phase 1 deploys to Vercel end of Week 4. Production DB requires PostgreSQL setup (documented in [PHASE_0.md](./PHASE_0.md)).

---

## 📞 Support & Escalation

### Technical Questions
- **Docs**: Check [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md) first
- **Local Issues**: See [PHASE_1_QUICKSTART.md](./PHASE_1_QUICKSTART.md#debugging-tips)
- **Database**: Run `npm run prisma:studio` to inspect

### Feature Questions
- **Specs**: [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md#locked-specifications)
- **API Design**: [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md#api-endpoints)
- **Database**: [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md#database-schema)

### Blockers
- **Show stoppers**: Document in PR + tag team lead
- **Decisions**: Check locked specs first for precedent
- **Timeline**: Phase 1 is 4 weeks fixed (Week 1-4, Feb 20 - Mar 20)

---

## 📖 All Documents at a Glance

| Document | Audience | Length | Purpose |
|---|---|---|---|
| [PHASE_0.md](./PHASE_0.md) | DevOps, Full-Stack | 30 min | Infrastructure setup & deployment |
| [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md) | PM, Architects, Devs | 45 min | Complete specs, all phases, all prompts |
| [PHASE_1_QUICKSTART.md](./PHASE_1_QUICKSTART.md) | Developers (Phase 1) | 15 min | Week-by-week build plan + hints |
| **README.md** (this file) | Everyone | 10 min | Navigation & quick reference |

---

## 🔄 Next Steps

### Immediate (This Week)

1. Share this README with team
2. Assign Phase 1 developer(s)
3. Set up feature branch: `feature/phase-1-content`
4. Review [PHASE_1_QUICKSTART.md](./PHASE_1_QUICKSTART.md) week by week

### Week 1

- Build ContentReader (scroll tracking, auto-save)
- Implement adaptive calculator
- Test with existing seed data
- Daily standup on progress

### Week 2-4

- Follow [PHASE_1_QUICKSTART.md](./PHASE_1_QUICKSTART.md) weekly plan
- Friday review: Weekly deliverable completion
- Merge to main at end of Phase 1

### Post-Phase 1

- Phase 2 planning (Deep Dive + Doubt Button)
- Performance optimization
- Production hardening

---

## 📊 Success Criteria

**Phase 1 is complete when**:
- ✅ All prompts (1.1-5.2) implemented
- ✅ E2E tests passing (5 critical flows)
- ✅ Deployed to Vercel with public URL
- ✅ Database seeded with 3 topics
- ✅ Bundle size <200kb
- ✅ Zero critical errors in Sentry
- ✅ All locked specs implemented

---

## 🙏 Acknowledgments

**Phase 0 Delivered By**: AI Assistant + Product Team  
**Date**: February 20, 2026  
**Foundation Ready**: Yes ✅

**Phase 1 Ready**: Yes ✅  
**Start Date**: February 20, 2026  
**Target Completion**: March 20, 2026  

---

## Version History

| Date | Version | Author | Changes |
|---|---|---|---|
| Feb 20, 2026 | 1.0 | Product Team | Initial complete documentation |

---

**Last Updated**: February 20, 2026  
**Next Major Review**: After Phase 1 completion (March 20, 2026)

---

