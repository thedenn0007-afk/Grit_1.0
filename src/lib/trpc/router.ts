import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import type { Context } from "./context";
import { calculateComplexityAdjustment, getDefaultSignals } from "../adaptive-engine/calculator";
import { generateQuestionSet } from "../question-generator/engine";

const t = initTRPC.context<Context>().create({ transformer: superjson });

/**
 * Helper to get user ID from session safely
 */
function getUserIdFromSession(ctx: { session: Context["session"] }): string | null {
  const session = ctx.session;
  if (!session) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (session as any).user?.id ?? null;
}

/**
 * Get badge level from percentage
 * Returns 0, 50, or 100 based on progress
 */
function getBadgeFromPercentage(percentage: number): number {
  if (percentage >= 75) return 100;
  if (percentage >= 25) return 50;
  return 0;
}

export const appRouter = t.router({
  /**
   * Health check
   */
  health: t.procedure.query((): { status: string } => {
    return { status: "ok" };
  }),

  /**
   * Checkpoint: Generate questions for a checkpoint
   */
  checkpoint: t.router({
    generate: t.procedure
      .input(z.object({
        subtopicId: z.string(),
        complexityScore: z.number().min(1).max(4),
        adaptationModifier: z.number().min(0).max(2),
      }))
      .query(({ input }) => {
        const questionSet = generateQuestionSet({
          subtopicId: input.subtopicId,
          complexityScore: input.complexityScore,
          adaptationModifier: input.adaptationModifier,
        });
        return questionSet;
      }),
  }),

  /**
   * Dashboard: Get topics with progress
   */
  dashboard: t.router({
    getTopics: t.procedure.query(async ({ ctx }) => {
      const topics = await ctx.prisma.topic.findMany({
        orderBy: { orderIndex: "asc" },
        include: {
          subtopics: {
            orderBy: { complexityScore: "asc" },
            select: {
              id: true,
              title: true,
              complexityScore: true,
              estimatedMinutes: true,
              status: true,
            },
          },
        },
      });

      const userId = getUserIdFromSession(ctx);

      if (!userId) {
        return topics.map((topic) => ({
          id: topic.id,
          title: topic.title,
          description: topic.description,
          progressPercentage: 0,
          subtopics: topic.subtopics.map((sub, idx) => ({
            id: sub.id,
            title: sub.title,
            orderIndex: idx + 1,
            status: sub.status,
            estimatedMinutes: sub.estimatedMinutes,
            complexityScore: sub.complexityScore,
          })),
        }));
      }

      const allSubtopicIds = topics.flatMap((topic) => topic.subtopics.map((s) => s.id));

      const completedProgress = await ctx.prisma.userProgress.findMany({
        where: { userId, subtopicId: { in: allSubtopicIds }, status: "completed" },
        select: { subtopicId: true },
      });

      const completedSet = new Set(completedProgress.map((p) => p.subtopicId));

      return topics.map((topic) => {
        const total = topic.subtopics.length;
        const completed = topic.subtopics.filter((s) => completedSet.has(s.id)).length;
        const rawPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
        return {
          id: topic.id,
          title: topic.title,
          description: topic.description,
          progressPercentage: getBadgeFromPercentage(rawPercent),
          subtopics: topic.subtopics.map((sub, idx) => ({
            id: sub.id,
            title: sub.title,
            orderIndex: idx + 1,
            status: completedSet.has(sub.id) ? "completed" : sub.status,
            estimatedMinutes: sub.estimatedMinutes,
            complexityScore: sub.complexityScore,
          })),
        };
      });
    }),

    getResumePoint: t.procedure.query(async ({ ctx }) => {
      const userId = getUserIdFromSession(ctx);
      if (!userId) return null;

      const inProgress = await ctx.prisma.userProgress.findFirst({
        where: { userId, status: "in_progress" },
        include: { subtopic: { include: { topic: { select: { id: true, title: true } } } } },
      });

      if (!inProgress) return null;

      let url = `/modules/content?subtopicId=${inProgress.subtopicId}`;
      if (inProgress.currentPhase === "checkpoint") {
        url = `/modules/checkpoint?subtopicId=${inProgress.subtopicId}`;
      } else if (inProgress.currentPhase === "results") {
        const attempt = await ctx.prisma.attempt.findFirst({
          where: { userId, subtopicId: inProgress.subtopicId },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        });
        if (attempt) url = `/modules/results?attemptId=${attempt.id}`;
      }

      return {
        url,
        phase: inProgress.currentPhase,
        metadata: {
          topicTitle: inProgress.subtopic.topic?.title ?? "",
          subtopicTitle: inProgress.subtopic.title,
        },
      };
    }),

    /**
     * Get learning history
     * 
     * Returns ATTEMPT records joined with SUBTOPIC and TOPIC.
     * Shows completed subtopics with score, completion date, time spent.
     * Read-only - no retest functionality.
     */
    getHistory: t.procedure.query(async ({ ctx }) => {
      const userId = getUserIdFromSession(ctx);

      // If no user, return empty history
      if (!userId) {
        return [];
      }

      // Fetch attempts with subtopic and topic information
      const attempts = await ctx.prisma.attempt.findMany({
        where: {
          userId: userId,
        },
        include: {
          subtopic: {
            include: {
              topic: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Transform to history items
      const historyItems = attempts.map((attempt) => ({
        attemptId: attempt.id,
        subtopicId: attempt.subtopicId,
        subtopicTitle: attempt.subtopic.title,
        topicTitle: attempt.subtopic.topic?.title ?? "Unknown Topic",
        totalScore: attempt.totalScore,
        timeSpentSeconds: attempt.timeSpentSeconds,
        completedAt: attempt.createdAt,
      }));

      return historyItems;
    }),

    startTopic: t.procedure
      .input(z.object({ topicId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const userId = getUserIdFromSession(ctx);
        // For demo purposes, allow without user
        const effectiveUserId = userId || "demo-user";

        const firstSubtopic = await ctx.prisma.subtopic.findFirst({
          where: { topicId: input.topicId },
          orderBy: { id: "asc" },
        });

        if (!firstSubtopic) return { success: false, firstSubtopicId: null };

        await ctx.prisma.userProgress.upsert({
          where: { userId_subtopicId: { userId: effectiveUserId, subtopicId: firstSubtopic.id } },
          update: { status: "in_progress", currentPhase: "content" },
          create: { userId: effectiveUserId, subtopicId: firstSubtopic.id, status: "in_progress", currentPhase: "content" },
        });

        return { success: true, firstSubtopicId: firstSubtopic.id };
      }),

    /**
     * Get first subtopic of a topic
     * Used when navigating to content with topicId
     */
    getFirstSubtopic: t.procedure
      .input(z.object({ topicId: z.string() }))
      .query(async ({ input, ctx }) => {
        const firstSubtopic = await ctx.prisma.subtopic.findFirst({
          where: { topicId: input.topicId },
          orderBy: { id: "asc" },
          select: { id: true, title: true },
        });

        return firstSubtopic;
      }),
  }),

  /**
   * Content: Get subtopic content
   */
  content: t.router({
    getContent: t.procedure
      .input(z.object({ subtopicId: z.string() }))
      .query(async ({ input, ctx }) => {
        const userId = getUserIdFromSession(ctx);
        const effectiveUserId = userId || "demo-user";

        const subtopic = await ctx.prisma.subtopic.findUnique({ where: { id: input.subtopicId } });
        if (!subtopic) throw new Error("Subtopic not found");

        let resumePosition = 0;
        let status = "not_started";
        let currentPhase = "content";
        let adaptationModifier = 1;

        const progress = await ctx.prisma.userProgress.findUnique({
          where: { userId_subtopicId: { userId: effectiveUserId, subtopicId: input.subtopicId } },
        });

        if (progress) {
          status = progress.status;
          currentPhase = progress.currentPhase;
          if (progress.exitPointJson) {
            try {
              const exitPoint = JSON.parse(progress.exitPointJson);
              resumePosition = exitPoint.position || 0;
              const signals = exitPoint.signals || getDefaultSignals();
              adaptationModifier = calculateComplexityAdjustment(signals, subtopic.complexityScore).modifier;
            } catch { /* ignore */ }
          }
        }

        return {
          content: subtopic.contentJson,
          title: subtopic.title,
          complexityScore: subtopic.complexityScore,
          resumePosition,
          status,
          currentPhase,
          adaptationModifier,
        };
      }),

    saveProgress: t.procedure
      .input(z.object({
        subtopicId: z.string(),
        position: z.number().min(0).max(100),
        timestamp: z.number(),
        signals: z.object({
          scrollSpeed: z.number(),
          pausePoints: z.number(),
          revisitCount: z.number(),
          timeOnPage: z.number(),
        }).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = getUserIdFromSession(ctx);

        // Skip progress saving for unauthenticated users — UserProgress has FK to User
        if (!userId) return { success: true };

        const subtopic = await ctx.prisma.subtopic.findUnique({ where: { id: input.subtopicId } });
        let adaptationModifier = 1;
        if (input.signals && subtopic) {
          adaptationModifier = calculateComplexityAdjustment(input.signals, subtopic.complexityScore).modifier;
        }

        const exitPointData = {
          type: "content",
          position: input.position,
          timestamp: input.timestamp,
          signals: input.signals || getDefaultSignals(),
          adaptationModifier
        };

        await ctx.prisma.userProgress.upsert({
          where: { userId_subtopicId: { userId, subtopicId: input.subtopicId } },
          update: { exitPointJson: JSON.stringify(exitPointData), currentPhase: "content", status: "in_progress" },
          create: { userId, subtopicId: input.subtopicId, status: "in_progress", currentPhase: "content", exitPointJson: JSON.stringify(exitPointData) },
        });

        return { success: true };
      }),
  }),

  /**
   * Progress: Save user progress
   */
  progress: t.router({
    save: t.procedure
      .input(z.object({
        subtopicId: z.string(),
        position: z.number().min(0).max(100),
        timestamp: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const userId = getUserIdFromSession(ctx);

        // Skip for unauthenticated users — UserProgress has FK to User
        if (!userId) return { success: true };

        const exitPointData = {
          type: "checkpoint" as const,
          position: input.position,
          timestamp: input.timestamp,
        };

        await ctx.prisma.userProgress.upsert({
          where: { userId_subtopicId: { userId, subtopicId: input.subtopicId } },
          update: { exitPointJson: JSON.stringify(exitPointData), currentPhase: "checkpoint", status: "in_progress" },
          create: { userId, subtopicId: input.subtopicId, status: "in_progress", currentPhase: "checkpoint", exitPointJson: JSON.stringify(exitPointData) },
        });

        return { success: true };
      }),
  }),

  /**
   * Results: Get attempt results
   */
  results: t.router({
    get: t.procedure
      .input(z.object({ attemptId: z.string() }))
      .query(async ({ input, ctx }) => {
        const userId = getUserIdFromSession(ctx);
        const effectiveUserId = userId || "demo-user";

        const attempt = await ctx.prisma.attempt.findFirst({
          where: { id: input.attemptId, userId: effectiveUserId },
          include: { subtopic: true },
        });
        if (!attempt) {
          // If attempt not found (e.g. foreign key failed and we returned a fallback ID),
          // return a minimal, non-crashing result so the user still sees a results screen
          const now = new Date();
          return {
            attemptId: input.attemptId,
            totalScore: 0,
            canProgress: false,
            nextSubtopicId: null,
            timeSpentSeconds: 0,
            createdAt: now,
            subtopicId: "unknown",
            subtopicTitle: "Checkpoint Results",
            questions: [] as Array<{
              id: string;
              questionText: string;
              type: "mcq" | "shortAnswer";
              difficulty: "easy" | "medium" | "hard";
              options?: readonly [string, string, string, string];
              correctAnswerIndex?: number;
              explanation: string;
            }>,
            userAnswers: [] as Array<{
              questionId: string;
              selectedAnswer: number | string;
              isCorrect: boolean;
            }>,
          };
        }

        // Display question info directly from stored answers (can't re-match by ID since IDs are random per-generation)
        const answers = JSON.parse(attempt.answersJson) as Array<{ questionId: string; selectedAnswer: number | string; isCorrect?: boolean }>;
        const scores = JSON.parse(attempt.scoresJson) as Record<string, boolean>;

        const questionsForDisplay = answers.map((a, idx) => ({
          id: a.questionId,
          questionText: `Question ${idx + 1}`,
          type: typeof a.selectedAnswer === "number" ? "mcq" : "shortAnswer",
          difficulty: "medium" as "easy" | "medium" | "hard",
          options: undefined as readonly [string, string, string, string] | undefined,
          correctAnswerIndex: undefined as number | undefined,
          explanation: typeof a.selectedAnswer === "number"
            ? `You selected option ${String.fromCharCode(65 + Number(a.selectedAnswer))}.`
            : `You answered: "${a.selectedAnswer}".`,
        }));



        const userAnswers = answers.map((a) => ({ questionId: a.questionId, selectedAnswer: a.selectedAnswer, isCorrect: scores[a.questionId] ?? a.isCorrect ?? false }));
        const canProgress = attempt.totalScore >= 70;

        let nextSubtopicId: string | null = null;
        if (canProgress) {
          const allSubtopics = await ctx.prisma.subtopic.findMany({ where: { topicId: attempt.subtopic.topicId }, orderBy: { id: "asc" } });
          const currentIndex = allSubtopics.findIndex((s) => s.id === attempt.subtopicId);
          if (currentIndex >= 0 && currentIndex < allSubtopics.length - 1) {
            nextSubtopicId = allSubtopics[currentIndex + 1].id;
            // Only upsert progress for authenticated users (UserProgress FK requires real User)
            if (userId) {
              await ctx.prisma.userProgress.upsert({
                where: { userId_subtopicId: { userId, subtopicId: attempt.subtopicId } },
                update: { status: "completed", currentPhase: "results", completedAt: new Date() },
                create: { userId, subtopicId: attempt.subtopicId, status: "completed", currentPhase: "results", completedAt: new Date() },
              });
              await ctx.prisma.userProgress.upsert({
                where: { userId_subtopicId: { userId, subtopicId: nextSubtopicId! } },
                update: { status: "in_progress", currentPhase: "content" },
                create: { userId, subtopicId: nextSubtopicId!, status: "in_progress", currentPhase: "content" },
              });
            }
          }
        }

        return { attemptId: attempt.id, totalScore: attempt.totalScore, canProgress, nextSubtopicId, timeSpentSeconds: attempt.timeSpentSeconds, createdAt: attempt.createdAt, subtopicId: attempt.subtopicId, subtopicTitle: attempt.subtopic.title, questions: questionsForDisplay, userAnswers };
      }),
  }),

  /**
   * Submit checkpoint
   * - Accepts both number answers (MCQ) and string answers (ShortAnswer)
   * - Client sends isCorrect flags (questions have random IDs generated at runtime
   *   that can't be re-matched server-side, so client scoring is used)
   * - Returns canProgress flag (score >= 70)
   */
  submitCheckpoint: t.procedure
    .input(z.object({
      subtopicId: z.string(),
      complexityScore: z.number().min(1).max(4).optional().default(2),
      adaptationModifier: z.number().min(0).max(2).optional().default(1),
      answers: z.array(z.object({
        questionId: z.string(),
        selectedAnswer: z.union([z.number(), z.string()]),
        isCorrect: z.boolean().optional(),
      })),
      timeSpentSeconds: z.number().min(0),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = getUserIdFromSession(ctx);

      const subtopic = await ctx.prisma.subtopic.findUnique({ where: { id: input.subtopicId } });
      if (!subtopic) throw new Error("Subtopic not found");

      // Score based on client-provided correctness flags
      let correctCount = 0;
      const scores: Record<string, boolean> = {};

      for (const answer of input.answers) {
        let isCorrect: boolean;
        if (answer.isCorrect !== undefined) {
          isCorrect = answer.isCorrect;
        } else {
          isCorrect = false;
        }
        scores[answer.questionId] = isCorrect;
        if (isCorrect) correctCount++;
      }

      const totalAnswered = input.answers.length;
      const totalScore = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
      const canProgress = totalScore >= 70;

      // Create attempt — use a placeholder userId for unauthenticated users
      // Ensure the demo user exists in the DB to satisfy FK constraint
      const effectiveUserId = userId || "demo-user";

      if (!userId) {
        // Ensure a demo user exists so FK constraints on Attempt.userId are satisfied.
        // Use findUnique by id (PK) rather than upsert to avoid unique email conflicts.
        try {
          const existingDemoUser = await ctx.prisma.user.findUnique({ where: { id: "demo-user" } });
          if (!existingDemoUser) {
            // Create with a unique email to avoid conflicts with seed data
            await ctx.prisma.user.create({
              data: { id: "demo-user", email: `demo-${Date.now()}@gritflow.app`, name: "Demo User" },
            });
          }
        } catch {
          // If creation fails for any reason, the attempt.create try/catch below will handle it
        }
      }

      let attempt;
      try {
        attempt = await ctx.prisma.attempt.create({
          data: {
            userId: effectiveUserId,
            subtopicId: input.subtopicId,
            questionsJson: JSON.stringify(input.answers.map((a) => a.questionId)),
            answersJson: JSON.stringify(input.answers),
            scoresJson: JSON.stringify(scores),
            totalScore,
            timeSpentSeconds: input.timeSpentSeconds,
          },
        });
      } catch {
        // Fallback if creation still fails
        return { success: true, totalScore, canProgress, attemptId: "no-attempt-" + Date.now() };
      }


      // Only update progress for authenticated users (UserProgress has FK to User)
      if (userId) {
        if (canProgress) {
          await ctx.prisma.userProgress.upsert({
            where: { userId_subtopicId: { userId, subtopicId: input.subtopicId } },
            update: { status: "completed", currentPhase: "results", completedAt: new Date() },
            create: { userId, subtopicId: input.subtopicId, status: "completed", currentPhase: "results", completedAt: new Date() },
          });
        } else {
          await ctx.prisma.userProgress.upsert({
            where: { userId_subtopicId: { userId, subtopicId: input.subtopicId } },
            update: { status: "in_progress", currentPhase: "checkpoint" },
            create: { userId, subtopicId: input.subtopicId, status: "in_progress", currentPhase: "checkpoint" },
          });
        }
      }

      return { success: true, totalScore, canProgress, attemptId: attempt.id };
    }),
});

export type AppRouter = typeof appRouter;
