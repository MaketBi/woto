import { clsx } from "clsx";
import type { JourEtat } from "@/lib/libelles";

// Grille mensuelle en LECTURE SEULE — espace chauffeur et page publique.
// Aucune action, aucun état client : un simple rendu serveur.

const ENTETES = ["L", "M", "M", "J", "V", "S", "D"];

function classesCase(jour: JourEtat, estAujourdhui: boolean): string {
  const base =
    "aspect-square rounded-[9px] flex items-center justify-center text-sm";
  const parEtat = {
    verse: "bg-good-soft font-semibold text-good",
    partiel: "bg-warn-soft font-semibold text-ink",
    non_verse: "bg-crit-soft font-bold text-crit",
    non_du:
      "font-semibold text-ink-3 [background:repeating-linear-gradient(45deg,#eceae5_0_3px,#d3d2cb_3px_6px)]",
    a_venir: "bg-surface border-[1.5px] border-line-2 font-semibold text-ink-2",
  }[jour.etat];
  return clsx(
    base,
    parEtat,
    estAujourdhui && "border-[1.5px] border-brand bg-surface font-bold text-brand"
  );
}

export function CalendrierLecture({
  jours,
  aujourdhui,
}: {
  jours: JourEtat[];
  aujourdhui: string;
}) {
  const premier = jours[0]?.jour;
  const decalage = premier
    ? (new Date(`${premier}T00:00:00`).getDay() + 6) % 7
    : 0;

  return (
    <div className="rounded-[14px] border border-line bg-surface p-3">
      <div className="mb-1.5 grid grid-cols-7 gap-1.5">
        {ENTETES.map((lettre, i) => (
          <div
            key={i}
            className={clsx(
              "text-center text-[11px] font-semibold",
              i === 6 ? "text-ink-4" : "text-ink-3"
            )}
          >
            {lettre}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: decalage }, (_, i) => (
          <div key={`vide-${i}`} />
        ))}
        {jours.map((j) => (
          <div key={j.jour} className={classesCase(j, j.jour === aujourdhui)}>
            {Number(j.jour.slice(8, 10))}
          </div>
        ))}
      </div>
    </div>
  );
}
