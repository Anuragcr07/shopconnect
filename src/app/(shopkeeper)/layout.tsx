// src/app/(shopkeeper)/layout.tsx
"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import React from "react";

export default function ShopkeeperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">Loading...</div>;
  }

  if (!session || session.user.role !== "SHOPKEEPER") {
    redirect("/login"); // Redirect to login if not authenticated or not a shopkeeper
    return null; // Don't render children if redirecting
  }

  return <>{children}</>;
}