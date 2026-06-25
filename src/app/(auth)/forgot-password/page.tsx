"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, KeyRound, MapPin } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import StatusModal from "@/components/ui/StatusModal";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
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
    setIsLoading(true);

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setIsLoading(false);

      if (!response.ok) {
        setError(data.message || "Something went wrong.");
        return;
      }

      setModalConfig({
        isOpen: true,
        title: "Check your inbox",
        message: data.message,
        type: "success",
      });
      setEmail("");
    } catch (err) {
      setIsLoading(false);
      setError("Failed to connect to the server.");
    }
  };

  return (
    <>
      <StatusModal
        {...modalConfig}
        onClose={() => setModalConfig((value) => ({ ...value, isOpen: false }))}
      />
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
                Reset your password securely.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-300">
                Enter your registered email address and we'll send you a secure link to reset your password.
              </p>
            </div>
          </aside>

          {/* Right form panel */}
          <main className="flex items-center justify-center px-5 py-12 sm:px-10 lg:px-16">
            <div className="w-full max-w-md">
              <div className="mb-8 text-center lg:text-left">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition mb-6"
                >
                  <ArrowLeft className="size-4" /> Back to login
                </Link>
                <div className="mx-auto mb-5 grid size-12 place-items-center rounded-2xl bg-indigo-100 text-indigo-700 lg:mx-0">
                  <KeyRound className="size-6" />
                </div>
                <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  Forgot password?
                </h1>
                <p className="mt-3 text-slate-600">
                  No worries! Enter your email and we'll send you reset instructions.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  id="email"
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
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
                  {isLoading ? "Sending link…" : <>Send reset link <ArrowRight className="size-4" /></>}
                </Button>
              </form>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
