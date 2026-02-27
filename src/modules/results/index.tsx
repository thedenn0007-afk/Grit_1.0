"use client";

/**
 * Results Module
 * 
 * Parent component that renders the ResultsScreen with attemptId from URL params.
 */

import React from "react";
import { useSearchParams } from "next/navigation";
import { ResultsScreen } from "./components/ResultsScreen";

/**
 * Results Module Component
 * Extracts attemptId from URL search params and renders ResultsScreen
 */
export default function ResultsModule(): JSX.Element {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId");

  if (!attemptId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600">Missing attempt ID</p>
          <p className="mt-2 text-slate-600">Please return to the checkpoint and complete it to see your results.</p>
        </div>
      </div>
    );
  }

  return <ResultsScreen attemptId={attemptId} />;
}
