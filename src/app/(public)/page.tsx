import { ArrowRight, BookOpenText, Compass, Sparkles } from "lucide-react";

import { ButtonLink } from "@/components/ui/button-link";

const principles = [
  {
    icon: Compass,
    title: "Potrivire, nu volum",
    description: "Alegem titlul care răspunde momentului tău de lectură, nu o listă interminabilă.",
  },
  {
    icon: BookOpenText,
    title: "Selecție editorială",
    description: "Fiecare recomandare importantă vine cu argumente, limite și o voce editorială asumată.",
  },
  {
    icon: Sparkles,
    title: "Recomandări explicate",
    description: "Vei ști de ce o carte ți se potrivește și ce ar putea să nu funcționeze pentru tine.",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <section className="overflow-hidden py-16 md:py-24 lg:py-28">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-5 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
          <div className="lg:col-span-7">
            <p className="text-xs font-bold tracking-[0.18em] text-accent-dark uppercase">
              Cartea Zilei 2.0
            </p>
            <h1 className="mt-5 max-w-4xl font-display text-5xl font-medium tracking-[-0.04em] text-balance sm:text-6xl lg:text-7xl">
              Următoarea carte bună începe aici.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
              Construim un loc românesc pentru alegeri de lectură mai simple, mai bine explicate și mai apropiate de ce cauți acum.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/recomanda-mi">
                Recomandă-mi o carte
                <ArrowRight aria-hidden="true" className="ms-2 size-4" />
              </ButtonLink>
              <ButtonLink href="/despre" variant="secondary">
                Descoperă proiectul
              </ButtonLink>
            </div>
          </div>

          <div className="relative lg:col-span-5" aria-hidden="true">
            <div className="absolute -inset-12 rounded-full bg-accent-soft/60 blur-3xl" />
            <div className="relative mx-auto aspect-[4/5] max-w-sm rounded-[2rem] border border-border bg-surface p-7 shadow-[0_30px_80px_rgba(23,21,18,0.12)] sm:p-9">
              <div className="flex h-full flex-col justify-between rounded-[1.35rem] border border-accent/30 bg-paper p-7">
                <p className="text-xs font-bold tracking-[0.16em] text-accent-dark uppercase">
                  Promisiunea noastră
                </p>
                <p className="font-display text-4xl leading-tight tracking-[-0.035em]">
                  Spune-ne ce cauți. Noi alegem cartea.
                </p>
                <div className="h-px bg-border" />
                <p className="text-sm leading-6 text-muted">
                  O singură alegere principală, cu motive clare și un caveat sincer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface py-12 md:py-16">
        <div className="mx-auto grid w-full max-w-7xl gap-5 px-5 sm:px-6 md:grid-cols-3 lg:px-8">
          {principles.map((principle) => {
            const Icon = principle.icon;

            return (
              <article key={principle.title} className="rounded-2xl border border-border bg-background p-6">
                <Icon aria-hidden="true" className="size-5 text-accent-dark" />
                <h2 className="mt-5 font-display text-2xl font-medium">{principle.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted">{principle.description}</p>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}

