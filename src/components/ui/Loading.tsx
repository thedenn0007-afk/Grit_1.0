"use client";

import React from "react";

/**
 * Loading Component
 * 
 * A reusable loading spinner with optional message
 * Uses CSS custom properties for theming
 */

interface LoadingProps {
  size?: "small" | "medium" | "large";
  message?: string;
  fullScreen?: boolean;
}

/**
 * Loading Spinner Component
 * 
 * @param size - Size of the spinner (small, medium, large)
 * @param message - Optional loading message
 * @param fullScreen - Whether to show full screen overlay
 */
export function Loading({ size = "medium", message, fullScreen = false }: LoadingProps): React.JSX.Element {
  const sizeMap = {
    small: "24px",
    medium: "40px",
    large: "64px",
  };

  const spinnerSize = sizeMap[size];
  const messageSize = size === "small" ? "0.875rem" : size === "large" ? "1.125rem" : "1rem";

  const content = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
      }}
    >
      <div
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: "3px solid hsl(var(--color-primary) / 0.2)",
          borderTopColor: "hsl(var(--color-primary))",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      {message && (
        <p
          style={{
            fontSize: messageSize,
            color: "hsl(var(--color-primary) / 0.7)",
            margin: 0,
          }}
        >
          {message}
        </p>
      )}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );

  if (fullScreen) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "hsl(var(--color-primary-light) / 0.8)",
          backdropFilter: "blur(4px)",
          zIndex: 9999,
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "200px",
        width: "100%",
      }}
    >
      {content}
    </div>
  );
}

/**
 * Skeleton Loader Component
 * Used for loading content placeholders
 */

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
}

export function Skeleton({
  width = "100%",
  height = "1rem",
  borderRadius = "0.25rem",
}: SkeletonProps): React.JSX.Element {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: `linear-gradient(
          90deg,
          hsl(var(--color-primary) / 0.1) 0%,
          hsl(var(--color-primary) / 0.15) 50%,
          hsl(var(--color-primary) / 0.1) 100%
        )`,
        backgroundSize: "200% 100%",
        animation: "skeleton 1.5s ease-in-out infinite",
      }}
    >
      <style jsx>{`
        @keyframes skeleton {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Page Loading Component
 * Full-screen loading for page transitions
 */
export function PageLoading(): React.JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "hsl(var(--color-primary-light))",
      }}
    >
      <Loading size="large" message="Loading..." />
    </div>
  );
}

export default Loading;
