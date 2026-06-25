import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "CUSTOMER" | "SHOPKEEPER";
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("Invalid email or password.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        // Run a bcrypt comparison in all cases to mitigate timing attacks.
        // Use a locally-generated dummy hash so compare() always receives a valid hash.
        const dummyHash = bcrypt.hashSync("invalid-password-for-timing", 10);
        const hashToCompare = user?.passwordHash ?? dummyHash;
        const isValid = await bcrypt.compare(credentials.password, hashToCompare);

        if (!user || !isValid) throw new Error("Invalid email or password.");
        if (!user.emailVerified) throw new Error("PLEASE_VERIFY_EMAIL");

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role as "CUSTOMER" | "SHOPKEEPER",
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    // ✅ SECURITY FIX: Sessions expire after 24 hours
    maxAge: 24 * 60 * 60, // 24 hours in seconds
    // ✅ SECURITY FIX: Rotate session tokens every hour
    updateAge: 60 * 60, // 1 hour
  },

  jwt: {
    // ✅ SECURITY FIX: JWT expires to match session
    maxAge: 24 * 60 * 60, // 24 hours
  },

  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        // ✅ SECURITY FIX: httpOnly prevents JS access to cookie (mitigates XSS token theft)
        httpOnly: true,
        // ✅ SECURITY FIX: Secure flag — cookie only sent over HTTPS in production
        secure: process.env.NODE_ENV === "production",
        // ✅ SECURITY FIX: SameSite=lax prevents CSRF on cookie-based auth
        sameSite: "lax" as const,
        path: "/",
      },
    },
  },

  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as "CUSTOMER" | "SHOPKEEPER";
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "CUSTOMER" | "SHOPKEEPER";
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,

  // ✅ SECURITY FIX: Disable debug in production to avoid leaking internals
  debug: process.env.NODE_ENV === "development",
};