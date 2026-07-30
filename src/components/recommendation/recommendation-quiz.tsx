"use client";

import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useReducer, useState } from "react";

import type { RecommendationStepPayload } from "@/domain/recommendation/input";
import {
  dealBreakerValues,
  readingLengthValues,
  readingNeedValues,
  readingPaceValues,
  recommendationStepOrder,
  type DealBreaker,
  type LikedBookSummary,
  type ReadingLength,
  type ReadingNeed,
  type ReadingPace,
  type RecommendationSessionView,
  type SelfRecommendationAnswers,
} from "@/domain/recommendation/types";

type GenreOption = { id: string; name: string };

type QuizState = {
  screen: "entry" | "quiz" | "completed";
  stepIndex: number;
  answers: SelfRecommendationAnswers;
  likedBook: LikedBookSummary | null;
  busy: boolean;
  error: string | null;
};

type QuizAction =
  | { type: "START_REQUEST" }
  | { type: "SESSION_READY"; session: RecommendationSessionView }
  | { type: "SET_NEED"; value: ReadingNeed }
  | { type: "SET_GENRES"; value: string[] }
  | { type: "SET_PACE"; value: ReadingPace }
  | { type: "SET_LENGTH"; value: ReadingLength }
  | { type: "SET_LIKED_BOOK"; value: LikedBookSummary | null }
  | { type: "SET_DEAL_BREAKERS"; value: DealBreaker[] }
  | { type: "SAVE_REQUEST" }
  | { type: "ADVANCE"; session: RecommendationSessionView }
  | { type: "BACK" }
  | { type: "COMPLETED"; session: RecommendationSessionView }
  | { type: "FAILED"; message: string };

function firstIncompleteStep(answers: SelfRecommendationAnswers) {
  if (!answers.need) return 0;
  if (!answers.genres?.length) return 1;
  if (!answers.pace) return 2;
  if (!answers.length) return 3;
  if (!("likedBookId" in answers)) return 4;
  if (!answers.dealBreakers?.length) return 5;
  return 5;
}

function initialQuizState(session: RecommendationSessionView | null): QuizState {
  if (!session) {
    return {
      screen: "entry",
      stepIndex: 0,
      answers: {},
      likedBook: null,
      busy: false,
      error: null,
    };
  }
  return {
    screen: session.status === "completed" ? "completed" : "quiz",
    stepIndex: firstIncompleteStep(session.answers),
    answers: session.answers,
    likedBook: session.likedBook,
    busy: false,
    error: null,
  };
}

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "START_REQUEST":
      return { ...state, busy: true, error: null };
    case "SESSION_READY":
      return {
        screen: action.session.status === "completed" ? "completed" : "quiz",
        stepIndex: firstIncompleteStep(action.session.answers),
        answers: action.session.answers,
        likedBook: action.session.likedBook,
        busy: false,
        error: null,
      };
    case "SET_NEED":
      return { ...state, answers: { ...state.answers, need: action.value }, error: null };
    case "SET_GENRES":
      return { ...state, answers: { ...state.answers, genres: action.value }, error: null };
    case "SET_PACE":
      return { ...state, answers: { ...state.answers, pace: action.value }, error: null };
    case "SET_LENGTH":
      return { ...state, answers: { ...state.answers, length: action.value }, error: null };
    case "SET_LIKED_BOOK":
      return {
        ...state,
        answers: { ...state.answers, likedBookId: action.value?.id ?? null },
        likedBook: action.value,
        error: null,
      };
    case "SET_DEAL_BREAKERS":
      return {
        ...state,
        answers: { ...state.answers, dealBreakers: action.value },
        error: null,
      };
    case "SAVE_REQUEST":
      return { ...state, busy: true, error: null };
    case "ADVANCE":
      return {
        ...state,
        stepIndex: Math.min(state.stepIndex + 1, recommendationStepOrder.length - 1),
        answers: action.session.answers,
        likedBook: action.session.likedBook,
        busy: false,
        error: null,
      };
    case "BACK":
      return { ...state, stepIndex: Math.max(0, state.stepIndex - 1), error: null };
    case "COMPLETED":
      return {
        ...state,
        screen: "completed",
        answers: action.session.answers,
        likedBook: action.session.likedBook,
        busy: false,
        error: null,
      };
    case "FAILED":
      return { ...state, busy: false, error: action.message };
  }
}

