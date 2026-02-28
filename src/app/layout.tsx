import React from "react";
import type { ReactNode } from "react";
import "../styles/globals.css";
import Providers from "../providers/Providers";
import { GlobalErrorBoundary } from "../components/shared/GlobalErrorBoundary";
import { OfflineBanner } from "../components/shared/OfflineBanner";

export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <head />
      <body>
        <GlobalErrorBoundary>
          <OfflineBanner />
          <Providers>{children}</Providers>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
