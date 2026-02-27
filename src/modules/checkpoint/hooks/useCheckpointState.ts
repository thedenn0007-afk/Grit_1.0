/**
 * useCheckpointState Hook
 * 
 * Manages checkpoint state machine and answer storage.
 * Answers stored in React state only - no localStorage, no API calls until submit.
 */

import { useState, useCallback, useMemo } from "react";
import type { MCQuestion, ShortAnswerQuestion } from "../../../lib/question-generator/engine";

/**
 * Question types for the checkpoint
 */
export type CheckpointQuestion = MCQuestion | ShortAnswerQuestion;

/**
 * Answer type - number for MCQ (option index), string for ShortAnswer
 */
export type CheckpointAnswer = number | string;

/**
 * Checkpoint state machine states
 */
export type CheckpointStateStatus =
  | "loading"
  | "question"
  | "validating"
  | "next"
  | "submit"
  | "complete";

/**
 * Checkpoint state interface
 */
export interface CheckpointState {
  status: CheckpointStateStatus;
  currentIndex: number;
  questions: CheckpointQuestion[];
  answers: Map<string, CheckpointAnswer>;
  score: number | null;
  error: string | null;
}

/**
 * Checkpoint result for submission
 */
export interface CheckpointResult {
  answers: Array<{ questionId: string; selectedAnswer: number | string }>;
  totalQuestions: number;
  answeredQuestions: number;
}

/**
 * Initial checkpoint state
 */
const initialState: CheckpointState = {
  status: "loading",
  currentIndex: 0,
  questions: [],
  answers: new Map(),
  score: null,
  error: null,
};

/**
 * useCheckpointState hook
 * @param questions - Array of checkpoint questions
 * @returns State and functions for checkpoint management
 */
