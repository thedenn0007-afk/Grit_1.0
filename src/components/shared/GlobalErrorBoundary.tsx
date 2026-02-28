"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import * as Sentry from "@sentry/nextjs";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error in GlobalErrorBoundary:", error, errorInfo);
        // Log the error to Sentry
        Sentry.captureException(error, { extra: { errorInfo } });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 font-sans p-6 text-center">
                    <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-red-100 p-8">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong.</h2>
                        <p className="text-gray-600 mb-6">
                            We've encountered an unexpected error. Our team has been notified.
                        </p>
                        {this.state.error && (
                            <pre className="text-sm bg-gray-100 p-4 rounded text-left overflow-auto text-gray-800 mb-6">
                                <code>{this.state.error.message}</code>
                            </pre>
                        )}
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.location.reload();
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
