/**
 * CheckpointScreen Component
 *
 * Main checkpoint screen with state machine:
 * loading -> question -> complete
 *
 * Features:
 * - Fetches questions via tRPC
 * - MCQ: select answer → Next/Submit enabled immediately
 * - ShortAnswer: check answer → show result → Next/Submit enabled
 * - Exit handler with confirmation dialog
 */

import React, { useState, useCallback, useMemo } from "react";
import { trpc } from "../../../lib/trpc/client";
import { QuestionCard } from "./QuestionCard";
import { useCheckpointState, validateAnswer, type CheckpointQuestion } from "../hooks/useCheckpointState";
import { useToast } from "../../../components/ui/Toast";
import { useRouter } from "next/navigation";
import Loading from "../../../components/ui/Loading";

/**
 * Props for CheckpointScreen component
 */
export interface CheckpointScreenProps {
  subtopicId: string;
  complexityScore: number;
  adaptationModifier: number;
  onExit: () => void;
  onComplete: (score: number, passed: boolean) => void;
}

/**
 * Exit point data structure for saving progress on exit
 */
export interface ExitPointData {
  type: "checkpoint";
  timestamp: number;
}

/**
 * CheckpointScreen Component
 */
export function CheckpointScreen({
  subtopicId,
  complexityScore,
  adaptationModifier,
  onExit,
  onComplete,
}: CheckpointScreenProps): JSX.Element {
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [networkError, setNetworkError] = useState<boolean>(false);

  // Fetch questions using tRPC
  const {
    data: questionSet,
    isLoading: isLoadingQuestions,
    error: questionsError,
  } = trpc.checkpoint.generate.useQuery({
    subtopicId,
    complexityScore,
    adaptationModifier,
  });

  // Extract questions from the response
  const questions: CheckpointQuestion[] = useMemo((): CheckpointQuestion[] => {
    if (!questionSet || !questionSet.questions) {
      return [];
    }
    return Array.from(questionSet.questions);
  }, [questionSet]);

  // Checkpoint state machine
  const {
    state: checkpointState,
    currentQuestion,
    currentAnswer,
    totalQuestions,
    answeredCount,
    canGoPrevious,
    isLastQuestion,
    selectAnswer,
    nextQuestion,
    previousQuestion,
    submitCheckpoint,
    setComplete,
    resetCheckpoint,
  } = useCheckpointState(questions);

  const saveProgressMutation = trpc.progress.save.useMutation();
  const submitCheckpointMutation = trpc.submitCheckpoint.useMutation();
  const toast = useToast();
  const router = useRouter();

  // ---------- Exit handlers ----------
  const handleExitClick = useCallback((): void => {
    setShowExitConfirm(true);
  }, []);

  const handleExitConfirm = useCallback((): void => {
    const timestamp = Date.now();
    (async () => {
      try {
        await saveProgressMutation.mutateAsync({ subtopicId, position: 0, timestamp });
      } catch (e) {
        console.error("Failed to save exit point:", e);
      }
      try { resetCheckpoint(); } catch { }
      onExit();
    })();
  }, [onExit, resetCheckpoint, subtopicId]);

  const handleExitCancel = useCallback((): void => {
    setShowExitConfirm(false);
  }, []);

  // ---------- Submit ----------
  const handleSubmitCheckpoint = useCallback((): void => {
    (async () => {
      const result = submitCheckpoint();

      const payload = {
        subtopicId,
        complexityScore,
        adaptationModifier,
        answers: result.answers.map((a) => {
          // Find the question to compute correctness client-side
          const question = questions.find((q) => q.id === a.questionId);
          const isCorrect = question ? validateAnswer(question, a.selectedAnswer) : false;
          return {
            questionId: a.questionId,
            selectedAnswer: a.selectedAnswer,
            isCorrect,
          };
        }),
        timeSpentSeconds: 0,
      };

      try {
        setSubmitting(true);
        const res = await submitCheckpointMutation.mutateAsync(payload);

        setComplete(res.totalScore);
        onComplete(res.totalScore, res.canProgress);
        router.push(`/modules/results?attemptId=${res.attemptId}`);
      } catch (e: any) {
        const isNetwork =
          (e?.message && String(e.message).toLowerCase().includes("fetch")) ||
          e?.name === "TypeError";
        if (isNetwork) {
          setNetworkError(true);
        } else {
          toast.error("Submission failed", e?.message || "Server error during submission");
        }
      } finally {
        setSubmitting(false);
      }
    })();
  }, [submitCheckpoint, submitCheckpointMutation, subtopicId, complexityScore, adaptationModifier, setComplete, onComplete, questions, router]);

  const handleRetrySubmit = useCallback((): void => {
    setNetworkError(false);
    handleSubmitCheckpoint();
  }, [handleSubmitCheckpoint]);

  // ---------- Loading / Error / Empty states ----------
  if (isLoadingQuestions) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    );
  }

  if (questionsError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error Loading Questions</h3>
          <p className="text-red-600 text-sm mt-1">
            {questionsError.message || "Failed to load checkpoint questions."}
          </p>
          <button
            type="button"
            onClick={handleExitClick}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Exit Checkpoint
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-medium">No Questions Available</h3>
          <p className="text-yellow-600 text-sm mt-1">
            There are no questions available for this checkpoint.
          </p>
          <button
            type="button"
            onClick={handleExitClick}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Exit Checkpoint
          </button>
        </div>
      </div>
    );
  }

  const allAnswered = answeredCount === totalQuestions;
  const progressPercentage = Math.round((answeredCount / totalQuestions) * 100);

  // ---------- Main quiz render ----------
  if (checkpointState.status === "question" || checkpointState.status === "submit") {
    return (
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Checkpoint</h2>
            <p className="text-sm text-slate-500">
              Question {checkpointState.currentIndex + 1} of {totalQuestions}
            </p>
          </div>
          <button
            type="button"
            onClick={handleExitClick}
            className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
          >
            Exit
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1 text-right">
            {answeredCount} of {totalQuestions} answered
          </p>
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <QuestionCard
            question={currentQuestion}
            answer={currentAnswer}
            onAnswerChange={selectAnswer}
            validationState="idle"
            disabled={false}
          />
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            type="button"
            onClick={previousQuestion}
            disabled={!canGoPrevious}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          {isLastQuestion ? (
            allAnswered ? (
              <button
                type="button"
                onClick={handleSubmitCheckpoint}
                disabled={submitting}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${submitting
                  ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
                  }`}
              >
                {submitting ? "Submitting..." : "Submit Checkpoint"}
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="px-6 py-2 rounded-lg bg-slate-300 text-slate-600 cursor-not-allowed font-medium"
              >
                Answer to Submit
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={nextQuestion}
              disabled={currentAnswer === null}
              className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          )}
        </div>

        {/* Question Dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {questions.map((_, index) => {
            const isAnswered = checkpointState.answers.has(questions[index].id);
            const isCurrent = index === checkpointState.currentIndex;
            return (
              <div
                key={`dot-${index}`}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${isCurrent
                  ? "bg-blue-500"
                  : isAnswered
                    ? "bg-green-500"
                    : "bg-slate-300"
                  }`}
                aria-label={`Question ${index + 1}`}
              />
            );
          })}
        </div>

        {/* Exit Confirmation Dialog */}
        {showExitConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold text-slate-800">Exit Checkpoint?</h3>
              <p className="text-slate-600 mt-2">
                Your progress will be lost. Are you sure you want to exit?
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleExitCancel}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExitConfirm}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Exit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Network Error Retry Dialog */}
        {networkError && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold text-slate-800">Network Error</h3>
              <p className="text-slate-600 mt-2">
                We couldn&apos;t reach the server. Your answers are safe. Retry?
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setNetworkError(false)}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRetrySubmit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback spinner for loading/validating states
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loading />
    </div>
  );
}

export default CheckpointScreen;
