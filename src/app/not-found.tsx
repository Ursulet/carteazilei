import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center bg-paper py-20">
      <div className="mx-auto w-full max-w-3xl px-5 text-center sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Eroare 404</p>
        <h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.03em] sm:text-6xl">Pagina nu se află pe raftul acesta.</h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-muted">Adresa poate fi veche sau conținutul nu mai este public. Poți reveni la recomandările editoriale ori poți căuta un titlu.</p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-6 text-sm font-bold text-white hover:bg-brand-hover">Înapoi acasă</Link>
          <Link href="/cauta" className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-surface px-6 text-sm font-bold hover:border-brand">Caută o carte</Link>
        </div>
      </div>
    </main>
  );
}
