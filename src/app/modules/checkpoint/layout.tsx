"use client";

import React, { ReactNode } from "react";
import { ModuleErrorBoundary } from "../../../components/shared/ModuleErrorBoundary";

export default function CheckpointLayout({ children }: { children: ReactNode }) {
    return (
        <ModuleErrorBoundary moduleName="Checkpoint">
            {children}
        </ModuleErrorBoundary>
    );
}
