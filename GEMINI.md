# Grit Flow - Gemini AI Integration

> Comprehensive documentation for all Gemini AI features in Grit Flow

This document covers all Gemini-related functionality implemented in Grit Flow.

## Table of Contents

1. [Setup](#setup)
2. [Files Overview](#files-overview)
3. [API Reference](#api-reference)
4. [Usage Examples](#usage-examples)
5. [Error Handling](#error-handling)

---

## Setup

### Prerequisites

1. **Get a Gemini API Key**
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key
   - Copy the key

2. **Environment Files**
   
   Grit Flow uses two environment files for the Gemini API key:

   | File | Purpose | Git Status |
   |------|---------|------------|
   | `.env` | Default values, tracked in git | ✅ Tracked |
   | `.env.local` | Local overrides, git-ignored | ❌ Ignored |

   **`.env`** - Add your API key here (tracked in git):
   ```bash
   # In .env (this file is tracked)
   GEMINI_API_KEY=your_actual_api_key_here
   ```

   **`.env.local`** - For local development (git-ignored, overrides `.env`):
   ```bash
   # In .env.local (this file is NOT tracked - add to .gitignore)
   GEMINI_API_KEY=your_local_key_here
   ```

   **How it works:**
   - Next.js loads `.env.local` first (highest priority)
   - If `.env.local` doesn't exist, it falls back to `.env`
   - The app throws an error at startup if no valid key is found

   > ⚠️ **Important:** Never commit actual API keys to git!
   > - `.env` should have placeholder or demo key
   > - Real keys go in `.env.local` (already git-ignored)

---

## Files Overview

### 1. `src/lib/gemini/client.ts`

The core Gemini client initialization.

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey: string | undefined = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("Missing required environment variable: GEMINI_API_KEY");
}

const gemini = new GoogleGenerativeAI(apiKey);
const model: string = "gemini-2.0-flash";

export { gemini, model };
```

**Features:**
- Validates API key at startup (throws if missing)
- Uses `gemini-2.0-flash` model (fast, cost-effective)
- Exports both the client instance and model name

---

### 2. `src/lib/gemini/feedback.ts`

Generates personalized feedback for student answers.

```typescript
import { generateQuestionFeedback } from "src/lib/gemini/feedback";

const feedback = await generateQuestionFeedback(
  "What is the capital of France?",
  "London",           // user's wrong answer
  "Paris"             // correct answer
);
// Returns: "Your answer was incorrect because London is the capital of England, not France. The capital of France is Paris."
```

**Function Signature:**
```typescript
function generateQuestionFeedback(
  question: string,
  userAnswer: string,
  correctAnswer: string
): Promise<string>
```

**Features:**
- Generates exactly 2 sentences of feedback
- First sentence: explains why user's answer was wrong/right
- Second sentence: clarifies the underlying concept
- Returns plain text (no markdown)
- Uses lower temperature (0.3) for consistent responses

---

### 3. `src/lib/gemini/validation.ts`

Validates short answers using semantic similarity.

```typescript
import { validateShortAnswer } from "src/lib/gemini/validation";

const isCorrect = await validateShortAnswer(
  "What is photosynthesis?",
  "Plants use sunlight to convert CO2 and water into glucose and oxygen",
  ["sunlight", "glucose", "oxygen", "chlorophyll", "carbon dioxide"]
);
// Returns: true (captures key concepts)
```

**Function Signature:**
```typescript
function validateShortAnswer(
  question: string,
  userAnswer: string,
  acceptableKeywords: string[]
): Promise<boolean>
```

**Features:**
- Uses Gemini for semantic similarity checking
- Validates inputs with Zod schema
- Returns `true` if answer captures key concepts
- Returns `false` if answer is completely wrong
- Low temperature (0.1) for consistent validation
- Strict TypeScript return type

**Zod Validation:**
- `question`: string, required, non-empty
- `userAnswer`: string, required, non-empty  
- `acceptableKeywords`: array of strings, minimum 1 required

---

### 4. `src/app/api/gemini/route.ts`

REST API endpoint for Gemini operations.

**Endpoints:**

#### POST `/api/gemini`
Generate content using Gemini.

**Request:**
```json
{
  "prompt": "Your prompt here",
  "temperature": 0.7,
  "maxTokens": 2048
}
```

**Response (200):**
```json
{
  "content": "Generated content here"
}
```

**Error Responses:**
- `400`: Missing or invalid prompt
- `429`: Rate limit exceeded
- `500`: API configuration error or generation failed

#### GET `/api/gemini`
Health check endpoint.

**Response (200):**
```json
{
  "status": "ready",
  "model": "gemini-2.0-flash"
}
```

---

## API Reference

### `generateQuestionFeedback()`

| Parameter | Type | Description |
|-----------|------|-------------|
| `question` | `string` | The question that was asked |
| `userAnswer` | `string` | The answer provided by the student |
| `correctAnswer` | `string` | The correct answer |

**Returns:** `Promise<string>` - 2-sentence feedback in plain text

**Errors:**
- Throws if API key is missing
- Throws if generation fails

### `validateShortAnswer()`

| Parameter | Type | Description |
|-----------|------|-------------|
| `question` | `string` | The question that was asked |
| `userAnswer` | `string` | The answer provided by the student |
| `acceptableKeywords` | `string[]` | Array of keywords indicating correct answer |

**Returns:** `Promise<boolean>` - true if captures key concepts, false if wrong

**Errors:**
- Throws ZodError for invalid input
- Throws if API key is missing
- Throws if generation fails

### POST `/api/gemini`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | `string` | Yes | The prompt for Gemini |
| `temperature` | `number` | No | Creativity level (0.0-1.0), default 0.7 |
| `maxTokens` | `number` | No | Max tokens in response, default 2048 |

---

## Usage Examples

### Example 1: Generate Question Feedback

```typescript
import { generateQuestionFeedback } from "src/lib/gemini/feedback";

async function checkAnswer() {
  try {
    const feedback = await generateQuestionFeedback(
      "What is 2 + 2?",
      "5",
      "4"
    );
    console.log(feedback); 
    // "Your answer was incorrect because 2 + 2 equals 4, not 5. Addition of these two numbers gives a sum of 4."
  } catch (error) {
    console.error("Failed to generate feedback:", error);
  }
}
```

### Example 2: Validate Short Answer

```typescript
import { validateShortAnswer } from "src/lib/gemini/validation";

async function checkShortAnswer() {
  try {
    const isCorrect = await validateShortAnswer(
      "What is the process by which plants make food?",
      "Photosynthesis is how plants convert sunlight into energy",
      ["photosynthesis", "sunlight", "glucose", "chlorophyll"]
    );
    console.log(isCorrect); // true
  } catch (error) {
    console.error("Failed to validate answer:", error);
  }
}
```

### Example 3: Using the API Route (Client-side)

```typescript
async function generateContent(prompt: string) {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      prompt,
      temperature: 0.7,
      maxTokens: 500
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || error.error);
  }
  
  const { content } = await response.json();
  return content;
}
```

### Example 4: Check API Health

```typescript
async function checkGeminiStatus() {
  const response = await fetch('/api/gemini');
  const data = await response.json();
  console.log(data); // { status: "ready", model: "gemini-2.0-flash" }
}
```

---

## Error Handling

All Gemini functions include proper error handling:

1. **Missing API Key:** Throws at startup with descriptive message
2. **API Errors:** Caught and re-thrown with context
3. **Rate Limiting:** Handled with appropriate HTTP 429 response
4. **Validation:** Input validation with clear error messages (Zod)
5. **Ambiguous Responses:** Returns false for safety

---

## Dependencies

- `@google/generative-ai` - Official Google Gemini SDK
- `zod` - Input validation

Install via:
```bash
npm install @google/generative-ai zod
```

---

## Notes

- The client uses `gemini-2.0-flash` model for fast, cost-effective generation
- Temperature settings: 0.1 (validation), 0.3 (feedback), 0.7 (general content)
- All responses are stripped of markdown formatting for clean text output
- API key validation happens at server startup to catch configuration issues early
- Validation uses strict Zod schemas for input validation
