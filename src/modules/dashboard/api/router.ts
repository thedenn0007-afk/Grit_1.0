/**
 * Dashboard API Router
 *
 * tRPC router for dashboard-specific operations.
 * Handles history retrieval and other dashboard-related queries.
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
 * Dashboard router with history query
 */
export const dashboardRouter = t.router({
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
