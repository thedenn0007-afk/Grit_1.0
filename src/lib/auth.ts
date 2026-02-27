import { type NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./db/prisma";
import nodemailer from "nodemailer";

/**
 * NextAuth Configuration
 * Uses email magic link authentication with Prisma adapter
 */

// Configure email transporter
// For development, uses Ethereal Email (test service)
// For production, update with your email service credentials
const emailTransporter =
  process.env.NODE_ENV === "production"
    ? nodemailer.createTransport({
        // Configure your production email service here
        // e.g., SendGrid, AWS SES, Gmail, etc.
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || "587", 10),
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      })
    : null;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server:
        process.env.NODE_ENV === "production" && emailTransporter
          ? emailTransporter
          : {
              // Development: use test email service
              host: "smtp.ethereal.email",
              port: 587,
              secure: false,
              auth: {
                user: process.env.ETHEREAL_EMAIL || "test@ethereal.email",
                pass: process.env.ETHEREAL_PASSWORD || "password",
              },
            },
      from: process.env.EMAIL_FROM || "noreply@gritflow.dev",
      maxAge: 24 * 60 * 60, // 24 hours
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
  callbacks: {
    /**
     * Called when JWT is being created or updated
     * Add user ID to token for authenticated routes
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    /**
     * Called when session is retrieved
     * Add user ID from token to session
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  events: {
    /**
     * Called when user signs in successfully
     */
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`✅ User signed in: ${user.email} (new: ${isNewUser})`);
    },
    /**
     * Called when user signs out
     */
    async signOut() {
      console.log("👤 User signed out");
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default authOptions;
