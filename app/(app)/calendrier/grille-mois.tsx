"use client";

import { useState } from "react";
import { clsx } from "clsx";
import {
  CLASSES_ETAT_JOUR,
  CLASSE_AUJOURDHUI,
  type JourEtat,
} from "@/lib/libelles";
import { FeuilleJour } from "./feuille-jour";

function classesCase(jour: JourEtat, estAujourdhui: boolean): string {
  return clsx(
    "aspect-square rounded-full flex items-center justify-center text-[13px]",
    estAujourdhui ? CLASSE_AUJOURDHUI : CLASSES_ETAT_JOUR[jour.etat]
  );
}

export function GrilleMois({
  jours,
  aujourdhui,
  contratId,
  dernierMode,
}: {
  jours: JourEtat[];
  aujourdhui: string;
  contratId: string;
  dernierMode: string;
}) {
  const [jourOuvert, setJourOuvert] = useState<JourEtat | null>(null);

  // Décalage du 1er du mois : lundi en première colonne.
  const premier = jours[0]?.jour;
  const decalage = premier
    ? (new Date(`${premier}T00:00:00`).getDay() + 6) % 7
    : 0;

  return (
    <>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: decalage }, (_, i) => (
          <div key={`vide-${i}`} />
        ))}
        {jours.map((j) => (
          <button
            key={j.jour}
            type="button"
            onClick={() => setJourOuvert(j)}
            aria-label={`Jour ${Number(j.jour.slice(8, 10))}`}
            className={classesCase(j, j.jour === aujourdhui)}
          >
            {Number(j.jour.slice(8, 10))}
          </button>
        ))}
      </div>

      <FeuilleJour
        jour={jourOuvert}
        onFermer={() => setJourOuvert(null)}
        contratId={contratId}
        dernierMode={dernierMode}
      />
    </>
  );
}
