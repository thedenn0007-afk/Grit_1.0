"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ContentReader } from "./components/ContentReader";
import { trpc } from "../../lib/trpc/client";

/**
 * Builds a rich markdown reading article from the parsed contentJson structure.
 * DB stores: { title, description, learningObjectives, questions, deepDivePlaceholder }
 */
function buildRichContent(parsed: Record<string, unknown>, fallbackTitle: string): string {
  const title = String(parsed.title || fallbackTitle);
  const description = String(parsed.description || "");
  const objectives: string[] = Array.isArray(parsed.learningObjectives)
    ? (parsed.learningObjectives as string[])
    : [];
  const topics: Array<Record<string, unknown>> = Array.isArray(parsed.topics)
    ? (parsed.topics as Array<Record<string, unknown>>)
    : [];

  const parts: string[] = [];

  // Title
  parts.push(`# ${title}\n`);

  // Description paragraph
  if (description) {
    parts.push(`${description}\n`);
  }

  // Learning objectives box
  if (objectives.length > 0) {
    parts.push(`\n## What You'll Learn\n`);
    objectives.forEach((obj) => {
      parts.push(`- ${obj}`);
    });
    parts.push("");
  }

  // Topic sections (if present in richer data)
  if (topics.length > 0) {
    topics.forEach((topic, i) => {
      const topicTitle = String(topic.title || `Section ${i + 1}`);
      const topicDesc = String(topic.description || topic.content || "");
      const points: string[] = Array.isArray(topic.keyPoints)
        ? (topic.keyPoints as string[])
        : [];

      parts.push(`\n## ${topicTitle}\n`);
      if (topicDesc) parts.push(`${topicDesc}\n`);
      if (points.length > 0) {
        points.forEach((pt) => parts.push(`- ${pt}`));
        parts.push("");
      }
    });
  } else if (objectives.length > 0) {
    // Expand each learning objective into a readable section
    parts.push(`\n## Reading Material\n`);
    objectives.forEach((obj, i) => {
      parts.push(`\n### ${i + 1}. ${obj}\n`);
      parts.push(
        `This section covers how to **${obj.toLowerCase()}**. ` +
        `Understanding this concept is fundamental to mastering ${title}. ` +
        `Take a moment to think about what you already know and how this fits into the bigger picture of the topic. ` +
        `As you progress through the checkpoint questions, you'll apply this knowledge to real-world scenarios.\n`
      );
    });
  }

  // What to expect in checkpoint
  parts.push(`\n---\n`);
  parts.push(
    `> **Ready to test your knowledge?** Once you've read through this material, ` +
    `click **Take Checkpoint →** above to begin the quiz.\n`
  );

  return parts.join("\n");
}


/**
 * Default content when no subtopicId provided
 */
const DEFAULT_CONTENT = {
  title: "Welcome to Grit Flow",
  content: `# Welcome to Grit Flow\n\nSelect a topic from the dashboard to begin learning.\n`,
};

/**
 * Content Module Page
 * Fetches content from the database using tRPC and displays it as rich reading material.
 */
export default function ContentModule(): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();

  const topicId = searchParams?.get("topicId") || "";
  const initialSubtopicId = searchParams?.get("subtopicId") || "";

  const [resolvedSubtopicId, setResolvedSubtopicId] = useState(initialSubtopicId);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  const { data: firstSubtopic, isInitialLoading: isResolvingTopic } = trpc.dashboard.getFirstSubtopic.useQuery(
    { topicId },
    {
      enabled: !!topicId && !initialSubtopicId,
      retry: false,
    }
  );

  useEffect(() => {
    if (firstSubtopic && firstSubtopic.id) {
      setResolvedSubtopicId(firstSubtopic.id);
    } else if (topicId && !initialSubtopicId && !isResolvingTopic) {
      router.replace(`/modules/dashboard`);
    }
  }, [firstSubtopic, topicId, initialSubtopicId, isResolvingTopic, router]);

  const subtopicId = resolvedSubtopicId || initialSubtopicId;

  const { data: contentData, isInitialLoading: isLoading, error } = trpc.content.getContent.useQuery(
    { subtopicId },
    {
      enabled: !!subtopicId,
      retry: false,
    }
  );

  // Timeout fallback: if loading for >8s, show "Try again" so user isn't stuck
  useEffect(() => {
    if (!isLoading && !isResolvingTopic) {
      setLoadingTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setLoadingTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, [isLoading, isResolvingTopic]);

  const handleContinue = useCallback((): void => {
    if (subtopicId) {
      window.location.href = `/modules/checkpoint?subtopicId=${subtopicId}`;
    }
  }, [subtopicId]);

  if (isLoading || isResolvingTopic) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
        <div className="text-gray-600">Loading content...</div>
        {loadingTimedOut && (
          <div className="text-center">
            <p className="text-sm text-amber-600 mb-2">Taking longer than usual?</p>
            <button
              type="button"
              onClick={() => router.push("/modules/dashboard")}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 text-sm font-medium"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    );
  }

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

  // Build rich reading content from the DB JSON
  let richContent = DEFAULT_CONTENT.content;
  try {
    const parsed = JSON.parse(contentData.content) as Record<string, unknown>;
    richContent = buildRichContent(parsed, contentData.title);
  } catch {
    // Raw HTML/markdown — use as-is
    richContent = contentData.content;
  }

  return (
    <div className="h-screen overflow-hidden">
      <ContentReader
        subtopicId={subtopicId}
        content={richContent}
        onContinue={handleContinue}
        initialResumePosition={contentData.resumePosition}
      />
    </div>
  );
}
