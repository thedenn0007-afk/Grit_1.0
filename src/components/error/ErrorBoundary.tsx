"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors in child component tree
 * and displays a fallback UI instead of crashing the app.
 * 
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Static method called when an error is thrown
   * Updates state to trigger fallback UI
   */
  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error: error,
    };
  }

  /**
   * Called after an error is caught
   * Can be used for logging or reporting
   */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      errorInfo: errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  /**
   * Resets the error state to allow retry
   */
  public handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      // If custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback with error details
      return (
        <div className="error-boundary-container">
          <h2>Something went wrong</h2>
          <p>An unexpected error occurred. Please try again.</p>
          {this.state.error && (
            <details style={{ whiteSpace: "pre-wrap", marginTop: "1rem" }}>
              <summary>Error Details</summary>
              <p>{this.state.error.toString()}</p>
              {this.state.errorInfo?.componentStack && (
                <p>{this.state.errorInfo.componentStack}</p>
              )}
            </details>
          )}
          <button
            onClick={this.handleReset}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
