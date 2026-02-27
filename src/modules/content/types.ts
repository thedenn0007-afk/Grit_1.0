/**
 * Content module types
 * Shared type definitions for content-related components and hooks
 */

/**
 * Subtopic content structure parsed from content_json
 */
export interface SubtopicContent {
  title: string;
  mdx: string;
  questions?: Array<{
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
  }>;
}

/**
 * Exit point data structure
 */
export interface ExitPointData {
  type: "content";
  position: number;
  timestamp: number;
}

/**
 * Scroll tracking state
 */
export interface ScrollState {
  scrollPercentage: number;
  isPaused: boolean;
  isRevisit: boolean;
  speed: number;
  position: number;
}
