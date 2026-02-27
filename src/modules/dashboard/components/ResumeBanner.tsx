"use client";

/**
 * ResumeBanner Component
 * 
 * Displays a banner to resume in-progress learning.
 * Only appears when USER_PROGRESS.status='in_progress'.
 * Shows "Continue: [Topic] > [Subtopic]" and links to resume point.
 */

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "../../../lib/trpc/client";

/**
 * Type for resume point data from API
 */
interface ResumePointData {
  url: string;
  phase: string;
  metadata: {
    topicTitle: string;
    subtopicTitle: string;
  };
}

export default function ResumeBanner(): JSX.Element {
  const router = useRouter();

  // Fetch resume point using tRPC
  const { data: resumePoint, isLoading } = trpc.dashboard.getResumePoint.useQuery(
    undefined,
    {
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  // Handle continue click
  const handleContinue = useCallback((): void => {
    if (resumePoint?.url) {
      router.push(resumePoint.url);
    }
  }, [router, resumePoint]);

  // Don't render if no resume point or loading
  if (isLoading || !resumePoint) {
    return <></>;
  }

  // Get phase display text
  const getPhaseText = (phase: string): string => {
    switch (phase) {
      case "content":
        return "Continue Reading";
      case "checkpoint":
        return "Continue Quiz";
      case "results":
        return "View Results";
      case "deep_dive":
        return "Continue Deep Dive";
      default:
        return "Continue";
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg overflow-hidden mb-8">
      <div className="p-6">
        <div className="flex items-center justify-between">
          {/* Left side: Message */}
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
            </div>

            {/* Text */}
            <div>
              <p className="text-blue-100 text-sm font-medium">
                {getPhaseText(resumePoint.phase)}
              </p>
            <p className="text-white text-lg font-semibold">
                {`Continue: ${resumePoint.metadata.topicTitle} > ${resumePoint.metadata.subtopicTitle}`}
              </p>
            </div>
          </div>

          {/* Right side: Action Button */}
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={handleContinue}
              className="inline-flex items-center px-6 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
            >
              Continue
              <svg
                className="w-4 h-4 ml-2"
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
            </button>
          </div>
        </div>
      </div>

      {/* Decorative bottom gradient */}
      <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-500" />
    </div>
  );
}
