"use client";

import { ArrowRight, Baby, Check, ChevronLeft, Gift, RotateCcw, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import type { RecommendationStepPayload } from "@/domain/recommendation/input";
import {
  childAgeValues,
  childGoalValues,
  childReadingLevelValues,
  childReadingModeValues,
  childSensitivityValues,
  giftAgeValues,
  giftOccasionValues,
  giftReadingHabitValues,
  giftRelationshipValues,
  giftStyleValues,
  recommendationStepsForBranch,
  type ChildSensitivity,
  type RecommendationAnswers,
  type RecommendationSessionView,
  type RecommendationStep,
} from "@/domain/recommendation/types";

type GenreOption = { id: string; name: string };

const relationshipLabels = {
  partner: ["Partener / parteneră", "O alegere cu miză personală."],
  family: ["Cineva din familie", "Părinte, frate, soră sau altă rudă."],
  friend: ["Prieten / prietenă", "Pentru cineva ale cărui gusturi le cunoști parțial."],
  colleague: ["Coleg / colegă", "O alegere potrivită și într-un context profesional."],
  teacher: ["Profesor / mentor", "Un gest de apreciere pentru cineva care te-a ghidat."],
  other: ["Altă persoană", "Păstrăm recomandarea cât mai echilibrată."],
} as const;

const giftAgeLabels = {
  "13_17": ["13–17 ani", "Vom căuta titluri potrivite adolescenților."],
  "18_25": ["18–25 ani", "Cititor adult tânăr."],
  "26_40": ["26–40 ani", "Cititor adult."],
  "41_60": ["41–60 ani", "Cititor adult."],
  "60_plus": ["Peste 60 de ani", "Cititor adult; vârsta nu va limita genurile."],
} as const;

const occasionLabels = {
  birthday: ["Zi de naștere", "Un cadou personal, dar ușor de oferit."],
  holidays: ["Sărbători", "O lectură potrivită pentru un moment de răgaz."],
  thank_you: ["Mulțumire", "Un gest atent, fără să fie prea personal."],
  celebration: ["Un moment important", "Aniversare, reușită sau schimbare de etapă."],
  no_occasion: ["Fără ocazie anume", "Cartea este cadoul în sine."],
} as const;

const habitLabels = {
  rare: ["Citește rar", "Favorizăm cărți accesibile și mai scurte."],
  occasional: ["Citește din când în când", "O lungime medie și un ritm echilibrat."],
  regular: ["Citește regulat", "Lungimea nu trebuie să limiteze prea mult alegerea."],
  avid: ["Citește foarte mult", "Putem propune și lecturi mai ample sau neobișnuite."],
  unknown: ["Nu știu", "Nu folosim frecvența ca filtru."],
} as const;

const giftStyleLabels = {
  safe: ["O alegere sigură", "Evităm conținutul greu, ambiguu sau nepotrivit contextului."],
  balanced: ["Echilibrată", "Suficient de familiară, dar cu personalitate."],
  surprise: ["Surprinde-mă", "Acceptăm o alegere mai curajoasă și mai puțin previzibilă."],
} as const;

const childAgeLabels = {
  "3_5": ["3–5 ani", "Lectură împreună cu un adult."],
  "6_8": ["6–8 ani", "Primele lecturi și cărți citite împreună."],
  "9_12": ["9–12 ani", "Lectură independentă în formare."],
  "13_15": ["13–15 ani", "Selecții Young Adult compatibile cu vârsta."],
  "16_17": ["16–17 ani", "Young Adult și titluri potrivite adolescenților."],
} as const;

const levelLabels = {
  beginner: ["La început", "Are nevoie de o carte accesibilă și de progres clar."],
  independent: ["Citește independent", "Poate urmări singur o poveste dezvoltată."],
  advanced: ["Cititor experimentat", "Acceptă structură și idei mai complexe."],
} as const;

const modeLabels = {
  alone: ["Citește singur", "Cartea trebuie să fie accesibilă fără ajutor permanent."],
  together: ["Citiți împreună", "Căutăm cărți potrivite pentru lectură împreună."],
  both: ["Și singur, și împreună", "Căutăm o alegere flexibilă."],
} as const;

const goalLabels = {
  joy: ["Să-i placă lectura", "Prioritizăm o experiență captivantă."],
  confidence: ["Să capete încredere", "O alegere accesibilă, fără presiune inutilă."],
  learning: ["Să învețe ceva", "Căutăm conținut clar, explicativ sau documentar."],
  emotional: ["Să înțeleagă emoții", "O poveste cu miză umană potrivită vârstei."],
} as const;

const sensitivityLabels = {
  violence: ["Violență", "Evităm titlurile cu violență explicită."],
  scary: ["Scene înfricoșătoare", "Evităm atmosfera prea întunecată."],
  grief: ["Doliu sau subiecte grele", "Evităm temele emoționale foarte apăsătoare."],
  complex: ["Explicații complicate", "Preferăm o prezentare mai accesibilă."],
  none: ["Nicio sensibilitate specială", "Rămân active filtrele conservative de vârstă."],
} as const;

function Choice({ selected, title, text, disabled, onClick }: { selected: boolean; title: string; text?: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={selected} disabled={disabled} onClick={onClick} className={`flex w-full items-start justify-between gap-4 rounded-2xl border px-5 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${selected ? "border-brand bg-accent-soft" : "border-border bg-surface hover:-translate-y-0.5 hover:border-accent hover:shadow-sm"}`}>
      <span><strong className="block text-base">{title}</strong>{text ? <span className="mt-1 block text-sm leading-6 text-muted">{text}</span> : null}</span>
      <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border ${selected ? "border-brand bg-brand text-white" : "border-border"}`}>{selected ? <Check aria-hidden="true" className="size-4" /> : null}</span>
    </button>
  );
}

async function updateSession(payload: RecommendationStepPayload) {
  const response = await fetch("/api/recommendation/session", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "same-origin",
  });
  const body = (await response.json().catch(() => null)) as { ok?: boolean; session?: RecommendationSessionView; message?: string } | null;
  if (!response.ok || !body?.ok || !body.session) throw new Error(body?.message || "Răspunsul nu a putut fi salvat.");
  return body.session;
}

async function completeSession() {
  const response = await fetch("/api/recommendation/session/complete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
    credentials: "same-origin",
  });
  const body = (await response.json().catch(() => null)) as { ok?: boolean; session?: RecommendationSessionView; resultPath?: string; message?: string } | null;
  if (!response.ok || !body?.ok || !body.session || !body.resultPath) throw new Error(body?.message || "Recomandarea nu a putut fi pregătită.");
  return { session: body.session, resultPath: body.resultPath };
}

function answerForStep(answers: RecommendationAnswers, step: RecommendationStep) {
  switch (step) {
    case "gift_relationship": return answers.giftRelationship;
    case "gift_age": return answers.giftAge;
    case "gift_occasion": return answers.giftOccasion;
    case "gift_interests": return answers.giftInterests;
    case "gift_reading_habit": return answers.giftReadingHabit;
    case "gift_style": return answers.giftStyle;
    case "child_age": return answers.childAge;
    case "child_reading_level": return answers.childReadingLevel;
    case "child_reading_mode": return answers.childReadingMode;
    case "child_interests": return answers.childInterests;
    case "child_goal": return answers.childGoal;
    case "child_sensitivities": return answers.childSensitivities;
    default: return undefined;
  }
}

function firstIncomplete(answers: RecommendationAnswers, steps: readonly RecommendationStep[]) {
  const index = steps.findIndex((step) => {
    const answer = answerForStep(answers, step);
    return Array.isArray(answer) ? answer.length === 0 : !answer;
  });
  return index === -1 ? steps.length - 1 : index;
}

function payloadForStep(answers: RecommendationAnswers, step: RecommendationStep): RecommendationStepPayload | null {
  switch (step) {
    case "gift_relationship": return answers.giftRelationship ? { step, value: answers.giftRelationship } : null;
    case "gift_age": return answers.giftAge ? { step, value: answers.giftAge } : null;
    case "gift_occasion": return answers.giftOccasion ? { step, value: answers.giftOccasion } : null;
    case "gift_interests": return answers.giftInterests?.length ? { step, value: answers.giftInterests } : null;
    case "gift_reading_habit": return answers.giftReadingHabit ? { step, value: answers.giftReadingHabit } : null;
    case "gift_style": return answers.giftStyle ? { step, value: answers.giftStyle } : null;
    case "child_age": return answers.childAge ? { step, value: answers.childAge } : null;
    case "child_reading_level": return answers.childReadingLevel ? { step, value: answers.childReadingLevel } : null;
    case "child_reading_mode": return answers.childReadingMode ? { step, value: answers.childReadingMode } : null;
    case "child_interests": return answers.childInterests?.length ? { step, value: answers.childInterests } : null;
    case "child_goal": return answers.childGoal ? { step, value: answers.childGoal } : null;
    case "child_sensitivities": return answers.childSensitivities?.length ? { step, value: answers.childSensitivities } : null;
    default: return null;
  }
}

export function BranchRecommendationQuiz({ genres, initialSession, onChangeBranch }: { genres: GenreOption[]; initialSession: RecommendationSessionView; onChangeBranch: () => void }) {
  const branch = initialSession.branch === "child" ? "child" : "gift";
  const steps = recommendationStepsForBranch(branch);
  const [answers, setAnswers] = useState(initialSession.answers);
  const [stepIndex, setStepIndex] = useState(() => firstIncomplete(initialSession.answers, steps));
  const [completed, setCompleted] = useState(initialSession.status === "completed");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const step = steps[stepIndex]!;
  const canContinue = useMemo(() => payloadForStep(answers, step) !== null, [answers, step]);
  const selectedInterests = branch === "gift" ? answers.giftInterests ?? [] : answers.childInterests ?? [];

  function setAnswer(next: Partial<RecommendationAnswers>) {
    setAnswers((current) => ({ ...current, ...next }));
    setError(null);
  }

  function toggleInterest(id: string) {
    const next = id === "any"
      ? ["any"]
      : selectedInterests.filter((value) => value !== "any").includes(id)
        ? selectedInterests.filter((value) => value !== id && value !== "any")
        : [...selectedInterests.filter((value) => value !== "any"), id].slice(0, 3);
    setAnswer(branch === "gift" ? { giftInterests: next } : { childInterests: next });
  }

  function toggleSensitivity(value: ChildSensitivity) {
    const selected = answers.childSensitivities ?? [];
    const next = value === "none"
      ? ["none" as const]
      : selected.filter((item) => item !== "none").includes(value)
        ? selected.filter((item) => item !== value && item !== "none")
        : [...selected.filter((item) => item !== "none"), value];
    setAnswer({ childSensitivities: next });
  }

  async function continueFlow() {
    const payload = payloadForStep(answers, step);
    if (!payload) return setError("Alege o opțiune înainte de a continua.");
    setBusy(true);
    setError(null);
    try {
      const session = await updateSession(payload);
      setAnswers(session.answers);
      if (stepIndex === steps.length - 1) {
        const result = await completeSession();
        setCompleted(true);
        window.location.assign(result.resultPath);
      } else {
        setStepIndex((current) => current + 1);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Răspunsul nu a putut fi salvat.");
    } finally {
      setBusy(false);
    }
  }

  async function openResult() {
    setBusy(true);
    setError(null);
    try {
      const result = await completeSession();
      window.location.assign(result.resultPath);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Recomandarea nu a putut fi deschisă.");
      setBusy(false);
    }
  }

  if (completed) {
    const Icon = branch === "gift" ? Gift : Baby;
    return (
      <section className="py-16 md:py-24"><div className="mx-auto w-full max-w-3xl px-5 sm:px-6"><div className="rounded-[2rem] border border-brand/30 bg-surface p-7 shadow-sm sm:p-10"><span className="flex size-12 items-center justify-center rounded-full bg-brand text-white"><Icon aria-hidden="true" className="size-6" /></span><p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">{branch === "gift" ? "Recomandare pentru cadou" : "Recomandare pentru copil"}</p><h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Am găsit cărțile potrivite răspunsurilor tale.</h1><p className="mt-6 text-lg leading-8 text-muted">Deschide recomandarea pentru a vedea cartea recomandată și motivele alegerii.</p><div className="mt-8 flex flex-wrap gap-3"><button type="button" onClick={() => void openResult()} disabled={busy} className="inline-flex min-h-11 items-center rounded-full bg-brand px-6 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-60">Vezi recomandarea <ArrowRight aria-hidden="true" className="ms-2 size-4" /></button><button type="button" onClick={onChangeBranch} disabled={busy} className="inline-flex min-h-11 items-center rounded-full border border-border px-6 text-sm font-bold hover:border-brand disabled:opacity-60"><RotateCcw aria-hidden="true" className="me-2 size-4" />Alege alt context</button></div>{error ? <p role="alert" className="mt-5 text-sm font-semibold text-danger">{error}</p> : null}</div></div></section>
    );
  }

  return (
    <section className="py-12 md:py-20">
      <div className="mx-auto w-full max-w-3xl px-5 sm:px-6">
        <div aria-label={`Pasul ${stepIndex + 1} din ${steps.length}`}>
          <div className="flex items-center justify-between gap-4 text-sm font-bold"><span>Pasul {stepIndex + 1} din {steps.length}</span><button type="button" onClick={onChangeBranch} disabled={busy} className="text-muted underline decoration-border underline-offset-4 hover:text-foreground disabled:opacity-50">{branch === "gift" ? "Cadou" : "Pentru un copil"} · schimbă</button></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-border"><div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} /></div>
        </div>

        <div key={step} className="mt-10 animate-[quiz-step_180ms_ease-out]" aria-live="polite">
          {step === "gift_relationship" ? <SingleStep eyebrow="Contextul cadoului" title="Pentru cine este cartea?" description="Relația ne ajută să calibrăm cât de personală poate fi alegerea." values={giftRelationshipValues} labels={relationshipLabels} selected={answers.giftRelationship} onSelect={(value) => setAnswer({ giftRelationship: value })} /> : null}
          {step === "gift_age" ? <SingleStep eyebrow="Vârsta cititorului" title="Ce vârstă aproximativă are persoana?" description="Așa evităm cărțile nepotrivite categoriei de vârstă." values={giftAgeValues} labels={giftAgeLabels} selected={answers.giftAge} onSelect={(value) => setAnswer({ giftAge: value })} /> : null}
          {step === "gift_occasion" ? <SingleStep eyebrow="Ocazie" title="Cu ce ocazie oferi cartea?" description="Ocazia ne ajută să alegem o carte cu tonul potrivit." values={giftOccasionValues} labels={occasionLabels} selected={answers.giftOccasion} onSelect={(value) => setAnswer({ giftOccasion: value })} /> : null}
          {step === "gift_interests" ? <InterestStep title="Ce subiecte sau genuri îi plac?" selected={selectedInterests} genres={genres} onToggle={toggleInterest} /> : null}
          {step === "gift_reading_habit" ? <SingleStep eyebrow="Obicei de lectură" title="Cât de des citește?" description="Acest răspuns calibrează ritmul și lungimea, nu calitatea cărții." values={giftReadingHabitValues} labels={habitLabels} selected={answers.giftReadingHabit} onSelect={(value) => setAnswer({ giftReadingHabit: value })} /> : null}
          {step === "gift_style" ? <SingleStep eyebrow="Nivel de risc" title="Cât de sigură să fie alegerea?" description="O alegere sigură evită conținutul greu; una surprinzătoare acceptă o experiență mai neobișnuită." values={giftStyleValues} labels={giftStyleLabels} selected={answers.giftStyle} onSelect={(value) => setAnswer({ giftStyle: value })} /> : null}

          {step === "child_age" ? <SingleStep eyebrow="Vârsta copilului" title="Ce vârstă are copilul?" description="Vom afișa numai cărți potrivite categoriei de vârstă." values={childAgeValues} labels={childAgeLabels} selected={answers.childAge} onSelect={(value) => setAnswer({ childAge: value })} /> : null}
          {step === "child_reading_level" ? <SingleStep eyebrow="Nivel de lectură" title="Cum citește acum?" description="Nivelul ajustează complexitatea și lungimea potrivită." values={childReadingLevelValues} labels={levelLabels} selected={answers.childReadingLevel} onSelect={(value) => setAnswer({ childReadingLevel: value })} /> : null}
          {step === "child_reading_mode" ? <SingleStep eyebrow="Mod de lectură" title="Cum va fi citită cartea?" description="Lectura împreună permite alte alegeri decât lectura complet independentă." values={childReadingModeValues} labels={modeLabels} selected={answers.childReadingMode} onSelect={(value) => setAnswer({ childReadingMode: value })} /> : null}
          {step === "child_interests" ? <InterestStep title="Ce îi stârnește interesul?" selected={selectedInterests} genres={genres} onToggle={toggleInterest} /> : null}
          {step === "child_goal" ? <SingleStep eyebrow="Scopul lecturii" title="Ce ai vrea să-i ofere cartea?" description="Răspunsul ne ajută să alegem o carte potrivită copilului." values={childGoalValues} labels={goalLabels} selected={answers.childGoal} onSelect={(value) => setAnswer({ childGoal: value })} /> : null}
          {step === "child_sensitivities" ? <><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Ce vrei să eviți</p><h1 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">Ce ar trebui evitat?</h1><p className="mt-4 leading-7 text-muted">Poți alege mai multe. Vom ține cont și de vârsta copilului.</p><div className="mt-8 grid gap-3 sm:grid-cols-2">{childSensitivityValues.map((value) => <Choice key={value} selected={answers.childSensitivities?.includes(value) ?? false} title={sensitivityLabels[value][0]} text={sensitivityLabels[value][1]} onClick={() => toggleSensitivity(value)} />)}</div></> : null}
        </div>

        {error ? <p role="alert" className="mt-6 rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm font-semibold text-danger">{error}</p> : null}
        <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={() => setStepIndex((current) => Math.max(0, current - 1))} disabled={stepIndex === 0 || busy} className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-bold hover:border-brand disabled:opacity-40"><ChevronLeft aria-hidden="true" className="me-2 size-4" />Înapoi</button><button type="button" onClick={() => void continueFlow()} disabled={!canContinue || busy} className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-6 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-50">{busy ? "Se salvează…" : stepIndex === steps.length - 1 ? "Pregătește recomandarea" : "Continuă"}<ArrowRight aria-hidden="true" className="ms-2 size-4" /></button></div>
        <p className="mt-6 flex items-start justify-center gap-2 text-center text-xs leading-5 text-muted"><ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />Răspunsurile sunt folosite numai pentru recomandarea cerută.</p>
      </div>
    </section>
  );
}

function SingleStep<const T extends string>({ eyebrow, title, description, values, labels, selected, onSelect }: { eyebrow: string; title: string; description: string; values: readonly T[]; labels: Record<T, readonly [string, string]>; selected?: T; onSelect: (value: T) => void }) {
  return <><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">{eyebrow}</p><h1 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">{title}</h1><p className="mt-4 leading-7 text-muted">{description}</p><div className="mt-8 grid gap-3 sm:grid-cols-2">{values.map((value) => <Choice key={value} selected={selected === value} title={labels[value][0]} text={labels[value][1]} onClick={() => onSelect(value)} />)}</div></>;
}

function InterestStep({ title, selected, genres, onToggle }: { title: string; selected: string[]; genres: GenreOption[]; onToggle: (id: string) => void }) {
  return <><p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Interese</p><h1 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">{title}</h1><p className="mt-4 leading-7 text-muted">Poți alege maximum trei sau „Nu știu”.</p><div className="mt-8 grid gap-3 sm:grid-cols-2"><Choice selected={selected.includes("any")} title="Nu știu" text="Lăsăm celelalte răspunsuri să decidă." onClick={() => onToggle("any")} />{genres.map((genre) => <Choice key={genre.id} selected={selected.includes(genre.id)} disabled={!selected.includes(genre.id) && !selected.includes("any") && selected.length >= 3} title={genre.name} onClick={() => onToggle(genre.id)} />)}</div></>;
}
