/**
 * Question Generator Engine
 * 
 * Generates dynamic question sets based on complexity formula.
 * Questions are stored in memory only - no database persistence.
 * 
 * Formula: count = min(5 + (complexityScore - 1) + adaptationModifier, 10)
 * - ComplexityScore: 1-4
 * - AdaptationModifier: 0-2
 * - Result: 5-10 questions
 */

import { z } from "zod";

/**
 * Input configuration for question generation
 */
export interface QuestionGeneratorConfig {
  subtopicId: string;
  complexityScore: number;
  adaptationModifier: number;
}

/**
 * Question distribution types
 */
export type QuestionType = "mcq" | "shortAnswer";

/**
 * Question distribution structure
 */
export interface QuestionDistribution {
  mcq: number;
  shortAnswer: number;
}

/**
 * Difficulty level for questions
 */
export type DifficultyLevel = "easy" | "medium" | "hard";

/**
 * Base question interface
 */
export interface Question {
  id: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  questionText: string;
  topicId: string;
}

/**
 * Multiple Choice Question (4 options, single select)
 */
export interface MCQuestion extends Question {
  type: "mcq";
  options: readonly [string, string, string, string];
  correctAnswerIndex: 0 | 1 | 2 | 3;
  explanation: string;
}

/**
 * Short Answer Question (text input, semantic matching)
 */
export interface ShortAnswerQuestion extends Question {
  type: "shortAnswer";
  acceptableAnswers: readonly string[];
  hint: string;
}

/**
 * Question set result with count, distribution, and difficulty curve
 */
export interface QuestionSetResult {
  count: number;
  distribution: QuestionDistribution;
  difficultyCurve: DifficultyLevel[];
  questions: readonly (MCQuestion | ShortAnswerQuestion)[];
  subtopicId: string;
  generatedAt: number;
}

/**
 * Question generator configuration schema for Zod validation
 */
export const QuestionGeneratorConfigSchema = z.object({
  subtopicId: z.string().min(1, "subtopicId is required"),
  complexityScore: z.number().int().min(1).max(4, "complexityScore must be between 1 and 4"),
  adaptationModifier: z.number().int().min(0).max(2, "adaptationModifier must be between 0 and 2"),
});

/**
 * Validate question generator configuration
 * @param config - Configuration object to validate
 * @returns Validated configuration
 * @throws ZodError if validation fails
 */
export function validateQuestionGeneratorConfig(
  config: unknown
): QuestionGeneratorConfig {
  return QuestionGeneratorConfigSchema.parse(config);
}

/**
 * Calculate question count based on complexity formula
 * @param complexityScore - Base complexity (1-4)
 * @param adaptationModifier - User adaptation modifier (0-2)
 * @returns Question count between 5-10
 */
export function calculateQuestionCount(
  complexityScore: number,
  adaptationModifier: number
): number {
  const baseCount = 5;
  const complexityOffset = complexityScore - 1;
  const calculatedCount = baseCount + complexityOffset + adaptationModifier;
  return Math.min(calculatedCount, 10);
}

/**
 * Calculate question distribution based on complexity score
 * @param totalCount - Total number of questions
 * @param complexityScore - Complexity score (1-4)
 * @returns Distribution with MCQ and ShortAnswer counts
 */
export function calculateDistribution(
  totalCount: number,
  complexityScore: number
): QuestionDistribution {
  let mcqPercentage: number;

  if (complexityScore <= 2) {
    // Lower complexity: 70% MCQ, 30% ShortAnswer
    mcqPercentage = 0.7;
  } else {
    // Higher complexity: 50% MCQ, 50% ShortAnswer
    mcqPercentage = 0.5;
  }

  const mcqCount = Math.round(totalCount * mcqPercentage);
  const shortAnswerCount = totalCount - mcqCount;

  return {
    mcq: mcqCount,
    shortAnswer: shortAnswerCount,
  };
}

/**
 * Generate difficulty curve - questions ordered from easiest to hardest
 * @param totalCount - Total number of questions
 * @param complexityScore - Complexity score affecting difficulty spread
 * @returns Array of difficulty levels
 */