const needLabels: Record<(typeof readingNeedValues)[number], { title: string; text: string }> = {
  captivating: { title: "Să mă captiveze", text: "Vreau să intru repede în poveste și să-mi fie greu să o las." },
  relaxing: { title: "Să mă relaxeze", text: "Caut o lectură care să-mi ofere spațiu și confort." },
  thought_provoking: { title: "Să mă facă să gândesc", text: "Vreau idei, întrebări și perspective care rămân cu mine." },
  learning: { title: "Să învăț ceva", text: "Caut informație clară și utilă, nu doar divertisment." },
  emotional: { title: "Să mă emoționeze", text: "Vreau o carte cu miză umană și impact afectiv." },
  out_of_routine: { title: "Să mă scoată din rutină", text: "Sunt deschis la o experiență diferită de lecturile mele obișnuite." },
};

const paceLabels: Record<(typeof readingPaceValues)[number], { title: string; text: string }> = {
  slow_atmospheric: { title: "Lent și atmosferic", text: "Îmi place să petrec timp în lume, voce și detalii." },
  balanced: { title: "Echilibrat", text: "Vreau alternanță între momente calme și progres constant." },
  fast: { title: "Rapid", text: "Prefer capitole și evenimente care mă duc repede înainte." },
  any: { title: "Nu contează", text: "Ritmul nu este un criteriu decisiv pentru mine." },
};

const lengthLabels: Record<(typeof readingLengthValues)[number], { title: string; text: string }> = {
  under_200: { title: "Sub 200 de pagini", text: "O lectură scurtă, potrivită pentru puțin timp disponibil." },
  "200_350": { title: "200–350 de pagini", text: "O lungime medie, ușor de integrat într-o săptămână aglomerată." },
  "350_500": { title: "350–500 de pagini", text: "Am timp pentru o poveste sau o idee dezvoltată pe larg." },
  over_500: { title: "Peste 500 de pagini", text: "Sunt pregătit pentru o lectură amplă." },
  any: { title: "Nu contează", text: "Lungimea nu ar trebui să limiteze alegerea." },
};

const dealBreakerLabels: Record<(typeof dealBreakerValues)[number], string> = {
  too_much_romance: "Prea mult romance",
  explicit_violence: "Violență explicită",
  heavy_topics: "Subiecte foarte grele",
  slow_burn: "Slow burn",
  technical_explanations: "Explicații tehnice",
  ambiguous_ending: "Final ambiguu",
  none: "Niciunul",
};

function ChoiceButton({
  selected,
  disabled = false,
  title,
  text,
  onClick,
}: {
  selected: boolean;
  disabled?: boolean;
  title: string;
  text?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-start justify-between gap-4 rounded-2xl border px-5 py-4 text-left transition duration-200 disabled:cursor-not-allowed disabled:opacity-45 ${selected ? "border-brand bg-accent-soft text-foreground" : "border-border bg-surface hover:-translate-y-0.5 hover:border-accent hover:shadow-sm"}`}
    >
      <span>
        <strong className="block text-base">{title}</strong>
        {text ? <span className="mt-1 block text-sm leading-6 text-muted">{text}</span> : null}
      </span>
      <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border ${selected ? "border-brand bg-brand text-white" : "border-border"}`}>
        {selected ? <Check aria-hidden="true" className="size-4" /> : null}
      </span>
    </button>
  );
}

