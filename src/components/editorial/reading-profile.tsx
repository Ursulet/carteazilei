type Trait = { code: string; name: string; score: number; confidence: number };

const traitLabels: Record<string, [string, string, string]> = {
  pace: ["Lent", "Echilibrat", "Rapid"],
  complexity: ["Accesibilă", "Medie", "Ridicată"],
  emotional_intensity: ["Redusă", "Moderată", "Intensă"],
  world_building: ["Minimal", "Prezent", "Amplu"],
  romance: ["Redus", "Moderat", "Pronunțat"],
  philosophical_depth: ["Lejeră", "Moderată", "Profundă"],
};

function scoreLabel(trait: Trait) {
  const labels = traitLabels[trait.code] ?? ["Redus", "Moderat", "Ridicat"];
  return trait.score <= 33 ? labels[0] : trait.score <= 66 ? labels[1] : labels[2];
}

export function ReadingProfile({ traits }: { traits: Trait[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {traits.map((trait) => {
        const label = scoreLabel(trait);
        return (
          <div key={trait.code}>
            <div className="flex items-baseline justify-between gap-4"><span className="text-sm font-bold">{trait.name}</span><span className="text-sm text-muted">{label}</span></div>
            <div role="meter" aria-label={`${trait.name}: ${label}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={trait.score} aria-valuetext={label} className="mt-2 h-2.5 overflow-hidden rounded-full bg-border"><div className="h-full rounded-full bg-brand" style={{ width: `${trait.score}%` }} /></div>
          </div>
        );
      })}
    </div>
  );
}
