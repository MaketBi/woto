"use client";

import { useState } from "react";
import { clsx } from "clsx";
import type { JourEtat } from "@/lib/libelles";
import { FeuilleJour } from "./feuille-jour";

function classesCase(jour: JourEtat, estAujourdhui: boolean): string {
  const base = "aspect-square rounded-[9px] flex items-center justify-center text-sm";
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
    estAujourdhui &&
      "border-[1.5px] border-brand bg-surface font-bold text-brand"
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
        aujourdhui={aujourdhui}
      />
    </>
  );
}
