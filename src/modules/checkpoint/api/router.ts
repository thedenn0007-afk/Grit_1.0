/**
 * Checkpoint API Router
 * 
 * tRPC router for checkpoint-related operations.
 * Uses question generator engine to generate question sets in-memory.
 * No database storage for questions.
 */

import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";
import superjson from "superjson";
import type { Context } from "../../../lib/trpc/context";
import {
  generateQuestionSet,
  type QuestionSetResult,
  type MCQuestion,
  type ShortAnswerQuestion,
  type DifficultyLevel,
} from "../../../lib/question-generator/engine";
import { validateShortAnswer } from "../../../lib/gemini/validation";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

/**
 * Input validation schema for checkpoint generation
 */
const GenerateCheckpointInputSchema = z.object({
  subtopicId: z.string().min(1, "subtopicId is required"),
  complexityScore: z
    .number()
    .int()
    .min(1)
    .max(4, "complexityScore must be between 1 and 4"),
  adaptationModifier: z
    .number()
    .int()
    .min(0)
    .max(2, "adaptationModifier must be between 0 and 2"),
});

/**
 * Type for validated checkpoint generation input
 */
export type GenerateCheckpointInput = z.infer<typeof GenerateCheckpointInputSchema>;

/**
 * Checkpoint router with generate query
 */
export const checkpointRouter = t.router({
  /**
   * Generate a question set for a checkpoint
   * 
   * Returns 5-10 questions based on complexity formula:
   * - count = min(5 + (complexityScore - 1) + adaptationModifier, 10)
   * - Questions are mixed MCQ and ShortAnswer types
   * - Difficulty ramps from easy to hard implicitly in ordering
   * - Questions stored in memory only, no database save
   */
  generate: t.procedure
    .input(GenerateCheckpointInputSchema)
    .query(
      (
        { input }: { input: GenerateCheckpointInput }
      ): QuestionSetResult => {
        const { subtopicId, complexityScore, adaptationModifier } = input;

        // Generate question set using the engine
        const questionSet = generateQuestionSet({
          subtopicId,
          complexityScore,
          adaptationModifier,
        });

        // Return generated questions (in-memory only)
        return questionSet;
      }
    ),
});

/**
 * Helper function to validate checkpoint generation input
 * @param data - Raw input data
 * @returns Validated input
 * @throws TRPCError if validation fails
 */
export function validateCheckpointInput(
  data: unknown
): GenerateCheckpointInput {
  const result = GenerateCheckpointInputSchema.safeParse(data);
  
  if (!result.success) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid input for checkpoint generation",
      cause: result.error,
    });
  }
  
  return result.data;
}

/**
 * Input validation schema for checkpoint submission
 */
const SubmitCheckpointInputSchema = z.object({
  subtopicId: z.string().min(1, "subtopicId is required"),
  answers: z.array(
    z.object({
      questionId: z.string().min(1, "questionId is required"),
      selectedAnswer: z.union([z.number(), z.string()]),
    })
  ),
  timeSpentSeconds: z.number().min(0, "timeSpentSeconds must be non-negative"),
});

/**
 * Type for validated checkpoint submission input
 */
export type SubmitCheckpointInput = z.infer<typeof SubmitCheckpointInputSchema>;

/**
 * Score breakdown by difficulty category
 */
export interface ScoreBreakdown {
  foundation: number; // easy questions - 40% weight
  application: number; // medium questions - 35% weight
  synthesis: number; // hard questions - 25% weight
}

/**
 * Internal category scores for calculation
 */
interface CategoryScoreInternal {
  correct: number;
  total: number;
}

/**
 * Category scores map for internal tracking
 */
type CategoryScoresMap = {
  foundation: CategoryScoreInternal;
  application: CategoryScoreInternal;
  synthesis: CategoryScoreInternal;
};

/**
 * Score entry with Gemini validation info
 */
export interface ScoreEntry {
  isCorrect: boolean;
  geminiValidated: boolean;
}

/**
 * Checkpoint submission result
 */
export interface SubmitCheckpointResult {
  score: number;
  breakdown: ScoreBreakdown;
  canProgress: boolean;
  attemptId: string;
}

/**
 * Validate a single answer against a question
 * Uses Gemini for short answer questions, exact match for MCQ
 */
