/**
 * Dashboard API Router
 *
 * tRPC router for dashboard-specific operations.
 * Handles topics, history retrieval and other dashboard-related queries.
 */

import { initTRPC } from "@trpc/server";
import { z } from "zod";
import superjson from "superjson";
import type { Context } from "../../../lib/trpc/context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

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
 * Type for subtopic returned inside a topic
 */
export interface SubtopicSummary {
  id: string;
  title: string;
  orderIndex: number;
  status: string;
  estimatedMinutes: number;
  complexityScore: number;
}

/**
 * Type for topic with progress and subtopics from API
 */
export interface TopicWithProgress {
  id: string;
  title: string;
  description: string;
  progressPercentage: number;
  subtopics: SubtopicSummary[];
}

/**
 * Type for history item returned by getHistory query
 */
export interface HistoryItem {
  attemptId: string;
  subtopicId: string;
  subtopicTitle: string;
  topicTitle: string;
  totalScore: number;
  timeSpentSeconds: number;
  completedAt: Date;
}

/**
 * Dashboard router with topics, history queries
 */
export const dashboardRouter = t.router({
  /**
   * Get all topics with their subtopics and per-topic progress percentage.
   *
   * Subtopics are ordered by complexity_score ASC.
   * Progress = (completed subtopics / total subtopics) * 100.
   */
  getTopics: t.procedure.query(async ({ ctx }: { ctx: Context }): Promise<TopicWithProgress[]> => {
    const userId = getUserIdFromSession(ctx);

    // Fetch all topics ordered by their orderIndex, including subtopics
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

    // If user is not logged in, return topics with 0 progress but still show subtopics
    if (!userId) {
      return topics.map((topic, index) => ({
        id: topic.id,
        title: topic.title,
        description: topic.description,
        progressPercentage: 0,
        subtopics: topic.subtopics.map((sub, subIndex) => ({
          id: sub.id,
          title: sub.title,
          orderIndex: subIndex + 1,
          status: sub.status,
          estimatedMinutes: sub.estimatedMinutes,
          complexityScore: sub.complexityScore,
        })),
      }));
    }

    // Fetch user progress for all subtopics at once
    const userProgress = await ctx.prisma.userProgress.findMany({
      where: { userId },
      select: {
        subtopicId: true,
        status: true,
      },
    });

    const completedSubtopicIds = new Set(
      userProgress
        .filter((p) => p.status === "completed")
        .map((p) => p.subtopicId)
    );

    return topics.map((topic) => {
      const total = topic.subtopics.length;
      const completed = topic.subtopics.filter((sub) =>
        completedSubtopicIds.has(sub.id)
      ).length;

      const progressPercentage =
        total === 0 ? 0 : Math.round((completed / total) * 100);

      return {
        id: topic.id,
        title: topic.title,
        description: topic.description,
        progressPercentage,
        subtopics: topic.subtopics.map((sub, subIndex) => ({
          id: sub.id,
          title: sub.title,
          orderIndex: subIndex + 1,
          status: completedSubtopicIds.has(sub.id) ? "completed" : sub.status,
          estimatedMinutes: sub.estimatedMinutes,
          complexityScore: sub.complexityScore,
        })),
      };
    });
  }),

  /**
   * Start a topic - returns first accessible subtopic ID.
   *
   * A user can always start at the first subtopic if none are in progress.
   * Otherwise, returns the first non-completed subtopic.
   */
  startTopic: t.procedure
    .input(z.object({ topicId: z.string().min(1) }))
    .mutation(async ({ ctx, input }: { ctx: Context; input: { topicId: string } }): Promise<{ success: boolean; firstSubtopicId: string | null }> => {
      const userId = getUserIdFromSession(ctx);

      if (!userId) {
        return { success: false, firstSubtopicId: null };
      }

      // Get subtopics ordered by complexity asc
      const subtopics = await ctx.prisma.subtopic.findMany({
        where: { topicId: input.topicId },
        orderBy: { complexityScore: "asc" },
        select: { id: true },
      });

      if (subtopics.length === 0) {
        return { success: false, firstSubtopicId: null };
      }

      // Find the first non-completed subtopic
      const userProgress = await ctx.prisma.userProgress.findMany({
        where: {
          userId,
          subtopicId: { in: subtopics.map((s) => s.id) },
          status: "completed",
        },
        select: { subtopicId: true },
      });

      const completedIds = new Set(userProgress.map((p) => p.subtopicId));
      const firstIncomplete = subtopics.find((s) => !completedIds.has(s.id));

      // Resume where they left off, or first subtopic if all completed
      const firstSubtopicId = firstIncomplete?.id ?? subtopics[0]?.id ?? null;

      return { success: true, firstSubtopicId };
    }),

  /**
   * Get learning history
   *
   * Returns ATTEMPT records joined with SUBTOPIC and TOPIC.
   * Shows completed subtopics with score, completion date, time spent.
   * Read-only - no retest functionality.
   */
  getHistory: t.procedure.query(async ({ ctx }: { ctx: Context }): Promise<HistoryItem[]> => {
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
    const historyItems: HistoryItem[] = attempts.map((attempt) => ({
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
});

/**
 * Type for the dashboard router
 */
export type DashboardRouter = typeof dashboardRouter;

export default dashboardRouter;

