import Link from "next/link";

export function BookFeedbackEntry({ slug }: { slug: string }) {
  return (
    <section className="rounded-[2rem] border border-border bg-brand p-7 text-white sm:p-10">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">Părerea ta</p>
      <h2 className="mt-3 font-display text-3xl font-semibold">Ai citit-o?</h2>
      <p className="mt-4 max-w-2xl leading-7 text-white/70">Spune-ne dacă recomandarea te-a ajutat și cum ți s-a părut cartea.</p>
      <Link href={`/contact?subiect=feedback-carte&carte=${encodeURIComponent(slug)}`} className="mt-6 inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-bold text-brand hover:bg-paper">Trimite feedback</Link>
    </section>
  );
}
