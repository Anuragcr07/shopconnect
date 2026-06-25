import Link from "next/link";
import { ArrowRight, Check, MapPin, MessageCircle, Search, Store } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white py-16 sm:py-20 lg:py-28">
      <div className="soft-grid absolute inset-0 -z-20 opacity-60" />
      <div className="absolute left-1/2 top-0 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-300/30 blur-3xl sm:h-[34rem] sm:w-[34rem]" />

      <div className="page-shell grid items-center gap-14 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
        <div className="text-center lg:text-left">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-3.5 py-2 text-xs font-bold text-indigo-700 shadow-sm sm:text-sm">
            <MapPin className="size-4" /> Shopping nearby, made simple
          </div>
          <h1 className="text-balance text-4xl font-black leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-7xl">
            Find it nearby.<br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">Buy it better.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 lg:mx-0">
            Tell local shops what you need once. Compare real offers, chat directly, and choose the best option without calling store after store.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link href="/signup" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 font-bold text-white shadow-xl shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700">
              Post what you need <ArrowRight className="size-4" />
            </Link>
            <Link href="/#how-it-works" className="inline-flex min-h-13 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3.5 font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
              See how it works
            </Link>
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-medium text-slate-500 lg:justify-start">
            <span className="flex items-center gap-1.5"><Check className="size-4 text-emerald-500" /> Free to post</span>
            <span className="flex items-center gap-1.5"><Check className="size-4 text-emerald-500" /> Local responses</span>
            <span className="flex items-center gap-1.5"><Check className="size-4 text-emerald-500" /> Direct chat</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg">
          <div className="glass-panel relative rounded-[2rem] p-4 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Live request</p>
                <h2 className="mt-1 text-lg font-extrabold text-slate-900">Sony wireless headphones</h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">3 offers</span>
            </div>

            <div className="space-y-3">
              {[
                { shop: "City Electronics", detail: "In stock · ₹4,299", color: "bg-indigo-600", icon: Store },
                { shop: "Sound Point", detail: "Pickup today · ₹4,450", color: "bg-violet-500", icon: MessageCircle },
                { shop: "Digital Corner", detail: "1.2 km away · ₹4,390", color: "bg-orange-500", icon: MapPin },
              ].map(({ shop, detail, color, icon: Icon }) => (
                <div key={shop} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm sm:p-4">
                  <span className={`grid size-11 shrink-0 place-items-center rounded-xl text-white ${color}`}><Icon className="size-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-900">{shop}</p>
                    <p className="mt-0.5 truncate text-sm text-slate-500">{detail}</p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-slate-300" />
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-950 p-4 text-white">
              <span className="grid size-10 place-items-center rounded-xl bg-white/10"><Search className="size-5" /></span>
              <div><p className="text-sm font-bold">One request. Multiple options.</p><p className="text-xs text-slate-400">You stay in control.</p></div>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-5 -z-10 h-32 w-32 rounded-full bg-orange-300/40 blur-2xl" />
        </div>
      </div>
    </section>
  );
}
