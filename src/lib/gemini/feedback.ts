import { gemini, model } from "./client";

/**
 * Feedback result type
 */
export type FeedbackResult = string;

/**
 * Generate personalized feedback for a question response
 * 
 * @param question - The question that was asked
 * @param userAnswer - The answer provided by the user
 * @param correctAnswer - The correct answer
 * @returns Promise resolving to 2-sentence feedback (plain text)
 * @throws Error if generation fails
 */
export async function generateQuestionFeedback(
  question: string,
  userAnswer: string,
  correctAnswer: string
): Promise<FeedbackResult> {
  // Build the prompt for Gemini
  const prompt = `You are a helpful tutor providing brief feedback to a student.

Question: ${question}
User's Answer: ${userAnswer}
Correct Answer: ${correctAnswer}

Provide exactly 2 sentences of feedback:
1. First sentence: Explain why the user's answer was wrong or right
2. Second sentence: Clarify the underlying concept

Return ONLY plain text, no markdown formatting, no bullet points, no numbered lists.`;

  try {
    // Get the generative model
    const generativeModel = gemini.getGenerativeModel({
      model: model,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 150,
      },
    });

    // Generate content
    const result = await generativeModel.generateContent(prompt);
    const response = result.response;
    let feedback = response.text();

    // Strip markdown formatting
    feedback = feedback
      .replace(/```[\s\S]*?```/g, "") // Remove code blocks
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
      .replace(/\*(.*?)\*/g, "$1") // Remove italic
      .replace(/^[-*+]\s+/gm, "") // Remove bullet points
      .replace(/^\d+\.\s+/gm, "") // Remove numbered lists
      .replace(/`/g, "") // Remove inline code
      .trim();

    // Ensure we have a reasonable response
    if (!feedback || feedback.length < 10) {
      throw new Error("Generated feedback is too short or empty");
    }

    return feedback;

  } catch (error) {
    // Log the error for debugging
    if (error instanceof Error) {
      console.error("Feedback generation error:", error.message);
      throw new Error(`Failed to generate feedback: ${error.message}`);
    }
    
    console.error("Unknown feedback generation error:", error);
    throw new Error("Failed to generate feedback due to an unknown error");
  }
}

export default generateQuestionFeedback;
