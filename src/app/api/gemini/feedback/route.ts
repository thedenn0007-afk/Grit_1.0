import { NextRequest, NextResponse } from "next/server";
import { generateQuestionFeedback } from "src/lib/gemini/feedback";

// TypeScript interfaces for request/response
interface FeedbackRequestBody {
  question: string;
  userAnswer: string;
  correctAnswer: string;
}

interface FeedbackErrorResponse {
  error: string;
  details?: string;
}

/**
 * POST handler for Gemini feedback generation
 * 
 * @param request - Next.js request object
 * @returns NextResponse with generated feedback or error
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<FeedbackErrorResponse | { feedback: string }>> {
  try {
    // Parse and validate request body
    const body: FeedbackRequestBody = await request.json();

    // Validate required fields
    if (!body.question || typeof body.question !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'question' field" },
        { status: 400 }
      );
    }

    if (!body.userAnswer || typeof body.userAnswer !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'userAnswer' field" },
        { status: 400 }
      );
    }

    if (!body.correctAnswer || typeof body.correctAnswer !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'correctAnswer' field" },
        { status: 400 }
      );
    }

    // Generate feedback using Gemini
    const feedback = await generateQuestionFeedback(
      body.question,
      body.userAnswer,
      body.correctAnswer
    );

    // Return successful response
    return NextResponse.json({ feedback }, { status: 200 });

  } catch (error) {
    // Handle specific error types
    if (error instanceof Error) {
      console.error("Feedback API Error:", error.message);

      // Check for API key issues
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "API configuration error", details: error.message },
          { status: 500 }
        );
      }

      // Check for rate limiting
      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          { error: "Rate limit exceeded", details: error.message },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: "Failed to generate feedback", details: error.message },
        { status: 500 }
      );
    }

    // Unknown error
    console.error("Unknown Feedback API Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