async function requestSession(
  input: RequestInit,
  endpoint = "/api/recommendation/session",
) {
  const response = await fetch(endpoint, {
    ...input,
    headers: { "content-type": "application/json", ...input.headers },
    credentials: "same-origin",
  });
  const body = (await response.json().catch(() => null)) as {
    ok?: boolean;
    session?: RecommendationSessionView;
    message?: string;
  } | null;
  if (!response.ok || !body?.ok || !body.session) {
    throw new Error(body?.message || "Cererea nu a putut fi finalizată.");
  }
  return body.session;
}

async function requestCompletion() {
  const response = await fetch("/api/recommendation/session/complete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
    credentials: "same-origin",
  });
  const body = (await response.json().catch(() => null)) as {
    ok?: boolean;
    session?: RecommendationSessionView;
    resultPath?: string;
    message?: string;
  } | null;
  if (!response.ok || !body?.ok || !body.session || !body.resultPath) {
    throw new Error(body?.message || "Recomandarea nu a putut fi pregătită.");
  }
  return { session: body.session, resultPath: body.resultPath };
}

function currentPayload(state: QuizState): RecommendationStepPayload | null {
  const step = recommendationStepOrder[state.stepIndex];
  switch (step) {
    case "need": return state.answers.need ? { step, value: state.answers.need } : null;
    case "genres": return state.answers.genres?.length ? { step, value: state.answers.genres } : null;
    case "pace": return state.answers.pace ? { step, value: state.answers.pace } : null;
    case "length": return state.answers.length ? { step, value: state.answers.length } : null;
    case "liked_book": return { step, value: state.answers.likedBookId ?? null };
    case "deal_breakers": return state.answers.dealBreakers?.length ? { step, value: state.answers.dealBreakers } : null;
    default: return null;
  }
}

