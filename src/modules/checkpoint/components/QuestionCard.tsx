/**
 * QuestionCard Component
 *
 * Renders either MCQ or ShortAnswer question based on type.
 * - MCQ: selectable options with instant visual feedback; selecting enables Next
 * - ShortAnswer: text input with a "Check Answer" button; after checking, shows
 *   ✅ Correct or ❌ Incorrect + the correct answer, then enables Next
 */

import React, { useState, useCallback } from "react";
import type { MCQuestion, ShortAnswerQuestion } from "../../../lib/question-generator/engine";
import type { CheckpointAnswer } from "../hooks/useCheckpointState";

/**
 * Props for QuestionCard component
 */
export interface QuestionCardProps {
  question: MCQuestion | ShortAnswerQuestion;
  answer: CheckpointAnswer | null;
  onAnswerChange: (answer: CheckpointAnswer) => void;
  validationState?: "idle" | "valid" | "invalid";
  attemptsRemaining?: number;
  onCheckAnswer?: (isCorrect: boolean) => void;
  disabled?: boolean;
}

/**
 * QuestionCard Component
 */
export function QuestionCard({
  question,
  answer,
  onAnswerChange,
  validationState = "idle",
  disabled = false,
}: QuestionCardProps): JSX.Element {
  const [shortAnswerText, setShortAnswerText] = useState<string>(
    typeof answer === "string" ? answer : ""
  );

  // Reset local text when navigating to a different question
  React.useEffect(() => {
    if (typeof answer === "string") {
      setShortAnswerText(answer);
    } else if (answer === null) {
      setShortAnswerText("");
    }
  }, [answer]);

  if (question.type === "mcq") {
    return (
      <MCQuestionCard
        question={question}
        answer={answer}
        onAnswerChange={onAnswerChange}
        validationState={validationState}
        disabled={disabled}
      />
    );
  }

  return (
    <ShortAnswerCard
      question={question as ShortAnswerQuestion}
      answer={answer}
      shortAnswerText={shortAnswerText}
      onShortAnswerChange={setShortAnswerText}
      onAnswerChange={onAnswerChange}
      disabled={disabled}
    />
  );
}

// ---------------------------------------------------------------------------
// MCQuestionCard
// ---------------------------------------------------------------------------

interface MCQuestionCardProps {
  question: MCQuestion;
  answer: CheckpointAnswer | null;
  onAnswerChange: (answer: CheckpointAnswer) => void;
  validationState: "idle" | "valid" | "invalid";
  disabled: boolean;
}