async function validateAnswer(
  question: MCQuestion | ShortAnswerQuestion,
  selectedAnswer: number | string
): Promise<ScoreEntry> {
  if (question.type === "mcq") {
    // MCQ: exact match (no Gemini needed)
    return {
      isCorrect: selectedAnswer === question.correctAnswerIndex,
      geminiValidated: false,
    };
  }

  if (question.type === "shortAnswer") {
    const userAnswer = String(selectedAnswer);
    
    try {
      // Use Gemini for semantic validation
      const isCorrect = await validateShortAnswer(
        question.questionText,
        userAnswer,
        Array.from(question.acceptableAnswers)
      );
      
      return {
        isCorrect,
        geminiValidated: true,
      };
    } catch (error) {
      // Fallback to keyword matching if Gemini fails
      console.error("Gemini validation failed, falling back to keyword matching:", error);
      
      const userAnswerLower = userAnswer.toLowerCase().trim();

      for (const acceptable of question.acceptableAnswers) {
        const acceptableLower = acceptable.toLowerCase();

        // Check for keyword presence (at least 50% of keywords)
        const keywords = acceptableLower.split(/\s+/).filter(
          (word: string): boolean => word.length > 3
        );
        const matchedKeywords = keywords.filter((keyword: string): boolean =>
          userAnswerLower.includes(keyword)
        );

        if (
          keywords.length > 0 &&
          matchedKeywords.length >= Math.ceil(keywords.length * 0.5)
        ) {
          return {
            isCorrect: true,
            geminiValidated: false,
          };
        }

        // Check for similarity (Levenshtein-like)
        if (userAnswerLower.length > 0) {
          const similarity = calculateSimilarity(
            userAnswerLower,
            acceptableLower
          );
          if (similarity > 0.7) {
            return {
              isCorrect: true,
              geminiValidated: false,
            };
          }
        }
      }
    }
  }

  return {
    isCorrect: false,
    geminiValidated: false,
  };
}

/**
 * Calculate string similarity
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
 * Calculate Levenshtein distance
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

/**
 * Get weight for difficulty level
 */
function getDifficultyWeight(difficulty: DifficultyLevel): number {
  switch (difficulty) {
    case "easy":
      return 0.4; // Foundation - 40%
    case "medium":
      return 0.35; // Application - 35%
    case "hard":
      return 0.25; // Synthesis - 25%
  }
}

/**
 * Get category name for difficulty
 */
function getDifficultyCategory(difficulty: DifficultyLevel): keyof ScoreBreakdown {
  switch (difficulty) {
    case "easy":
      return "foundation";
    case "medium":
      return "application";
    case "hard":
      return "synthesis";
  }
}

/**
 * Helper to get user ID from session
 */
function getUserIdFromSession(ctx: { session: Context["session"] }): string | null {
  const session = ctx.session;
  if (!session) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (session as any).user?.id ?? null;
}

