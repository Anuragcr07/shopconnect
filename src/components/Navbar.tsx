"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Menu, ShoppingBag, Store, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  const dashboardHref = session?.user.role === "SHOPKEEPER"
    ? "/shopkeeper/dashboard"
    : "/customer/dashboard";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <nav className="page-shell flex h-18 items-center justify-between" aria-label="Main navigation">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="ShopConnect home">
          <span className="grid size-10 place-items-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 transition-transform group-hover:-rotate-3 group-hover:scale-105">
            <ShoppingBag className="size-5" strokeWidth={2.4} />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
            Shop<span className="text-indigo-600">Connect</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <Link href="/#compare" className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
            Compare prices
          </Link>
          <Link href="/#how-it-works" className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
            How it works
          </Link>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {status === "loading" ? (
            <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-100" />
          ) : session?.user ? (
            <>
              <Link href={dashboardHref} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100">
                Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="min-h-11 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100">
                Log in
              </Link>
              <Link href="/signup" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700">
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close navigation" : "Open navigation"}
          onClick={() => setOpen((value) => !value)}
          className="grid size-11 place-items-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-slate-100 bg-white px-4 pb-5 pt-3 shadow-xl md:hidden">
          <div className="mx-auto flex max-w-lg flex-col gap-1">
            <Link href="/#compare" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50">Compare prices</Link>
            <Link href="/#how-it-works" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50">How it works</Link>
            <div className="my-2 h-px bg-slate-100" />
            {session?.user ? (
              <>
                <Link href={dashboardHref} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl bg-indigo-50 px-4 py-3 font-bold text-indigo-700">
                  <Store className="size-5" /> Dashboard
                </Link>
                <button onClick={() => signOut({ callbackUrl: "/" })} className="min-h-12 rounded-xl px-4 text-left font-semibold text-slate-600 hover:bg-slate-50">Sign out</button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Link href="/login" onClick={() => setOpen(false)} className="grid min-h-12 place-items-center rounded-xl border border-slate-200 font-bold text-slate-700">Log in</Link>
                <Link href="/signup" onClick={() => setOpen(false)} className="grid min-h-12 place-items-center rounded-xl bg-indigo-600 font-bold text-white">Get started</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
