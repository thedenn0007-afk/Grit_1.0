"use client";

import React, { ReactNode } from "react";
import { ModuleErrorBoundary } from "../../../components/shared/ModuleErrorBoundary";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <ModuleErrorBoundary moduleName="Dashboard">
            {children}
        </ModuleErrorBoundary>
    );
}
