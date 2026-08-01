import { clsx } from "clsx";
import {
  CLASSES_ETAT_JOUR,
  CLASSE_AUJOURDHUI,
  type JourEtat,
} from "@/lib/libelles";

// Grille mensuelle en LECTURE SEULE — espace chauffeur et page publique.
// Aucune action, aucun état client : un simple rendu serveur.

const ENTETES = ["L", "M", "M", "J", "V", "S", "D"];

function classesCase(jour: JourEtat, estAujourdhui: boolean): string {
  return clsx(
    "aspect-square rounded-full flex items-center justify-center text-[13px]",
    estAujourdhui ? CLASSE_AUJOURDHUI : CLASSES_ETAT_JOUR[jour.etat]
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
    <div className="rounded-[22px] bg-surface px-3.5 py-4">
      <div className="mb-2 grid grid-cols-7 gap-1.5">
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
