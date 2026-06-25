"use client";

import { useState } from "react";
import { ArrowUpRight, Search, ShoppingBasket, Sparkles } from "lucide-react";

const services = [
  { key: "blinkit", name: "Blinkit", letter: "B", surface: "bg-amber-50 border-amber-200", badge: "bg-amber-400 text-slate-950", action: "text-amber-800" },
  { key: "zepto", name: "Zepto", letter: "Z", surface: "bg-violet-50 border-violet-200", badge: "bg-violet-600 text-white", action: "text-violet-700" },
  { key: "swiggy", name: "Instamart", letter: "S", surface: "bg-orange-50 border-orange-200", badge: "bg-orange-500 text-white", action: "text-orange-700" },
] as const;

export default function PriceComparisonSection() {
  const [query, setQuery] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("");

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    if (value) setSearchedQuery(value);
  };

  const encoded = encodeURIComponent(searchedQuery);
  const links = {
    blinkit: `https://blinkit.com/s/?q=${encoded}`,
    zepto: `https://www.zeptonow.com/search?query=${encoded}`,
    swiggy: `https://www.swiggy.com/instamart/search?custom_back=true&query=${encoded}`,
  };

  return (
    <section id="compare" className="scroll-mt-24 bg-white py-20 sm:py-28">
      <div className="page-shell">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3.5 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-orange-700">
            <Sparkles className="size-3.5" /> Quick compare
          </span>
          <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">Search once. Check everywhere.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Open the same product search across popular delivery apps and compare your options in a few taps.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mx-auto mt-9 flex max-w-2xl flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-2.5 shadow-2xl shadow-slate-200/60 sm:flex-row sm:rounded-full">
          <label className="flex min-h-13 flex-1 items-center gap-3 px-3 sm:px-4">
            <Search className="size-5 shrink-0 text-slate-400" />
            <span className="sr-only">Product to compare</span>
            <input
              type="search"
              placeholder="Try milk, headphones, or bread"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
            />
          </label>
          <button type="submit" className="min-h-13 rounded-2xl bg-slate-950 px-6 font-bold text-white transition hover:bg-indigo-600 sm:rounded-full">
            Compare now
          </button>
        </form>

        {!searchedQuery ? (
          <div className="mx-auto mt-10 flex max-w-xl items-center justify-center gap-3 rounded-2xl bg-slate-50 px-5 py-4 text-sm text-slate-500">
            <ShoppingBasket className="size-5 text-indigo-500" /> Enter an item to reveal direct search links.
          </div>
        ) : (
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {services.map((service) => (
              <a
                key={service.key}
                href={links[service.key]}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex min-h-56 flex-col rounded-3xl border p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl ${service.surface}`}
              >
                <div className={`grid size-12 place-items-center rounded-2xl text-lg font-black shadow-sm ${service.badge}`}>{service.letter}</div>
                <h3 className="mt-5 text-xl font-extrabold text-slate-900">{service.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">Search for <strong>&ldquo;{searchedQuery}&rdquo;</strong> on {service.name}.</p>
                <span className={`mt-auto flex items-center gap-2 pt-5 text-sm font-extrabold ${service.action}`}>
                  Open search <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
