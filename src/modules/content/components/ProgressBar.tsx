"use client";

import React from "react";

/**
 * Interface for ProgressBar component props
 */
export interface ProgressBarProps {
  progress: number;
  className?: string;
}

/**
 * ProgressBar Component
 * Visual progress indicator (no numbers)
 * Smooth animated fill based on scroll percentage
 */
export function ProgressBar(props: ProgressBarProps): JSX.Element {
  const { progress, className = "" } = props;

  // Ensure progress is between 0 and 100
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div
      className={`fixed top-0 left-0 right-0 h-1 bg-slate-200 z-50 ${className}`}
      role="progressbar"
      aria-valuenow={clampedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-blue-600 transition-all duration-300 ease-out"
        style={{
          width: `${clampedProgress}%`,
        }}
      />
    </div>
  );
}

export default ProgressBar;
