"use client";

const WGER_BASE = "https://wger.de/static/images/muscles";

// Confirmed working URLs (verified 2026-07-07):
// Front silhouette: /muscular_system_front.svg
// Back silhouette:  /muscular_system_back.svg
// Muscle overlays:  /main/muscle-{id}.svg  (redirects from hashed filenames)
// Secondary:        /secondary/muscle-{id}.svg

// Muscles that appear on the FRONT body outline
const FRONT_MUSCLE_IDS = new Set([1, 2, 4, 10, 13, 14]);

// Human-readable names for the pill labels
const MUSCLE_NAMES: Record<number, string> = {
  1: "Biceps", 2: "Shoulders", 4: "Chest", 5: "Triceps",
  6: "Abs", 7: "Calves", 8: "Glutes", 9: "Hamstrings",
  10: "Quads", 11: "Hamstrings", 12: "Lats", 13: "Forearms",
  14: "Upper back",
};

interface MuscleMapProps {
  primaryIds:   number[];
  secondaryIds: number[];
}

/**
 * Renders muscle silhouettes alongside human-readable muscle name pills.
 * Layout: [front/back silhouettes] | [primary pills] [secondary pills]
 *
 * wger SVGs use fill:#fc0000 (red).
 * hue-rotate(120deg) converts red → green on colour wheel.
 */
export default function MuscleMap({ primaryIds, secondaryIds }: MuscleMapProps) {
  if (primaryIds.length === 0 && secondaryIds.length === 0) return null;

  const size = 72;
  const w    = Math.round(size * 0.65);

  const primaryFilter   = "hue-rotate(120deg) saturate(1.5) brightness(0.9)";
  const secondaryFilter = "hue-rotate(120deg) saturate(1.2) brightness(0.95) opacity(0.45)";

  const frontPrimary   = primaryIds.filter(id => FRONT_MUSCLE_IDS.has(id));
  const frontSecondary = secondaryIds.filter(id => FRONT_MUSCLE_IDS.has(id));
  const backPrimary    = primaryIds.filter(id => !FRONT_MUSCLE_IDS.has(id));
  const backSecondary  = secondaryIds.filter(id => !FRONT_MUSCLE_IDS.has(id));
  const showBack       = backPrimary.length > 0 || backSecondary.length > 0;

  const primaryNames   = primaryIds.map(id => MUSCLE_NAMES[id]).filter(Boolean) as string[];
  const secondaryNames = secondaryIds.map(id => MUSCLE_NAMES[id]).filter(Boolean) as string[];

  const baseImgStyle: React.CSSProperties = {
    width: w, height: size, position: "absolute", inset: 0,
  };

  return (
    <div className="flex items-center gap-4">
      {/* Silhouettes — compact pair */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Front */}
        <div className="relative" style={{ width: w, height: size }}>
          <img
            src={`${WGER_BASE}/muscular_system_front.svg`}
            alt="" aria-hidden="true" loading="lazy"
            style={baseImgStyle}
          />
          {frontPrimary.map(id => (
            <img key={`fp-${id}`}
              src={`${WGER_BASE}/main/muscle-${id}.svg`}
              alt="" aria-hidden="true" loading="lazy"
              style={{ ...baseImgStyle, filter: primaryFilter }}
            />
          ))}
          {frontSecondary.map(id => (
            <img key={`fs-${id}`}
              src={`${WGER_BASE}/secondary/muscle-${id}.svg`}
              alt="" aria-hidden="true" loading="lazy"
              style={{ ...baseImgStyle, filter: secondaryFilter }}
            />
          ))}
        </div>

        {/* Back — only when back muscles are targeted */}
        {showBack && (
          <div className="relative" style={{ width: w, height: size }}>
            <img
              src={`${WGER_BASE}/muscular_system_back.svg`}
              alt="" aria-hidden="true" loading="lazy"
              style={baseImgStyle}
            />
            {backPrimary.map(id => (
              <img key={`bp-${id}`}
                src={`${WGER_BASE}/main/muscle-${id}.svg`}
                alt="" aria-hidden="true" loading="lazy"
                style={{ ...baseImgStyle, filter: primaryFilter }}
              />
            ))}
            {backSecondary.map(id => (
              <img key={`bs-${id}`}
                src={`${WGER_BASE}/secondary/muscle-${id}.svg`}
                alt="" aria-hidden="true" loading="lazy"
                style={{ ...baseImgStyle, filter: secondaryFilter }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Muscle name pills — fills remaining horizontal space */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {primaryNames.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {primaryNames.map(name => (
              <span
                key={name}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full
                           bg-primary/15 text-primary border border-primary/25"
              >
                {name}
              </span>
            ))}
          </div>
        )}
        {secondaryNames.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {secondaryNames.map(name => (
              <span
                key={name}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full
                           bg-[#1A1A1A] text-muted-foreground/60 border border-[#2A2A2A]"
              >
                {name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Screen-reader accessible summary */}
      <span className="sr-only">
        Primary muscles: {primaryNames.join(", ") || "none"}.
        Secondary muscles: {secondaryNames.join(", ") || "none"}.
      </span>
    </div>
  );
}

/** Parse semicolon-separated muscle ID string from the DB. */
export function parseMuscleIds(raw: string | null | undefined): number[] {
  if (!raw) return [];
  return raw.split(";").map(Number).filter(n => !isNaN(n) && n > 0);
}
