import Link from "next/link";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { clsx } from "clsx";
import type { InspectionResume, InspectionDetail } from "@/lib/data";
import { nombre } from "@/lib/format";

// Galerie des contrôles passés + fiche détail — partagées admin / chauffeur.

const LIBELLES_ANGLE: Record<string, string> = {
  avant: "Avant",
  arriere: "Arrière",
  gauche: "Côté gauche",
  droite: "Côté droit",
  interieur: "Intérieur",
  tableau_bord: "Tableau de bord",
  autre: "Autre",
};

export function ListeInspections({
  inspections,
  hrefBase,
}: {
  inspections: InspectionResume[];
  hrefBase: string;
}) {
  if (inspections.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line-2 bg-surface px-4 py-[26px] text-center">
        <div className="text-sm font-semibold text-ink-2">
          Aucun contrôle pour l&apos;instant
        </div>
        <div className="mt-1 text-[13px] leading-[1.4] text-ink-3">
          Le premier contrôle photo du véhicule apparaîtra ici.
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[18px] bg-surface">
      {inspections.map((i, idx) => (
        <Link
          key={i.id}
          href={`${hrefBase}/${i.id}`}
          className={clsx(
            "flex min-h-[56px] items-center justify-between px-3.5 py-3",
            idx < inspections.length - 1 && "border-b border-line-soft"
          )}
        >
          <div>
            <div className="text-sm font-semibold">
              {format(parseISO(i.date), "EEEE d MMMM yyyy", { locale: fr })}
            </div>
            <div className="mt-0.5 text-xs text-ink-3">
              {i.nbPhotos} photo{i.nbPhotos > 1 ? "s" : ""}
              {i.km ? ` · ${nombre(i.km)} km` : ""}
              {i.etat_general ? ` · état ${i.etat_general}/5` : ""}
            </div>
          </div>
          <span className="text-[15px] font-semibold text-ink-4">›</span>
        </Link>
      ))}
    </div>
  );
}

export function FicheInspection({ inspection }: { inspection: InspectionDetail }) {
  return (
    <>
      <div className="rounded-[18px] bg-surface p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] font-medium text-ink-2">Kilométrage</span>
          <span className="text-sm font-semibold tabular-nums">
            {inspection.km ? `${nombre(inspection.km)} km` : "—"}
          </span>
        </div>
        <div className="mt-2.5 flex items-baseline justify-between">
          <span className="text-[13px] font-medium text-ink-2">État général</span>
          <span className="text-sm font-semibold">
            {inspection.etat_general ? `${inspection.etat_general} / 5` : "—"}
          </span>
        </div>
        {inspection.commentaire && (
          <p className="mt-2.5 border-t border-line-soft pt-2.5 text-[13px] leading-[1.4] text-ink-2">
            {inspection.commentaire}
          </p>
        )}
      </div>

      {inspection.photos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-2 bg-surface p-6 text-center text-[13px] text-ink-3">
          Contrôle sans photo (interrompu avant la première prise).
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {inspection.photos.map((p) => (
            <figure key={p.chemin} className="overflow-hidden rounded-[18px] bg-surface">
              {p.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.url}
                  alt={LIBELLES_ANGLE[p.angle] ?? p.angle}
                  className="aspect-[4/3] w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="aspect-[4/3] w-full hachures-photo" />
              )}
              <figcaption className="px-2.5 py-1.5 text-[11px] font-semibold text-ink-2">
                {LIBELLES_ANGLE[p.angle] ?? p.angle}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </>
  );
}
