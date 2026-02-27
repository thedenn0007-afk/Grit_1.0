import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "../db/prisma";
import { authOptions } from "../auth";

export type Context = {
  request: NextRequest;
  prisma: typeof prisma;
  session: Awaited<ReturnType<typeof getServerSession>> | null;
};

export async function createContext(request: NextRequest): Promise<Context> {
  const session = await getServerSession(authOptions);
  
  return {
    request,
    prisma,
    session,
  };
}
