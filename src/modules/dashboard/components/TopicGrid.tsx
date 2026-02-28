"use client";

/**
 * TopicGrid Component
 *
 * Displays a grid of all topics. Each card shows:
 *  - Progress badge
 *  - Topic title & description
 *  - Ordered list of subtopics with lock/check/active icons
 *  - Progress bar
 */

import React from "react";
import { useRouter } from "next/navigation";
import { trpc } from "../../../lib/trpc/client";

/**
 * Subtopic shape returned by trpc.dashboard.getTopics
 */
interface SubtopicData {
  id: string;
  title: string;
  orderIndex: number;
  status: string;
  estimatedMinutes: number;
  complexityScore: number;
}

/**
 * Topic shape returned by trpc.dashboard.getTopics
 */
interface TopicData {
  id: string;
  title: string;
  description: string;
  progressPercentage: number;
  subtopics: SubtopicData[];
}


/**
 * Icon for subtopic status
 */
function SubtopicIcon({ status }: { status: string }): JSX.Element {
  if (status === "completed") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
        <svg className="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }
  if (status === "available" || status === "in_progress") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100">
        <svg className="h-3 w-3 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5" />
        </svg>
      </span>
    );
  }
  // locked
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100">
      <svg className="h-3 w-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    </span>
  );
}

/**
 * Get badge styles based on progress percentage
 */
function getProgressBadge(progress: number): { text: string; className: string } {
  if (progress === 100) {
    return { text: "Complete", className: "bg-green-100 text-green-700 border-green-200" };
  }
  if (progress > 0) {
    return { text: `${progress}% done`, className: "bg-amber-100 text-amber-700 border-amber-200" };
  }
  return { text: "Not started", className: "bg-slate-100 text-slate-600 border-slate-200" };
}

export default function TopicGrid(): JSX.Element {
  const router = useRouter();

  // Fetch topics with subtopics + progress using tRPC
  const { data: topics, isLoading, error } = trpc.dashboard.getTopics.useQuery(
    undefined,
    {
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  // startTopic mutation — must be called at top level (not inside callbacks)
  const startTopicMutation = trpc.dashboard.startTopic.useMutation();

  // Handle topic card click → navigate to first accessible subtopic
  const handleTopicClick = async (topicId: string): Promise<void> => {
    try {
      const result = await startTopicMutation.mutateAsync({ topicId });
      if (result.success && result.firstSubtopicId) {
        router.push(`/modules/content?subtopicId=${result.firstSubtopicId}`);
      } else {
        router.push(`/modules/content?topicId=${topicId}`);
      }
    } catch (err) {
      console.error("Failed to start topic:", err);
      router.push(`/modules/content?topicId=${topicId}`);
    }
  };

  // Handle clicking directly on a specific subtopic row
  const handleSubtopicClick = (e: React.MouseEvent, subtopicId: string, status: string): void => {
    e.stopPropagation();
    if (status === "locked") return; // blocked
    router.push(`/modules/content?subtopicId=${subtopicId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse"
          >
            <div className="h-6 bg-slate-200 rounded w-3/4 mb-4" />
            <div className="h-4 bg-slate-200 rounded w-full mb-2" />
            <div className="h-4 bg-slate-200 rounded w-2/3 mb-4" />
            <div className="h-3 bg-slate-100 rounded w-full mb-2" />
            <div className="h-3 bg-slate-100 rounded w-5/6" />
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load topics</p>
        <p className="text-slate-500 text-sm mt-2">Please try again later</p>
      </div>
    );
  }

  // No topics
  if (!topics || topics.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600">No topics available yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {topics.map((topic: TopicData) => {
        const badge = getProgressBadge(topic.progressPercentage);

        return (
          <div
            key={topic.id}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-200 flex flex-col"
          >
            {/* Clickable header area */}
            <button
              type="button"
              onClick={() => handleTopicClick(topic.id)}
              className="p-6 text-left group focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-400"
            >
              {/* Progress Badge */}
              <div className="mb-3">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}
                >
                  {badge.text}
                </span>
              </div>

              {/* Topic Title */}
              <h3 className="text-base font-semibold text-slate-900 group-hover:text-slate-700 mb-1">
                {topic.title}
              </h3>

              {/* Topic Description */}
              <p className="text-sm text-slate-500 line-clamp-2">
                {topic.description}
              </p>

              {/* Progress Bar */}
              <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-800 rounded-full transition-all duration-300"
                  style={{ width: `${topic.progressPercentage}%` }}
                />
              </div>
            </button>

            {/* Subtopics List */}
            {topic.subtopics.length > 0 && (
              <div className="border-t border-slate-100 px-6 py-3 flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                  {topic.subtopics.length} Subtopic{topic.subtopics.length !== 1 ? "s" : ""}
                </p>
                {topic.subtopics.map((sub: SubtopicData) => (
                  <button
                    key={sub.id}
                    type="button"
                    disabled={sub.status === "locked"}
                    onClick={(e) => handleSubtopicClick(e, sub.id, sub.status)}
                    className={`flex items-center gap-3 text-left rounded-lg px-2 py-1.5 transition-colors ${sub.status === "locked"
                      ? "cursor-not-allowed opacity-50"
                      : "hover:bg-slate-50 cursor-pointer"
                      }`}
                  >
                    <SubtopicIcon status={sub.status} />
                    <span className="text-sm text-slate-700 flex-1 leading-tight">
                      {sub.title}
                    </span>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {sub.estimatedMinutes}m
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Footer CTA */}
            <div className="px-6 py-3 mt-auto border-t border-slate-50">
              <button
                type="button"
                onClick={() => handleTopicClick(topic.id)}
                className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors group"
              >
                <span>{topic.progressPercentage > 0 ? "Continue" : "Start Learning"}</span>
                <svg
                  className="w-4 h-4 ml-1.5 transform group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

