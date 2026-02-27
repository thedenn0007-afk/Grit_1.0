import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../../../lib/trpc/router";
import { createContext } from "../../../../lib/trpc/context";

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  return fetchRequestHandler({
    endpoint: "/api/gemini/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req as unknown as import("next/server").NextRequest),
  });
}

export async function POST(req: Request): Promise<Response> {
  return fetchRequestHandler({
    endpoint: "/api/gemini/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req as unknown as import("next/server").NextRequest),
  });
}
