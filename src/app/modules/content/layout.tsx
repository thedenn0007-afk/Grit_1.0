"use client";

import React, { ReactNode } from "react";
import { ModuleErrorBoundary } from "../../../components/shared/ModuleErrorBoundary";

export default function ContentLayout({ children }: { children: ReactNode }) {
    return (
        <ModuleErrorBoundary moduleName="Content">
            {children}
        </ModuleErrorBoundary>
    );
}
