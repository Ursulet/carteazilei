type Trait = { code: string; name: string; score: number; confidence: number };

const traitLabels: Record<string, [string, string, string]> = {
  ambiguity: ["Clar", "Nuanțat", "Ambiguu"],
  complexity: ["Accesibilă", "Medie", "Ridicată"],
  practical_density: ["Conceptuală", "Echilibrată", "Practică"],
  emotional_intensity: ["Redusă", "Moderată", "Intensă"],
  philosophical_depth: ["Lejeră", "Moderată", "Profundă"],
  pace: ["Lent", "Echilibrat", "Rapid"],
  romance: ["Redus", "Moderat", "Pronunțat"],
  humor: ["Sobru", "Echilibrat", "Amuzant"],
  violence: ["Redusă", "Moderată", "Ridicată"],
  world_building: ["Minimal", "Prezent", "Amplu"],
};

function scoreLabel(code: string, score: number) {
  const labels = traitLabels[code] ?? ["Redus", "Moderat", "Ridicat"];
  return score <= 3 ? labels[0] : score <= 6 ? labels[1] : labels[2];
}

export function ReadingProfile({ traits }: { traits: Trait[] }) {
  return (
    <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
      {traits.map((trait) => {
        const score = Math.min(Math.max(trait.score, 0), 10);
        const confidence = Math.min(Math.max(trait.confidence, 0), 100);
        const label = scoreLabel(trait.code, score);
        return (
          <div key={trait.code} className="rounded-xl border border-border/70 bg-paper/55 p-4">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm font-bold">{trait.name}</span>
              <span className="text-sm text-muted">{label} · <strong className="text-foreground">{score}/10</strong></span>
            </div>
            <div
              role="meter"
              aria-label={`${trait.name}: ${label}, scor ${score} din 10`}
              aria-valuemin={0}
              aria-valuemax={10}
              aria-valuenow={score}
              aria-valuetext={`${label}, ${score} din 10`}
              className="mt-3 h-2.5 overflow-hidden rounded-full bg-border"
            >
              <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${score * 10}%` }} />
            </div>
            <p className="mt-2 text-[0.68rem] text-muted">Încredere editorială: {confidence}%</p>
          </div>
        );
      })}
    </div>
  );
}
