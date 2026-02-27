"use client";

/**
 * TopicGrid Component
 * 
 * Displays a grid of all topics with progress badges.
 * Each topic is clickable and shows progress percentage (0%, 50%, 100%).
 */

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "../../../lib/trpc/client";

/**
 * Type for topic with progress from API
 */
interface TopicWithProgress {
  id: string;
  title: string;
  description: string;
  progressPercentage: number;
}

/**
 * Get badge styles based on progress percentage
 */
function getProgressBadge(progress: number): { text: string; className: string } {
  if (progress === 100) {
    return { text: "100% Complete", className: "bg-green-100 text-green-700 border-green-200" };
  }
  if (progress === 50) {
    return { text: "50% In Progress", className: "bg-amber-100 text-amber-700 border-amber-200" };
  }
  return { text: "0% Not Started", className: "bg-slate-100 text-slate-600 border-slate-200" };
}

export default function TopicGrid(): JSX.Element {
  const router = useRouter();

  // Fetch topics with progress using tRPC
  const { data: topics, isLoading, error } = trpc.dashboard.getTopics.useQuery(
    undefined,
    {
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  // Handle topic click - navigate to first accessible subtopic
  const handleTopicClick = useCallback(
    async (topicId: string): Promise<void> => {
      try {
        // Use the startTopic mutation to begin the topic
        const mutation = trpc.dashboard.startTopic.useMutation();
        const result = await mutation.mutateAsync({ topicId });
        
        if (result.success && result.firstSubtopicId) {
          router.push(`/modules/content?subtopicId=${result.firstSubtopicId}`);
        } else {
          // If no subtopics or already started, just show a message
          console.log("Topic started but no subtopic to navigate to");
        }
      } catch (err) {
        console.error("Failed to start topic:", err);
        // Fallback: navigate to content page anyway
        router.push(`/modules/content?topicId=${topicId}`);
      }
    },
    [router]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse"
          >
            <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
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
      {topics.map((topic: TopicWithProgress) => {
        const badge = getProgressBadge(topic.progressPercentage);

        return (
          <button
            key={topic.id}
            type="button"
            onClick={() => handleTopicClick(topic.id)}
            className="bg-white rounded-xl border border-slate-200 p-6 text-left hover:shadow-lg hover:border-slate-300 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            {/* Progress Badge */}
            <div className="mb-4">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${badge.className}`}
              >
                {badge.text}
              </span>
            </div>

            {/* Topic Title */}
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-slate-700 mb-2">
              {topic.title}
            </h3>

            {/* Topic Description */}
            <p className="text-sm text-slate-600 line-clamp-2">
              {topic.description}
            </p>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-800 rounded-full transition-all duration-300"
                  style={{ width: `${topic.progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Arrow indicator */}
            <div className="mt-4 flex items-center text-slate-400 group-hover:text-slate-600">
              <span className="text-sm font-medium">Start Learning</span>
              <svg
                className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform"
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
            </div>
          </button>
        );
      })}
    </div>
  );
}