export function generateDifficultyCurve(
  totalCount: number,
  complexityScore: number
): DifficultyLevel[] {
  const curve: DifficultyLevel[] = [];
  
  // Base difficulty distribution shifts with complexity score
  const easyRatio = 0.4 - (complexityScore * 0.05); // Decreases with complexity
  const mediumRatio = 0.4;
  const hardRatio = 0.2 + (complexityScore * 0.05); // Increases with complexity

  const easyCount = Math.max(1, Math.round(totalCount * easyRatio));
  const mediumCount = Math.max(1, Math.round(totalCount * mediumRatio));
  const hardCount = totalCount - easyCount - mediumCount;

  // Fill curve: easy first, then medium, then hard (implicit difficulty ramp)
  for (let i = 0; i < easyCount; i++) {
    curve.push("easy");
  }
  for (let i = 0; i < mediumCount; i++) {
    curve.push("medium");
  }
  for (let i = 0; i < hardCount; i++) {
    curve.push("hard");
  }

  return curve;
}

/**
 * Generate a unique question ID
 * @param subtopicId - Subtopic identifier
 * @param index - Question index
 * @returns Unique question ID
 */
function generateQuestionId(subtopicId: string, index: number): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${subtopicId}-q${index}-${timestamp}-${random}`;
}

/**
 * Generate placeholder MCQ question
 * @param subtopicId - Subtopic identifier
 * @param difficulty - Difficulty level
 * @param index - Question index
 * @returns Generated MC question
 */
function generateMCQuestion(
  subtopicId: string,
  difficulty: DifficultyLevel,
  index: number
): MCQuestion {
  const questionTemplates: Record<DifficultyLevel, string[]> = {
    easy: [
      "What is the primary purpose of this concept?",
      "Which of the following best describes this?",
      "Identify the correct definition:",
      "What is the main characteristic of?"
    ],
    medium: [
      "Which approach is most effective for implementing this?",
      "What are the key differences between X and Y?",
      "When should you use this pattern?",
      "What is the result of applying this operation?"
    ],
    hard: [
      "Analyze the trade-offs between these implementation strategies:",
      "Given the constraints, which solution optimizes for both performance and maintainability?",
      "Explain why this approach fails in edge case scenarios:",
      "What advanced pattern would resolve this architectural challenge?"
    ]
  };

  const optionTemplates: Record<DifficultyLevel, string[]> = {
    easy: [
      "The fundamental building block",
      "A secondary implementation detail",
      "An optional enhancement",
      "An deprecated feature"
    ],
    medium: [
      "Use a synchronous approach with proper error handling",
      "Implement caching at the application layer",
      "Apply the observer pattern with type safety",
      "Utilize dependency injection with lazy initialization"
    ],
    hard: [
      "Combine memoization with useCallback to prevent unnecessary re-renders while maintaining referential identity",
      "Implement a custom hook with useRef to bridge imperative APIs with declarative React patterns",
      "Use a worker thread with SharedArrayBuffer for CPU-intensive computations while maintaining UI responsiveness",
      "Apply the strategy pattern with composition to handle multiple authentication providers dynamically"
    ]
  };

  const questionText = questionTemplates[difficulty][index % questionTemplates[difficulty].length];
  const baseOptions = optionTemplates[difficulty];
  
  // Shuffle options and pick correct answer
  const shuffledIndices = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
  const correctOriginalIndex = 0; // First option is correct, then shuffled
  const correctAnswerIndex = shuffledIndices[correctOriginalIndex] as 0 | 1 | 2 | 3;

  const options: [string, string, string, string] = [
    baseOptions[shuffledIndices[0]],
    baseOptions[shuffledIndices[1]],
    baseOptions[shuffledIndices[2]],
    baseOptions[shuffledIndices[3]]
  ];

  return {
    id: generateQuestionId(subtopicId, index),
    type: "mcq",
    difficulty,
    questionText,
    topicId: subtopicId,
    options,
    correctAnswerIndex,
    explanation: `The correct answer is option ${correctAnswerIndex + 1} because it directly addresses the question requirement.`
  };
}

/**
 * Generate placeholder short answer question
 * @param subtopicId - Subtopic identifier
 * @param difficulty - Difficulty level
 * @param index - Question index
 * @returns Generated short answer question
 */
function generateShortAnswerQuestion(
  subtopicId: string,
  difficulty: DifficultyLevel,
  index: number
): ShortAnswerQuestion {
  const questionTemplates: Record<DifficultyLevel, string[]> = {
    easy: [
      "Define the basic concept in one sentence.",
      "What is the primary benefit of this approach?",
      "Name the key component required for this implementation.",
      "Explain the simplest form of this pattern."
    ],
    medium: [
      "Compare and contrast these two approaches in terms of performance.",
      "Explain the role of state management in this context.",
      "What are the main considerations when designing this system?",
      "Describe the flow of data in this architecture."
    ],
    hard: [
      "Analyze how this pattern impacts scalability and propose optimizations.",
      "Explain the theoretical underpinnings that make this solution work.",
      "Critique this implementation and suggest improvements for production use.",
      "Design a solution that addresses these conflicting requirements."
    ]
  };

  const acceptableAnswerTemplates: Record<DifficultyLevel, string[]> = {
    easy: [
      "It provides a foundation for building scalable applications.",
      "It enables better code organization and reusability.",
      "It simplifies complex problems through abstraction.",
      "It improves developer productivity and maintainability."
    ],
    medium: [
      "State management ensures predictable data flow and enables efficient updates across components.",
      "Performance depends on the balance between computational complexity and memory usage.",
      "The design must consider both immediate requirements and future extensibility.",
      "Error handling should be comprehensive yet not add unnecessary overhead."
    ],
    hard: [
      "The solution requires careful consideration of trade-offs between consistency, availability, and partition tolerance.",
      "Optimal performance demands profiling under realistic load conditions and iterative refinement.",
      "A robust architecture must account for edge cases while maintaining clean, testable code.",
      "The implementation should leverage language-specific features while avoiding over-engineering."
    ]
  };

  const hintTemplates: Record<DifficultyLevel, string[]> = {
    easy: [
      "Think about the core purpose and primary use case.",
      "Consider what problem this solves.",
      "Focus on the essential characteristics."
    ],
    medium: [
      "Consider both advantages and disadvantages.",
      "Think about real-world applications.",
      "Balance theory with practical considerations."
    ],
    hard: [
      "Consider performance implications at scale.",
      "Think about edge cases and failure modes.",
      "Apply systems design principles."
    ]
  };

  const questionText = questionTemplates[difficulty][index % questionTemplates[difficulty].length];
  const acceptableAnswers = acceptableAnswerTemplates[difficulty][index % acceptableAnswerTemplates[difficulty].length];
  const hint = hintTemplates[difficulty][index % hintTemplates[difficulty].length];

  return {
    id: generateQuestionId(subtopicId, index),
    type: "shortAnswer",
    difficulty,
    questionText,
    topicId: subtopicId,
    acceptableAnswers: [acceptableAnswers],
    hint
  };
}

/**
 * Generate a complete question set based on configuration
 * @param config - Question generation configuration
 * @returns Question set with count, distribution, difficulty curve, and questions
 */
export function generateQuestionSet(
  config: QuestionGeneratorConfig
): QuestionSetResult {
  // Validate input
  const validatedConfig = validateQuestionGeneratorConfig(config);

  // Extract validated values
  const { subtopicId, complexityScore, adaptationModifier } = validatedConfig;

  // Calculate question count using formula: min(5 + complexityScore-1 + adaptationModifier, 10)
  const count = calculateQuestionCount(complexityScore, adaptationModifier);

  // Calculate distribution
  const distribution = calculateDistribution(count, complexityScore);

  // Generate difficulty curve
  const difficultyCurve = generateDifficultyCurve(count, complexityScore);

  // Generate questions
  const questions: Array<MCQuestion | ShortAnswerQuestion> = [];
  let mcqIndex = 0;
  let shortAnswerIndex = 0;

  for (let i = 0; i < count; i++) {
    const difficulty = difficultyCurve[i];

    if (i < distribution.mcq) {
      // Generate MCQ
      questions.push(generateMCQuestion(subtopicId, difficulty, mcqIndex));
      mcqIndex++;
    } else {
      // Generate ShortAnswer
      questions.push(generateShortAnswerQuestion(subtopicId, difficulty, shortAnswerIndex));
      shortAnswerIndex++;
    }
  }

  return {
    count,
    distribution,
    difficultyCurve,
    questions: questions as readonly (MCQuestion | ShortAnswerQuestion)[],
    subtopicId,
    generatedAt: Date.now(),
  };
}

export default generateQuestionSet;