function MCQuestionCard({
  question,
  answer,
  onAnswerChange,
  disabled,
}: MCQuestionCardProps): JSX.Element {
  const selectedIndex = typeof answer === "number" ? answer : null;

  const handleOptionClick = useCallback(
    (optionIndex: number): void => {
      if (disabled) return;
      onAnswerChange(optionIndex);
    },
    [onAnswerChange, disabled]
  );

  const getOptionClass = (optionIndex: number): string => {
    const base = "w-full p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 text-left";
    if (selectedIndex === optionIndex) {
      return `${base} border-blue-500 bg-blue-50`;
    }
    return `${base} border-slate-200 hover:border-slate-400 hover:bg-slate-50`;
  };

  return (
    <div className="space-y-4">
      {/* Question Text */}
      <h3 className="text-lg font-medium text-slate-800">{question.questionText}</h3>

      {/* Difficulty Badge */}
      <DifficultyBadge difficulty={question.difficulty} />

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <button
            key={`mcq-option-${index}`}
            type="button"
            onClick={() => handleOptionClick(index)}
            disabled={disabled}
            className={getOptionClass(index)}
          >
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-700">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="text-slate-700">{option}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ShortAnswerCard — simplified: 1 attempt, reveal correct answer on failure
// ---------------------------------------------------------------------------

interface ShortAnswerCardProps {
  question: ShortAnswerQuestion;
  answer: CheckpointAnswer | null;
  shortAnswerText: string;
  onShortAnswerChange: (text: string) => void;
  onAnswerChange: (answer: CheckpointAnswer) => void;
  disabled: boolean;
}

function ShortAnswerCard({
  question,
  answer,
  shortAnswerText,
  onShortAnswerChange,
  onAnswerChange,
  disabled,
}: ShortAnswerCardProps): JSX.Element {
  // Once checked we lock the input and show feedback
  const isChecked = answer !== null;

  // Determine correctness from the stored answer
  const isCorrect: boolean | null = isChecked
    ? checkShortAnswer(question, String(answer))
    : null;

  // The "canonical" correct answer to show on failure
  const correctAnswerDisplay =
    question.acceptableAnswers.length > 0 ? question.acceptableAnswers[0] : "See hint above";

  const handleCheck = useCallback((): void => {
    if (disabled || shortAnswerText.trim().length === 0) return;
    // Store the answer; the parent's selectAnswer will record it
    onAnswerChange(shortAnswerText.trim());
  }, [disabled, shortAnswerText, onAnswerChange]);

  return (
    <div className="space-y-4">
      {/* Question Text */}
      <h3 className="text-lg font-medium text-slate-800">{question.questionText}</h3>

      {/* Difficulty Badge */}
      <DifficultyBadge difficulty={question.difficulty} />

      {/* Hint (shown before answering) */}
      {!isChecked && question.hint && (
        <p className="text-sm text-slate-500">
          <span className="font-medium">Hint:</span> {question.hint}
        </p>
      )}

      {/* Text Input */}
      <textarea
        value={shortAnswerText}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          onShortAnswerChange(e.target.value)
        }
        disabled={disabled || isChecked}
        placeholder="Type your answer here..."
        className={`w-full p-3 border-2 rounded-lg resize-none transition-colors duration-200 ${isChecked
            ? isCorrect
              ? "border-green-500 bg-green-50"
              : "border-red-400 bg-red-50"
            : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          }`}
        rows={3}
      />

      {/* Check Button (only before answering) */}
      {!isChecked && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleCheck}
            disabled={disabled || shortAnswerText.trim().length === 0}
            className="px-5 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Check Answer
          </button>
        </div>
      )}

      {/* Result Feedback (after checking) */}
      {isChecked && (
        <div className="space-y-2">
          {isCorrect ? (
            <p className="flex items-center gap-2 text-green-700 font-medium">
              <span>✅</span> Correct! Well done.
            </p>
          ) : (
            <div className="space-y-1">
              <p className="flex items-center gap-2 text-red-600 font-medium">
                <span>❌</span> Incorrect.
              </p>
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm font-medium text-green-800">Correct answer:</p>
                <p className="text-green-700 mt-0.5">{correctAnswerDisplay}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simple keyword-based short answer checker (same logic as useCheckpointState.validateAnswer) */
function checkShortAnswer(question: ShortAnswerQuestion, answer: string): boolean {
  const userLower = answer.toLowerCase().trim();
  for (const acceptable of question.acceptableAnswers) {
    const acceptLower = acceptable.toLowerCase();
    const keywords = acceptLower.split(/\s+/).filter((w) => w.length > 3);
    const matched = keywords.filter((kw) => userLower.includes(kw));
    if (keywords.length > 0 && matched.length >= Math.ceil(keywords.length * 0.5)) {
      return true;
    }
    // Near-exact match
    if (userLower.length > 0 && levenshteinSimilarity(userLower, acceptLower) > 0.7) {
      return true;
    }
  }
  return false;
}

function levenshteinSimilarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;
  const dist = editDistance(longer, shorter);
  return (longer.length - dist) / longer.length;
}

function editDistance(s1: string, s2: string): number {
  const m = s2.length;
  const n = s1.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        s2[i - 1] === s1[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i][j - 1], dp[i - 1][j]);
    }
  }
  return dp[m][n];
}

function DifficultyBadge({ difficulty }: { difficulty: "easy" | "medium" | "hard" }): JSX.Element {
  const cls =
    difficulty === "easy"
      ? "bg-green-100 text-green-700"
      : difficulty === "medium"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";
  return (
    <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${cls}`}>
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </span>
  );
}

export default QuestionCard;