export function RecommendationQuiz({
  genres,
  initialSession,
}: {
  genres: GenreOption[];
  initialSession: RecommendationSessionView | null;
}) {
  const [state, dispatch] = useReducer(quizReducer, initialSession, initialQuizState);
  const [bookQuery, setBookQuery] = useState(
    initialSession?.likedBook
      ? `${initialSession.likedBook.title} — ${initialSession.likedBook.author}`
      : "",
  );
  const [bookResults, setBookResults] = useState<LikedBookSummary[]>([]);
  const [searching, setSearching] = useState(false);

  const selectedGenres = state.answers.genres ?? [];
  const progress = ((state.stepIndex + 1) / recommendationStepOrder.length) * 100;

  useEffect(() => {
    if (
      state.screen !== "quiz" ||
      recommendationStepOrder[state.stepIndex] !== "liked_book" ||
      state.likedBook ||
      bookQuery.trim().length < 2
    ) {
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/recommendation/books?q=${encodeURIComponent(bookQuery.trim())}`, {
          signal: controller.signal,
          credentials: "same-origin",
        });
        const body = (await response.json()) as { ok?: boolean; books?: LikedBookSummary[] };
        setBookResults(response.ok && body.ok ? body.books ?? [] : []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setBookResults([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [bookQuery, state.likedBook, state.screen, state.stepIndex]);

  const canContinue = useMemo(() => currentPayload(state) !== null, [state]);

  async function start(forceNew = false) {
    dispatch({ type: "START_REQUEST" });
    try {
      const session = await requestSession({
        method: "POST",
        body: JSON.stringify({ branch: "self", forceNew }),
      });
      setBookQuery(session.likedBook ? `${session.likedBook.title} — ${session.likedBook.author}` : "");
      dispatch({ type: "SESSION_READY", session });
    } catch (error) {
      dispatch({ type: "FAILED", message: error instanceof Error ? error.message : "Sesiunea nu a putut fi pornită." });
    }
  }

  async function continueQuiz() {
    const payload = currentPayload(state);
    if (!payload) {
      dispatch({ type: "FAILED", message: "Alege o opțiune înainte de a continua." });
      return;
    }
    dispatch({ type: "SAVE_REQUEST" });
    try {
      const session = await requestSession({ method: "PATCH", body: JSON.stringify(payload) });
      if (state.stepIndex === recommendationStepOrder.length - 1) {
        const completed = await requestCompletion();
        window.location.assign(completed.resultPath);
      } else {
        dispatch({ type: "ADVANCE", session });
      }
    } catch (error) {
      dispatch({ type: "FAILED", message: error instanceof Error ? error.message : "Răspunsul nu a putut fi salvat." });
    }
  }

  async function openResult() {
    dispatch({ type: "SAVE_REQUEST" });
    try {
      const completed = await requestCompletion();
      window.location.assign(completed.resultPath);
    } catch (error) {
      dispatch({
        type: "FAILED",
        message: error instanceof Error ? error.message : "Recomandarea nu a putut fi deschisă.",
      });
    }
  }

  function toggleGenre(value: string) {
    if (value === "any") {
      dispatch({ type: "SET_GENRES", value: ["any"] });
      return;
    }
    const withoutAny = selectedGenres.filter((item) => item !== "any");
    dispatch({
      type: "SET_GENRES",
      value: withoutAny.includes(value)
        ? withoutAny.filter((item) => item !== value)
        : [...withoutAny, value].slice(0, 3),
    });
  }

  function toggleDealBreaker(value: DealBreaker) {
    const selected = state.answers.dealBreakers ?? [];
    if (value === "none") {
      dispatch({ type: "SET_DEAL_BREAKERS", value: ["none"] });
      return;
    }
    const withoutNone = selected.filter((item) => item !== "none");
    dispatch({
      type: "SET_DEAL_BREAKERS",
      value: withoutNone.includes(value)
        ? withoutNone.filter((item) => item !== value)
        : [...withoutNone, value],
    });
  }

  if (state.screen === "entry") {
    return (
      <section className="py-16 md:py-24 lg:py-28">
        <div className="mx-auto w-full max-w-3xl px-5 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Recomandare personalizată</p>
          <h1 className="mt-5 font-display text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl">Pentru cine cauți următoarea carte?</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">Alegem întrebări diferite pentru contexte diferite. Începem cu fluxul complet pentru propria ta lectură.</p>
          <div className="mt-10">
            <button type="button" onClick={() => void start()} disabled={state.busy} className="group flex w-full items-center gap-5 rounded-2xl border border-brand bg-surface p-6 text-left transition hover:-translate-y-0.5 hover:bg-accent-soft hover:shadow-sm disabled:cursor-wait disabled:opacity-60">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand text-white"><BookOpen aria-hidden="true" className="size-6" /></span>
              <span className="min-w-0 flex-1"><strong className="font-display text-2xl font-semibold">Pentru mine</strong><span className="mt-1 block text-sm leading-6 text-muted">Șase întrebări despre nevoia, ritmul și limitele tale de lectură.</span></span>
              <ArrowRight aria-hidden="true" className="size-5 shrink-0 text-brand" />
            </button>
          </div>
          {state.error ? <p role="alert" className="mt-5 rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm font-semibold text-danger">{state.error}</p> : null}
          <p className="mt-8 flex items-start gap-2 text-xs leading-5 text-muted"><ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />Răspunsurile sunt folosite pentru această recomandare și nu pentru publicitate comportamentală.</p>
        </div>
      </section>
    );
  }

  if (state.screen === "completed") {
    return (
      <section className="py-16 md:py-24 lg:py-28">
        <div className="mx-auto w-full max-w-3xl px-5 sm:px-6">
          <div className="rounded-[2rem] border border-brand/30 bg-surface p-7 shadow-sm sm:p-10">
            <span className="flex size-12 items-center justify-center rounded-full bg-brand text-white"><Check aria-hidden="true" className="size-6" /></span>
            <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Profil de lectură salvat</p>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Avem contextul de care avem nevoie.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">Am găsit cărțile cele mai apropiate de preferințele tale. Deschide recomandarea pentru a vedea alegerea și motivele ei.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => void openResult()} disabled={state.busy} className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-6 text-sm font-bold text-white hover:bg-brand-hover disabled:cursor-wait disabled:opacity-60"><ArrowRight aria-hidden="true" className="me-2 size-4" />{state.busy ? "Pregătim recomandarea…" : "Vezi recomandarea"}</button>
              <button type="button" onClick={() => void start(true)} disabled={state.busy} className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-bold hover:border-brand disabled:cursor-wait disabled:opacity-60"><RotateCcw aria-hidden="true" className="me-2 size-4" />Începe un profil nou</button>
              <Link href="/cum-recomandam" className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-bold hover:border-brand">Cum funcționează recomandarea</Link>
            </div>
            {state.error ? <p role="alert" className="mt-5 text-sm font-semibold text-danger">{state.error}</p> : null}
          </div>
        </div>
      </section>
    );
  }

  const step = recommendationStepOrder[state.stepIndex];
  return (
    <section className="py-12 md:py-20">
      <div className="mx-auto w-full max-w-3xl px-5 sm:px-6">
        <div aria-label={`Pasul ${state.stepIndex + 1} din ${recommendationStepOrder.length}`}>
          <div className="flex items-center justify-between gap-4 text-sm font-bold"><span>Pasul {state.stepIndex + 1} din {recommendationStepOrder.length}</span><span className="text-muted">Pentru mine</span></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-border"><div className="h-full rounded-full bg-brand transition-[width] duration-200" style={{ width: `${progress}%` }} /></div>
        </div>

        <div key={step} className="mt-10 animate-[quiz-step_180ms_ease-out]" aria-live="polite">
          {step === "need" ? <><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Semnalul principal</p><h1 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">Ce ai nevoie de la următoarea carte?</h1><p className="mt-4 text-base leading-7 text-muted">Alege efectul pe care îl cauți acum, nu ce citești de obicei.</p><div className="mt-8 grid gap-3 sm:grid-cols-2">{readingNeedValues.map((value) => <ChoiceButton key={value} selected={state.answers.need === value} title={needLabels[value].title} text={needLabels[value].text} onClick={() => dispatch({ type: "SET_NEED", value })} />)}</div></> : null}

          {step === "genres" ? <><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Preferințe</p><h1 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">Ce genuri ai vrea să citești?</h1><p className="mt-4 text-base leading-7 text-muted">Poți alege maximum trei. „Nu contează” este o alegere exclusivă.</p><div className="mt-8 grid gap-3 sm:grid-cols-2"><ChoiceButton selected={selectedGenres.includes("any")} title="Nu contează genul" text="Lasă nevoia și profilul lecturii să decidă." onClick={() => toggleGenre("any")} />{genres.map((genre) => <ChoiceButton key={genre.id} selected={selectedGenres.includes(genre.id)} disabled={!selectedGenres.includes(genre.id) && !selectedGenres.includes("any") && selectedGenres.length >= 3} title={genre.name} onClick={() => toggleGenre(genre.id)} />)}</div>{genres.length === 0 ? <p className="mt-4 text-sm leading-6 text-muted">Nu există încă genuri publicate; poți continua cu „Nu contează genul”.</p> : null}</> : null}

          {step === "pace" ? <><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Experiența lecturii</p><h1 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">Ce ritm ți se potrivește acum?</h1><p className="mt-4 text-base leading-7 text-muted">Ritmul descrie cum înaintează lectura, nu calitatea cărții.</p><div className="mt-8 grid gap-3">{readingPaceValues.map((value) => <ChoiceButton key={value} selected={state.answers.pace === value} title={paceLabels[value].title} text={paceLabels[value].text} onClick={() => dispatch({ type: "SET_PACE", value })} />)}</div></> : null}

          {step === "length" ? <><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Timp disponibil</p><h1 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">Cât de lungă poate fi următoarea carte?</h1><p className="mt-4 text-base leading-7 text-muted">Folosim lungimea ca semnal de potrivire, nu ca judecată editorială.</p><div className="mt-8 grid gap-3">{readingLengthValues.map((value) => <ChoiceButton key={value} selected={state.answers.length === value} title={lengthLabels[value].title} text={lengthLabels[value].text} onClick={() => dispatch({ type: "SET_LENGTH", value })} />)}</div></> : null}

              {step === "liked_book" ? <><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Referință opțională</p><h1 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">Spune-ne o carte care ți-a plăcut</h1><p className="mt-4 text-base leading-7 text-muted">O folosim numai ca semnal de similaritate. Poți continua fără să alegi una.</p><div className="relative mt-8"><label htmlFor="liked-book" className="text-sm font-bold">Titlu sau autor</label><div className="mt-2 flex items-center rounded-2xl border border-border bg-surface px-4 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15"><Search aria-hidden="true" className="size-5 shrink-0 text-muted" /><input id="liked-book" type="search" role="combobox" aria-autocomplete="list" autoComplete="off" value={bookQuery} onChange={(event) => { setBookQuery(event.target.value); setBookResults([]); setSearching(false); if (state.likedBook) dispatch({ type: "SET_LIKED_BOOK", value: null }); }} aria-expanded={bookResults.length > 0} aria-controls="liked-book-results" placeholder="De exemplu: Dune sau Frank Herbert" className="min-h-12 min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none" />{state.likedBook ? <button type="button" onClick={() => { setBookQuery(""); setBookResults([]); setSearching(false); dispatch({ type: "SET_LIKED_BOOK", value: null }); }} aria-label="Elimină cartea selectată" className="flex size-10 items-center justify-center rounded-full text-muted hover:bg-paper hover:text-foreground"><X aria-hidden="true" className="size-4" /></button> : null}</div>{searching ? <p className="mt-2 text-xs text-muted">Căutăm în catalog…</p> : null}{bookResults.length ? <div id="liked-book-results" role="listbox" className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">{bookResults.map((book) => <button key={book.id} type="button" role="option" aria-selected={state.likedBook?.id === book.id} onClick={() => { dispatch({ type: "SET_LIKED_BOOK", value: book }); setBookQuery(`${book.title} — ${book.author}`); setBookResults([]); setSearching(false); }} className="block w-full border-b border-border px-5 py-3 text-left last:border-0 hover:bg-paper focus:bg-paper"><strong className="block text-sm">{book.title}</strong><span className="mt-1 block text-xs text-muted">{book.author}</span></button>)}</div> : null}</div>{state.likedBook ? <p className="mt-4 rounded-xl border border-brand/20 bg-accent-soft px-4 py-3 text-sm"><strong>{state.likedBook.title}</strong> de {state.likedBook.author}</p> : null}</> : null}

          {step === "deal_breakers" ? <><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Limite personale</p><h1 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">Ce ai prefera să eviți?</h1><p className="mt-4 text-base leading-7 text-muted">Poți alege mai multe. Aceste semnale vor elimina sau penaliza potrivirile incompatibile.</p><div className="mt-8 grid gap-3 sm:grid-cols-2">{dealBreakerValues.map((value) => <ChoiceButton key={value} selected={state.answers.dealBreakers?.includes(value) ?? false} title={dealBreakerLabels[value]} onClick={() => toggleDealBreaker(value)} />)}</div></> : null}
        </div>

        {state.error ? <p role="alert" className="mt-6 rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm font-semibold text-danger">{state.error}</p> : null}

        <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={() => dispatch({ type: "BACK" })} disabled={state.stepIndex === 0 || state.busy} className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-bold hover:border-brand disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft aria-hidden="true" className="me-2 size-4" />Înapoi</button>
          <button type="button" onClick={() => void continueQuiz()} disabled={!canContinue || state.busy} className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-6 text-sm font-bold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50">{state.busy ? "Se salvează…" : state.stepIndex === recommendationStepOrder.length - 1 ? "Finalizează profilul" : "Continuă"}<ArrowRight aria-hidden="true" className="ms-2 size-4" /></button>
        </div>
        <p className="mt-6 text-center text-xs leading-5 text-muted">Răspunsurile se păstrează pe măsură ce înaintezi.</p>
      </div>
    </section>
  );
}
