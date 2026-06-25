"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShoppingBag, Store } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"CUSTOMER" | "SHOPKEEPER">("CUSTOMER");
  const [shopName, setShopName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password, role, shopName, address, phone }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Signup failed");
      router.push("/login?registered=true");
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-indigo-50 to-white px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <span className="inline-flex rounded-full bg-white px-3.5 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-indigo-700 shadow-sm">Free to join</span>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">Create your ShopConnect account</h1>
          <p className="mt-4 text-slate-600">Choose how you want to use the local marketplace.</p>
        </div>

        <div className="mt-8 rounded-[2rem] border border-white bg-white p-5 shadow-2xl shadow-indigo-100/70 sm:p-8">
          <div className="grid grid-cols-2 gap-3" role="group" aria-label="Account type">
            {([
              { value: "CUSTOMER", label: "I'm shopping", icon: ShoppingBag },
              { value: "SHOPKEEPER", label: "I run a shop", icon: Store },
            ] as const).map(({ value, label, icon: Icon }) => (
              <button key={value} type="button" onClick={() => setRole(value)} className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-bold transition sm:flex-row ${role === value ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100" : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}>
                <Icon className="size-5" /> {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input id="name" label="Your name" autoComplete="name" placeholder="Anura" value={name} onChange={(event) => setName(event.target.value)} required />
              <Input id="email" label="Email address" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <Input id="new-password" label="Password" type="password" autoComplete="new-password" minLength={8} placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} required />
            {role === "SHOPKEEPER" && (
              <div className="space-y-5 rounded-2xl bg-slate-50 p-4 sm:p-5">
                <p className="text-sm font-extrabold text-slate-900">Tell us about your shop</p>
                <Input id="shop-name" label="Shop name" placeholder="My Local Store" value={shopName} onChange={(event) => setShopName(event.target.value)} required />
                <Input id="shop-address" label="Shop address" autoComplete="street-address" placeholder="Street, area, city" value={address} onChange={(event) => setAddress(event.target.value)} required />
                <Input id="phone" label="Phone number" type="tel" autoComplete="tel" placeholder="+91 98765 43210" value={phone} onChange={(event) => setPhone(event.target.value)} required />
              </div>
            )}
            {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
            <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Creating your account…" : <>Create account <ArrowRight className="size-4" /></>}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-700">Log in</Link></p>
        </div>
      </div>
    </div>
  );
}
