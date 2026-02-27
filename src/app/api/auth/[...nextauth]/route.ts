import NextAuth from "next-auth";
import { authOptions } from "../../../../lib/auth/index";

/**
 * NextAuth API Route Handler
 * 
 * Handles all NextAuth authentication requests:
 * - GET /api/auth/signin
 * - GET /api/auth/signout
 * - GET /api/auth/callback/[provider]
 * - GET /api/auth/session
 * - POST /api/auth/csrf
 * - POST /api/auth/providers
 */

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
