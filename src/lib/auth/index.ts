import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "../db/prisma";

/**
 * NextAuth Configuration
 * Uses credentials provider for admin authentication
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@gritflow.local" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validate against admin credentials from environment
        const adminEmail = process.env.ADMIN_EMAIL || "admin@gritflow.local";
        const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Check if credentials match admin
        if (
          credentials.email === adminEmail &&
          credentials.password === adminPassword
        ) {
          // Find or create admin user in database
          let user = await prisma.user.findUnique({
            where: { email: adminEmail },
          });

          if (!user) {
            // Create admin user if doesn't exist
            user = await prisma.user.create({
              data: {
                email: adminEmail,
                name: "Admin",
              },
            });
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};

export default authOptions;
