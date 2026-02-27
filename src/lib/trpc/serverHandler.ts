import { appRouter } from "./router";
import { createContext } from "./context";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";

export async function trpcHandler(request: NextRequest): Promise<Response> {
  return await fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: () => createContext(request)
  });
}
