"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "../lib/trpc/client";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "../components/ui/Toast";

const queryClient = new QueryClient();

/**
 * Application Providers Component
 * 
 * Wraps the application with all necessary providers:
 * - SessionProvider: NextAuth session context
 * - ToastProvider: Toast notifications context
 * - trpc.Provider: tRPC client context
 * - QueryClientProvider: React Query context
 */

export default function Providers({ children }: { children: React.ReactNode }): React.JSX.Element {
  const trpcClient = trpc.createClient({
    transformer: superjson,
    links: [
      httpBatchLink({
        url: "/api/rpc"
      })
    ]
  });

  return (
    <SessionProvider>
      <ToastProvider>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </trpc.Provider>
      </ToastProvider>
    </SessionProvider>
  );
}
