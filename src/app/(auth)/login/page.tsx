"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2, LockKeyhole, MapPin } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import StatusModal from "@/components/ui/StatusModal";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const isVerified = searchParams.get("verified") === "true";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    isOpen: isVerified,
    title: isVerified ? "Email verified" : "",
    message: isVerified ? "Your account is active. You can log in now." : "",
    type: (isVerified ? "success" : "info") as "info" | "success" | "error",
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    const result = await signIn("credentials", { redirect: false, email, password });
    setIsLoading(false);

    if (result?.error) {
      if (result.error === "PLEASE_VERIFY_EMAIL") {
        setModalConfig({ isOpen: true, title: "Check your inbox", message: "Verify your email before logging in.", type: "info" });
      } else {
        setError("That email and password combination does not look right.");
      }
      return;
    }
    router.push(callbackUrl);
  };

  return (
    <>
      <StatusModal {...modalConfig} onClose={() => setModalConfig((value) => ({ ...value, isOpen: false }))} />
      <div className="w-full max-w-md">
        <div className="mb-8 text-center lg:text-left">
          <div className="mx-auto mb-5 grid size-12 place-items-center rounded-2xl bg-indigo-100 text-indigo-700 lg:mx-0"><LockKeyhole className="size-6" /></div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Welcome back</h1>
          <p className="mt-3 text-slate-600">Log in to see your requests, offers, and conversations.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input id="email" label="Email address" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Input id="password" label="Password" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logging in…" : <>Log in <ArrowRight className="size-4" /></>}
          </Button>
        </form>
        <p className="mt-7 text-center text-sm text-slate-500 lg:text-left">New to ShopConnect? <Link href="/signup" className="font-bold text-indigo-600 hover:text-indigo-700">Create a free account</Link></p>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-white">
      <div className="mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-7xl lg:grid-cols-2">
        <aside className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="soft-grid absolute inset-0 opacity-20" />
          <div className="relative"><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-bold"><MapPin className="size-4 text-indigo-300" /> Built for your neighbourhood</span></div>
          <div className="relative max-w-lg"><h2 className="text-5xl font-black leading-tight tracking-tight">Your local marketplace is waiting.</h2><p className="mt-5 text-lg leading-8 text-slate-300">Pick up where you left off and connect with shops and shoppers nearby.</p></div>
          <div className="relative flex gap-6 text-sm text-slate-300"><span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-400" /> Fast replies</span><span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-400" /> Direct chat</span></div>
        </aside>
        <main className="flex items-center justify-center px-5 py-12 sm:px-10 lg:px-16">
          <Suspense fallback={<div className="size-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />}><LoginFormContent /></Suspense>
        </main>
      </div>
    </div>
  );
}
