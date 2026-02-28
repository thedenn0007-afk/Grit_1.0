"use client";

import React, { ReactNode } from "react";
import { ModuleErrorBoundary } from "../../../components/shared/ModuleErrorBoundary";

export default function ResultsLayout({ children }: { children: ReactNode }) {
    return (
        <ModuleErrorBoundary moduleName="Results">
            {children}
        </ModuleErrorBoundary>
    );
}
