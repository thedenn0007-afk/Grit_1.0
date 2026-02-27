"use client";

import React, { ReactNode } from "react";

/**
 * ErrorFallback Component
 * 
 * A styled fallback UI for ErrorBoundary
 * Provides retry functionality and user-friendly error messaging
 */

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  title?: string;
  message?: string;
  showDetails?: boolean;
}

/**
 * ErrorFallback Component
 * 
 * @param error - The error that was caught
 * @param resetError - Function to reset the error state
 * @param title - Custom title for the error
 * @param message - Custom error message
 * @param showDetails - Whether to show error details (dev only)
 */
export function ErrorFallback({
  error,
  resetError,
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  showDetails = process.env.NODE_ENV === "development",
}: ErrorFallbackProps): React.JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        padding: "2rem",
        textAlign: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: "64px",
          height: "64px",
          marginBottom: "1.5rem",
          color: "hsl(var(--color-error))",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>

      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: "600",
          color: "hsl(var(--color-primary))",
          marginBottom: "0.5rem",
        }}
      >
        {title}
      </h2>

      <p
        style={{
          color: "hsl(var(--color-primary) / 0.7)",
          marginBottom: "1.5rem",
          maxWidth: "400px",
        }}
      >
        {message}
      </p>

      {showDetails && error && (
        <details
          style={{
            marginBottom: "1.5rem",
            padding: "1rem",
            backgroundColor: "hsl(var(--color-error) / 0.1)",
            borderRadius: "0.5rem",
            textAlign: "left",
            maxWidth: "100%",
            overflow: "auto",
          }}
        >
          <summary
            style={{
              cursor: "pointer",
              fontWeight: "500",
              marginBottom: "0.5rem",
            }}
          >
            Error Details
          </summary>
          <pre
            style={{
              fontSize: "0.875rem",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {error.toString()}
          </pre>
        </details>
      )}

      {resetError && (
        <button
          onClick={resetError}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "hsl(var(--color-primary))",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            fontSize: "1rem",
            fontWeight: "500",
            cursor: "pointer",
            transition: "opacity 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.opacity = "0.9";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export default ErrorFallback;
