"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useScrollTracking } from "../hooks/useScrollTracking";
import { useAutoSave } from "../hooks/useAutoSave";
import { ProgressBar } from "./ProgressBar";
import { ContinueCTA } from "./ContinueCTA";
import { trpc } from "../../../lib/trpc/client";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import type { AdaptationSignals } from "../../../lib/adaptive-engine/calculator";

/**
 * Interface for ContentReader component props
 */
export interface ContentReaderProps {
  subtopicId: string;
  content: string;
  onContinue: () => void;
  className?: string;
  initialResumePosition?: number;
}

/**
 * Interface for exit point data stored in localStorage/database
 */
interface ExitPointData {
  type: "content";
  position: number;
  timestamp: number;
  signals?: AdaptationSignals;
}

/**
 * ContentReader Component
 * - Scrollable container with smooth scrolling
 * - Renders MDX content from SUBTOPIC.content_json
 * - Position restoration from URL params or localStorage on reload
 * - beforeunload handler saves exit_point_json with signals
 */
export function ContentReader(props: ContentReaderProps): JSX.Element {
  const {
    subtopicId,
    content,
    onContinue,
    className = "",
    initialResumePosition = 0
  } = props;

  // Get URL search params for position
  const searchParams = useSearchParams();
  const urlPosition = searchParams?.get("position");

  // Ref for the scroll container
  const containerRef = useRef<HTMLDivElement>(null);

  // Local storage key for position persistence
  const localStorageKey = `content_position_${subtopicId}`;

  // State for continue CTA visibility
  const [showContinueCTA, setShowContinueCTA] = useState<boolean>(false);

  // Track time on page for signals
  const [startTime] = useState<number>(Date.now());
  const pauseCountRef = useRef<number>(0);
  const revisitCountRef = useRef<number>(0);

  // Scroll tracking hook
  const { scrollPercentage, scrollToPosition, isPaused, isRevisit, speed } = useScrollTracking(
    containerRef as React.RefObject<HTMLElement | null>
  );

  // Auto-save hook
  const { save, isSaving } = useAutoSave(subtopicId);

  // Track pause points
  useEffect(() => {
    if (isPaused) {
      pauseCountRef.current += 1;
    }
  }, [isPaused]);

  // Track revisits
  useEffect(() => {
    if (isRevisit) {
      revisitCountRef.current += 1;
    }
  }, [isRevisit]);

  /**
   * Get current signals for adaptation
   */
  const getCurrentSignals = useCallback((): AdaptationSignals => {
    return {
      scrollSpeed: speed,
      pausePoints: pauseCountRef.current,
      revisitCount: revisitCountRef.current,
      timeOnPage: Date.now() - startTime,
    };
  }, [speed, startTime]);

  /**
   * Determine initial position to resume from
   * Priority: URL param > initialResumePosition > localStorage
   */
  const getInitialPosition = useCallback((): number => {
    // First check URL params
    if (urlPosition) {
      const parsed = parseFloat(urlPosition);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }

    // Then check initial prop
    if (initialResumePosition > 0) {
      return initialResumePosition;
    }

    // Finally check localStorage
    const savedPosition = localStorage.getItem(localStorageKey);
    if (savedPosition) {
      const parsed = parseFloat(savedPosition);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }

    return 0;
  }, [urlPosition, initialResumePosition]);

  /**
   * Restore scroll position on mount
   */
  useEffect(() => {
    const initialPosition = getInitialPosition();
    if (initialPosition > 0) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        scrollToPosition(initialPosition);
      }, 100);
    }
  }, [getInitialPosition, scrollToPosition]);

  /**
   * Save position to localStorage on scroll change
   */
  useEffect(() => {
    if (scrollPercentage > 0) {
      localStorage.setItem(localStorageKey, scrollPercentage.toString());
    }
  }, [scrollPercentage, localStorageKey]);

  /**
   * Trigger auto-save when scroll position changes significantly
   * Includes signals for adaptation
   */
  useEffect(() => {
    if (scrollPercentage > 0) {
      const signals = getCurrentSignals();
      save(scrollPercentage, signals);
    }
  }, [scrollPercentage, save, getCurrentSignals]);

  /**
   * Show continue CTA at 95% scroll
   */
  useEffect(() => {
    setShowContinueCTA(scrollPercentage >= 50);
  }, [scrollPercentage]);

  /**
   * Handle exit - save exit point to localStorage
   */
  const handleExit = useCallback((): void => {
    const signals = getCurrentSignals();

    const exitPointData: ExitPointData = {
      type: "content",
      position: scrollPercentage,
      timestamp: Date.now(),
      signals,
    };

    // Save to localStorage for immediate restoration
    localStorage.setItem(localStorageKey, scrollPercentage.toString());
    localStorage.setItem(
      `exit_point_${subtopicId}`,
      JSON.stringify(exitPointData)
    );
  }, [scrollPercentage, subtopicId, localStorageKey, getCurrentSignals]);

  /**
   * Handle beforeunload - save exit point
   */
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      // Save current position
      handleExit();

      // Use sendBeacon as fallback for more reliable delivery
      const signals = getCurrentSignals();
      const exitPointData = {
        subtopicId,
        type: "content",
        position: scrollPercentage,
        timestamp: Date.now(),
        signals,
      };

      const blob = new Blob([JSON.stringify(exitPointData)], {
        type: "application/json",
      });

      navigator.sendBeacon("/api/trpc/content.saveProgress", blob);

      // Chrome requires this to show the dialog
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [handleExit, scrollPercentage, subtopicId, getCurrentSignals]);

  /**
   * Handle page visibility change (tab switch, minimize)
   */
  useEffect(() => {
    const handleVisibilityChange = (): void => {
      if (document.visibilityState === "hidden") {
        handleExit();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleExit]);

  /**
   * Render markdown/HTML content using react-markdown
   * Supports embedded raw HTML via rehype-raw
   */
  const renderContent = (): JSX.Element => {
    const markdownComponents = {
      pre: (props: any) => (
        <pre className="rounded bg-slate-100 p-4 overflow-auto" {...props} />
      ),
      code: (props: any) => (
        <code className="rounded bg-slate-100 p-1" {...props} />
      ),
    };

    return (
      <div className="prose prose-slate max-w-none">
        <ReactMarkdown rehypePlugins={[rehypeRaw]} components={markdownComponents}>
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Progress bar at top */}
      <ProgressBar progress={scrollPercentage} />

      {/* Sticky action header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600">
          {scrollPercentage > 0 ? `${Math.round(scrollPercentage)}% read` : "Reading content..."}
        </span>
        <button
          type="button"
          onClick={onContinue}
          className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Take Checkpoint →
        </button>
      </div>

      {/* Saving indicator */}
      {isSaving && (
        <div className="fixed top-14 right-3 z-50 text-xs text-slate-400">
          Saving...
        </div>
      )}

      {/* Main content container - padded for sticky header */}
      <div
        ref={containerRef}
        className="h-screen overflow-y-auto scroll-smooth pt-12"
        style={{
          scrollBehavior: "smooth",
        }}
      >
        <div className="max-w-3xl mx-auto px-6 py-8 pb-24">
          {renderContent()}
        </div>
      </div>

      {/* Continue CTA - now appears at 50% scroll */}
      <ContinueCTA
        isVisible={showContinueCTA}
        onContinue={onContinue}
      />
    </div>
  );
}

export default ContentReader;
