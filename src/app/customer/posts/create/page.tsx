"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, LocateFixed, Send, ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

export default function CreateCustomerPostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialItem = searchParams.get("item");
  const [title, setTitle] = useState(initialItem || "");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialItem) {
      setTitle(initialItem);
      setDescription(`I am looking for ${initialItem}. Please let me know the price and whether it is currently in stock.`);
    }
  }, [initialItem]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return setError("Tell us what you are looking for.");
    setError(null);
    setIsLoading(true);

    const submitPost = async (lat?: number, lng?: number) => {
      try {
        const response = await fetch("/api/customer/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            latitude: lat !== undefined ? lat : null,
            longitude: lng !== undefined ? lng : null,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Could not create your request");
        }
        router.push("/customer/dashboard");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "We could not post your request. Please try again.");
        setIsLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          await submitPost(coords.latitude, coords.longitude);
        },
        async (geoError) => {
          console.warn("Geolocation failed, attempting to submit using saved profile location:", geoError);
          await submitPost();
        },
        { timeout: 8500 }
      );
    } else {
      console.warn("Geolocation not supported, attempting to submit using saved profile location.");
      await submitPost();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <Link href="/customer/dashboard" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-bold text-slate-600 hover:text-slate-950"><ArrowLeft className="size-4" /> Back to dashboard</Link>
        <div className="mt-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white sm:p-9"><span className="grid size-12 place-items-center rounded-2xl bg-white/15"><Send className="size-6" /></span><h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">What do you need?</h1><p className="mt-3 max-w-lg text-sm leading-6 text-indigo-100 sm:text-base">Share a few details and nearby shops can reply with price and availability.</p></div>
          <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-8">
            <Input id="request-title" label="Item or product" placeholder="e.g. Sony headphones, fresh milk" value={title} onChange={(event) => setTitle(event.target.value)} required />
            <Textarea id="request-details" label="Helpful details" placeholder="Brand, size, colour, quantity, budget, or when you need it…" value={description} onChange={(event) => setDescription(event.target.value)} rows={5} />
            <div className="flex items-start gap-3 rounded-2xl bg-indigo-50 p-4 text-sm text-indigo-900"><LocateFixed className="mt-0.5 size-5 shrink-0 text-indigo-600" /><div><p className="font-bold">Location helps us keep it local</p><p className="mt-1 leading-5 text-indigo-700">Your browser will ask for permission when you post. We use it to find nearby shops.</p></div></div>
            {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
            <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Finding nearby shops…" : <>Post request <Send className="size-4" /></>}</Button>
            <p className="flex items-center justify-center gap-2 text-xs text-slate-400"><ShieldCheck className="size-4" /> You decide which shops to contact.</p>
          </form>
        </div>
      </div>
    </div>
  );
}
