import { CheckCircle2, MessageSquareText, Send, Store } from "lucide-react";

const steps = [
  { number: "01", title: "Post your request", description: "Describe what you need and share your area. It takes less than a minute.", icon: Send },
  { number: "02", title: "Get local offers", description: "Nearby shopkeepers reply with availability, price, and product photos.", icon: Store },
  { number: "03", title: "Choose with confidence", description: "Compare options, chat directly, and get directions to your chosen shop.", icon: MessageSquareText },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-slate-950 py-20 text-white sm:py-28">
      <div className="page-shell">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-indigo-400">How it works</span>
          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">From “I need it” to “I found it”</h2>
          <p className="mt-5 text-base leading-7 text-slate-400 sm:text-lg">A faster, friendlier way to shop locally—without the guesswork.</p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3 md:gap-5 lg:mt-16">
          {steps.map(({ number, title, description, icon: Icon }) => (
            <article key={number} className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:-translate-y-1 hover:border-indigo-500/60 sm:p-8">
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-indigo-500/15 text-indigo-300"><Icon className="size-6" /></span>
                <span className="text-4xl font-black text-slate-800 transition group-hover:text-slate-700">{number}</span>
              </div>
              <h3 className="mt-8 text-xl font-extrabold">{title}</h3>
              <p className="mt-3 leading-7 text-slate-400">{description}</p>
              <CheckCircle2 className="absolute -bottom-7 -right-7 size-28 text-white/[0.025]" />
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-5 rounded-3xl border border-indigo-400/20 bg-indigo-500/10 p-6 text-center sm:flex-row sm:p-8 sm:text-left">
          <div><p className="font-extrabold text-white">Own a local shop?</p><p className="mt-1 text-sm text-indigo-200">Reach customers nearby when they are ready to buy.</p></div>
          <a href="/signup" className="inline-flex min-h-12 shrink-0 items-center rounded-xl bg-white px-5 py-3 font-bold text-slate-950 transition hover:bg-indigo-50">Join as a shopkeeper</a>
        </div>
      </div>
    </section>
  );
}
