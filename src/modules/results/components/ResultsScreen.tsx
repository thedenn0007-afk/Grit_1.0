/**
 * ResultsScreen Component
 * 
 * Displays checkpoint results with:
 * - Circular score progress (CSS conic-gradient)
 * - Feedback text based on score ranges
 * - Collapsible question breakdown with Gemini-powered explanations
 * - Action buttons (Next Subtopic / Retry Checkpoint / Exit)
 * - DeepDive placeholder (respects features.deepDive flag)
 */

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "../../../lib/trpc/client";
import { featureFlags } from "../../../../config/features";

/**
 * Props for ResultsScreen component
 */
export interface ResultsScreenProps {
  attemptId: string;
  onNextSubtopic?: () => void;
  onRetry?: () => void;
  onExit?: () => void;
}

/**
 * Feedback text based on score ranges
 */
function getFeedbackText(score: number): string {
  if (score >= 70) {
    return "Strong foundation";
  }
  if (score >= 50) {
    return "Review concepts";
  }
  return "Restart recommended";
}

/**
 * Feedback color based on score ranges
 */
function getFeedbackColor(score: number): string {
  if (score >= 70) {
    return "text-green-600";
  }
  if (score >= 50) {
    return "text-yellow-600";
  }
  return "text-red-600";
}

/**
 * ResultsScreen Component
 */
