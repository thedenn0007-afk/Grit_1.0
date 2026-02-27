"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
 * Supports both subtopicId and topicId (resolves to first subtopic)
 */
export default function ContentModule(): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get subtopicId first (preferred), then topicId as fallback
  const topicId = searchParams?.get("topicId") || "";
  const initialSubtopicId = searchParams?.get("subtopicId") || "";
  
  // State to hold resolved subtopicId
  const [resolvedSubtopicId, setResolvedSubtopicId] = useState(initialSubtopicId);

  // If topicId is provided but no subtopicId, resolve it to first subtopic
  const { data: firstSubtopic, isLoading: isResolvingTopic } = trpc.dashboard.getFirstSubtopic.useQuery(
    { topicId },
    {
      enabled: !!topicId && !initialSubtopicId,
      retry: false,
    }
  );

  // When we get the first subtopic, update the state
  useEffect(() => {
    if (firstSubtopic && firstSubtopic.id) {
      setResolvedSubtopicId(firstSubtopic.id);
    } else if (topicId && !initialSubtopicId && !isResolvingTopic) {
      // If no subtopic found for topic, redirect to dashboard
      router.replace(`/modules/dashboard`);
    }
  }, [firstSubtopic, topicId, initialSubtopicId, isResolvingTopic, router]);

  // Use resolved or direct subtopicId
  const subtopicId = resolvedSubtopicId || initialSubtopicId;

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

  // Loading state - show while resolving topic or loading content
  if (isLoading || isResolvingTopic) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading content...</div>
      </div>
    );
  }

  // Error state or no subtopicId - show default welcome content
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
    // Use the actual learning content
    // The content structure has description and learningObjectives, not just content field
    parsedContent = {
      title: parsed.title || "Content",
      content: parsed.description || parsed.content || `<h1>${parsed.title}</h1><p>${parsed.description || "No content available"}</p>`,
    };
  } catch {
    // If parsing fails, use raw content (might be plain HTML)
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