// Add submit mutation to the router
const checkpointRouterWithSubmit = t.router({
  /**
   * Generate a question set for a checkpoint
   */
  generate: t.procedure
    .input(GenerateCheckpointInputSchema)
    .query(
      (
        input: {
          input: GenerateCheckpointInput;
        }
      ): QuestionSetResult => {
        const { subtopicId, complexityScore, adaptationModifier } = input.input;

        const questionSet = generateQuestionSet({
          subtopicId,
          complexityScore,
          adaptationModifier,
        });

        return questionSet;
      }
    ),

  /**
   * Submit checkpoint answers and calculate score
   * 
   * Uses Prisma transaction for atomicity:
   * 1. Validate all answers
   * 2. Calculate weighted score by difficulty
   * 3. Create ATTEMPT record
   * 4. Update USER_PROGRESS based on score
   */
  submit: t.procedure
    .input(SubmitCheckpointInputSchema)
    .mutation(
      async (
        input: {
          input: SubmitCheckpointInput;
          ctx: Context;
        }
      ): Promise<SubmitCheckpointResult> => {
        const { subtopicId, answers, timeSpentSeconds } = input.input;
        const ctx = input.ctx;

        // Get user ID from session
        const userId = getUserIdFromSession(ctx);
        if (!userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User must be authenticated to submit checkpoint",
          });
        }

        // Get subtopic to determine complexity score
        const subtopic = await ctx.prisma.subtopic.findUnique({
          where: { id: subtopicId },
        });

        if (!subtopic) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Subtopic not found",
          });
        }

        // Generate questions for validation (using default adaptation modifier)
        const questionSet = generateQuestionSet({
          subtopicId,
          complexityScore: subtopic.complexityScore,
          adaptationModifier: 1,
        });

        // Build question lookup map
        const questionMap = new Map<
          string,
          MCQuestion | ShortAnswerQuestion
        >();
        for (const question of questionSet.questions) {
          questionMap.set(question.id, question);
        }

        // Validate answers and build score breakdown
        const scores: Record<string, ScoreEntry> = {};
        const categoryScoresInternal: CategoryScoresMap = {
          foundation: { correct: 0, total: 0 },
          application: { correct: 0, total: 0 },
          synthesis: { correct: 0, total: 0 },
        };

        for (const answer of answers) {
          const question = questionMap.get(answer.questionId);
          if (!question) {
            // Question not found, mark as incorrect
            scores[answer.questionId] = { isCorrect: false, geminiValidated: false };
            continue;
          }

          // Await the async validateAnswer function
          const scoreEntry = await validateAnswer(question, answer.selectedAnswer);
          scores[answer.questionId] = scoreEntry;

          // Track by difficulty category
          const category = getDifficultyCategory(question.difficulty);
          categoryScoresInternal[category].total++;
          if (scoreEntry.isCorrect) {
            categoryScoresInternal[category].correct++;
          }
        }

        // Calculate weighted score
        const foundationScore =
          categoryScoresInternal.foundation.total > 0
            ? (categoryScoresInternal.foundation.correct /
                categoryScoresInternal.foundation.total) *
              100
            : 0;
        const applicationScore =
          categoryScoresInternal.application.total > 0
            ? (categoryScoresInternal.application.correct /
                categoryScoresInternal.application.total) *
              100
            : 0;
        const synthesisScore =
          categoryScoresInternal.synthesis.total > 0
            ? (categoryScoresInternal.synthesis.correct /
                categoryScoresInternal.synthesis.total) *
              100
            : 0;

        const totalScore = Math.round(
          foundationScore * 0.4 +
            applicationScore * 0.35 +
            synthesisScore * 0.25
        );

        const canProgress = totalScore >= 70;

        // Use Prisma transaction for atomicity
        const attempt = await ctx.prisma.$transaction(
          async (tx): Promise<{
            id: string;
          }> => {
            // Create attempt record
            const newAttempt = await tx.attempt.create({
              data: {
                userId,
                subtopicId,
                questionsJson: JSON.stringify(
                  questionSet.questions.map((q) => q.id)
                ),
                answersJson: JSON.stringify(answers),
                scoresJson: JSON.stringify(scores),
                totalScore,
                timeSpentSeconds,
              },
            });

            // Update user progress
            if (canProgress) {
              // User passed - mark as completed
              await tx.userProgress.upsert({
                where: {
                  userId_subtopicId: {
                    userId,
                    subtopicId,
                  },
                },
                update: {
                  status: "completed",
                  currentPhase: "results",
                  exitPointJson: JSON.stringify({
                    type: "checkpoint",
                    timestamp: Date.now(),
                    score: totalScore,
                    passed: true,
                  }),
                  completedAt: new Date(),
                },
                create: {
                  userId,
                  subtopicId,
                  status: "completed",
                  currentPhase: "results",
                  exitPointJson: JSON.stringify({
                    type: "checkpoint",
                    timestamp: Date.now(),
                    score: totalScore,
                    passed: true,
                  }),
                  completedAt: new Date(),
                },
              });
            } else {
              // User did not pass - keep in progress
              await tx.userProgress.upsert({
                where: {
                  userId_subtopicId: {
                    userId,
                    subtopicId,
                  },
                },
                update: {
                  status: "in_progress",
                  currentPhase: "checkpoint",
                  exitPointJson: JSON.stringify({
                    type: "checkpoint",
                    timestamp: Date.now(),
                    score: totalScore,
                    passed: false,
                  }),
                },
                create: {
                  userId,
                  subtopicId,
                  status: "in_progress",
                  currentPhase: "checkpoint",
                  exitPointJson: JSON.stringify({
                    type: "checkpoint",
                    timestamp: Date.now(),
                    score: totalScore,
                    passed: false,
                  }),
                },
              });
            }

            return { id: newAttempt.id };
          }
        );

        return {
          score: totalScore,
          breakdown: {
            foundation: Math.round(foundationScore),
            application: Math.round(applicationScore),
            synthesis: Math.round(synthesisScore),
          },
          canProgress,
          attemptId: attempt.id,
        };
      }
    ),
});

export type CheckpointRouter = typeof checkpointRouterWithSubmit;

export default checkpointRouterWithSubmit;