export function ResultsScreen({
  attemptId,
  onNextSubtopic,
  onRetry,
  onExit,
}: ResultsScreenProps): JSX.Element {
  const router = useRouter();
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  
  // Feedback cache: questionId -> feedback string
  const [feedbackCache, setFeedbackCache] = useState<Map<string, string>>(new Map());
  // Loading states: questionIds currently generating feedback
  const [loadingFeedback, setLoadingFeedback] = useState<Set<string>>(new Set());

  // Fetch attempt data using tRPC
  const { data: attempt, isLoading, error } = trpc.results.get.useQuery(
    { attemptId },
    {
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  // Fetch feedback for a specific question
  const fetchFeedback = useCallback(async (
    questionId: string,
    questionText: string,
    userAnswer: string,
    correctAnswer: string
  ): Promise<void> => {
    // Skip if already cached or loading
    if (feedbackCache.has(questionId) || loadingFeedback.has(questionId)) {
      return;
    }

    // Add to loading state
    setLoadingFeedback((prev) => new Set(prev).add(questionId));

    try {
      const response = await fetch("/api/gemini/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questionText,
          userAnswer,
          correctAnswer,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Feedback API error:", errorData);
        throw new Error(errorData.error || "Failed to generate feedback");
      }

      const data = await response.json();
      
      // Cache the feedback
      setFeedbackCache((prev) => {
        const next = new Map(prev);
        next.set(questionId, data.feedback);
        return next;
      });
    } catch (err) {
      console.error("Failed to fetch feedback:", err);
    } finally {
      // Remove from loading state
      setLoadingFeedback((prev) => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
    }
  }, [feedbackCache, loadingFeedback]);

  // Toggle question expansion and fetch feedback if needed
  const toggleQuestion = useCallback((questionId: string): void => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      const isExpanding = !next.has(questionId);
      
      if (isExpanding) {
        next.add(questionId);
        
        // Find the question data and fetch feedback if incorrect
        if (attempt) {
          const question = attempt.questions.find((q) => q.id === questionId);
          const userAnswer = attempt.userAnswers.find((ua) => ua.questionId === questionId);
          
          if (question && userAnswer && !userAnswer.isCorrect) {
            // Get user answer text
            let userAnswerText: string;
            if (question.type === "mcq" && question.options && userAnswer.selectedAnswer !== undefined) {
              const answerIndex = typeof userAnswer.selectedAnswer === "number" 
                ? userAnswer.selectedAnswer 
                : parseInt(String(userAnswer.selectedAnswer), 10);
              userAnswerText = question.options[answerIndex] ?? "No answer";
            } else {
              userAnswerText = String(userAnswer.selectedAnswer ?? "No answer");
            }

            // Get correct answer text
            let correctAnswerText: string;
            if (question.type === "mcq" && question.options && question.correctAnswerIndex !== undefined) {
              correctAnswerText = question.options[question.correctAnswerIndex];
            } else {
              correctAnswerText = "See explanation";
            }

            // Fetch feedback
            fetchFeedback(questionId, question.questionText, userAnswerText, correctAnswerText);
          }
        }
      } else {
        next.delete(questionId);
      }
      
      return next;
    });
  }, [attempt, fetchFeedback]);

  // Handle next subtopic action
  const handleNextSubtopic = useCallback((): void => {
    if (attempt?.nextSubtopicId) {
      // Navigate to next subtopic content
      router.push(`/modules/content?subtopicId=${attempt.nextSubtopicId}`);
    } else if (onNextSubtopic) {
      onNextSubtopic();
    } else {
      router.push("/modules/dashboard");
    }
  }, [onNextSubtopic, router, attempt]);

  // Handle retry action
  const handleRetry = useCallback((): void => {
    if (onRetry) {
      onRetry();
    } else if (attempt?.subtopicId) {
      router.push(`/modules/checkpoint?subtopicId=${attempt.subtopicId}`);
    }
  }, [onRetry, attempt, router]);

  // Handle exit action
  const handleExit = useCallback((): void => {
    if (onExit) {
      onExit();
    } else {
      router.push("/modules/dashboard");
    }
  }, [onExit, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading results...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !attempt) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600">Failed to load results</p>
          <button
            type="button"
            onClick={handleExit}
            className="mt-4 px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { totalScore, canProgress, questions, userAnswers, subtopicTitle } = attempt;

  // Build question display data
  const questionData = useMemo(() => {
    return questions.map((question) => {
      const userAnswer = userAnswers.find((ua) => ua.questionId === question.id);
      let userAnswerText: string;

      if (question.type === "mcq" && question.options && userAnswer) {
        const answerIndex = typeof userAnswer.selectedAnswer === "number" 
          ? userAnswer.selectedAnswer 
          : parseInt(String(userAnswer.selectedAnswer), 10);
        userAnswerText = question.options[answerIndex] ?? "No answer";
      } else {
        userAnswerText = String(userAnswer?.selectedAnswer ?? "No answer");
      }

      let correctAnswerText: string;
      if (question.type === "mcq" && question.options && question.correctAnswerIndex !== undefined) {
        correctAnswerText = question.options[question.correctAnswerIndex];
      } else {
        correctAnswerText = "See explanation";
      }

      return {
        ...question,
        isCorrect: userAnswer?.isCorrect ?? false,
        userAnswerText,
        correctAnswerText,
      };
    });
  }, [questions, userAnswers]);

  // CSS conic-gradient for circular progress
  const circularProgressStyle = useMemo((): React.CSSProperties => {
    const gradient = `conic-gradient(
      ${totalScore >= 70 ? "#16a34a" : totalScore >= 50 ? "#eab308" : "#dc2626"} ${totalScore}%,
      #e2e8f0 ${totalScore}%
    )`;
    return {
      background: gradient,
    };
  }, [totalScore]);

  const feedbackText = getFeedbackText(totalScore);
  const feedbackColor = getFeedbackColor(totalScore);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-800">Checkpoint Results</h1>
        <p className="mt-2 text-lg text-slate-600">{subtopicTitle}</p>
      </div>

      {/* Score Display */}
      <div className="flex flex-col items-center">
        {/* Circular Progress */}
        <div className="relative w-40 h-40">
          <div
            className="w-full h-full rounded-full"
            style={circularProgressStyle}
          ></div>
          <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
            <div className="text-center">
              <span className="text-4xl font-bold text-slate-800">{totalScore}%</span>
            </div>
          </div>
        </div>

        {/* Feedback Text */}
        <p className={`mt-4 text-xl font-semibold ${feedbackColor}`}>
          {feedbackText}
        </p>

        {/* Can Progress Indicator */}
        {canProgress && (
          <p className="mt-2 text-green-600 font-medium">
            ✓ You can proceed to the next subtopic
          </p>
        )}
        {!canProgress && (
          <p className="mt-2 text-slate-500">
            Score 70% or higher to unlock the next subtopic
          </p>
        )}
      </div>

      {/* Question Breakdown */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">Question Breakdown</h2>
        
        {questionData.map((question, index) => {
          const isLoadingGeminiFeedback = loadingFeedback.has(question.id);
          const geminiFeedback = feedbackCache.get(question.id);
          
          return (
            <div
              key={question.id}
              className="border border-slate-200 rounded-lg overflow-hidden"
            >
              {/* Question Header - Clickable */}
              <button
                type="button"
                onClick={() => toggleQuestion(question.id)}
                className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-500">
                    Question {index + 1}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      question.difficulty === "easy"
                        ? "bg-green-100 text-green-700"
                        : question.difficulty === "medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                  </span>
                  {/* Gemini indicator for incorrect answers */}
                  {!question.isCorrect && geminiFeedback && (
                    <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700">
                      AI Feedback
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-medium ${
                      question.isCorrect ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {question.isCorrect ? "Correct" : "Incorrect"}
                  </span>
                  <svg
                    className={`w-5 h-5 text-slate-400 transition-transform ${
                      expandedQuestions.has(question.id) ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {/* Question Details - Collapsible */}
              {expandedQuestions.has(question.id) && (
                <div className="px-4 py-4 space-y-4 bg-white">
                  <p className="font-medium text-slate-800">{question.questionText}</p>

                  {/* User's Answer */}
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-600">Your answer:</p>
                    <p
                      className={`p-3 rounded ${
                        question.isCorrect ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}
                    >
                      {question.userAnswerText}
                    </p>
                  </div>

                  {/* Correct Answer */}
                  {!question.isCorrect && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-600">Correct answer:</p>
                      <p className="p-3 rounded bg-green-50 text-green-700">
                        {question.correctAnswerText}
                      </p>
                    </div>
                  )}

                  {/* Gemini AI Feedback - Only for incorrect answers */}
                  {!question.isCorrect && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-600">AI Explanation:</p>
                        {isLoadingGeminiFeedback && (
                          <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
                        )}
                      </div>
                      {isLoadingGeminiFeedback ? (
                        <p className="p-3 rounded bg-purple-50 text-purple-700 italic">
                          Generating AI explanation...
                        </p>
                      ) : geminiFeedback ? (
                        <p className="p-3 rounded bg-purple-50 text-purple-800">
                          {geminiFeedback}
                        </p>
                      ) : (
                        /* Fallback to static explanation if no Gemini feedback */
                        <p className="p-3 rounded bg-slate-50 text-slate-700">
                          {question.explanation}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Static Explanation - Only for correct answers */}
                  {question.isCorrect && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-600">Explanation:</p>
                      <p className="p-3 rounded bg-slate-50 text-slate-700">
                        {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {canProgress && (
          <button
            type="button"
            onClick={handleNextSubtopic}
            className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            Next Subtopic
          </button>
        )}
        {!canProgress && (
          <button
            type="button"
            onClick={handleRetry}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Checkpoint
          </button>
        )}
        <button
          type="button"
          onClick={handleExit}
          className="px-6 py-3 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition-colors"
        >
          Exit
        </button>
      </div>

      {/* DeepDive Placeholder */}
      {!featureFlags.deepDive && (
        <div className="mt-8 p-6 bg-slate-100 rounded-lg border border-slate-200">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <p className="text-slate-500">
              Deeper exploration — statistical foundations, optimization mathematics, research applications — unlocking in next update
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResultsScreen;
