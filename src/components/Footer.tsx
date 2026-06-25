import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="page-shell py-10 sm:py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 text-white">
              <span className="grid size-9 place-items-center rounded-xl bg-indigo-500"><ShoppingBag className="size-4" /></span>
              <span className="text-lg font-extrabold">ShopConnect</span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
              Helping local shoppers find what they need and local businesses meet the people nearby.
            </p>
          </div>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
            <Link href="/#compare" className="transition hover:text-white">Compare prices</Link>
            <Link href="/#how-it-works" className="transition hover:text-white">How it works</Link>
            <Link href="/signup" className="transition hover:text-white">Join ShopConnect</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
