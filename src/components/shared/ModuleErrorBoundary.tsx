"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import * as Sentry from "@sentry/nextjs";

interface Props {
    children?: ReactNode;
    moduleName: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ModuleErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`Error caught in Module Boundary (${this.props.moduleName}):`, error, errorInfo);
        Sentry.captureException(error, {
            extra: { errorInfo },
            tags: { module: this.props.moduleName }
        });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 bg-red-50 border border-red-200 rounded-lg my-4">
                    <h3 className="text-lg font-semibold text-red-700 mb-2">
                        Failed to load {this.props.moduleName} module
                    </h3>
                    <p className="text-red-600 text-sm mb-4">
                        An error occurred while rendering this section.
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded text-sm font-medium transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
