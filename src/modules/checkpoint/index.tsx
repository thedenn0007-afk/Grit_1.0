/**
 * Checkpoint Module
 * 
 * Main checkpoint component that wraps the CheckpointScreen.
 * Handles routing and callback management for checkpoint flow.
 */

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckpointScreen } from "./components/CheckpointScreen";

/**
 * Props for CheckpointModule
 */
export interface CheckpointModuleProps {
  subtopicId: string;
  complexityScore?: number;
  adaptationModifier?: number;
}

/**
 * Default complexity and adaptation values
 */
const DEFAULT_COMPLEXITY_SCORE = 2;
const DEFAULT_ADAPTATION_MODIFIER = 1;

/**
 * CheckpointModule Component
 */
export default function CheckpointModule({
  subtopicId,
  complexityScore = DEFAULT_COMPLEXITY_SCORE,
  adaptationModifier = DEFAULT_ADAPTATION_MODIFIER,
}: CheckpointModuleProps): JSX.Element {
  const router = useRouter();
  const [checkpointComplete, setCheckpointComplete] = useState<boolean>(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);

  // Handle checkpoint completion
  const handleComplete = useCallback(
    (score: number, passedCheckpoint: boolean): void => {
      setCheckpointComplete(true);
      setLastScore(score);
      setPassed(passedCheckpoint);
    },
    []
  );

  // Handle exit - discards answers and navigates back
  const handleExit = useCallback((): void => {
    // Navigate back to content or dashboard
    router.push(`/modules/content?subtopicId=${subtopicId}`);
  }, [router, subtopicId]);

  // If checkpoint is complete, show results
  if (checkpointComplete && lastScore !== null && passed !== null) {
    return (
      <CheckpointResults
        score={lastScore}
        passed={passed}
        subtopicId={subtopicId}
        onRetry={(): void => {
          setCheckpointComplete(false);
          setLastScore(null);
          setPassed(null);
        }}
        onContinue={(): void => {
          // Navigate to next subtopic or dashboard
          router.push("/modules/dashboard");
        }}
      />
    );
  }

  // Render checkpoint screen
  return (
    <CheckpointScreen
      subtopicId={subtopicId}
      complexityScore={complexityScore}
      adaptationModifier={adaptationModifier}
      onExit={handleExit}
      onComplete={handleComplete}
    />
  );
}

/**
 * CheckpointResults Component
 * Displays results after checkpoint completion
 */
interface CheckpointResultsProps {
  score: number;
  passed: boolean;
  subtopicId: string;
  onRetry: () => void;
  onContinue: () => void;
}

function CheckpointResults({
  score,
  passed,
  subtopicId,
  onRetry,
  onContinue,
}: CheckpointResultsProps): JSX.Element {
  return (
    <div className="max-w-md mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Result Icon */}
        <div
          className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
            passed ? "bg-green-100" : "bg-red-100"
          }`}
        >
          {passed ? (
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
        </div>

        {/* Result Title */}
        <h2 className="mt-6 text-2xl font-bold text-slate-800">
          {passed ? "Checkpoint Passed!" : "Keep Learning"}
        </h2>

        {/* Score Display */}
        <div className="mt-4">
          <p className="text-slate-600">Your Score</p>
          <p
            className={`text-5xl font-bold ${
              passed ? "text-green-600" : "text-red-600"
            }`}
          >
            {score}%
          </p>
        </div>

        {/* Pass/Fail Message */}
        <p className="mt-4 text-slate-600">
          {passed
            ? "Great job! You've demonstrated understanding of this topic."
            : "You need 70% to pass. Review the content and try again."}
        </p>

        {/* Actions */}
        <div className="mt-8 space-y-3">
          {!passed && (
            <button
              type="button"
              onClick={onRetry}
              className="w-full px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Try Again
            </button>
          )}
          <button
            type="button"
            onClick={onContinue}
            className={`w-full px-6 py-3 rounded-lg transition-colors ${
              passed
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            {passed ? "Continue" : "Review Content"}
          </button>
        </div>
      </div>
    </div>
  );
}