export function useCheckpointState(
  questions: CheckpointQuestion[]
): {
  state: CheckpointState;
  currentQuestion: CheckpointQuestion | null;
  currentAnswer: CheckpointAnswer | null;
  totalQuestions: number;
  answeredCount: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isLastQuestion: boolean;
  selectAnswer: (answer: CheckpointAnswer) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (index: number) => void;
  submitCheckpoint: () => CheckpointResult;
  resetCheckpoint: () => void;
  setError: (error: string | null) => void;
  setValidating: () => void;
  setComplete: (score: number) => void;
} {
  const [state, setState] = useState<CheckpointState>({
    ...initialState,
    questions,
    status: questions.length > 0 ? "question" : "loading",
  });

  // Update questions when they change
  useState(() => {
    if (questions.length > 0 && state.status === "loading") {
      setState((prev) => ({
        ...prev,
        questions,
        status: "question",
      }));
    }
  });

  const totalQuestions = state.questions.length;

  const currentQuestion = useMemo((): CheckpointQuestion | null => {
    if (state.questions.length === 0) return null;
    return state.questions[state.currentIndex] || null;
  }, [state.questions, state.currentIndex]);

  const currentAnswer = useMemo((): CheckpointAnswer | null => {
    if (!currentQuestion) return null;
    return state.answers.get(currentQuestion.id) || null;
  }, [state.answers, currentQuestion]);

  const answeredCount = useMemo((): number => {
    return state.answers.size;
  }, [state.answers]);

  const canGoNext = useMemo((): boolean => {
    return currentAnswer !== null && state.currentIndex < totalQuestions - 1;
  }, [currentAnswer, state.currentIndex, totalQuestions]);

  const canGoPrevious = useMemo((): boolean => {
    return state.currentIndex > 0;
  }, [state.currentIndex]);

  const isLastQuestion = useMemo((): boolean => {
    return state.currentIndex === totalQuestions - 1;
  }, [state.currentIndex, totalQuestions]);

  const selectAnswer = useCallback(
    (answer: CheckpointAnswer): void => {
      if (!currentQuestion) return;

      setState((prev) => {
        const newAnswers = new Map(prev.answers);
        newAnswers.set(currentQuestion.id, answer);

        return {
          ...prev,
          answers: newAnswers,
          // Check if all questions are answered for auto-submit state
          status: newAnswers.size === totalQuestions ? "submit" : prev.status,
        };
      });
    },
    [currentQuestion, totalQuestions]
  );

  const nextQuestion = useCallback((): void => {
    setState((prev) => {
      if (prev.currentIndex >= totalQuestions - 1) {
        return prev;
      }

      return {
        ...prev,
        currentIndex: prev.currentIndex + 1,
        status: "question",
      };
    });
  }, [totalQuestions]);

  const previousQuestion = useCallback((): void => {
    setState((prev) => {
      if (prev.currentIndex <= 0) {
        return prev;
      }

      return {
        ...prev,
        currentIndex: prev.currentIndex - 1,
        status: "question",
      };
    });
  }, []);

  const goToQuestion = useCallback((index: number): void => {
    setState((prev) => {
      if (index < 0 || index >= totalQuestions) {
        return prev;
      }

      return {
        ...prev,
        currentIndex: index,
        status: "question",
      };
    });
  }, [totalQuestions]);

  const submitCheckpoint = useCallback((): CheckpointResult => {
    const answersArray: Array<{ questionId: string; selectedAnswer: number | string }> = [];

    state.questions.forEach((question) => {
      const answer = state.answers.get(question.id);
      if (answer !== undefined) {
        answersArray.push({
          questionId: question.id,
          selectedAnswer: answer,
        });
      }
    });

    return {
      answers: answersArray,
      totalQuestions,
      answeredQuestions: answeredCount,
    };
  }, [state.questions, state.answers, totalQuestions, answeredCount]);

  const resetCheckpoint = useCallback((): void => {
    setState({
      ...initialState,
      questions,
      status: questions.length > 0 ? "question" : "loading",
    });
  }, [questions]);

  const setError = useCallback((error: string | null): void => {
    setState((prev) => ({
      ...prev,
      error,
    }));
  }, []);

  const setValidating = useCallback((): void => {
    setState((prev) => ({
      ...prev,
      status: "validating",
    }));
  }, []);

  const setComplete = useCallback((score: number): void => {
    setState((prev) => ({
      ...prev,
      status: "complete",
      score,
    }));
  }, []);

  return {
    state,
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
    goToQuestion,
    submitCheckpoint,
    resetCheckpoint,
    setError,
    setValidating,
    setComplete,
  };
}

/**
 * Check if answer is correct for a question
 * @param question - The question to check
 * @param answer - The user's answer
 * @returns Boolean indicating if answer is correct
 */
export function validateAnswer(
  question: CheckpointQuestion,
  answer: CheckpointAnswer
): boolean {
  if (question.type === "mcq") {
    return answer === question.correctAnswerIndex;
  }

  if (question.type === "shortAnswer") {
    // Semantic matching: check if any keyword from acceptable answers is present
    const userAnswerLower = String(answer).toLowerCase().trim();
    
    for (const acceptable of question.acceptableAnswers) {
      const acceptableAnswerLower = acceptable.toLowerCase();
      
      // Split into words and check for keyword presence
      const keywords = acceptableAnswerLower.split(/\s+/).filter((word) => word.length > 3);
      
      const matchedKeywords = keywords.filter((keyword) =>
        userAnswerLower.includes(keyword)
      );
      
      // Consider correct if at least 50% of keywords match
      if (keywords.length > 0 && matchedKeywords.length >= Math.ceil(keywords.length * 0.5)) {
        return true;
      }
    }
    
    // Also check for exact or near-match against first acceptable answer
    if (userAnswerLower.length > 0 && question.acceptableAnswers.length > 0) {
      const firstAcceptableLower = question.acceptableAnswers[0].toLowerCase();
      const similarity = calculateSimilarity(userAnswerLower, firstAcceptableLower);
      if (similarity > 0.7) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Calculate string similarity using Levenshtein-like approach
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity score between 0 and 1
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) {
    return 1.0;
  }

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Edit distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

export default useCheckpointState;
