"use client";

import React, { useState, useEffect } from "react";

/**
 * Interface for ContinueCTA component props
 */
export interface ContinueCTAProps {
  isVisible: boolean;
  onContinue: () => void;
  className?: string;
}

/**
 * ContinueCTA Component
 * Appears at 95% scroll threshold
 * Animated entrance/exit
 */
export function ContinueCTA(props: ContinueCTAProps): JSX.Element {
  const { isVisible, onContinue, className = "" } = props;
  const [isAnimatingIn, setIsAnimatingIn] = useState<boolean>(false);

  // Handle animation when visibility changes
  useEffect(() => {
    if (isVisible) {
      setIsAnimatingIn(true);
    } else {
      setIsAnimatingIn(false);
    }
  }, [isVisible]);

  if (!isVisible && !isAnimatingIn) {
    return <></>;
  }

  return (
    <div
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 transition-all duration-500 ease-in-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      } ${className}`}
    >
      <div className="bg-white rounded-lg shadow-lg p-4 flex items-center gap-4 border border-slate-200">
        <span className="text-sm text-slate-600">
          You've reached the end of this content
        </span>
        <button
          onClick={onContinue}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-sm"
          type="button"
        >
          Continue to Checkpoint
        </button>
      </div>
    </div>
  );
}

export default ContinueCTA;
