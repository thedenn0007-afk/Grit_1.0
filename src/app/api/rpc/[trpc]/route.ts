import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../../../lib/trpc/router";
import { createContext } from "../../../../lib/trpc/context";

// Force dynamic rendering - critical for API routes
export const dynamic = "force-dynamic";

/**
 * tRPC handler for Next.js App Router
 * Uses catch-all route [trpc] to handle batched calls
 */
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/rpc",
    req,
    router: appRouter,
    createContext: () => createContext(req as unknown as import("next/server").NextRequest),
  });

export { handler as GET, handler as POST };
