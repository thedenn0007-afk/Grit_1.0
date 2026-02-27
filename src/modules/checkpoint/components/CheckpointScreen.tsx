/**
 * CheckpointScreen Component
 * 
 * Main checkpoint screen with state machine:
 * loading -> question -> validating -> next -> submit -> complete
 * 
 * Features:
 * - Fetches questions via tRPC
 * - State machine for question flow
 * - Exit handler with confirmation dialog
 * - Answer state stored in React state only
 * - No localStorage, no partial persistence
 */

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { trpc } from "../../../lib/trpc/client";
import { QuestionCard } from "./QuestionCard";
import { useCheckpointState, validateAnswer, type CheckpointQuestion, type CheckpointAnswer } from "../hooks/useCheckpointState";
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
  // State for exit confirmation dialog
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

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

  // Use checkpoint state hook
  const {
    state: checkpointState,
    currentQuestion,
    currentAnswer,
    totalQuestions,
    answeredCount,
    canGoNext,
    canGoPrevious,
    isLastQuestion,
    selectAnswer,
    nextQuestion,
    previousQuestion,
    submitCheckpoint,
    setComplete,
    resetCheckpoint,
  } = useCheckpointState(questions);
  // include resetCheckpoint to allow discarding answers on exit
  // (hook values pulled from a single call above)

  // Mutation to persist exit point data when user exits checkpoint
  const saveProgressMutation = trpc.progress.save.useMutation();

  // Track short answer attempts
  const [shortAnswerAttempts, setShortAnswerAttempts] = useState<Map<string, number>>(new Map());
  const toast = useToast();
  const router = useRouter();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [networkError, setNetworkError] = useState<boolean>(false);

  // Calculate current question's attempts remaining
  const currentAttemptsRemaining = useMemo((): number => {
    if (!currentQuestion || currentQuestion.type !== "shortAnswer") {
      return 3;
    }
    const attempts = shortAnswerAttempts.get(currentQuestion.id) || 0;
    return Math.max(0, 3 - attempts);
  }, [currentQuestion, shortAnswerAttempts]);

  // Handle exit with confirmation
  const handleExitClick = useCallback((): void => {
    setShowExitConfirm(true);
  }, []);

  const handleExitConfirm = useCallback((): void => {
    // Create exit point data
    const exitPointData: ExitPointData = {
      type: "checkpoint",
      timestamp: Date.now(),
    };

    // Persist exit point via progress save mutation (best-effort)
    (async () => {
      try {
        await saveProgressMutation.mutateAsync({
          subtopicId,
          position: 0,
          timestamp: exitPointData.timestamp,
        });
      } catch (e) {
        // Log failure but continue to discard answers
        // eslint-disable-next-line no-console
        console.error("Failed to save exit point:", e);
      }

      // Reset checkpoint answers in memory and call onExit
      try {
        resetCheckpoint();
      } catch {}

      onExit();
    })();
  }, [onExit, resetCheckpoint, subtopicId]);

  const handleExitCancel = useCallback((): void => {
    setShowExitConfirm(false);
  }, []);

  // Handle short answer submission
  const handleShortAnswerSubmit = useCallback(
    (questionId: string, answer: string): void => {
      const question = questions.find((q) => q.id === questionId);
      if (!question || question.type !== "shortAnswer") return;

      // Check if answer is correct
      const isCorrect = validateAnswer(question, answer);

      // Update attempts
      const currentAttempts = shortAnswerAttempts.get(questionId) || 0;
      const newAttempts = new Map(shortAnswerAttempts);
      newAttempts.set(questionId, currentAttempts + 1);
      setShortAnswerAttempts(newAttempts);

      // Store the answer
      selectAnswer(answer);

      // If correct or max attempts reached, move to next
      if (isCorrect || currentAttempts + 1 >= 3) {
        // Brief delay before next question
        setTimeout(() => {
          if (!isLastQuestion) {
            nextQuestion();
          }
        }, 1000);
      }
    },
    [questions, selectAnswer, shortAnswerAttempts, isLastQuestion, nextQuestion]
  );

  // Handle checkpoint submission
  const handleSubmitCheckpoint = useCallback((): void => {
    // Trigger submission mutation which persists attempt atomically on the server
    (async () => {
      const result = submitCheckpoint();

      // Prepare payload
      const payload = {
        subtopicId,
        answers: result.answers.map((a) => ({ questionId: a.questionId, selectedAnswer: a.selectedAnswer })),
        timeSpentSeconds: 0,
      };

      try {
        setSubmitting(true);
        // Use type assertion to work around tRPC typing issue
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mutation: any = trpc.submitCheckpoint;
        const res: any = await mutation.mutateAsync(payload);

        // Mark complete locally and navigate to results
        setComplete(res.score);
        onComplete(res.score, res.canProgress);
        router.push(`/subtopic/${subtopicId}/results?attemptId=${res.attemptId}`);
      } catch (e: any) {
        // Network error (e.g., failed to fetch) - show retry dialog
        const isNetwork = e?.message && String(e.message).toLowerCase().includes("fetch") || e?.name === "TypeError";
        if (isNetwork) {
          setNetworkError(true);
        } else {
          // Server error - show toast and keep answers in memory
          toast.error("Submission failed", e?.message || "Server error during submission");
        }
      } finally {
        setSubmitting(false);
      }
    })();
  }, [submitCheckpoint, questions, setComplete, onComplete]);

  const handleRetrySubmit = useCallback((): void => {
    setNetworkError(false);
    handleSubmitCheckpoint();
  }, [handleSubmitCheckpoint]);

  // Render loading state
  if (isLoadingQuestions) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    );
  }

  // Render error state
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

  // Render empty state
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

  // Render question state
  if (checkpointState.status === "question" || checkpointState.status === "submit") {
    const progressPercentage = Math.round((answeredCount / totalQuestions) * 100);

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
            onAnswerChange={
              currentQuestion.type === "shortAnswer"
                ? (answer) => handleShortAnswerSubmit(currentQuestion.id, String(answer))
                : selectAnswer
            }
            validationState="idle"
            attemptsRemaining={currentQuestion.type === "shortAnswer" ? currentAttemptsRemaining : 3}
            disabled={checkpointState.status === "submit"}
          />
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8">
          <button
            type="button"
            onClick={previousQuestion}
            disabled={!canGoPrevious}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          {checkpointState.status === "submit" || answeredCount === totalQuestions ? (
            <button
              type="button"
              onClick={handleSubmitCheckpoint}
              disabled={answeredCount !== totalQuestions || submitting}
              className={`px-6 py-2 rounded-lg transition-colors font-medium ${
                answeredCount !== totalQuestions || submitting
                  ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {submitting ? "Submitting..." : "Submit Checkpoint"}
            </button>
          ) : isLastQuestion ? (
            <button
              type="button"
              onClick={nextQuestion}
              disabled={!currentAnswer}
              className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Finish
            </button>
          ) : (
            <button
              type="button"
              onClick={nextQuestion}
              disabled={!currentAnswer}
              className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          )}
        </div>

        {/* Question Dots Indicator */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {questions.map((_, index) => {
            const isAnswered = checkpointState.answers.has(questions[index].id);
            const isCurrent = index === checkpointState.currentIndex;

            return (
              <button
                key={`dot-${index}`}
                type="button"
                onClick={() => {
                  // Navigate to this question
                  const state = checkpointState;
                  if (index < state.currentIndex || index === state.currentIndex) {
                    // For previous questions, we can't go back easily without implementing goToQuestion
                    // This is a simplified version
                  }
                }}
                disabled={index > checkpointState.currentIndex}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  isCurrent
                    ? "bg-blue-500"
                    : isAnswered
                    ? "bg-green-500"
                    : "bg-slate-300"
                } ${index <= checkpointState.currentIndex ? "cursor-pointer" : "cursor-not-allowed"}`}
                aria-label={`Go to question ${index + 1}`}
              />
            );
          })}
        </div>

        {/* Exit Confirmation Dialog */}
        {showExitConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold text-slate-800">
                Exit Checkpoint?
              </h3>
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
        {/* Network error (retry) dialog */}
        {networkError && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold text-slate-800">Network Error</h3>
              <p className="text-slate-600 mt-2">We couldn't reach the server. Your answers are safe. Retry?</p>
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

  // Render loading/validating states
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loading />
    </div>
  );
}

export default CheckpointScreen;
