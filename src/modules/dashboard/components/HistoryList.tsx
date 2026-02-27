"use client";

/**
 * HistoryList Component
 *
 * Displays a read-only list of completed subtopics.
 * Shows: score, completion date, time spent, status badge.
 * No retest button - read-only display only.
 */

import React from "react";
import { trpc } from "../../../lib/trpc/client";

/**
 * Type for history item from API
 */
interface HistoryItem {
  attemptId: string;
  subtopicId: string;
  subtopicTitle: string;
  topicTitle: string;
  totalScore: number;
  timeSpentSeconds: number;
  completedAt: Date;
}

/**
 * Format seconds into readable time (e.g., "5m 30s")
 */
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Format date to readable format
 */
function formatDate(date: Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Get status badge based on score
 */
function getStatusBadge(score: number): { text: string; className: string } {
  if (score >= 70) {
    return { text: "Passed", className: "bg-green-100 text-green-700 border-green-200" };
  }
  return { text: "Needs Review", className: "bg-amber-100 text-amber-700 border-amber-200" };
}

/**
 * Get score display color
 */
function getScoreColor(score: number): string {
  if (score >= 90) return "text-green-600";
  if (score >= 70) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

export default function HistoryList(): JSX.Element {
  // Fetch history using tRPC
  // Always enable even without input - the query handles unauthenticated users gracefully
  const { data: history, isLoading, error } = trpc.dashboard.getHistory.useQuery(
    undefined,
    {
      retry: 1,
      refetchOnWindowFocus: false,
    }
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">Learning History</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse flex items-center justify-between p-4 border border-slate-100 rounded-lg"
            >
              <div className="flex-1">
                <div className="h-5 bg-slate-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              </div>
              <div className="h-8 bg-slate-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state - show when no history or on error
  // This handles unauthenticated users gracefully
  if (!history || history.length === 0 || error) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">Learning History</h2>
        <div className="text-center py-8">
          <svg
            className="w-12 h-12 text-slate-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          <p className="text-slate-600">No completed subtopics yet</p>
          <p className="text-slate-400 text-sm mt-1">
            Complete a checkpoint to see your history here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-xl font-semibold text-slate-800 mb-6">Learning History</h2>

      <div className="space-y-3">
        {history.map((item: HistoryItem) => {
          const badge = getStatusBadge(item.totalScore);
          const scoreColor = getScoreColor(item.totalScore);

          return (
            <div
              key={item.attemptId}
              className="flex items-center justify-between p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {/* Left side: Topic and Subtopic info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {item.topicTitle}
                  </span>
                  <svg
                    className="w-3 h-3 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-slate-800 truncate">
                    {item.subtopicTitle}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {formatDate(item.completedAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {formatTime(item.timeSpentSeconds)}
                  </span>
                </div>
              </div>

              {/* Right side: Score and Status */}
              <div className="flex items-center gap-4 ml-4">
                <div className="text-right">
                  <p className={`text-2xl font-bold ${scoreColor}`}>
                    {item.totalScore}%
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${badge.className}`}
                >
                  {badge.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Total completed: {history.length}</span>
          <span>
            Average score:{" "}
            <span className="font-medium text-slate-700">
              {Math.round(
                history.reduce((acc: number, item: HistoryItem) => acc + item.totalScore, 0) /
                  history.length
              )}
              %
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
