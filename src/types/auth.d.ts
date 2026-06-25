// src/types/auth.d.ts
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "CUSTOMER" | "SHOPKEEPER";
    } & DefaultSession["user"];
  }

  interface User {
    role: "CUSTOMER" | "SHOPKEEPER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "CUSTOMER" | "SHOPKEEPER";
  }
}
