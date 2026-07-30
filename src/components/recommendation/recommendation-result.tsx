"use client";

import {
  ArrowRight,
  BookCheck,
  Check,
  Info,
  Star,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ProductEventTracker, sendProductEvent } from "@/components/analytics/product-event-tracker";
import { BookCover } from "@/components/editorial/book-cover";
import { RetailerOffers } from "@/components/editorial/retailer-offers";
import type { PublicRecommendationResult } from "@/domain/recommendation/result-service";

type FeedbackAction = "positive" | "negative" | "started" | "finished" | "rating";

function ResultFeedback({
  resultId,
  resultToken,
}: {
  resultId: string;
  resultToken: string;
}) {
  const [reaction, setReaction] = useState<"positive" | "negative" | null>(null);
  const [readingState, setReadingState] = useState<"started" | "finished" | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function send(action: FeedbackAction, nextRating?: number) {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/recommendation/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          resultToken,
          resultId,
          action,
          ...(action === "rating" ? { rating: nextRating } : {}),
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;
      if (!response.ok || !body?.ok) {
        throw new Error(body?.message || "Feedbackul nu a putut fi salvat.");
      }
      if (action === "positive" || action === "negative") setReaction(action);
      if (action === "started" || action === "finished") setReadingState(action);
      if (action === "rating" && nextRating) setRating(nextRating);
      setMessage("Mulțumim — feedbackul a fost salvat.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Feedbackul nu a putut fi salvat.");
    } finally {
      setBusy(false);
    }
  }

  const compactButton =
    "inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-sm font-bold transition disabled:cursor-wait disabled:opacity-55";

  return (
    <section className="border-t border-border pt-10" aria-labelledby="recommendation-feedback-title">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Ajută-ne să calibrăm motorul</p>
      <h2 id="recommendation-feedback-title" className="mt-3 font-display text-3xl font-semibold">
        Cum ți se pare recomandarea?
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        Feedbackul este păstrat pentru evaluarea versiunilor viitoare și nu schimbă pe loc rezultatul sau ordinea ofertelor.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" disabled={busy} aria-pressed={reaction === "positive"} onClick={() => void send("positive")} className={`${compactButton} ${reaction === "positive" ? "border-brand bg-brand text-white" : "border-border hover:border-brand"}`}>
          <ThumbsUp aria-hidden="true" className="me-2 size-4" />Da, pare potrivită
        </button>
        <button type="button" disabled={busy} aria-pressed={reaction === "negative"} onClick={() => void send("negative")} className={`${compactButton} ${reaction === "negative" ? "border-brand bg-brand text-white" : "border-border hover:border-brand"}`}>
          <ThumbsDown aria-hidden="true" className="me-2 size-4" />Nu prea
        </button>
        <button type="button" disabled={busy} aria-pressed={readingState === "started"} onClick={() => void send("started")} className={`${compactButton} ${readingState === "started" ? "border-accent bg-accent-soft" : "border-border hover:border-brand"}`}>
          Am început-o
        </button>
        <button type="button" disabled={busy} aria-pressed={readingState === "finished"} onClick={() => void send("finished")} className={`${compactButton} ${readingState === "finished" ? "border-accent bg-accent-soft" : "border-border hover:border-brand"}`}>
          Am terminat-o
        </button>
      </div>

      <div className="mt-6">
        <p id="recommendation-rating-label" className="text-sm font-bold">Calitatea recomandării, de la 1 la 5</p>
        <div className="mt-2 flex gap-1" role="group" aria-labelledby="recommendation-rating-label">
          {[1, 2, 3, 4, 5].map((value) => (
            <button key={value} type="button" disabled={busy} aria-label={`${value} din 5`} aria-pressed={rating === value} onClick={() => void send("rating", value)} className="flex size-11 items-center justify-center rounded-full hover:bg-accent-soft disabled:cursor-wait disabled:opacity-55">
              <Star aria-hidden="true" className={`size-5 ${rating !== null && value <= rating ? "fill-accent text-accent-dark" : "text-muted"}`} />
            </button>
          ))}
        </div>
      </div>
      <p className="mt-3 min-h-5 text-sm text-muted" aria-live="polite">{message}</p>
    </section>
  );
}

