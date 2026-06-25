"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Lock, MapPin } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import StatusModal from "@/components/ui/StatusModal";

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info" as "info" | "success" | "error",
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });

      const data = await response.json();
      setIsLoading(false);

      if (!response.ok) {
        setError(data.message || "Something went wrong.");
        return;
      }

      setModalConfig({
        isOpen: true,
        title: "Success!",
        message: "Your password has been successfully reset. Redirecting to login...",
        type: "success",
      });

      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      setIsLoading(false);
      setError("Failed to connect to the server.");
    }
  };

  if (!token || !email) {
    return (
      <div className="w-full max-w-md text-center lg:text-left">
        <div className="mx-auto mb-5 grid size-12 place-items-center rounded-2xl bg-rose-100 text-rose-700 lg:mx-0">
          <Lock className="size-6" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          Invalid Link
        </h1>
        <p className="mt-3 text-slate-600">
          This password reset link is invalid or incomplete. Please request a new link from the forgot password page.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 mt-6 w-full"
        >
          Request new link
        </Link>
      </div>
    );
  }

  return (
    <>
      <StatusModal
        {...modalConfig}
        onClose={() => {
          setModalConfig((value) => ({ ...value, isOpen: false }));
          router.push("/login");
        }}
      />
      <div className="w-full max-w-md">
        <div className="mb-8 text-center lg:text-left">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition mb-6"
          >
            <ArrowLeft className="size-4" /> Back to login
          </Link>
          <div className="mx-auto mb-5 grid size-12 place-items-center rounded-2xl bg-indigo-100 text-indigo-700 lg:mx-0">
            <Lock className="size-6" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Reset Password
          </h1>
          <p className="mt-3 text-slate-600">
            Enter and confirm your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="password"
            label="New password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <Input
            id="confirmPassword"
            label="Confirm new password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
            >
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Resetting…" : <>Reset password <ArrowRight className="size-4" /></>}
          </Button>
        </form>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-white">
      <div className="mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-7xl lg:grid-cols-2">
        {/* Left panel */}
        <aside className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="soft-grid absolute inset-0 opacity-20" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-bold">
              <MapPin className="size-4 text-indigo-300" /> Secure Verification
            </span>
          </div>
          <div className="relative max-w-lg">
            <h2 className="text-5xl font-black leading-tight tracking-tight">
              Keep your credentials safe.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              Pick a strong password combining numbers, letters, and special symbols to safeguard your account data.
            </p>
          </div>
        </aside>

        {/* Right form panel */}
        <main className="flex items-center justify-center px-5 py-12 sm:px-10 lg:px-16">
          <Suspense fallback={<div className="size-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />}>
            <ResetPasswordFormContent />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
