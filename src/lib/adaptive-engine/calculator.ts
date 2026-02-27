/**
 * Adaptive Engine Calculator
 * 
 * Calculates complexity adjustments based on user engagement signals
 * to adapt question count and difficulty.
 */

/**
 * Signals collected from user behavior during content consumption
 */
export interface AdaptationSignals {
  scrollSpeed: number;      // pixels per second
  pausePoints: number;      // count of pause events >3s
  revisitCount: number;     // count of times user scrolled back
  timeOnPage: number;       // total time in milliseconds
}

/**
 * Result of complexity adjustment calculation
 */
export interface ComplexityAdjustmentResult {
  modifier: number;         // 0-2 range
  difficulty: "easy" | "normal" | "hard";
  estimatedQuestions: number;
}

/**
 * Calculate complexity adjustment based on user engagement signals
 * 
 * @param signals - User behavior signals (scrollSpeed, pausePoints, revisitCount, timeOnPage)
 * @param baseComplexity - Base complexity score (determines base question count)
 * @returns Adjustment modifier (0-2) and difficulty classification
 * 
 * Logic:
 * - Fast scroll + few pauses = +1/+2 modifier (user is comfortable)
 * - Slow + revisits = 0 modifier (user is struggling)
 * - Normal = +0.5 modifier
 */
export function calculateComplexityAdjustment(
  signals: AdaptationSignals,
  baseComplexity: number
): ComplexityAdjustmentResult {
  const { scrollSpeed, pausePoints, revisitCount, timeOnPage } = signals;
  
  // Calculate signal scores
  let speedScore = 0;
  let pauseScore = 0;
  let revisitScore = 0;
  
  // Speed scoring (higher = faster reader)
  if (scrollSpeed > 150) {
    speedScore = 2; // Very fast - easy content for them
  } else if (scrollSpeed > 100) {
    speedScore = 1.5; // Fast reader
  } else if (scrollSpeed > 50) {
    speedScore = 1; // Normal reader
  } else if (scrollSpeed > 30) {
    speedScore = 0.5; // Slow reader
  } else {
    speedScore = 0; // Very slow - struggling or careful reader
  }
  
  // Pause scoring (fewer pauses = easier content understanding)
  if (pausePoints <= 2) {
    pauseScore = 1.5; // Few pauses - good comprehension
  } else if (pausePoints <= 5) {
    pauseScore = 1; // Normal pauses
  } else if (pausePoints <= 10) {
    pauseScore = 0.5; // Many pauses - might be confused
  } else {
    pauseScore = 0; // Too many pauses - struggling
  }
  
  // Revisit scoring (more revisits = re-reading difficult parts)
  if (revisitCount === 0) {
    revisitScore = 1.5; // No revisits - clear content
  } else if (revisitCount <= 2) {
    revisitScore = 1; // Few revisits - normal
  } else if (revisitCount <= 4) {
    revisitScore = 0.5; // Multiple revisits - confusing
  } else {
    revisitScore = 0; // Many revisits - struggling
  }
  
  // Time-based adjustment
  let timeScore = 1;
  if (timeOnPage > 0) {
    // Expected time based on complexity (rough estimate: 1 min per 100 complexity points)
    const expectedTime = baseComplexity * 60 * 1000;
    const ratio = timeOnPage / expectedTime;
    
    if (ratio < 0.5) {
      timeScore = 1.5; // Very fast completion
    } else if (ratio < 1) {
      timeScore = 1.25; // Fast completion
    } else if (ratio <= 1.5) {
      timeScore = 1; // Normal time
    } else if (ratio <= 2) {
      timeScore = 0.5; // Taking longer than expected
    } else {
      timeScore = 0.25; // Much longer than expected
    }
  }
  
  // Calculate weighted average (speed 30%, pauses 25%, revisits 25%, time 20%)
  const rawModifier = (
    (speedScore * 0.3) +
    (pauseScore * 0.25) +
    (revisitScore * 0.25) +
    (timeScore * 0.2)
  );
  
  // Clamp to 0-2 range
  const modifier = Math.min(2, Math.max(0, rawModifier));
  
  // Determine difficulty classification
  let difficulty: "easy" | "normal" | "hard";
  if (modifier >= 1.5) {
    difficulty = "easy";
  } else if (modifier >= 0.75) {
    difficulty = "normal";
  } else {
    difficulty = "hard";
  }
  
  // Estimate question count based on complexity and modifier
  // Base: 5 questions at complexity 10
  // Range: 3-10 questions based on modifier
  const baseQuestions = Math.max(3, Math.min(10, Math.round(baseComplexity / 2)));
  const estimatedQuestions = Math.round(baseQuestions * (0.5 + modifier * 0.75));
  
  return {
    modifier: Math.round(modifier * 100) / 100, // Round to 2 decimal places
    difficulty,
    estimatedQuestions: Math.max(3, Math.min(10, estimatedQuestions)),
  };
}

/**
 * Default signals for initial state
 */
export function getDefaultSignals(): AdaptationSignals {
  return {
    scrollSpeed: 0,
    pausePoints: 0,
    revisitCount: 0,
    timeOnPage: 0,
  };
}

export default calculateComplexityAdjustment;