export function RecommendationResult({
  resultToken,
  data,
}: {
  resultToken: string;
  data: PublicRecommendationResult;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const result = data.results[currentIndex];

  if (!result) {
    return (
      <div className="py-16 md:py-24">
        <div className="mx-auto w-full max-w-3xl px-5 sm:px-6">
          <div className="rounded-[2rem] border border-border bg-surface p-8 sm:p-12">
            <Info aria-hidden="true" className="size-10 text-accent-dark" />
            <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Recomandarea ta</p>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Nu am găsit încă o carte suficient de apropiată.</h1>
            <p className="mt-6 text-lg leading-8 text-muted">Poți ajusta preferințele sau poți explora catalogul pentru a alege direct.</p>
            <Link href="/recomanda-mi" className="mt-8 inline-flex min-h-11 items-center rounded-full bg-brand px-6 text-sm font-bold text-white hover:bg-brand-hover">Reia profilul de lectură</Link>
          </div>
        </div>
      </div>
    );
  }

  const nextRank = data.results[currentIndex + 1]?.rank;
  const nextResult = data.results[currentIndex + 1];
  const eyebrow = result.rank === 1
    ? "ALEGEREA NOASTRĂ PENTRU TINE"
    : `ALTERNATIVA #${result.rank}`;

  return (
    <div>
      <ProductEventTracker
        key={`shown-${result.id}`}
        event={{
          event: "recommendation_result_shown",
          resultToken,
          resultId: result.id,
          sourcePath: "/recomanda-mi/rezultat",
        }}
      />
      <section className="border-b border-border bg-surface py-12 md:py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 sm:px-6 lg:grid-cols-12 lg:items-center lg:gap-16 lg:px-8">
          <div className="lg:col-span-5">
            <BookCover cover={result.cover} title={result.book.title} priority={result.rank === 1} className="mx-auto max-w-sm" />
          </div>
          <div className="lg:col-span-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">{eyebrow}</p>
            <div className="mt-5 inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-brand">
              <BookCheck aria-hidden="true" className="me-2 size-4" />{result.explanation.confidenceLabel}
            </div>
            <h1 className="mt-5 font-display text-5xl font-semibold tracking-[-0.03em] text-balance sm:text-6xl">{result.book.title}</h1>
            <p className="mt-4 text-lg">de <Link href={`/autor/${result.author.slug}`} className="font-bold underline decoration-border underline-offset-4 hover:decoration-brand">{result.author.name}</Link></p>
            {result.pageCount ? <p className="mt-2 text-sm text-muted">{result.pageCount} pagini</p> : null}
            <p className="mt-8 border-s-4 border-accent ps-5 font-display text-2xl leading-9">{result.book.verdict}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-5xl gap-12 px-5 py-16 sm:px-6 md:py-24 lg:px-8">
        <section aria-labelledby="recommendation-reasons-title">
          <h2 id="recommendation-reasons-title" className="font-display text-4xl font-semibold tracking-[-0.03em]">De ce ți-o recomandăm</h2>
          <ul className="mt-7 grid gap-4">
            {result.explanation.reasons.map((reason) => (
              <li key={reason} className="flex gap-4 rounded-2xl border border-border bg-surface p-5 leading-7">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-white"><Check aria-hidden="true" className="size-4" /></span>
                {reason}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-accent/40 bg-accent-soft/35 p-6" aria-labelledby="recommendation-caveat-title">
          <h2 id="recommendation-caveat-title" className="flex items-center gap-3 font-display text-2xl font-semibold"><Info aria-hidden="true" className="size-5 text-accent-dark" />De știut înainte</h2>
          <p className="mt-4 leading-7 text-muted">{result.explanation.caveat}</p>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={`/carte/${result.book.slug}`} className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand px-6 text-sm font-bold text-white hover:bg-brand-hover">Vezi analiza completă<ArrowRight aria-hidden="true" className="ms-2 size-4" /></Link>
          {nextRank && nextResult ? (
            <button type="button" onClick={() => {
              void sendProductEvent({
                event: "recommendation_alternative_requested",
                resultToken,
                fromResultId: result.id,
                resultId: nextResult.id,
                sourcePath: "/recomanda-mi/rezultat",
              });
              setCurrentIndex((index) => index + 1);
            }} className="inline-flex min-h-12 items-center justify-center rounded-full border border-border px-6 text-sm font-bold hover:border-brand">
              Nu mă convinge — arată-mi alternativa #{nextRank}
            </button>
          ) : null}
        </div>

        <section className="border-t border-border pt-12" aria-labelledby="recommendation-offers-title">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Disponibilitate</p>
          <h2 id="recommendation-offers-title" className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em]">Unde o găsești</h2>
          <RetailerOffers
            key={result.id}
            offers={result.offers}
            context={{
              sourceContext: "recommendation",
              sourcePath: "/recomanda-mi/rezultat",
              recommendationResultId: result.id,
            }}
          />
        </section>

        <ResultFeedback key={result.id} resultId={result.id} resultToken={resultToken} />
      </div>
    </div>
  );
}
