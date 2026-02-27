"use client";

import React, { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ContentReader } from "./components/ContentReader";
import { trpc } from "../../lib/trpc/client";

/**
 * Default content when no subtopicId provided
 */
const DEFAULT_CONTENT = {
  title: "Welcome to Grit Flow",
  content: `
    <h1>Welcome to Grit Flow</h1>
    <p>Select a topic from the dashboard to begin learning.</p>
  `,
};

/**
 * Content Module Page
 * Fetches content from the database using tRPC
 */
export default function ContentModule(): JSX.Element {
  const searchParams = useSearchParams();
  const subtopicId = searchParams?.get("subtopicId") || "";

  // Fetch content from database using tRPC
  const { data: contentData, isLoading, error } = trpc.content.getContent.useQuery(
    { subtopicId },
    {
      enabled: !!subtopicId,
      retry: false,
    }
  );

  const handleContinue = useCallback((): void => {
    if (subtopicId) {
      // Navigate to checkpoint for this subtopic
      window.location.href = `/modules/checkpoint?subtopicId=${subtopicId}`;
    }
  }, [subtopicId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading content...</div>
      </div>
    );
  }

  // Error state or no subtopicId
  if (error || !contentData) {
    return (
      <div className="h-screen overflow-hidden">
        <ContentReader
          subtopicId={subtopicId || "none"}
          content={DEFAULT_CONTENT.content}
          onContinue={handleContinue}
          initialResumePosition={0}
        />
      </div>
    );
  }

  // Parse the content JSON from database
  let parsedContent = DEFAULT_CONTENT;
  try {
    const parsed = JSON.parse(contentData.content);
    parsedContent = {
      title: parsed.title || "Content",
      content: parsed.deepDivePlaceholder || "<p>No content available</p>",
    };
  } catch {
    // If parsing fails, use raw content
    parsedContent = {
      title: contentData.title,
      content: contentData.content,
    };
  }

  return (
    <div className="h-screen overflow-hidden">
      <ContentReader
        subtopicId={subtopicId}
        content={parsedContent.content}
        onContinue={handleContinue}
        initialResumePosition={contentData.resumePosition}
      />
    </div>
  );
}
