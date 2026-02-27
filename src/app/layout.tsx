import React from "react";
import type { ReactNode } from "react";
import "../styles/globals.css";
import Providers from "../providers/Providers";

export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <head />
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
