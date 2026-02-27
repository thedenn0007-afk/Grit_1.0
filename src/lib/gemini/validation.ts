import { z } from "zod";
import { gemini, model } from "./client";

// Zod input validation schema
const ValidateShortAnswerInputSchema = z.object({
  question: z.string().min(1, "Question is required"),
  userAnswer: z.string().min(1, "User answer is required"),
  acceptableKeywords: z.array(z.string()).min(1, "At least one keyword is required"),
});

/**
 * Input type for validateShortAnswer
 */
export type ValidateShortAnswerInput = z.infer<typeof ValidateShortAnswerInputSchema>;

/**
 * Validates input using Zod
 * @param input - The input to validate
 * @returns Validated input
 */
function validateInput(input: unknown): ValidateShortAnswerInput {
  return ValidateShortAnswerInputSchema.parse(input);
}

/**
 * Validation result type
 */
export type ValidationResult = boolean;

/**
 * Validate a short answer by checking semantic similarity with acceptable keywords
 * 
 * @param question - The question that was asked
 * @param userAnswer - The answer provided by the user
 * @param acceptableKeywords - Array of keywords that indicate a correct answer
 * @returns Promise resolving to true if answer captures key concepts, false if completely wrong
 * @throws Error if validation fails or generation fails
 */
export async function validateShortAnswer(
  question: string,
  userAnswer: string,
  acceptableKeywords: string[]
): Promise<ValidationResult> {
  // Validate inputs with Zod
  const validatedInput = validateInput({ question, userAnswer, acceptableKeywords });

  // Build the prompt for Gemini
  const keywordsList = validatedInput.acceptableKeywords.join(", ");
  const prompt = `You are an answer validation system. Your task is to determine if a student's answer is correct or close enough to the expected answer.

Question: ${validatedInput.question}
Student's Answer: ${validatedInput.userAnswer}
Acceptable Keywords: ${keywordsList}

Evaluate the student's answer based on:
1. Does it contain any of the acceptable keywords or synonyms?
2. Does it demonstrate understanding of the core concept?
3. Is it close enough in meaning to be considered correct?

Respond with ONLY one word: "TRUE" if the answer captures key concepts or is correct, "FALSE" if it is completely wrong or unrelated.

Consider variations of words (e.g., "running" contains "run", "programming" contains "program").`;

  try {
    // Get the generative model
    const generativeModel = gemini.getGenerativeModel({
      model: model,
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 10,
      },
    });

    // Generate content
    const result = await generativeModel.generateContent(prompt);
    const response = result.response;
    const rawResponse = response.text().trim().toUpperCase();

    // Parse the response
    if (rawResponse.includes("TRUE")) {
      return true;
    } else if (rawResponse.includes("FALSE")) {
      return false;
    }

    // Fallback: if response is ambiguous, assume false for safety
    console.warn("Ambiguous validation response:", rawResponse);
    return false;

  } catch (error) {
    // Log the error for debugging
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      throw new Error(`Invalid input: ${error.errors[0].message}`);
    }

    if (error instanceof Error) {
      console.error("Short answer validation error:", error.message);
      throw new Error(`Failed to validate answer: ${error.message}`);
    }

    console.error("Unknown validation error:", error);
    throw new Error("Failed to validate answer due to an unknown error");
  }
}

export default validateShortAnswer;
