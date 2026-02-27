/**
 * QuestionCard Component
 * 
 * Renders either MCQ or ShortAnswer question based on type.
 * - MCQ: selectable options with instant visual feedback
 * - ShortAnswer: text input with hint and attempt tracking
 */

import React, { useState, useCallback, useMemo } from "react";
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
  attemptsRemaining = 3,
  onCheckAnswer,
  disabled = false,
}: QuestionCardProps): JSX.Element {
  const [shortAnswerText, setShortAnswerText] = useState<string>(
    typeof answer === "string" ? answer : ""
  );

  // Update local state when answer prop changes
  React.useEffect(() => {
    if (typeof answer === "string") {
      setShortAnswerText(answer);
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
      question={question}
      answer={answer}
      shortAnswerText={shortAnswerText}
      onShortAnswerChange={setShortAnswerText}
      onAnswerSubmit={() => onAnswerChange(shortAnswerText)}
      attemptsRemaining={attemptsRemaining}
      onCheckAnswer={onCheckAnswer}
      disabled={disabled}
    />
  );
}

/**
 * MCQuestionCard - Multiple choice question with 4 options
 */
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
  validationState,
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

  const getOptionClass = useCallback(
    (optionIndex: number): string => {
      const baseClasses = "p-4 border-2 rounded-lg cursor-pointer transition-all duration-200";
      
      if (selectedIndex === optionIndex) {
        // Selected option - blue border and background
        return `${baseClasses} border-blue-500 bg-blue-50`;
      }
      
      // Unselected options
      if (validationState !== "idle") {
        // Show validation state without revealing correct answer
        if (selectedIndex === optionIndex) {
          return `${baseClasses} border-blue-500 bg-blue-50`;
        }
        return `${baseClasses} border-slate-200 hover:border-slate-300`;
      }
      
      return `${baseClasses} border-slate-200 hover:border-slate-400 hover:bg-slate-50`;
    },
    [selectedIndex, validationState]
  );

  return (
    <div className="space-y-4">
      {/* Question Text */}
      <h3 className="text-lg font-medium text-slate-800">
        {question.questionText}
      </h3>

      {/* Difficulty Badge */}
      <div className="flex items-center gap-2">
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
      </div>

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
              {/* Option Letter */}
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-700">
                {String.fromCharCode(65 + index)}
              </span>
              {/* Option Text */}
              <span className="text-slate-700 text-left">{option}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * ShortAnswerCard - Text input with semantic matching
 */
interface ShortAnswerCardProps {
  question: ShortAnswerQuestion;
  answer: CheckpointAnswer | null;
  shortAnswerText: string;
  onShortAnswerChange: (text: string) => void;
  onAnswerSubmit: () => void;
  attemptsRemaining: number;
  onCheckAnswer?: (isCorrect: boolean) => void;
  disabled: boolean;
}

function ShortAnswerCard({
  question,
  shortAnswerText,
  onShortAnswerChange,
  onAnswerSubmit,
  attemptsRemaining,
  onCheckAnswer,
  disabled,
}: ShortAnswerCardProps): JSX.Element {
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleSubmit = useCallback((): void => {
    if (disabled || shortAnswerText.trim().length === 0) return;

    setIsSubmitted(true);
    onAnswerSubmit();
  }, [disabled, shortAnswerText, onAnswerSubmit]);

  const handleCheckAnswer = useCallback((): void => {
    // Simple check - in real app this would call validation function
    // For now, we just notify parent that answer was submitted
    if (onCheckAnswer) {
      // This would normally validate against acceptableAnswers
      // For demo, we'll just set it as submitted
      onCheckAnswer(false);
    }
  }, [onCheckAnswer]);

  const remainingAttempts = useMemo((): number => {
    return Math.max(0, attemptsRemaining - (isSubmitted ? 1 : 0));
  }, [attemptsRemaining, isSubmitted]);

  return (
    <div className="space-y-4">
      {/* Question Text */}
      <h3 className="text-lg font-medium text-slate-800">
        {question.questionText}
      </h3>

      {/* Difficulty Badge */}
      <div className="flex items-center gap-2">
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
      </div>

      {/* Text Input */}
      <div className="space-y-2">
        <textarea
          value={shortAnswerText}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            onShortAnswerChange(e.target.value)
          }
          disabled={disabled || isSubmitted}
          placeholder="Type your answer here..."
          className={`w-full p-3 border-2 rounded-lg resize-none transition-colors duration-200 ${
            isSubmitted
              ? isCorrect
                ? "border-green-500 bg-green-50"
                : "border-red-500 bg-red-50"
              : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          }`}
          rows={4}
        />

        {/* Hint */}
        {!isSubmitted && question.hint && (
          <p className="text-sm text-slate-500">
            <span className="font-medium">Hint:</span> {question.hint}
          </p>
        )}

        {/* Attempts Remaining */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Attempts remaining:{" "}
            <span className="font-medium">{remainingAttempts}</span>
          </p>

          {/* Submit Button */}
          {!isSubmitted && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={disabled || shortAnswerText.trim().length === 0}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Submit Answer
            </button>
          )}

          {/* Result Message */}
          {isSubmitted && (
            <p
              className={`text-sm font-medium ${
                isCorrect ? "text-green-600" : "text-red-600"
              }`}
            >
              {isCorrect
                ? "Correct! Well done."
                : "Not quite. Try again with a different approach."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuestionCard;
