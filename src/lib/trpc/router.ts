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
        include: { subtopics: { select: { id: true } } },
      });

      const userId = getUserIdFromSession(ctx);

      if (!userId) {
        return topics.map((topic) => ({
          id: topic.id,
          title: topic.title,
          description: topic.description,
          progressPercentage: 0,
        }));
      }

      const allSubtopicIds = topics.flatMap((t) => t.subtopics.map((s) => s.id));
      
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
        const effectiveUserId = userId || "demo-user";

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
          where: { userId_subtopicId: { userId: effectiveUserId, subtopicId: input.subtopicId } },
          update: { exitPointJson: JSON.stringify(exitPointData), currentPhase: "content", status: "in_progress" },
          create: { userId: effectiveUserId, subtopicId: input.subtopicId, status: "in_progress", currentPhase: "content", exitPointJson: JSON.stringify(exitPointData) },
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
        const effectiveUserId = userId || "demo-user";

        const exitPointData = {
          type: "checkpoint" as const,
          position: input.position,
          timestamp: input.timestamp,
        };

        await ctx.prisma.userProgress.upsert({
          where: { userId_subtopicId: { userId: effectiveUserId, subtopicId: input.subtopicId } },
          update: { exitPointJson: JSON.stringify(exitPointData), currentPhase: "checkpoint", status: "in_progress" },
          create: { userId: effectiveUserId, subtopicId: input.subtopicId, status: "in_progress", currentPhase: "checkpoint", exitPointJson: JSON.stringify(exitPointData) },
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
        if (!attempt) throw new Error("Attempt not found");

        const questionIds = JSON.parse(attempt.questionsJson) as string[];
        const answers = JSON.parse(attempt.answersJson) as Array<{ questionId: string; selectedAnswer: number | string }>;
        const scores = JSON.parse(attempt.scoresJson) as Record<string, boolean>;

        const questionSet = generateQuestionSet({ subtopicId: attempt.subtopicId, complexityScore: attempt.subtopic.complexityScore, adaptationModifier: 1 });

        const questions = questionSet.questions.filter((q) => questionIds.includes(q.id)).map((q) => ({
          id: q.id, questionText: q.questionText, type: q.type, difficulty: q.difficulty,
          options: q.type === "mcq" ? (q as { options: readonly [string, string, string, string] }).options : undefined,
          correctAnswerIndex: q.type === "mcq" ? (q as { correctAnswerIndex: number }).correctAnswerIndex : undefined,
          explanation: (q as { explanation: string }).explanation,
        }));

        const userAnswers = answers.map((a) => ({ questionId: a.questionId, selectedAnswer: a.selectedAnswer, isCorrect: scores[a.questionId] ?? false }));
        const canProgress = attempt.totalScore >= 70;

        let nextSubtopicId: string | null = null;
        if (canProgress) {
          const allSubtopics = await ctx.prisma.subtopic.findMany({ where: { topicId: attempt.subtopic.topicId }, orderBy: { id: "asc" } });
          const currentIndex = allSubtopics.findIndex((s) => s.id === attempt.subtopicId);
          if (currentIndex >= 0 && currentIndex < allSubtopics.length - 1) {
            nextSubtopicId = allSubtopics[currentIndex + 1].id;
            await ctx.prisma.userProgress.upsert({
              where: { userId_subtopicId: { userId: effectiveUserId, subtopicId: attempt.subtopicId } },
              update: { status: "completed", currentPhase: "results", completedAt: new Date() },
              create: { userId: effectiveUserId, subtopicId: attempt.subtopicId, status: "completed", currentPhase: "results", completedAt: new Date() },
            });
            await ctx.prisma.userProgress.upsert({
              where: { userId_subtopicId: { userId: effectiveUserId, subtopicId: nextSubtopicId } },
              update: { status: "in_progress", currentPhase: "content" },
              create: { userId: effectiveUserId, subtopicId: nextSubtopicId, status: "in_progress", currentPhase: "content" },
            });
          }
        }

        return { attemptId: attempt.id, totalScore: attempt.totalScore, canProgress, nextSubtopicId, timeSpentSeconds: attempt.timeSpentSeconds, createdAt: attempt.createdAt, subtopicId: attempt.subtopicId, subtopicTitle: attempt.subtopic.title, questions, userAnswers };
      }),
  }),

  /**
   * Submit checkpoint
   */
  submitCheckpoint: t.procedure
    .input(z.object({
      subtopicId: z.string(),
      answers: z.array(z.object({
        questionId: z.string(),
        selectedAnswer: z.number(),
      })),
      timeSpentSeconds: z.number().min(0),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = getUserIdFromSession(ctx);
      const effectiveUserId = userId || "demo-user";

      const subtopic = await ctx.prisma.subtopic.findUnique({ where: { id: input.subtopicId } });
      if (!subtopic) throw new Error("Subtopic not found");

      const content = JSON.parse(subtopic.contentJson);
      const questions = content.questions as Array<{ id: string; correctAnswer: number }>;

      let correctCount = 0;
      const scores: Record<string, boolean> = {};

      for (const answer of input.answers) {
        const question = questions.find((q) => q.id === answer.questionId);
        if (question) {
          const isCorrect = question.correctAnswer === answer.selectedAnswer;
          scores[answer.questionId] = isCorrect;
          if (isCorrect) correctCount++;
        }
      }

      const totalScore = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

      const attempt = await ctx.prisma.attempt.create({
        data: {
          userId: effectiveUserId,
          subtopicId: input.subtopicId,
          questionsJson: JSON.stringify(questions.map((q) => q.id)),
          answersJson: JSON.stringify(input.answers),
          scoresJson: JSON.stringify(scores),
          totalScore,
          timeSpentSeconds: input.timeSpentSeconds,
        },
      });

      // Update progress
      if (totalScore >= 70) {
        await ctx.prisma.userProgress.upsert({
          where: { userId_subtopicId: { userId: effectiveUserId, subtopicId: input.subtopicId } },
          update: { status: "completed", currentPhase: "results", completedAt: new Date() },
          create: { userId: effectiveUserId, subtopicId: input.subtopicId, status: "completed", currentPhase: "results", completedAt: new Date() },
        });
      } else {
        await ctx.prisma.userProgress.upsert({
          where: { userId_subtopicId: { userId: effectiveUserId, subtopicId: input.subtopicId } },
          update: { status: "in_progress", currentPhase: "checkpoint" },
          create: { userId: effectiveUserId, subtopicId: input.subtopicId, status: "in_progress", currentPhase: "checkpoint" },
        });
      }

      return { success: true, totalScore, attemptId: attempt.id };
    }),
});

export type AppRouter = typeof appRouter;
