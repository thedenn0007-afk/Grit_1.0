import { NextRequest, NextResponse } from "next/server";
import { gemini, model } from "src/lib/gemini/client";

// TypeScript interfaces for request/response
interface GeminiRequestBody {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

interface GeminiErrorResponse {
  error: string;
  details?: string;
}

/**
 * POST handler for Gemini API
 * 
 * @param request - Next.js request object
 * @returns NextResponse with generated content or error
 */
export async function POST(request: NextRequest): Promise<NextResponse<GeminiErrorResponse | { content: string }>> {
  try {
    // Parse and validate request body
    const body: GeminiRequestBody = await request.json();

    // Validate prompt
    if (!body.prompt || typeof body.prompt !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'prompt' field" },
        { status: 400 }
      );
    }

    // Get the generative model
    const generativeModel = gemini.getGenerativeModel({
      model: model,
      generationConfig: {
        temperature: body.temperature ?? 0.7,
        maxOutputTokens: body.maxTokens ?? 2048,
      },
    });

    // Generate content
    const result = await generativeModel.generateContent(body.prompt);
    const response = result.response;
    const content = response.text();

    // Return successful response
    return NextResponse.json({ content }, { status: 200 });

  } catch (error) {
    // Handle specific error types
    if (error instanceof Error) {
      console.error("Gemini API Error:", error.message);

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
        { error: "Failed to generate content", details: error.message },
        { status: 500 }
      );
    }

    // Unknown error
    console.error("Unknown Gemini API Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

/**
 * GET handler - Health check endpoint
 * 
 * @returns NextResponse indicating API is ready
 */
export async function GET(): Promise<NextResponse<{ status: string; model: string }>> {
  return NextResponse.json(
    { status: "ready", model: model },
    { status: 200 }
  );
}
