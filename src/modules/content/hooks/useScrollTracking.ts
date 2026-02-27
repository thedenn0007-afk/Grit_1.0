"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Interface for scroll tracking state
 */
export interface ScrollTrackingState {
  scrollPercentage: number;
  isPaused: boolean;
  isRevisit: boolean;
  speed: number;
  position: number;
}

/**
 * Interface for scroll tracking return values
 */
export interface UseScrollTrackingReturn {
  scrollPercentage: number;
  isPaused: boolean;
  isRevisit: boolean;
  speed: number;
  position: number;
  scrollToPosition: (position: number) => void;
}

/**
 * Hook to track scroll behavior in a container
 * - Calculates scroll percentage (0-100)
 * - Detects pause points (>3s static)
 * - Tracks revisits (scroll back up)
 * - Calculates reading speed (pixels/second)
 */
export function useScrollTracking(
  containerRef: React.RefObject<HTMLElement | null>
): UseScrollTrackingReturn {
  const [scrollPercentage, setScrollPercentage] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isRevisit, setIsRevisit] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(0);

  // Refs for tracking
  const lastScrollTimeRef = useRef<number>(Date.now());
  const lastScrollPositionRef = useRef<number>(0);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousPercentageRef = useRef<number>(0);
  const speedHistoryRef = useRef<number[]>([]);

  /**
   * Calculate scroll percentage
   */
  const calculateScrollPercentage = useCallback((): number => {
    if (!containerRef.current) {
      return 0;
    }

    const element = containerRef.current;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight - element.clientHeight;

    if (scrollHeight <= 0) {
      return 0;
    }

    const percentage = (scrollTop / scrollHeight) * 100;
    return Math.min(100, Math.max(0, percentage));
  }, [containerRef]);

  /**
   * Calculate reading speed in pixels per second
   */
  const calculateSpeed = useCallback((currentPosition: number): number => {
    const now = Date.now();
    const timeDelta = now - lastScrollTimeRef.current;

    if (timeDelta <= 0) {
      return 0;
    }

    const positionDelta = Math.abs(currentPosition - lastScrollPositionRef.current);
    const pixelsPerSecond = (positionDelta / timeDelta) * 1000;

    // Keep a rolling average of the last 5 speed measurements
    speedHistoryRef.current.push(pixelsPerSecond);
    if (speedHistoryRef.current.length > 5) {
      speedHistoryRef.current.shift();
    }

    const averageSpeed =
      speedHistoryRef.current.reduce((sum, val) => sum + val, 0) /
      speedHistoryRef.current.length;

    return Math.round(averageSpeed * 10) / 10;
  }, []);

  /**
   * Check for pause (no scroll for >3 seconds)
   */
  const checkPause = useCallback((currentPosition: number): void => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }

    setIsPaused(false);

    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(true);
    }, 3000);
  }, []);

  /**
   * Check for revisit (scroll back up)
   */
  const checkRevisit = useCallback((currentPercentage: number): void => {
    if (currentPercentage < previousPercentageRef.current - 5) {
      setIsRevisit(true);
    } else if (currentPercentage > previousPercentageRef.current) {
      setIsRevisit(false);
    }
    previousPercentageRef.current = currentPercentage;
  }, []);

  /**
   * Handle scroll event
   */
  const handleScroll = useCallback(() => {
    const percentage = calculateScrollPercentage();
    const currentPosition = containerRef.current?.scrollTop ?? 0;

    setScrollPercentage(percentage);

    // Calculate speed
    const currentSpeed = calculateSpeed(currentPosition);
    setSpeed(currentSpeed);

    // Check for pause
    checkPause(currentPosition);

    // Check for revisit
    checkRevisit(percentage);

    // Update refs
    lastScrollTimeRef.current = Date.now();
    lastScrollPositionRef.current = currentPosition;
  }, [
    calculateScrollPercentage,
    calculateSpeed,
    checkPause,
    checkRevisit,
    containerRef,
  ]);

  /**
   * Scroll to a specific position
   */
  const scrollToPosition = useCallback(
    (position: number): void => {
      if (!containerRef.current) {
        return;
      }

      const element = containerRef.current;
      const scrollHeight = element.scrollHeight - element.clientHeight;
      const scrollTop = (position / 100) * scrollHeight;

      element.scrollTo({
        top: scrollTop,
        behavior: "smooth",
      });
    },
    [containerRef]
  );

  // Set up scroll listener
  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    element.addEventListener("scroll", handleScroll);

    // Initial calculation
    const initialPercentage = calculateScrollPercentage();
    setScrollPercentage(initialPercentage);
    previousPercentageRef.current = initialPercentage;

    return () => {
      element.removeEventListener("scroll", handleScroll);
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, [containerRef, handleScroll, calculateScrollPercentage]);

  return {
    scrollPercentage,
    isPaused,
    isRevisit,
    speed,
    position: scrollPercentage,
    scrollToPosition,
  };
}

export default useScrollTracking;
